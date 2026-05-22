#!/usr/bin/env bash
# Restart API when Nginx shows 502 Bad Gateway
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env"
  exit 1
fi

COMPOSE="docker compose -f docker-compose.prod.yml"
if [[ -f docker-compose.override.yml ]]; then
  COMPOSE="$COMPOSE -f docker-compose.override.yml"
fi

echo "==> API container status"
$COMPOSE ps api || true

echo "==> Last API logs"
$COMPOSE logs api --tail=40 || true

echo "==> Rebuild and restart API..."
$COMPOSE up -d --build api

echo "==> Restart Nginx..."
$COMPOSE up -d nginx

echo "==> Waiting for health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1/api/v1/health" >/dev/null 2>&1; then
    echo "API is healthy."
    exit 0
  fi
  sleep 5
done

echo "API still not responding. Check logs:"
echo "  $COMPOSE logs api --tail=80"
exit 1
