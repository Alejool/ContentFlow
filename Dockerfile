FROM php:8.3-alpine AS production

# 1. Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    libxslt-dev \
    postgresql-dev \
    nodejs \
    npm \
    linux-headers \
    openssl-dev \
    brotli-dev \
    zstd-dev \
    libxml2-dev \
    $PHPIZE_DEPS \
    && pecl install redis swoole \
    && docker-php-ext-enable redis swoole \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    intl \
    zip \
    opcache \
    pcntl \
    xsl \
    bcmath \
    sockets

# 2. Configure PHP
RUN echo "memory_limit=512M" > /usr/local/etc/php/conf.d/docker-php.ini \
    && echo "variables_order=EGPCS" >> /usr/local/etc/php/conf.d/docker-php.ini

# 3. Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html

# 4. Copy application files
COPY . .

# 5. Install PHP dependencies
RUN rm -rf public/build public/hot node_modules vendor \
    && composer install --optimize-autoloader

# 6. Build Frontend Assets
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME \
    NODE_ENV=production

RUN npm install --include=dev && npm run build && rm -rf node_modules

# 7. Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Expose port
EXPOSE 8080 6001

# 9. Start Octane with Swoole
# CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8080"]

CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8080"]

