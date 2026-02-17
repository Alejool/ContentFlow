#!/bin/sh
set -e

echo "Installing dependencies..."
composer install --no-interaction --prefer-dist

echo "Starting Octane..."
exec php artisan octane:start --server=swoole --host=0.0.0.0 --port=8080 --watch --poll
