#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA_ROOT="$ROOT"
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
# shellcheck source=lib/deploy-common.sh
source "$ROOT/scripts/lib/deploy-common.sh"

FAILED=0

if ssl_cert_exists && [[ -n "${DOMAIN:-}" ]]; then
  API_BASE="https://${DOMAIN}"
  ADMIN_BASE="https://${DOMAIN}"
  CURL_TLS=(-k)
else
  API_BASE="$(detect_verify_base)"
  ADMIN_BASE="$API_BASE"
  CURL_TLS=()
fi

check_http() {
  local name="$1"
  local url="$2"
  local code

  code="$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}" -L "${CURL_TLS[@]}" "$url" 2>/dev/null || echo "000")"
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

  body="$(curl -sS --max-time 15 -L "${CURL_TLS[@]}" "$url" 2>/dev/null || true)"
  if echo "$body" | grep -q "$expect"; then
    echo "OK  $name"
  else
    code="$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}" -L "${CURL_TLS[@]}" "$url" 2>/dev/null || echo "000")"
    echo "FAIL $name ($url) HTTP $code"
    if [[ -n "$body" ]]; then
      echo "      $(echo "$body" | tr '\n' ' ' | head -c 160)"
    fi
    FAILED=1
  fi
}

run_checks() {
  FAILED=0

  if [[ ! -f store-static/index.html ]]; then
    echo "FAIL store-static/index.html missing"
    FAILED=1
  else
    echo "OK  store-static/index.html"
  fi

  if [[ ! -f store-static/privacy/index.html ]]; then
    echo "FAIL store-static/privacy/index.html missing"
    FAILED=1
  else
    echo "OK  store-static/privacy/index.html"
  fi

  if [[ ! -f admin-static/index.html ]]; then
    echo "FAIL admin-static/index.html missing"
    FAILED=1
  else
    echo "OK  admin-static/index.html"
  fi

  if [[ ! -f admin-static/login/index.html ]]; then
    echo "FAIL admin-static/login/index.html missing"
    FAILED=1
  else
    echo "OK  admin-static/login/index.html"
  fi

  if [[ ! -f admin-static/products/index.html ]]; then
    echo "FAIL admin-static/products/index.html missing"
    FAILED=1
  else
    echo "OK  admin-static/products/index.html"
  fi

  if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health 2>/dev/null | grep -q '"status":"ok"'; then
    echo "OK  API health (container)"
  else
    echo "FAIL API health (container)"
    FAILED=1
  fi

  check_json "API ready" "$API_BASE/api/v1/health/ready" '"ready":true'
  check_json "Catalog hub" "$API_BASE/catalog-hub/api/health" '"ok":true'
  check_http "Store home" "$ADMIN_BASE/"
  check_http "Privacy policy" "$ADMIN_BASE/privacy/"
  check_http "Admin login" "$ADMIN_BASE/admin/login/"
  check_http "Admin products" "$ADMIN_BASE/admin/products/"

  if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
    echo "OK  API container ready"
  else
    echo "FAIL API container not ready"
    FAILED=1
  fi
}

echo "==> Verifying Alhayaa stack..."
echo "    Scheme:  $(public_scheme)"
echo "    Admin:   $ADMIN_BASE"
echo "    API:     $API_BASE"

run_checks

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "Verification failed — auto-repair (permissions + nginx recreate)..."
  ensure_admin_static_permissions || true
  reload_nginx_stack || true
  ensure_admin_serving || true
  run_checks
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "Verification still failing."
  echo ""
  echo "==> Nginx diagnostics (last 40 lines):"
  $COMPOSE logs nginx --tail=40 2>/dev/null || true
  echo ""
  echo "==> Nginx config test:"
  $COMPOSE exec -T nginx nginx -t 2>&1 || true
  exit 1
fi

echo ""
echo "All checks passed."
print_stack_urls
