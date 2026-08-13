#!/usr/bin/env bash
# Sync admin password from infra/.env (ADMIN_EMAIL / ADMIN_PASSWORD) into the database.
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

: "${ADMIN_EMAIL:?Set ADMIN_EMAIL in .env}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD in .env}"

echo "Updating admin credentials from .env (admin only — no demo data)..."
echo "  Email: $ADMIN_EMAIL"

docker compose -f docker-compose.prod.yml up -d api

docker compose -f docker-compose.prod.yml exec -T \
  -e ADMIN_EMAIL="$ADMIN_EMAIL" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e SEED_DEMO=0 \
  api npx tsx prisma/seed.ts

echo "Done. Log in with ADMIN_EMAIL and ADMIN_PASSWORD from infra/.env"
