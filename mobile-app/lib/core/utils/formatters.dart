import 'package:intl/intl.dart';
import '../config/app_config.dart';

final _priceFormat = NumberFormat.decimalPattern('en');

/// تنسيق السعر مع رمز العملة.
String formatPrice(num? value) {
  final v = (value ?? 0).round();
  return '${_priceFormat.format(v)} ${AppConfig.currency}';
}

String formatNumber(num? value) => _priceFormat.format((value ?? 0).round());

String formatDate(DateTime? date) {
  if (date == null) return '';
  return DateFormat('yyyy/MM/dd', 'ar').format(date.toLocal());
}

String formatDateTime(DateTime? date) {
  if (date == null) return '';
  return DateFormat('yyyy/MM/dd • hh:mm a', 'ar').format(date.toLocal());
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
