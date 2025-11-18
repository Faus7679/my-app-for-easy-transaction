const express = require('express');
const router = express.Router();
const currencyService = require('../services/currencyService');
const CurrencyPair = require('../models/CurrencyPair');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');

// Get exchange rate between two currencies
const getExchangeRate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { from, to, amount = 1 } = req.query;
        
        const result = await currencyService.getExchangeRate(from, to, parseFloat(amount));
        
        res.json({
            success: true,
            data: {
                from,
                to,
                amount: parseFloat(amount),
                rate: result.rate,
                convertedAmount: result.convertedAmount,
                source: result.source,
                timestamp: result.timestamp
            }
        });
        
    } catch (error) {
        logger.error('Get exchange rate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get exchange rate'
        });
    }
};

// Get all supported currencies
const getSupportedCurrencies = async (req, res) => {
    try {
        const currencies = currencyService.getSupportedCurrencies();
        
        res.json({
            success: true,
            data: {
                currencies
            }
        });
        
    } catch (error) {
        logger.error('Get supported currencies error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get supported currencies'
        });
    }
};

// Get currency corridors
const getCurrencyCorridors = async (req, res) => {
    try {
        const corridors = await currencyService.getCurrencyCorridors();
        
        res.json({
            success: true,
            data: {
                corridors
            }
        });
        
    } catch (error) {
        logger.error('Get currency corridors error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get currency corridors'
        });
    }
};

// Get historical rates
const getHistoricalRates = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        const { from, to, days = 30 } = req.query;
        
        const result = await currencyService.getHistoricalRates(from, to, parseInt(days));
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        logger.error('Get historical rates error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get historical rates'
        });
    }
};

// Get rate alerts
const getRateAlerts = async (req, res) => {
    try {
        const alerts = await currencyService.getRateAlerts();
        
        res.json({
            success: true,
            data: {
                alerts
            }
        });
        
    } catch (error) {
        logger.error('Get rate alerts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get rate alerts'
        });
    }
};

// Update currency rates (admin only)
const updateCurrencyRates = async (req, res) => {
    try {
        await currencyService.updateAllRates();
        
        res.json({
            success: true,
            message: 'Currency rates updated successfully'
        });
        
    } catch (error) {
        logger.error('Update currency rates error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update currency rates'
        });
    }
};

// Validation rules
const exchangeRateValidation = [
    query('from')
        .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'])
        .withMessage('Valid from currency is required'),
    
    query('to')
        .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'])
        .withMessage('Valid to currency is required'),
    
    query('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number')
];

const historicalRatesValidation = [
    query('from')
        .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'])
        .withMessage('Valid from currency is required'),
    
    query('to')
        .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'EGP'])
        .withMessage('Valid to currency is required'),
    
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365')
];

// Public routes
router.get('/rates', exchangeRateValidation, getExchangeRate);
router.get('/supported', getSupportedCurrencies);
router.get('/corridors', getCurrencyCorridors);
router.get('/historical', historicalRatesValidation, getHistoricalRates);
router.get('/alerts', getRateAlerts);

// Admin routes
router.post('/update-rates', authenticate, authorize('admin', 'super_admin'), updateCurrencyRates);

module.exports = router;