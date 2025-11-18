# 🚀 EasyMove - Complete Money Transfer Platform

EasyMove is a production-ready financial platform that makes international money transfers simple, secure, and affordable. Built with modern web technologies and enterprise-grade security, EasyMove provides real payment processing, real-time updates, and comprehensive transaction management.

## 🏗️ **Architecture**

### **Frontend**
- **Progressive Web App (PWA)** with offline support
- **Mobile-first responsive design** for all devices
- **Real-time WebSocket updates** for live transaction tracking
- **Modern JavaScript** with ES6+ features and service workers

### **Backend** *(Production-Ready)*
- **Node.js + Express.js** server with comprehensive middleware
- **MongoDB** database with proper indexing and relationships
- **Redis** for caching and background job processing
- **JWT Authentication** with refresh tokens and role-based access
- **Real Payment Processing** with Stripe and PayPal integration
- **WebSocket Support** for real-time transaction updates
- **Docker Containerization** for production deployment

## ✨ **Core Features**

### 🔒 **Enterprise Security**
- **End-to-End Encryption**: All data encrypted in transit and at rest
- **HTTPS Enforcement**: Automatic redirect with SSL/TLS certificates
- **Security Headers**: CSP, HSTS, XSS protection, and CSRF prevention
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Rate Limiting**: DDoS protection and API abuse prevention
- **Input Validation**: Comprehensive data sanitization and validation
- **KYC/AML Compliance**: Identity verification and anti-money laundering checks

### 💳 **Real Payment Processing**
- **Stripe Integration**: Credit/debit cards, Apple Pay, Google Pay
- **PayPal Integration**: Express checkout and PayPal balance
- **Multiple Currencies**: Support for 100+ global currencies
- **Real-time Exchange Rates**: Live currency conversion with competitive rates
- **Webhook Processing**: Instant payment confirmations and updates
- **Refund Support**: Automated refund processing and tracking

### 📱 **Modern User Experience**
- **Progressive Web App**: Installable on any device with app-like experience
- **Offline Support**: Queue transactions when offline, sync when connected
- **Real-time Updates**: Live transaction status via WebSocket connections
- **Mobile Optimized**: Touch-friendly interface with responsive design
- **Push Notifications**: Transaction alerts and status updates
- **Multi-language Support**: Internationalization ready

### 👤 **User Management**
- **Secure Registration**: Email verification and password requirements
- **User Profiles**: Complete profile management with KYC verification
- **Document Upload**: Secure ID verification with AWS S3 storage
- **Transaction History**: Detailed transaction records with search and filters
- **Multi-factor Authentication**: Optional 2FA for enhanced security
- **Role-based Access**: User, admin, and operator role management

### 💰 **Advanced Financial Features**
- **Smart Fee Structure**: Transparent pricing based on payment method and amount
- **Multi-Currency Wallets**: Hold balances in multiple currencies
- **Exchange Rate Alerts**: Notifications for favorable exchange rates
- **Transaction Limits**: Configurable daily, monthly, and per-transaction limits
- **Compliance Monitoring**: Automated sanctions and AML screening
- **Detailed Reporting**: Comprehensive transaction and financial reports
### 💸 **Payment Methods & Fees**
| Payment Method | Processing Fee | Processing Time | Limits |
|---|---|---|---|
| 🏦 Bank Transfer | 0% | 1-3 business days | $10 - $50,000 |
| 💳 Debit Card | +1.5% | Instant | $10 - $10,000 |
| 💳 Credit Card | +2.5% | Instant | $10 - $5,000 |
| 📱 Digital Wallet | +1.0% | Instant | $10 - $25,000 |
| ₿ Cryptocurrency | +0.5% | 10-30 minutes | $10 - $100,000 |

## 🚀 **Quick Start**

### **Frontend Only (Demo Mode)**
```bash
# Clone the repository
git clone https://github.com/yourusername/easymove.git
cd easymove

# Open in browser
open index.html
# Or use a local server
python -m http.server 8000
```

### **Full Stack (Production Ready)**
```bash
# Navigate to backend
cd backend

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database credentials

# Deploy with Docker (Recommended)
chmod +x deploy.sh
./deploy.sh

# Or start manually
docker-compose up -d
```

## 🛠️ **Technology Stack**

### **Frontend**
- **HTML5** with semantic markup and accessibility features
- **CSS3** with Flexbox, Grid, and custom properties
- **Vanilla JavaScript** with ES6+ features and modules
- **Service Worker** for PWA functionality and offline support
- **Web APIs**: Fetch, Local Storage, Push Notifications, etc.

