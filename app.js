// =============================================================================
// APP CONFIGURATION & SECURITY
// =============================================================================

// App Configuration
const APP_CONFIG = {
    domain: 'easymove.app', // Your domain here
    apiEndpoint: 'https://api.easymove.app',
    version: '2.0.0',
    offlineSupport: true,
    maxRetries: 3,
    retryDelay: 1000
};

// Connection Status
let isOnline = navigator.onLine;
let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');

// DOM Elements for mobile features
let connectionStatus, statusIcon, statusText, sendButton, btnText, btnLoader;

// User account and app state
let currentUser = null;
let balance = 5000.00;
let transactions = [];
let userCurrency = 'USD';

// User account structure
const userAccounts = {};

// Payment methods
const paymentMethods = {
    'bank-transfer': { name: 'Bank Transfer', icon: '🏦', fee: 0 },
    'debit-card': { name: 'Debit Card', icon: '💳', fee: 1.5 },
    'credit-card': { name: 'Credit Card', icon: '💳', fee: 2.5 },
    'digital-wallet': { name: 'Digital Wallet', icon: '📱', fee: 1.0 },
    'crypto': { name: 'Cryptocurrency', icon: '₿', fee: 0.5 }
};

// Comprehensive currency data with country info, flags, and rates
const currencyData = {
    // Major Currencies
    USD: { rate: 1.0, country: "United States", flag: "🇺🇸", code: "US", tier: 1 },
    
    // Eurozone Countries (EUR)
    EUR_DE: { rate: 0.85, country: "Germany", flag: "🇩🇪", code: "DE", tier: 1, currency: "EUR" },
    EUR_FR: { rate: 0.85, country: "France", flag: "🇫🇷", code: "FR", tier: 1, currency: "EUR" },
    EUR_IT: { rate: 0.85, country: "Italy", flag: "🇮🇹", code: "IT", tier: 1, currency: "EUR" },
    EUR_ES: { rate: 0.85, country: "Spain", flag: "🇪🇸", code: "ES", tier: 1, currency: "EUR" },
    EUR_NL: { rate: 0.85, country: "Netherlands", flag: "🇳🇱", code: "NL", tier: 1, currency: "EUR" },
    EUR_BE: { rate: 0.85, country: "Belgium", flag: "🇧🇪", code: "BE", tier: 1, currency: "EUR" },
    EUR_AT: { rate: 0.85, country: "Austria", flag: "🇦🇹", code: "AT", tier: 1, currency: "EUR" },
    EUR_PT: { rate: 0.85, country: "Portugal", flag: "🇵🇹", code: "PT", tier: 1, currency: "EUR" },
    EUR_IE: { rate: 0.85, country: "Ireland", flag: "🇮🇪", code: "IE", tier: 1, currency: "EUR" },
    EUR_FI: { rate: 0.85, country: "Finland", flag: "🇫🇮", code: "FI", tier: 1, currency: "EUR" },
    EUR_GR: { rate: 0.85, country: "Greece", flag: "🇬🇷", code: "GR", tier: 1, currency: "EUR" },
    EUR_LU: { rate: 0.85, country: "Luxembourg", flag: "🇱🇺", code: "LU", tier: 1, currency: "EUR" },
    EUR_SK: { rate: 0.85, country: "Slovakia", flag: "🇸🇰", code: "SK", tier: 1, currency: "EUR" },
    EUR_SI: { rate: 0.85, country: "Slovenia", flag: "🇸🇮", code: "SI", tier: 1, currency: "EUR" },
    EUR_EE: { rate: 0.85, country: "Estonia", flag: "🇪🇪", code: "EE", tier: 1, currency: "EUR" },
    EUR_LV: { rate: 0.85, country: "Latvia", flag: "🇱🇻", code: "LV", tier: 1, currency: "EUR" },
    EUR_LT: { rate: 0.85, country: "Lithuania", flag: "🇱🇹", code: "LT", tier: 1, currency: "EUR" },
    EUR_CY: { rate: 0.85, country: "Cyprus", flag: "🇨🇾", code: "CY", tier: 1, currency: "EUR" },
    EUR_MT: { rate: 0.85, country: "Malta", flag: "🇲🇹", code: "MT", tier: 1, currency: "EUR" },
    EUR_HR: { rate: 0.85, country: "Croatia", flag: "🇭🇷", code: "HR", tier: 1, currency: "EUR" },
    GBP: { rate: 0.73, country: "United Kingdom", flag: "🇬🇧", code: "GB", tier: 1 },
    JPY: { rate: 110.0, country: "Japan", flag: "🇯🇵", code: "JP", tier: 1 },
    CAD: { rate: 1.25, country: "Canada", flag: "🇨🇦", code: "CA", tier: 1 },
    AUD: { rate: 1.35, country: "Australia", flag: "🇦🇺", code: "AU", tier: 1 },
    CHF: { rate: 0.92, country: "Switzerland", flag: "🇨🇭", code: "CH", tier: 1 },
    CNY: { rate: 6.45, country: "China", flag: "🇨🇳", code: "CN", tier: 1 },
    
    // Asian Currencies
    INR: { rate: 74.5, country: "India", flag: "🇮🇳", code: "IN", tier: 2 },
    KRW: { rate: 1180.0, country: "South Korea", flag: "🇰🇷", code: "KR", tier: 2 },
    SGD: { rate: 1.35, country: "Singapore", flag: "🇸🇬", code: "SG", tier: 1 },
    HKD: { rate: 7.8, country: "Hong Kong", flag: "🇭🇰", code: "HK", tier: 1 },
    THB: { rate: 33.0, country: "Thailand", flag: "🇹🇭", code: "TH", tier: 2 },
    MYR: { rate: 4.15, country: "Malaysia", flag: "🇲🇾", code: "MY", tier: 2 },
    PHP: { rate: 50.5, country: "Philippines", flag: "🇵🇭", code: "PH", tier: 2 },
    IDR: { rate: 14250.0, country: "Indonesia", flag: "🇮🇩", code: "ID", tier: 2 },
    VND: { rate: 23000.0, country: "Vietnam", flag: "🇻🇳", code: "VN", tier: 2 },
    
    // European Currencies
    NOK: { rate: 8.6, country: "Norway", flag: "🇳🇴", code: "NO", tier: 1 },
    SEK: { rate: 8.9, country: "Sweden", flag: "🇸🇪", code: "SE", tier: 1 },
    DKK: { rate: 6.35, country: "Denmark", flag: "🇩🇰", code: "DK", tier: 1 },
    PLN: { rate: 3.9, country: "Poland", flag: "🇵🇱", code: "PL", tier: 2 },
    CZK: { rate: 21.8, country: "Czech Republic", flag: "🇨🇿", code: "CZ", tier: 2 },
    HUF: { rate: 295.0, country: "Hungary", flag: "🇭🇺", code: "HU", tier: 2 },
    RON: { rate: 4.2, country: "Romania", flag: "🇷🇴", code: "RO", tier: 2 },
    BGN: { rate: 1.66, country: "Bulgaria", flag: "🇧🇬", code: "BG", tier: 2 },
    ISK: { rate: 129.0, country: "Iceland", flag: "🇮🇸", code: "IS", tier: 2 },
    
    // Americas Currencies
    BRL: { rate: 5.2, country: "Brazil", flag: "🇧🇷", code: "BR", tier: 2 },
    MXN: { rate: 20.1, country: "Mexico", flag: "🇲🇽", code: "MX", tier: 2 },
    ARS: { rate: 98.5, country: "Argentina", flag: "🇦🇷", code: "AR", tier: 3 },
    CLP: { rate: 775.0, country: "Chile", flag: "🇨🇱", code: "CL", tier: 2 },
    COP: { rate: 3850.0, country: "Colombia", flag: "🇨🇴", code: "CO", tier: 2 },
    PEN: { rate: 3.65, country: "Peru", flag: "🇵🇪", code: "PE", tier: 2 },
    UYU: { rate: 43.8, country: "Uruguay", flag: "🇺🇾", code: "UY", tier: 2 },
    BOB: { rate: 6.9, country: "Bolivia", flag: "🇧🇴", code: "BO", tier: 3 },
    PYG: { rate: 6950.0, country: "Paraguay", flag: "🇵🇾", code: "PY", tier: 3 },
    
    // Middle East & Africa
    AED: { rate: 3.67, country: "United Arab Emirates", flag: "🇦🇪", code: "AE", tier: 1 },
    SAR: { rate: 3.75, country: "Saudi Arabia", flag: "🇸🇦", code: "SA", tier: 1 },
    ILS: { rate: 3.25, country: "Israel", flag: "🇮🇱", code: "IL", tier: 1 },
    TRY: { rate: 8.45, country: "Turkey", flag: "🇹🇷", code: "TR", tier: 2 },
    EGP: { rate: 15.7, country: "Egypt", flag: "🇪🇬", code: "EG", tier: 2 },
    ZAR: { rate: 14.8, country: "South Africa", flag: "🇿🇦", code: "ZA", tier: 2 },
    NGN: { rate: 411.0, country: "Nigeria", flag: "🇳🇬", code: "NG", tier: 2 },
    GHS: { rate: 6.1, country: "Ghana", flag: "🇬🇭", code: "GH", tier: 2 },
    KES: { rate: 108.5, country: "Kenya", flag: "🇰🇪", code: "KE", tier: 2 },
    UGX: { rate: 3520.0, country: "Uganda", flag: "🇺🇬", code: "UG", tier: 2 },
    TZS: { rate: 2310.0, country: "Tanzania", flag: "🇹🇿", code: "TZ", tier: 2 },
    
    // Additional African Currencies
    ETB: { rate: 47.5, country: "Ethiopia", flag: "🇪🇹", code: "ET", tier: 2 },
    RWF: { rate: 1025.0, country: "Rwanda", flag: "🇷🇼", code: "RW", tier: 2 },
    BWP: { rate: 11.2, country: "Botswana", flag: "🇧🇼", code: "BW", tier: 2 },
    NAD: { rate: 14.8, country: "Namibia", flag: "🇳🇦", code: "NA", tier: 2 },
    SZL: { rate: 14.8, country: "Eswatini", flag: "🇸🇿", code: "SZ", tier: 2 },
    LSL: { rate: 14.8, country: "Lesotho", flag: "🇱🇸", code: "LS", tier: 2 },
    MWK: { rate: 820.0, country: "Malawi", flag: "🇲🇼", code: "MW", tier: 3 },
    ZMW: { rate: 16.8, country: "Zambia", flag: "🇿🇲", code: "ZM", tier: 3 },
    AOA: { rate: 665.0, country: "Angola", flag: "🇦🇴", code: "AO", tier: 3 },
    MZN: { rate: 63.8, country: "Mozambique", flag: "🇲🇿", code: "MZ", tier: 3 },
    MGA: { rate: 4150.0, country: "Madagascar", flag: "🇲🇬", code: "MG", tier: 3 },
    MUR: { rate: 45.2, country: "Mauritius", flag: "🇲🇺", code: "MU", tier: 2 },
    SCR: { rate: 13.6, country: "Seychelles", flag: "🇸🇨", code: "SC", tier: 2 },
    CVE: { rate: 93.5, country: "Cape Verde", flag: "🇨🇻", code: "CV", tier: 3 },
    STP: { rate: 20680.0, country: "São Tomé and Príncipe", flag: "🇸🇹", code: "ST", tier: 3 },
    GMD: { rate: 52.5, country: "Gambia", flag: "🇬🇲", code: "GM", tier: 3 },
    GNF: { rate: 8650.0, country: "Guinea", flag: "🇬🇳", code: "GN", tier: 3 },
    SLL: { rate: 11420.0, country: "Sierra Leone", flag: "🇸🇱", code: "SL", tier: 3 },
    LRD: { rate: 151.0, country: "Liberia", flag: "🇱🇷", code: "LR", tier: 3 },
    // West African CFA Franc (XOF) Countries
    XOF_BJ: { rate: 555.0, country: "Benin", flag: "🇧🇯", code: "BJ", tier: 2, currency: "XOF" },
    XOF_BF: { rate: 555.0, country: "Burkina Faso", flag: "🇧🇫", code: "BF", tier: 2, currency: "XOF" },
    XOF_CI: { rate: 555.0, country: "Côte d'Ivoire", flag: "🇨🇮", code: "CI", tier: 2, currency: "XOF" },
    XOF_GW: { rate: 555.0, country: "Guinea-Bissau", flag: "🇬🇼", code: "GW", tier: 2, currency: "XOF" },
    XOF_ML: { rate: 555.0, country: "Mali", flag: "🇲🇱", code: "ML", tier: 2, currency: "XOF" },
    XOF_NE: { rate: 555.0, country: "Niger", flag: "🇳🇪", code: "NE", tier: 2, currency: "XOF" },
    XOF_SN: { rate: 555.0, country: "Senegal", flag: "🇸🇳", code: "SN", tier: 2, currency: "XOF" },
    XOF_TG: { rate: 555.0, country: "Togo", flag: "🇹🇬", code: "TG", tier: 2, currency: "XOF" },
    
    // Central African CFA Franc (XAF) Countries
    XAF_CM: { rate: 555.0, country: "Cameroon", flag: "🇨🇲", code: "CM", tier: 2, currency: "XAF" },
    XAF_CF: { rate: 555.0, country: "Central African Republic", flag: "🇨🇫", code: "CF", tier: 2, currency: "XAF" },
    XAF_TD: { rate: 555.0, country: "Chad", flag: "🇹🇩", code: "TD", tier: 2, currency: "XAF" },
    XAF_CG: { rate: 555.0, country: "Republic of the Congo", flag: "🇨🇬", code: "CG", tier: 2, currency: "XAF" },
    XAF_GQ: { rate: 555.0, country: "Equatorial Guinea", flag: "🇬🇶", code: "GQ", tier: 2, currency: "XAF" },
    XAF_GA: { rate: 555.0, country: "Gabon", flag: "🇬🇦", code: "GA", tier: 2, currency: "XAF" },
    CDF: { rate: 2000.0, country: "DR Congo", flag: "🇨🇩", code: "CD", tier: 3 },
    DJF: { rate: 178.0, country: "Djibouti", flag: "🇩🇯", code: "DJ", tier: 3 },
    ERN: { rate: 15.0, country: "Eritrea", flag: "🇪🇷", code: "ER", tier: 3 },
    SOS: { rate: 570.0, country: "Somalia", flag: "🇸🇴", code: "SO", tier: 3 },
    SDG: { rate: 445.0, country: "Sudan", flag: "🇸🇩", code: "SD", tier: 3 },
    SSP: { rate: 130.0, country: "South Sudan", flag: "🇸🇸", code: "SS", tier: 3 },
    LYD: { rate: 4.5, country: "Libya", flag: "🇱🇾", code: "LY", tier: 3 },
    TND: { rate: 2.8, country: "Tunisia", flag: "🇹🇳", code: "TN", tier: 2 },
    DZD: { rate: 135.0, country: "Algeria", flag: "🇩🇿", code: "DZ", tier: 2 },
    MAD: { rate: 9.1, country: "Morocco", flag: "🇲🇦", code: "MA", tier: 2 },
    
    // Others
    RUB: { rate: 73.5, country: "Russia", flag: "🇷🇺", code: "RU", tier: 3 },
    NZD: { rate: 1.42, country: "New Zealand", flag: "🇳🇿", code: "NZ", tier: 1 },
    FJD: { rate: 2.08, country: "Fiji", flag: "🇫🇯", code: "FJ", tier: 2 }
};

