#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env"
  exit 1
fi

set -a
source .env
set +a

COMPOSE="docker compose -f docker-compose.prod.yml"

if [[ -f nginx/default.conf.template ]] && [[ -n "${DOMAIN:-}" ]]; then
  if grep -q "ssl_certificate" nginx/default.conf 2>/dev/null; then
    sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" nginx/default.conf.template > nginx/default.conf
  fi
fi

echo "==> Pull latest code (if git repo)..."
git -C ../.. pull --ff-only 2>/dev/null || true

echo "==> Rebuild API..."
$COMPOSE up -d --build api

echo "==> Restart Nginx..."
$COMPOSE up -d nginx

echo "==> Health check..."
sleep 3
$COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready || true

echo "Update complete."
