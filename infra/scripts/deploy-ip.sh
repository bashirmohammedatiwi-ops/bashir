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
    healthcheck:
      start_period: 120s
      interval: 15s
      retries: 10
  nginx:
    depends_on:
      api:
        condition: service_started
EOF

echo "==> Building and starting (HTTP on port 80)..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Deploy started. Wait ~2 min then:"
echo "  curl http://${DOMAIN}/api/v1/health"
echo "  curl http://${DOMAIN}/api/v1/health/ready"
