#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ADMIN_ROOT="$(cd "$INFRA_ROOT/../admin-desktop" && pwd)"
OUT_DIR="$INFRA_ROOT/admin-static"

if [[ ! -f "$ADMIN_ROOT/package.json" ]]; then
  echo "admin-desktop not found at $ADMIN_ROOT"
  exit 1
fi

if [[ -f "$INFRA_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$INFRA_ROOT/.env"
  set +a
fi

API_BASE="${NEXT_PUBLIC_API_BASE:-}"
MEDIA_BASE="${NEXT_PUBLIC_MEDIA_BASE:-}"

if [[ -z "$API_BASE" && -n "${DOMAIN:-}" ]]; then
  if [[ -f "$INFRA_ROOT/nginx/default.conf" ]] && grep -q "ssl_certificate" "$INFRA_ROOT/nginx/default.conf"; then
    API_BASE="https://${DOMAIN}/api/v1"
    MEDIA_BASE="https://${DOMAIN}/media"
  else
    API_BASE="http://${DOMAIN}/api/v1"
    MEDIA_BASE="http://${DOMAIN}/media"
  fi
fi

API_BASE="${API_BASE:-http://localhost:8080/api/v1}"
MEDIA_BASE="${MEDIA_BASE:-http://localhost:8080/media}"

echo "==> Building admin web panel"
echo "    API:   $API_BASE"
echo "    Media: $MEDIA_BASE"

cd "$ADMIN_ROOT"

if [[ -f package-lock.json ]]; then
  npm ci --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi

NEXT_PUBLIC_API_BASE="$API_BASE" \
NEXT_PUBLIC_MEDIA_BASE="$MEDIA_BASE" \
npm run build:web

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -r out/. "$OUT_DIR/"

echo "==> Admin web build ready: infra/admin-static/"
