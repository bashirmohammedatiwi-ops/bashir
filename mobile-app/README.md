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
3. ابنِ وارفع:
   ```bash
   flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
   ```
4. أو من Xcode: Product → Archive → Distribute App.

> **الإصدار 1.0:** إشعارات Push على شاشة الهاتف **مؤجّلة للتحديث 1.1**. قائمة الإشعارات داخل التطبيق (حسابي) تعمل بدون Firebase.

**جاهز في المستودع:** `PrivacyInfo.xcprivacy`، `ITSAppUsesNonExemptEncryption`، Universal Links، `ExportOptions.plist`.

**على السيرفر (بعد `git pull` + `./scripts/update.sh`):**
- `https://deemaalhayat.com/.well-known/apple-app-site-association`
- `https://deemaalhayat.com/.well-known/assetlinks.json` — شغّل `infra/scripts/generate-android-assetlinks.sh` بمفتاح الإصدار ثم أعد النشر.

**يدوياً في App Store Connect:** لقطات شاشة iPhone 6.7"، وصف عربي/إنجليزي، فئة Shopping، بيانات الخصوصية (بدون تتبع، بدون Push في v1)، حساب تجريبي.

### قائمة مراجعة App Store (v1.0)

| البند | الحالة |
|-------|--------|
| Bundle ID `com.alhayaa.alhayaa` | جاهز |
| Privacy Manifest + لا تتبع | جاهز |
| حذف الحساب داخل التطبيق | جاهز |
| COD فقط — لا IAP | جاهز |
| Push معطّل | جاهز |
| الخصوصية/الشروط داخل التطبيق (عربي + إنجليزي) | جاهز |
| دعم: بريد + واتساب/هاتف | جاهز |
| iPhone فقط (لا لقطات iPad) | جاهز |
| Associated Domains على Apple Developer | **يدوي على Mac** |
| بناء IPA ورفعه | **يدوي على Mac** |

**ملاحظات للمراجع (Review Notes):**
```
Demo account: [PHONE] / [PASSWORD]
v1.0: Cash on delivery only — no in-app purchases.
Push notifications disabled. Browse without login; checkout requires sign-in.
Account deletion: Account → Delete Account.
Camera used only for QR/barcode product scan.
Support: support@deemaalhayat.com
```

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

## Firebase / Push (التحديث 1.1)

> **الإصدار الحالي 1.0:** `AppConfig.pushNotificationsEnabled = false` — لا يُطلب إذن إشعارات ولا Push على شاشة الهاتف.
> قائمة الإشعارات داخل التطبيق (من السيرفر) تعمل بدون Firebase.

لتفعيل Push في تحديث لاحق، راجع `FIREBASE_SETUP.md` واضبط `pushNotificationsEnabled = true`.

## الإصدار

يُحدَّد في `pubspec.yaml` (`version: 1.0.0+1`). يظهر تلقائياً في شاشة «حسابي».
