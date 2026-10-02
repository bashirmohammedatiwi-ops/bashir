# دليل البوت — إضافة منتجات ديمة الحياة بسرعة (API)

هذا الملف موجّه لبوت (مثل Grok) يعمل عبر شبكة/بروكسي. **لا تستخدم واجهة الفورم اليدوية** (كل منتج 4–5 دقائق). استخدم الـ API أدناه: منتج واحد = طلب واحد، مع صور المنتج وتدرجاتها.

---

## 0) السياق والمشكلة المعروفة

- الموقع الرئيسي: `https://deemaalhayat.com`
- لوحة التحكم: `https://deemaalhayat.com/admin/`
- اتصال البوت المباشر إلى السيرفر (`187.127.88.146` أو الدومين) غالباً **يفشل على TLS** بسبب بروكسي Cloudflare الخصوصي للجهاز.
- لذلك يُستخدم نفق عام يعمل عبر مسار سليم:

**Base URL المعتمد للبوت حالياً:**

```text
https://v3ajd7-ip-187-127-88-146.tunnelmole.net
```

كل المسارات أدناه تكون نسبةً لهذا الـ Base (أو نفس المسار على `https://deemaalhayat.com` إذا كان اتصالك إليه يعمل).

أمثلة:

| الغرض | المسار الكامل |
|--------|----------------|
| صحة الـ API | `GET {BASE}/api/v1/health` |
| دخول | `POST {BASE}/api/v1/auth/login` |
| إضافة سريعة | `POST {BASE}/api/v1/ai-product/quick-import` |
| لوحة (متصفح) | `{BASE}/admin/login/` |

إذا رجع النفق 404 أو انقطع، اطلب من المشغّل رابط النفق الجديد ثم حدّث `{BASE}`.

---

## 1) قواعد عامة (إلزامية)

1. **العمل بالـ API فقط** — لا تفتح صفحات HTML للملء اليدوي إلا للتشخيص.
2. **كل منتج يُحفظ مطفأ:** `"isActive": false` دائماً (لا يظهر في المتجر حتى المراجعة).
3. **صور المنتج إلزامية:** مصفوفة `imageUrls` برابط عام `https://...` (صورة واحدة على الأقل).
4. السيرفر يرفع الصور من الروابط بنفسه — لا ترفع ملفات multipart إلا إذا احتجت ذلك لسبب خاص.
5. الأسعار بالدينار العراقي كـ **عدد صحيح** (مثال: `45000` وليس `"45,000"`).
6. الباركود: أرقام/أحرف، طول تقريبي 6–32، بدون مسافات.
7. إذا فشل منتج: سجّل `barcode` + رسالة الخطأ، ثم **كمّل** بالمنتج التالي (لا تتوقف عن الدفعة كلها).
8. لا تنشئ منتجاً موجوداً مسبقاً بنفس الباركود — تحقق أولاً (انظر §5).
9. بعد كل دفعة (مثلاً كل 20–50 منتج) أرسل ملخصاً:
   - نجح / فشل / تخطي
   - قائمة باركودات الفشل مع السبب المختصر

---

## 2) المصادقة

### 2.1 تسجيل الدخول

```http
POST {BASE}/api/v1/auth/login
Content-Type: application/json
```

الجسم (بريد **أو** هاتف عراقي + كلمة مرور):

```json
{
  "email": "admin@example.com",
  "password": "********"
}
```

أو:

```json
{
  "phone": "07701234567",
  "password": "********"
}
```

### 2.2 شكل الرد المتوقع

الرد ملفوف عادةً داخل `data` (أو مباشرة). ابحث عن:

- `accessToken` (أو `access_token`)
- اختياراً `refreshToken`

استخدم في كل طلب محمي:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

### 2.3 انتهاء الجلسة

إذا حصلت على `401`:

1. أعد `POST /api/v1/auth/login`
2. حدّث الـ Bearer
3. أعد الطلب الفاشل مرة واحدة

اطلب بيانات الدخول من المشغّل إن لم تكن عندك.

---

## 3) الإضافة السريعة — `quick-import` (الأهم)

```http
POST {BASE}/api/v1/ai-product/quick-import
Authorization: Bearer <accessToken>
Content-Type: application/json
```

