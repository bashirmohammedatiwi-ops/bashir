# إعداد Firebase Cloud Messaging (FCM)

Push يحتاج **3 أجزاء** تعمل معاً:

```
لوحة التحكم → السيرفر (Firebase Admin) → FCM → APNs (iOS) / Google (Android) → الهاتف
```

---

## الجزء 1 — Firebase Console

1. افتح [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروعاً (أو استخدم موجوداً)
3. أضف تطبيق **Android**: `com.alhayaa.alhayaa`
4. أضف تطبيق **iOS**: `com.alhayaa.alhayaa`

### Android
- حمّل `google-services.json`
- ضعه في: `mobile-app/android/app/google-services.json`

### iOS
- حمّل `GoogleService-Info.plist`
- ضعه في: `mobile-app/ios/Runner/GoogleService-Info.plist`
- في Xcode: تأكد أن الملف مضاف إلى target **Runner** (Copy Bundle Resources)

---

## الجزء 2 — Apple APNs (مهم جداً لـ iOS)

بدون هذه الخطوة **لن تصل إشعارات iPhone** حتى لو Firebase مضبوط.

1. [Apple Developer](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. **Keys** → **+** → فعّل **Apple Push Notifications service (APNs)**
3. حمّل ملف `.p8` (مرة واحدة فقط — احفظه بأمان)
4. في **Firebase Console** → Project Settings → **Cloud Messaging**
5. تحت **Apple app configuration** → ارفع مفتاح APNs:
   - Key ID
   - Team ID: `629ARMBUX8`
   - ملف `.p8`

6. على App ID `com.alhayaa.alhayaa` فعّل:
   - **Push Notifications**
   - **Associated Domains**

---

## الجزء 3 — السيرفر (VPS)

في `backend/.env` أو `infra/.env` (حسب إعدادك):

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",...}
```

**كيف تحصل على الملف:**
1. Firebase Console → Project Settings → **Service accounts**
2. **Generate new private key** → يحمّل JSON
3. الصق محتوى JSON كسطر واحد في `FIREBASE_SERVICE_ACCOUNT_JSON`

أو:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

ثم أعد تشغيل API:
```bash
cd ~/alhayaa/infra && ./scripts/update.sh
```

**تحقق:** لوحة التحكم → الإشعارات → يجب أن يظهر `fcmEnabled: true` وليس تحذير Push.

---

## الجزء 4 — بناء التطبيق

### الطريقة الأسهل (موصى بها)

ضع الملفات في المشروع:
- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`

ثم ابنِ عادياً — التطبيق يقرأها تلقائياً:

```bash
# Android
flutter build apk --release

# iOS (على Mac)
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
```

### الطريقة البديلة (--dart-define)

```bash
flutter build apk --release \
  --dart-define=FIREBASE_API_KEY=AIza... \
  --dart-define=FIREBASE_APP_ID=1:123:ios:abc \
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=123456789 \
  --dart-define=FIREBASE_PROJECT_ID=your-project-id
```

> استخدم `FIREBASE_APP_ID` من تطبيق **iOS** عند بناء IPA، ومن **Android** عند بناء APK.

---

## التحقق

| الخطوة | ماذا تتوقع |
|--------|------------|
| افتح التطبيق | يطلب إذن الإشعارات |
| لوحة التحكم → إحصائيات | `activeDevices` ≥ 1 |
| أرسل إشعار «جميع العملاء» | `pushStatus: SENT` |
| الهاتف | إشعار على الشاشة (حتى بدون تسجيل دخول) |

---

## استكشاف الأخطاء

| المشكلة | السبب المحتمل |
|---------|----------------|
| `fcmEnabled: false` | لا يوجد `FIREBASE_SERVICE_ACCOUNT` على السيرفر |
| `pushStatus: SKIPPED` | لا أجهزة مسجّلة أو Firebase غير مضبوط في التطبيق |
| يعمل Android ولا يعمل iOS | لم ترفع مفتاح APNs في Firebase |
| داخل التطبيق فقط بدون Push | التطبيق بُني بدون `google-services.json` / `GoogleService-Info.plist` |
| iOS لا يطلب إذن الإشعارات | Firebase لم يُهيأ — راجع الملفات أعلاه |

---

بدون إعداد Firebase: التطبيق يعمل كاملاً، لكن **Push على شاشة الهاتف** لا يعمل (قائمة الإشعار داخل التطبيق تعمل من السيرفر مباشرة).
