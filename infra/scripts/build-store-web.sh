#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STORE_ROOT="$(cd "$INFRA_ROOT/../web-store" && pwd)"
OUT_DIR="$INFRA_ROOT/store-static"
STAGING_DIR="$INFRA_ROOT/store-static.__staging"
BACKUP_DIR="$INFRA_ROOT/store-static.__old"

if [[ ! -f "$STORE_ROOT/package.json" ]]; then
  echo "web-store not found at $STORE_ROOT"
  exit 1
fi

if [[ -f "$INFRA_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$INFRA_ROOT/.env"
  set +a
fi

API_BASE="${NEXT_PUBLIC_API_BASE:-/api/v1}"
MEDIA_BASE="${NEXT_PUBLIC_MEDIA_BASE:-/media}"
BUILD_API="${STORE_BUILD_API_BASE:-http://127.0.0.1:3000/api/v1}"

GIT_SHA="$(git -C "$STORE_ROOT/.." rev-parse --short HEAD 2>/dev/null || echo "unknown")"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "==> Building customer web store"
echo "    Commit: $GIT_SHA @ $BUILD_TIME"
echo "    API:    $API_BASE (build fetch: $BUILD_API)"
echo "    Media:  $MEDIA_BASE"

cd "$STORE_ROOT"

if [[ -f package-lock.json ]]; then
  npm ci --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi

NEXT_PUBLIC_API_BASE="$API_BASE" \
NEXT_PUBLIC_MEDIA_BASE="$MEDIA_BASE" \
STORE_BUILD_API_BASE="$BUILD_API" \
NEXT_PUBLIC_BUILD_SHA="$GIT_SHA" \
NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME" \
npm run build

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp -r out/. "$STAGING_DIR/"
chmod -R a+rX "$STAGING_DIR"

verify_store_static() {
  local dir="$1"
  local missing=0
  for rel in index.html products/index.html product/index.html categories/index.html category/index.html brands/index.html brand/index.html privacy/index.html terms/index.html; do
    if [[ ! -f "$dir/$rel" ]]; then
      echo "ERROR: missing $dir/$rel"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    return 1
  fi
  echo "OK  store static pages verified under $dir"
}

if ! verify_store_static "$STAGING_DIR"; then
  echo "ERROR: Next.js export incomplete — keeping previous store-static (if any)"
  rm -rf "$STAGING_DIR"
  exit 1
fi

if [[ -d "$OUT_DIR" ]]; then
  rm -rf "$BACKUP_DIR"
  mv "$OUT_DIR" "$BACKUP_DIR"
fi
if ! mv "$STAGING_DIR" "$OUT_DIR"; then
  echo "ERROR: failed to promote store-static — restoring backup"
  if [[ -d "$BACKUP_DIR" ]]; then
    rm -rf "$OUT_DIR"
    mv "$BACKUP_DIR" "$OUT_DIR"
  fi
  exit 1
fi
rm -rf "$BACKUP_DIR"

chmod -R a+rX "$OUT_DIR"
verify_store_static "$OUT_DIR"

echo "==> Store web build ready: infra/store-static/"