هذا الطلب:

- يرفع كل روابط `imageUrls` وصور التدرجات
- ينشئ المنتج + التدرجات
- يضبط `isActive` افتراضياً على `false` إن لم تُرسل

### 3.1 الحقول — المنتج

| الحقل | مطلوب؟ | الوصف |
|--------|---------|--------|
| `barcode` | نعم | باركود المنتج الأساسي |
| `nameAr` | واحد من الاسمين على الأقل | الاسم بالعربي |
| `nameEn` | واحد من الاسمين على الأقل | الاسم بالإنكليزي |
| `imageUrls` | نعم | مصفوفة روابط صور المنتج (1–12) |
| `brand` **أو** `brandId` | نعم | اسم براند مطابق للكتالوج أو UUID |
| `category` **أو** `categoryId` | نعم | اسم القسم الرئيسي أو UUID |
| `subcategory` | لا | نص؛ أقسام فرعية متعددة مفصولة بـ `،` أو `,` |
| `subcategoryIds` | لا | بديل: مصفوفة UUID |
| `tertiary` | لا | نص للأقسام الثانوية |
| `tertiaryCategoryIds` | لا | بديل: مصفوفة UUID |
| `descriptionAr` | لا | وصف عربي |
| `descriptionEn` | لا | وصف إنكليزي |
| `sku` | لا | افتراضي: `AI-{barcode}` |
| `price` | لا | سعر افتراضي للمنتج (عدد صحيح) |
| `originalPrice` | لا | السعر قبل الخصم |
| `discountPercent` | لا | 0–100 |
| `stock` | لا | مخزون المنتج (بدون تدرجات) |
| `isActive` | لا | **أرسل دائماً `false`** |
| `shades` | لا | مصفوفة تدرجات (انظر §3.2) |

### 3.2 الحقول — كل تدرج داخل `shades[]`

| الحقل | مطلوب؟ | الوصف |
|--------|---------|--------|
| `name` | نعم | اسم/رقم التدرج (مثل `999`) |
| `nameAr` / `nameEn` | لا | إن وُجدت تُستخدم للعرض |
| `colorHex` | لا | مثل `#8B0000` (افتراضي رمادي إن نقص) |
| `barcode` | لا | باركود خاص بالتدرج |
| `imageUrl` | لا | رابط صورة التدرج (يُرفع تلقائياً) |
| `price` | لا | سعر التدرج |
| `originalPrice` | لا | |
| `discountPercent` | لا | 0–100 |
| `stock` | لا | مخزون التدرج |
| `position` | لا | ترتيب العرض (0, 1, 2…) |

حد أقصى تقريبي: 80 تدرج، 12 صورة منتج.

---

## 4) أمثلة جاهزة للنسخ

### 4.1 منتج بدون تدرجات

```json
{
  "barcode": "6294015173116",
  "nameAr": "كريم مرطب للوجه",
  "nameEn": "Face Moisturizer Cream",
  "brand": "La Roche-Posay",
  "category": "عناية بالبشرة",
  "subcategory": "المرطبات",
  "descriptionAr": "وصف عربي مختصر ودقيق.",
  "descriptionEn": "Short accurate English description.",
  "imageUrls": [
    "https://cdn.example.com/products/6294015173116-1.jpg",
    "https://cdn.example.com/products/6294015173116-2.jpg"
  ],
  "price": 25000,
  "stock": 5,
  "isActive": false
}
```

### 4.2 منتج مع تدرجات + صور تدرجات + باركود لكل تدرج

```json
{
  "barcode": "3605972255594",
  "nameAr": "أحمر شفاه سائل",
  "nameEn": "Liquid Lipstick",
  "brand": "Dior",
  "category": "مكياج",
  "subcategory": "الشفاه",
  "tertiary": "أحمر شفاه",
  "descriptionAr": "أحمر شفاه سائل بثبات عالٍ.",
  "descriptionEn": "Long-wear liquid lipstick.",
  "imageUrls": [
    "https://cdn.example.com/dior/lipstick-main.jpg"
  ],
  "shades": [
    {
      "name": "999",
      "nameAr": "999",
      "nameEn": "999",
      "colorHex": "#8B0000",
      "barcode": "3605972255600",
      "imageUrl": "https://cdn.example.com/dior/shade-999.jpg",
      "price": 45000,
      "stock": 3,
      "position": 0
    },
    {
      "name": "772",
      "nameAr": "772",
      "nameEn": "772",
      "colorHex": "#C41E3A",
      "barcode": "3605972255617",
      "imageUrl": "https://cdn.example.com/dior/shade-772.jpg",
      "price": 45000,
      "stock": 2,
      "position": 1
    }
  ],
  "isActive": false
}
```

