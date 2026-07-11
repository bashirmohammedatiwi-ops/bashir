# admin-mobile — تطبيق الموظفين (Flutter)

تطبيق هاتف لمسح باركود المنتجات واستيرادها من كتالوج المتاجر (مسواگ، نجد، الريان، وغيرها) إلى متجر الحياة.

## الميزات

- تسجيل دخول موظفين (ADMIN / STAFF)
- مسح باركود بالكاميرا أو إدخال يدوي
- بحث في catalog-hub عبر كل المتاجر
- معاينة المنتج مع سعر POS والمخزون وحالة «موجود في التطبيق»
- استيراد المنتج (صور، براند، تصنيف، تدرجات)

## التشغيل

```bash
cd admin-mobile
flutter pub get
flutter run
```

## عناوين السيرفر (افتراضي)

- API: `http://187.127.88.146/api/v1`
- Catalog Hub: `http://187.127.88.146/catalog-hub`

لتغيير العناوين عند البناء:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_HOST/api/v1 --dart-define=CATALOG_HUB_URL=http://YOUR_HOST/catalog-hub
```

## بناء APK

```bash
flutter build apk --release
```

الملف: `build/app/outputs/flutter-apk/app-release.apk`
