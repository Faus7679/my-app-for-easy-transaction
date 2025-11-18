const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/authController');

const {
    authenticate,
    validateRefreshToken
} = require('../middleware/auth');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', validateRefreshToken, refreshToken);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/resend-verification', authenticate, resendVerification);

module.exports = router;