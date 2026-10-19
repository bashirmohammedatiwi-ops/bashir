import 'package:alhayaa/core/l10n/locale_provider.dart';
import 'package:alhayaa/core/network/api_exception.dart';
import 'package:alhayaa/core/utils/friendly_error.dart';
import 'package:flutter_test/flutter_test.dart';

String ar(Object? e) => friendlyError(e, lang: 'ar');
String en(Object? e) => friendlyError(e, lang: 'en');

void main() {
  group('409 — حساب مسجّل مسبقاً', () {
    // نص السيرفر الفعلي عند تكرار الهاتف (auth.service.ts).
    const phone = ApiException('رقم الهاتف مستخدم في حساب آخر', 409);
    const email = ApiException('هذا البريد الإلكتروني مسجّل مسبقاً', 409);
    // بديل ApiService حين يصل 409 بلا رسالة.
    const other = ApiException('البيانات مستخدمة مسبقاً', 409);

    test('phone conflict says the phone is registered, not the email', () {
      expect(ar(phone), 'هذا الرقم مسجّل مسبقاً — سجّلي الدخول به');
      expect(en(phone), 'This phone is already registered — sign in instead');
      expect(isPhoneAlreadyRegisteredError(phone), isTrue);
      expect(isEmailAlreadyRegisteredError(phone), isFalse);
    });

    test('email conflict keeps the email copy', () {
      expect(ar(email), startsWith('هذا البريد الإلكتروني مسجّل مسبقاً'));
      expect(en(email), 'This email is already registered. Sign in or use another email.');
      expect(isEmailAlreadyRegisteredError(email), isTrue);
      expect(isPhoneAlreadyRegisteredError(email), isFalse);
    });

    test('any other conflict is a generic "account exists"', () {
      expect(ar(other), 'هذا الحساب موجود مسبقاً. سجّلي الدخول به.');
      expect(en(other), 'This account already exists. Sign in instead.');
      expect(isPhoneAlreadyRegisteredError(other), isFalse);
      expect(isEmailAlreadyRegisteredError(other), isFalse);
    });

    test('English conflict wording without a status is still detected', () {
      const e = ApiException('Phone already registered');
      expect(en(e), 'This phone is already registered — sign in instead');
      expect(isPhoneAlreadyRegisteredError(e), isTrue);
    });
  });

  group('401 / 403 — الحساب والجلسة', () {
    test('disabled account is not reported as a wrong password', () {
      const e = ApiException('تم تعطيل هذا الحساب', 401);
      expect(ar(e), 'تم تعطيل هذا الحساب. تواصلي مع الدعم.');
      expect(en(e), 'This account is disabled. Contact support.');
    });

    test('wrong phone or password', () {
      const e = ApiException('رقم الهاتف أو كلمة المرور غير صحيحة', 401);
      expect(ar(e), 'رقم الهاتف أو كلمة المرور غير صحيحة.');
      expect(en(e), 'Incorrect phone number or password.');
    });

    test('other 401s mean the session expired', () {
      for (final e in const [
        ApiException('Session expired', 401),
        ApiException('Unauthorized', 401),
        ApiException('انتهت الجلسة — سجّل الدخول ثم أعد المحاولة', 401),
      ]) {
        expect(ar(e), 'انتهت الجلسة — سجّلي الدخول مجدداً', reason: e.message);
        expect(en(e), 'Session expired — please sign in', reason: e.message);
      }
    });

    test('wrong current password (400 + WRONG_CURRENT_PASSWORD)', () {
      const e = ApiException('كلمة المرور الحالية غير صحيحة', 400);
      expect(ar(e), 'كلمة المرور الحالية غير صحيحة');
      expect(en(e), 'Current password is incorrect');
    });

    test('a plain 403 is a permission error, not a disabled account', () {
      const e = ApiException('غير مسموح بهذا الإجراء', 403);
      expect(ar(e), 'غير مسموح بهذا الإجراء');
      expect(en(e), "You're not allowed to do this");
    });
  });

  group('رسائل الطلب الإنجليزية من السيرفر', () {
    test('out of stock keeps the product name', () {
      const e = ApiException('Out of stock: Dior Rouge 999', 400);
      expect(ar(e), 'نفدت الكمية: Dior Rouge 999');
      expect(en(e), 'Out of stock: Dior Rouge 999');
    });

    test('shade required', () {
      const e = ApiException('Shade required: Fenty Gloss', 400);
      expect(ar(e), 'اختاري اللون لـ«Fenty Gloss»');
      expect(en(e), 'Choose a shade for “Fenty Gloss”');
    });

    test('coupon and empty-order messages', () {
      expect(ar(const ApiException('Minimum order not met', 400)), 'لم يبلغ طلبكِ الحد الأدنى لهذا الكوبون.');
      expect(ar(const ApiException('Coupon valid for first order only', 400)), 'هذا الكوبون لأول طلب فقط.');
      expect(ar(const ApiException('Invalid coupon', 400)), 'كود الخصم غير صالح أو منتهي.');
      expect(ar(const ApiException('Empty order', 400)), 'سلتكِ فارغة — أضيفي منتجات أولاً.');
      expect(en(const ApiException('Invalid coupon', 400)), 'Invalid or expired coupon.');
    });

    test('a product name containing "phone" is not a phone error', () {
      const e = ApiException('Out of stock: Headphone Case', 400);
      expect(ar(e), 'نفدت الكمية: Headphone Case');
    });
  });

  group('لغة الواجهة', () {
    test('known Arabic server messages are translated for English', () {
      expect(en(const ApiException('انتهت صلاحية الكوبون', 400)), 'This coupon has expired.');
      expect(
        en(const ApiException('«سيروم فيتامين سي» غير متوفر حالياً — احذفيه من السلة', 400)),
        '“سيروم فيتامين سي” is unavailable right now — remove it from your bag.',
      );
    });

    test('a specific Arabic message beats the status guess', () {
      // تأتي 503 من السيرفر، ونصها أوضح من «الخادم مشغول».
      const e = ApiException('الدفع الإلكتروني غير متاح حالياً', 503);
      expect(ar(e), 'الدفع الإلكتروني غير متاح حالياً');
      expect(en(e), "Card payment isn't available right now.");
    });

    test('the address-completion message is not mistaken for a phone error', () {
      const e = ApiException('أكملي اسم المستلمة ورقم الهاتف والمحافظة', 400);
      expect(ar(e), 'أكملي اسم المستلمة ورقم الهاتف والمحافظة');
      expect(en(e), "Complete the recipient's name, phone number and governorate.");
    });

    test('unknown Arabic text: shown in Arabic, generic in English', () {
      const e = ApiException('رسالة جديدة من السيرفر', 400);
      expect(ar(e), 'رسالة جديدة من السيرفر');
      expect(en(e), 'Something went wrong. Please try again.');
    });

    test('unknown English text: shown in English, generic in Arabic', () {
      const e = ApiException('Something unusual happened', 400);
      expect(en(e), 'Something unusual happened');
      expect(ar(e), 'حدث خطأ. حاولي مجدداً.');
    });

    test('defaults to the current app language', () {
      addTearDown(() => AppLocale.current = 'ar');
      const e = ApiException('غير موجود', 404);
      AppLocale.current = 'en';
      expect(friendlyError(e), 'Content is not available right now.');
      AppLocale.current = 'ar';
      expect(friendlyError(e), 'المحتوى غير متوفر حالياً.');
    });

    test('an already-friendly message switches language and stays stable', () {
      for (final e in const [
        ApiException('رقم الهاتف مستخدم في حساب آخر', 409),
        ApiException('تم تعطيل هذا الحساب', 401),
        ApiException('', 500),
        ApiException('Invalid coupon', 400),
        ApiException('رقم الهاتف مطلوب', 400),
      ]) {
        final arText = ar(e);
        final enText = en(e);
        expect(ar(arText), arText, reason: e.message);
        expect(en(enText), enText, reason: e.message);
        expect(en(arText), enText, reason: e.message);
        expect(ar(enText), arText, reason: e.message);
      }
    });
  });

  group('أخطاء تقنية وشبكة', () {
    test('network failures', () {
      expect(ar('SocketException: Failed host lookup: api.example.com'), startsWith('تعذّر الاتصال بالخادم'));
      expect(en(const ApiException('تحققي من اتصالك بالإنترنت')), 'Could not connect. Check your internet and try again.');
    });

    test('technical text is never shown', () {
      expect(en("type 'Null' is not a subtype of type 'String'"), 'Something went wrong. Please try again.');
      expect(ar(StateError('Bad state: No element')), 'حدث خطأ. حاولي مجدداً.');
      expect(ar(null), 'حدث خطأ غير متوقع');
    });

    test('status codes come from technical text only', () {
      expect(en('DioException [bad response]: the response has a status code of 404'),
          'Content is not available right now.');
      // رقم عادي داخل الرسالة ليس رمز HTTP.
      expect(ar(Exception('عطر 500ml نفد')), 'عطر 500ml نفد');
    });
  });
}
