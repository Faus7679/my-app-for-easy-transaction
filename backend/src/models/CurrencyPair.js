const mongoose = require('mongoose');

const historicalRateSchema = new mongoose.Schema({
    rate: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['api', 'manual', 'calculated'],
        default: 'api'
    }
});

const currencyPairSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF', 'JPY', 'CAD', 'AUD']
    },
    to: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF', 'JPY', 'CAD', 'AUD']
    },
    
    // Current exchange rate
    currentRate: {
        type: Number,
        required: true,
        min: [0, 'Exchange rate must be positive']
    },
    
    // Rate with margin applied
    clientRate: {
        type: Number,
        required: true,
        min: [0, 'Client rate must be positive']
    },
    
    // Margin percentage (e.g., 0.02 for 2%)
    margin: {
        type: Number,
        default: 0.02,
        min: [0, 'Margin cannot be negative'],
        max: [0.10, 'Margin cannot exceed 10%']
    },
    
    // Rate source and metadata
    source: {
        type: String,
        enum: ['exchangerate-api', 'fixer', 'openexchangerates', 'manual', 'calculated'],
        default: 'exchangerate-api'
    },
    
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    
    // Historical rates for trend analysis
    historicalRates: [historicalRateSchema],
    
    // Rate volatility and statistics
    statistics: {
        dailyChange: Number,        // Change from yesterday
        weeklyChange: Number,       // Change from last week
        monthlyChange: Number,      // Change from last month
        volatility: Number,         // Statistical volatility measure
        averageRate30d: Number,     // 30-day average
        highestRate30d: Number,     // 30-day high
        lowestRate30d: Number       // 30-day low
    },
    
    // Active status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Update frequency in minutes
    updateFrequency: {
        type: Number,
        default: 15, // Update every 15 minutes
        min: [1, 'Update frequency must be at least 1 minute']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index for currency pair lookups
currencyPairSchema.index({ from: 1, to: 1 }, { unique: true });
currencyPairSchema.index({ lastUpdated: 1 });
currencyPairSchema.index({ isActive: 1 });

// Virtual for currency pair identifier
currencyPairSchema.virtual('pairId').get(function() {
    return `${this.from}_${this.to}`;
});

// Virtual to check if rate is stale
currencyPairSchema.virtual('isStale').get(function() {
    const staleThreshold = this.updateFrequency * 60 * 1000 * 2; // 2x update frequency
    return Date.now() - this.lastUpdated > staleThreshold;
});

// Pre-save middleware to calculate client rate
currencyPairSchema.pre('save', function(next) {
    if (this.isModified('currentRate') || this.isModified('margin')) {
        // Apply margin to get client rate
        // For most pairs, we add margin (rate increases)
        // For some reverse pairs, we might subtract margin
        this.clientRate = this.currentRate * (1 + this.margin);
    }
    next();
});

// Pre-save middleware to manage historical rates
currencyPairSchema.pre('save', function(next) {
    if (this.isModified('currentRate')) {
        // Add current rate to historical rates
        this.historicalRates.unshift({
            rate: this.currentRate,
            timestamp: new Date(),
            source: this.source
        });
        
        // Keep only last 1440 entries (1 day at 1-minute intervals)
        if (this.historicalRates.length > 1440) {
            this.historicalRates = this.historicalRates.slice(0, 1440);
        }
        
        // Update statistics
        this.updateStatistics();
    }
    next();
});

// Method to update statistics
currencyPairSchema.methods.updateStatistics = function() {
    const rates = this.historicalRates;
    if (rates.length === 0) return;
    
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    // Get rates for different time periods
    const dayOldRate = rates.find(r => r.timestamp <= oneDayAgo)?.rate;
    const weekOldRate = rates.find(r => r.timestamp <= oneWeekAgo)?.rate;
    const monthOldRate = rates.find(r => r.timestamp <= oneMonthAgo)?.rate;
    
    // Calculate changes
    if (dayOldRate) {
        this.statistics.dailyChange = ((this.currentRate - dayOldRate) / dayOldRate) * 100;
    }
    if (weekOldRate) {
        this.statistics.weeklyChange = ((this.currentRate - weekOldRate) / weekOldRate) * 100;
    }
    if (monthOldRate) {
        this.statistics.monthlyChange = ((this.currentRate - monthOldRate) / monthOldRate) * 100;
    }
    
    // Calculate 30-day statistics
    const thirtyDayRates = rates
        .filter(r => r.timestamp >= oneMonthAgo)
        .map(r => r.rate);
    
    if (thirtyDayRates.length > 0) {
        this.statistics.averageRate30d = thirtyDayRates.reduce((sum, rate) => sum + rate, 0) / thirtyDayRates.length;
        this.statistics.highestRate30d = Math.max(...thirtyDayRates);
        this.statistics.lowestRate30d = Math.min(...thirtyDayRates);
        
        // Calculate volatility (standard deviation)
        const mean = this.statistics.averageRate30d;
        const squaredDifferences = thirtyDayRates.map(rate => Math.pow(rate - mean, 2));
        const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / thirtyDayRates.length;
        this.statistics.volatility = Math.sqrt(variance);
    }
};

// Method to get rate for specific amount (with volume discounts if applicable)
currencyPairSchema.methods.getRateForAmount = function(amount) {
    let rate = this.clientRate;
    
    // Volume-based pricing (better rates for larger amounts)
    if (amount >= 10000) {
        rate = this.currentRate * (1 + this.margin * 0.5); // 50% discount on margin
    } else if (amount >= 5000) {
        rate = this.currentRate * (1 + this.margin * 0.7); // 30% discount on margin
    } else if (amount >= 1000) {
        rate = this.currentRate * (1 + this.margin * 0.9); // 10% discount on margin
    }
    
    return rate;
};

// Method to convert amount
currencyPairSchema.methods.convertAmount = function(amount, applyVolumeDiscount = true) {
    const rate = applyVolumeDiscount ? this.getRateForAmount(amount) : this.clientRate;
    return {
        originalAmount: amount,
        convertedAmount: amount * rate,
        rate: rate,
        margin: this.margin,
        timestamp: new Date()
    };
};

// Static method to get or create currency pair
currencyPairSchema.statics.getOrCreatePair = async function(from, to) {
    let pair = await this.findOne({ from: from.toUpperCase(), to: to.toUpperCase() });
    
    if (!pair) {
        // Create new pair with default rate of 1 (will be updated by rate service)
        pair = new this({
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            currentRate: 1,
            clientRate: 1.02, // Default 2% margin
            margin: 0.02
        });
        await pair.save();
    }
    
    return pair;
};

// Static method to get all active pairs
currencyPairSchema.statics.getActivePairs = function() {
    return this.find({ isActive: true }).sort({ from: 1, to: 1 });
};

// Static method to get stale pairs that need updating
currencyPairSchema.statics.getStalePairs = function() {
    const staleTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    return this.find({
        isActive: true,
        lastUpdated: { $lt: staleTime }
    });
};

// Static method to update multiple pairs
currencyPairSchema.statics.updateRates = async function(rateUpdates) {
    const bulkOps = rateUpdates.map(update => ({
        updateOne: {
            filter: { from: update.from, to: update.to },
            update: {
                $set: {
                    currentRate: update.rate,
                    lastUpdated: new Date(),
                    source: update.source || 'api'
                }
            },
            upsert: true
        }
    }));
    
    return this.bulkWrite(bulkOps);
};

// Method to get trend direction
currencyPairSchema.methods.getTrend = function() {
    if (!this.statistics.dailyChange) return 'neutral';
    
    if (this.statistics.dailyChange > 0.5) return 'up';
    if (this.statistics.dailyChange < -0.5) return 'down';
    return 'neutral';
};

// Method to format rate for display
currencyPairSchema.methods.formatRate = function(decimals = 4) {
    return {
        from: this.from,
        to: this.to,
        rate: parseFloat(this.clientRate.toFixed(decimals)),
        change: this.statistics.dailyChange ? parseFloat(this.statistics.dailyChange.toFixed(2)) : 0,
        trend: this.getTrend(),
        lastUpdated: this.lastUpdated
    };
};

module.exports = mongoose.model('CurrencyPair', currencyPairSchema);