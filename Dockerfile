FROM php:8.3-fpm-alpine AS production

# 1. Instalar dependencias del sistema
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    libxslt-dev \
    postgresql-client \
    nodejs \
    npm \
    $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk add --no-cache postgresql-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        intl \
        zip \
        opcache \
        pcntl \
        xsl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 2. Copiar archivos del proyecto
COPY . .

# 3. LIMPIEZA TOTAL antes de cualquier build
# Borramos lo que viene de tu PC (Tailscale, builds viejos, etc)
RUN rm -rf public/build public/hot node_modules vendor

# 4. Instalar dependencias de PHP
RUN composer install --no-dev --optimize-autoloader

# 5. Instalar dependencias de JS y compilar (Vite)
# Usamos --include=dev para que encuentre 'vite'
ENV NODE_ENV=production
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST

ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST

RUN npm install --include=dev
RUN npm run build

# 6. Permisos correctos para Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/build
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 7. Configuración de PHP
RUN echo "upload_max_filesize=100M" > /usr/local/etc/php/conf.d/uploads.ini \
 && echo "post_max_size=100M" >> /usr/local/etc/php/conf.d/uploads.ini \
 && echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/uploads.ini \
 && echo "memory_limit=512M" >> /usr/local/etc/php/conf.d/uploads.ini

EXPOSE 8080

# 8. Comando de arranque limpio
CMD ["sh", "-c", "php artisan config:clear && php artisan view:clear && php artisan route:clear && php -S 0.0.0.0:8080 -t public"]
