#!/usr/bin/env bash
# Upload Firebase service account to the VPS and enable FCM on the API.
#
# From your Mac (repo root):
#   chmod +x infra/scripts/setup-firebase-push.sh
#   ./infra/scripts/setup-firebase-push.sh
#   ./infra/scripts/setup-firebase-push.sh root@187.127.88.146
#   FIREBASE_JSON=~/Downloads/xxx.json ./infra/scripts/setup-firebase-push.sh user@host
#
# Needs SSH key auth. Never commits secrets to git.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_ROOT/.." && pwd)"

SSH_TARGET="${1:-${SSH_TARGET:-root@187.127.88.146}}"
REMOTE_INFRA="${REMOTE_INFRA:-~/alhayaa/infra}"

candidates=(
  "${FIREBASE_JSON:-}"
  "$REPO_ROOT/backend/firebase-service-account.json"
  "$HOME/Downloads/deema-al-hayat-firebase-adminsdk-fbsvc-0428f7068f.json"
)

LOCAL_JSON=""
for path in "${candidates[@]}"; do
  if [[ -n "$path" && -f "$path" ]]; then
    LOCAL_JSON="$path"
    break
  fi
done

if [[ -z "$LOCAL_JSON" ]]; then
  echo "ERROR: Firebase service account JSON not found."
  echo "Set FIREBASE_JSON=/path/to/file.json or place:"
  echo "  backend/firebase-service-account.json"
  exit 1
fi

python3 - "$LOCAL_JSON" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
assert data.get("type") == "service_account", "not a service account"
assert data.get("project_id"), "missing project_id"
assert data.get("private_key"), "missing private_key"
print(f"OK local JSON: project={data['project_id']} email={data.get('client_email','')}")
PY

echo "==> Target: $SSH_TARGET"
echo "==> Local JSON: $LOCAL_JSON"
echo "==> Remote infra: $REMOTE_INFRA"

if ! ssh -o BatchMode=yes -o ConnectTimeout=12 "$SSH_TARGET" "echo SSH_OK" >/dev/null; then
  echo "ERROR: SSH failed (BatchMode). Fix key auth first, e.g.:"
  echo "  ssh-copy-id $SSH_TARGET"
  echo "Or: SSH_TARGET=user@host ./infra/scripts/setup-firebase-push.sh"
  exit 1
fi

ssh "$SSH_TARGET" "mkdir -p $REMOTE_INFRA/secrets && chmod 700 $REMOTE_INFRA/secrets"
scp -q "$LOCAL_JSON" "$SSH_TARGET:$REMOTE_INFRA/secrets/firebase-service-account.json"
ssh "$SSH_TARGET" "chmod 600 $REMOTE_INFRA/secrets/firebase-service-account.json"

ssh "$SSH_TARGET" "REMOTE_INFRA=$REMOTE_INFRA" bash -s <<'REMOTE'
set -euo pipefail
INFRA="$REMOTE_INFRA"
ENV_FILE="$INFRA/.env"
SECRET_FILE="$INFRA/secrets/firebase-service-account.json"

cd "$INFRA"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE"
  exit 1
fi

python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d.get("type")=="service_account"; print("OK remote JSON:", d.get("project_id"))' "$SECRET_FILE"

tmp="$(mktemp)"
grep -vE '^(FIREBASE_SERVICE_ACCOUNT_PATH|FIREBASE_SERVICE_ACCOUNT_JSON)=' "$ENV_FILE" >"$tmp" || true
{
  echo ""
  echo "# Firebase Cloud Messaging (managed by setup-firebase-push.sh)"
  echo "FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase-service-account.json"
  echo "FIREBASE_SERVICE_ACCOUNT_JSON="
} >>"$tmp"
mv "$tmp" "$ENV_FILE"
chmod 600 "$ENV_FILE"

cat > "$INFRA/docker-compose.firebase.yml" <<'EOF'
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
  echo "ERROR: API did not become healthy."
  $COMPOSE logs api --tail=80 || true
  exit 1
fi

echo "==> Check Firebase init in logs..."
logs="$($COMPOSE logs api --tail=150 2>/dev/null || true)"
if echo "$logs" | grep -q "Firebase Cloud Messaging initialized"; then
  echo "SUCCESS: Firebase Cloud Messaging initialized"
elif echo "$logs" | grep -qi "Firebase not configured\|Firebase init failed"; then
  echo "ERROR: Firebase still not configured"
  echo "$logs" | tail -80
  exit 1
else
  echo "WARN: Firebase log line not seen yet — check admin → الإشعارات (Push مفعّل)"
fi

echo "Done."
REMOTE

echo ""
echo "All set. Rebuild & install the mobile app so devices register FCM tokens."
echo "Admin → الإشعارات should show «Push مفعّل (FCM)»."
