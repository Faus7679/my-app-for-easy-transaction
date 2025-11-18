const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['fixed', 'percentage', 'tiered'],
        required: true
    },
    amount: Number, // For fixed fees
    percentage: Number, // For percentage fees
    tiers: [{ // For tiered fees
        min: Number,
        max: Number,
        fee: Number,
        percentage: Number
    }]
});

const exchangeRateSchema = new mongoose.Schema({
    rate: {
        type: Number,
        required: true
    },
    margin: {
        type: Number,
        default: 0.02 // 2% margin
    },
    effectiveRate: {
        type: Number,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['api', 'manual', 'calculated'],
        default: 'api'
    }
});

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    reason: String,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
});

const recipientSchema = new mongoose.Schema({
    // Recipient identification
    email: String,
    phoneNumber: String,
    firstName: String,
    lastName: String,
    
    // Payout method
    payoutMethod: {
        type: String,
        enum: ['bank_account', 'mobile_money', 'digital_wallet', 'cash_pickup'],
        required: true
    },
    
    // Bank account details
    bankAccount: {
        accountNumber: String,
        routingNumber: String,
        swiftCode: String,
        bankName: String,
        bankAddress: String
    },
    
    // Mobile money details
    mobileMoney: {
        phoneNumber: String,
        provider: String, // MTN, Vodafone, Airtel, etc.
        network: String
    },
    
    // Digital wallet details
    digitalWallet: {
        walletId: String,
        provider: String, // PayPal, Skrill, etc.
    },
    
    // Cash pickup details
    cashPickup: {
        location: String,
        locationId: String,
        provider: String, // Western Union, MoneyGram, etc.
        referenceNumber: String
    },
    
    // Address information
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: {
            type: String,
            required: true
        }
    }
});

