FROM php:8.3-fpm-alpine AS production

# 1. Instalar dependencias esenciales
RUN apk add --no-cache \
    bash curl git unzip icu-dev libzip-dev oniguruma-dev libxslt-dev postgresql-dev nodejs npm $PHPIZE_DEPS \
    && pecl install redis && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_pgsql pgsql intl zip opcache pcntl xsl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html

# 2. Preparar archivos y dependencias
COPY . .
RUN rm -rf public/build public/hot node_modules vendor \
    && composer install --optimize-autoloader 

  #&& composer install --optimize-autoloader --no-dev

# 3. Build de Assets (Vite)
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    NODE_ENV=production

RUN npm install --include=dev && npm run build && rm -rf node_modules

# 4. Permisos y PHP Config
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache public/build \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && echo "memory_limit=512M" > /usr/local/etc/php/conf.d/docker-php.ini

# 5. Arranque compatible con Fly.io (HTTP)
EXPOSE 8080

ENTRYPOINT []

# Generamos la clave si no existe y arrancamos el servidor HTTP
CMD ["sh", "-c", "php artisan config:clear && php artisan route:clear && exec php -S 0.0.0.0:8080 -t public"]
