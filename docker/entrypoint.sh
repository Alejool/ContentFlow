# Dockerfile ÚLTRA SIMPLE - sin usuarios especiales
FROM php:8.2-fpm

WORKDIR /var/www/html

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev libzip-dev zip unzip \
    libicu-dev libfreetype6-dev libjpeg62-turbo-dev libwebp-dev libxpm-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar extensiones PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install \
    pdo_mysql mbstring exif pcntl bcmath gd zip intl opcache

# Instalar Redis
RUN pecl install redis && docker-php-ext-enable redis

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configurar PHP
RUN echo 'memory_limit = 512M' >> /usr/local/etc/php/conf.d/custom.ini \
    && echo 'upload_max_filesize = 128M' >> /usr/local/etc/php/conf.d/custom.ini \
    && echo 'post_max_size = 128M' >> /usr/local/etc/php/conf.d/custom.ini \
    && echo 'max_execution_time = 300' >> /usr/local/etc/php/conf.d/custom.ini \
    && echo 'display_errors = On' >> /usr/local/etc/php/conf.d/custom.ini

# Exponer puerto
EXPOSE 9000

# Comando SIMPLE - sin entrypoint complicado
CMD ["php-fpm", "-F"]