### 4.3 مثال curl

```bash
BASE="https://v3ajd7-ip-187-127-88-146.tunnelmole.net"
TOKEN="...."   # من login

curl -sS -X POST "$BASE/api/v1/ai-product/quick-import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "6294015173116",
    "nameAr": "مثال",
    "nameEn": "Example",
    "brand": "Brand Name",
    "category": "مكياج",
    "imageUrls": ["https://example.com/a.jpg"],
    "isActive": false
  }'
```

### 4.4 رد النجاح المتوقع (تقريبي)

```json
{
  "data": {
    "id": "uuid-...",
    "barcode": "6294015173116",
    "name": "...",
    "isActive": false,
    "imageCount": 2,
    "shadeCount": 0
  }
}
```

أو بدون غلاف `data` — اقبل الشكلين.

---

## 5) فحص الباركود من POS — نفس زر «جلب» بالفورم

هذا **المسار الرسمي** الذي تستخدمه لوحة التحكم عند الضغط على زر **جلب** بجانب الباركود (سعر + كمية + اسم من مزامنة POS).

### 5.1 جلب سجل POS لباركود واحد (مثل زر جلب)

```http
GET {BASE}/api/v1/sync/inventory/by-barcode/{barcode}
Authorization: Bearer <accessToken>
```

مثال:

```http
GET {BASE}/api/v1/sync/inventory/by-barcode/6294015173116
Authorization: Bearer <TOKEN>
```

