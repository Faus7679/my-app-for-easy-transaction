const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');

// Get system statistics
const getSystemStats = async (req, res) => {
    try {
        const [userStats, transactionStats, queueStats] = await Promise.all([
            User.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$sendAmount' }
                    }
                }
            ]),
            queueService.getQueueStats()
        ]);
        
        res.json({
            success: true,
            data: {
                users: userStats,
                transactions: transactionStats,
                queues: queueStats
            }
        });
        
    } catch (error) {
        logger.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system statistics'
        });
    }
};

// Routes
router.get('/stats', authenticate, authorize('admin', 'super_admin'), getSystemStats);

module.exports = router;