// Extract exchange rates for backward compatibility
const exchangeRates = Object.fromEntries(
    Object.entries(currencyData).map(([code, data]) => [code, data.rate])
);

// Transaction fee structure based on currency tier and amount
const feeStructure = {
    tier1: { // Major stable currencies (USD, EUR, GBP, etc.)
        base: 0.5,      // Base fee percentage
        minimum: 1.0,   // Minimum fee in USD
        maximum: 25.0   // Maximum fee in USD
    },
    tier2: { // Regional currencies with moderate volatility
        base: 1.0,
        minimum: 2.0,
        maximum: 50.0
    },
    tier3: { // High volatility or emerging market currencies
        base: 2.5,
        minimum: 5.0,
        maximum: 100.0
    }
};

// User account management
function createUserAccount(firstName, lastName, email, phone) {
    const userId = Date.now().toString();
    const user = {
        id: userId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString(),
        isVerified: false,
        idDocument: null,
        preferredCurrency: 'USD',
        paymentMethods: []
    };
    
    userAccounts[userId] = user;
    currentUser = user;
    saveUserData();
    return user;
}

function loginUser(email) {
    const user = Object.values(userAccounts).find(u => u.email === email);
    if (user) {
        currentUser = user;
        loadUserPreferences();
        return user;
    }
    return null;
}

