#!/usr/bin/env bash
set -euo pipefail

# يولّد assetlinks.json من keystore الإصدار (Google Play / App Links).
# الاستخدام:
#   ./scripts/generate-android-assetlinks.sh [path-to-keystore] [alias]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STORE_ROOT="$(cd "$INFRA_ROOT/../mobile-app/android" && pwd)"
KEYSTORE="${1:-$STORE_ROOT/upload-keystore.jks}"
ALIAS="${2:-upload}"
OUT="$INFRA_ROOT/deep-links/assetlinks.json"

if [[ ! -f "$KEYSTORE" ]]; then
  echo "Keystore not found: $KEYSTORE"
  echo "Create one or pass path: $0 /path/to/upload-keystore.jks upload"
  exit 1
fi

SHA="$(keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" 2>/dev/null | awk -F': ' '/SHA256:/{print $2; exit}')"
if [[ -z "$SHA" ]]; then
  echo "Could not read SHA256 for alias $ALIAS"
  exit 1
fi

cat >"$OUT" <<EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.alhayaa.alhayaa",
      "sha256_cert_fingerprints": [
        "$SHA"
      ]
    }
  }
]
EOF

echo "OK  wrote $OUT"
echo "    SHA256: $SHA"
