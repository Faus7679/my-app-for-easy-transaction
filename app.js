// Initial balance
let balance = 5000.00;
let transactions = [];
let userCurrency = 'USD';

// Comprehensive currency data with country info, flags, and rates
const currencyData = {
    // Major Currencies
    USD: { rate: 1.0, country: "United States", flag: "🇺🇸", code: "US", tier: 1 },
    EUR: { rate: 0.85, country: "European Union", flag: "🇪🇺", code: "EU", tier: 1 },
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
    HRK: { rate: 6.4, country: "Croatia", flag: "🇭🇷", code: "HR", tier: 2 },
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
    XOF: { rate: 555.0, country: "West Africa (CFA)", flag: "🌍", code: "XOF", tier: 2 },
    XAF: { rate: 555.0, country: "Central Africa (CFA)", flag: "🌍", code: "XAF", tier: 2 },
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

// Calculate transaction fee based on currency tier and amount
function calculateTransactionFee(amount, fromCurrency, toCurrency) {
    const fromTier = currencyData[fromCurrency]?.tier || 3;
    const toTier = currencyData[toCurrency]?.tier || 3;
    
    // Use the higher tier for fee calculation
    const applicableTier = Math.max(fromTier, toTier);
    const tierKey = `tier${applicableTier}`;
    const feeConfig = feeStructure[tierKey];
    
    // Calculate percentage-based fee
    const percentageFee = (amount * feeConfig.base) / 100;
    
    // Apply minimum and maximum limits
    const feeInUSD = Math.max(feeConfig.minimum, Math.min(percentageFee, feeConfig.maximum));
    
    // Convert fee to sender's currency if needed
    const feeInSenderCurrency = fromCurrency === 'USD' ? feeInUSD : convertCurrency(feeInUSD, 'USD', fromCurrency);
    
    return {
        feeAmount: feeInSenderCurrency,
        feeInUSD: feeInUSD,
        tier: applicableTier,
        percentage: feeConfig.base
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
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Convert currency
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency];
    return usdAmount * exchangeRates[toCurrency];
}

// Get exchange rate between two currencies
function getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    return exchangeRates[toCurrency] / exchangeRates[fromCurrency];
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
function addTransaction(recipient, account, amount, description, senderCurrency, recipientCurrency, convertedAmount, feeInfo) {
    const transaction = {
        id: Date.now(),
        recipient: recipient,
        account: account,
        amount: amount,
        senderCurrency: senderCurrency,
        recipientCurrency: recipientCurrency,
        convertedAmount: convertedAmount,
        fee: feeInfo?.feeAmount || 0,
        feeInUSD: feeInfo?.feeInUSD || 0,
        tier: feeInfo?.tier || 1,
        description: description || 'Money transfer',
        date: new Date().toLocaleString()
    };
    
    transactions.unshift(transaction);
    renderTransactions();
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
        
        return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-recipient">${senderInfo.flag} → ${recipientInfo.flag} ${escapeHtml(transaction.recipient)}</div>
                <div class="transaction-desc">${escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${transaction.date}</div>
                ${senderCurrency !== recipientCurrency ? 
                    `<div class="currency-conversion">Sent: ${formatCurrency(transaction.amount, senderCurrency)} → Received: ${formatCurrency(convertedAmount, recipientCurrency)}</div>` : 
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
    const feeInfo = calculateTransactionFee(amount, senderCurrency, recipientCurrency);
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
    
    const recipientName = document.getElementById('recipientName').value;
    const recipientAccount = document.getElementById('recipientAccount').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const senderCurrency = document.getElementById('senderCurrency').value;
    const recipientCurrency = document.getElementById('recipientCurrency').value;
    
    if (!validateTransfer(amount, recipientName, recipientAccount, senderCurrency)) {
        return;
    }
    
    // Calculate converted amount and fees
    const convertedAmount = convertCurrency(amount, senderCurrency, recipientCurrency);
    const exchangeRate = getExchangeRate(senderCurrency, recipientCurrency);
    const feeInfo = calculateTransactionFee(amount, senderCurrency, recipientCurrency);
    const totalWithFee = amount + feeInfo.feeAmount;
    
    // Process transfer - deduct total amount including fees in USD equivalent
    const totalInUSD = senderCurrency === 'USD' ? totalWithFee : convertCurrency(totalWithFee, senderCurrency, 'USD');
    balance -= totalInUSD;
    updateBalance();
    addTransaction(recipientName, recipientAccount, amount, description, senderCurrency, recipientCurrency, convertedAmount, feeInfo);
    
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
    const feeInfo = calculateTransactionFee(amount, senderCurrency, recipientCurrency);
    const totalWithFee = amount + feeInfo.feeAmount;
    
    convertedAmountElement.textContent = formatCurrency(convertedAmount, recipientCurrency);
    exchangeRateElement.textContent = `1 ${senderCurrency} = ${exchangeRate.toFixed(4)} ${recipientCurrency}`;
    transactionFeeElement.textContent = `${formatCurrency(feeInfo.feeAmount, senderCurrency)} (${feeInfo.percentage}% - Tier ${feeInfo.tier})`;
    totalAmountElement.textContent = formatCurrency(totalWithFee, senderCurrency);
    
    conversionInfo.classList.remove('hidden');
}

// Populate currency selectors with flags and country names
function populateCurrencySelectors() {
    const senderSelect = document.getElementById('senderCurrency');
    const recipientSelect = document.getElementById('recipientCurrency');
    const balanceSelect = document.getElementById('balanceCurrency');
    
    // Clear existing options (except balance selector which has been manually updated)
    senderSelect.innerHTML = '';
    recipientSelect.innerHTML = '';
    
    // Sort currencies by country name for better UX
    const sortedCurrencies = Object.entries(currencyData).sort((a, b) => 
        a[1].country.localeCompare(b[1].country)
    );
    
    sortedCurrencies.forEach(([code, data]) => {
        const optionText = `${data.flag} ${code} - ${data.country}`;
        
        // Add to sender selector
        const senderOption = new Option(optionText, code);
        senderSelect.add(senderOption);
        
        // Add to recipient selector
        const recipientOption = new Option(optionText, code);
        recipientSelect.add(recipientOption);
    });
    
    // Set default values
    senderSelect.value = 'USD';
    recipientSelect.value = 'EUR';
}

// Initialize the app
function init() {
    populateCurrencySelectors();
    updateBalance();
    renderTransactions();
    
    // Add event listeners for real-time conversion
    document.getElementById('amount').addEventListener('input', updateConversionDisplay);
    document.getElementById('senderCurrency').addEventListener('change', updateConversionDisplay);
    document.getElementById('recipientCurrency').addEventListener('change', updateConversionDisplay);
    
    // Add balance currency selector event listener
    document.getElementById('balanceCurrency').addEventListener('change', function() {
        userCurrency = this.value;
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

// Initialize app
init();

// Update exchange rates (in production, you might do this periodically)
updateExchangeRates();
