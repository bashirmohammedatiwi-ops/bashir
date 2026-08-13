#!/usr/bin/env bash
# Full reset: wipe volumes + redeploy (fixes P3009 failed migrations).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example first."
  exit 1
fi

set -a
source .env
set +a

: "${DOMAIN:?Set DOMAIN in .env}"

# Seed slows first boot — disable for initial deploy
if grep -q '^RUN_SEED=1' .env; then
  sed -i 's/^RUN_SEED=1/RUN_SEED=0/' .env
  echo "==> Set RUN_SEED=0 for faster first boot (seed manually later)."
fi

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Stopping and removing all volumes..."
$COMPOSE down -v

cp nginx/default.bootstrap.conf nginx/default.conf

cat > docker-compose.override.yml <<EOF
services:
  api:
    environment:
      MEDIA_PUBLIC_BASE_URL: http://${DOMAIN}/media
  nginx:
    depends_on:
      api:
        condition: service_started
EOF

echo "==> Starting fresh stack..."
$COMPOSE up -d --build

echo ""
echo "Wait 60-90 seconds, then run:"
echo "  docker compose -f docker-compose.prod.yml logs api --tail=40"
echo "  curl http://${DOMAIN}/api/v1/health"
echo ""
echo "Then seed admin user:"
echo "  docker compose -f docker-compose.prod.yml exec api npx tsx prisma/seed.ts"
