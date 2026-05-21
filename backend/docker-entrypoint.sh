#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
TRIES=0
MAX_TRIES=30
until npx prisma migrate deploy; do
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
