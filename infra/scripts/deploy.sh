#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env — copy .env.example and edit values."
  exit 1
fi

set -a
source .env
set +a

: "${DOMAIN:?Set DOMAIN in .env}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"
: "${JWT_ACCESS_SECRET:?Set JWT_ACCESS_SECRET in .env}"
: "${JWT_REFRESH_SECRET:?Set JWT_REFRESH_SECRET in .env}"

COMPOSE="docker compose -f docker-compose.prod.yml"

render_nginx() {
  local mode="${1:-bootstrap}"
  if [[ "$mode" == "bootstrap" ]]; then
    cp nginx/default.bootstrap.conf nginx/default.conf
  else
    sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" nginx/default.conf.template > nginx/default.conf
  fi
}

echo "==> Rendering Nginx (bootstrap)..."
render_nginx bootstrap

echo "==> Building and starting stack..."
$COMPOSE up -d --build postgres redis api nginx

echo "==> Waiting for API..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
    echo "API ready."
    break
  fi
  sleep 2
done

CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
if ! $COMPOSE exec -T nginx test -f "$CERT_PATH" 2>/dev/null; then
  echo "==> Requesting Let's Encrypt certificate for ${DOMAIN}..."
  $COMPOSE run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive
fi

echo "==> Enabling HTTPS Nginx config..."
render_nginx ssl
$COMPOSE up -d nginx

echo "==> Building admin web panel..."
chmod +x scripts/build-admin-web.sh
./scripts/build-admin-web.sh
$COMPOSE up -d nginx

echo "==> Starting certbot renew loop (optional profile)..."
$COMPOSE --profile certbot up -d certbot 2>/dev/null || true

if [[ "${RUN_SEED:-0}" == "1" ]]; then
  echo ""
  echo "NOTE: RUN_SEED=1 was used. Set RUN_SEED=0 in .env for future restarts."
fi

echo ""
echo "Deploy complete."
echo "  API:   https://${DOMAIN}/api/v1/health"
echo "  Ready: https://${DOMAIN}/api/v1/health/ready"
echo "  Media: https://${DOMAIN}/media/"
echo "  Admin: https://${DOMAIN}/"
echo ""
echo "Desktop exe (optional):"
echo "  cd admin-desktop && cp .env.production.example .env.production"
echo "  # NEXT_PUBLIC_API_BASE=https://${DOMAIN}/api/v1"
echo "  npm run dist"
