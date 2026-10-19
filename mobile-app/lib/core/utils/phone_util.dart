import 'package:flutter/services.dart';

import '../l10n/locale_provider.dart';

/// علامات الاتجاه الخفية التي تلتصق بالرقم عند النسخ من واتساب أو جهات الاتصال.
bool _isBidiMark(int c) =>
    c == 0x200E || // LRM
    c == 0x200F || // RLM
    c == 0x061C || // ALM
    (c >= 0x202A && c <= 0x202E) || // LRE…RLO
    (c >= 0x2066 && c <= 0x2069) || // LRI…PDI
    c == 0xFEFF; // BOM / ZWNBSP

/// أرقام لاتينية: «٠٧٧٠» (لوحة عربية) و«۰۷۷۰» (فارسية/كردية) → «0770»،
/// مع حذف علامات الاتجاه الخفية. بقية الأحرف تبقى كما هي.
String toLatinDigits(String s) {
  if (s.isEmpty) return s;
  StringBuffer? out;
  for (var i = 0; i < s.length; i++) {
    final c = s.codeUnitAt(i);
    int? mapped;
    var drop = false;
    if (c >= 0x0660 && c <= 0x0669) {
      mapped = 0x30 + c - 0x0660;
    } else if (c >= 0x06F0 && c <= 0x06F9) {
      mapped = 0x30 + c - 0x06F0;
    } else if (_isBidiMark(c)) {
      drop = true;
    }
    if (mapped == null && !drop) {
      out?.writeCharCode(c);
      continue;
    }
    // أول تغيير: ننسخ ما قبله مرة واحدة ثم نكمل حرفاً بحرف.
    out ??= StringBuffer(s.substring(0, i));
    if (mapped != null) out.writeCharCode(mapped);
  }
  return out?.toString() ?? s;
}

/// منسّقات حقل الهاتف: التحويل للأرقام اللاتينية أولاً (حتى لا تُرفض «٠٧٧٠» قبل
/// تحويلها) ثم السماح بالأرقام و«+» والمسافة فقط.
final List<TextInputFormatter> phoneInputFormatters = [
  const LatinDigitsFormatter(),
  FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]')),
];

/// يحوّل الأرقام العربية والفارسية إلى لاتينية أثناء الكتابة ويحافظ على موضع المؤشر.
/// يُوضع قبل `FilteringTextInputFormatter` حتى لا تُرفض «٠٧٧٠» قبل تحويلها.
class LatinDigitsFormatter extends TextInputFormatter {
  const LatinDigitsFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text;
    final converted = toLatinDigits(text);
    if (converted == text) return newValue;

    // التحويل يُبقي الطول أو يحذف علامات خفية فقط — فموضع المؤشر = طول ما قبله بعد التحويل.
    int mapOffset(int offset) {
      if (offset < 0) return offset;
      return toLatinDigits(text.substring(0, offset.clamp(0, text.length))).length;
    }

    final sel = newValue.selection;
    final composing = newValue.composing;
    return TextEditingValue(
      text: converted,
      selection: sel.isValid
          ? sel.copyWith(baseOffset: mapOffset(sel.baseOffset), extentOffset: mapOffset(sel.extentOffset))
          : sel,
      composing: composing.isValid && !composing.isCollapsed
          ? TextRange(start: mapOffset(composing.start), end: mapOffset(composing.end))
          : TextRange.empty,
    );
  }
}

/// Normalize Iraqi mobile numbers to +9647XXXXXXXXX.
String normalizePhone(String raw) {
  var p = toLatinDigits(raw).replaceAll(RegExp(r'[\s\-–—().]'), '');
  if (p.isEmpty) return p;

  if (p.startsWith('00')) {
    p = '+${p.substring(2)}';
  } else if (p.startsWith('964') && !p.startsWith('+')) {
    p = '+$p';
  } else if (p.startsWith('0') && p.length >= 10) {
    p = '+964${p.substring(1)}';
  } else if (RegExp(r'^7\d{9}$').hasMatch(p)) {
    p = '+964$p';
  } else if (!p.startsWith('+') && RegExp(r'^[07]').hasMatch(p)) {
    p = '+964${p.replaceFirst(RegExp(r'^0'), '')}';
  }

  return p;
}

bool isValidIraqiPhone(String raw) {
  return RegExp(r'^\+9647\d{9}$').hasMatch(normalizePhone(raw));
}

/// عرض محلي مثل 07701234567
String formatPhoneLocal(String? phone) {
  if (phone == null || phone.isEmpty) return '';
  final normalized = normalizePhone(phone);
  if (RegExp(r'^\+9647\d{9}$').hasMatch(normalized)) {
    return '0${normalized.substring(4)}';
  }
  return phone;
}

/// رسالة التحقق بلغة الواجهة — [lang] اختياري ويُؤخذ من [AppLocale] إن لم يُمرَّر.
String? validateIraqiPhone(String? value, {bool required = true, String? lang}) {
  final isAr = (lang ?? AppLocale.current) == 'ar';
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) {
    if (!required) return null;
    return isAr ? 'أدخلي رقم الهاتف' : 'Enter your phone number';
  }
  if (!isValidIraqiPhone(trimmed)) {
    return isAr
        ? 'أدخلي رقماً عراقياً صحيحاً (مثال: 07701234567)'
        : 'Enter a valid Iraqi mobile number (e.g. 07701234567)';
  }
  return null;
}
