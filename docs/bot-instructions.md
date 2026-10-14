# دليل البوت — ديمة الحياة (API)

هذا الملف التعليمات الرئيسي لبوت يعمل على متجر **ديمة الحياة**.  
اعمل **بالـ API فقط** — لا تستخدم فورمات لوحة التحكم اليدوية.

---

## 1) الاتصال

| | |
|---|---|
| الموقع | `https://deemaalhayat.com` |
| لوحة التحكم | `https://deemaalhayat.com/admin/` |
| **Base URL للبوت** | `https://igmbzc-ip-187-127-88-146.tunnelmole.net` |

> **مهم:** اتصال البوت المباشر للدومين غالباً يفشل على TLS. استخدم **النفق** أعلاه.  
> إذا رجع النفق `404` أو انقطع، اطلب من المشغّل الرابط الجديد عبر:
> `ssh root@187.127.88.146 '~/alhayaa/infra/scripts/show-bot-tunnel.sh'`

كل المسارات أدناه نسبةً إلى `{BASE}/api/v1`.

الردود ملفوفة عادةً داخل `{ "data": ... }` — اقرأ `data`.

### صحة الـ API

```http
GET {BASE}/api/v1/health
```

---

## 2) تسجيل الدخول

```http
POST {BASE}/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@alhayaa.com",
  "password": "000000"
}
```

من الرد خذ `data.accessToken`. استخدمه في كل طلب محمي:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

### إذا حصلت على 401

1. أعد `POST /auth/login`
2. حدّث الـ Bearer
3. أعد الطلب الفاشل مرة واحدة

**لا تطبع كلمة المرور ولا التوكن في الملخص النهائي.**

---

## 3) قراءة بيانات POS (آخر تحديث)

بيانات POS تُخزَّن على السيرفر بعد مزامنة تطبيق `pos-sync-desktop`.  
هذه المسارات **للقراءة فقط** — البوت لا يرفع مزامنة POS.

### 3.1 هل المزامنة حديثة؟

```http
GET {BASE}/api/v1/sync/inventory/overview
Authorization: Bearer <TOKEN>
```

| حقل | معنى |
|-----|------|
| `snapshots.lastSyncedAt` | وقت آخر تحديث POS على السيرفر |
| `snapshots.total` | عدد الأصناف المتزامنة |
| `posSync` | تفاصيل آخر جلسة مزامنة (يدوية/تلقائية، نجاح/فشل) |

**سجل المزامنات:**

```http
GET {BASE}/api/v1/sync/inventory/runs?page=1&limit=20
Authorization: Bearer <TOKEN>
```

### 3.2 باركود واحد (مثل زر «جلب» في لوحة التحكم)

```http
GET {BASE}/api/v1/sync/inventory/by-barcode/{barcode}
Authorization: Bearer <TOKEN>
```

**مثال:**

```http
GET {BASE}/api/v1/sync/inventory/by-barcode/6294015173116
```

**رد ناجح (200):**

```json
{
  "data": {
    "barcode": "6294015173116",
    "productCode": "...",
    "productNum": "...",
    "name": "اسم من POS",
    "price": 25000,
    "originalPrice": 30000,
    "discountPercent": 17,
    "stock": 4,
    "offerName": null,
    "syncedAt": "2026-10-02T18:00:00.000Z",
    "productId": null,
    "productName": null
  }
}
```

| حقل | معنى |
|-----|------|
| `price` / `originalPrice` / `discountPercent` / `stock` | آخر سعر ومخزون من POS |
| `syncedAt` | وقت آخر تحديث لهذا الباركود |
| `productId` | إن وُجد → مربوط بمنتج في التطبيق |
| `productName` | اسم المنتج في التطبيق إن كان مربوطاً |

**404** = الباركود غير موجود في مزامنة POS (لم يُرفع بعد من تطبيق المزامنة).

### 3.3 دفعة باركودات (أسرع)

```http
POST {BASE}/api/v1/sync/inventory/lookup-barcodes
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "barcodes": ["6294015173116", "3605972255600", "6294015173093"]
}
```

**رد تقريبي:**

