const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        // Verify connection
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            logger.info('Email service connected successfully');
        } catch (error) {
            logger.error('Email service connection failed:', error);
        }
    }

    async sendVerificationEmail(email, token, firstName) {
        try {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
            
            const mailOptions = {
                from: `"EasyMove" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Verify Your EasyMove Account',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">EasyMove</h1>
                            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Secure Money Transfer Platform</p>
                        </div>
                        
                        <div style="padding: 40px 30px; background: #ffffff;">
                            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                                Welcome to EasyMove! To complete your registration and start sending money securely, 
                                please verify your email address by clicking the button below.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationUrl}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 25px; 
                                          display: inline-block;
                                          font-weight: bold;">
                                    Verify Email Address
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            
                            <p style="color: #4A90E2; word-break: break-all; margin-bottom: 30px;">
                                ${verificationUrl}
                            </p>
                            
                            <p style="color: #999; font-size: 14px; line-height: 1.6;">
                                This verification link will expire in 24 hours. If you didn't create an account with EasyMove, 
                                you can safely ignore this email.
                            </p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #666; margin: 0; font-size: 14px;">
                                © 2024 EasyMove. All rights reserved.
                            </p>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                                Need help? Contact us at support@easymove.app
                            </p>
                        </div>
                    </div>
                `
            };
            
            await this.transporter.sendMail(mailOptions);
            logger.info(`Verification email sent to: ${email}`);
            
        } catch (error) {
            logger.error('Failed to send verification email:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email, token, firstName) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            
            const mailOptions = {
                from: `"EasyMove" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Reset Your EasyMove Password',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">EasyMove</h1>
                            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Password Reset Request</p>
                        </div>
                        
                        <div style="padding: 40px 30px; background: #ffffff;">
                            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                                We received a request to reset your EasyMove account password. 
                                Click the button below to create a new password.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 25px; 
                                          display: inline-block;
                                          font-weight: bold;">
                                    Reset Password
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            
                            <p style="color: #4A90E2; word-break: break-all; margin-bottom: 30px;">
                                ${resetUrl}
                            </p>
                            
                            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    <strong>Security Notice:</strong> This password reset link will expire in 10 minutes. 
                                    If you didn't request this reset, please ignore this email and contact our support team immediately.
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #666; margin: 0; font-size: 14px;">
                                © 2024 EasyMove. All rights reserved.
                            </p>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                                Need help? Contact us at support@easymove.app
                            </p>
                        </div>
                    </div>
                `
            };
            
            await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to: ${email}`);
            
        } catch (error) {
            logger.error('Failed to send password reset email:', error);
            throw error;
        }
    }

    async sendTransactionConfirmation(email, transaction, firstName) {
        try {
            const trackingUrl = `${process.env.FRONTEND_URL}/track/${transaction.processingInfo.trackingNumber}`;
            
            const mailOptions = {
                from: `"EasyMove" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Transaction Confirmation - ${transaction.transactionId}`,
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">EasyMove</h1>
                            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Transaction Confirmation</p>
                        </div>
                        
                        <div style="padding: 40px 30px; background: #ffffff;">
                            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                                Your money transfer has been successfully created and is being processed. 
                                Here are the details of your transaction:
                            </p>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Transaction ID:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.transactionId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Tracking Number:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.processingInfo.trackingNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Send Amount:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.sendAmount} ${transaction.sendCurrency}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Receive Amount:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.receiveAmount} ${transaction.receiveCurrency}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Exchange Rate:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333;">${transaction.exchangeRate.effectiveRate.toFixed(4)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Total Fees:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333;">${transaction.fees.totalFees} ${transaction.sendCurrency}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Recipient:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333;">${transaction.recipient.firstName} ${transaction.recipient.lastName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666;">Status:</td>
                                        <td style="padding: 10px 0; color: #28a745; font-weight: bold;">${transaction.status.toUpperCase()}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${trackingUrl}" 
                                   style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 25px; 
                                          display: inline-block;
                                          font-weight: bold;">
                                    Track Transaction
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                                You can track your transaction status anytime using the tracking number: 
                                <strong>${transaction.processingInfo.trackingNumber}</strong>
                            </p>
                            
                            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px;">
                                <p style="color: #155724; margin: 0; font-size: 14px;">
                                    <strong>Estimated Delivery:</strong> ${new Date(transaction.processingInfo.estimatedDelivery).toLocaleDateString()} 
                                    at ${new Date(transaction.processingInfo.estimatedDelivery).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #666; margin: 0; font-size: 14px;">
                                © 2024 EasyMove. All rights reserved.
                            </p>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                                Need help? Contact us at support@easymove.app
                            </p>
                        </div>
                    </div>
                `
            };
            
            await this.transporter.sendMail(mailOptions);
            logger.info(`Transaction confirmation email sent to: ${email}`);
            
        } catch (error) {
            logger.error('Failed to send transaction confirmation email:', error);
            throw error;
        }
    }

    async sendTransactionStatusUpdate(email, transaction, firstName) {
        try {
            const statusColors = {
                pending: '#ffc107',
                processing: '#17a2b8',
                completed: '#28a745',
                failed: '#dc3545',
                cancelled: '#6c757d',
                refunded: '#fd7e14'
            };
            
            const statusColor = statusColors[transaction.status] || '#6c757d';
            const trackingUrl = `${process.env.FRONTEND_URL}/track/${transaction.processingInfo.trackingNumber}`;
            
            const mailOptions = {
                from: `"EasyMove" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Transaction Update - ${transaction.transactionId}`,
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">EasyMove</h1>
                            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Transaction Status Update</p>
                        </div>
                        
                        <div style="padding: 40px 30px; background: #ffffff;">
                            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                                There's an update on your transaction ${transaction.transactionId}:
                            </p>
                            
                            <div style="background: ${statusColor}20; border: 2px solid ${statusColor}; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                                <h3 style="color: ${statusColor}; margin: 0; font-size: 24px; text-transform: uppercase;">
                                    ${transaction.status}
                                </h3>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Transaction ID:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.transactionId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Amount:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.sendAmount} ${transaction.sendCurrency}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666;">Recipient:</td>
                                        <td style="padding: 10px 0; color: #333;">${transaction.recipient.firstName} ${transaction.recipient.lastName}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${trackingUrl}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 25px; 
                                          display: inline-block;
                                          font-weight: bold;">
                                    View Full Details
                                </a>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #666; margin: 0; font-size: 14px;">
                                © 2024 EasyMove. All rights reserved.
                            </p>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                                Need help? Contact us at support@easymove.app
                            </p>
                        </div>
                    </div>
                `
            };
            
            await this.transporter.sendMail(mailOptions);
            logger.info(`Transaction status update email sent to: ${email}`);
            
        } catch (error) {
            logger.error('Failed to send transaction status update email:', error);
            throw error;
        }
    }

    async sendTransactionCancellation(email, transaction, firstName) {
        try {
            const mailOptions = {
                from: `"EasyMove" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Transaction Cancelled - ${transaction.transactionId}`,
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">EasyMove</h1>
                            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Transaction Cancelled</p>
                        </div>
                        
                        <div style="padding: 40px 30px; background: #ffffff;">
                            <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                                Your transaction has been successfully cancelled. The full amount will be refunded to your account.
                            </p>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Transaction ID:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #333; font-weight: bold;">${transaction.transactionId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #666;">Refund Amount:</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #28a745; font-weight: bold;">${transaction.totalSendAmount} ${transaction.sendCurrency}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666;">Status:</td>
                                        <td style="padding: 10px 0; color: #6c757d; font-weight: bold;">CANCELLED</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px;">
                                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                                    <strong>Refund Notice:</strong> The refunded amount has been added back to your EasyMove account balance. 
                                    If you paid with a card or external payment method, it may take 3-5 business days for the refund to appear.
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="color: #666; margin: 0; font-size: 14px;">
                                © 2024 EasyMove. All rights reserved.
                            </p>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                                Need help? Contact us at support@easymove.app
                            </p>
                        </div>
                    </div>
                `
            };
            
            await this.transporter.sendMail(mailOptions);
            logger.info(`Transaction cancellation email sent to: ${email}`);
            
        } catch (error) {
            logger.error('Failed to send transaction cancellation email:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();