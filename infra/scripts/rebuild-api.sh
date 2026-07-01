#!/usr/bin/env bash
# Rebuild API without Docker cache (use after git pull when layers stay CACHED).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose -f docker-compose.prod.yml build --no-cache api
docker compose -f docker-compose.prod.yml up -d api
echo "Wait ~30s then: curl http://\${DOMAIN:-127.0.0.1}/api/v1/health"
