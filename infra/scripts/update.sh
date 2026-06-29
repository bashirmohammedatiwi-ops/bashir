#!/usr/bin/env bash
# Full production update — single command for the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

if [[ ! -f .env ]]; then
  echo "Missing infra/.env — copy .env.example and edit values."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

COMPOSE="docker compose -f docker-compose.prod.yml"

render_nginx() {
  local domain="${DOMAIN:-}"

  # IP-only VPS: always use HTTP bootstrap config
  if [[ "$domain" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    cp nginx/default.bootstrap.conf nginx/default.conf
    return
  fi

  if [[ -f nginx/default.conf.template ]] && [[ -n "$domain" ]]; then
    local use_ssl=false
    if $COMPOSE ps --status running nginx 2>/dev/null | grep -q nginx \
      && $COMPOSE exec -T nginx test -f "/etc/letsencrypt/live/${domain}/fullchain.pem" 2>/dev/null; then
      use_ssl=true
    fi
    if [[ "$use_ssl" == "true" ]]; then
      sed "s/DOMAIN_PLACEHOLDER/${domain}/g" nginx/default.conf.template > nginx/default.conf
    else
      cp nginx/default.bootstrap.conf nginx/default.conf
    fi
  else
    cp nginx/default.bootstrap.conf nginx/default.conf
  fi
}

sync_repo() {
  if [[ ! -d "$REPO_ROOT/.git" ]]; then
    echo "==> Not a git repo — skipping pull"
    return 0
  fi

  echo "==> Pull latest code..."
  git -C "$REPO_ROOT" fetch origin main

  if ! git -C "$REPO_ROOT" diff --quiet -- infra/scripts infra/nginx 2>/dev/null; then
    echo "    Resetting local infra script changes to match GitHub..."
    git -C "$REPO_ROOT" checkout -- infra/scripts infra/nginx 2>/dev/null || true
  fi

  git -C "$REPO_ROOT" pull --ff-only origin main
}

ensure_api_ready() {
  local i
  for i in $(seq 1 30); do
    if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo "==> Alhayaa full update"
echo "    Domain: ${DOMAIN:-localhost}"

sync_repo

chmod +x scripts/*.sh

render_nginx

echo "==> Rebuild API + Catalog Hub..."
$COMPOSE up -d --build api catalog-hub postgres redis

echo "==> Apply database migrations..."
if ! $COMPOSE exec -T api npx prisma migrate deploy; then
  echo "==> Migration failed — syncing PostgreSQL password and retrying..."
  ./scripts/sync-postgres-password.sh
  $COMPOSE exec -T api npx prisma migrate deploy
fi

if ! ensure_api_ready; then
  echo "==> API not healthy — syncing PostgreSQL password..."
  ./scripts/sync-postgres-password.sh
  ensure_api_ready || {
    echo "API still not ready. Check: docker compose -f docker-compose.prod.yml logs api --tail=50"
    exit 1
  }
fi

echo "==> Build admin web panel (atomic)..."
./scripts/build-admin-web.sh
chmod -R a+rX admin-static

echo "==> Reload Nginx..."
render_nginx
$COMPOSE up -d --force-recreate nginx

echo "==> Verify..."
sleep 2
./scripts/verify.sh

echo ""
echo "Update complete."
echo "  Admin: http://${DOMAIN:-localhost}/"
echo "  API:   http://${DOMAIN:-localhost}/api/v1/health"
