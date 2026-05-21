import 'package:intl/intl.dart';

abstract final class CurrencyFormatter {
  /// نُبقي الأرقام بالنمط اللاتيني (0-9) عبر التطبيق.
  static String toArabicDigits(String input) => input;

  static String format(int amount) {
    final formatted = NumberFormat('#,###', 'en_US').format(amount);
    return '$formatted د.ع';
  }

  static String formatPoints(int points) => '$points';
}
