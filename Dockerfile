FROM php:8.3-fpm-alpine AS production

RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    mysql-client \
    $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        intl \
        zip \
        opcache \
        pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

RUN echo "upload_max_filesize=100M" > /usr/local/etc/php/conf.d/uploads.ini \
 && echo "post_max_size=100M" >> /usr/local/etc/php/conf.d/uploads.ini \
 && echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/uploads.ini \
 && echo "memory_limit=512M" >> /usr/local/etc/php/conf.d/uploads.ini

EXPOSE 9000
