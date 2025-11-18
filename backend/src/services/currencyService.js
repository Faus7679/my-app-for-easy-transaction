const axios = require('axios');
const CurrencyPair = require('../models/CurrencyPair');
const { cache } = require('../config/database');
const logger = require('../utils/logger');

class CurrencyService {
    constructor() {
        this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
        this.baseUrl = process.env.EXCHANGE_RATE_BASE_URL || 'https://api.exchangerate-api.com/v4/latest/';
        this.fallbackRates = {
            // Default fallback rates (should be updated regularly)
            'USD_EUR': 0.85,
            'USD_GBP': 0.73,
            'USD_NGN': 410.50,
            'USD_GHS': 6.15,
            'USD_KES': 110.25,
            'USD_ZAR': 15.80,
            'USD_EGP': 30.85,
            'EUR_GBP': 0.86,
            'EUR_USD': 1.18,
            'GBP_USD': 1.37
        };
    }

    // Get exchange rate between two currencies
    async getExchangeRate(from, to, amount = 1) {
        try {
            // Check if same currency
            if (from === to) {
                return {
                    rate: 1,
                    convertedAmount: amount,
                    source: 'direct',
                    timestamp: new Date()
                };
            }

            // Try to get from database first
            const pair = await CurrencyPair.findOne({ from, to });
            
            if (pair && !pair.isStale) {
                const convertedAmount = amount * pair.getRateForAmount(amount);
                return {
                    rate: pair.getRateForAmount(amount),
                    convertedAmount,
                    source: 'database',
                    timestamp: pair.lastUpdated
                };
            }

            // Fetch fresh rate from API
            const freshRate = await this.fetchRateFromAPI(from, to);
            
            if (freshRate) {
                // Update or create currency pair
                await this.updateCurrencyPair(from, to, freshRate.rate, 'api');
                
                const convertedAmount = amount * freshRate.rate;
                return {
                    rate: freshRate.rate,
                    convertedAmount,
                    source: 'api',
                    timestamp: new Date()
                };
            }

            // Fallback to stored rates
            return this.getFallbackRate(from, to, amount);

        } catch (error) {
            logger.error(`Failed to get exchange rate ${from}/${to}:`, error);
            return this.getFallbackRate(from, to, amount);
        }
    }

