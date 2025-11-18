const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided or invalid format.'
            });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user and exclude password
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Token is valid but user no longer exists.'
                });
            }
            
            // Check if user account is active
            if (user.status !== 'active' && user.status !== 'pending_verification') {
                return res.status(403).json({
                    success: false,
                    error: 'Account is suspended or deactivated.'
                });
            }
            
            // Check if account is locked
            if (user.isLocked) {
                return res.status(423).json({
                    success: false,
                    error: 'Account is temporarily locked due to security reasons.'
                });
            }
            
            // Update last active time
            user.updateLastActive();
            
            req.user = user;
            next();
            
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token has expired. Please login again.',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token. Please login again.',
                    code: 'INVALID_TOKEN'
                });
            } else {
                throw jwtError;
            }
        }
        
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during authentication.'
        });
    }
};

// Middleware to check if user has specific role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions for this action.'
            });
        }
        
        next();
    };
};

// Middleware to check if user is email verified (for sensitive operations)
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required.'
        });
    }
    
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            error: 'Email verification required for this action.',
            code: 'EMAIL_VERIFICATION_REQUIRED'
        });
    }
    
    next();
};

// Middleware to check KYC level for high-value transactions
const requireKYCLevel = (minLevel = 1) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }
        
        if (req.user.kyc.level < minLevel) {
            return res.status(403).json({
                success: false,
                error: `KYC verification level ${minLevel} required for this action.`,
                code: 'KYC_VERIFICATION_REQUIRED',
                currentLevel: req.user.kyc.level,
                requiredLevel: minLevel
            });
        }
        
        if (req.user.kyc.status !== 'approved') {
            return res.status(403).json({
                success: false,
                error: 'KYC verification must be approved for this action.',
                code: 'KYC_APPROVAL_REQUIRED',
                kycStatus: req.user.kyc.status
            });
        }
        
        next();
    };
};

// Middleware to validate refresh token
const validateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required.'
            });
        }
        
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            if (decoded.type !== 'refresh') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token type.'
                });
            }
            
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found.'
                });
            }
            
            req.user = user;
            req.refreshTokenPayload = decoded;
            next();
            
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token has expired. Please login again.',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token.',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }
        }
        
    } catch (error) {
        logger.error('Refresh token validation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during token validation.'
        });
    }
};

// Middleware to check if user owns resource (for user-specific endpoints)
const requireOwnership = (resourceUserField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }
        
        const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
        
        if (!resourceUserId) {
            return res.status(400).json({
                success: false,
                error: 'Resource user ID not provided.'
            });
        }
        
        // Allow access if user is admin or super_admin
        if (['admin', 'super_admin'].includes(req.user.role)) {
            return next();
        }
        
        // Check if user owns the resource
        if (req.user._id.toString() !== resourceUserId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own resources.'
            });
        }
        
        next();
    };
};

// Optional authentication (user may or may not be logged in)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // No token provided, continue without user
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.status === 'active' && !user.isLocked) {
                req.user = user;
                user.updateLastActive();
            }
        } catch (jwtError) {
            // Token invalid or expired, continue without user
            logger.warn('Optional auth token invalid:', jwtError.message);
        }
        
        next();
        
    } catch (error) {
        logger.error('Optional authentication error:', error);
        next(); // Continue without user on error
    }
};

module.exports = {
    authenticate,
    authorize,
    requireEmailVerification,
    requireKYCLevel,
    validateRefreshToken,
    requireOwnership,
    optionalAuth
};