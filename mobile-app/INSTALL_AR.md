# تثبيت تطبيق ديما الحياة على Android

## الحل الموصى به (بدون تحذير Play Protect)

ارفع التطبيق على **Google Play Console → اختبار داخلي (Internal testing)**:

1. افتح [Google Play Console](https://play.google.com/console)
2. التطبيق → **الاختبار** → **اختبار داخلي**
3. ارفع الملف:
   ```
   build/app/outputs/bundle/release/app-release.aab
   ```
4. أضف بريد المختبرين (Gmail)
5. انسخ **رابط الاختبار** وأرسله — التثبيت يتم من **Google Play** بدون حظر

> التوقيع محفوظ تلقائياً في `android/key.properties` و`upload-keystore.jks` — لا تحتاج إدخال كلمة مرور عند كل بناء.

---

## توزيع APK مباشر (واتساب / تيليجرام)

### الملف المناسب لمعظم الهواتف (~30 MB بدل 87 MB)
```
build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
```

### عند ظهور «تم حظر التطبيق لحماية جهازك»
هذا من **Google Play Protect** وليس خطأ في التطبيق:

1. اضغط **«التثبيت على أي حال»** (أسفل الرسالة)
2. **لا** تضغط «حسناً»
3. إن وُجدت نسخة قديمة → احذفها أولاً ثم ثبّت من جديد

### تثبيت من الكمبيوتر (USB)
```powershell
cd mobile-app
flutter install
```

---

## أوامر البناء

```bash
# للمتجر (Google Play)
flutter build appbundle --release

# APK خفيف لهواتف حديثة (arm64)
flutter build apk --release --target-platform android-arm64

# APK شامل لكل المعماريات
flutter build apk --release
```