const transactionSchema = new mongoose.Schema({
    // Basic transaction info
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    
    // Parties involved
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: recipientSchema,
    
    // Transaction amounts
    sendAmount: {
        type: Number,
        required: true,
        min: [0.01, 'Send amount must be greater than 0']
    },
    sendCurrency: {
        type: String,
        required: true,
        enum: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF']
    },
    
    receiveAmount: {
        type: Number,
        required: true,
        min: [0.01, 'Receive amount must be greater than 0']
    },
    receiveCurrency: {
        type: String,
        required: true,
        enum: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF']
    },
    
    // Exchange rate information
    exchangeRate: exchangeRateSchema,
    
    // Fees
    fees: {
        transferFee: {
            type: Number,
            required: true,
            default: 0
        },
        exchangeFee: {
            type: Number,
            default: 0
        },
        paymentFee: {
            type: Number,
            default: 0
        },
        totalFees: {
            type: Number,
            required: true
        }
    },
    
    // Total amounts
    totalSendAmount: {
        type: Number,
        required: true // sendAmount + totalFees
    },
    
    // Payment information
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'digital_wallet', 'mobile_money', 'crypto'],
        required: true
    },
    paymentProvider: {
        type: String,
        enum: ['stripe', 'paypal', 'bank', 'mobile_money', 'crypto_gateway'],
        required: true
    },
    paymentId: String, // External payment provider transaction ID
    
    // Transaction status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
        default: 'pending'
    },
    statusHistory: [statusHistorySchema],
    
    // Purpose and description
    purpose: {
        type: String,
        enum: [
            'family_support',
            'education',
            'medical',
            'business',
            'investment',
            'personal',
            'other'
        ],
        default: 'personal'
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    // Compliance and risk
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    complianceChecks: {
        aml: {
            status: {
                type: String,
                enum: ['pending', 'passed', 'failed', 'manual_review'],
                default: 'pending'
            },
            checkedAt: Date,
            details: mongoose.Schema.Types.Mixed
        },
        sanctions: {
            status: {
                type: String,
                enum: ['pending', 'passed', 'failed', 'manual_review'],
                default: 'pending'
            },
            checkedAt: Date,
            details: mongoose.Schema.Types.Mixed
        },
        pep: { // Politically Exposed Person
            status: {
                type: String,
                enum: ['pending', 'passed', 'failed', 'manual_review'],
                default: 'pending'
            },
            checkedAt: Date,
            details: mongoose.Schema.Types.Mixed
        }
    },
    
    // Processing information
    processingInfo: {
        estimatedDelivery: Date,
        actualDelivery: Date,
        payoutMethod: String,
        payoutProvider: String,
        payoutReference: String,
        trackingNumber: String
    },
    
    // Error handling
    errors: [{
        code: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false }
    }],
    
    // Retry information
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    nextRetryAt: Date,
    
    // Webhook tracking
    webhooksSent: [{
        url: String,
        status: String,
        timestamp: Date,
        response: mongoose.Schema.Types.Mixed
    }],
    
    // Metadata
    metadata: {
        userAgent: String,
        ipAddress: String,
        deviceId: String,
        sessionId: String,
        referenceNumber: String,
        externalTransactionId: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance and queries
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ sender: 1, status: 1 });
transactionSchema.index({ 'recipient.email': 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ paymentId: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'processingInfo.trackingNumber': 1 });

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', function(next) {
    if (!this.transactionId) {
        // Generate unique transaction ID: TXN + timestamp + random
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TXN${timestamp}${random}`;
    }
    
    // Calculate total send amount
    this.totalSendAmount = this.sendAmount + this.fees.totalFees;
    
    next();
});

// Pre-save middleware to add status history
transactionSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            reason: this.statusChangeReason || 'Status updated'
        });
        delete this.statusChangeReason; // Clean up temporary field
    }
    next();
});

// Virtual for transaction age
transactionSchema.virtual('ageInHours').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for estimated delivery status
transactionSchema.virtual('isDelayed').get(function() {
    if (!this.processingInfo.estimatedDelivery) return false;
    return Date.now() > this.processingInfo.estimatedDelivery && this.status !== 'completed';
});

// Method to update status with reason
transactionSchema.methods.updateStatus = function(newStatus, reason, updatedBy = null) {
    this.statusChangeReason = reason;
    this.status = newStatus;
    
    if (updatedBy) {
        const lastHistory = this.statusHistory[this.statusHistory.length - 1];
        if (lastHistory) {
            lastHistory.updatedBy = updatedBy;
        }
    }
    
    return this.save();
};

// Method to check if transaction can be cancelled
transactionSchema.methods.canBeCancelled = function() {
    const cancellableStatuses = ['pending', 'processing'];
    return cancellableStatuses.includes(this.status);
};

// Method to check if transaction can be refunded
transactionSchema.methods.canBeRefunded = function() {
    const refundableStatuses = ['completed'];
    const timeLimitHours = 24;
    const hoursSinceCompletion = (Date.now() - this.updatedAt) / (1000 * 60 * 60);
    
    return refundableStatuses.includes(this.status) && hoursSinceCompletion <= timeLimitHours;
};

// Method to calculate fees
transactionSchema.methods.calculateFees = function() {
    // This would implement complex fee calculation logic
    // based on corridors, amounts, payment methods, etc.
    
    let transferFee = 5.00; // Base fee
    let exchangeFee = this.sendAmount * 0.01; // 1% exchange fee
    let paymentFee = 0;
    
    // Payment method specific fees
    if (this.paymentMethod === 'card') {
        paymentFee = this.sendAmount * 0.029 + 0.30; // Stripe-like fees
    }
    
    this.fees.transferFee = transferFee;
    this.fees.exchangeFee = exchangeFee;
    this.fees.paymentFee = paymentFee;
    this.fees.totalFees = transferFee + exchangeFee + paymentFee;
    
    return this.fees;
};

// Method to generate tracking number
transactionSchema.methods.generateTrackingNumber = function() {
    if (!this.processingInfo.trackingNumber) {
        const prefix = 'EM';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.processingInfo.trackingNumber = `${prefix}${timestamp}${random}`;
    }
    return this.processingInfo.trackingNumber;
};

// Static method to find transactions by sender
transactionSchema.statics.findBySender = function(senderId, options = {}) {
    const { status, limit = 20, page = 1 } = options;
    const query = { sender: senderId };
    
    if (status) query.status = status;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('sender', 'firstName lastName email');
};

// Static method to find transactions by recipient
transactionSchema.statics.findByRecipient = function(recipientEmail, options = {}) {
    const { status, limit = 20, page = 1 } = options;
    const query = { 'recipient.email': recipientEmail };
    
    if (status) query.status = status;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('sender', 'firstName lastName email');
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = function(dateRange = {}) {
    const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = dateRange;
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
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
};

module.exports = mongoose.model('Transaction', transactionSchema);