// Initial balance
let balance = 5000.00;
let transactions = [];
let userCurrency = 'USD';

// Exchange rates (USD as base) - In production, these would be fetched from a live API
const exchangeRates = {
    // Major Currencies
    USD: 1.0,        // US Dollar (base)
    EUR: 0.85,       // Euro
    GBP: 0.73,       // British Pound
    JPY: 110.0,      // Japanese Yen
    CAD: 1.25,       // Canadian Dollar
    AUD: 1.35,       // Australian Dollar
    CHF: 0.92,       // Swiss Franc
    CNY: 6.45,       // Chinese Yuan
    
    // Asian Currencies
    INR: 74.5,       // Indian Rupee
    KRW: 1180.0,     // South Korean Won
    SGD: 1.35,       // Singapore Dollar
    HKD: 7.8,        // Hong Kong Dollar
    THB: 33.0,       // Thai Baht
    MYR: 4.15,       // Malaysian Ringgit
    PHP: 50.5,       // Philippine Peso
    IDR: 14250.0,    // Indonesian Rupiah
    VND: 23000.0,    // Vietnamese Dong
    
    // European Currencies
    NOK: 8.6,        // Norwegian Krone
    SEK: 8.9,        // Swedish Krona
    DKK: 6.35,       // Danish Krone
    PLN: 3.9,        // Polish Zloty
    CZK: 21.8,       // Czech Koruna
    HUF: 295.0,      // Hungarian Forint
    RON: 4.2,        // Romanian Leu
    BGN: 1.66,       // Bulgarian Lev
    HRK: 6.4,        // Croatian Kuna
    ISK: 129.0,      // Icelandic Krona
    
    // Americas Currencies
    BRL: 5.2,        // Brazilian Real
    MXN: 20.1,       // Mexican Peso
    ARS: 98.5,       // Argentine Peso
    CLP: 775.0,      // Chilean Peso
    COP: 3850.0,     // Colombian Peso
    PEN: 3.65,       // Peruvian Sol
    UYU: 43.8,       // Uruguayan Peso
    BOB: 6.9,        // Bolivian Boliviano
    PYG: 6950.0,     // Paraguayan Guarani
    
    // Middle East & Africa
    AED: 3.67,       // UAE Dirham
    SAR: 3.75,       // Saudi Riyal
    ILS: 3.25,       // Israeli Shekel
    TRY: 8.45,       // Turkish Lira
    EGP: 15.7,       // Egyptian Pound
    ZAR: 14.8,       // South African Rand
    NGN: 411.0,      // Nigerian Naira
    GHS: 6.1,        // Ghanaian Cedi
    KES: 108.5,      // Kenyan Shilling
    UGX: 3520.0,     // Ugandan Shilling
    TZS: 2310.0,     // Tanzanian Shilling
    
    // Others
    RUB: 73.5,       // Russian Ruble
    NZD: 1.42,       // New Zealand Dollar
    FJD: 2.08        // Fijian Dollar
};

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
function addTransaction(recipient, account, amount, description, senderCurrency, recipientCurrency, convertedAmount) {
    const transaction = {
        id: Date.now(),
        recipient: recipient,
        account: account,
        amount: amount,
        senderCurrency: senderCurrency,
        recipientCurrency: recipientCurrency,
        convertedAmount: convertedAmount,
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
        
        return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-recipient">${escapeHtml(transaction.recipient)}</div>
                <div class="transaction-desc">${escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${transaction.date}</div>
                ${senderCurrency !== recipientCurrency ? 
                    `<div class="currency-conversion">Sent: ${formatCurrency(transaction.amount, senderCurrency)} → Received: ${formatCurrency(convertedAmount, recipientCurrency)}</div>` : 
                    ''}
            </div>
            <div>
                <div class="transaction-amount">-${formatCurrency(transaction.amount, senderCurrency)}</div>
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
    
    // Convert amount to USD for balance comparison if needed
    const amountInUSD = senderCurrency === 'USD' ? amount : convertCurrency(amount, senderCurrency, 'USD');
    if (amountInUSD > balance) {
        showNotification('Insufficient balance', 'error');
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
    
    // Calculate converted amount
    const convertedAmount = convertCurrency(amount, senderCurrency, recipientCurrency);
    const exchangeRate = getExchangeRate(senderCurrency, recipientCurrency);
    
    // Process transfer - deduct amount in USD equivalent
    const amountInUSD = senderCurrency === 'USD' ? amount : convertCurrency(amount, senderCurrency, 'USD');
    balance -= amountInUSD;
    updateBalance();
    addTransaction(recipientName, recipientAccount, amount, description, senderCurrency, recipientCurrency, convertedAmount);
    
    // Show success message with conversion info
    let successMessage = `Successfully sent ${formatCurrency(amount, senderCurrency)} to ${recipientName}`;
    if (senderCurrency !== recipientCurrency) {
        successMessage += `. They will receive ${formatCurrency(convertedAmount, recipientCurrency)}`;
    }
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
    
    if (isNaN(amount) || amount <= 0) {
        conversionInfo.classList.add('hidden');
        return;
    }
    
    if (senderCurrency === recipientCurrency) {
        conversionInfo.classList.add('hidden');
        return;
    }
    
    const convertedAmount = convertCurrency(amount, senderCurrency, recipientCurrency);
    const exchangeRate = getExchangeRate(senderCurrency, recipientCurrency);
    
    convertedAmountElement.textContent = formatCurrency(convertedAmount, recipientCurrency);
    exchangeRateElement.textContent = `1 ${senderCurrency} = ${exchangeRate.toFixed(4)} ${recipientCurrency}`;
    
    conversionInfo.classList.remove('hidden');
}

// Initialize the app
function init() {
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
