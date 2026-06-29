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

COMPOSE="docker compose -f docker-compose.prod.yml"
FAILED=0

admin_base() {
  if curl -fsS --max-time 3 -o /dev/null "http://127.0.0.1/"; then
    echo "http://127.0.0.1"
  else
    echo "http://${DOMAIN:-localhost}"
  fi
}

ADMIN_BASE="$(admin_base)"
API_BASE="http://${DOMAIN:-localhost}"

check_http() {
  local name="$1"
  local url="$2"
  local code

  code="$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")"
  if [[ "$code" == "200" ]]; then
    echo "OK  $name"
  else
    echo "FAIL $name ($url) HTTP $code"
    FAILED=1
  fi
}

check_json() {
  local name="$1"
  local url="$2"
  local expect="$3"
  local body code

  body="$(curl -sS --max-time 15 "$url" 2>/dev/null || true)"
  if echo "$body" | grep -q "$expect"; then
    echo "OK  $name"
  else
    code="$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")"
    echo "FAIL $name ($url) HTTP $code"
    if [[ -n "$body" ]]; then
      echo "      $(echo "$body" | tr '\n' ' ' | head -c 160)"
    fi
    FAILED=1
  fi
}

echo "==> Verifying Alhayaa stack..."
echo "    Admin checks via: $ADMIN_BASE"
echo "    API checks via:   $API_BASE"

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

if [[ -f admin-static/catalog-import/index.html ]]; then
  echo "OK  admin-static/catalog-import/index.html"
fi

check_json "API health" "$API_BASE/api/v1/health" '"status":"ok"'
check_json "API ready" "$API_BASE/api/v1/health/ready" '"ready":true'
check_http "Admin home" "$ADMIN_BASE/"
check_http "Admin login" "$ADMIN_BASE/login/"
check_http "Admin products" "$ADMIN_BASE/products/"

if [[ -f admin-static/catalog-import/index.html ]]; then
  check_http "Admin catalog import" "$ADMIN_BASE/catalog-import/"
  check_json "Catalog hub API" "$ADMIN_BASE/catalog-hub/api/health" '"ok":true'
fi

if $COMPOSE exec -T catalog-hub wget -qO- http://127.0.0.1:10000/api/health 2>/dev/null | grep -q '"ok":true'; then
  echo "OK  Catalog hub container"
else
  echo "FAIL Catalog hub container (direct)"
  FAILED=1
fi

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
echo "  Admin: http://${DOMAIN:-localhost}/"
echo "  API:   $API_BASE/api/v1/health"
