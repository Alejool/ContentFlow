# Docker Setup for Laravel Application

Complete Docker configuration for running the Laravel application with all required services.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB of available RAM

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Copy environment file
cp .env.example .env

# Update .env with Docker-specific settings
# DB_HOST=mysql
# REDIS_HOST=redis
# QUEUE_CONNECTION=redis
# CACHE_DRIVER=redis
```

### 2. Build and Start

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 3. Initialize Application

```bash
# Generate application key
docker-compose exec app php artisan key:generate

# Run migrations
docker-compose exec app php artisan migrate

# Seed database (optional)
docker-compose exec app php artisan db:seed
```

### 4. Access Application

- **Application**: http://localhost
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 🛠️ Common Commands

### Application Management

```bash
# View logs
docker-compose logs -f app

# Access application container
docker-compose exec app bash

# Run artisan commands
docker-compose exec app php artisan [command]

# Install Composer dependencies
docker-compose exec app composer install

# Clear cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan view:clear
```

### Database Operations

```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u laravel -p

# Backup database
docker-compose exec mysql mysqldump -u laravel -p laravel > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u laravel -p laravel < backup.sql

# Fresh migration
docker-compose exec app php artisan migrate:fresh --seed
```

### Queue Management

```bash
# View queue logs
docker-compose logs -f queue

# Restart queue worker
docker-compose restart queue

# Process failed jobs
docker-compose exec app php artisan queue:retry all
```

### Development Mode

```bash
# Start with Node.js dev server (Vite HMR)
docker-compose --profile dev up -d

# View Vite logs
docker-compose logs -f node
```

## 🔧 Service Configuration

### Services Overview

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| app | laravel_app | 9000 | PHP-FPM application |
| nginx | laravel_nginx | 80, 443 | Web server |
| mysql | laravel_mysql | 3306 | Database |
| redis | laravel_redis | 6379 | Cache & Queue |
| queue | laravel_queue | - | Queue worker |
| scheduler | laravel_scheduler | - | Task scheduler |
| node | laravel_node | 5173 | Dev server (dev profile) |

### Environment Variables

Key variables to configure in `.env`:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=
```

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Permission issues

```bash
# Fix storage permissions
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

### Database connection failed

```bash
# Verify MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec app php artisan tinker
>>> DB::connection()->getPdo();
```

### Clear all data and restart

```bash
# Stop and remove all containers, volumes
docker-compose down -v

# Rebuild and start
docker-compose build
docker-compose up -d

# Reinitialize
docker-compose exec app php artisan migrate:fresh --seed
```

## 📦 Production Deployment

### Build for Production

```bash
# Build production image
docker-compose -f docker-compose.yml build

# Push to registry
docker tag laravel_app:latest your-registry/laravel_app:latest
docker push your-registry/laravel_app:latest
```

### Production Optimizations

1. **Disable dev services**: Remove `node` service or use profiles
2. **Enable OPcache**: Already configured in `php.ini`
3. **Use environment-specific configs**: Create `docker-compose.prod.yml`
4. **Set up SSL**: Add SSL certificates to Nginx configuration
5. **Configure backups**: Set up automated database backups

## 🔒 Security Considerations

- Change default database passwords in production
- Use secrets management for sensitive data
- Configure firewall rules
- Enable HTTPS with valid SSL certificates
- Regularly update Docker images
- Scan images for vulnerabilities

## 📚 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)

## 🆘 Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify service health: `docker-compose ps`
3. Review this documentation
4. Check Laravel logs: `storage/logs/laravel.log`