function requiresIDVerification(amount, currency) {
    const amountInUSD = currency === 'USD' ? amount : convertCurrency(amount, currency, 'USD');
    return amountInUSD >= 2000;
}

function addPaymentMethod(type, details) {
    if (!currentUser) return false;
    
    const paymentMethod = {
        id: Date.now().toString(),
        type: type,
        details: details,
        addedAt: new Date().toISOString()
    };
    
    currentUser.paymentMethods.push(paymentMethod);
    saveUserData();
    return paymentMethod;
}

// Calculate transaction fee based on currency tier and amount
function calculateTransactionFee(amount, fromCurrency, toCurrency, paymentMethod = 'bank-transfer') {
    const fromTier = currencyData[fromCurrency]?.tier || 3;
    const toTier = currencyData[toCurrency]?.tier || 3;
    
    // Use the higher tier for fee calculation
    const applicableTier = Math.max(fromTier, toTier);
    const tierKey = `tier${applicableTier}`;
    const feeConfig = feeStructure[tierKey];
    
    // Calculate percentage-based fee
    const percentageFee = (amount * feeConfig.base) / 100;
    
    // Apply minimum and maximum limits
    let feeInUSD = Math.max(feeConfig.minimum, Math.min(percentageFee, feeConfig.maximum));
    
    // Add payment method fee
    const paymentMethodFee = paymentMethods[paymentMethod]?.fee || 0;
    const paymentMethodFeeAmount = (amount * paymentMethodFee) / 100;
    const paymentMethodFeeUSD = fromCurrency === 'USD' ? paymentMethodFeeAmount : convertCurrency(paymentMethodFeeAmount, fromCurrency, 'USD');
    
    feeInUSD += paymentMethodFeeUSD;
    
    // Convert fee to sender's currency if needed
    const feeInSenderCurrency = fromCurrency === 'USD' ? feeInUSD : convertCurrency(feeInUSD, 'USD', fromCurrency);
    
    return {
        feeAmount: feeInSenderCurrency,
        feeInUSD: feeInUSD,
        tier: applicableTier,
        percentage: feeConfig.base,
        paymentMethodFee: paymentMethodFee,
        paymentMethod: paymentMethod
    };
}

// Get currency display info
function getCurrencyDisplayInfo(currencyCode) {
    const currency = currencyData[currencyCode];
    if (!currency) return { flag: '🌍', country: 'Unknown', code: currencyCode };
    
    return {
        flag: currency.flag,
        country: currency.country,
        code: currency.code,
        tier: currency.tier
    };
}

// Placeholder function for fetching live exchange rates
async function updateExchangeRates() {
    // In a real application, this would fetch from a currency API like:
    // - https://api.exchangerate-api.com/v4/latest/USD
    // - https://api.fixer.io/latest
    // - https://openexchangerates.org/api/latest.json
    
    try {
        console.log('📈 Exchange rates updated (using demo rates)');
        // For now, we'll use static rates, but this is where you'd implement API calls
    } catch (error) {
        console.error('Failed to update exchange rates:', error);
    }
}

// DOM Elements
const balanceElement = document.getElementById('balance');
const transferForm = document.getElementById('transferForm');
const transactionList = document.getElementById('transactionList');
const notificationElement = document.getElementById('notification');

