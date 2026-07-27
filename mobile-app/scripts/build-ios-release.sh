#!/usr/bin/env bash
# بناء أرشيف iOS للنشر — يتطلب Mac + Xcode + Team 629ARMBUX8
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> flutter pub get"
flutter pub get

echo "==> pod install"
(cd ios && pod install)

echo "==> flutter build ipa (release)"
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist

IPA=$(find build/ios/ipa -name '*.ipa' 2>/dev/null | head -1)
if [[ -n "$IPA" ]]; then
  echo ""
  echo "✓ IPA جاهز: $IPA"
  echo "  ارفعه عبر Transporter أو Xcode Organizer"
else
  ARCHIVE="build/ios/archive/Runner.xcarchive"
  if [[ -d "$ARCHIVE" ]]; then
    echo ""
    echo "✓ Archive جاهز: $ARCHIVE"
    echo "  فشل تصدير IPA تلقائياً — غالباً لأن التطبيق غير منشأ بعد في App Store Connect."
    echo "  افتح Xcode: open ios/Runner.xcworkspace"
    echo "  ثم Window → Organizer → Archive → Distribute App"
  fi
fi
