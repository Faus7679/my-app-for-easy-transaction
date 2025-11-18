const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const logger = require('../utils/logger');

// Configure PayPal
paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

class PaymentService {
    // Stripe payment processing
    async processStripePayment({ transactionId, amount, currency, paymentMethodId, userId }) {
        try {
            const transaction = await Transaction.findById(transactionId);
            const user = await User.findById(userId);
            
            if (!transaction || !user) {
                throw new Error('Transaction or user not found');
            }
            
            // Create payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                payment_method: paymentMethodId,
                customer: user.stripeCustomerId,
                confirm: true,
                description: `EasyMove transfer - ${transaction.transactionId}`,
                metadata: {
                    transactionId: transaction._id.toString(),
                    userId: user._id.toString(),
                    trackingNumber: transaction.processingInfo.trackingNumber
                },
                receipt_email: user.email
            });
            
            // Update transaction with payment details
            transaction.paymentId = paymentIntent.id;
            transaction.status = 'processing';
            await transaction.updateStatus('processing', 'Payment processed successfully');
            
            logger.info(`Stripe payment processed: ${paymentIntent.id} for transaction ${transaction.transactionId}`);
            
            return {
                success: true,
                paymentId: paymentIntent.id,
                status: paymentIntent.status,
                clientSecret: paymentIntent.client_secret
            };
            
        } catch (error) {
            logger.error('Stripe payment processing error:', error);
            
            // Update transaction status to failed
            if (transactionId) {
                try {
                    const transaction = await Transaction.findById(transactionId);
                    if (transaction) {
                        await transaction.updateStatus('failed', `Payment failed: ${error.message}`);
                    }
                } catch (updateError) {
                    logger.error('Failed to update transaction status:', updateError);
                }
            }
            
            return {
                success: false,
                error: error.message,
                code: error.code || 'PAYMENT_FAILED'
            };
        }
    }
    
    // PayPal payment processing
    async processPayPalPayment({ transactionId, amount, currency, returnUrl, cancelUrl }) {
        try {
            const transaction = await Transaction.findById(transactionId);
            
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            
            const paymentData = {
                intent: 'sale',
                payer: {
                    payment_method: 'paypal'
                },
                redirect_urls: {
                    return_url: returnUrl,
                    cancel_url: cancelUrl
                },
                transactions: [{
                    amount: {
                        total: amount.toFixed(2),
                        currency: currency
                    },
                    description: `EasyMove transfer - ${transaction.transactionId}`,
                    custom: transaction._id.toString()
                }]
            };
            
            return new Promise((resolve, reject) => {
                paypal.payment.create(paymentData, (error, payment) => {
                    if (error) {
                        logger.error('PayPal payment creation error:', error);
                        reject(error);
                    } else {
                        // Find approval URL
                        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
                        
                        // Update transaction with PayPal payment ID
                        transaction.paymentId = payment.id;
                        transaction.save();
                        
                        logger.info(`PayPal payment created: ${payment.id} for transaction ${transaction.transactionId}`);
                        
                        resolve({
                            success: true,
                            paymentId: payment.id,
                            approvalUrl: approvalUrl ? approvalUrl.href : null
                        });
                    }
                });
            });
            
        } catch (error) {
            logger.error('PayPal payment processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Execute PayPal payment after approval
    async executePayPalPayment({ paymentId, payerId }) {
        try {
            const executeData = {
                payer_id: payerId
            };
            
            return new Promise((resolve, reject) => {
                paypal.payment.execute(paymentId, executeData, async (error, payment) => {
                    if (error) {
                        logger.error('PayPal payment execution error:', error);
                        reject(error);
                    } else {
                        // Update transaction status
                        const transaction = await Transaction.findOne({ paymentId });
                        if (transaction) {
                            await transaction.updateStatus('processing', 'PayPal payment executed successfully');
                        }
                        
                        logger.info(`PayPal payment executed: ${paymentId}`);
                        
                        resolve({
                            success: true,
                            paymentId: payment.id,
                            status: payment.state
                        });
                    }
                });
            });
            
        } catch (error) {
            logger.error('PayPal payment execution error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Create Stripe customer
    async createStripeCustomer({ userId, email, name }) {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
                metadata: {
                    userId: userId.toString()
                }
            });
            
            // Update user with Stripe customer ID
            await User.findByIdAndUpdate(userId, {
                stripeCustomerId: customer.id
            });
            
            logger.info(`Stripe customer created: ${customer.id} for user ${userId}`);
            
            return {
                success: true,
                customerId: customer.id
            };
            
        } catch (error) {
            logger.error('Stripe customer creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Add payment method to Stripe customer
    async addStripePaymentMethod({ userId, paymentMethodId }) {
        try {
            const user = await User.findById(userId);
            
            if (!user.stripeCustomerId) {
                // Create customer if doesn't exist
                const customerResult = await this.createStripeCustomer({
                    userId,
                    email: user.email,
                    name: user.fullName
                });
                
                if (!customerResult.success) {
                    throw new Error('Failed to create Stripe customer');
                }
                
                user.stripeCustomerId = customerResult.customerId;
                await user.save();
            }
            
            // Attach payment method to customer
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: user.stripeCustomerId
            });
            
            // Get payment method details
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            
            // Add to user's payment methods
            const paymentMethodData = {
                type: 'card',
                provider: 'stripe',
                stripePaymentMethodId: paymentMethodId,
                details: {
                    last4: paymentMethod.card.last4,
                    brand: paymentMethod.card.brand,
                    expiryMonth: paymentMethod.card.exp_month,
                    expiryYear: paymentMethod.card.exp_year
                },
                isVerified: true
            };
            
            user.paymentMethods.push(paymentMethodData);
            await user.save();
            
            logger.info(`Payment method added: ${paymentMethodId} for user ${userId}`);
            
            return {
                success: true,
                paymentMethod: paymentMethodData
            };
            
        } catch (error) {
            logger.error('Add Stripe payment method error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Process refund
    async processRefund({ transactionId, paymentId, amount, reason }) {
        try {
            const transaction = await Transaction.findById(transactionId);
            
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            
            let refundResult;
            
            if (transaction.paymentProvider === 'stripe') {
                refundResult = await this.processStripeRefund({ paymentId, amount, reason });
            } else if (transaction.paymentProvider === 'paypal') {
                refundResult = await this.processPayPalRefund({ paymentId, amount, reason });
            } else {
                throw new Error('Unsupported payment provider for refund');
            }
            
            if (refundResult.success) {
                await transaction.updateStatus('refunded', `Refund processed: ${reason}`);
                
                // Add refund to user's balance
                const user = await User.findById(transaction.sender);
                user.balance += amount;
                await user.save();
            }
            
            return refundResult;
            
        } catch (error) {
            logger.error('Process refund error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Stripe refund
    async processStripeRefund({ paymentId, amount, reason }) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentId,
                amount: Math.round(amount * 100), // Convert to cents
                reason: 'requested_by_customer',
                metadata: {
                    reason
                }
            });
            
            logger.info(`Stripe refund processed: ${refund.id} for payment ${paymentId}`);
            
            return {
                success: true,
                refundId: refund.id,
                status: refund.status
            };
            
        } catch (error) {
            logger.error('Stripe refund error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // PayPal refund
    async processPayPalRefund({ paymentId, amount, reason }) {
        try {
            // Get payment details first
            return new Promise((resolve, reject) => {
                paypal.payment.get(paymentId, (error, payment) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    
                    const saleId = payment.transactions[0].related_resources[0].sale.id;
                    
                    const refundData = {
                        amount: {
                            total: amount.toFixed(2),
                            currency: payment.transactions[0].amount.currency
                        },
                        description: reason
                    };
                    
                    paypal.sale.refund(saleId, refundData, (refundError, refund) => {
                        if (refundError) {
                            logger.error('PayPal refund error:', refundError);
                            resolve({
                                success: false,
                                error: refundError.message
                            });
                        } else {
                            logger.info(`PayPal refund processed: ${refund.id} for payment ${paymentId}`);
                            
                            resolve({
                                success: true,
                                refundId: refund.id,
                                status: refund.state
                            });
                        }
                    });
                });
            });
            
        } catch (error) {
            logger.error('PayPal refund error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get payment status
    async getPaymentStatus({ paymentId, provider }) {
        try {
            if (provider === 'stripe') {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
                return {
                    success: true,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency.toUpperCase()
                };
            } else if (provider === 'paypal') {
                return new Promise((resolve, reject) => {
                    paypal.payment.get(paymentId, (error, payment) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                success: true,
                                status: payment.state,
                                amount: parseFloat(payment.transactions[0].amount.total),
                                currency: payment.transactions[0].amount.currency
                            });
                        }
                    });
                });
            } else {
                throw new Error('Unsupported payment provider');
            }
            
        } catch (error) {
            logger.error('Get payment status error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new PaymentService();