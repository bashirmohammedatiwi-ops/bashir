import 'package:dio/dio.dart';

String extractApiError(DioException e, [String fallback = 'فشل الطلب']) {
  final data = e.response?.data;
  if (data is Map) {
    final message = data['message'];
    if (message is List) {
      return message.map((m) => m.toString()).join('\n');
    }
    if (message is String && message.trim().isNotEmpty) {
      return _localizeAuthMessage(message.trim());
    }
    final error = data['error'];
    if (error is String && error.trim().isNotEmpty) {
      return error.trim();
    }
    if (error is Map) {
      final nested = error['message'];
      if (nested is String && nested.trim().isNotEmpty) return nested.trim();
      if (nested is List) return nested.map((m) => m.toString()).join('\n');
    }
  }
  final status = e.response?.statusCode;
  if (status == 401 || status == 403) {
    return 'انتهت الجلسة — سجّل الدخول ثم أعد المحاولة';
  }
  if (status == 400) return 'بيانات غير صالحة — تحقق من التصنيف والبراند';
  return fallback;
}

String _localizeAuthMessage(String message) {
  final n = message.toLowerCase();
  if (n == 'unauthorized' ||
      n.contains('unauthorized') ||
      n.contains('invalid refresh') ||
      n.contains('session not found') ||
      n.contains('session expired')) {
    return 'انتهت الجلسة — سجّل الدخول ثم أعد المحاولة';
  }
  return message;
}

bool isSessionExpiredError(Object error) {
  final s = error.toString().toLowerCase();
  return s.contains('انتهت الجلسة') ||
      s.contains('unauthorized') ||
      s.contains('401') ||
      s.contains('سجّل الدخول');
}

int toIntPrice(num? value) {
  if (value == null) return 0;
  return value.round();
}

String normalizeColorHex(String? raw) {
  var hex = (raw ?? '').trim();
  if (hex.isEmpty) return '#CCCCCC';
  if (!hex.startsWith('#')) hex = '#$hex';
  if (hex.length == 4) {
    final r = hex[1], g = hex[2], b = hex[3];
    hex = '#$r$r$g$g$b$b';
  }
  if (!RegExp(r'^#[0-9A-Fa-f]{6}$').hasMatch(hex)) return '#CCCCCC';
  return hex.toUpperCase();
}
