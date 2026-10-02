#!/usr/bin/env bash
# يشغّل محادثات تقييم المساعد على صورة الـ API المبنية قبل ما تنزل للزبائن.
# الاستخدام: cd infra && ./scripts/assistant-eval.sh [جزء من اسم السيناريو]
# يرجع 1 إذا فشل سيناريو أساسي، فأوقفي النشر.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml"
if [[ -f docker-compose.firebase.yml ]]; then
  COMPOSE="$COMPOSE -f docker-compose.firebase.yml"
fi

# الجداول الجديدة لازم تكون موجودة قبل الفحص. الـ migrations هنا تضيف بس، فآمنة والنسخة القديمة شغالة.
$COMPOSE run --rm --no-deps -T --entrypoint npx api prisma migrate deploy </dev/null

$COMPOSE run --rm --no-deps -T \
  -e REDIS_DISABLED=1 \
  --entrypoint node \
  api dist/modules/assistant/eval/run-eval.js "$@" </dev/null
