import 'package:alhayaa/core/l10n/locale_provider.dart';
import 'package:alhayaa/core/utils/phone_util.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('toLatinDigits', () {
    test('maps Arabic-Indic and Persian digits', () {
      expect(toLatinDigits('٠٧٧٠١٢٣٤٥٦٧'), '07701234567');
      expect(toLatinDigits('۰۷۸۰۹۸۷۶۵۴۳'), '07809876543');
      expect(toLatinDigits('٠٧٧٠ 123 ۴۵۶۷'), '0770 123 4567');
    });

    test('strips invisible direction marks', () {
      expect(toLatinDigits('\u200E+964 770 123 4567\u200F'), '+964 770 123 4567');
      expect(toLatinDigits('\u202A0770\u202C\u2066123\u2069\uFEFF4567\u061C'), '07701234567');
    });

    test('leaves other text untouched', () {
      expect(toLatinDigits(''), '');
      expect(toLatinDigits('07701234567'), '07701234567');
      expect(toLatinDigits('ديما 7'), 'ديما 7');
    });
  });

  group('normalizePhone / isValidIraqiPhone', () {
    test('accepts every common way of typing the same number', () {
      for (final raw in const [
        '07701234567',
        '٠٧٧٠١٢٣٤٥٦٧',
        '۰۷۷۰۱۲۳۴۵۶۷',
        '0770 123 4567',
        '0770-123-4567',
        '+964 770 123 4567',
        '00964 770 123 4567',
        '9647701234567',
        '7701234567',
        '\u200E٠٧٧٠ ١٢٣ ٤٥٦٧\u200F',
      ]) {
        expect(normalizePhone(raw), '+9647701234567', reason: raw);
        expect(isValidIraqiPhone(raw), isTrue, reason: raw);
      }
    });

    test('rejects numbers that are not Iraqi mobiles', () {
      expect(isValidIraqiPhone('0123'), isFalse);
      expect(isValidIraqiPhone('+96612345678'), isFalse);
      expect(isValidIraqiPhone('0660123456'), isFalse);
    });

    test('formatPhoneLocal shows the local form', () {
      expect(formatPhoneLocal('+9647701234567'), '07701234567');
      expect(formatPhoneLocal('٠٧٧٠١٢٣٤٥٦٧'), '07701234567');
      expect(formatPhoneLocal(null), '');
    });
  });

  group('validateIraqiPhone', () {
    test('Arabic and English messages', () {
      expect(validateIraqiPhone('', lang: 'ar'), 'أدخلي رقم الهاتف');
      expect(validateIraqiPhone('', lang: 'en'), 'Enter your phone number');
      expect(validateIraqiPhone('123', lang: 'ar'), 'أدخلي رقماً عراقياً صحيحاً (مثال: 07701234567)');
      expect(validateIraqiPhone('123', lang: 'en'), 'Enter a valid Iraqi mobile number (e.g. 07701234567)');
    });

    test('valid numbers, including Arabic digits, pass', () {
      expect(validateIraqiPhone('٠٧٧٠١٢٣٤٥٦٧', lang: 'en'), isNull);
      expect(validateIraqiPhone('  07701234567  ', lang: 'ar'), isNull);
    });

    test('optional field may stay empty', () {
      expect(validateIraqiPhone('', required: false, lang: 'en'), isNull);
      expect(validateIraqiPhone('12', required: false, lang: 'en'), isNotNull);
    });

    test('defaults to the current app language', () {
      addTearDown(() => AppLocale.current = 'ar');
      AppLocale.current = 'en';
      expect(validateIraqiPhone(''), 'Enter your phone number');
      AppLocale.current = 'ar';
      expect(validateIraqiPhone(''), 'أدخلي رقم الهاتف');
    });
  });

  group('LatinDigitsFormatter', () {
    const formatter = LatinDigitsFormatter();

    TextEditingValue edit(String text, int cursor) =>
        formatter.formatEditUpdate(TextEditingValue.empty, TextEditingValue(
          text: text,
          selection: TextSelection.collapsed(offset: cursor),
        ));

    test('converts while typing and keeps the cursor in place', () {
      final v = edit('٠٧٧٠', 4);
      expect(v.text, '0770');
      expect(v.selection, const TextSelection.collapsed(offset: 4));

      // تعديل في المنتصف: المؤشر يبقى بعد الحرف المكتوب.
      final mid = edit('07٧01', 3);
      expect(mid.text, '07701');
      expect(mid.selection.baseOffset, 3);
    });

    test('dropping a pasted direction mark shifts the cursor back', () {
      final v = edit('\u200E07701234567', 12);
      expect(v.text, '07701234567');
      expect(v.selection, const TextSelection.collapsed(offset: 11));

      final range = formatter.formatEditUpdate(
        TextEditingValue.empty,
        const TextEditingValue(
          text: '\u200F٠٧٧٠',
          selection: TextSelection(baseOffset: 1, extentOffset: 5),
        ),
      );
      expect(range.text, '0770');
      expect(range.selection, const TextSelection(baseOffset: 0, extentOffset: 4));
    });

    test('returns the same value when nothing changes', () {
      const value = TextEditingValue(text: '0770', selection: TextSelection.collapsed(offset: 2));
      expect(identical(formatter.formatEditUpdate(TextEditingValue.empty, value), value), isTrue);
    });

    test('runs before a digits-only filter so Arabic digits survive', () {
      final filter = FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]'));
      const typed = TextEditingValue(text: '٠٧٧٠ ١٢٣', selection: TextSelection.collapsed(offset: 8));
      final result = filter.formatEditUpdate(TextEditingValue.empty, formatter.formatEditUpdate(TextEditingValue.empty, typed));
      expect(result.text, '0770 123');
    });
  });
}
