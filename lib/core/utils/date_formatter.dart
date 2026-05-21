import 'currency_formatter.dart';

abstract final class DateFormatter {
  static String chatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return 'الآن';
    if (diff.inMinutes < 60) return 'منذ ${CurrencyFormatter.toArabicDigits('${diff.inMinutes}')} دقيقة';
    final hour = time.hour > 12 ? time.hour - 12 : (time.hour == 0 ? 12 : time.hour);
    final period = time.hour >= 12 ? 'م' : 'ص';
    final minute = time.minute.toString().padLeft(2, '0');
    return '${CurrencyFormatter.toArabicDigits('$hour')}:${CurrencyFormatter.toArabicDigits(minute)} $period';
  }

  static String orderDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
