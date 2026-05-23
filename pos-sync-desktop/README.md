# POS Sync Desktop

تطبيق سطح مكتب لمزامنة الأسعار والكميات من SQL Server المحلي إلى سيرفر Alhayaa.

## الإعداد

1. انسخ `config.example.json` أو شغّل `scripts/setup-pos-sync.ps1` — الإعدادات جاهزة مسبقاً.
2. شغّل التطبيق واضغط **مزامنة الآن**.

## التشغيل

```bash
cd pos-sync-desktop
npm install
npm run dev
```

## البناء (Windows)

```bash
npm run dist
```

## آلية العمل

- يقرأ من `dbo.articles` + العروض النشطة من `offer_details` / `offers`
- يحسب السعر النهائي والخصم حسب القواعد المحددة
- يرسل للسيرفر عبر `POST /sync/inventory/bulk` حسب الباركود
- المزامنة التلقائية كل N دقيقة + زر مزامنة يدوية