**رد ناجح (200)** — تقريباً:

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
    "syncedAt": "2026-09-27T12:00:00.000Z",
    "productId": null,
    "productName": null
  }
}
```

معاني الحقول المهمة:

| حقل | معنى |
|-----|------|
| `price` / `originalPrice` / `discountPercent` / `stock` | من آخر مزامنة POS |
| `name` | اسم الصنف في POS (إن وُجد) |
| `productId` | إن لم يكن `null` → الباركود مربوط بمنتج موجود بالتطبيق أصلاً |
| `productName` | اسم المنتج بالتطبيق إن كان مربوطاً |

**رد 404** مع رسالة مثل `No synced inventory for this barcode`:

- الباركود **غير موجود** في جدول مزامنة المخزون (POS) عندنا.
- هذا لا يعني بالضرورة أن الصنف غير موجود في المحل فعلياً — يعني فقط **ما متزامن** عند الـ API.
- قرار الإضافة: إما تتخطاه، أو تضيفه بأسعار/مخزون 0 وتترك المراجعة للمشغّل. **لا تخترع أسعاراً من عندك.**

جرّب أيضاً صيغ الباركود البديلة إن فشل الأول (إزالة أصفار بادئة / إضافة صفر إن الطول 12 بدل 13) — نفس ما يفعله الفورم داخلياً.

### 5.2 فحص دفعة باركودات (أسرع للقوائم)

```http
POST {BASE}/api/v1/sync/inventory/lookup-barcodes
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "barcodes": ["6294015173116", "3605972255600", "6294015173093"]
}
```

الرد تقريباً:

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

- `pos != null` → موجود بمزامنة POS (نفس مصدر زر جلب).
- `inApp != null` → موجود كتالوج التطبيق أصلاً → **لا تعِد الإضافة**.
- كلاهما `null` → لا POS متزامن ولا منتج بالتطبيق.

### 5.3 هل الباركود موجود بالكتالوج فقط؟

```http
GET {BASE}/api/v1/products/barcode-check?barcode=6294015173116
Authorization: Bearer <accessToken>
```

استخدمه لتأكيد الوجود في التطبيق؛ لفحص السعر/المخزون استخدم §5.1 أو §5.2.

### 5.4 صحة الـ API

```http
GET {BASE}/api/v1/health
```

يجب أن يرجع حالة ok / 200.

### 5.5 سير عمل موصى به قبل أي إضافة

1. سجّل دخول → Bearer.
2. اختبر مسار جلب واحد معروف يعمل (اطلب من المشغّل باركود تجريبي إن لزم).
3. على قائمة الباركودات المراد إضافتها: `POST lookup-barcodes`.
4. صنّف النتائج:
   - `inApp` موجود → تخطَّ (موجود).
   - `pos` موجود و`inApp` فارغ → مرشّح للإضافة؛ خذ `price/originalPrice/discountPercent/stock` من `pos` وضعها في `quick-import` (وعلى مستوى التدرج إن كان باركود تدرج).
   - لا `pos` ولا `inApp` → سجّل «غير متزامن في POS» ولا تضف بأسعار عشوائية إلا بأمر صريح من المشغّل.
5. أول ما تعرف العدد النهائي المرشّح للإضافة → بلّغ المشغّل بالعدد.
6. نفّذ `quick-import` فقط على المرشّحين، ثم أرسل تقرير النهاية.

---

## 6) مساعدة اختيارية قبل `quick-import`

استخدمها إذا عندك باركود فقط وتحتاج أسماء/صور مرشّحة، ثم ابنِ جسم `quick-import` بنفسك.

### 6.1 بحث صور بالباركود

```http
POST {BASE}/api/v1/ai-product/images
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "barcode": "6294015173116",
  "mode": "barcode"
}
```

أو بالاسم:

```json
{
  "barcode": "6294015173116",
  "mode": "name",
  "query": "Dior lipstick 999",
  "nameHint": "Dior lipstick"
}
```

اختر أفضل روابط packshot حقيقية (ليست ملصق باركود)، وضعها في `imageUrls` / `shades[].imageUrl`.

### 6.2 تعبئة أسماء وتصنيف بالذكاء

```http
POST {BASE}/api/v1/ai-product/autofill
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "barcode": "6294015173116",
  "hint": "اختياري"
}
```

مهلة طويلة محتملة (حتى ~180 ثانية). بعدها انقل الأسماء/الأوصاف/التصنيف إلى `quick-import` مع الصور التي اخترتها.

**مهم:** `autofill` وحده لا يحفظ المنتج. الحفظ فقط عبر `quick-import` (أو واجهة الأدمن).

---

## 7) جلب أسماء البراندات والأقسام (لمطابقة أدق)

عند الشك في الاسم المطابق:

```http
GET {BASE}/api/v1/brands?all=1
Authorization: Bearer <accessToken>
```

```http
GET {BASE}/api/v1/categories?all=1
Authorization: Bearer <accessToken>
```

```http
GET {BASE}/api/v1/subcategories?all=1&parentId=<categoryId>
Authorization: Bearer <accessToken>
```

```http
GET {BASE}/api/v1/tertiary-sections?all=1&parentId=<subcategoryId>
Authorization: Bearer <accessToken>
```

(إن اختلف اسم مسار الأقسام الثانوية، جرّب ما يظهر في لوحة الأدمن تحت Network؛ المهم مطابقة الأسماء العربية الموجودة.)

يمكن إرسال الأسماء كنص في `brand` / `category` / `subcategory` / `tertiary` والسيرفر يحاول المطابقة، أو إرسال الـ UUID مباشرة (`brandId`, `categoryId`, …).

---

## 8) سير العمل المقترح للبوت (سريع ومنظّم)

لكل منتج متبقٍّ في قائمتك:

1. طبّع الباركود (أرقام فقط إن أمكن).
2. `barcode-check` → إن موجود: تخطَّ.
3. اجمع البيانات:
   - أسماء عربي/إنكليزي
   - براند + أقسام
   - روابط صور المنتج (عامة)
   - إن وُجدت تدرجات: اسم، لون hex، باركود تدرج، صورة تدرج، سعر، مخزون
4. (اختياري) `images` / `autofill` لإكمال النواقص.
5. `POST quick-import` مع `"isActive": false`.
6. سجّل النتيجة (نجاح + `id` أو فشل + رسالة).
7. انتقل فوراً للتالي — لا تنتظر تأكيداً بشرياً بين كل منتج.

للدفعات الكبيرة: عالج بالتسلسل أو بتوازي خفيف (2–3 معاً كحد أقصى) حتى لا تضغط رفع الصور.

---

## 9) أخطاء شائعة وماذا تفعل

| العرض | السبب المحتمل | العلاج |
|--------|----------------|--------|
| TLS ينقطع / handshake | اتصال مباشر للدومين من بروكسي الجهاز | استخدم `{BASE}` نفق tunnelmole فقط |
| `Not allowed by CORS` | طلب من متصفح بأصل غير مسموح | للبوت استخدم طلبات HTTP من السكربت/CLI وليس قيود متصفح؛ النفق مضاف مسبقاً |
| `401` | توكن منتهٍ | أعد login |
| `brandId أو brand مطلوب` | اسم براند غير مطابق | اجلب `/brands` واستخدم الاسم الحرفي |
| `categoryId أو category مطلوب` | قسم غير مطابق | اجلب `/categories` |
| `imageUrls مطلوب` | نسيت الصور | أضف رابط https واحد على الأقل |
| `تعذّر رفع صور المنتج` | روابط ميتة/محجوبة | بدّل بروابط عامة مباشرة للملف (jpg/png/webp) |
| باركود مكرر / تعارض فريد | المنتج موجود | تخطَّ أو حدّث يدوياً لاحقاً |
| `404` على النفق | النفق تغيّر بعد إعادة تشغيل | اطلب Base URL جديد من المشغّل |
| `500` على `/admin/...` | مشكلة ملفات اللوحة | لا توقف الإضافة بالـ API؛ بلّغ المشغّل |

---

## 10) ما لا تفعله

- لا تضبط `"isActive": true` إلا إذا طلب المشغّل صراحةً.
- لا تستخدم روابط صفحة ويب (HTML) كصورة — لازم رابط ملف صورة مباشر.
- لا تلصق باركود التدرج كباركود المنتج الأساسي إذا كان للمنتج باركود أب منفصل؛ الأب في `barcode` والأبناء في `shades[].barcode`.
- لا تعتمد على `trycloudflare.com` (غالباً محجوب بسياسة الجهاز).
- لا تملأ الفورم حقلاً حقلاً في المتصفح إلا كحل أخير لمنتج واحد عالق.

---

## 11) قالب تقرير نهاية الدفعة (أرسله للمشغّل)

```text
الدفعة: <اسم/رقم>
الوقت: <...>
Base: https://v3ajd7-ip-187-127-88-146.tunnelmole.net