// Format currency
function formatCurrency(amount, currency = userCurrency) {
    // Handle CFA zone currencies
    const baseCurrency = getBaseCurrency(currency);
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: baseCurrency
        }).format(amount);
    } catch (error) {
        // Fallback for unsupported currencies
        return `${baseCurrency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
}

// Get base currency code (handles CFA zones)
function getBaseCurrency(currencyCode) {
    if (currencyData[currencyCode]?.currency) {
        return currencyData[currencyCode].currency;
    }
    return currencyCode;
}

// Convert currency
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Handle CFA zone currencies - extract base currency
    const fromRate = getEffectiveRate(fromCurrency);
    const toRate = getEffectiveRate(toCurrency);
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
}

// Get effective exchange rate (handles CFA zones)
function getEffectiveRate(currencyCode) {
    if (currencyData[currencyCode]) {
        return currencyData[currencyCode].rate;
    }
    // Fallback to base currency rates
    return exchangeRates[currencyCode] || 1;
}

// Get exchange rate between two currencies
function getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    const fromRate = getEffectiveRate(fromCurrency);
    const toRate = getEffectiveRate(toCurrency);
    
    return toRate / fromRate;
}

// Update balance display
function updateBalance() {
    const displayCurrency = document.getElementById('balanceCurrency')?.value || userCurrency;
    const convertedBalance = convertCurrency(balance, 'USD', displayCurrency);
    balanceElement.textContent = formatCurrency(convertedBalance, displayCurrency);
}

// Show notification
function showNotification(message, type = 'success') {
    notificationElement.textContent = message;
    notificationElement.className = `notification ${type}`;
    
    setTimeout(() => {
        notificationElement.classList.add('hiding');
        setTimeout(() => {
            notificationElement.classList.add('hidden');
            notificationElement.classList.remove('hiding');
        }, 300);
    }, 3000);
}

// Add transaction to history
function addTransaction(recipient, account, amount, description, senderCurrency, recipientCurrency, convertedAmount, feeInfo, paymentMethod) {
    const transaction = {
        id: Date.now(),
        userId: currentUser?.id,
        senderName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Anonymous',
        recipient: recipient,
        account: account,
        amount: amount,
        senderCurrency: senderCurrency,
        recipientCurrency: recipientCurrency,
        convertedAmount: convertedAmount,
        fee: feeInfo?.feeAmount || 0,
        feeInUSD: feeInfo?.feeInUSD || 0,
        tier: feeInfo?.tier || 1,
        paymentMethod: paymentMethod || 'bank-transfer',
        paymentMethodFee: feeInfo?.paymentMethodFee || 0,
        description: description || 'Money transfer',
        status: 'completed',
        date: new Date().toLocaleString(),
        timestamp: Date.now()
    };
    
    transactions.unshift(transaction);
    renderTransactions();
    saveData();
}

// Render transaction list
function renderTransactions() {
    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    transactionList.innerHTML = transactions.map(transaction => {
        const senderCurrency = transaction.senderCurrency || 'USD';
        const recipientCurrency = transaction.recipientCurrency || 'USD';
        const convertedAmount = transaction.convertedAmount || transaction.amount;
        const fee = transaction.fee || 0;
        const totalDeducted = transaction.amount + fee;
        
        const senderInfo = getCurrencyDisplayInfo(senderCurrency);
        const recipientInfo = getCurrencyDisplayInfo(recipientCurrency);
        
        const senderCountryName = senderInfo.country;
        const recipientCountryName = recipientInfo.country;
        const senderBaseCurrency = getBaseCurrency(senderCurrency);
        const recipientBaseCurrency = getBaseCurrency(recipientCurrency);
        
        return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-recipient">${senderInfo.flag} ${senderCountryName} → ${recipientInfo.flag} ${recipientCountryName} | ${escapeHtml(transaction.recipient)}</div>
                <div class="transaction-desc">${escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${transaction.date}</div>
                ${senderBaseCurrency !== recipientBaseCurrency ? 
                    `<div class="currency-conversion">Sent: ${formatCurrency(transaction.amount, senderCurrency)} (${senderBaseCurrency}) → Received: ${formatCurrency(convertedAmount, recipientCurrency)} (${recipientBaseCurrency})</div>` : 
                    ''}
                ${fee > 0 ? 
                    `<div class="transaction-fee">Fee: ${formatCurrency(fee, senderCurrency)} (Tier ${transaction.tier || 1})</div>` : 
                    ''}
            </div>
            <div>
                <div class="transaction-amount">-${formatCurrency(totalDeducted, senderCurrency)}</div>
                ${fee > 0 ? `<div class="transaction-breakdown">Amount: ${formatCurrency(transaction.amount, senderCurrency)}<br>Fee: ${formatCurrency(fee, senderCurrency)}</div>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate form inputs
function validateTransfer(amount, recipientName, recipientAccount, senderCurrency) {
    if (!recipientName.trim()) {
        showNotification('Please enter recipient name', 'error');
        return false;
    }
    
    if (!recipientAccount.trim()) {
        showNotification('Please enter account number or email', 'error');
        return false;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return false;
    }
    
    // Calculate total including fees for balance comparison
    const recipientCurrency = document.getElementById('recipientCurrency').value;
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'bank-transfer';
    const feeInfo = calculateTransactionFee(amount, senderCurrency, recipientCurrency, paymentMethod);
    const totalWithFee = amount + feeInfo.feeAmount;
    const totalInUSD = senderCurrency === 'USD' ? totalWithFee : convertCurrency(totalWithFee, senderCurrency, 'USD');
    
    if (totalInUSD > balance) {
        showNotification(`Insufficient balance. Required: ${formatCurrency(totalWithFee, senderCurrency)} (including ${formatCurrency(feeInfo.feeAmount, senderCurrency)} fee)`, 'error');
        return false;
    }
    
    return true;
}

// Handle form submission
transferForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser) {
        showAccountModal();
        return;
    }
    
    const recipientName = document.getElementById('recipientName').value;
    const recipientAccount = document.getElementById('recipientAccount').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const senderCurrency = document.getElementById('senderCurrency').value;
    const recipientCurrency = document.getElementById('recipientCurrency').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!validateTransfer(amount, recipientName, recipientAccount, senderCurrency)) {
        return;
    }
    
    // Check if ID verification is required
    if (requiresIDVerification(amount, senderCurrency) && !currentUser.isVerified) {
        showIdVerificationModal(amount, senderCurrency);
        return;
    }
    
    // Calculate converted amount and fees
    const convertedAmount = convertCurrency(amount, senderCurrency, recipientCurrency);
    const exchangeRate = getExchangeRate(senderCurrency, recipientCurrency);
    const feeInfo = calculateTransactionFee(amount, senderCurrency, recipientCurrency, paymentMethod);
    const totalWithFee = amount + feeInfo.feeAmount;
    
    // Process transfer - deduct total amount including fees in USD equivalent
    const totalInUSD = senderCurrency === 'USD' ? totalWithFee : convertCurrency(totalWithFee, senderCurrency, 'USD');
    balance -= totalInUSD;
    updateBalance();
    addTransaction(recipientName, recipientAccount, amount, description, senderCurrency, recipientCurrency, convertedAmount, feeInfo, paymentMethod);
    
    // Show success message with conversion info
    let successMessage = `Successfully sent ${formatCurrency(amount, senderCurrency)} to ${recipientName}`;
    if (senderCurrency !== recipientCurrency) {
        successMessage += `. They will receive ${formatCurrency(convertedAmount, recipientCurrency)}`;
    }
    successMessage += `. Fee: ${formatCurrency(feeInfo.feeAmount, senderCurrency)}`;
    showNotification(successMessage, 'success');
    
    // Reset form
    transferForm.reset();
    document.getElementById('conversionInfo').classList.add('hidden');
});

// Update conversion display
function updateConversionDisplay() {
    const amount = parseFloat(document.getElementById('amount').value);
    const senderCurrency = document.getElementById('senderCurrency').value;
    const recipientCurrency = document.getElementById('recipientCurrency').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const conversionInfo = document.getElementById('conversionInfo');
    const convertedAmountElement = document.getElementById('convertedAmount');
    const exchangeRateElement = document.getElementById('exchangeRate');
    const transactionFeeElement = document.getElementById('transactionFee');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (isNaN(amount) || amount <= 0) {
        conversionInfo.classList.add('hidden');
        return;
    }
    
    const convertedAmount = convertCurrency(amount, senderCurrency, recipientCurrency);
    const exchangeRate = getExchangeRate(senderCurrency, recipientCurrency);
    const feeInfo = calculateTransactionFee(amount, senderCurrency, recipientCurrency, paymentMethod);
    const totalWithFee = amount + feeInfo.feeAmount;
    
    // Check if ID verification is required
    const requiresID = requiresIDVerification(amount, senderCurrency);
    
    convertedAmountElement.textContent = formatCurrency(convertedAmount, recipientCurrency);
    exchangeRateElement.textContent = `1 ${senderCurrency} = ${exchangeRate.toFixed(4)} ${recipientCurrency}`;
    transactionFeeElement.textContent = `${formatCurrency(feeInfo.feeAmount, senderCurrency)} (Currency: ${feeInfo.percentage}% + Payment: ${feeInfo.paymentMethodFee}% - Tier ${feeInfo.tier})`;
    totalAmountElement.textContent = formatCurrency(totalWithFee, senderCurrency) + (requiresID ? ' ⚠️ ID Required' : '');
    
    conversionInfo.classList.remove('hidden');
}

