#!/usr/bin/env bash
# تنظيف مساحة Docker بعد التحديثات — لا يحذف volumes (صور المنتجات + قاعدة البيانات).
#
# Usage (from infra/):
#   ./scripts/docker-cleanup.sh          # آمن — افتراضي
#   ./scripts/docker-cleanup.sh --deep   # أقوى — يحذف صور غير مستخدمة + build cache
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEEP=false
if [[ "${1:-}" == "--deep" ]]; then
  DEEP=true
fi

echo "========== Docker disk BEFORE =========="
docker system df

echo ""
echo "==> Remove stopped containers..."
docker container prune -f

echo "==> Remove dangling images..."
docker image prune -f

echo "==> Remove build cache (older than 24h)..."
docker builder prune -f --filter until=24h

if $DEEP; then
  echo "==> Deep: unused images + older build cache..."
  docker image prune -af --filter until=48h
  docker builder prune -af --filter until=48h
fi

# Old compose project duplicates (e.g. e0dd721b783b_infra-catalog-hub-1)
echo "==> Remove orphan compose containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans 2>/dev/null || true

echo ""
echo "========== Docker disk AFTER =========="
docker system df

echo ""
echo "Done. Volumes (postgres, media) were NOT deleted."
