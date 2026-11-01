#!/bin/sh
set -eu

# CA is supplied via Render environment, never embedded in a Docker image.
if [ -n "${AIVEN_CA_CERT_B64:-}" ]; then
    printf '%s' "$AIVEN_CA_CERT_B64" | base64 -d > /tmp/aiven-ca.pem
    chmod 0644 /tmp/aiven-ca.pem
fi

if [ -n "${MYSQL_ATTR_SSL_CA:-}" ] && [ ! -s "$MYSQL_ATTR_SSL_CA" ]; then
    echo "Configured MySQL CA certificate is missing." >&2
    exit 1
fi

# Free Render services do not support pre-deploy commands.
# Migrations are idempotent, and sample data is only inserted into an empty catalogue.
php artisan migrate --force

if [ "${SEED_DEMO_IF_EMPTY:-false}" = "true" ]; then
    php artisan demo:seed-if-empty
fi

php artisan admin:bootstrap-if-missing

port="${PORT:-10000}"
case "$port" in
    ''|*[!0-9]*) echo "Invalid Render PORT." >&2; exit 1 ;;
esac

sed -i "s/^Listen 80$/Listen ${port}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${port}>/" /etc/apache2/sites-available/000-default.conf
exec apache2-foreground
