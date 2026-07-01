#!/usr/bin/env bash
# Run pending Prisma migrations + product image backfill on the VPS.
# Usage (on server, from infra/):
#   chmod +x scripts/server-maintenance.sh
#   ./scripts/server-maintenance.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Applying database migrations..."
$COMPOSE exec -T api npx prisma migrate deploy

echo "==> Backfilling product placeholder images..."
$COMPOSE exec -T api node scripts/backfill-product-images.js

echo "==> Restarting nginx (fixes 502 after API rebuild)..."
$COMPOSE up -d catalog-hub 2>/dev/null || true
$COMPOSE restart nginx

echo "==> API logs (last 40 lines)..."
$COMPOSE logs api --tail=40

echo "==> Done. Check health:"
echo "    curl http://\${DOMAIN:-127.0.0.1}/api/v1/health"
