const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

// User registration
const register = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { firstName, lastName, email, password, phoneNumber } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                ...(phoneNumber ? [{ phoneNumber }] : [])
            ]
        });
        
        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone number';
            return res.status(400).json({
                success: false,
                error: `User with this ${field} already exists`
            });
        }
        
        // Create new user
        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            phoneNumber,
            status: 'pending_verification'
        });
        
        // Generate email verification token
        const verificationToken = user.generateEmailVerificationToken();
        
        await user.save();
        
        // Send verification email
        try {
            await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
        } catch (emailError) {
            logger.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }
        
        // Generate tokens
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        
        logger.info(`New user registered: ${user.email}`);
        
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    status: user.status,
                    isEmailVerified: user.isEmailVerified,
                    balance: user.balance,
                    currency: user.currency
                },
                tokens: {
                    accessToken: token,
                    refreshToken: refreshToken,
                    expiresIn: process.env.JWT_EXPIRE || '7d'
                }
            }
        });
        
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
};

// User login
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { email, password } = req.body;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress;
        
        // Find user and include password for verification
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            const lockTimeRemaining = Math.ceil((user.security.lockUntil - Date.now()) / (1000 * 60));
            return res.status(423).json({
                success: false,
                error: `Account is locked due to too many failed login attempts. Try again in ${lockTimeRemaining} minutes.`
            });
        }
        
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            // Record failed login attempt
            await user.addLoginAttempt(ip, userAgent, false);
            
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        // Check account status
        if (user.status === 'suspended') {
            await user.addLoginAttempt(ip, userAgent, false);
            return res.status(403).json({
                success: false,
                error: 'Account is suspended. Please contact support.'
            });
        }
        
        if (user.status === 'deactivated') {
            await user.addLoginAttempt(ip, userAgent, false);
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact support.'
            });
        }
        
        // Record successful login
        await user.addLoginAttempt(ip, userAgent, true);
        
        // Generate tokens
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        
        logger.info(`User logged in: ${user.email} from IP: ${ip}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    status: user.status,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    balance: user.balance,
                    currency: user.currency,
                    lastLogin: user.security.lastLogin
                },
                tokens: {
                    accessToken: token,
                    refreshToken: refreshToken,
                    expiresIn: process.env.JWT_EXPIRE || '7d'
                }
            }
        });
        
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
};

// Refresh access token
const refreshToken = async (req, res) => {
    try {
        const user = req.user; // Set by validateRefreshToken middleware
        
        // Generate new access token
        const newAccessToken = user.generateAuthToken();
        
        logger.info(`Token refreshed for user: ${user.email}`);
        
        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        });
        
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed. Please login again.'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    status: user.status,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    balance: user.balance,
                    currency: user.currency,
                    avatar: user.avatar,
                    preferences: user.preferences,
                    kyc: {
                        status: user.kyc.status,
                        level: user.kyc.level,
                        limits: user.kyc.limits
                    },
                    createdAt: user.createdAt,
                    lastActive: user.lastActive
                }
            }
        });
        
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve profile'
        });
    }
};

// Verify email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }
        
        const user = await User.findByEmailVerificationToken(token);
        
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }
        
        // Update user verification status
        user.isEmailVerified = true;
        user.status = 'active';
        user.security.emailVerificationToken = undefined;
        user.security.emailVerificationExpires = undefined;
        
        await user.save();
        
        logger.info(`Email verified for user: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Email verified successfully'
        });
        
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Email verification failed'
        });
    }
};

// Resend verification email
const resendVerification = async (req, res) => {
    try {
        const user = req.user;
        
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified'
            });
        }
        
        // Generate new verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();
        
        // Send verification email
        await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
        
        logger.info(`Verification email resent to: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Verification email sent successfully'
        });
        
    } catch (error) {
        logger.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend verification email'
        });
    }
};

// Request password reset
const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { email } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            // Don't reveal that user doesn't exist
            return res.json({
                success: true,
                message: 'If an account with that email exists, you will receive a password reset email.'
            });
        }
        
        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();
        
        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
        } catch (emailError) {
            logger.error('Failed to send password reset email:', emailError);
            return res.status(500).json({
                success: false,
                error: 'Failed to send password reset email'
            });
        }
        
        logger.info(`Password reset requested for: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Password reset email sent successfully'
        });
        
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Password reset request failed'
        });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { token } = req.params;
        const { password } = req.body;
        
        const user = await User.findByPasswordResetToken(token);
        
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }
        
        // Update password
        user.password = password;
        user.security.passwordResetToken = undefined;
        user.security.passwordResetExpires = undefined;
        
        await user.save();
        
        logger.info(`Password reset completed for: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
        
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Password reset failed'
        });
    }
};

// Validation rules
const registerValidation = [
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('phoneNumber')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const forgotPasswordValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
];

const resetPasswordValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

module.exports = {
    register,
    login,
    refreshToken,
    getProfile,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
};