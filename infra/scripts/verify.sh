#!/usr/bin/env bash
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

BASE="http://${DOMAIN:-localhost}"
COMPOSE="docker compose -f docker-compose.prod.yml"
FAILED=0

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-}"

  if [[ -n "$expect" ]]; then
    if curl -fsS --max-time 15 "$url" | grep -q "$expect"; then
      echo "OK  $name"
    else
      echo "FAIL $name ($url)"
      FAILED=1
    fi
  elif curl -fsS --max-time 15 -o /dev/null "$url"; then
    echo "OK  $name"
  else
    echo "FAIL $name ($url)"
    FAILED=1
  fi
}

echo "==> Verifying Alhayaa stack..."

if [[ ! -f admin-static/index.html ]]; then
  echo "FAIL admin-static/index.html missing"
  FAILED=1
else
  echo "OK  admin-static/index.html"
fi

if [[ ! -f admin-static/products/index.html ]]; then
  echo "FAIL admin-static/products/index.html missing"
  FAILED=1
else
  echo "OK  admin-static/products/index.html"
fi

check "API health" "$BASE/api/v1/health" '"status":"ok"'
check "API ready" "$BASE/api/v1/health/ready" '"ready":true'
check "Admin home" "$BASE/"
check "Admin login" "$BASE/login/"
check "Admin products" "$BASE/products/"
check "Admin catalog import" "$BASE/catalog-import/" "الاستيراد من الكتالوج"

if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
  echo "OK  API container ready"
else
  echo "FAIL API container not ready"
  FAILED=1
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "Verification failed."
  exit 1
fi

echo ""
echo "All checks passed."
echo "  Admin: $BASE/"
echo "  API:   $BASE/api/v1/health"
