# إعداد Firebase Cloud Messaging (FCM)

التطبيق جاهز لـ FCM. تحتاج مشروع Firebase + متغيرات البناء.

## 1. إنشاء مشروع Firebase

1. [Firebase Console](https://console.firebase.google.com/) → مشروع جديد
2. أضف تطبيق Android: `com.alhayaa.alhayaa`
3. (اختياري) أضف تطبيق iOS: `com.alhayaa.alhayaa`

## 2. مفاتيح التطبيق (بدون google-services.json)

مرّر القيم عند التشغيل أو البناء:

```bash
flutter run \
  --dart-define=FIREBASE_API_KEY=AIza... \
  --dart-define=FIREBASE_APP_ID=1:123:android:abc \
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=123456789 \
  --dart-define=FIREBASE_PROJECT_ID=alhayaa-xxxxx
```

## 3. خادم NestJS

في `backend/.env` على VPS:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

أو:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

## 4. التحقق

- سجّل الدخول في التطبيق → يُرسل `POST /notifications/devices`
- من لوحة التحكم → الإشعارات → إرسال تجريبي
- `GET /notifications/stats` → `fcmEnabled: true`

بدون إعداد Firebase: الإشعار داخل التطبيق يعمل، والدفع push يُتخطّى.
