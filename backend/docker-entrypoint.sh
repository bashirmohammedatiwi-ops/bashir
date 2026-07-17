#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
set +e
OUTPUT="$(npx prisma migrate deploy 2>&1)"
STATUS=$?
set -e
echo "$OUTPUT"

if [ "$STATUS" -ne 0 ]; then
  if echo "$OUTPUT" | grep -q "P3009"; then
    echo "[entrypoint] Resetting schema after failed migration (P3009)..."
    npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO alhayaa;
SQL
    npx prisma migrate deploy
  else
    echo "[entrypoint] Migration failed."
    exit 1
  fi
fi

if [ "$RUN_SEED" = "1" ]; then
  # افتراضياً: أدمن فقط. البيانات التجريبية تحتاج SEED_DEMO=1 صراحةً
  echo "[entrypoint] Seeding admin (SEED_DEMO=${SEED_DEMO:-0})..."
  npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped"
fi

echo "[entrypoint] Ensuring product placeholder images..."
set +e
node scripts/backfill-product-images.js
BACKFILL=$?
set -e
if [ "$BACKFILL" -ne 0 ]; then
  echo "[entrypoint] Image backfill skipped (exit $BACKFILL)"
fi

echo "[entrypoint] Starting API on port ${PORT:-3000}..."
exec node dist/main.js
