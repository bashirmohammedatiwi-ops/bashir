#!/usr/bin/env bash
# ينشئ مفتاح رفع Google Play لتطبيق ديما الحياة (مرة واحدة فقط).
# - كلمة السر تكتبها أنت هنا ولا تظهر على الشاشة ولا تُحفظ في git.
# - المفتاح يُحفظ في ~/deema-keys/customer-app/ — خذ منه نسخة احتياطية مع كلمة السر.
set -euo pipefail

DIR="$HOME/deema-keys/customer-app"
KS="$DIR/upload-keystore.jks"
PROPS="$DIR/key.properties"
APP_PROPS="${APP_PROPS:-$(cd "$(dirname "$0")/.." && pwd)/mobile-app/android/key.properties}"

# keytool الخاص بالنظام لا يعمل بدون Java — نستخدم Java التي يبني بها Flutter.
KEYTOOL=""
for k in /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home/bin/keytool \
         "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" \
         "${JAVA_HOME:-/nonexistent}/bin/keytool"; do
  [[ -x "$k" ]] && { KEYTOOL="$k"; break; }
done
if [[ -z "$KEYTOOL" ]]; then echo "لم أجد keytool (Java)."; exit 1; fi

if [[ -f "$KS" ]]; then
  echo "المفتاح موجود مسبقاً: $KS — لن أستبدله."
  exit 1
fi

mkdir -p "$DIR"
chmod 700 "$DIR"

while true; do
  read -r -s -p "اختر كلمة سر للمفتاح (8 أحرف على الأقل): " P1; echo
  read -r -s -p "أعد كتابتها للتأكيد: " P2; echo
  if [[ "$P1" != "$P2" ]]; then echo "غير متطابقتين، حاول مرة أخرى."; continue; fi
  if [[ ${#P1} -lt 8 ]]; then echo "قصيرة جداً."; continue; fi
  break
done

export DEEMA_KS_PASS="$P1"
"$KEYTOOL" -genkeypair -v \
  -keystore "$KS" -storetype PKCS12 \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Deema Alhayat, O=Deema Alhayat, L=Baghdad, C=IQ" \
  -storepass:env DEEMA_KS_PASS -keypass:env DEEMA_KS_PASS >/dev/null 2>&1

umask 077
cat > "$PROPS" <<EOF
storePassword=$P1
keyPassword=$P1
keyAlias=upload
storeFile=$KS
EOF
cp "$PROPS" "$APP_PROPS"
chmod 600 "$PROPS" "$APP_PROPS" "$KS"
unset DEEMA_KS_PASS P1 P2

echo
echo "✓ تم إنشاء المفتاح: $KS"
echo "✓ رُبط بالتطبيق (mobile-app/android/key.properties — خارج git)"
echo
echo "بصمة مفتاح الرفع (SHA-256):"
"$KEYTOOL" -list -v -keystore "$KS" -alias upload -storepass:file <(grep '^storePassword=' "$PROPS" | cut -d= -f2-) 2>/dev/null | grep -m1 "SHA256"
echo
echo "مهم: انسخ المجلد $DIR مع كلمة السر إلى مكان آمن (فلاشة أو مدير كلمات سر)."
