const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const { connectDB, connectRedis } = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const transactionRoutes = require('./src/routes/transactions');
const currencyRoutes = require('./src/routes/currencies');
const paymentRoutes = require('./src/routes/payments');
const adminRoutes = require('./src/routes/admin');

class EasyMoveServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.NODE_ENV === 'production' 
                    ? process.env.FRONTEND_URL 
                    : process.env.FRONTEND_DEV_URL,
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        this.port = process.env.PORT || 3000;
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeWebSocket();
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'https:', 'wss:'],
                    fontSrc: ["'self'", 'https:'],
                    frameSrc: ["'self'", 'https://js.stripe.com']
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        const corsOptions = {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    process.env.FRONTEND_URL,
                    process.env.FRONTEND_DEV_URL,
                    'http://localhost:3000',
                    'http://127.0.0.1:3000'
                ];
                
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        };
        this.app.use(cors(corsOptions));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: {
                error: 'Too many requests from this IP. Please try again later.',
                retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);

        // Special rate limiting for auth endpoints
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 requests per windowMs for auth
            message: {
                error: 'Too many authentication attempts. Please try again later.'
            }
        });
        this.app.use('/api/auth/login', authLimiter);
        this.app.use('/api/auth/register', authLimiter);

        // Body parsing middleware
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                // Store raw body for webhook verification
                if (req.originalUrl === '/api/payments/stripe/webhook') {
                    req.rawBody = buf;
                }
            }
        }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Other middleware
        this.app.use(compression());
        this.app.use(mongoSanitize());
        
        // Logging
        if (process.env.ENABLE_MORGAN_LOGGING === 'true') {
            this.app.use(morgan('combined', {
                stream: {
                    write: (message) => logger.info(message.trim())
                }
            }));
        }

        // Make io accessible to req object
        this.app.use((req, res, next) => {
            req.io = this.io;
            next();
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
                version: process.env.npm_package_version || '2.0.0'
            });
        });
    }

    initializeRoutes() {
        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/transactions', transactionRoutes);
        this.app.use('/api/currencies', currencyRoutes);
        this.app.use('/api/payments', paymentRoutes);
        this.app.use('/api/admin', adminRoutes);

        // API documentation route
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'EasyMove API',
                version: '2.0.0',
                description: 'Secure Money Transfer API',
                endpoints: {
                    auth: '/api/auth',
                    users: '/api/users',
                    transactions: '/api/transactions',
                    currencies: '/api/currencies',
                    payments: '/api/payments',
                    admin: '/api/admin'
                },
                documentation: 'https://docs.easymove.app',
                support: 'https://support.easymove.app'
            });
        });

        // 404 handler for API routes
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                error: 'API endpoint not found',
                message: `The endpoint ${req.originalUrl} does not exist`,
                availableEndpoints: [
                    '/api/auth',
                    '/api/users',
                    '/api/transactions',
                    '/api/currencies',
                    '/api/payments'
                ]
            });
        });
    }

    initializeErrorHandling() {
        // Global error handler
        this.app.use(errorHandler);

        // Unhandled promise rejection handler
        process.on('unhandledRejection', (err) => {
            logger.error('Unhandled Promise Rejection:', err);
            this.gracefulShutdown('SIGTERM');
        });

        // Uncaught exception handler
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            this.gracefulShutdown('SIGTERM');
        });

        // Graceful shutdown handlers
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    }

    initializeWebSocket() {
        // WebSocket authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const User = require('./src/models/User');
                const user = await User.findById(decoded.userId).select('-password');
                
                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }

                socket.userId = user._id.toString();
                socket.user = user;
                next();
            } catch (error) {
                next(new Error('Authentication error: Invalid token'));
            }
        });

        // WebSocket connection handling
        this.io.on('connection', (socket) => {
            logger.info(`User ${socket.user.email} connected via WebSocket`);
            
            // Join user to their personal room
            socket.join(`user_${socket.userId}`);

            // Handle transaction status subscriptions
            socket.on('subscribe_transaction', (transactionId) => {
                socket.join(`transaction_${transactionId}`);
                logger.info(`User ${socket.user.email} subscribed to transaction ${transactionId}`);
            });

            socket.on('unsubscribe_transaction', (transactionId) => {
                socket.leave(`transaction_${transactionId}`);
                logger.info(`User ${socket.user.email} unsubscribed from transaction ${transactionId}`);
            });

            // Handle user status updates
            socket.on('user_status', (status) => {
                socket.broadcast.emit('user_status_update', {
                    userId: socket.userId,
                    status: status
                });
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                logger.info(`User ${socket.user.email} disconnected: ${reason}`);
            });

            // Handle connection errors
            socket.on('error', (error) => {
                logger.error(`WebSocket error for user ${socket.user.email}:`, error);
            });
        });

        logger.info('WebSocket server initialized');
    }

    async start() {
        try {
            // Connect to databases
            await connectDB();
            await connectRedis();

            // Start background job processors
            require('./src/services/queueService');

            // Start server
            this.server.listen(this.port, () => {
                logger.info(`EasyMove API Server running on port ${this.port}`);
                logger.info(`Environment: ${process.env.NODE_ENV}`);
                logger.info(`WebSocket enabled on same port`);
                
                if (process.env.NODE_ENV === 'development') {
                    logger.info(`API Documentation: http://localhost:${this.port}/api`);
                    logger.info(`Health Check: http://localhost:${this.port}/health`);
                }
            });

        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    async gracefulShutdown(signal) {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);

        // Stop accepting new connections
        this.server.close(async () => {
            logger.info('HTTP server closed');

            try {
                // Close database connections
                await mongoose.connection.close();
                logger.info('MongoDB connection closed');

                // Close Redis connection
                const redis = require('./src/config/database').redisClient;
                if (redis) {
                    await redis.quit();
                    logger.info('Redis connection closed');
                }

                // Close WebSocket connections
                this.io.close(() => {
                    logger.info('WebSocket server closed');
                });

                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during graceful shutdown:', error);
                process.exit(1);
            }
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    }
}

// Start the server
const server = new EasyMoveServer();
server.start();

module.exports = server;