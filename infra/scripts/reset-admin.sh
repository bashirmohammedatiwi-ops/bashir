#!/usr/bin/env bash
# Sync admin password from infra/.env (ADMIN_EMAIL / ADMIN_PASSWORD) into the database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Updating admin credentials from .env via seed (admin user only)..."
docker compose -f docker-compose.prod.yml exec -T api npx tsx prisma/seed.ts
echo "Done. Use ADMIN_EMAIL and ADMIN_PASSWORD from infra/.env to log in."
