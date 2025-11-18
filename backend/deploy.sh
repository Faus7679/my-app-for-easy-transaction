#!/bin/bash

# EasyMove Backend Deployment Script
# This script sets up the production environment and deploys the EasyMove backend

set -e

echo "🚀 Starting EasyMove Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from template"
        
        # Generate secure secrets
        JWT_SECRET=$(generate_secret)
        JWT_REFRESH_SECRET=$(generate_secret)
        ENCRYPTION_KEY=$(generate_secret)
        SESSION_SECRET=$(generate_secret)
        REDIS_PASSWORD=$(generate_secret)
        
        # Update .env file with generated secrets
        sed -i "s/your-super-secure-jwt-secret-key-here/$JWT_SECRET/g" .env
        sed -i "s/your-super-secure-refresh-secret-key-here/$JWT_REFRESH_SECRET/g" .env
        sed -i "s/your-32-character-encryption-key-here/$ENCRYPTION_KEY/g" .env
        sed -i "s/your-session-secret-key/$SESSION_SECRET/g" .env
        sed -i "s/your-redis-password/$REDIS_PASSWORD/g" .env
        
        print_success "Generated secure secrets and updated .env file"
        print_warning "Please update the following in your .env file:"
        echo "  - Payment gateway credentials (Stripe, PayPal)"
        echo "  - Email service configuration (SendGrid)"
        echo "  - Database credentials"
        echo "  - Domain names and URLs"
        echo ""
        read -p "Press Enter to continue after updating .env file..."
    else
        print_warning ".env file already exists. Skipping environment setup."
    fi
}

# Function to create necessary directories
setup_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p ssl
    mkdir -p backups
    
    # Set proper permissions
    chmod 755 logs uploads backups
    chmod 700 ssl
    
    print_success "Created application directories"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -f ssl/easymove.crt ] || [ ! -f ssl/easymove.key ]; then
        print_warning "SSL certificates not found. Generating self-signed certificates for development..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/easymove.key \
            -out ssl/easymove.crt \
            -subj "/C=US/ST=State/L=City/O=EasyMove/CN=easymove.app" \
            -addext "subjectAltName=DNS:easymove.app,DNS:www.easymove.app,DNS:api.easymove.app"
        
        chmod 600 ssl/easymove.key
        chmod 644 ssl/easymove.crt
        
        print_success "Generated self-signed SSL certificates"
        print_warning "For production, replace with valid SSL certificates from a CA"
    else
        print_success "SSL certificates already exist"
    fi
}

# Function to build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Stop any existing containers
    docker-compose down --remove-orphans
    
    # Pull latest images
    docker-compose pull
    
    # Build the application
    docker-compose build --no-cache easymove-api
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB to be ready..."
    until docker-compose exec -T easymove-mongodb mongosh --eval "db.runCommand('ping').ok" --quiet; do
        sleep 2
    done
    print_success "MongoDB is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis to be ready..."
    until docker-compose exec -T easymove-redis redis-cli ping | grep -q PONG; do
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for API
    print_status "Waiting for API to be ready..."
    until docker-compose exec -T easymove-api curl -f http://localhost:3000/health; do
        sleep 5
    done
    print_success "API is ready"
}

# Function to run database migrations/setup
setup_database() {
    print_status "Setting up database..."
    
    # Run any database setup commands here
    # For example, creating indexes, initial data, etc.
    
    print_success "Database setup completed"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if all containers are running
    if [ "$(docker-compose ps -q | wc -l)" -eq 6 ]; then
        print_success "All containers are running"
    else
        print_error "Some containers are not running"
        docker-compose ps
        exit 1
    fi
    
    # Check API health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        exit 1
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo "🎉 EasyMove Backend Deployment Complete!"
    echo ""
    echo "Services:"
    echo "  📱 API Server: https://localhost (Internal: http://localhost:3000)"
    echo "  🗄️  MongoDB: localhost:27017"
    echo "  🔴 Redis: localhost:6379"
    echo "  🌐 Nginx: https://localhost"
    echo "  📊 Mongo Express: http://localhost:8081"
    echo "  🔍 Redis Commander: http://localhost:8082"
    echo ""
    echo "Useful commands:"
    echo "  📋 View logs: docker-compose logs -f"
    echo "  🔄 Restart services: docker-compose restart"
    echo "  🛑 Stop services: docker-compose down"
    echo "  📊 View status: docker-compose ps"
    echo ""
    echo "Next steps:"
    echo "  1. Update DNS records to point to your server"
    echo "  2. Replace self-signed certificates with valid SSL certificates"
    echo "  3. Configure monitoring and alerting"
    echo "  4. Set up automated backups"
    echo "  5. Configure log rotation"
    echo ""
}

# Main deployment flow
main() {
    echo "EasyMove Backend Deployment"
    echo "=========================="
    echo ""
    
    setup_environment
    setup_directories
    setup_ssl
    start_services
    wait_for_services
    setup_database
    verify_deployment
    show_summary
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main deployment
main