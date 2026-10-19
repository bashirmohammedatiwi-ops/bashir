import 'package:intl/intl.dart';
import '../config/app_config.dart';
import '../l10n/locale_provider.dart';

final _priceFormat = NumberFormat.decimalPattern('en');

/// رمز العملة في الواجهة الإنجليزية.
const _currencyEn = 'IQD';

/// تنسيق السعر مع رمز العملة: «45,000 د.ع» / «45,000 IQD».
/// [lang] اختياري: بدونه تُتبع لغة الواجهة الحالية ([AppLocale.current]).
String formatPrice(num? value, {String? lang}) {
  final v = (value ?? 0).round();
  return '${_priceFormat.format(v)} ${(lang ?? AppLocale.current) == 'ar' ? AppConfig.currency : _currencyEn}';
}

/// رقم بفواصل الآلاف: «12,500».
String formatNumber(num? value) => _priceFormat.format((value ?? 0).round());

/// أرقام لاتينية كبقية التطبيق (الأسعار والكميات) — «14 أكتوبر 2026» لا «١٤ أكتوبر ٢٠٢٦».
String _latinDigits(String s) =>
    s.replaceAllMapped(RegExp('[٠-٩]'), (m) => (m[0]!.codeUnitAt(0) - 0x0660).toString());

/// «14 أكتوبر 2026» / «October 14, 2026» — مع «اليوم/أمس» («Today/Yesterday») للتواريخ القريبة.
String formatDate(DateTime? date, {String? lang}) {
  if (date == null) return '';
  lang ??= AppLocale.current;
  final d = date.toLocal();
  final rel = _relativeDay(d, lang);
  if (rel != null) return rel;
  final now = DateTime.now();
  // الهيكل يختار ترتيب اللغة: «14 أكتوبر» بالعربي و«October 14» بالإنجليزي.
  final format = d.year == now.year ? DateFormat.MMMMd(lang) : DateFormat.yMMMMd(lang);
  return _digitsFor(format.format(d), lang);
}

/// «اليوم • 8:05 م» / «14 أكتوبر • 8:05 م» / «Today • 8:05 PM».
String formatDateTime(DateTime? date, {String? lang}) {
  if (date == null) return '';
  lang ??= AppLocale.current;
  final d = date.toLocal();
  final time = _digitsFor(DateFormat('h:mm a', lang).format(d), lang);
  return '${formatDate(d, lang: lang)} • $time';
}

String _digitsFor(String s, String lang) => lang == 'ar' ? _latinDigits(s) : s;

String? _relativeDay(DateTime d, String lang) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(d.year, d.month, d.day);
  final diff = today.difference(day).inDays;
  final isAr = lang == 'ar';
  if (diff == 0) return isAr ? 'اليوم' : 'Today';
  if (diff == 1) return isAr ? 'أمس' : 'Yesterday';
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
