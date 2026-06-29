#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy the catalog-hub (barcode search) service on the VPS.
#
# WHY THIS EXISTS:
#   catalog-hub mounts a named volume at /app/data (catalog_hub_data) so the app
#   can persist runtime-learned barcodes/caches. That volume SHADOWS the data
#   baked into the Docker image — so rebuilding the image alone never updates
#   seed files like data/barcode-lookup.json. This script rebuilds the image AND
#   merges the repo's seed lookup into the live volume (keeping learned entries).
#
# USAGE (on the server):
#   bash infra/scripts/deploy-catalog-hub.sh
#
# Run from anywhere inside the repo; paths are resolved automatically.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_DIR/.." && pwd)"

SERVICE="catalog-hub"
SEED_LOOKUP="$REPO_ROOT/catalog-hub/data/barcode-lookup.json"
MERGE_SCRIPT="$SCRIPT_DIR/merge-barcode-lookup.cjs"

cd "$INFRA_DIR"

if [[ -f docker-compose.prod.yml ]]; then
  COMPOSE="docker compose -f docker-compose.prod.yml"
else
  COMPOSE="docker compose"
fi

echo "==> catalog-hub deploy"
echo "    repo:    $REPO_ROOT"
echo "    compose: $COMPOSE"

# 1) Pull latest code + data (discard stale local edits that block ff pull) ----
if [[ -d "$REPO_ROOT/.git" ]]; then
  echo "==> Syncing repo with origin/main..."
  git -C "$REPO_ROOT" fetch origin main
  if ! git -C "$REPO_ROOT" diff --quiet -- catalog-hub 2>/dev/null; then
    echo "    Discarding local catalog-hub edits (server workarounds) to allow pull..."
    git -C "$REPO_ROOT" checkout -- catalog-hub 2>/dev/null || true
  fi
  git -C "$REPO_ROOT" pull --ff-only origin main
else
  echo "==> Not a git repo — using files as-is"
fi

# 2) Rebuild the image from scratch (fresh code) ------------------------------
echo "==> Rebuilding $SERVICE image (no cache)..."
$COMPOSE build --no-cache "$SERVICE"

echo "==> Recreating $SERVICE container..."
$COMPOSE up -d --force-recreate "$SERVICE"

# 3) Wait for the container to be healthy -------------------------------------
echo "==> Waiting for $SERVICE health..."
ready=0
for _ in $(seq 1 30); do
  if $COMPOSE exec -T "$SERVICE" wget -qO- http://127.0.0.1:10000/api/health 2>/dev/null | grep -q '"ok":true'; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" -ne 1 ]]; then
  echo "FAIL: $SERVICE did not become healthy."
  echo "      Check: $COMPOSE logs $SERVICE --tail=60"
  exit 1
fi
echo "    healthy."

# 4) Merge repo seed lookup into the live data volume -------------------------
#    (the volume shadows the image's /app/data, so we sync it explicitly)
if [[ -f "$SEED_LOOKUP" && -f "$MERGE_SCRIPT" ]]; then
  echo "==> Syncing seed barcode-lookup.json into the data volume..."
  $COMPOSE cp "$SEED_LOOKUP" "$SERVICE:/tmp/seed-barcode-lookup.json"
  $COMPOSE cp "$MERGE_SCRIPT" "$SERVICE:/tmp/merge-barcode-lookup.cjs"
  $COMPOSE exec -T "$SERVICE" node /tmp/merge-barcode-lookup.cjs \
    /tmp/seed-barcode-lookup.json /app/data/barcode-lookup.json

  # Reload merged data into memory (rebuilds the in-memory barcode index)
  echo "==> Restarting $SERVICE to reload merged data..."
  $COMPOSE restart "$SERVICE"
  for _ in $(seq 1 30); do
    if $COMPOSE exec -T "$SERVICE" wget -qO- http://127.0.0.1:10000/api/health 2>/dev/null | grep -q '"ok":true'; then
      break
    fi
    sleep 2
  done
else
  echo "WARN: seed lookup or merge script missing — skipping data sync"
fi

# 5) Verify the previously-failing barcodes ----------------------------------
echo "==> Verifying barcode search inside the container..."
BASE="http://127.0.0.1:10000/api/search/barcode"
ALL_OK=1
for bc in 6979237552832 6975302933346 077802146847 077802163851; do
  body="$($COMPOSE exec -T "$SERVICE" wget -qO- "$BASE?q=$bc" 2>/dev/null || true)"
  if echo "$body" | grep -q '"store":"miswag"'; then
    echo "    OK   $bc -> miswag found"
  else
    echo "    FAIL $bc -> miswag missing"
    ALL_OK=0
  fi
done

echo ""
if [[ "$ALL_OK" -eq 1 ]]; then
  echo "catalog-hub deploy complete — all sample barcodes resolve via miswag."
else
  echo "catalog-hub deployed, but some barcodes still missing miswag."
  echo "Inspect: $COMPOSE exec $SERVICE cat /app/data/barcode-lookup.json | grep 6979237552832"
  exit 1
fi
