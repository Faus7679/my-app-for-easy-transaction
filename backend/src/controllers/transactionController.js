const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CurrencyPair = require('../models/CurrencyPair');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const currencyService = require('../services/currencyService');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const queueService = require('../services/queueService');

// Create new transaction
const createTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const user = req.user;
        const {
            recipient,
            sendAmount,
            sendCurrency,
            receiveCurrency,
            paymentMethod,
            paymentProvider,
            purpose,
            description
        } = req.body;
        
        // Check if user can make transaction
        if (!user.canMakeTransaction(sendAmount)) {
            return res.status(403).json({
                success: false,
                error: 'Transaction not allowed. Check account status and balance.'
            });
        }
        
        // Get current exchange rate
        const currencyPair = await CurrencyPair.getOrCreatePair(sendCurrency, receiveCurrency);
        const exchangeRate = currencyPair.getRateForAmount(sendAmount);
        const receiveAmount = sendAmount * exchangeRate;
        
        // Create transaction object
        const transaction = new Transaction({
            sender: user._id,
            recipient: {
                email: recipient.email,
                phoneNumber: recipient.phoneNumber,
                firstName: recipient.firstName,
                lastName: recipient.lastName,
                payoutMethod: recipient.payoutMethod,
                bankAccount: recipient.bankAccount,
                mobileMoney: recipient.mobileMoney,
                digitalWallet: recipient.digitalWallet,
                cashPickup: recipient.cashPickup,
                address: recipient.address
            },
            sendAmount,
            sendCurrency,
            receiveAmount,
            receiveCurrency,
            exchangeRate: {
                rate: currencyPair.currentRate,
                margin: currencyPair.margin,
                effectiveRate: exchangeRate,
                lastUpdated: currencyPair.lastUpdated,
                source: currencyPair.source
            },
            paymentMethod,
            paymentProvider,
            purpose,
            description,
            metadata: {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                sessionId: req.sessionID
            }
        });
        
        // Calculate fees
        transaction.calculateFees();
        
        // Check if user has sufficient balance (including fees)
        if (user.balance < transaction.totalSendAmount) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance to cover transaction amount and fees',
                details: {
                    requiredAmount: transaction.totalSendAmount,
                    currentBalance: user.balance,
                    shortfall: transaction.totalSendAmount - user.balance
                }
            });
        }
        
        // Generate tracking number
        transaction.generateTrackingNumber();
        
        // Set estimated delivery time (24-48 hours for most corridors)
        const estimatedHours = getEstimatedDeliveryHours(sendCurrency, receiveCurrency, recipient.payoutMethod);
        transaction.processingInfo.estimatedDelivery = new Date(Date.now() + estimatedHours * 60 * 60 * 1000);
        
        // Save transaction
        await transaction.save();
        
        // Update user balance (hold the funds)
        user.balance -= transaction.totalSendAmount;
        user.transactions.push(transaction._id);
        await user.save();
        
        // Process payment asynchronously
        queueService.addPaymentProcessingJob({
            transactionId: transaction._id,
            userId: user._id,
            paymentMethod,
            paymentProvider,
            amount: transaction.totalSendAmount,
            currency: sendCurrency
        });
        
        // Send confirmation email
        try {
            await emailService.sendTransactionConfirmation(user.email, transaction, user.firstName);
        } catch (emailError) {
            logger.error('Failed to send transaction confirmation email:', emailError);
        }
        
        // Emit real-time update
        if (req.io) {
            req.io.to(`user_${user._id}`).emit('transactionCreated', {
                transactionId: transaction._id,
                status: transaction.status,
                trackingNumber: transaction.processingInfo.trackingNumber
            });
        }
        
        logger.info(`Transaction created: ${transaction.transactionId} by user ${user.email}`);
        
        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: {
                transaction: {
                    id: transaction._id,
                    transactionId: transaction.transactionId,
                    trackingNumber: transaction.processingInfo.trackingNumber,
                    status: transaction.status,
                    sendAmount: transaction.sendAmount,
                    sendCurrency: transaction.sendCurrency,
                    receiveAmount: transaction.receiveAmount,
                    receiveCurrency: transaction.receiveCurrency,
                    exchangeRate: transaction.exchangeRate.effectiveRate,
                    fees: transaction.fees,
                    totalSendAmount: transaction.totalSendAmount,
                    recipient: transaction.recipient,
                    estimatedDelivery: transaction.processingInfo.estimatedDelivery,
                    createdAt: transaction.createdAt
                }
            }
        });
        
    } catch (error) {
        logger.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create transaction'
        });
    }
};

