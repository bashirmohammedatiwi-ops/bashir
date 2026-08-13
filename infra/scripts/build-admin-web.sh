#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ADMIN_ROOT="$(cd "$INFRA_ROOT/../admin-desktop" && pwd)"
OUT_DIR="$INFRA_ROOT/admin-static"
STAGING_DIR="$INFRA_ROOT/admin-static.__staging"
BACKUP_DIR="$INFRA_ROOT/admin-static.__old"

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

API_BASE="${NEXT_PUBLIC_API_BASE:-/api/v1}"
MEDIA_BASE="${NEXT_PUBLIC_MEDIA_BASE:-/media}"
CATALOG_HUB_URL="${NEXT_PUBLIC_CATALOG_HUB_URL:-/catalog-hub}"

GIT_SHA="$(git -C "$ADMIN_ROOT/.." rev-parse --short HEAD 2>/dev/null || echo "unknown")"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "==> Building admin web panel"
echo "    Commit: $GIT_SHA @ $BUILD_TIME"
echo "    API:    $API_BASE"
echo "    Media:  $MEDIA_BASE"
echo "    Catalog: $CATALOG_HUB_URL"

should_npm_install() {
  local lock="$ADMIN_ROOT/package-lock.json"
  local stamp="$ADMIN_ROOT/node_modules/.install-stamp"
  [[ ! -d "$ADMIN_ROOT/node_modules" ]] && return 0
  [[ ! -f "$stamp" ]] && return 0
  [[ -f "$lock" && "$lock" -nt "$stamp" ]] && return 0
  return 1
}

run_admin_npm_build() {
  local install_cmd build_cmd
  if [[ -f "$ADMIN_ROOT/package-lock.json" ]]; then
    install_cmd="npm ci --legacy-peer-deps"
  else
    install_cmd="npm install --legacy-peer-deps"
  fi
  build_cmd="NEXT_PUBLIC_API_BASE=\"$API_BASE\" NEXT_PUBLIC_MEDIA_BASE=\"$MEDIA_BASE\" NEXT_PUBLIC_CATALOG_HUB_URL=\"$CATALOG_HUB_URL\" NEXT_PUBLIC_BASE_PATH=\"/admin\" NEXT_PUBLIC_BUILD_SHA=\"$GIT_SHA\" NEXT_PUBLIC_BUILD_TIME=\"$BUILD_TIME\" npm run build:web"

  if command -v npm >/dev/null 2>&1; then
    cd "$ADMIN_ROOT"
    if should_npm_install; then
      echo "==> npm install (admin-desktop)..."
      eval "$install_cmd"
      mkdir -p node_modules
      touch node_modules/.install-stamp
    else
      echo "==> node_modules up to date — skip npm ci"
    fi
    eval "$build_cmd"
    return 0
  fi

  echo "==> npm not found on host — building admin with node:20-alpine Docker image"
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: neither npm nor docker available — install Node.js 20+ or Docker on the VPS"
    exit 1
  fi

  docker run --rm \
    -v "$ADMIN_ROOT:/app" \
    -w /app \
    -e NEXT_PUBLIC_API_BASE="$API_BASE" \
    -e NEXT_PUBLIC_MEDIA_BASE="$MEDIA_BASE" \
    -e NEXT_PUBLIC_CATALOG_HUB_URL="$CATALOG_HUB_URL" \
    -e NEXT_PUBLIC_BASE_PATH="/admin" \
    -e NEXT_PUBLIC_BUILD_SHA="$GIT_SHA" \
    -e NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME" \
    node:20-alpine \
    sh -c "$install_cmd && $build_cmd"
}

run_admin_npm_build

if [[ ! -d "$ADMIN_ROOT/out" ]]; then
  echo "ERROR: Next.js export did not produce admin-desktop/out"
  exit 1
fi

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp -r "$ADMIN_ROOT/out/." "$STAGING_DIR/"
chmod -R a+rX "$STAGING_DIR"

verify_admin_static() {
  local dir="$1"
  local missing=0
  for rel in index.html login/index.html catalog-import/index.html products/index.html ai-add/index.html privacy/index.html terms/index.html; do
    if [[ ! -f "$dir/$rel" ]]; then
      echo "ERROR: missing $dir/$rel"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    return 1
  fi
  echo "OK  admin static pages verified under $dir"
}

if ! verify_admin_static "$STAGING_DIR"; then
  echo "ERROR: Next.js export incomplete — keeping previous admin-static (if any)"
  rm -rf "$STAGING_DIR"
  exit 1
fi

if [[ -d "$OUT_DIR" ]]; then
  rm -rf "$BACKUP_DIR"
  mv "$OUT_DIR" "$BACKUP_DIR"
fi
if ! mv "$STAGING_DIR" "$OUT_DIR"; then
  echo "ERROR: failed to promote admin-static — restoring backup"
  if [[ -d "$BACKUP_DIR" ]]; then
    rm -rf "$OUT_DIR"
    mv "$BACKUP_DIR" "$OUT_DIR"
  fi
  exit 1
fi
rm -rf "$BACKUP_DIR"

chmod -R a+rX "$OUT_DIR"
chmod a+x "$INFRA_ROOT" 2>/dev/null || true

verify_admin_static "$OUT_DIR"

echo "==> Admin web build ready: infra/admin-static/"
