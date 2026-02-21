FROM php:8.4-alpine AS production

# ----------------------------------------------------
# 1. System dependencies + PHP build dependencies
# ----------------------------------------------------
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
    autoconf \
    pkgconf \
    make \
    g++ \
    gcc \
    libc-dev \
    re2c \
    file \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev \
    ffmpeg

# ----------------------------------------------------
# 2. PHP extensions (Redis, Swoole, PostgreSQL, etc.)
# ----------------------------------------------------
# Configure GD with support for JPEG, PNG, WebP, and FreeType
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
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
        posix \
        xsl \
        bcmath \
        sockets \
        gd

# ----------------------------------------------------
# 3. PHP configuration (custom.ini)
# ----------------------------------------------------
COPY docker/php/custom.ini /usr/local/etc/php/conf.d/99-custom.ini

# ----------------------------------------------------
# 4. Install Composer
# ----------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ----------------------------------------------------
# 5. Application setup
# ----------------------------------------------------
WORKDIR /var/www/html
COPY . .

# ----------------------------------------------------
# 6. PHP dependencies
# ----------------------------------------------------
RUN rm -rf public/build public/hot node_modules vendor \
    && composer install --optimize-autoloader --no-interaction --no-progress

# ----------------------------------------------------
# 7. Frontend build (Vite)
# ----------------------------------------------------
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME \
    NODE_ENV=production

RUN npm install --include=dev \
    && npm run build \
    && rm -rf node_modules

# ----------------------------------------------------
# 8. Permissions
# ----------------------------------------------------
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ----------------------------------------------------
# 9. Expose ports
# ----------------------------------------------------
EXPOSE 8080 6001

# ----------------------------------------------------
# 10. Start Laravel Octane (Swoole)
# ----------------------------------------------------
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8080"]