### **Backend**
- **Node.js 18+** with Express.js framework
- **MongoDB 7.0** with Mongoose ODM
- **Redis 7.0** for caching and job queues
- **Socket.io** for real-time WebSocket connections
- **JWT** for authentication and authorization
- **Bull** for background job processing
- **Winston** for comprehensive logging
- **Joi** for input validation and sanitization

### **Payment Integration**
- **Stripe API** for card payments and digital wallets
- **PayPal SDK** for PayPal payments and express checkout
- **Webhook Handling** for real-time payment confirmations
- **PCI Compliance** with secure tokenization

### **Infrastructure**
- **Docker** containerization with multi-service architecture
- **Nginx** reverse proxy with SSL termination
- **MongoDB** with replica sets and authentication
- **Redis** with password protection and persistence
- **Let's Encrypt** for SSL certificates
- **AWS S3** for secure document storage

## 📁 **Project Structure**

```
easymove/
├── 📁 frontend/
│   ├── index.html              # Main application entry point
│   ├── styles.css              # Complete styling and responsive design
│   ├── app.js                  # Core application logic
│   ├── sw.js                   # Service worker for PWA features
│   └── manifest.json           # PWA manifest configuration
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Request handlers and business logic
│   │   ├── 📁 models/          # MongoDB schemas and data models
│   │   ├── 📁 routes/          # API endpoints and route definitions
│   │   ├── 📁 middleware/      # Authentication and validation middleware
│   │   ├── 📁 services/        # Payment, email, and external services
│   │   └── 📁 utils/           # Utility functions and helpers
│   ├── server.js               # Main server entry point
│   ├── package.json            # Dependencies and scripts
│   ├── Dockerfile              # Container configuration
│   ├── docker-compose.yml      # Multi-service deployment
│   └── .env.example            # Environment configuration template
└── 📁 docs/
    ├── DEPLOYMENT.md           # Production deployment guide
    ├── API.md                  # API documentation
    └── SECURITY.md             # Security best practices
```

## 🔧 **Development & Deployment**

### **Development Setup**
```bash
# Frontend Development
git clone https://github.com/yourusername/easymove.git
cd easymove
python -m http.server 8000  # or use Live Server in VS Code

# Backend Development
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### **Production Deployment**

#### **Docker Deployment (Recommended)**
```bash
cd backend
cp .env.example .env
# Update .env with production values
chmod +x deploy.sh
./deploy.sh
```

#### **Manual Deployment**
```bash
# Install dependencies
npm install --production

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **Environment Variables**
Key variables to configure in `.env`:
```env
NODE_ENV=production
MONGODB_URI=mongodb://username:password@localhost:27017/easymove
STRIPE_SECRET_KEY=sk_live_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
JWT_SECRET=your_super_secure_secret
FRONTEND_URL=https://easymove.app
```

### **API Endpoints**

#### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/verify-email/:token` - Email verification

#### **Transactions**
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get user transactions
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/cancel` - Cancel transaction
- `GET /api/transactions/:id/receipt` - Download receipt

#### **Payments**
- `POST /api/payments/stripe/intent` - Create Stripe payment intent
- `POST /api/payments/paypal/create` - Create PayPal payment
- `POST /api/payments/stripe/webhook` - Stripe webhook handler
- `POST /api/payments/paypal/webhook` - PayPal webhook handler

#### **Users**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-document` - Upload KYC document
- `GET /api/users/balance` - Get account balance

#### **Currencies**
- `GET /api/currencies` - Get supported currencies
- `GET /api/currencies/rates` - Get current exchange rates
- `GET /api/currencies/:from/:to` - Get specific rate

## 🌍 **Global Currency Support (100+ Currencies)**

### **Major Currencies**
- **USD** 🇺🇸 US Dollar | **EUR** 🇪🇺 Euro | **GBP** 🇬🇧 British Pound | **JPY** 🇯🇵 Japanese Yen
- **CAD** 🇨🇦 Canadian Dollar | **AUD** 🇦🇺 Australian Dollar | **CHF** 🇨🇭 Swiss Franc

