const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireOwnership } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get user profile
const getUserProfile = async (req, res) => {
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
                    paymentMethods: user.paymentMethods,
                    createdAt: user.createdAt,
                    lastActive: user.lastActive
                }
            }
        });
        
    } catch (error) {
        logger.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user profile'
        });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const user = req.user;
        const { firstName, lastName, phoneNumber, preferences } = req.body;
        
        // Update allowed fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (preferences) {
            user.preferences = { ...user.preferences.toObject(), ...preferences };
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    preferences: user.preferences
                }
            }
        });
        
    } catch (error) {
        logger.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
};

// Routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

module.exports = router;