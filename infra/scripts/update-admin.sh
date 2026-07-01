#!/usr/bin/env bash
# Rebuild admin panel static files and reload nginx.
# Usage: cd infra && ./scripts/update-admin.sh
set -euo pipefail

INFRA_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_ROOT/.." && pwd)"

echo "==> Pull latest code..."
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$REPO_ROOT" pull origin main
elif git -C "$INFRA_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$INFRA_ROOT" pull origin main
else
  echo "Warning: no git repo found — building admin-desktop as-is"
fi

cd "$INFRA_ROOT"

echo "==> Build admin web..."
chmod +x scripts/build-admin-web.sh
./scripts/build-admin-web.sh

echo "==> Restart nginx..."
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "Admin updated. Open: http://${DOMAIN:-187.127.88.146}/home-builder/"
echo "Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
