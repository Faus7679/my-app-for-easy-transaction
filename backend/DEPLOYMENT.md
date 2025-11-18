# EasyMove Backend Production Deployment Guide

This guide will help you deploy the EasyMove backend to a production environment using Docker containers.

## Prerequisites

Before deploying, ensure you have:

- Docker and Docker Compose installed
- Domain name configured (easymove.app, api.easymove.app)
- SSL certificates (or use the provided self-signed certificates for testing)
- Payment gateway accounts (Stripe, PayPal)
- Email service account (SendGrid)
- Cloud storage account (AWS S3) for file uploads

## Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to the backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Configure Environment Variables

Update the following critical variables in `.env`:

```env
# Production Settings
NODE_ENV=production
FRONTEND_URL=https://easymove.app
API_URL=https://api.easymove.app

# Database (update with your credentials)
MONGODB_URI=mongodb://username:password@easymove-mongodb:27017/easymove?authSource=admin
REDIS_URL=redis://:your-redis-password@easymove-redis:6379

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
PAYPAL_CLIENT_ID=your_paypal_live_client_id
PAYPAL_CLIENT_SECRET=your_paypal_live_secret
PAYPAL_MODE=live

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@easymove.app

# Security (generate strong secrets)
JWT_SECRET=your-256-bit-secret
ENCRYPTION_KEY=your-32-character-key
```

### 3. SSL Certificates

For production, place your SSL certificates in the `ssl/` directory:
```bash
mkdir -p ssl
# Copy your certificates
cp your-certificate.crt ssl/easymove.crt
cp your-private-key.key ssl/easymove.key
```

### 4. Deploy with Script

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 5. Manual Deployment

If you prefer manual deployment:

```bash
# Create directories
mkdir -p logs uploads ssl backups

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## Architecture Overview

The deployment includes:

- **API Server**: Node.js/Express application
- **MongoDB**: Primary database with authentication
- **Redis**: Caching and queue management
- **Nginx**: Reverse proxy and load balancer
- **Mongo Express**: Database management interface
- **Redis Commander**: Redis management interface

## Service Configuration

### API Server
- Port: 3000 (internal), 443 (external via Nginx)
- Health check: `/health`
- WebSocket support: `/socket.io/`

### MongoDB
- Port: 27017
- Database: `easymove`
- Authentication enabled
- Automatic backups configured

### Redis
- Port: 6379
- Password protected
- Used for caching and job queues

### Nginx
- Ports: 80 (redirect), 443 (HTTPS)
- SSL termination
- Rate limiting
- CORS handling
- Static file serving

## Monitoring and Maintenance

### Health Checks

```bash
# Check all services
docker-compose ps

# Check API health
curl https://api.easymove.app/health

# View logs
docker-compose logs -f easymove-api
```

### Database Backups

```bash
# Manual backup
docker-compose exec easymove-mongodb mongodump --out /backups/$(date +%Y%m%d_%H%M%S)

# Restore from backup
docker-compose exec easymove-mongodb mongorestore /backups/backup_name
```

### Log Management

Logs are stored in the `logs/` directory and rotated automatically:
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## Security Considerations

### Network Security
- All services run in isolated Docker network
- Only necessary ports exposed
- Nginx handles SSL termination

### Application Security
- JWT tokens with short expiration
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS properly configured
- Security headers implemented

### Data Security
- Database authentication enabled
- Redis password protected
- Sensitive data encrypted at rest
- Regular security updates

## Performance Optimization

### Caching Strategy
- Redis for session storage
- API response caching
- Static asset caching via Nginx

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization

### Load Balancing
- Nginx as reverse proxy
- Multiple API instances can be added
- Session persistence via Redis

## Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check logs
   docker-compose logs
   
   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs easymove-mongodb
   
   # Test connection
   docker-compose exec easymove-mongodb mongosh
   ```

3. **Payment gateway errors**
   - Verify API keys in `.env`
   - Check webhook endpoints
   - Review payment service logs

4. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/easymove.crt -text -noout
   
   # Test SSL connection
   openssl s_client -connect api.easymove.app:443
   ```

### Log Analysis

```bash
# API logs
docker-compose logs -f easymove-api

# Database logs
docker-compose logs -f easymove-mongodb

# Nginx logs
docker-compose logs -f easymove-nginx

# Redis logs
docker-compose logs -f easymove-redis
```

## Scaling and High Availability

### Horizontal Scaling
```yaml
# Add to docker-compose.yml
easymove-api-2:
  build: .
  container_name: easymove-api-2
  # ... same configuration as easymove-api
```

### Database Clustering
Consider MongoDB replica sets for high availability:
```yaml
easymove-mongodb-secondary:
  image: mongo:7
  # Configure as secondary node
```

### Load Balancer Configuration
Update Nginx upstream configuration for multiple API instances:
```nginx
upstream easymove_backend {
    server easymove-api:3000;
    server easymove-api-2:3000;
    # Add more instances as needed
}
```

## Backup and Recovery

### Automated Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### Disaster Recovery
1. Regular database backups
2. Configuration file backups
3. SSL certificate backups
4. Log file rotation and archival

## Monitoring and Alerts

### Health Monitoring
- Set up monitoring for all service endpoints
- Configure alerts for service failures
- Monitor resource usage (CPU, memory, disk)

### Performance Monitoring
- API response times
- Database query performance
- Error rates and types
- User activity patterns

## Support and Maintenance

### Regular Updates
```bash
# Update container images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Security Updates
- Regularly update base images
- Monitor security advisories
- Update dependencies
- Review and rotate secrets

For additional support or questions, refer to the main project documentation or contact the development team.