#!/usr/bin/env bash
# Rebuild admin panel static files and reload nginx.
# Usage: cd infra && ./scripts/update-admin.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Pull latest code..."
git pull origin main

echo "==> Build admin web..."
chmod +x scripts/build-admin-web.sh
./scripts/build-admin-web.sh

echo "==> Restart nginx..."
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "Admin updated. Open: http://${DOMAIN:-187.127.88.146}/home-builder/"
echo "Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
