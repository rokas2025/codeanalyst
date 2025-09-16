# CodeAnalyst - Deployment Guide

## Overview
This guide covers deploying CodeAnalyst in production environments, including VM requirements, database setup, and configuration steps.

## VM Requirements

### Minimum System Requirements
- **CPU**: 4 cores (8 recommended for better AI processing)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended for analysis storage)
- **Network**: 1Gbps connection for fast GitHub repository cloning
- **OS**: Ubuntu 20.04 LTS or higher, CentOS 8+, or Amazon Linux 2

### Recommended Production Setup
- **CPU**: 8 cores Intel/AMD
- **RAM**: 32GB
- **Storage**: 500GB NVMe SSD
- **Network**: High-bandwidth connection
- **Load Balancer**: For multiple instances

## Database Requirements

### PostgreSQL Setup
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-14 postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE codeanalyst;
CREATE USER codeanalyst_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE codeanalyst TO codeanalyst_user;
ALTER USER codeanalyst_user CREATEDB;
\q
```

### Redis Setup
```bash
# Ubuntu/Debian
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# Set: maxmemory 2gb
# Set: maxmemory-policy allkeys-lru
# Set: requirepass your_redis_password

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Production Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git

# Create application user
sudo useradd -m -s /bin/bash codeanalyst
sudo usermod -aG sudo codeanalyst
```

### 2. Application Setup
```bash
# Switch to application user
sudo su - codeanalyst

# Clone repository
git clone https://github.com/your-org/codeanalyst.git
cd codeanalyst

# Install frontend dependencies
npm install
npm run build

# Install backend dependencies
cd backend
npm install
```

### 3. Environment Configuration

#### Backend Environment (.env)
```bash
cd backend
cp env.example .env
nano .env
```

```env
# Production Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://codeanalyst_user:secure_password@localhost:5432/codeanalyst
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeanalyst
DB_USER=codeanalyst_user
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://:your_redis_password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your-super-long-random-jwt-secret-256-bits
JWT_EXPIRES_IN=7d

# AI Services (at least one required)
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub Integration
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-github-token

# File Uploads
MAX_FILE_SIZE=100MB
UPLOAD_DIR=/var/www/codeanalyst/uploads
TEMP_DIR=/var/www/codeanalyst/temp

# Analysis Settings
MAX_CONCURRENT_ANALYSES=5
ANALYSIS_TIMEOUT=300000
MAX_REPO_SIZE=500MB
MAX_ZIP_SIZE=100MB

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ANALYSIS_RATE_LIMIT_MAX=10

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/codeanalyst/app.log
```

#### Frontend Environment
```bash
cd ..
cp frontend.env.example .env
nano .env
```

```env
VITE_API_URL=https://api.your-domain.com
VITE_FRONTEND_URL=https://your-domain.com
VITE_GITHUB_CLIENT_ID=your-github-oauth-client-id
```

### 4. Database Migration
```bash
cd backend
npm run db:migrate
```

### 5. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 6. Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/codeanalyst
```

```nginx
# Frontend (React App)
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    root /home/codeanalyst/codeanalyst/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    listen [::]:80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/codeanalyst /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. PM2 Process Management
```bash
cd backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'codeanalyst-api',
      script: 'src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/codeanalyst/api-error.log',
      out_file: '/var/log/codeanalyst/api-out.log',
      log_file: '/var/log/codeanalyst/api.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G'
    },
    {
      name: 'codeanalyst-worker',
      script: 'src/workers/analysisWorker.js',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/codeanalyst/worker-error.log',
      out_file: '/var/log/codeanalyst/worker-out.log',
      log_file: '/var/log/codeanalyst/worker.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G'
    }
  ]
};
EOF

# Create log directory
sudo mkdir -p /var/log/codeanalyst
sudo chown codeanalyst:codeanalyst /var/log/codeanalyst

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Docker Deployment (Alternative)

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: codeanalyst
      POSTGRES_USER: codeanalyst_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass your_redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://codeanalyst_user:secure_password@postgres:5432/codeanalyst
      REDIS_URL: redis://:your_redis_password@redis:6379
    volumes:
      - ./backend/.env:/app/.env
      - upload_data:/app/uploads
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  upload_data:
```

## Monitoring & Maintenance

### Log Monitoring
```bash
# Install log rotation
sudo nano /etc/logrotate.d/codeanalyst

/var/log/codeanalyst/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 codeanalyst codeanalyst
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Checks
```bash
# Create health check script
cat > /home/codeanalyst/health-check.sh << EOF
#!/bin/bash
curl -f http://localhost:3001/health || exit 1
EOF

chmod +x /home/codeanalyst/health-check.sh

# Add to crontab
echo "*/5 * * * * /home/codeanalyst/health-check.sh" | crontab -
```

### Database Backups
```bash
# Create backup script
cat > /home/codeanalyst/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/codeanalyst"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U codeanalyst_user codeanalyst > $BACKUP_DIR/codeanalyst_$DATE.sql
gzip $BACKUP_DIR/codeanalyst_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /home/codeanalyst/backup-db.sh

# Add daily backup to crontab
echo "0 2 * * * /home/codeanalyst/backup-db.sh" | crontab -
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy, or cloud LB)
- Deploy multiple backend instances
- Share Redis instance across all backends
- Use external PostgreSQL (RDS, managed service)

### Performance Optimization
- Enable Redis clustering for high availability
- Use CDN for static assets
- Implement database read replicas
- Consider GPU instances for faster AI processing

### Security Best Practices
- Regular security updates
- Firewall configuration (UFW or cloud security groups)
- Regular database backups
- Monitor access logs
- Use secrets management (AWS Secrets Manager, etc.)

## Troubleshooting

### Common Issues
1. **High memory usage**: Increase VM RAM or optimize analysis concurrency
2. **Slow AI responses**: Check API key quotas and network connectivity
3. **Database connection errors**: Verify PostgreSQL service and credentials
4. **File upload failures**: Check disk space and upload directory permissions

### Debug Commands
```bash
# Check service status
pm2 status
systemctl status postgresql
systemctl status redis-server
systemctl status nginx

# View logs
pm2 logs codeanalyst-api
pm2 logs codeanalyst-worker
tail -f /var/log/codeanalyst/app.log

# Test database connection
psql -h localhost -U codeanalyst_user -d codeanalyst

# Test Redis connection
redis-cli -a your_redis_password ping
```

