#!/usr/bin/env bash
# Rebuild admin panel static files and reload Nginx (no API downtime).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

COMPOSE="docker compose -f docker-compose.prod.yml"
# shellcheck source=lib/deploy-common.sh
source "$ROOT/scripts/lib/deploy-common.sh"

echo "==> Fix admin panel (/admin/)"

if [[ -d "$REPO_ROOT/.git" ]]; then
  echo "==> Pull latest code..."
  git -C "$REPO_ROOT" pull --ff-only origin main || {
    echo "ERROR: git pull failed — resolve conflicts then re-run this script."
    exit 1
  }
fi

echo "==> Diagnose current admin-static..."
if [[ ! -f "$ROOT/admin-static/login/index.html" ]]; then
  echo "WARN: admin-static/login/index.html missing on host"
else
  echo "OK  host admin-static/login/index.html"
fi

if $COMPOSE exec -T nginx test -f /var/www/alhayaa/admin/login/index.html 2>/dev/null; then
  echo "OK  nginx container sees /var/www/alhayaa/admin/login/index.html"
else
  echo "WARN: nginx container cannot read admin login page"
  $COMPOSE exec -T nginx ls -la /var/www/alhayaa/admin/ 2>/dev/null | head -15 || true
fi

chmod +x "$ROOT/scripts/build-admin-web.sh"
build_admin_web_panel

echo "==> Reload Nginx..."
reload_nginx_stack

echo "==> Verify admin pages..."
ensure_admin_serving || {
  echo "ERROR: Admin still not serving. Check:"
  echo "  ls -la $ROOT/admin-static/index.html $ROOT/admin-static/login/index.html"
  echo "  docker compose -f docker-compose.prod.yml exec nginx ls -la /var/www/alhayaa/admin/login/"
  echo "  docker compose -f docker-compose.prod.yml logs nginx --tail=40"
  exit 1
}

print_stack_urls
echo ""
echo "Admin panel fixed."