// Get user's transactions
const getUserTransactions = async (req, res) => {
    try {
        const user = req.user;
        const { 
            status, 
            page = 1, 
            limit = 20, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            fromDate,
            toDate
        } = req.query;
        
        const query = { sender: user._id };
        
        // Add status filter
        if (status) {
            query.status = status;
        }
        
        // Add date range filter
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [transactions, totalCount] = await Promise.all([
            Transaction.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-metadata -errors -webhooksSent')
                .lean(),
            Transaction.countDocuments(query)
        ]);
        
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        
        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
        
    } catch (error) {
        logger.error('Get user transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve transactions'
        });
    }
};

// Get specific transaction
const getTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const user = req.user;
        
        const transaction = await Transaction.findOne({
            $or: [
                { _id: transactionId },
                { transactionId: transactionId },
                { 'processingInfo.trackingNumber': transactionId }
            ]
        }).populate('sender', 'firstName lastName email');
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        // Check if user has permission to view this transaction
        const isOwner = transaction.sender._id.toString() === user._id.toString();
        const isRecipient = transaction.recipient.email === user.email;
        const isAdmin = ['admin', 'super_admin'].includes(user.role);
        
        if (!isOwner && !isRecipient && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only view your own transactions.'
            });
        }
        
        res.json({
            success: true,
            data: {
                transaction
            }
        });
        
    } catch (error) {
        logger.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve transaction'
        });
    }
};

// Cancel transaction
const cancelTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const user = req.user;
        const { reason } = req.body;
        
        const transaction = await Transaction.findOne({
            $or: [
                { _id: transactionId },
                { transactionId: transactionId }
            ],
            sender: user._id
        });
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        if (!transaction.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                error: 'Transaction cannot be cancelled in its current status',
                currentStatus: transaction.status
            });
        }
        
        // Update transaction status
        await transaction.updateStatus('cancelled', reason || 'Cancelled by user', user._id);
        
        // Refund user's balance
        user.balance += transaction.totalSendAmount;
        await user.save();
        
        // Process refund if payment was already processed
        if (transaction.paymentId) {
            queueService.addRefundProcessingJob({
                transactionId: transaction._id,
                paymentId: transaction.paymentId,
                amount: transaction.totalSendAmount,
                reason: 'Transaction cancelled by user'
            });
        }
        
        // Send cancellation email
        try {
            await emailService.sendTransactionCancellation(user.email, transaction, user.firstName);
        } catch (emailError) {
            logger.error('Failed to send cancellation email:', emailError);
        }
        
        // Emit real-time update
        if (req.io) {
            req.io.to(`user_${user._id}`).emit('transactionUpdated', {
                transactionId: transaction._id,
                status: 'cancelled'
            });
        }
        
        logger.info(`Transaction cancelled: ${transaction.transactionId} by user ${user.email}`);
        
        res.json({
            success: true,
            message: 'Transaction cancelled successfully',
            data: {
                transaction: {
                    id: transaction._id,
                    transactionId: transaction.transactionId,
                    status: transaction.status,
                    refundAmount: transaction.totalSendAmount
                }
            }
        });
        
    } catch (error) {
        logger.error('Cancel transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel transaction'
        });
    }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
    try {
        const user = req.user;
        const { period = '30d' } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        const stats = await Transaction.aggregate([
            {
                $match: {
                    sender: user._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$sendAmount' },
                    totalFees: { $sum: '$fees.totalFees' }
                }
            }
        ]);
        
        // Get total counts
        const totalStats = await Transaction.aggregate([
            {
                $match: {
                    sender: user._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalAmountSent: { $sum: '$sendAmount' },
                    totalFeesSpent: { $sum: '$fees.totalFees' },
                    avgTransactionAmount: { $avg: '$sendAmount' }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                period,
                statusBreakdown: stats,
                summary: totalStats[0] || {
                    totalTransactions: 0,
                    totalAmountSent: 0,
                    totalFeesSpent: 0,
                    avgTransactionAmount: 0
                }
            }
        });
        
    } catch (error) {
        logger.error('Get transaction stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve transaction statistics'
        });
    }
};

