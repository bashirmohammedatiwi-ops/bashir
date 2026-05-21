#!/usr/bin/env bash
# Reset PostgreSQL after a failed Prisma migration (first deploy / dev only).
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

echo "==> Stopping stack..."
$COMPOSE stop api nginx 2>/dev/null || true

echo "==> Dropping public schema..."
$COMPOSE exec -T postgres psql -U "${POSTGRES_USER:-alhayaa}" -d "${POSTGRES_DB:-alhayaa}" <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO alhayaa;
GRANT ALL ON SCHEMA public TO public;
SQL

echo "==> IP deploy config (HTTP + media URL override)..."
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

echo "==> Rebuild and start (seed may take 1-2 min — wait before health check)..."
$COMPOSE up -d --build postgres redis api nginx

echo ""
echo "==> Follow logs: docker compose -f docker-compose.prod.yml logs -f api"
echo "==> Then test: curl http://${DOMAIN}/api/v1/health"
