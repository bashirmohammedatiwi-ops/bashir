# مزامنة مخزون POS → السيرفر

## ما تم إنجازه

| المكوّن | المسار |
|---------|--------|
| تطبيق سطح المكتب | `pos-sync-desktop/` |
| مثبت Windows | `pos-sync-desktop/release/Alhayaa-POSSync-Setup-1.0.0.exe` |
| API المزامنة | `backend/src/modules/sync/` |
| لوحة التحكم (جلب بالباركود) | `admin-desktop/` |

## قاعدة البيانات المحلية (تم اكتشافها واختبارها)

- **السيرفر:** `localhost\FOTSQLSERVER`
- **قاعدة البيانات:** `HAYAT2025.mdf`
- **منتجات بباركود:** 35,857
- **اتصال Windows Auth:** عبر `sqlcmd` (مدمج في Windows)

## 1) نشر التحديث على VPS

```bash
cd infra
docker compose -f docker-compose.prod.yml up -d --build api
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

## 2) تشغيل POS Sync

```
pos-sync-desktop\release\Alhayaa-POSSync-Setup-1.0.0.exe
```

اضغط **مزامنة الآن** فقط — لا حاجة لرمز أو تسجيل دخول.

الإعدادات (SQL Server، عنوان API) مُعبّأة مسبقاً ويمكن تغييرها من **إعدادات متقدمة**.

## 3) لوحة التحكم

عند إضافة منتج → أدخل **الباركود** → تُملأ الأسعار والكمية تلقائياً من بيانات المزامنة.

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/sync/inventory/bulk` | بدون (زر المزامنة فقط) |
| GET | `/api/v1/sync/inventory/by-barcode/:barcode` | JWT (admin) |
