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

# على السيرفر نفسه — localhost أدق من IP العام (قد يُرفض hairpin NAT)
BASE="http://127.0.0.1"
if ! curl -fsS --max-time 3 -o /dev/null "${BASE}/" 2>/dev/null \
  && ! curl -fsS --max-time 3 -o /dev/null "http://${DOMAIN:-localhost}/" 2>/dev/null; then
  BASE="http://${DOMAIN:-localhost}"
fi
if curl -fsS --max-time 3 -o /dev/null "http://127.0.0.1/" 2>/dev/null; then
  BASE="http://127.0.0.1"
fi

ADMIN_BASE="$BASE"
API_BASE="$BASE"

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

check_json "API health" "$API_BASE/api/v1/health" '"status":"ok"'
check_json "API ready" "$API_BASE/api/v1/health/ready" '"ready":true'
check_json "Catalog hub" "$API_BASE/catalog-hub/api/health" '"ok":true'
check_json "Catalog import" "$API_BASE/catalog-hub/api/import/niceone/products/31510" '"sourceStore":"niceone"'
check_http "Admin home" "$ADMIN_BASE/"
check_http "Admin login" "$ADMIN_BASE/login/"
check_http "Admin products" "$ADMIN_BASE/products/"

if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
  echo "OK  API container ready"
else
  echo "FAIL API container not ready"
  FAILED=1
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "Verification failed."
  echo ""
  echo "==> Nginx diagnostics (last 40 lines):"
  $COMPOSE logs nginx --tail=40 2>/dev/null || true
  echo ""
  echo "==> Nginx config test:"
  $COMPOSE exec -T nginx nginx -t 2>&1 || true
  echo ""
  echo "Quick fix (IP / no SSL):"
  echo "  cp nginx/default.bootstrap.conf nginx/default.conf"
  echo "  docker compose -f docker-compose.prod.yml up -d --force-recreate nginx"
  echo "  curl -s http://127.0.0.1/api/v1/health"
  exit 1
fi

echo ""
echo "All checks passed."
echo "  Admin: http://${DOMAIN:-localhost}/"
echo "  API:   $API_BASE/api/v1/health"
