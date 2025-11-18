const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const paymentMethodSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['card', 'bank_account', 'digital_wallet', 'mobile_money'],
        required: true
    },
    provider: {
        type: String,
        enum: ['stripe', 'paypal', 'bank_transfer', 'mobile_money'],
        required: true
    },
    details: {
        // For cards
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number,
        
        // For bank accounts
        accountNumber: String,
        routingNumber: String,
        bankName: String,
        
        // For digital wallets
        walletId: String,
        walletProvider: String,
        
        // For mobile money
        phoneNumber: String,
        mobileProvider: String
    },
    stripePaymentMethodId: String,
    paypalPaymentMethodId: String,
    isDefault: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const twoFactorSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false
    },
    secret: String,
    backupCodes: [String],
    lastUsed: Date
});

const securitySchema = new mongoose.Schema({
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    twoFactor: twoFactorSchema,
    lastLogin: Date,
    lastLoginIP: String,
    loginHistory: [{
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        success: Boolean,
        location: {
            country: String,
            city: String,
            region: String
        }
    }]
});

const preferencesSchema = new mongoose.Schema({
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP']
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'fr', 'es', 'pt', 'ar']
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    notifications: {
        email: {
            transactionUpdates: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false }
        },
        push: {
            transactionUpdates: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false }
        },
        sms: {
            transactionUpdates: { type: Boolean, default: false },
            securityAlerts: { type: Boolean, default: true }
        }
    }
});

const kycSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['not_started', 'pending', 'approved', 'rejected', 'expired'],
        default: 'not_started'
    },
    level: {
        type: Number,
        default: 0, // 0: Basic, 1: Intermediate, 2: Advanced
        min: 0,
        max: 2
    },
    documents: [{
        type: {
            type: String,
            enum: ['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement']
        },
        url: String,
        uploadDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        rejectionReason: String
    }],
    personalInfo: {
        dateOfBirth: Date,
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String
        },
        occupation: String,
        sourceOfIncome: String
    },
    limits: {
        daily: { type: Number, default: 1000 },
        monthly: { type: Number, default: 10000 },
        annual: { type: Number, default: 50000 }
    },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String
});

const userSchema = new mongoose.Schema({
    // Basic Info
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phoneNumber: {
        type: String,
        sparse: true,
        unique: true,
        match: [/^\+[1-9]\d{1,14}$/, 'Please enter a valid international phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    
    // Account Status
    status: {
        type: String,
        enum: ['active', 'suspended', 'deactivated', 'pending_verification'],
        default: 'pending_verification'
    },
    role: {
        type: String,
        enum: ['user', 'premium', 'admin', 'super_admin'],
        default: 'user'
    },
    
    // Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    
    // Financial Info
    balance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP']
    },
    
    // Payment Methods
    paymentMethods: [paymentMethodSchema],
    
    // Security
    security: securitySchema,
    
    // Preferences
    preferences: preferencesSchema,
    
    // KYC (Know Your Customer)
    kyc: kycSchema,
    
    // Relationships
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    
    // Profile
    avatar: String,
    
    // Timestamps
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ 'security.loginAttempts': 1, 'security.lockUntil': 1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
    return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash password if it's been modified
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            userId: this._id,
            email: this.email,
            role: this.role 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRE || '7d',
            issuer: 'easymove-api',
            audience: 'easymove-client'
        }
    );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { 
            userId: this._id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { 
            expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
            issuer: 'easymove-api',
            audience: 'easymove-client'
        }
    );
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.security.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.security.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    this.security.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

// Method to check if user can make transaction
userSchema.methods.canMakeTransaction = function(amount) {
    if (this.status !== 'active') return false;
    if (this.isLocked) return false;
    if (this.balance < amount) return false;
    
    // Check daily limits based on KYC level
    const dailyLimit = this.kyc.limits.daily;
    // This would need to check daily spending from transactions
    // Implementation would require aggregating today's transactions
    
    return true;
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
    this.lastActive = new Date();
    return this.save({ validateBeforeSave: false });
};

// Method to add login attempt
userSchema.methods.addLoginAttempt = function(ip, userAgent, success = false) {
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // Add to login history
    this.security.loginHistory.unshift({
        ip,
        userAgent,
        success,
        timestamp: new Date()
    });
    
    // Keep only last 10 login attempts
    if (this.security.loginHistory.length > 10) {
        this.security.loginHistory = this.security.loginHistory.slice(0, 10);
    }
    
    if (success) {
        // Reset failed attempts on successful login
        this.security.loginAttempts = 0;
        this.security.lockUntil = undefined;
        this.security.lastLogin = new Date();
        this.security.lastLoginIP = ip;
    } else {
        // Increment failed attempts
        this.security.loginAttempts += 1;
        
        // Lock account if max attempts reached
        if (this.security.loginAttempts >= maxAttempts && !this.isLocked) {
            this.security.lockUntil = Date.now() + lockTime;
        }
    }
    
    return this.save({ validateBeforeSave: false });
};

// Static method to find user by reset token
userSchema.statics.findByPasswordResetToken = function(token) {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    return this.findOne({
        'security.passwordResetToken': hashedToken,
        'security.passwordResetExpires': { $gt: Date.now() }
    });
};

// Static method to find user by email verification token
userSchema.statics.findByEmailVerificationToken = function(token) {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    return this.findOne({
        'security.emailVerificationToken': hashedToken,
        'security.emailVerificationExpires': { $gt: Date.now() }
    });
};

module.exports = mongoose.model('User', userSchema);