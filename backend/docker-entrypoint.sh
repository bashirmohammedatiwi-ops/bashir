#!/bin/sh
set -e

migrate_once() {
  npx prisma migrate deploy 2>&1
}

echo "[entrypoint] Applying database migrations..."
TRIES=0
MAX_TRIES=30
OUTPUT=""
while true; do
  OUTPUT="$(migrate_once)" || true
  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -q "All migrations have been successfully applied"; then
    break
  fi

  if echo "$OUTPUT" | grep -q "No pending migrations to apply"; then
    break
  fi

  if echo "$OUTPUT" | grep -q "P3009"; then
    echo "[entrypoint] ERROR: Failed migration recorded in database (P3009)."
    echo "[entrypoint] On VPS run: cd infra && ./scripts/reset-db.sh && docker compose -f docker-compose.prod.yml up -d --build"
    exit 1
  fi

  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    echo "[entrypoint] Migration failed after ${MAX_TRIES} attempts"
    exit 1
  fi
  echo "[entrypoint] Database not ready — retry ${TRIES}/${MAX_TRIES}..."
  sleep 2
done

if [ "$RUN_SEED" = "1" ]; then
  echo "[entrypoint] Seeding database..."
  npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped"
fi

echo "[entrypoint] Starting API on port ${PORT:-3000}..."
exec node dist/main.js
