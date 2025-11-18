const Bull = require('bull');
const redis = require('redis');
const logger = require('../utils/logger');
const paymentService = require('./paymentService');
const emailService = require('./emailService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Redis connection for Bull queues
const redisConfig = {
    host: process.env.QUEUE_REDIS_HOST || 'localhost',
    port: process.env.QUEUE_REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true
};

// Create queues
const paymentProcessingQueue = new Bull('payment processing', { redis: redisConfig });
const refundProcessingQueue = new Bull('refund processing', { redis: redisConfig });
const emailQueue = new Bull('email notifications', { redis: redisConfig });
const transactionStatusQueue = new Bull('transaction status updates', { redis: redisConfig });
const currencyUpdateQueue = new Bull('currency rate updates', { redis: redisConfig });

class QueueService {
    constructor() {
        this.setupQueueProcessors();
        this.setupQueueEvents();
    }

    // Set up queue processors
    setupQueueProcessors() {
        // Payment processing queue
        paymentProcessingQueue.process(async (job) => {
            const { transactionId, userId, paymentMethod, paymentProvider, amount, currency } = job.data;
            
            try {
                logger.info(`Processing payment for transaction: ${transactionId}`);
                
                let result;
                
                if (paymentProvider === 'stripe') {
                    result = await paymentService.processStripePayment({
                        transactionId,
                        amount,
                        currency,
                        paymentMethodId: job.data.paymentMethodId,
                        userId
                    });
                } else if (paymentProvider === 'paypal') {
                    // PayPal payments are handled differently (redirect-based)
                    result = { success: true, message: 'PayPal payment initiated' };
                } else {
                    throw new Error(`Unsupported payment provider: ${paymentProvider}`);
                }
                
                if (result.success) {
                    logger.info(`Payment processed successfully for transaction: ${transactionId}`);
                    
                    // Schedule transaction status check
                    this.addTransactionStatusCheckJob(transactionId, 5 * 60 * 1000); // Check in 5 minutes
                } else {
                    throw new Error(result.error || 'Payment processing failed');
                }
                
                return result;
                
            } catch (error) {
                logger.error(`Payment processing failed for transaction ${transactionId}:`, error);
                
                // Update transaction status to failed
                try {
                    const transaction = await Transaction.findById(transactionId);
                    if (transaction) {
                        await transaction.updateStatus('failed', `Payment processing failed: ${error.message}`);
                        
                        // Refund user's balance
                        const user = await User.findById(userId);
                        user.balance += amount;
                        await user.save();
                    }
                } catch (updateError) {
                    logger.error('Failed to update transaction status:', updateError);
                }
                
                throw error;
            }
        });

        // Refund processing queue
        refundProcessingQueue.process(async (job) => {
            const { transactionId, paymentId, amount, reason } = job.data;
            
            try {
                logger.info(`Processing refund for transaction: ${transactionId}`);
                
                const result = await paymentService.processRefund({
                    transactionId,
                    paymentId,
                    amount,
                    reason
                });
                
                if (result.success) {
                    logger.info(`Refund processed successfully for transaction: ${transactionId}`);
                } else {
                    throw new Error(result.error || 'Refund processing failed');
                }
                
                return result;
                
            } catch (error) {
                logger.error(`Refund processing failed for transaction ${transactionId}:`, error);
                throw error;
            }
        });

        // Email notification queue
        emailQueue.process(async (job) => {
            const { type, data } = job.data;
            
            try {
                switch (type) {
                    case 'transaction_confirmation':
                        await emailService.sendTransactionConfirmation(data.email, data.transaction, data.firstName);
                        break;
                    case 'transaction_status_update':
                        await emailService.sendTransactionStatusUpdate(data.email, data.transaction, data.firstName);
                        break;
                    case 'transaction_cancellation':
                        await emailService.sendTransactionCancellation(data.email, data.transaction, data.firstName);
                        break;
                    case 'verification_email':
                        await emailService.sendVerificationEmail(data.email, data.token, data.firstName);
                        break;
                    case 'password_reset':
                        await emailService.sendPasswordResetEmail(data.email, data.token, data.firstName);
                        break;
                    default:
                        throw new Error(`Unknown email type: ${type}`);
                }
                
                logger.info(`Email sent successfully: ${type} to ${data.email}`);
                
            } catch (error) {
                logger.error(`Failed to send email: ${type} to ${data.email}:`, error);
                throw error;
            }
        });

        // Transaction status update queue
        transactionStatusQueue.process(async (job) => {
            const { transactionId } = job.data;
            
            try {
                const transaction = await Transaction.findById(transactionId).populate('sender');
                
                if (!transaction) {
                    throw new Error('Transaction not found');
                }
                
                // Check payment status if transaction is processing
                if (transaction.status === 'processing' && transaction.paymentId) {
                    const paymentStatus = await paymentService.getPaymentStatus({
                        paymentId: transaction.paymentId,
                        provider: transaction.paymentProvider
                    });
                    
                    if (paymentStatus.success) {
                        let newStatus = transaction.status;
                        
                        if (paymentStatus.status === 'succeeded' || paymentStatus.status === 'completed') {
                            newStatus = 'completed';
                        } else if (paymentStatus.status === 'failed' || paymentStatus.status === 'canceled') {
                            newStatus = 'failed';
                        }
                        
                        if (newStatus !== transaction.status) {
                            await transaction.updateStatus(newStatus, `Status updated from payment provider: ${paymentStatus.status}`);
                            
                            // Send notification email
                            this.addEmailJob('transaction_status_update', {
                                email: transaction.sender.email,
                                transaction,
                                firstName: transaction.sender.firstName
                            });
                            
                            logger.info(`Transaction status updated: ${transaction.transactionId} -> ${newStatus}`);
                        }
                    }
                }
                
                // Schedule next check if still processing
                if (transaction.status === 'processing') {
                    this.addTransactionStatusCheckJob(transactionId, 10 * 60 * 1000); // Check again in 10 minutes
                }
                
            } catch (error) {
                logger.error(`Transaction status check failed for ${transactionId}:`, error);
                throw error;
            }
        });

        // Currency rate update queue
        currencyUpdateQueue.process(async (job) => {
            try {
                const currencyService = require('./currencyService');
                await currencyService.updateAllRates();
                logger.info('Currency rates updated successfully');
            } catch (error) {
                logger.error('Currency rate update failed:', error);
                throw error;
            }
        });
    }

    // Set up queue event listeners
    setupQueueEvents() {
        const queues = [
            paymentProcessingQueue,
            refundProcessingQueue,
            emailQueue,
            transactionStatusQueue,
            currencyUpdateQueue
        ];

        queues.forEach(queue => {
            queue.on('completed', (job, result) => {
                logger.info(`Job completed: ${queue.name} - ${job.id}`);
            });

            queue.on('failed', (job, err) => {
                logger.error(`Job failed: ${queue.name} - ${job.id}:`, err);
            });

            queue.on('stalled', (job) => {
                logger.warn(`Job stalled: ${queue.name} - ${job.id}`);
            });
        });
    }

    // Add payment processing job
    addPaymentProcessingJob(data, options = {}) {
        const defaultOptions = {
            attempts: parseInt(process.env.MAX_JOB_ATTEMPTS) || 3,
            backoff: {
                type: 'exponential',
                delay: parseInt(process.env.JOB_RETRY_DELAY) || 5000
            },
            removeOnComplete: 100,
            removeOnFail: 50
        };

        return paymentProcessingQueue.add(data, { ...defaultOptions, ...options });
    }

    // Add refund processing job
    addRefundProcessingJob(data, options = {}) {
        const defaultOptions = {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            },
            removeOnComplete: 100,
            removeOnFail: 50
        };

        return refundProcessingQueue.add(data, { ...defaultOptions, ...options });
    }

    // Add email job
    addEmailJob(type, data, options = {}) {
        const defaultOptions = {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: 200,
            removeOnFail: 100
        };

        return emailQueue.add({ type, data }, { ...defaultOptions, ...options });
    }

    // Add transaction status check job
    addTransactionStatusCheckJob(transactionId, delay = 0) {
        const options = {
            delay,
            attempts: 1,
            removeOnComplete: 50,
            removeOnFail: 20
        };

        return transactionStatusQueue.add({ transactionId }, options);
    }

    // Add currency update job (scheduled)
    scheduleCurrencyUpdateJob() {
        // Update rates every 15 minutes
        const options = {
            repeat: { cron: '*/15 * * * *' },
            removeOnComplete: 5,
            removeOnFail: 3
        };

        return currencyUpdateQueue.add({}, options);
    }

    // Get queue statistics
    async getQueueStats() {
        try {
            const stats = {};
            const queues = {
                paymentProcessing: paymentProcessingQueue,
                refundProcessing: refundProcessingQueue,
                email: emailQueue,
                transactionStatus: transactionStatusQueue,
                currencyUpdate: currencyUpdateQueue
            };

            for (const [name, queue] of Object.entries(queues)) {
                const [waiting, active, completed, failed, delayed] = await Promise.all([
                    queue.getWaiting(),
                    queue.getActive(),
                    queue.getCompleted(),
                    queue.getFailed(),
                    queue.getDelayed()
                ]);

                stats[name] = {
                    waiting: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length,
                    delayed: delayed.length
                };
            }

            return stats;
        } catch (error) {
            logger.error('Failed to get queue stats:', error);
            throw error;
        }
    }

    // Clean up completed and failed jobs
    async cleanQueues() {
        try {
            const queues = [
                paymentProcessingQueue,
                refundProcessingQueue,
                emailQueue,
                transactionStatusQueue,
                currencyUpdateQueue
            ];

            for (const queue of queues) {
                await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24 hours
                await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
            }

            logger.info('Queue cleanup completed');
        } catch (error) {
            logger.error('Queue cleanup failed:', error);
        }
    }

    // Initialize scheduled jobs
    initialize() {
        // Schedule currency updates
        this.scheduleCurrencyUpdateJob();

        // Schedule queue cleanup (daily at 2 AM)
        setInterval(() => {
            this.cleanQueues();
        }, 24 * 60 * 60 * 1000);

        logger.info('Queue service initialized with scheduled jobs');
    }
}

// Create and export singleton instance
const queueService = new QueueService();

// Initialize when module is loaded
queueService.initialize();

module.exports = queueService;