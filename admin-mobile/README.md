# admin-mobile — تطبيق الموظفين (Flutter)

تطبيق هاتف لمسح باركود المنتجات واستيرادها من كتالوج المتاجر (مسواگ، نجد، الريان، وغيرها) إلى متجر الحياة.

## الميزات

- تسجيل دخول موظفين (ADMIN / STAFF)
- مسح باركود بالكاميرا أو إدخال يدوي
- بحث في catalog-hub عبر كل المتاجر
- معاينة المنتج مع سعر POS والمخزون وحالة «موجود في التطبيق»
- استيراد المنتج (صور، براند، تصنيف، تدرجات)
- تعبئة ذكية: Composer 2.5 Low يؤكد الاسم بالعربي والإنجليزي فقط (Cursor API على السيرفر)

## التشغيل

```bash
cd admin-mobile
flutter pub get
flutter run
```

## عناوين السيرفر (افتراضي)

- API: `https://deemaalhayat.com/api/v1`
- Catalog Hub: `https://deemaalhayat.com/catalog-hub`

يتطلب السيرفر إعداد:
```
CURSOR_API_KEY=crsr_...
CURSOR_MODEL=composer-2.5
```

لتغيير العناوين عند البناء:

```bash
flutter run --dart-define=API_BASE_URL=https://YOUR_HOST/api/v1 --dart-define=CATALOG_HUB_URL=https://YOUR_HOST/catalog-hub
```

## بناء APK

```bash
flutter build apk --release
```

الملف: `build/app/outputs/flutter-apk/app-release.apk`
