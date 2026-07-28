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
  # Stale untracked lockfile from host npm install blocks pull on older servers.
  if [[ -f "$REPO_ROOT/web-store/package-lock.json" ]] \
    && ! git -C "$REPO_ROOT" ls-files --error-unmatch web-store/package-lock.json &>/dev/null; then
    echo "    Removing untracked web-store/package-lock.json (will come from git)..."
    rm -f "$REPO_ROOT/web-store/package-lock.json"
  fi
  git -C "$REPO_ROOT" pull --ff-only origin main || {
    echo "ERROR: git pull failed — resolve conflicts then re-run this script."
    exit 1
  }
fi

chmod +x "$ROOT/scripts/build-store-web.sh"
build_store_web_panel

echo "==> Reload Nginx..."
reload_nginx_stack

echo "==> Verify store pages..."
ensure_store_serving || {
  echo "ERROR: Store still not serving. Check:"
  echo "  ls -la $ROOT/store-static/index.html $ROOT/store-static/privacy/index.html"
  echo "  docker compose -f docker-compose.prod.yml exec nginx ls -la /var/www/alhayaa/store/privacy/"
  echo "  docker compose -f docker-compose.prod.yml logs nginx --tail=30"
  exit 1
}

print_stack_urls
echo ""
echo "Store website fixed."
