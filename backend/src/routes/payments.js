const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymentService = require('../services/paymentService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create Stripe payment intent
const createPaymentIntent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { transactionId, paymentMethodId } = req.body;
        const user = req.user;
        
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        // Verify transaction belongs to user
        if (transaction.sender.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // Process payment
        const result = await paymentService.processStripePayment({
            transactionId: transaction._id,
            amount: transaction.totalSendAmount,
            currency: transaction.sendCurrency,
            paymentMethodId,
            userId: user._id
        });
        
        if (result.success) {
            // Emit real-time update
            if (req.io) {
                req.io.to(`user_${user._id}`).emit('transactionUpdated', {
                    transactionId: transaction._id,
                    status: 'processing',
                    paymentId: result.paymentId
                });
            }
            
            res.json({
                success: true,
                data: {
                    paymentId: result.paymentId,
                    status: result.status,
                    clientSecret: result.clientSecret
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                code: result.code
            });
        }
        
    } catch (error) {
        logger.error('Create payment intent error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment intent'
        });
    }
};

// Create PayPal payment
const createPayPalPayment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { transactionId } = req.body;
        const user = req.user;
        
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        // Verify transaction belongs to user
        if (transaction.sender.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        const returnUrl = `${process.env.FRONTEND_URL}/payment/paypal/success`;
        const cancelUrl = `${process.env.FRONTEND_URL}/payment/paypal/cancel`;
        
        const result = await paymentService.processPayPalPayment({
            transactionId: transaction._id,
            amount: transaction.totalSendAmount,
            currency: transaction.sendCurrency,
            returnUrl,
            cancelUrl
        });
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    paymentId: result.paymentId,
                    approvalUrl: result.approvalUrl
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        logger.error('Create PayPal payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create PayPal payment'
        });
    }
};

// Execute PayPal payment
const executePayPalPayment = async (req, res) => {
    try {
        const { paymentId, PayerID } = req.query;
        
        if (!paymentId || !PayerID) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID and Payer ID are required'
            });
        }
        
        const result = await paymentService.executePayPalPayment({
            paymentId,
            payerId: PayerID
        });
        
        if (result.success) {
            // Find transaction and emit update
            const transaction = await Transaction.findOne({ paymentId });
            if (transaction && req.io) {
                req.io.to(`user_${transaction.sender}`).emit('transactionUpdated', {
                    transactionId: transaction._id,
                    status: 'processing',
                    paymentId: result.paymentId
                });
            }
            
            res.json({
                success: true,
                data: {
                    paymentId: result.paymentId,
                    status: result.status
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        logger.error('Execute PayPal payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute PayPal payment'
        });
    }
};

// Add payment method
const addPaymentMethod = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { paymentMethodId } = req.body;
        const user = req.user;
        
        const result = await paymentService.addStripePaymentMethod({
            userId: user._id,
            paymentMethodId
        });
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Payment method added successfully',
                data: {
                    paymentMethod: result.paymentMethod
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        logger.error('Add payment method error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add payment method'
        });
    }
};

// Get user's payment methods
const getPaymentMethods = async (req, res) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            data: {
                paymentMethods: user.paymentMethods
            }
        });
        
    } catch (error) {
        logger.error('Get payment methods error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve payment methods'
        });
    }
};

// Remove payment method
const removePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        const user = req.user;
        
        // Remove from Stripe if it's a Stripe payment method
        const paymentMethod = user.paymentMethods.id(paymentMethodId);
        
        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                error: 'Payment method not found'
            });
        }
        
        if (paymentMethod.stripePaymentMethodId) {
            try {
                await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
            } catch (stripeError) {
                logger.error('Failed to detach Stripe payment method:', stripeError);
            }
        }
        
        // Remove from user
        user.paymentMethods.pull(paymentMethodId);
        await user.save();
        
        res.json({
            success: true,
            message: 'Payment method removed successfully'
        });
        
    } catch (error) {
        logger.error('Remove payment method error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove payment method'
        });
    }
};

// Stripe webhook endpoint
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        logger.error('Stripe webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            
            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;
            
            case 'payment_intent.canceled':
                await handlePaymentIntentCanceled(event.data.object);
                break;
            
            default:
                logger.info(`Unhandled Stripe event type: ${event.type}`);
        }
        
        res.json({ received: true });
        
    } catch (error) {
        logger.error('Stripe webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// Handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent) => {
    try {
        const transactionId = paymentIntent.metadata.transactionId;
        const transaction = await Transaction.findById(transactionId);
        
        if (transaction) {
            await transaction.updateStatus('completed', 'Payment completed successfully');
            
            logger.info(`Payment completed for transaction: ${transaction.transactionId}`);
            
            // Emit real-time update
            // Note: In production, you'd need to get the io instance differently
            // req.io.to(`user_${transaction.sender}`).emit('transactionUpdated', {
            //     transactionId: transaction._id,
            //     status: 'completed'
            // });
        }
        
    } catch (error) {
        logger.error('Handle payment intent succeeded error:', error);
    }
};

// Handle failed payment intent
const handlePaymentIntentFailed = async (paymentIntent) => {
    try {
        const transactionId = paymentIntent.metadata.transactionId;
        const transaction = await Transaction.findById(transactionId);
        
        if (transaction) {
            await transaction.updateStatus('failed', 'Payment failed');
            
            // Refund user's balance
            const user = await User.findById(transaction.sender);
            user.balance += transaction.totalSendAmount;
            await user.save();
            
            logger.info(`Payment failed for transaction: ${transaction.transactionId}`);
        }
        
    } catch (error) {
        logger.error('Handle payment intent failed error:', error);
    }
};

// Handle canceled payment intent
const handlePaymentIntentCanceled = async (paymentIntent) => {
    try {
        const transactionId = paymentIntent.metadata.transactionId;
        const transaction = await Transaction.findById(transactionId);
        
        if (transaction) {
            await transaction.updateStatus('cancelled', 'Payment cancelled');
            
            // Refund user's balance
            const user = await User.findById(transaction.sender);
            user.balance += transaction.totalSendAmount;
            await user.save();
            
            logger.info(`Payment cancelled for transaction: ${transaction.transactionId}`);
        }
        
    } catch (error) {
        logger.error('Handle payment intent canceled error:', error);
    }
};

// Validation rules
const createPaymentIntentValidation = [
    body('transactionId')
        .isMongoId()
        .withMessage('Valid transaction ID is required'),
    
    body('paymentMethodId')
        .notEmpty()
        .withMessage('Payment method ID is required')
];

const createPayPalPaymentValidation = [
    body('transactionId')
        .isMongoId()
        .withMessage('Valid transaction ID is required')
];

const addPaymentMethodValidation = [
    body('paymentMethodId')
        .notEmpty()
        .withMessage('Payment method ID is required')
];

// Routes
router.post('/stripe/payment-intent', authenticate, createPaymentIntentValidation, createPaymentIntent);
router.post('/paypal/create', authenticate, createPayPalPaymentValidation, createPayPalPayment);
router.get('/paypal/execute', executePayPalPayment);

router.post('/methods', authenticate, addPaymentMethodValidation, addPaymentMethod);
router.get('/methods', authenticate, getPaymentMethods);
router.delete('/methods/:paymentMethodId', authenticate, removePaymentMethod);

// Webhook endpoint (raw body needed for signature verification)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;