    // Fetch rate from external API
    async fetchRateFromAPI(from, to) {
        try {
            const cacheKey = `rate_${from}_${to}_${new Date().toISOString().slice(0, 10)}`;
            
            // Check cache first (rates cached for 1 hour)
            const cachedRate = await cache.get(cacheKey);
            if (cachedRate) {
                return cachedRate;
            }

            // Fetch from API
            const url = `${this.baseUrl}${from}`;
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'EasyMove/2.0'
                }
            });

            if (response.data && response.data.rates && response.data.rates[to]) {
                const rate = response.data.rates[to];
                const result = {
                    rate,
                    source: 'api',
                    timestamp: new Date()
                };

                // Cache for 1 hour
                await cache.set(cacheKey, result, 3600);
                
                return result;
            }

            throw new Error(`Rate not found for ${from}/${to}`);

        } catch (error) {
            logger.error(`API fetch failed for ${from}/${to}:`, error.message);
            return null;
        }
    }

    // Update currency pair in database
    async updateCurrencyPair(from, to, rate, source = 'api') {
        try {
            const pair = await CurrencyPair.findOneAndUpdate(
                { from, to },
                {
                    currentRate: rate,
                    lastUpdated: new Date(),
                    source
                },
                {
                    upsert: true,
                    new: true
                }
            );

            return pair;

        } catch (error) {
            logger.error(`Failed to update currency pair ${from}/${to}:`, error);
            throw error;
        }
    }

    // Get fallback rate
    getFallbackRate(from, to, amount = 1) {
        const pairKey = `${from}_${to}`;
        const reversePairKey = `${to}_${from}`;
        
        let rate = this.fallbackRates[pairKey];
        
        if (!rate && this.fallbackRates[reversePairKey]) {
            rate = 1 / this.fallbackRates[reversePairKey];
        }

        if (!rate) {
            // Try via USD as intermediary
            const fromUSD = this.fallbackRates[`${from}_USD`] || (1 / (this.fallbackRates[`USD_${from}`] || 1));
            const toUSD = this.fallbackRates[`${to}_USD`] || (1 / (this.fallbackRates[`USD_${to}`] || 1));
            
            if (fromUSD && toUSD) {
                rate = toUSD / fromUSD;
            }
        }

        if (!rate) {
            logger.warn(`No fallback rate available for ${from}/${to}, using 1.0`);
            rate = 1.0;
        }

        const convertedAmount = amount * rate;
        
        return {
            rate,
            convertedAmount,
            source: 'fallback',
            timestamp: new Date()
        };
    }

    // Update all currency rates
    async updateAllRates() {
        try {
            logger.info('Starting currency rates update...');
            
            const baseCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'];
            const targetCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'];
            
            const updates = [];
            
            for (const base of baseCurrencies) {
                try {
                    const url = `${this.baseUrl}${base}`;
                    const response = await axios.get(url, { timeout: 15000 });
                    
                    if (response.data && response.data.rates) {
                        for (const target of targetCurrencies) {
                            if (base !== target && response.data.rates[target]) {
                                updates.push({
                                    from: base,
                                    to: target,
                                    rate: response.data.rates[target],
                                    source: 'api'
                                });
                            }
                        }
                    }
                    
                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    logger.error(`Failed to fetch rates for ${base}:`, error.message);
                }
            }
            
            // Bulk update currency pairs
            if (updates.length > 0) {
                await CurrencyPair.updateRates(updates);
                logger.info(`Updated ${updates.length} currency rates`);
            }
            
            // Update fallback rates cache
            await this.updateFallbackRatesCache();
            
            logger.info('Currency rates update completed');
            
        } catch (error) {
            logger.error('Currency rates update failed:', error);
            throw error;
        }
    }

    // Update fallback rates cache
    async updateFallbackRatesCache() {
        try {
            const pairs = await CurrencyPair.find({ isActive: true }).limit(100);
            const fallbackRates = {};
            
            pairs.forEach(pair => {
                fallbackRates[`${pair.from}_${pair.to}`] = pair.currentRate;
            });
            
            await cache.set('fallback_rates', fallbackRates, 24 * 60 * 60); // Cache for 24 hours
            
            logger.info('Fallback rates cache updated');
            
        } catch (error) {
            logger.error('Failed to update fallback rates cache:', error);
        }
    }

    // Get all supported currencies
    getSupportedCurrencies() {
        return [
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
            { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
            { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
            { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
            { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
            { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' }
        ];
    }

    // Get currency corridors (supported currency pairs)
    async getCurrencyCorridors() {
        try {
            const corridors = await CurrencyPair.find({ isActive: true })
                .select('from to currentRate clientRate margin lastUpdated statistics')
                .sort({ from: 1, to: 1 });
            
            return corridors.map(corridor => ({
                from: corridor.from,
                to: corridor.to,
                rate: corridor.clientRate,
                margin: corridor.margin,
                lastUpdated: corridor.lastUpdated,
                trend: corridor.getTrend(),
                dailyChange: corridor.statistics?.dailyChange || 0
            }));
            
        } catch (error) {
            logger.error('Failed to get currency corridors:', error);
            throw error;
        }
    }

    // Calculate transaction fees for currency conversion
    calculateConversionFees(amount, fromCurrency, toCurrency) {
        // Base conversion fee: 0.5% of amount
        let conversionFee = amount * 0.005;
        
        // Minimum fee: $1 USD equivalent
        const minFeeUSD = 1;
        const minFee = this.convertToLocalCurrency(minFeeUSD, 'USD', fromCurrency);
        
        if (conversionFee < minFee) {
            conversionFee = minFee;
        }
        
        // Maximum fee: $50 USD equivalent
        const maxFeeUSD = 50;
        const maxFee = this.convertToLocalCurrency(maxFeeUSD, 'USD', fromCurrency);
        
        if (conversionFee > maxFee) {
            conversionFee = maxFee;
        }
        
        return {
            conversionFee: parseFloat(conversionFee.toFixed(2)),
            feePercentage: (conversionFee / amount * 100).toFixed(2)
        };
    }

    // Convert amount to local currency (for fee calculation)
    convertToLocalCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        // Simple conversion using fallback rates
        const pairKey = `${fromCurrency}_${toCurrency}`;
        const rate = this.fallbackRates[pairKey] || 1;
        
        return amount * rate;
    }

    // Get historical rates for a currency pair
    async getHistoricalRates(from, to, days = 30) {
        try {
            const pair = await CurrencyPair.findOne({ from, to });
            
            if (!pair) {
                throw new Error(`Currency pair ${from}/${to} not found`);
            }
            
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const historicalRates = pair.historicalRates
                .filter(rate => rate.timestamp >= cutoffDate)
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, days);
            
            return {
                pair: `${from}/${to}`,
                currentRate: pair.currentRate,
                historicalRates: historicalRates.map(rate => ({
                    rate: rate.rate,
                    timestamp: rate.timestamp,
                    source: rate.source
                })),
                statistics: pair.statistics
            };
            
        } catch (error) {
            logger.error(`Failed to get historical rates for ${from}/${to}:`, error);
            throw error;
        }
    }

    // Get rate alerts (for significant rate changes)
    async getRateAlerts() {
        try {
            const pairs = await CurrencyPair.find({
                isActive: true,
                $or: [
                    { 'statistics.dailyChange': { $gte: 2 } },  // 2% increase
                    { 'statistics.dailyChange': { $lte: -2 } }  // 2% decrease
                ]
            }).select('from to currentRate statistics');
            
            return pairs.map(pair => ({
                pair: `${pair.from}/${pair.to}`,
                currentRate: pair.currentRate,
                change: pair.statistics.dailyChange,
                alert: pair.statistics.dailyChange >= 2 ? 'increase' : 'decrease'
            }));
            
        } catch (error) {
            logger.error('Failed to get rate alerts:', error);
            throw error;
        }
    }
}

module.exports = new CurrencyService();