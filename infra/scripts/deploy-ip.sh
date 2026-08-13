#!/usr/bin/env bash
# Deploy on VPS using IP only (HTTP, no domain/SSL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Copy .env.example to .env and set DOMAIN to your VPS IP."
  exit 1
fi

set -a
source .env
set +a

: "${DOMAIN:?Set DOMAIN to your VPS IP in .env}"

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

echo "==> Building and starting (HTTP on port 80)..."
echo "==> Tip: set RUN_SEED=0 in .env if startup is slow; seed manually later."
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Building admin web panel..."
chmod +x scripts/build-admin-web.sh
./scripts/build-admin-web.sh
docker compose -f docker-compose.prod.yml up -d nginx

echo ""
echo "Wait 2-3 minutes, then:"
echo "  docker compose -f docker-compose.prod.yml logs api --tail=30"
echo "  curl http://${DOMAIN}/api/v1/health"
echo "  Admin panel: http://${DOMAIN}/"
