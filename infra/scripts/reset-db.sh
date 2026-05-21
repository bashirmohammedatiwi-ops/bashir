#!/usr/bin/env bash
# Full reset: wipe volumes + redeploy (fixes P3009 failed migrations).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

: "${DOMAIN:?Set DOMAIN in .env}"

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Stopping and removing all volumes (DB + redis + media)..."
$COMPOSE down -v

echo "==> IP deploy config..."
cp nginx/default.bootstrap.conf nginx/default.conf

cat > docker-compose.override.yml <<EOF
services:
  api:
    environment:
      MEDIA_PUBLIC_BASE_URL: http://${DOMAIN}/media
      AUTO_FIX_MIGRATIONS: "1"
  nginx:
    depends_on:
      api:
        condition: service_started
EOF

echo "==> Starting fresh stack..."
$COMPOSE up -d --build

echo ""
echo "Wait 2-3 minutes, then:"
echo "  docker compose -f docker-compose.prod.yml logs api --tail=30"
echo "  curl http://${DOMAIN}/api/v1/health"
