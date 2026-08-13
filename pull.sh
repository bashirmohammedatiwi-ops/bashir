#!/usr/bin/env bash
# تحديث كامل للسيرفر — أمر واحد من جذر المشروع.
# Usage (VPS):
#   cd ~/alhayaa && bash pull.sh
#   cd ~/alhayaa && bash pull.sh --full    # إعادة بناء كل شيء
#   cd ~/alhayaa && bash pull.sh --api-only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
exec bash "$ROOT/infra/scripts/update.sh" "$@"
