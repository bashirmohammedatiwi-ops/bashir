#!/usr/bin/env bash
# Rebuild admin panel static files and reload nginx.
# Usage: cd infra && ./scripts/update-admin.sh
set -euo pipefail

INFRA_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_ROOT/.." && pwd)"
ADMIN_ROOT="$REPO_ROOT/admin-desktop"
COMPOSE="docker compose -f $INFRA_ROOT/docker-compose.prod.yml"
DOMAIN="${DOMAIN:-187.127.88.146}"

if [[ -f "$INFRA_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$INFRA_ROOT/.env"
  set +a
  DOMAIN="${DOMAIN:-187.127.88.146}"
fi

_git_root() {
  if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "$REPO_ROOT"
  elif git -C "$INFRA_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "$INFRA_ROOT"
  else
    echo ""
  fi
}

_pull_latest() {
  local root
  root="$(_git_root)"
  if [[ -z "$root" ]]; then
    echo "Warning: no git repo — building admin-desktop as-is"
    return 0
  fi

  echo "==> Git root: $root"
  echo "==> Before: $(git -C "$root" log -1 --oneline 2>/dev/null || echo 'unknown')"

  git -C "$root" fetch origin main

  local local_rev remote_rev
  local_rev="$(git -C "$root" rev-parse HEAD)"
  remote_rev="$(git -C "$root" rev-parse origin/main)"

  if [[ "$local_rev" == "$remote_rev" ]]; then
    echo "==> Already up to date with origin/main"
    return 0
  fi

  # تعديلات محلية على سكربتات infra/ تمنع pull — نستبدلها بنسخة remote
  if git -C "$root" status --porcelain -- infra/scripts/ 2>/dev/null | grep -q .; then
    echo "==> Local changes in infra/scripts/ — syncing from origin/main..."
    git -C "$root" checkout origin/main -- infra/scripts/ 2>/dev/null \
      || git -C "$root" checkout -- infra/scripts/ 2>/dev/null \
      || true
  fi

  if ! git -C "$root" pull origin main; then
    echo ""
    echo "ERROR: git pull failed."
    echo "Fix manually:"
    echo "  cd $root"
    echo "  git status"
    echo "  git stash push -u -m 'before admin update'"
    echo "  git pull origin main"
    exit 1
  fi

  echo "==> After:  $(git -C "$root" log -1 --oneline)"
}

_verify_build() {
  local static_dir="$INFRA_ROOT/admin-static"
  if [[ ! -d "$static_dir/home-builder" && ! -f "$static_dir/home-builder.html" ]]; then
    echo "Warning: home-builder static output not found under admin-static/"
    return 0
  fi
  if grep -rq "hb-canvas-wrap" "$static_dir" 2>/dev/null \
    && grep -rq "استوديو تحرير" "$static_dir" 2>/dev/null; then
    echo "==> Build verify: OK (WYSIWYG home builder + canvas CSS)"
  elif grep -rq "WYSIWYG" "$static_dir" 2>/dev/null; then
    echo "Warning: home builder JS updated but canvas CSS may be missing — check home-builder.css"
  else
    echo "Warning: home builder may be an old build — check git commit / admin-desktop source"
  fi
}

if [[ ! -f "$ADMIN_ROOT/package.json" ]]; then
  echo "ERROR: admin-desktop not found at $ADMIN_ROOT"
  echo "Ensure repo layout: alhayaa/{admin-desktop,infra,...}"
  exit 1
fi

_pull_latest

cd "$INFRA_ROOT"

echo "==> Build admin web..."
chmod +x scripts/build-admin-web.sh
./scripts/build-admin-web.sh

_verify_build

chmod -R a+rX "$INFRA_ROOT/admin-static"

echo "==> Reload nginx (recreate to refresh bind mount)..."
if [[ -f "$INFRA_ROOT/nginx/default.conf" ]]; then
  :
elif [[ -f "$INFRA_ROOT/nginx/default.bootstrap.conf" ]]; then
  cp "$INFRA_ROOT/nginx/default.bootstrap.conf" "$INFRA_ROOT/nginx/default.conf"
fi
$COMPOSE up -d --force-recreate nginx

sleep 2
admin_code="$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" "http://127.0.0.1/login/" 2>/dev/null || echo "000")"
if [[ "$admin_code" != "200" ]]; then
  echo ""
  echo "ERROR: admin still not reachable on :80 (login HTTP $admin_code)"
  echo "  ls -la admin-static/index.html admin-static/login/index.html"
  echo "  docker compose -f docker-compose.prod.yml logs nginx --tail=30"
  exit 1
fi

echo ""
echo "Admin updated."
echo "  URL:   http://${DOMAIN}/login/"
echo "  Commit: $(_git_root | xargs -I{} git -C {} log -1 --oneline 2>/dev/null || echo 'n/a')"
echo "  Tip:   hard refresh (Ctrl+Shift+R) or Incognito if UI looks old"