### **African Currencies** *(Complete Coverage)*
- **NGN** 🇳🇬 Nigerian Naira | **ZAR** 🇿🇦 South African Rand | **KES** 🇰🇪 Kenyan Shilling
- **GHS** 🇬🇭 Ghanaian Cedi | **EGP** 🇪🇬 Egyptian Pound | **MAD** 🇲🇦 Moroccan Dirham
- **TND** 🇹🇳 Tunisian Dinar | **XOF** 🌍 West African CFA Franc | **XAF** 🌍 Central African CFA Franc

### **Asian Currencies**
- **INR** 🇮🇳 Indian Rupee | **CNY** 🇨🇳 Chinese Yuan | **KRW** 🇰🇷 South Korean Won
- **SGD** 🇸🇬 Singapore Dollar | **HKD** 🇭🇰 Hong Kong Dollar | **THB** 🇹🇭 Thai Baht

### **Latin American Currencies**
- **BRL** 🇧🇷 Brazilian Real | **MXN** 🇲🇽 Mexican Peso | **ARS** 🇦🇷 Argentine Peso
- **CLP** 🇨🇱 Chilean Peso | **COP** 🇨🇴 Colombian Peso | **PEN** 🇵🇪 Peruvian Sol

## 📊 **Performance & Security**

### **Performance Features**
- **PWA Optimization**: Lighthouse score 95+ across all categories
- **Lazy Loading**: Images and components loaded on demand
- **Caching Strategy**: Intelligent caching with service worker
- **CDN Support**: Static assets served from CDN
- **Database Optimization**: Indexed queries and connection pooling
- **Real-time Updates**: WebSocket connections for instant notifications

### **Security Measures**
- **HTTPS Enforcement**: All traffic encrypted with TLS 1.3
- **CSP Headers**: Content Security Policy prevents XSS attacks
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All user input sanitized and validated
- **JWT Security**: Short-lived tokens with secure refresh mechanism
- **PCI Compliance**: Secure payment processing with tokenization
- **KYC/AML**: Identity verification and compliance monitoring

## 🔧 **Configuration & Customization**

### **Frontend Customization**
```css
/* Update brand colors in styles.css */
:root {
    --primary-color: #2563eb;
    --secondary-color: #dc2626;
    --success-color: #16a34a;
    --warning-color: #ca8a04;
}
```

### **Backend Configuration**
```env
# Transaction limits
MIN_TRANSACTION_AMOUNT=1
MAX_TRANSACTION_AMOUNT=50000
DAILY_TRANSACTION_LIMIT=100000

# KYC requirements
KYC_REQUIRED_AMOUNT=1000
AML_CHECK_ENABLED=true

# Payment gateway settings
STRIPE_WEBHOOK_TOLERANCE=300
PAYPAL_SANDBOX_MODE=false
```

## 🚀 **Getting Started**

### **Demo Mode (Frontend Only)**
```bash
# Clone and run locally
git clone https://github.com/yourusername/easymove.git
cd easymove
python -m http.server 8000
# Visit http://localhost:8000
```

### **Production Setup (Full Stack)**
```bash
# Backend setup
cd backend
cp .env.example .env
# Configure environment variables
./deploy.sh
```

## 🔗 **Useful Links**

- **📖 [Deployment Guide](backend/DEPLOYMENT.md)** - Complete production deployment instructions
- **🔒 [Security Configuration](server-config.md)** - HTTPS and security setup
- **🌐 [Live Demo](https://easymove.app)** - Try the application online
- **📚 [API Documentation](backend/docs/API.md)** - Complete API reference
- **🔧 [Development Guide](backend/docs/DEVELOPMENT.md)** - Contributing guidelines

## 🤝 **Contributing**

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

### **Development Workflow**
```bash
# Fork the repository and clone
git clone https://github.com/yourusername/easymove.git
cd easymove

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
# Backend changes
cd backend && npm test

# Frontend changes - test in browser
python -m http.server 8000

# Commit and push
git add .
git commit -m "Add your feature description"
git push origin feature/your-feature-name

# Create pull request
```

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Yawo Faustin AZIAKPO**
- GitHub: [@Faus7679](https://github.com/Faus7679)
- Email: contact@easymove.app

## 🙏 **Acknowledgments**

- **Exchange Rate API** for real-time currency conversion
- **Stripe & PayPal** for secure payment processing
- **MongoDB & Redis** for robust data management
- **The open-source community** for amazing tools and libraries

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

**🚀 Ready to revolutionize money transfers? Deploy EasyMove today!**

Made with ❤️ by [Yawo Faustin AZIAKPO](https://github.com/Faus7679)

</div>

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
