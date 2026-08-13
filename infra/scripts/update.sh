#!/usr/bin/env bash
# Full production update — single command for the VPS.
# Usage:
#   cd ~/alhayaa && bash pull.sh
#   cd infra && ./scripts/update.sh
#   ./scripts/update.sh --full      # force rebuild API + admin + store
#   ./scripts/update.sh --api-only  # API/docker only (no admin/store)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA_ROOT="$ROOT"
cd "$ROOT"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

FORCE_FULL_UPDATE=0
API_ONLY=0
SKIP_GIT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --full)
      FORCE_FULL_UPDATE=1
      shift
      ;;
    --api-only)
      API_ONLY=1
      shift
      ;;
    --no-pull)
      SKIP_GIT=1
      shift
      ;;
    -h | --help)
      cat <<'EOF'
Alhayaa VPS update

  pull.sh                 Sync GitHub + smart rebuild (recommended)
  pull.sh --full          Force rebuild API + admin + store
  pull.sh --api-only      API + migrations only (skip admin/store)
  pull.sh --no-pull       Skip git fetch (rebuild from current tree)

Examples:
  cd ~/alhayaa && bash pull.sh
  cd ~/alhayaa/infra && ./scripts/update.sh
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1 (try --help)"
      exit 1
      ;;
  esac
done

if [[ ! -f .env ]]; then
  echo "Missing infra/.env — copy .env.example and edit values."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

COMPOSE="docker compose -f docker-compose.prod.yml"
# shellcheck source=lib/deploy-common.sh
source "$ROOT/scripts/lib/deploy-common.sh"

ensure_deploy_scripts() {
  if [[ ! -f "$ROOT/scripts/sync-catalog-hub-data.sh" ]]; then
    echo "==> Creating missing sync-catalog-hub-data.sh (v2 no-op)..."
    cat >"$ROOT/scripts/sync-catalog-hub-data.sh" <<'EOF'
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

run_migrations() {
  echo "==> Apply database migrations..."
  if ! $COMPOSE exec -T api npx prisma migrate deploy; then
    echo "==> Migration failed — syncing PostgreSQL password and retrying..."
    ./scripts/sync-postgres-password.sh
    $COMPOSE exec -T api npx prisma migrate deploy
  fi
}

echo "==> Alhayaa update"
echo "    Domain: ${DOMAIN:-localhost}"
echo "    Repo:   $REPO_ROOT"

if [[ -f .env ]]; then
  if grep -q '^SEED_DEMO=1' .env 2>/dev/null; then
    sed -i 's/^SEED_DEMO=1/SEED_DEMO=0/' .env
    echo "==> Forced SEED_DEMO=0 (demo brands/products disabled)"
  fi
  if ! grep -q '^SEED_DEMO=' .env 2>/dev/null; then
    echo 'SEED_DEMO=0' >>.env
  fi
fi

if [[ "$SKIP_GIT" != "1" ]]; then
  sync_repo_from_github "$REPO_ROOT"
fi

load_deploy_state

if [[ "$API_ONLY" == "1" ]]; then
  NEED_API_REBUILD=1
  NEED_ADMIN_REBUILD=0
  NEED_STORE_REBUILD=0
  echo "==> API-only mode"
else
  detect_deploy_targets
  ensure_static_outputs_exist
fi

ensure_deploy_scripts
chmod +x scripts/*.sh scripts/lib/*.sh 2>/dev/null || true

ensure_env_production_defaults
set -a
# shellcheck disable=SC1091
source .env
set +a

render_nginx
resolve_stale_compose_containers

if [[ "${NEED_API_REBUILD:-1}" == "1" ]]; then
  echo "==> Rebuild API + Catalog Hub..."
  $COMPOSE up -d --build --remove-orphans api catalog-hub postgres redis
else
  echo "==> Skip API image rebuild — ensure containers are up..."
  $COMPOSE up -d postgres redis api catalog-hub
fi

if ! ensure_catalog_hub_ready; then
  echo "WARN: catalog-hub not healthy yet — check: docker compose -f docker-compose.prod.yml logs catalog-hub --tail=50"
fi

echo "==> Sync catalog-hub seed data into live volume..."
./scripts/sync-catalog-hub-data.sh || true

run_migrations

if ! ensure_api_ready; then
  echo "==> API not healthy — syncing PostgreSQL password..."
  ./scripts/sync-postgres-password.sh
  ensure_api_ready || {
    echo "API still not ready. Check: docker compose -f docker-compose.prod.yml logs api --tail=50"
    exit 1
  }
fi

if [[ "$API_ONLY" != "1" ]]; then
  echo "==> Link skin guide products (8 per concern)..."
  $COMPOSE exec -T api npm run link:skin-concerns || true

  if [[ "${NEED_STORE_REBUILD:-1}" == "1" ]]; then
    echo "==> Build customer web store (atomic)..."
    build_store_web_panel
  else
    echo "==> Skip store build (unchanged)"
    ensure_store_static_permissions || build_store_web_panel
  fi

  if [[ "${NEED_ADMIN_REBUILD:-1}" == "1" ]]; then
    echo "==> Build admin web panel (atomic)..."
    build_admin_web_panel
  else
    echo "==> Skip admin build (unchanged)"
    ensure_admin_static_permissions || build_admin_web_panel
  fi
fi

echo "==> Enable HTTPS + reload Nginx..."
maybe_enable_https
reload_nginx_stack
sync_hsts_with_ssl
ensure_certbot_renew_loop

ensure_nginx_responding || {
  echo "ERROR: Nginx/store/admin checks failed after update."
  exit 1
}

echo "==> Verify..."
ensure_api_ready || true
./scripts/verify.sh

echo "==> Free disk space (Docker cleanup)..."
chmod +x scripts/docker-cleanup.sh
./scripts/docker-cleanup.sh

save_deploy_state

echo ""
echo "Update complete."
print_stack_urls
echo ""
echo "Tip: use 'cd ~/alhayaa && bash pull.sh' anytime for a safe full sync."
