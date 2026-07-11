#!/usr/bin/env bash
# مراقبة مسح باركودات مسواگ — يُشغَّل مع: watch -n 10 ./scripts/watch-miswag-scan.sh
set -euo pipefail

URL="${CATALOG_HUB_SCAN_URL:-http://localhost/catalog-hub/api/stores/miswag/scan-barcodes}"

RESP=$(curl -sf --max-time 15 "$URL" 2>/dev/null) || {
  echo "=========================================="
  echo "  مسح باركودات مسواگ — جمال / عطور"
  echo "=========================================="
  echo "الحالة:        تعذّر الاتصال بـ catalog-hub"
  echo "تحقق: docker compose -f docker-compose.prod.yml ps catalog-hub"
  exit 0
}

export SCAN_JSON="$RESP"
python3 <<'PY'
import json, datetime, os, sys

try:
    d = json.loads(os.environ["SCAN_JSON"]).get("scan", {})
except (json.JSONDecodeError, KeyError):
    print("خطأ: استجابة غير صالحة من catalog-hub")
    sys.exit(0)

def fmt_time(ms):
    if not ms:
        return "—"
    return datetime.datetime.fromtimestamp(ms / 1000).strftime("%H:%M:%S")

running = d.get("running")
if d.get("aborted"):
    status = "أُوقف يدوياً"
elif running:
    status = "يعمل"
elif d.get("finishedAt"):
    status = "انتهى"
else:
    status = "متوقف"

pages_done = d.get("pagesDone", 0)
pages_total = d.get("pagesTotal", 0)
pct = round(100 * pages_done / pages_total, 1) if pages_total else 0

print("=" * 42)
print("     مسح باركودات مسواگ — جمال / عطور")
print("=" * 42)
print(f"الحالة:        {status}")
print(f"النطاق:        {d.get('scope', '—')}")
print(f"بدأ الساعة:    {fmt_time(d.get('startedAt'))}")
print(f"انتهى الساعة:  {fmt_time(d.get('finishedAt'))}")
print()
print(f"الصفحات:       {pages_done} / {pages_total}  ({pct}%)")
print(f"المنتجات:      {d.get('found', 0):,}")
print()
print(f"تم فحصه:       {d.get('scanned', 0):,}")
print(f"باركود جديد:   {d.get('cached', 0):,}")
print(f"في الفهرس:     {d.get('indexTotal', 0):,}")
print(f"تخطّى:         {d.get('skipped', 0):,}")
print(f"غير مكتمل:     {d.get('incomplete', 0):,}")
print(f"أخطاء:         {d.get('errors', 0):,}")
print("=" * 42)
PY