الإجمالي المحاول: N
نجح: N
تخطي (موجود): N
فشل: N

فاشل:
- 6294... → <رسالة>
- 3605... → <رسالة>

ملاحظات:
- ...
```

---

## 12) ملخص أوامر للبوت (نسخة قصيرة)

```text
BASE = https://v3ajd7-ip-187-127-88-146.tunnelmole.net
1) POST /api/v1/auth/login  → Bearer token
2) لكل منتج:
   - اختياري: GET /api/v1/products/barcode-check?barcode=...
   - اختياري: POST /api/v1/ai-product/images أو /autofill
   - POST /api/v1/ai-product/quick-import
     مع: barcode, nameAr/nameEn, brand, category, imageUrls[], shades[]?, isActive:false
3) سجّل النتائج وكمل بدون توقف
```

---

## 13) بيانات يجب أن equipك بها المشغّل قبل البدء

اطلب إن نقص عندك:

1. إيميل/هاتف أدمن + كلمة المرور  
2. تأكيد أن Base URL للنفق لا يزال يعمل  
3. قائمة المنتجات المتبقية: باركود، أسماء، براند، أقسام، روابط صور، تدرجات (إن وجدت)  
4. أي قواعد تسمية خاصة بالبراندات

بعدها ابدأ بالإضافة فوراً عبر `quick-import`.

---

*آخر تحديث تشغيلي: نفق Tunnelmole + endpoint `POST /api/v1/ai-product/quick-import` مع رفع الصور والتدرجات وحفظ غير نشط.*
