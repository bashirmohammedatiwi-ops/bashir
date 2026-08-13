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

verify_store_static() {
  local dir="$1"
  local missing=0
  local rel
  for rel in \
    index.html \
    products/index.html \
    product/index.html \
    package/index.html \
    offers/index.html \
    categories/index.html \
    category/index.html \
    brands/index.html \
    brand/index.html \
    privacy/index.html \
    terms/index.html \
    en/privacy/index.html \
    en/terms/index.html; do
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

run_store_npm_build() {
  local install_cmd build_cmd stamp="$STORE_ROOT/node_modules/.install-stamp"
  if [[ -f "$STORE_ROOT/package-lock.json" ]]; then
    install_cmd="npm ci --legacy-peer-deps"
  else
    install_cmd="npm install --legacy-peer-deps"
  fi
  build_cmd="NEXT_PUBLIC_API_BASE=\"$API_BASE\" NEXT_PUBLIC_MEDIA_BASE=\"$MEDIA_BASE\" STORE_BUILD_API_BASE=\"$BUILD_API\" NEXT_PUBLIC_BUILD_SHA=\"$GIT_SHA\" NEXT_PUBLIC_BUILD_TIME=\"$BUILD_TIME\" npm run build"

  run_host_npm() {
    cd "$STORE_ROOT"
    if [[ ! -d node_modules ]] || [[ ! -f "$stamp" ]] || { [[ -f package-lock.json ]] && [[ package-lock.json -nt "$stamp" ]]; }; then
      echo "==> npm install (web-store)..."
      eval "$install_cmd"
      mkdir -p node_modules
      touch "$stamp"
    else
      echo "==> node_modules up to date — skip npm ci"
    fi
    eval "$build_cmd"
  }

  if command -v npm >/dev/null 2>&1; then
    run_host_npm
    return 0
  fi

  echo "==> npm not found on host — building with node:20-alpine Docker image"
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: neither npm nor docker available — install Node.js 20+ or Docker on the VPS"
    exit 1
  fi

  docker run --rm \
    -v "$STORE_ROOT:/app" \
    -w /app \
    -e NEXT_PUBLIC_API_BASE="$API_BASE" \
    -e NEXT_PUBLIC_MEDIA_BASE="$MEDIA_BASE" \
    -e STORE_BUILD_API_BASE="$BUILD_API" \
    -e NEXT_PUBLIC_BUILD_SHA="$GIT_SHA" \
    -e NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME" \
    node:20-alpine \
    sh -c "$install_cmd && npm run build"
}

run_store_npm_build

if [[ ! -d "$STORE_ROOT/out" ]]; then
  echo "ERROR: Next.js export did not produce web-store/out"
  exit 1
fi

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp -r "$STORE_ROOT/out/." "$STAGING_DIR/"
chmod -R a+rX "$STAGING_DIR"

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
