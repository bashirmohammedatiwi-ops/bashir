#!/usr/bin/env bash
# Align PostgreSQL password with infra/.env (fixes API P1000 after .env changes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"

COMPOSE="docker compose -f docker-compose.prod.yml"
ESCAPED="${POSTGRES_PASSWORD//\'/\'\'}"

echo "==> Syncing PostgreSQL password from .env..."
$COMPOSE exec -T postgres \
  psql -U alhayaa -d postgres \
  -c "ALTER USER alhayaa WITH PASSWORD '${ESCAPED}';"

echo "==> Restarting API..."
$COMPOSE up -d api

echo "Done."