```json
{
  "data": {
    "items": {
      "6294015173116": {
        "barcode": "6294015173116",
        "pos": {
          "price": 25000,
          "originalPrice": 30000,
          "discountPercent": 17,
          "stock": 4,
          "name": "...",
          "offerName": null,
          "syncedAt": "..."
        },
        "inApp": null
      },
      "3605972255600": {
        "barcode": "3605972255600",
        "pos": null,
        "inApp": { "id": "uuid...", "name": "منتج موجود" }
      }
    }
  }
}
```

**قواعد التفسير:**

| النتيجة | ماذا تفعل |
|---------|-----------|
| `pos != null` | موجود في POS — استخدم `price/stock/syncedAt` منه |
| `inApp != null` | موجود في كتالوج التطبيق — **لا تعِد الإضافة** |
| كلاهما `null` | غير متزامن في POS وغير موجود بالتطبيق |

### 3.4 تصدير كل باركودات POS (صفحات)

```http
GET {BASE}/api/v1/sync/inventory/snapshots?barcodesOnly=true&page=1&limit=1000
Authorization: Bearer <TOKEN>
```

**رد تقريبي:**

```json
{
  "data": {
    "barcodes": ["6294015173116", "3605972255600"],
    "meta": {
      "total": 8420,
      "page": 1,
      "limit": 1000,
      "totalPages": 9,
      "hasNext": true,
      "lastSyncedAt": "2026-10-02T18:00:00.000Z"
    }
  }
}
```

كرّر الطلب بزيادة `page` حتى `hasNext` يصير `false`.

**تصدير كامل مع السعر والمخزون (بدون barcodesOnly):**

```http
GET {BASE}/api/v1/sync/inventory/snapshots?page=1&limit=500
Authorization: Bearer <TOKEN>
```

يمكن أيضاً `search=اسم أو باركود` لتصفية النتائج.

---

## 4) فحص الكتالوج قبل الإضافة

### هل الباركود موجود بالتطبيق؟

```http
GET {BASE}/api/v1/products/barcode-check?barcode=6294015173116
Authorization: Bearer <TOKEN>
```

### جلب البراندات والأقسام

```http
GET {BASE}/api/v1/brands
GET {BASE}/api/v1/categories?all=1
Authorization: Bearer <TOKEN>
```

استخدم **الأسماء الحرفية** الموجودة في الكتالوج — لا تخترع أسماء براندات أو أقسام.

---

## 5) إضافة منتج سريعة — `quick-import`

```http
POST {BASE}/api/v1/ai-product/quick-import
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### قواعد إلزامية

1. **كل منتج يُحفظ مطفأ:** `"isActive": false` دائماً.
2. **صور المنتج إلزامية:** `imageUrls` برابط `https://` (صورة واحدة على الأقل).
3. الأسعار بالدينار العراقي كـ **عدد صحيح** (`45000` وليس `"45,000"`).
4. الباركود: 6–32 حرفاً، بدون مسافات.
5. إذا فشل منتج: سجّل `barcode` + السبب، ثم **كمّل** بالتالي.
6. **لا تخترع أسعاراً** — خذها من `pos` إن وُجدت.

### الحقول الأساسية

| الحقل | مطلوب؟ | الوصف |
|--------|---------|--------|
| `barcode` | نعم | باركود المنتج |
| `nameAr` / `nameEn` | واحد على الأقل | الاسم |
| `imageUrls` | نعم | روابط صور (1–12) |
| `brand` أو `brandId` | نعم | براند من الكتالوج |
| `category` أو `categoryId` | نعم | قسم رئيسي |
| `price` / `stock` | لا | من POS إن وُجد |
| `isActive` | لا | **أرسل `false` دائماً** |
| `shades[]` | لا | تدرجات (كل تدرج: `name` + `barcode` + `price` + `stock`) |

### مثال منتج بسيط

```json
{
  "barcode": "6294015173116",
  "nameAr": "كريم مرطب للوجه",
  "nameEn": "Face Moisturizer Cream",
  "brand": "La Roche-Posay",
  "category": "عناية بالبشرة",
  "imageUrls": ["https://cdn.example.com/product.jpg"],
  "price": 25000,
  "originalPrice": 30000,
  "discountPercent": 17,
  "stock": 4,
  "isActive": false
}
```

