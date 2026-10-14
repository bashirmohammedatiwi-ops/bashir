# الدفع بالبطاقة — بوابة كي كارد (QiCard)

## كيف يعمل

1. الزبونة تختار «الدفع بالبطاقة» وتؤكد الطلب ← يُنشأ الطلب (`paymentMethod = CARD`, `paymentStatus = PENDING`).
2. التطبيق يطلب `POST /payments/orders/:id/start` ← السيرفر ينشئ الدفعة لدى البوابة (`appChannel: true`) ويعيد `paymentId/requestId`.
3. واجهة كي كارد الأصلية (SDK) تعرض نموذج البطاقة و 3D Secure داخل التطبيق.
4. البوابة ترسل إشعاراً إلى `POST /api/v1/payments/qi/webhook`؛ السيرفر يتحقق من التوقيع ثم **يسأل البوابة مباشرة** عن الحالة (لا يثق بمحتوى الإشعار ولا بالتطبيق).
5. التطبيق يطلب `POST /payments/orders/:id/confirm` ليعرض النتيجة.

- الطلب غير المدفوع يُلغى تلقائياً بعد 45 دقيقة ويُعاد مخزونه.
- إلغاء طلب مدفوع (من الزبونة أو الإدارة) يلغي العملية لدى البوابة أو يسترجع المبلغ تلقائياً.
- لوحة التحكم ← الطلبات ← «الدفع الإلكتروني»: مزامنة، استرجاع (كامل/جزئي)، إلغاء.
- الإعدادات ← «الدفع بالبطاقة» لإخفاء الخيار من التطبيق.

## الأسرار (على السيرفر فقط)

`infra/.env`:

```
QI_BASE_URL=https://uat-sandbox-3ds-api.qi.iq/api/v1   # أو رابط الإنتاج من Qi
QI_TERMINAL_ID=...
QI_USERNAME=...
QI_PASSWORD=...
QI_CALLBACK_BASE_URL=https://deemaalhayat.com
QI_SANDBOX_TESTERS=email@example.com,07xxxxxxxxx   # بيئة الاختبار فقط
```

والمفتاح العام للبوابة: `infra/secrets/qi_pubkey.pem`.

التطبيق لا يحمل اسم المستخدم ولا كلمة المرور — يستلم من السيرفر رقم الطرفية والمفتاح العام فقط.
في بيئة الاختبار لا يظهر الدفع بالبطاقة إلا للإدارة ولمن في `QI_SANDBOX_TESTERS`.

## ملفات الحزمة (غير مرفوعة إلى git)

من `qicard-payment-sdk-flutter-example-v2.0.4.zip`:

| من الحزمة | إلى المشروع |
|---|---|
| `android/app/libs/payment-2.0.4.aar` | `mobile-app/android/app/libs/` |
| `android/app/libs/emv-3ds-sdk-1.1.6.aar` | `mobile-app/android/app/libs/` |
| `ios/payment_sdk.xcframework` | `mobile-app/ios/` |
| `ios/TdsSdkIos.xcframework` | `mobile-app/ios/` |

## عناوين الإنتاج المطلوبة من Qi

- notificationUrl: `https://deemaalhayat.com/api/v1/payments/qi/webhook`
- finishPaymentUrl: `https://deemaalhayat.com/api/v1/payments/qi/finish`
