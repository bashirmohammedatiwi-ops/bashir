#!/usr/bin/env bash
# Rebuild API — يستخدم cache افتراضياً (أقل مساحة). --no-cache فقط عند الحاجة.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NO_CACHE=""
if [[ "${1:-}" == "--no-cache" ]]; then
  NO_CACHE="--no-cache"
  echo "WARNING: --no-cache يستهلك مساحة أكبر. استخدمه فقط عند مشاكل build."
fi

docker compose -f docker-compose.prod.yml build $NO_CACHE api
docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml restart nginx

chmod +x scripts/docker-cleanup.sh
./scripts/docker-cleanup.sh

echo "Wait ~30s then: curl http://\${DOMAIN:-127.0.0.1}/api/v1/health"
