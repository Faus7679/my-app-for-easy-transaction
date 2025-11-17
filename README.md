# 🚀 EasyMove - Smart Money Transfer App

EasyMove is an intelligent web application that makes international money transfers simple with automatic currency conversion.

## ✨ Features

- 💰 **Multi-Currency Balance**: View your balance in your preferred currency
- 🌍 **Automatic Currency Conversion**: Send money in one currency, recipient receives in another
- 📊 **Real-Time Exchange Rates**: See live conversion rates and amounts
- 💸 **Smart Transfers**: Intelligent currency handling for seamless transactions
- 📝 **Transaction History**: Track all transfers with currency conversion details
- 🔔 **Smart Notifications**: Detailed feedback including conversion information
- 💾 **Persistent Storage**: Your data and preferences are saved locally
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🎯 **User Preferences**: Remembers your preferred currencies

## 📖 How to Use

1. **Open the App**: Simply open `index.html` in your web browser
2. **Set Your Currency**: Choose your preferred currency for balance display
3. **Check Your Balance**: View your available balance in your chosen currency
4. **Fill in Transfer Details**:
   - Enter the recipient's name
   - Enter their account number or email
   - Select your sending currency
   - Specify the amount to transfer
   - Select the recipient's preferred currency
   - Add an optional description
5. **See Live Conversion**: Watch the real-time conversion as you type
6. **Send Money**: Click the "Send Money" button
7. **View History**: See all your transactions with currency conversion details

## 🌍 Supported Currencies

- **USD** - US Dollar
- **EUR** - Euro
- **GBP** - British Pound
- **JPY** - Japanese Yen
- **CAD** - Canadian Dollar
- **AUD** - Australian Dollar
- **CHF** - Swiss Franc
- **CNY** - Chinese Yuan

## Quick Start

### Option 1: Direct File Access
```bash
# Navigate to the directory
cd my-app-for-easy-transaction

# Open in browser (on macOS)
open index.html

# Or on Linux
xdg-open index.html

# Or on Windows
start index.html
```

### Option 2: Using a Local Server
```bash
# Using Python 3
python -m http.server 8000

# Then visit http://localhost:8000 in your browser
```

### Option 3: Using Node.js
```bash
# Install a simple HTTP server
npm install -g http-server

# Run the server
http-server

# Then visit http://localhost:8080 in your browser
```

## Files Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - Application logic and functionality

## Features in Detail

### Balance Management
- Starts with a default balance of $5,000
- Updates automatically after each transfer
- Validates sufficient funds before transfers

### Transfer Validation
- Ensures all required fields are filled
- Validates amount is positive and within balance
- Prevents overdrafts

### Transaction History
- Shows recipient name and description
- Displays transaction date and time
- Updates in real-time

### Data Persistence
- Uses browser's localStorage to save data
- Balance and transactions persist across sessions
- Clear browser data to reset

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Security Note

This is a demonstration application. In a production environment, you would need:
- Backend server for actual money transfers
- Secure authentication and authorization
- Encrypted data transmission
- Integration with payment gateways
- Transaction verification and logging

## License

This project is open source and available under the MIT License.