// Track transaction by tracking number (public endpoint)
const trackTransaction = async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        
        const transaction = await Transaction.findOne({
            'processingInfo.trackingNumber': trackingNumber
        }).select('transactionId status sendAmount sendCurrency receiveAmount receiveCurrency processingInfo statusHistory createdAt');
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found with the provided tracking number'
            });
        }
        
        res.json({
            success: true,
            data: {
                transactionId: transaction.transactionId,
                trackingNumber: transaction.processingInfo.trackingNumber,
                status: transaction.status,
                sendAmount: transaction.sendAmount,
                sendCurrency: transaction.sendCurrency,
                receiveAmount: transaction.receiveAmount,
                receiveCurrency: transaction.receiveCurrency,
                estimatedDelivery: transaction.processingInfo.estimatedDelivery,
                actualDelivery: transaction.processingInfo.actualDelivery,
                statusHistory: transaction.statusHistory,
                createdAt: transaction.createdAt
            }
        });
        
    } catch (error) {
        logger.error('Track transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track transaction'
        });
    }
};

// Helper function to estimate delivery hours
const getEstimatedDeliveryHours = (fromCurrency, toCurrency, payoutMethod) => {
    // Basic estimation logic - can be made more sophisticated
    let baseHours = 24; // Default 24 hours
    
    // Different payout methods have different processing times
    switch (payoutMethod) {
        case 'bank_account':
            baseHours = 24; // 1 day for bank transfers
            break;
        case 'mobile_money':
            baseHours = 2; // 2 hours for mobile money
            break;
        case 'digital_wallet':
            baseHours = 1; // 1 hour for digital wallets
            break;
        case 'cash_pickup':
            baseHours = 4; // 4 hours for cash pickup
            break;
        default:
            baseHours = 24;
    }
    
    // Add extra time for international transfers
    const majorCurrencies = ['USD', 'EUR', 'GBP'];
    if (!majorCurrencies.includes(fromCurrency) || !majorCurrencies.includes(toCurrency)) {
        baseHours += 12; // Add 12 hours for non-major currency pairs
    }
    
    return baseHours;
};

// Validation rules
const createTransactionValidation = [
    body('recipient.email')
        .isEmail()
        .withMessage('Valid recipient email is required')
        .normalizeEmail(),
    
    body('recipient.firstName')
        .notEmpty()
        .withMessage('Recipient first name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Recipient first name must be between 2 and 50 characters'),
    
    body('recipient.lastName')
        .notEmpty()
        .withMessage('Recipient last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Recipient last name must be between 2 and 50 characters'),
    
    body('recipient.payoutMethod')
        .isIn(['bank_account', 'mobile_money', 'digital_wallet', 'cash_pickup'])
        .withMessage('Valid payout method is required'),
    
    body('sendAmount')
        .isFloat({ min: 1, max: 50000 })
        .withMessage('Send amount must be between 1 and 50,000'),
    
    body('sendCurrency')
        .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'])
        .withMessage('Valid send currency is required'),
    
    body('receiveCurrency')
        .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'])
        .withMessage('Valid receive currency is required'),
    
    body('paymentMethod')
        .isIn(['card', 'bank_transfer', 'digital_wallet', 'mobile_money'])
        .withMessage('Valid payment method is required'),
    
    body('paymentProvider')
        .isIn(['stripe', 'paypal', 'bank', 'mobile_money'])
        .withMessage('Valid payment provider is required'),
    
    body('purpose')
        .optional()
        .isIn(['family_support', 'education', 'medical', 'business', 'investment', 'personal', 'other'])
        .withMessage('Valid purpose is required'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
];

const cancelTransactionValidation = [
    body('reason')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Cancellation reason cannot exceed 200 characters')
];

module.exports = {
    createTransaction,
    getUserTransactions,
    getTransaction,
    cancelTransaction,
    getTransactionStats,
    trackTransaction,
    createTransactionValidation,
    cancelTransactionValidation
};