#!/usr/bin/env bash
# يعرض رابط النفق الحالي للبوت (tunnelmole) من سجل الخدمة.
set -euo pipefail

LOG="${TUNNELMOLE_LOG:-/var/log/tunnelmole-admin.log}"
if [[ ! -f "$LOG" ]]; then
  echo "Missing log: $LOG" >&2
  exit 1
fi

URL="$(grep -Eo 'https://[a-z0-9-]+\.tunnelmole\.net' "$LOG" | tail -1)"
if [[ -z "$URL" ]]; then
  echo "No tunnel URL found in $LOG — try: systemctl restart admin-tunnelmole" >&2
  exit 1
fi

echo "$URL"
echo "Health: $URL/api/v1/health"
echo "Login:  POST $URL/api/v1/auth/login"