// Populate currency selectors with flags and country names
function populateCurrencySelectors() {
    const senderSelect = document.getElementById('senderCurrency');
    const recipientSelect = document.getElementById('recipientCurrency');
    
    // Clear existing options
    senderSelect.innerHTML = '';
    recipientSelect.innerHTML = '';
    
    // Sort currencies by country name for better UX
    const sortedCurrencies = Object.entries(currencyData).sort((a, b) => 
        a[1].country.localeCompare(b[1].country)
    );
    
    sortedCurrencies.forEach(([code, data]) => {
        let optionText;
        
        // Special handling for currency unions
        if (data.currency === 'EUR') {
            optionText = `${data.flag} EUR - ${data.country} (Eurozone)`;
        } else if (data.currency === 'XOF') {
            optionText = `${data.flag} XOF - ${data.country} (West African CFA)`;
        } else if (data.currency === 'XAF') {
            optionText = `${data.flag} XAF - ${data.country} (Central African CFA)`;
        } else {
            optionText = `${data.flag} ${code} - ${data.country}`;
        }
        
        // Add to sender selector
        const senderOption = new Option(optionText, code);
        senderSelect.add(senderOption);
        
        // Add to recipient selector
        const recipientOption = new Option(optionText, code);
        recipientSelect.add(recipientOption);
    });
    
    // Set default values
    senderSelect.value = 'USD';
    recipientSelect.value = 'EUR_DE'; // Default to Germany
}

// Modal handling functions
function showAccountModal() {
    document.getElementById('accountModal').classList.remove('hidden');
}

function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('accountModal').classList.add('hidden');
}

function showIdVerificationModal(amount, currency) {
    document.getElementById('idVerificationModal').classList.remove('hidden');
    const amountUSD = currency === 'USD' ? amount : convertCurrency(amount, currency, 'USD');
    document.querySelector('#idVerificationModal p').textContent = 
        `⚠️ Your transaction of ${formatCurrency(amountUSD, 'USD')} requires ID verification for security and compliance.`;
}

