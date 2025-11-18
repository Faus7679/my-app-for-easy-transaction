const express = require('express');
const router = express.Router();

const {
    createTransaction,
    getUserTransactions,
    getTransaction,
    cancelTransaction,
    getTransactionStats,
    trackTransaction,
    createTransactionValidation,
    cancelTransactionValidation
} = require('../controllers/transactionController');

const {
    authenticate,
    requireEmailVerification,
    requireKYCLevel
} = require('../middleware/auth');

// Public routes
router.get('/track/:trackingNumber', trackTransaction);

// Protected routes
router.post(
    '/',
    authenticate,
    requireEmailVerification,
    requireKYCLevel(1),
    createTransactionValidation,
    createTransaction
);

router.get('/', authenticate, getUserTransactions);
router.get('/stats', authenticate, getTransactionStats);
router.get('/:transactionId', authenticate, getTransaction);

router.patch(
    '/:transactionId/cancel',
    authenticate,
    cancelTransactionValidation,
    cancelTransaction
);

module.exports = router;