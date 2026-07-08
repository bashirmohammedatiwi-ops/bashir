#!/usr/bin/env bash
# تحديث API فقط — أخف من rebuild كامل، مع تنظيف تلقائي.
# لا يستخدم --no-cache إلا إذا فشل البناء.
#
# Usage: cd infra && ./scripts/update-api.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml"
DOMAIN="${DOMAIN:-187.127.88.146}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "==> Build API (with cache — أسرع وأقل مساحة)..."
$COMPOSE build api
$COMPOSE up -d api

echo "==> Wait for API..."
sleep 25

echo "==> Migrations..."
$COMPOSE exec -T api npx prisma migrate deploy || true

echo "==> Backfill images (if needed)..."
$COMPOSE exec -T api node scripts/backfill-product-images.js 2>/dev/null || true

echo "==> Restart nginx..."
$COMPOSE restart nginx

echo "==> Cleanup disk..."
chmod +x scripts/docker-cleanup.sh
./scripts/docker-cleanup.sh

echo ""
curl -sS -m 15 "http://${DOMAIN}/api/v1/health" || echo "Check: curl http://${DOMAIN}/api/v1/health"
echo ""
echo "Update API complete."