function showTransactionHistory() {
    document.getElementById('historyModal').classList.remove('hidden');
    populateHistoryFilters();
    renderTransactionHistory();
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function updateUserInterface() {
    const userInfo = document.getElementById('userInfo');
    const welcomeMsg = document.getElementById('welcomeMessage');
    
    if (currentUser) {
        userInfo.classList.remove('hidden');
        welcomeMsg.textContent = `Welcome, ${currentUser.firstName}!`;
    } else {
        userInfo.classList.add('hidden');
        showAccountModal();
    }
}

function populateHistoryFilters() {
    const currencySelect = document.getElementById('historyCurrency');
    currencySelect.innerHTML = '<option value="all">All Currencies</option>';
    
    const usedCurrencies = [...new Set(transactions.flatMap(t => [t.senderCurrency, t.recipientCurrency]))];
    usedCurrencies.forEach(currency => {
        if (currency && currencyData[currency]) {
            const option = new Option(`${currencyData[currency].flag} ${currency} - ${currencyData[currency].country}`, currency);
            currencySelect.add(option);
        }
    });
}

function renderTransactionHistory(filter = 'all', currency = 'all', fromDate = null, toDate = null) {
    const historyContent = document.getElementById('historyContent');
    let filteredTransactions = [...transactions];
    
    // Apply filters
    if (currency !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => 
            t.senderCurrency === currency || t.recipientCurrency === currency);
    }
    
    if (fromDate) {
        const fromTime = new Date(fromDate).getTime();
        filteredTransactions = filteredTransactions.filter(t => t.timestamp >= fromTime);
    }
    
    if (toDate) {
        const toTime = new Date(toDate).getTime() + 24 * 60 * 60 * 1000; // End of day
        filteredTransactions = filteredTransactions.filter(t => t.timestamp <= toTime);
    }
    
    if (filteredTransactions.length === 0) {
        historyContent.innerHTML = '<div class="empty-state"><p>No transactions found for the selected filters.</p></div>';
        return;
    }
    
    historyContent.innerHTML = filteredTransactions.map(transaction => {
        const senderInfo = getCurrencyDisplayInfo(transaction.senderCurrency);
        const recipientInfo = getCurrencyDisplayInfo(transaction.recipientCurrency);
        const paymentMethodInfo = paymentMethods[transaction.paymentMethod] || paymentMethods['bank-transfer'];
        
        return `
        <div class="history-item">
            <div class="history-main">
                <div class="history-route">${senderInfo.flag} → ${recipientInfo.flag}</div>
                <div class="history-recipient">${escapeHtml(transaction.recipient)}</div>
                <div class="history-amount">${formatCurrency(transaction.amount, transaction.senderCurrency)}</div>
            </div>
            <div class="history-details">
                <div class="history-meta">
                    <span>ID: ${transaction.id}</span>
                    <span>${transaction.date}</span>
                    <span class="status-${transaction.status}">${transaction.status.toUpperCase()}</span>
                </div>
                <div class="history-conversion">
                    ${transaction.senderCurrency !== transaction.recipientCurrency ? 
                        `Recipient received: ${formatCurrency(transaction.convertedAmount, transaction.recipientCurrency)}` : 
                        'Same currency transfer'}
                </div>
                <div class="history-fees">
                    Payment: ${paymentMethodInfo.icon} ${paymentMethodInfo.name} | 
                    Fee: ${formatCurrency(transaction.fee, transaction.senderCurrency)} | 
                    Total: ${formatCurrency(transaction.amount + transaction.fee, transaction.senderCurrency)}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Initialize the app
function init() {
    loadUserData(); // Load user data first
    populateCurrencySelectors();
    updateBalance();
    renderTransactions();
    updateUserInterface();
    
    // Add event listeners for real-time conversion
    document.getElementById('amount').addEventListener('input', updateConversionDisplay);
    document.getElementById('senderCurrency').addEventListener('change', updateConversionDisplay);
    document.getElementById('recipientCurrency').addEventListener('change', updateConversionDisplay);
    document.getElementById('paymentMethod').addEventListener('change', updateConversionDisplay);
    
    // Add balance currency selector event listener
    document.getElementById('balanceCurrency').addEventListener('change', function() {
        userCurrency = this.value;
        if (currentUser) {
            currentUser.preferredCurrency = userCurrency;
            saveUserData();
        }
        updateBalance();
        saveData();
    });
    
    // Save currency preferences when changed
    document.getElementById('senderCurrency').addEventListener('change', function() {
        localStorage.setItem('senderCurrency', this.value);
    });
    
    document.getElementById('recipientCurrency').addEventListener('change', function() {
        localStorage.setItem('recipientCurrency', this.value);
    });
    
    // Modal event listeners
    setupModalEventListeners();
}

function setupModalEventListeners() {
    // Account creation
    document.getElementById('accountForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        createUserAccount(firstName, lastName, email, phone);
        hideAllModals();
        updateUserInterface();
        showNotification(`Welcome ${firstName}! Your account has been created.`, 'success');
    });
    
    // Login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const user = loginUser(email);
        
        if (user) {
            hideAllModals();
            updateUserInterface();
            showNotification(`Welcome back, ${user.firstName}!`, 'success');
        } else {
            showNotification('Account not found. Please create a new account.', 'error');
        }
    });
    
    // Modal navigation
    document.getElementById('loginInstead').addEventListener('click', showLoginModal);
    document.getElementById('createAccountInstead').addEventListener('click', showAccountModal);
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUserInterface();
        showNotification('Logged out successfully', 'success');
    });
    
    // Transaction history
    document.getElementById('viewFullHistory').addEventListener('click', showTransactionHistory);
    
    // ID verification
    document.getElementById('submitVerification').addEventListener('click', function() {
        const idFile = document.getElementById('idDocument').files[0];
        const idNumber = document.getElementById('idNumber').value;
        
        if (idFile && idNumber) {
            currentUser.isVerified = true;
            currentUser.idDocument = { name: idFile.name, number: idNumber, verifiedAt: new Date().toISOString() };
            saveUserData();
            hideAllModals();
            showNotification('ID verification submitted successfully! You can now proceed with large transactions.', 'success');
            
            // Retry the form submission
            document.getElementById('transferForm').dispatchEvent(new Event('submit'));
        } else {
            showNotification('Please upload your ID document and enter your ID number.', 'error');
        }
    });
    
    document.getElementById('cancelVerification').addEventListener('click', hideAllModals);
    
    // History filters
    document.getElementById('historyFilter').addEventListener('change', function() {
        renderTransactionHistory(this.value, 
            document.getElementById('historyCurrency').value,
            document.getElementById('historyFromDate').value,
            document.getElementById('historyToDate').value);
    });
    
    document.getElementById('historyCurrency').addEventListener('change', function() {
        renderTransactionHistory(document.getElementById('historyFilter').value, 
            this.value,
            document.getElementById('historyFromDate').value,
            document.getElementById('historyToDate').value);
    });
    
    document.getElementById('historyFromDate').addEventListener('change', function() {
        renderTransactionHistory(document.getElementById('historyFilter').value, 
            document.getElementById('historyCurrency').value,
            this.value,
            document.getElementById('historyToDate').value);
    });
    
    document.getElementById('historyToDate').addEventListener('change', function() {
        renderTransactionHistory(document.getElementById('historyFilter').value, 
            document.getElementById('historyCurrency').value,
            document.getElementById('historyFromDate').value,
            this.value);
    });
}

// Load saved data from localStorage
function loadSavedData() {
    const savedBalance = localStorage.getItem('balance');
    const savedTransactions = localStorage.getItem('transactions');
    const savedUserCurrency = localStorage.getItem('userCurrency');
    const savedSenderCurrency = localStorage.getItem('senderCurrency');
    const savedRecipientCurrency = localStorage.getItem('recipientCurrency');
    
    if (savedBalance) {
        balance = parseFloat(savedBalance);
    }
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    
    if (savedUserCurrency) {
        userCurrency = savedUserCurrency;
        document.getElementById('balanceCurrency').value = userCurrency;
    }
    
    if (savedSenderCurrency) {
        document.getElementById('senderCurrency').value = savedSenderCurrency;
    }
    
    if (savedRecipientCurrency) {
        document.getElementById('recipientCurrency').value = savedRecipientCurrency;
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('userCurrency', userCurrency);
}

function saveUserData() {
    localStorage.setItem('userAccounts', JSON.stringify(userAccounts));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function loadUserData() {
    const savedUserAccounts = localStorage.getItem('userAccounts');
    const savedCurrentUser = localStorage.getItem('currentUser');
    
    if (savedUserAccounts) {
        Object.assign(userAccounts, JSON.parse(savedUserAccounts));
    }
    
    if (savedCurrentUser) {
        currentUser = JSON.parse(savedCurrentUser);
        loadUserPreferences();
    }
}

function loadUserPreferences() {
    if (currentUser) {
        userCurrency = currentUser.preferredCurrency || 'USD';
        document.getElementById('balanceCurrency').value = userCurrency;
    }
}

// Save data on balance or transaction changes
const originalAddTransaction = addTransaction;
addTransaction = function(...args) {
    originalAddTransaction.apply(this, args);
    saveData();
};

const originalUpdateBalance = updateBalance;
updateBalance = function() {
    originalUpdateBalance();
    saveData();
};

// Load saved data on page load
loadSavedData();

// =============================================================================
// MOBILE & SECURITY ENHANCEMENTS
// =============================================================================

// Network Status Management
function updateConnectionStatus() {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;
    
    if (connectionStatus) {
        if (isOnline) {
            connectionStatus.className = 'connection-status online';
            connectionStatus.style.display = 'none';
            statusIcon.textContent = '✅';
            statusText.textContent = 'Connected - Secure connection established';
            
            // Process pending transactions when back online
            if (!wasOnline && pendingTransactions.length > 0) {
                processPendingTransactions();
            }
        } else {
            connectionStatus.className = 'connection-status offline';
            connectionStatus.style.display = 'block';
            statusIcon.textContent = '⚠️';
            statusText.textContent = 'You\'re offline. Transactions will be saved and processed when connection is restored.';
        }
    }
}

// Process pending transactions when back online
async function processPendingTransactions() {
    if (pendingTransactions.length === 0) return;
    
    console.log(`Processing ${pendingTransactions.length} pending transactions...`);
    
    for (let i = 0; i < pendingTransactions.length; i++) {
        try {
            await processTransaction(pendingTransactions[i]);
        } catch (error) {
            console.error('Failed to process pending transaction:', error);
        }
    }
    
    // Clear processed transactions
    pendingTransactions = [];
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
}

// Enhanced transaction processing with retry logic
async function processTransaction(transactionData, retryCount = 0) {
    try {
        // Simulate API call (replace with actual endpoint)
        const response = await fetch(`${APP_CONFIG.apiEndpoint}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Version': APP_CONFIG.version
            },
            body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        if (retryCount < APP_CONFIG.maxRetries) {
            console.log(`Retrying transaction (${retryCount + 1}/${APP_CONFIG.maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, APP_CONFIG.retryDelay * (retryCount + 1)));
            return processTransaction(transactionData, retryCount + 1);
        }
        throw error;
    }
}

// Service Worker Registration
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showMobileAlert('🔄 App update available! Refresh to get the latest version.', 'info');
                    }
                });
            });
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
}

// Button loading state management
function setButtonLoading(loading) {
    if (!sendButton || !btnText || !btnLoader) return;
    
    if (loading) {
        sendButton.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        sendButton.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
}

// Mobile-friendly alert system
function showMobileAlert(message, type = 'info', details = null) {
    // Create mobile-friendly notification
    const alertDiv = document.createElement('div');
    alertDiv.className = `mobile-alert ${type}`;
    
    let content = `<div class="alert-content">`;
    content += `<div class="alert-message">${message}</div>`;
    
    if (details) {
        content += `<div class="alert-details">`;
        content += `<div>Transaction ID: ${details.id}</div>`;
        content += `<div>Amount Sent: ${details.sent}</div>`;
        content += `<div>Amount Received: ${details.received}</div>`;
        content += `<div>Fee: ${details.fee}</div>`;
        content += `</div>`;
    }
    
    content += `<button class="alert-close" onclick="this.parentElement.parentElement.remove()">✕</button>`;
    content += `</div>`;
    
    alertDiv.innerHTML = content;
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Enhanced initialization for mobile features
function initializeMobileFeatures() {
    // Initialize DOM elements
    connectionStatus = document.getElementById('connectionStatus');
    statusIcon = document.getElementById('statusIcon');
    statusText = document.getElementById('statusText');
    sendButton = document.getElementById('sendButton');
    btnText = sendButton?.querySelector('.btn-text');
    btnLoader = sendButton?.querySelector('.btn-loader');
    
    // Update connection status
    updateConnectionStatus();
    
    // Network status listeners
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Register service worker
    registerServiceWorker();
    
    // Touch event optimizations
    document.addEventListener('touchstart', function() {}, { passive: true });
    
    // Add focus-visible support for better accessibility
    try {
        document.body.classList.add('js-focus-visible');
    } catch (e) {
        // Fallback for older browsers
    }
    
    // Handle service worker messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'STORE_FAILED_REQUEST') {
                // Store failed request in pending transactions
                pendingTransactions.push(event.data.data);
                localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
            } else if (event.data && event.data.type === 'SYNC_TRANSACTIONS') {
                // Process pending transactions
                processPendingTransactions();
            }
        });
    }
    
    console.log('Mobile features initialized successfully!');
}

// Initialize app with mobile features
function initializeApp() {
    // Original initialization
    init();
    
    // Mobile and security features
    initializeMobileFeatures();
    
    console.log('EasyMove app with mobile features initialized successfully!');
}

// =============================================================================
// TAB NAVIGATION & NEW FEATURES
// =============================================================================

// Language settings
const languages = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ar: 'العربية',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    hi: 'हिन्दी',
    sw: 'Kiswahili',
    yo: 'Yorùbá',
    ha: 'Hausa',
    ig: 'Igbo'
};

// Sample locations data
const sampleLocations = [
    {
        id: 1,
        name: "EasyMove Downtown",
        address: "23 Stoney park way, Thurmont , ",
        country: "US",
        services: ["cash-pickup", "bank-deposit"],
        hours: "Mon-Fri: 9AM-6PM, Sat: 9AM-4PM",
        phone: "+1 (240) 926-6314",
        icon: "🏪"
    },
    {
        id: 2,
        name: "EasyMove Lagos Central",
        address: "45 Victoria Island, Lagos, Nigeria",
        country: "NG",
        services: ["cash-pickup", "mobile-wallet"],
        hours: "Mon-Sat: 8AM-7PM",
        phone: "+234 1 234 5678",
        icon: "🏪"
    },
    {
        id: 3,
        name: "EasyMove London Bridge",
        address: "78 London Bridge Street, London SE1 9SG",
        country: "GB",
        services: ["cash-pickup", "bank-deposit"],
        hours: "Mon-Fri: 9AM-5PM",
        phone: "+44 20 7123 4567",
        icon: "🏪"
    },
    {
        id: 4,
        name: "EasyMove Mumbai Express",
        address: "Shop 12, Andheri West, Mumbai 400058",
        country: "IN",
        services: ["cash-pickup", "mobile-wallet", "bank-deposit"],
        hours: "Daily: 10AM-8PM",
        phone: "+91 22 1234 5678",
        icon: "🏪"
    },
    {
        id: 5,
        name: "EasyMove Manila Bay",
        address: "Unit 201, Makati Avenue, Metro Manila",
        country: "PH",
        services: ["cash-pickup", "mobile-wallet"],
        hours: "Mon-Sat: 9AM-6PM",
        phone: "+63 2 1234 5678",
        icon: "🏪"
    }
];

// Tab Navigation Functions
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Initialize tab-specific functionality
            if (tabId === 'find-locations') {
                initializeLocations();
            } else if (tabId === 'track-transfer') {
                initializeTracking();
            } else if (tabId === 'language') {
                initializeLanguageSettings();
            }
        });
    });
}

// Find Locations Functions
function initializeLocations() {
    const searchBtn = document.getElementById('searchLocations');
    const locationSearch = document.getElementById('locationSearch');
    const serviceFilter = document.getElementById('serviceFilter');
    const countryFilter = document.getElementById('countryFilter');
    
    if (searchBtn && !searchBtn.hasAttribute('data-initialized')) {
        searchBtn.setAttribute('data-initialized', 'true');
        searchBtn.addEventListener('click', performLocationSearch);
        locationSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performLocationSearch();
        });
        serviceFilter.addEventListener('change', performLocationSearch);
        countryFilter.addEventListener('change', performLocationSearch);
        
        // Load initial locations
        displayLocations(sampleLocations);
    }
}

function performLocationSearch() {
    const searchTerm = document.getElementById('locationSearch').value.toLowerCase();
    const serviceFilter = document.getElementById('serviceFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;
    
    let filteredLocations = sampleLocations.filter(location => {
        const matchesSearch = !searchTerm || 
            location.name.toLowerCase().includes(searchTerm) ||
            location.address.toLowerCase().includes(searchTerm);
        
        const matchesService = serviceFilter === 'all' || 
            location.services.includes(serviceFilter);
        
        const matchesCountry = countryFilter === 'all' || 
            location.country === countryFilter;
        
        return matchesSearch && matchesService && matchesCountry;
    });
    
    displayLocations(filteredLocations);
}

function displayLocations(locations) {
    const resultsContainer = document.getElementById('locationsResults');
    
    if (locations.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <span style="font-size: 48px;">🔍</span>
                <h3>No locations found</h3>
                <p>Try adjusting your search criteria or filters.</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = locations.map(location => `
        <div class="location-item">
            <div class="location-icon">${location.icon}</div>
            <div class="location-details">
                <h4>${location.name}</h4>
                <p>${location.address}</p>
                <p><strong>Hours:</strong> ${location.hours}</p>
                <p><strong>Phone:</strong> ${location.phone}</p>
            </div>
            <div class="location-services">
                ${location.services.map(service => 
                    `<span class="service-tag">${service.replace('-', ' ')}</span>`
                ).join('')}
            </div>
        </div>
    `).join('');
}

// Track Transfer Functions
function initializeTracking() {
    const trackBtn = document.getElementById('trackTransfer');
    const trackingId = document.getElementById('trackingId');
    
    if (trackBtn && !trackBtn.hasAttribute('data-initialized')) {
        trackBtn.setAttribute('data-initialized', 'true');
        trackBtn.addEventListener('click', performTracking);
        trackingId.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performTracking();
        });
    }
}

function performTracking() {
    const trackingId = document.getElementById('trackingId').value.trim();
    const trackingPhone = document.getElementById('trackingPhone').value.trim();
    const resultsContainer = document.getElementById('trackingResults');
    
    if (!trackingId) {
        showMobileAlert('Please enter a transaction ID or reference number', 'error');
        return;
    }
    
    // Show loading state
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="loading-spinner">🔍</div>
            <p>Searching for your transfer...</p>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        // Check if it's one of our transactions
        const transaction = currentUser?.transactions?.find(t => 
            t.id === trackingId || t.id.includes(trackingId.slice(-6))
        );
        
        if (transaction) {
            displayTrackingResults(transaction);
        } else {
            // Show sample tracking result
            displaySampleTrackingResults(trackingId);
        }
    }, 1500);
}

function displayTrackingResults(transaction) {
    const resultsContainer = document.getElementById('trackingResults');
    const statusClass = transaction.status === 'completed' ? 'completed' : 
                       transaction.status === 'processing' ? 'processing' : 'pending';
    
    resultsContainer.innerHTML = `
        <div class="transfer-status">
            <div class="status-indicator ${statusClass}">
                <span>${transaction.status === 'completed' ? '✅' : 
                       transaction.status === 'processing' ? '⏳' : '🔄'}</span>
                <span>${transaction.status.toUpperCase()}</span>
            </div>
            <h3>Transfer ID: ${transaction.id}</h3>
            <p><strong>Amount:</strong> ${formatCurrency(transaction.senderAmount, transaction.senderCurrency)} → ${formatCurrency(transaction.recipientAmount, transaction.recipientCurrency)}</p>
            <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
        </div>
        
        <div class="transfer-timeline">
            <div class="timeline-item completed">
                <div class="timeline-content">
                    <h4>Transfer Initiated</h4>
                    <p>Your transfer has been received and is being processed</p>
                    <div class="timeline-time">${new Date(transaction.date).toLocaleString()}</div>
                </div>
            </div>
            <div class="timeline-item ${transaction.status !== 'pending' ? 'completed' : ''}">
                <div class="timeline-content">
                    <h4>Processing Payment</h4>
                    <p>Verifying payment method and processing transfer</p>
                    <div class="timeline-time">${transaction.status !== 'pending' ? new Date(Date.now() - 3600000).toLocaleString() : 'Pending'}</div>
                </div>
            </div>
            <div class="timeline-item ${transaction.status === 'completed' ? 'completed' : ''}">
                <div class="timeline-content">
                    <h4>Transfer Complete</h4>
                    <p>Funds have been delivered to recipient</p>
                    <div class="timeline-time">${transaction.status === 'completed' ? new Date(Date.now() - 1800000).toLocaleString() : 'Pending'}</div>
                </div>
            </div>
        </div>
    `;
}

function displaySampleTrackingResults(trackingId) {
    const resultsContainer = document.getElementById('trackingResults');
    
    resultsContainer.innerHTML = `
        <div class="transfer-status">
            <div class="status-indicator processing">
                <span>⏳</span>
                <span>PROCESSING</span>
            </div>
            <h3>Transfer ID: ${trackingId}</h3>
            <p><strong>Amount:</strong> $500.00 USD → ₦205,000.00 NGN</p>
            <p><strong>Estimated Delivery:</strong> Within 2-4 hours</p>
        </div>
        
        <div class="transfer-timeline">
            <div class="timeline-item completed">
                <div class="timeline-content">
                    <h4>Transfer Initiated</h4>
                    <p>Your transfer has been received and is being processed</p>
                    <div class="timeline-time">${new Date(Date.now() - 7200000).toLocaleString()}</div>
                </div>
            </div>
            <div class="timeline-item completed">
                <div class="timeline-content">
                    <h4>Payment Verified</h4>
                    <p>Payment method verified and funds secured</p>
                    <div class="timeline-time">${new Date(Date.now() - 3600000).toLocaleString()}</div>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-content">
                    <h4>Ready for Pickup</h4>
                    <p>Funds are ready for pickup at the destination</p>
                    <div class="timeline-time">Estimated: ${new Date(Date.now() + 3600000).toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
}

// Language Settings Functions
function initializeLanguageSettings() {
    const saveBtn = document.getElementById('saveLanguageSettings');
    const resetBtn = document.getElementById('resetLanguageSettings');
    
    if (saveBtn && !saveBtn.hasAttribute('data-initialized')) {
        saveBtn.setAttribute('data-initialized', 'true');
        saveBtn.addEventListener('click', saveLanguageSettings);
        resetBtn.addEventListener('click', resetLanguageSettings);
        
        // Load saved settings
        loadLanguageSettings();
    }
}

function saveLanguageSettings() {
    const settings = {
        language: document.getElementById('appLanguage').value,
        dateFormat: document.getElementById('dateFormat').value,
        numberFormat: document.getElementById('numberFormat').value,
        timeZone: document.getElementById('timeZone').value
    };
    
    localStorage.setItem('easymove_language_settings', JSON.stringify(settings));
    showMobileAlert('✅ Language settings saved successfully!', 'success');
    
    // Apply settings immediately
    applyLanguageSettings(settings);
}

function loadLanguageSettings() {
    const saved = localStorage.getItem('easymove_language_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('appLanguage').value = settings.language || 'en';
        document.getElementById('dateFormat').value = settings.dateFormat || 'MM/DD/YYYY';
        document.getElementById('numberFormat').value = settings.numberFormat || '1,234.56';
        document.getElementById('timeZone').value = settings.timeZone || 'UTC';
        
        applyLanguageSettings(settings);
    }
}

function resetLanguageSettings() {
    document.getElementById('appLanguage').value = 'en';
    document.getElementById('dateFormat').value = 'MM/DD/YYYY';
    document.getElementById('numberFormat').value = '1,234.56';
    document.getElementById('timeZone').value = 'UTC';
    
    localStorage.removeItem('easymove_language_settings');
    showMobileAlert('🔄 Language settings reset to default', 'info');
}

function applyLanguageSettings(settings) {
    // Apply language settings to the app
    // This would typically involve loading language files and updating UI text
    console.log('Applying language settings:', settings);
    
    // Set HTML lang attribute
    document.documentElement.lang = settings.language || 'en';
    
    // Update date/time displays throughout the app
    updateDateTimeDisplays(settings);
}

function updateDateTimeDisplays(settings) {
    // Update all date/time displays in the app based on user preferences
    const dateElements = document.querySelectorAll('.transaction-date, .timeline-time');
    dateElements.forEach(element => {
        if (element.dataset.timestamp) {
            const date = new Date(parseInt(element.dataset.timestamp));
            element.textContent = formatDateByPreference(date, settings);
        }
    });
}

function formatDateByPreference(date, settings) {
    const options = {
        timeZone: settings.timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleString(settings.language || 'en', options);
}

// Initialize all tab functionality
function initializeTabSystem() {
    initializeTabs();
    // Initialize default tab content
    initializeLocations();
}

// Initialize the enhanced app with tabs
function initializeApp() {
    // Original initialization
    init();
    
    // Tab system
    initializeTabSystem();
    
    // Mobile and security features
    initializeMobileFeatures();
    
    console.log('EasyMove app with tabs and mobile features initialized successfully!');
}

// Initialize the enhanced app
initializeApp();

// Update exchange rates (in production, you might do this periodically)
updateExchangeRates();
