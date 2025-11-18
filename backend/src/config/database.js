const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
            bufferMaxEntries: 0 // Disable mongoose buffering
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Redis Connection
const connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    logger.error('Redis server connection refused');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    logger.error('Redis retry time exhausted');
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    logger.error('Redis connection max attempts reached');
                    return undefined;
                }
                // Reconnect after 2 seconds
                return Math.min(options.attempt * 100, 3000);
            }
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
        });

        redisClient.on('error', (err) => {
            logger.error('Redis client error:', err);
        });

        redisClient.on('end', () => {
            logger.warn('Redis client disconnected');
        });

        await redisClient.connect();
        
        // Test the connection
        await redisClient.ping();
        logger.info('Redis connection successful');

        return redisClient;
    } catch (error) {
        logger.error('Redis connection failed:', error);
        // Redis is optional, so don't exit process
        return null;
    }
};

// Cache utility functions
const cache = {
    // Set data in cache
    set: async (key, value, expiration = 3600) => {
        if (!redisClient) return false;
        try {
            const serialized = JSON.stringify(value);
            await redisClient.setEx(key, expiration, serialized);
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    },

    // Get data from cache
    get: async (key) => {
        if (!redisClient) return null;
        try {
            const cached = await redisClient.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    },

    // Delete data from cache
    del: async (key) => {
        if (!redisClient) return false;
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    },

    // Check if key exists
    exists: async (key) => {
        if (!redisClient) return false;
        try {
            const exists = await redisClient.exists(key);
            return exists === 1;
        } catch (error) {
            logger.error('Cache exists error:', error);
            return false;
        }
    },

    // Increment counter
    incr: async (key, expiration = 3600) => {
        if (!redisClient) return 0;
        try {
            const count = await redisClient.incr(key);
            if (count === 1) {
                await redisClient.expire(key, expiration);
            }
            return count;
        } catch (error) {
            logger.error('Cache increment error:', error);
            return 0;
        }
    },

    // Get multiple keys
    mget: async (keys) => {
        if (!redisClient || !keys.length) return [];
        try {
            const values = await redisClient.mGet(keys);
            return values.map(value => value ? JSON.parse(value) : null);
        } catch (error) {
            logger.error('Cache mget error:', error);
            return [];
        }
    }
};

// Session store configuration
const getSessionStore = () => {
    if (!redisClient) {
        logger.warn('Redis not available, using memory store for sessions');
        return undefined; // Will use default memory store
    }

    const RedisStore = require('connect-redis')(require('express-session'));
    return new RedisStore({ client: redisClient });
};

module.exports = {
    connectDB,
    connectRedis,
    cache,
    redisClient: () => redisClient,
    getSessionStore
};