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

  # فرض تطابق سكربتات infra مع GitHub (يحل تعارض pull على VPS)
  if ! git -C "$REPO_ROOT" diff --quiet HEAD origin/main -- infra/scripts infra/nginx 2>/dev/null \
    || ! git -C "$REPO_ROOT" diff --quiet -- infra/scripts infra/nginx 2>/dev/null; then
    echo "    Resetting infra/scripts + infra/nginx to origin/main..."
    git -C "$REPO_ROOT" checkout origin/main -- infra/scripts infra/nginx 2>/dev/null || true
  fi

  if ! git -C "$REPO_ROOT" pull --ff-only origin main; then
    echo "    Pull blocked — hard reset infra tracking files and retry..."
    git -C "$REPO_ROOT" checkout origin/main -- infra/scripts infra/nginx 2>/dev/null || true
    git -C "$REPO_ROOT" pull --ff-only origin main
  fi
}

ensure_deploy_scripts() {
  if [[ ! -f "$ROOT/scripts/sync-catalog-hub-data.sh" ]]; then
    echo "==> Creating missing sync-catalog-hub-data.sh (v2 no-op)..."
    cat > "$ROOT/scripts/sync-catalog-hub-data.sh" << 'EOF'
#!/usr/bin/env bash
echo "==> catalog-hub v2: no seed data sync required (skipped)"
EOF
    chmod +x "$ROOT/scripts/sync-catalog-hub-data.sh"
  fi
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

ensure_catalog_hub_ready() {
  local i
  for i in $(seq 1 20); do
    if $COMPOSE exec -T catalog-hub wget -qO- http://127.0.0.1:10000/api/health 2>/dev/null | grep -q '"ok":true'; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# يحل: container name already in use (حاوية قديمة من compose سابق).
# تُزيل الحاوية فقط إن لم يكن compose الحالي يعرفها (empty managed) —
# لا تقارن معرّفات لأن docker ps يُرجع short-ID بينما compose يُرجع full-ID.
resolve_stale_compose_containers() {
  echo "==> Resolve stale Docker containers..."
  local svc name cid managed
  for svc in catalog-hub api postgres redis nginx; do
    name="infra-${svc}-1"
    cid=$(docker ps -aq -f "name=^/${name}$" 2>/dev/null | head -1 || true)
    [[ -z "$cid" ]] && continue
    managed=$($COMPOSE ps -q "$svc" 2>/dev/null | head -1 || true)
    if [[ -z "$managed" ]]; then
      echo "    Removing stale ${name} (${cid:0:12})"
      docker rm -f "$cid" 2>/dev/null || true
    fi
  done
}

echo "==> Alhayaa full update"
echo "    Domain: ${DOMAIN:-localhost}"

# منع إعادة بيانات الاختبار عند إعادة البناء
if [[ -f .env ]]; then
  if grep -q '^SEED_DEMO=1' .env 2>/dev/null; then
    sed -i 's/^SEED_DEMO=1/SEED_DEMO=0/' .env
    echo "==> Forced SEED_DEMO=0 (demo brands/products disabled)"
  fi
  if ! grep -q '^SEED_DEMO=' .env 2>/dev/null; then
    echo 'SEED_DEMO=0' >> .env
  fi
  if grep -q '^RUN_SEED=1' .env 2>/dev/null; then
    echo "==> NOTE: RUN_SEED=1 is set — will only ensure admin user (no demo data)."
    echo "    Set RUN_SEED=0 in infra/.env after first boot if you prefer."
  fi
fi

sync_repo

ensure_deploy_scripts

chmod +x scripts/*.sh

render_nginx

resolve_stale_compose_containers

echo "==> Rebuild API + Catalog Hub..."
$COMPOSE up -d --build --remove-orphans api catalog-hub postgres redis

if ! ensure_catalog_hub_ready; then
  echo "WARN: catalog-hub not healthy yet — check: docker compose -f docker-compose.prod.yml logs catalog-hub --tail=50"
fi

echo "==> Sync catalog-hub seed data into live volume..."
./scripts/sync-catalog-hub-data.sh || true

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
$COMPOSE up -d --force-recreate --remove-orphans nginx

echo "==> Verify..."
# انتظر جهوزية API الفعلية بدل sleep ثابت
ensure_api_ready || true
./scripts/verify.sh

echo "==> Free disk space (Docker cleanup)..."
chmod +x scripts/docker-cleanup.sh
./scripts/docker-cleanup.sh

echo ""
echo "Update complete."
echo "  Admin:   http://${DOMAIN:-localhost}/"
echo "  API:     http://${DOMAIN:-localhost}/api/v1/health"
echo "  Catalog: http://${DOMAIN:-localhost}/catalog-hub/api/health"