> التفاصيل الكاملة والأمثلة المتقدمة: [`docs/bot-quick-product-import.md`](./bot-quick-product-import.md)

---

## 6) سير العمل الموصى به

### أ) إضافة منتجات من POS

```
1. POST /auth/login  →  Bearer token
2. GET  /sync/inventory/overview  →  تأكد أن lastSyncedAt حديث
3. GET  /sync/inventory/snapshots?barcodesOnly=true  →  اجمع كل الباركودات (صفحات)
4. POST /sync/inventory/lookup-barcodes  →  فحص قائمة الباركودات (اختياري للتفاصيل)
4. صنّف النتائج:
     - inApp موجود        → تخطَّ
     - pos موجود فقط      → مرشّح للإضافة (خذ السعر/المخزون من pos)
     - لا pos ولا inApp   → سجّل «غير متزامن» ولا تخترع أسعاراً
5. GET /products/barcode-check  →  تأكيد إضافي إن لزم
6. POST /ai-product/quick-import  →  لكل مرشّح
7. أرسل ملخصاً: نجح / فشل / تخطي + باركودات الفشل
```

### ب) تنسيق صفحات العوالم

راجع [`docs/bot-worlds-home.md`](./bot-worlds-home.md).

---

## 7) مسارات سريعة (مرجع)

| الغرض | المسار |
|--------|--------|
| صحة API | `GET /health` |
| دخول | `POST /auth/login` |
| آخر مزامنة POS | `GET /sync/inventory/overview` |
| POS لباركود | `GET /sync/inventory/by-barcode/{barcode}` |
| تصدير باركودات POS | `GET /sync/inventory/snapshots?barcodesOnly=true` |
| POS لدفعة | `POST /sync/inventory/lookup-barcodes` |
| فحص كتالوج | `GET /products/barcode-check?barcode=...` |
| إضافة منتج | `POST /ai-product/quick-import` |
| البراندات | `GET /brands` |
| الأقسام | `GET /categories?all=1` |
| صور بالباركود (اختياري) | `POST /ai-product/images` |

---

## 8) أخطاء شائعة

| المشكلة | السبب | الحل |
|---------|--------|------|
| TLS / handshake | اتصال مباشر للدومين من بروكسي الجهاز | استخدم نفق tunnelmole |
| `401` | توكن منتهٍ | أعد login |
| `404` على POS | الباركود غير متزامن | انتظر مزامنة POS أو تخطَّ |
| `brandId أو brand مطلوب` | براند غير مطابق | `GET /brands` واستخدم الاسم الحرفي |
| `Not allowed by CORS` | طلب من متصفح | استخدم HTTP من سكربت/CLI |
| النفق 404 | انتهى رابط tunnelmole | اطلب رابطاً جديداً من المشغّل |

---

## 9) ملخص أوامر للنسخ

```text
BASE = https://igmbzc-ip-187-127-88-146.tunnelmole.net

1) POST {BASE}/api/v1/auth/login
   body: { "email": "admin@alhayaa.com", "password": "000000" }

2) GET  {BASE}/api/v1/sync/inventory/overview
   header: Authorization: Bearer <token>

3) GET  {BASE}/api/v1/sync/inventory/by-barcode/<barcode>
   header: Authorization: Bearer <token>

4) GET  {BASE}/api/v1/sync/inventory/snapshots?barcodesOnly=true&page=1&limit=1000
   (كرّر الصفحات حتى hasNext=false)

5) POST {BASE}/api/v1/sync/inventory/lookup-barcodes
   body: { "barcodes": ["...", "..."] }

6) POST {BASE}/api/v1/ai-product/quick-import
   body: { barcode, nameAr, nameEn, brand, category, imageUrls[], isActive:false, ... }
```

---

## 10) ملفات تفصيلية

| الملف | المحتوى |
|-------|---------|
| [`bot-quick-product-import.md`](./bot-quick-product-import.md) | إضافة المنتجات — حقول كاملة وأمثلة |
| [`bot-worlds-home.md`](./bot-worlds-home.md) | تنسيق صفحات العوالم والبنرات |
| [`POS-SYNC.md`](./POS-SYNC.md) | تطبيق مزامنة POS (للمشغّل، ليس للبوت) |
