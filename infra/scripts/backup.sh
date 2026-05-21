#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env"
  exit 1
fi

set -a
source .env
set +a

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> PostgreSQL dump..."
$COMPOSE exec -T postgres pg_dump -U "${POSTGRES_USER:-alhayaa}" "${POSTGRES_DB:-alhayaa}" \
  | gzip > "${OUT_DIR}/postgres_${STAMP}.sql.gz"

echo "==> Media files..."
$COMPOSE exec -T api tar czf - -C /data/uploads . > "${OUT_DIR}/media_${STAMP}.tar.gz"

echo "Backups saved:"
ls -lh "${OUT_DIR}"/*"${STAMP}"*
