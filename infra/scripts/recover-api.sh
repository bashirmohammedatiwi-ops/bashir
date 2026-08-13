#!/usr/bin/env bash
# تشخيص وإصلاح API عند 502 — شغّله على VPS من مجلد infra/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml"
DOMAIN="${DOMAIN:-187.127.88.146}"

echo "========== 1) حالة الحاويات =========="
$COMPOSE ps

echo ""
echo "========== 2) آخر 80 سطر من logs الـ API =========="
$COMPOSE logs api --tail=80 2>&1 || true

echo ""
echo "========== 3) اختبار API داخل الشبكة الداخلية =========="
$COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health 2>&1 || echo "FAIL: API لا يستجيب داخل الحاوية"

echo ""
echo "========== 4) إعادة بناء API (بدون cache) =========="
$COMPOSE build --no-cache api
$COMPOSE up -d api

echo "انتظر 45 ثانية..."
sleep 45

echo ""
echo "========== 5) logs بعد التشغيل =========="
$COMPOSE logs api --tail=40

echo ""
echo "========== 6) backfill صور (node) =========="
$COMPOSE exec -T api node scripts/backfill-product-images.js 2>&1 || echo "backfill skipped"

echo ""
echo "========== 7) إعادة تشغيل nginx (يحل 502 بعد rebuild) =========="
$COMPOSE restart nginx
sleep 3

echo ""
echo "========== 8) اختبار خارجي =========="
curl -sS -m 15 "http://${DOMAIN}/api/v1/health" || echo "FAIL: health من الخارج"

echo ""
echo "========== 9) nginx -> api =========="
$COMPOSE ps nginx
$COMPOSE exec -T nginx wget -qO- http://api:3000/api/v1/health 2>&1 || echo "FAIL: nginx -> api"

echo ""
echo "Done."
