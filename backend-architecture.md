# EasyMove Backend Architecture with Node.js

## 🏗️ Recommended Backend Stack

### **Core Technologies**
- **Node.js + Express.js** - Web server and API framework
- **MongoDB/PostgreSQL** - Database for user data and transactions
- **Redis** - Caching and session management
- **JWT** - Secure authentication
- **Socket.io** - Real-time updates
- **Bull Queue** - Background job processing

## 📁 Backend Project Structure

```
easymove-backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   ├── currencyController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Currency.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── transactions.js
│   ├── services/
│   │   ├── currencyService.js
│   │   ├── paymentService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validator.js
│   │   └── encryption.js
│   └── config/
│       ├── database.js
│       ├── redis.js
│       └── config.js
├── package.json
├── .env
└── server.js
```

## 🔧 Core Backend Implementation

### **1. Server Setup (server.js)**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing and compression
app.use(express.json({ limit: '10mb' }));
app.use(compression());
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://easymove.app',
    credentials: true
}));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/currencies', require('./src/routes/currencies'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`EasyMove API server running on port ${PORT}`);
});
```

### **2. Transaction Controller**
```javascript
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { processPayment } = require('../services/paymentService');

exports.createTransaction = async (req, res) => {
    try {
        const { 
            recipientEmail, 
            amount, 
            senderCurrency, 
            recipientCurrency,
            paymentMethod 
        } = req.body;

        // Validate user balance
        const user = await User.findById(req.user.id);
        if (user.balance < amount) {
            return res.status(400).json({ 
                error: 'Insufficient balance' 
            });
        }

        // Create transaction
        const transaction = new Transaction({
            senderId: req.user.id,
            recipientEmail,
            amount,
            senderCurrency,
            recipientCurrency,
            paymentMethod,
            status: 'pending',
            exchangeRate: await getCurrencyRate(senderCurrency, recipientCurrency)
        });

        // Process payment
        const paymentResult = await processPayment({
            amount,
            currency: senderCurrency,
            paymentMethod,
            userId: req.user.id
        });

        if (paymentResult.success) {
            transaction.status = 'processing';
            transaction.paymentId = paymentResult.paymentId;
            
            // Update user balance
            user.balance -= amount;
            await user.save();
        }

        await transaction.save();

        // Send real-time update
        req.io.to(req.user.id).emit('transactionUpdate', {
            transactionId: transaction._id,
            status: transaction.status
        });

        // Send notification
        await sendNotification(user.email, 'Transaction initiated', {
            transactionId: transaction._id,
            amount,
            currency: senderCurrency
        });

        res.status(201).json({
            success: true,
            transaction: transaction.toJSON()
        });

    } catch (error) {
        console.error('Transaction creation error:', error);
        res.status(500).json({ 
            error: 'Transaction failed. Please try again.' 
        });
    }
};
```

### **3. Currency Service with Real APIs**
```javascript
const axios = require('axios');
const redis = require('../config/redis');

class CurrencyService {
    constructor() {
        this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/';
    }

    async getExchangeRate(from, to) {
        const cacheKey = `rate:${from}:${to}`;
        
        // Check cache first
        const cachedRate = await redis.get(cacheKey);
        if (cachedRate) {
            return parseFloat(cachedRate);
        }

        try {
            const response = await axios.get(`${this.baseUrl}${from}`);
            const rate = response.data.rates[to];
            
            // Cache for 5 minutes
            await redis.setex(cacheKey, 300, rate.toString());
            
            return rate;
        } catch (error) {
            console.error('Currency API error:', error);
            // Fallback to stored rates
            return this.getFallbackRate(from, to);
        }
    }

    async updateAllRates() {
        // Background job to update currency rates
        const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES'];
        
        for (const base of currencies) {
            try {
                const response = await axios.get(`${this.baseUrl}${base}`);
                const rates = response.data.rates;
                
                // Store in database
                await this.storeRates(base, rates);
            } catch (error) {
                console.error(`Failed to update rates for ${base}:`, error);
            }
        }
    }
}

module.exports = new CurrencyService();
```

### **4. User Authentication**
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            balance: 5000.00, // Welcome bonus
            isVerified: false
        });

        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed. Please try again.' 
        });
    }
};
```

## 🔄 Background Job Processing

