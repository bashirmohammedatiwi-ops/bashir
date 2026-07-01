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
