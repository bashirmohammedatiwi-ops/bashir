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

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Stopping API..."
$COMPOSE stop api nginx 2>/dev/null || true

echo "==> Dropping public schema..."
$COMPOSE exec -T postgres psql -U "${POSTGRES_USER:-alhayaa}" -d "${POSTGRES_DB:-alhayaa}" <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO alhayaa;
GRANT ALL ON SCHEMA public TO public;
SQL

echo "==> Rebuild and start stack..."
$COMPOSE up -d --build postgres redis api nginx

echo "==> Done. Check: curl http://127.0.0.1/api/v1/health"
