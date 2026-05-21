#!/bin/sh
set -e

migrate_once() {
  npx prisma migrate deploy 2>&1
}

fix_failed_migration() {
  echo "[entrypoint] P3009 detected — resetting database and re-applying migrations..."
  npx prisma migrate reset --force --skip-seed 2>&1 || true
}

echo "[entrypoint] Applying database migrations..."
TRIES=0
MAX_TRIES=30
FIXED=0
while true; do
  OUTPUT="$(migrate_once)" || true
  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -q "All migrations have been successfully applied"; then
    break
  fi

  if echo "$OUTPUT" | grep -q "have been applied"; then
    break
  fi

  if echo "$OUTPUT" | grep -q "No pending migrations to apply"; then
    break
  fi

  if echo "$OUTPUT" | grep -q "P3009"; then
    if [ "$FIXED" -eq 0 ] && [ "${AUTO_FIX_MIGRATIONS:-1}" = "1" ]; then
      fix_failed_migration
      FIXED=1
      continue
    fi
    echo "[entrypoint] ERROR: Failed migration (P3009). Run: cd infra && docker compose -f docker-compose.prod.yml down -v && ./scripts/deploy-ip.sh"
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
