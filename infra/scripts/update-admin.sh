#!/usr/bin/env bash
# Rebuild admin panel static files and reload nginx.
# Prefer: cd ~/alhayaa && bash pull.sh
set -euo pipefail

INFRA_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_ROOT/.." && pwd)"
COMPOSE="docker compose -f $INFRA_ROOT/docker-compose.prod.yml"

if [[ -f "$INFRA_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$INFRA_ROOT/.env"
  set +a
fi

# shellcheck source=lib/deploy-common.sh
source "$INFRA_ROOT/scripts/lib/deploy-common.sh"

sync_repo_from_github "$REPO_ROOT"

cd "$INFRA_ROOT"
chmod +x scripts/build-admin-web.sh
build_admin_web_panel
reload_nginx_stack
ensure_admin_serving

echo ""
echo "Admin updated."
print_stack_urls
