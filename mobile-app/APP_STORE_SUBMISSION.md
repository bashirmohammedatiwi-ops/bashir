# رفع تطبيق iOS إلى App Store — دليل خطوة بخطوة

> **الإصدار:** 1.0.0 (Build 11) · **Bundle ID:** `com.deemaalhayat.app` · **Team:** `629ARMBUX8`

---

## ما تم إنجازه في المستودع (جاهز)

- [x] Bundle ID و Team ID في Xcode
- [x] Privacy Manifest (`PrivacyInfo.xcprivacy`) — بدون تتبع
- [x] تصريح التشفير (`ITSAppUsesNonExemptEncryption = false`)
- [x] صلاحية الكاميرا (عربي + إنجليزي)
- [x] حذف الحساب داخل التطبيق
- [x] COD فقط — لا In-App Purchase
- [x] Push معطّل في v1.0
- [x] روابط الخصوصية والشروط (عربي/إنجليزي)
- [x] Universal Links + AASA على السيرفر
- [x] `ExportOptions.plist` للرفع
- [x] أيقونة 1024×1024

---

## الخطوة 1 — Apple Developer (مرة واحدة)

1. افتح [developer.apple.com](https://developer.apple.com) وسجّل الدخول بحساب Team **629ARMBUX8**.
2. تأكد أن **Apple Developer Program** نشط (99$/سنة).
3. اذهب إلى **Certificates, Identifiers & Profiles → Identifiers**.
4. اختر أو أنشئ App ID: **`com.deemaalhayat.app`**.
5. فعّل Capability:
   - ✅ **Associated Domains** (للروابط العميقة)
   - ❌ **Push Notifications** — لا تفعّله في v1.0
6. احفظ.

---

## الخطوة 2 — App Store Connect (إنشاء التطبيق)

1. افتح [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. **My Apps → + → New App**.
3. املأ:
   | الحقل | القيمة |
   |-------|--------|
   | Platform | iOS |
   | Name | ديما الحياة |
   | Primary Language | Arabic |
   | Bundle ID | com.deemaalhayat.app |
   | SKU | deemaalhayat-ios-001 |
   | User Access | Full Access |

---

## الخطوة 3 — App Information

1. **Category:** Primary = **Shopping** (Secondary اختياري: Lifestyle).
2. **Privacy Policy URL:** `https://deemaalhayat.com/privacy/`
3. **Support URL:** `https://deemaalhayat.com` (أو صفحة دعم مخصصة).
4. **Content Rights:** أكّد أنك تملك حقوق المحتوى.

---

## الخطوة 4 — App Privacy (بيانات الخصوصية)

1. **Data Collection:** نعم — لكن **بدون Tracking**.
2. البيانات المجمّعة (Linked to User, App Functionality فقط):

   | النوع | الغرض |
   |-------|-------|
   | Name | App Functionality |
   | Email Address | App Functionality |
   | Phone Number | App Functionality |
   | Physical Address | App Functionality |
   | Purchase History | App Functionality |
   | User ID | App Functionality |

3. **Tracking:** No — لا تتبع بين التطبيقات/المواقع.

---

## الخطوة 5 — Pricing and Availability

1. **Price:** Free (مجاني).
2. **Availability:** اختر الدول (العراق + أي دولة أخرى تخدمها).

---

## الخطوة 6 — Age Rating

1. أكمل الاستبيان (Questionnaire).
2. لتطبيق تجميل/تسوق بدون محتوى للبالغين: عادة **4+** أو **12+** حسب الإجابات.
3. لا مقامرة، لا عنف، لا محتوى جنسي.

---

## الخطوة 7 — Version 1.0.0 — Metadata

### العربية
- **Name:** ديما الحياة
- **Subtitle:** (اختياري، ≤30 حرف) مثال: «تجميل وعناية»
- **Description:** وصف المتجر، المنتجات، الدفع عند الاستلام، اللغات.
- **Keywords:** تجميل, عناية, عطور, مكياج, تسوق (≤100 حرف، مفصولة بفاصلة)

### English (Localization → English)
- **Name:** deema alhayat
- **Description:** Store description in English.
- **Keywords:** beauty, makeup, skincare, perfume, shopping

### Screenshots (إلزامي)
- **iPhone 6.7"** (1290×2796 أو 2796×1290) — على الأقل 3–5 لقطات:
  1. الصفحة الرئيسية
  2. صفحة منتج
  3. السلة / الدفع
  4. حسابي
  5. (اختياري) مسح الباركود

> Tip: Simulator iPhone 15 Pro Max أو جهاز حقيقي → Cmd+S للقطة.

---

## الخطوة 8 — App Review Information

1. **Sign-in required:** Yes (للشراء).
2. **Demo account** — **مهم جداً:**
   - Phone: `07700000000`
   - Password: `Review2026`
   - تأكد أن الحساب يعمل: تسجيل دخول → تصفح → إضافة للسلة → طلب (COD) → حذف حساب (اختبار منفصل).
3. **Contact:** اسمك، هاتفك، `support@deemaalhayat.com`.
4. **Notes:**

```
Demo account: 07700000000 / Review2026
v1.0: Cash on delivery only — no in-app purchases.
Push notifications disabled. Browse without login; checkout requires sign-in.
Account deletion: Account → Delete Account (حسابي → حذف الحساب).
Camera used only for QR/barcode product scan.
Support: support@deemaalhayat.com
Privacy: https://deemaalhayat.com/privacy/
Terms: https://deemaalhayat.com/terms/
```

---

## الخطوة 9 — بناء ورفع IPA

### من Terminal (بعد `flutter pub get` و `pod install`):

```bash
cd mobile-app
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
```

الملف الناتج: `build/ios/ipa/*.ipa`

### أو من Xcode:
1. `open ios/Runner.xcworkspace`
2. Team: **629ARMBUX8** · Bundle: **com.deemaalhayat.app**
3. Any iOS Device (arm64) → **Product → Archive**
4. **Distribute App → App Store Connect → Upload**

### رفع IPA:

> **ملاحظة:** إذا ظهر `Error Downloading App Information` عند `flutter build ipa`، أنشئ التطبيق أولاً في App Store Connect (الخطوة 2)، ثم ارفع من **Xcode Organizer** أو **Transporter**.

- **Transporter** (من Mac App Store) — اسحب ملف `.ipa`
- أو من Xcode Organizer بعد Archive: **Window → Organizer → Distribute App**
- Archive محلي (إن وُجد): `build/ios/archive/Runner.xcarchive`
- سكربت: `./scripts/build-ios-release.sh`

انتظر **15–30 دقيقة** حتى يظهر Build في App Store Connect.

---

## الخطوة 10 — Export Compliance

عند ظهور Build:
1. **Does your app use encryption?** → **No** (أو Yes مع exempt — plist يحتوي `ITSAppUsesNonExemptEncryption = false`).

---

## الخطوة 11 — Submit for Review

1. في **Version 1.0.0** اختر Build **1.0.0 (11)**.
2. راجع كل الأقسام (أيقونات ✓ خضراء).
3. **Add for Review → Submit to App Review**.

---

## بعد الموافقة

1. يمكنك مشاركة رابط التطبيق من App Store Connect مع العملاء.
2. للتحديثات اللاحقة: ارفع build جديد (1.0.1+) بنفس خطوات Archive و Upload.

---

## Checklist سريع قبل الإرسال

- [ ] `https://deemaalhayat.com/privacy/` يفتح
- [ ] `https://deemaalhayat.com/terms/` يفتح
- [ ] حساب تجريبي يعمل
- [ ] لقطات 6.7" مرفوعة
- [ ] App Privacy مكتمل
- [ ] Build 1.0.0 (11) مرفوع ومعالج
- [ ] Associated Domains مفعّل على App ID

---

## دعم

- البريد: support@deemaalhayat.com
- مراجعة الكود: `mobile-app/README.md`
