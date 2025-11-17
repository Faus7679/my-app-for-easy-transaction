// Initial balance
let balance = 5000.00;
let transactions = [];

// DOM Elements
const balanceElement = document.getElementById('balance');
const transferForm = document.getElementById('transferForm');
const transactionList = document.getElementById('transactionList');
const notificationElement = document.getElementById('notification');

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Update balance display
function updateBalance() {
    balanceElement.textContent = formatCurrency(balance);
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
function addTransaction(recipient, account, amount, description) {
    const transaction = {
        id: Date.now(),
        recipient: recipient,
        account: account,
        amount: amount,
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
    
    transactionList.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-recipient">${escapeHtml(transaction.recipient)}</div>
                <div class="transaction-desc">${escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
            <div>
                <div class="transaction-amount">-${formatCurrency(transaction.amount)}</div>
            </div>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate form inputs
function validateTransfer(amount, recipientName, recipientAccount) {
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
    
    if (amount > balance) {
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
    
    if (!validateTransfer(amount, recipientName, recipientAccount)) {
        return;
    }
    
    // Process transfer
    balance -= amount;
    updateBalance();
    addTransaction(recipientName, recipientAccount, amount, description);
    
    // Show success message
    showNotification(`Successfully sent ${formatCurrency(amount)} to ${recipientName}`, 'success');
    
    // Reset form
    transferForm.reset();
});

// Initialize the app
function init() {
    updateBalance();
    renderTransactions();
}

// Load saved data from localStorage
function loadSavedData() {
    const savedBalance = localStorage.getItem('balance');
    const savedTransactions = localStorage.getItem('transactions');
    
    if (savedBalance) {
        balance = parseFloat(savedBalance);
    }
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('transactions', JSON.stringify(transactions));
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
