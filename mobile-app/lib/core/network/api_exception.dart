/// خطأ API مع رسالة واضحة ورمز HTTP.
class ApiException implements Exception {
  final String message;
  final int? status;

  const ApiException(this.message, [this.status]);

  @override
  String toString() => message;
}

/// استخراج رسالة الخطأ من جسم استجابة الـ API.
String? parseApiErrorMessage(dynamic data) {
  if (data is! Map) return null;

  final top = data['message'];
  if (top != null) {
    return top is List ? top.join('، ') : top.toString();
  }

  final err = data['error'];
  if (err is Map && err['message'] != null) {
    final m = err['message'];
    return m is List ? m.join('، ') : m.toString();
  }

  return null;
}
