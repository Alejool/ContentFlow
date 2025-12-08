#!/bin/bash
set -e

echo "Starting Laravel application..."

# Wait for database to be ready
echo "Waiting for database connection..."
php artisan wait-for-db --timeout=60

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Clear and cache configurations
echo "Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link if it doesn't exist
if [ ! -L /var/www/html/public/storage ]; then
    echo "Creating storage symlink..."
    php artisan storage:link
fi

# Set proper permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "Application ready!"

# Execute the main command
exec "$@"
