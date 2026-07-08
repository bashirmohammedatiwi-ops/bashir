#!/usr/bin/env bash
# إصلاح تعارض git على VPS ثم إكمال النشر الكامل.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

echo "==> Recover deploy — reset infra scripts + pull + update"

if [[ -d "$REPO_ROOT/.git" ]]; then
  git -C "$REPO_ROOT" fetch origin main
  echo "    Reset infra/scripts + infra/nginx to origin/main..."
  git -C "$REPO_ROOT" checkout origin/main -- infra/scripts infra/nginx 2>/dev/null || true
  git -C "$REPO_ROOT" pull --ff-only origin main
fi

cd "$ROOT"
chmod +x scripts/*.sh

# احتياط إذا كان pull قديماً
if [[ ! -f scripts/sync-catalog-hub-data.sh ]]; then
  cat > scripts/sync-catalog-hub-data.sh << 'EOF'
#!/usr/bin/env bash
echo "==> catalog-hub v2: no seed data sync required (skipped)"
EOF
  chmod +x scripts/sync-catalog-hub-data.sh
fi

exec ./scripts/update.sh
