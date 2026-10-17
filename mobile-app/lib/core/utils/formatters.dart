import 'package:intl/intl.dart';
import '../config/app_config.dart';

final _priceFormat = NumberFormat.decimalPattern('en');

/// تنسيق السعر مع رمز العملة.
String formatPrice(num? value) {
  final v = (value ?? 0).round();
  return '${_priceFormat.format(v)} ${AppConfig.currency}';
}

String formatNumber(num? value) => _priceFormat.format((value ?? 0).round());

/// أرقام لاتينية كبقية التطبيق (الأسعار والكميات) — «14 أكتوبر 2026» لا «١٤ أكتوبر ٢٠٢٦».
String _latinDigits(String s) =>
    s.replaceAllMapped(RegExp('[٠-٩]'), (m) => (m[0]!.codeUnitAt(0) - 0x0660).toString());

/// «14 أكتوبر 2026» — مع «اليوم/أمس» للتواريخ القريبة.
String formatDate(DateTime? date) {
  if (date == null) return '';
  final d = date.toLocal();
  final rel = _relativeDay(d);
  if (rel != null) return rel;
  final now = DateTime.now();
  final pattern = d.year == now.year ? 'd MMMM' : 'd MMMM y';
  return _latinDigits(DateFormat(pattern, 'ar').format(d));
}

/// «اليوم • 8:05 م» / «14 أكتوبر • 8:05 م».
String formatDateTime(DateTime? date) {
  if (date == null) return '';
  final d = date.toLocal();
  final time = _latinDigits(DateFormat('h:mm a', 'ar').format(d));
  return '${formatDate(d)} • $time';
}

String? _relativeDay(DateTime d) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(d.year, d.month, d.day);
  final diff = today.difference(day).inDays;
  if (diff == 0) return 'اليوم';
  if (diff == 1) return 'أمس';
  return null;
}

DateTime? parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}

/// شارة الخصم "-25%" — معزولة باتجاه LTR حتى لا تنقلب إلى "25%-" داخل نص عربي.
String formatDiscount(num percent) => '\u2066-${percent.round()}%\u2069';

/// تنظيف نصوص المنتجات القادمة من الاستيراد: `\n` حرفية، مسافات زائدة، أسطر فارغة متكررة.
String cleanRichText(String raw) {
  if (raw.isEmpty) return raw;
  return raw
      .replaceAll(r'\r\n', '\n')
      .replaceAll(r'\n', '\n')
      .replaceAll(r'\t', ' ')
      .replaceAll('\r\n', '\n')
      .replaceAll(RegExp(r'[ \t]+\n'), '\n')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .replaceAll(RegExp(r'[ \t]{2,}'), ' ')
      .trim();
}
