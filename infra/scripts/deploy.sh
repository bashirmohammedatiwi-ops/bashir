#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA_ROOT="$ROOT"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env — copy .env.example and edit values."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DOMAIN:?Set DOMAIN in .env}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"
: "${JWT_ACCESS_SECRET:?Set JWT_ACCESS_SECRET in .env}"
: "${JWT_REFRESH_SECRET:?Set JWT_REFRESH_SECRET in .env}"

COMPOSE="docker compose -f docker-compose.prod.yml"
# shellcheck source=lib/deploy-common.sh
source "$ROOT/scripts/lib/deploy-common.sh"

chmod +x scripts/*.sh scripts/lib/*.sh 2>/dev/null || true

ensure_env_production_defaults
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "==> Rendering Nginx (bootstrap)..."
cp nginx/default.bootstrap.conf nginx/default.conf

echo "==> Building and starting stack..."
$COMPOSE up -d --build postgres redis api nginx catalog-hub

echo "==> Waiting for API..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
    echo "API ready."
    break
  fi
  sleep 2
done

maybe_enable_https

echo "==> Enabling HTTPS Nginx config..."
reload_nginx_stack
sync_hsts_with_ssl

echo "==> Building admin web panel..."
build_admin_web_panel
reload_nginx_stack
ensure_certbot_renew_loop

ensure_nginx_responding || echo "WARN: Admin/nginx check failed — run ./scripts/verify.sh"

if [[ "${RUN_SEED:-0}" == "1" ]]; then
  echo ""
  echo "NOTE: RUN_SEED=1 creates/updates admin only. Set RUN_SEED=0 after first boot."
  echo "      Demo brands/products require SEED_DEMO=1 (keep it 0 on production)."
fi

echo ""
echo "Deploy complete."
print_stack_urls
echo ""
echo "Desktop exe (optional):"
echo "  cd admin-desktop && cp .env.production.example .env.production"
echo "  # NEXT_PUBLIC_API_BASE=https://${DOMAIN}/api/v1"
echo "  npm run dist"
