#!/usr/bin/env bash
# Rebuild customer store static files and reload Nginx (no API downtime).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

COMPOSE="docker compose -f docker-compose.prod.yml"
# shellcheck source=lib/deploy-common.sh
source "$ROOT/scripts/lib/deploy-common.sh"

echo "==> Fix customer store website (privacy / terms / homepage)"

if [[ -d "$REPO_ROOT/.git" ]]; then
  echo "==> Pull latest code..."
  git -C "$REPO_ROOT" pull --ff-only origin main || true
fi

chmod +x "$ROOT/scripts/build-store-web.sh"
build_store_web_panel

echo "==> Reload Nginx..."
reload_nginx_stack

echo "==> Verify store pages..."
ensure_store_serving || {
  echo "ERROR: Store still not serving. Check:"
  echo "  ls -la $ROOT/store-static/privacy/"
  echo "  docker compose -f docker-compose.prod.yml logs nginx --tail=30"
  exit 1
}

print_stack_urls
echo ""
echo "Store website fixed."
