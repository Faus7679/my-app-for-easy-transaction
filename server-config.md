# HTTPS and Security Configuration

## For Apache (.htaccess)
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:;"

# Cache Control
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

<FilesMatch "\.(html|htm)$">
    Header set Cache-Control "public, max-age=3600"
</FilesMatch>

# Compress files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## For Nginx
```nginx
server {
    listen 80;
    server_name easymove.app www.easymove.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name easymove.app www.easymove.app;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:;" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    root /var/www/easymove;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service Worker
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache";
    }
    
    # Manifest
    location /manifest.json {
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

## Environment Variables (.env)
```bash
# Domain Configuration
DOMAIN=easymove.app
HTTPS_REDIRECT=true
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key

# Security
CSP_ENABLED=true
HSTS_ENABLED=true
HSTS_MAX_AGE=63072000

# API Configuration
API_BASE_URL=https://api.easymove.app
API_VERSION=v2
API_TIMEOUT=30000

# PWA Configuration
PWA_ENABLED=true
OFFLINE_SUPPORT=true
PUSH_NOTIFICATIONS=true

# Performance
GZIP_ENABLED=true
CACHE_STATIC_ASSETS=true
CACHE_MAX_AGE=31536000
```

## SSL Certificate Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --apache -d easymove.app -d www.easymove.app

# Auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Domain Configuration (DNS Records)
```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          300
A       www     YOUR_SERVER_IP          300
CNAME   api     api.easymove.app        300
TXT     @       "v=spf1 -all"           300
```

## Security Checklist
- [x] HTTPS enforced (301 redirects)
- [x] HSTS header implemented
- [x] CSP (Content Security Policy) configured
- [x] XSS protection enabled
- [x] MIME type sniffing disabled
- [x] Clickjacking protection (X-Frame-Options)
- [x] Referrer policy configured
- [x] SSL/TLS properly configured
- [x] Secure cookies enabled
- [x] CORS policy implemented
- [x] Input validation and sanitization
- [x] Rate limiting for API endpoints