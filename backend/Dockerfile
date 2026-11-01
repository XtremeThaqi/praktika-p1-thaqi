FROM php:8.3-apache-bookworm

# Laravel 12 and the application's MySQL/MariaDB connection.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git unzip libonig-dev libzip-dev libicu-dev \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql mbstring bcmath intl zip opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Serve only Laravel's public directory, with its .htaccess rewrite rules.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf \
    && printf '%s\n' \
        '<Directory /var/www/html/public>' \
        '    AllowOverride All' \
        '    Require all granted' \
        '</Directory>' > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf '%s\n' \
        'upload_max_filesize=6M' \
        'post_max_size=8M' \
        'memory_limit=256M' > "$PHP_INI_DIR/conf.d/laravel.ini"

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html

# Cache dependencies separately from application code.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .
RUN composer dump-autoload --no-dev --optimize \
    && mkdir -p storage/app/public storage/framework/cache/data \
        storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache

# Render terminates HTTPS externally; Apache must bind to 0.0.0.0:$PORT.
EXPOSE 10000
CMD ["sh", "-c", "sed -i \"s/^Listen 80$/Listen ${PORT:-10000}/\" /etc/apache2/ports.conf && sed -i \"s/:80>/:${PORT:-10000}>/\" /etc/apache2/sites-available/000-default.conf && exec apache2-foreground"]
