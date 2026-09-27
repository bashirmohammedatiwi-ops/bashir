#!/usr/bin/env bash
# Run ON the VPS (already logged in). No SSH from your Mac.
#
#   cd ~/alhayaa/infra
#   # put the JSON at secrets/firebase-service-account.json first, then:
#   ./scripts/setup-firebase-push-on-server.sh
#
# Or:
#   FIREBASE_JSON=/path/to/deema-al-hayat-firebase-adminsdk-....json \
#     ./scripts/setup-firebase-push-on-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/.env"
SECRET_DIR="$ROOT/secrets"
SECRET_FILE="$SECRET_DIR/firebase-service-account.json"

candidates=(
  "${FIREBASE_JSON:-}"
  "$SECRET_FILE"
  "$ROOT/../backend/firebase-service-account.json"
  "./firebase-service-account.json"
)

SRC=""
for path in "${candidates[@]}"; do
  if [[ -n "$path" && -f "$path" ]]; then
    SRC="$path"
    break
  fi
done

if [[ -z "$SRC" ]]; then
  echo "ERROR: Firebase JSON not found on this server."
  echo ""
  echo "Create it first, then re-run:"
  echo "  mkdir -p $SECRET_DIR && nano $SECRET_FILE"
  echo "  # paste the full service-account JSON, save, then:"
  echo "  ./scripts/setup-firebase-push-on-server.sh"
  exit 1
fi

mkdir -p "$SECRET_DIR"
chmod 700 "$SECRET_DIR"
if [[ "$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")" != "$SECRET_FILE" ]]; then
  cp "$SRC" "$SECRET_FILE"
fi
chmod 600 "$SECRET_FILE"

python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d.get("type")=="service_account"; assert d.get("private_key"); print("OK JSON:", d.get("project_id"), d.get("client_email"))' "$SECRET_FILE"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE"
  exit 1
fi

tmp="$(mktemp)"
grep -vE '^(FIREBASE_SERVICE_ACCOUNT_PATH|FIREBASE_SERVICE_ACCOUNT_JSON)=' "$ENV_FILE" >"$tmp" || true
{
  echo ""
  echo "# Firebase Cloud Messaging (managed by setup-firebase-push-on-server.sh)"
  echo "FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase-service-account.json"
  echo "FIREBASE_SERVICE_ACCOUNT_JSON="
} >>"$tmp"
mv "$tmp" "$ENV_FILE"
chmod 600 "$ENV_FILE"

cat > "$ROOT/docker-compose.firebase.yml" <<'EOF'
services:
  api:
    volumes:
      - ./secrets/firebase-service-account.json:/run/secrets/firebase-service-account.json:ro
EOF

COMPOSE="docker compose -f docker-compose.prod.yml -f docker-compose.firebase.yml"
if [[ -f docker-compose.override.yml ]]; then
  COMPOSE="$COMPOSE -f docker-compose.override.yml"
fi

echo "==> Recreate API with Firebase secret..."
$COMPOSE up -d --force-recreate api

echo "==> Waiting for API health..."
ok=0
for i in $(seq 1 36); do
  if curl -sf "http://127.0.0.1/api/v1/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 5
done

if [[ "$ok" -ne 1 ]]; then
  echo "ERROR: API not healthy"
  $COMPOSE logs api --tail=80 || true
  exit 1
fi

logs="$($COMPOSE logs api --tail=150 2>/dev/null || true)"
if echo "$logs" | grep -q "Firebase Cloud Messaging initialized"; then
  echo "SUCCESS: Firebase Cloud Messaging initialized"
elif echo "$logs" | grep -qi "Firebase not configured\|Firebase init failed"; then
  echo "ERROR: Firebase still not configured"
  echo "$logs" | tail -60
  exit 1
else
  echo "WARN: confirm in admin → الإشعارات (Push مفعّل)"
fi

echo "Done."
