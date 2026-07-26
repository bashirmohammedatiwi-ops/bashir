# ديما الحياة — تطبيق Flutter

متجر مستحضرات التجميل والعناية. يتصل بـ `https://deemaalhayat.com/api/v1`.

## المتطلبات

- Flutter SDK 3.9+
- Android Studio / Xcode (للنشر على المتاجر)

## التشغيل المحلي

```bash
cd mobile-app
flutter pub get
flutter run
```

للاتصال بخادم محلي:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

## بناء الإصدار للمتاجر

### Android (Google Play)

1. أنشئ keystore:
   ```bash
   keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. انسخ `android/key.properties.example` إلى `android/key.properties` واملأ القيم.
3. ابنِ:
   ```bash
   flutter build appbundle --release
   ```
4. الملف: `build/app/outputs/bundle/release/app-release.aab`

### iOS (App Store)

1. افتح `ios/Runner.xcworkspace` في Xcode على Mac.
2. Team: `629ARMBUX8` — Bundle ID: `com.alhayaa.alhayaa`.
3. (اختياري للإشعارات) انسخ `ios/GoogleService-Info.plist.example` إلى `ios/Runner/GoogleService-Info.plist` واملأه من Firebase.
4. ابنِ وارفع:
   ```bash
   flutter build ipa --release \
     --export-options-plist=ios/ExportOptions.plist \
     --dart-define=FIREBASE_API_KEY=... \
     --dart-define=FIREBASE_APP_ID=... \
     --dart-define=FIREBASE_MESSAGING_SENDER_ID=... \
     --dart-define=FIREBASE_PROJECT_ID=...
   ```
5. أو من Xcode: Product → Archive → Distribute App.

**جاهز في المستودع:** `PrivacyInfo.xcprivacy`، `ITSAppUsesNonExemptEncryption`، entitlements للروابط والإشعارات، `ExportOptions.plist`.

**على السيرفر (بعد `git pull` + `./scripts/update.sh`):**
- `https://deemaalhayat.com/.well-known/apple-app-site-association`
- `https://deemaalhayat.com/.well-known/assetlinks.json` — شغّل `infra/scripts/generate-android-assetlinks.sh` بمفتاح الإصدار ثم أعد النشر.

**يدوياً في App Store Connect:** لقطات شاشة، وصف، فئة، بيانات الخصوصية، حساب تجريبي للمراجعة.

## معلومات المتجر

| الحقل | القيمة |
|-------|--------|
| اسم التطبيق | ديما الحياة |
| Bundle ID | `com.alhayaa.alhayaa` |
| سياسة الخصوصية | https://deemaalhayat.com/privacy |
| شروط الاستخدام | https://deemaalhayat.com/terms |
| الدفع | الدفع عند الاستلام (COD) |
| حذف الحساب | حسابي → حذف الحساب |
| اللغات | العربية، الإنجليزية |

## Firebase (اختياري — للإشعارات)

أضف `google-services.json` (Android) و `GoogleService-Info.plist` (iOS) ثم عيّن متغيرات البيئة عند البناء (راجع `lib/core/push/push_service.dart`).

بدون Firebase يعمل التطبيق كاملاً باستثناء الإشعارات الفورية.

## الإصدار

يُحدَّد في `pubspec.yaml` (`version: 1.0.0+1`). يظهر تلقائياً في شاشة «حسابي».