### **Queue System for Resilience**
```javascript
const Queue = require('bull');
const redis = require('../config/redis');

const transactionQueue = new Queue('transaction processing', {
    redis: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
    }
});

// Process failed transactions
transactionQueue.process(async (job) => {
    const { transactionId } = job.data;
    
    try {
        const transaction = await Transaction.findById(transactionId);
        
        if (transaction.status === 'failed') {
            // Retry payment processing
            const result = await retryPayment(transaction);
            
            if (result.success) {
                transaction.status = 'completed';
                await transaction.save();
                
                // Notify user
                await sendNotification(transaction.senderId, 'Transaction completed');
            }
        }
    } catch (error) {
        console.error('Background job failed:', error);
        throw error; // Will retry automatically
    }
});

// Add failed transaction to queue
exports.queueFailedTransaction = (transactionId) => {
    transactionQueue.add(
        { transactionId },
        {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        }
    );
};
```

## 🛡️ Security Enhancements

### **Enhanced Security Middleware**
```javascript
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Transaction rate limiting
const transactionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // max 5 transactions per minute
    message: 'Too many transactions. Please wait.'
});

// Slow down repeated requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // allow 2 requests per 15 minutes at full speed
    delayMs: 500 // slow down subsequent requests by 500ms per request
});

// Input validation
const { body, validationResult } = require('express-validator');

const validateTransaction = [
    body('amount').isFloat({ min: 0.01 }).toFloat(),
    body('recipientEmail').isEmail().normalizeEmail(),
    body('senderCurrency').isIn(['USD', 'EUR', 'GBP', 'NGN']),
    body('recipientCurrency').isIn(['USD', 'EUR', 'GBP', 'NGN']),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
```

## 📊 Database Schema

### **MongoDB Models**
```javascript
// User Model
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    preferredCurrency: { type: String, default: 'USD' },
    isVerified: { type: Boolean, default: false },
    paymentMethods: [{
        type: { type: String, enum: ['card', 'bank', 'wallet'] },
        details: { type: mongoose.Schema.Types.Mixed },
        isDefault: { type: Boolean, default: false }
    }],
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
}, {
    timestamps: true
});

// Transaction Model
const transactionSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    senderCurrency: { type: String, required: true },
    recipientCurrency: { type: String, required: true },
    exchangeRate: { type: Number, required: true },
    fee: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: { type: String, required: true },
    paymentId: { type: String },
    failureReason: { type: String },
    retryCount: { type: Number, default: 0 }
}, {
    timestamps: true
});
```

## 🚀 Frontend Integration Changes

### **Update your current app.js to use real backend:**
```javascript
// Replace your current APP_CONFIG
const APP_CONFIG = {
    domain: 'easymove.app',
    apiEndpoint: 'https://api.easymove.app',
    version: '2.0.0',
    offlineSupport: true,
    maxRetries: 3,
    retryDelay: 1000
};

// Real authentication
async function loginUser(email, password) {
    try {
        const response = await fetch(`${APP_CONFIG.apiEndpoint}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            return data;
        }
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

// Real transaction processing
async function processTransaction(transactionData) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${APP_CONFIG.apiEndpoint}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(transactionData)
        });
        
        return await response.json();
    } catch (error) {
        // Fallback to offline storage
        pendingTransactions.push(transactionData);
        localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
        throw error;
    }
}
```

## 📈 Benefits of Node.js Backend

### **Resilience Improvements:**
1. **Database Persistence** - No data loss on browser refresh
2. **Real-time Updates** - WebSocket connections for live updates
3. **Retry Logic** - Background jobs handle failed transactions
4. **Load Balancing** - Multiple server instances for high availability
5. **Monitoring** - Server logs and error tracking
6. **Backup Systems** - Database replication and backups

### **Security Enhancements:**
1. **Server-side Validation** - Cannot be bypassed by users
2. **Encrypted Storage** - Sensitive data properly encrypted
3. **Rate Limiting** - Prevents abuse and DDoS attacks
4. **Authentication** - Secure JWT-based authentication
5. **HTTPS Only** - All API communications encrypted

### **Performance Benefits:**
1. **Caching** - Redis for fast data access
2. **CDN Integration** - Static asset optimization
3. **Database Optimization** - Proper indexing and queries
4. **Background Processing** - Heavy tasks don't block UI

Would you like me to create the complete Node.js backend structure for your EasyMove app? This would transform it from a demo app into a production-ready financial platform!