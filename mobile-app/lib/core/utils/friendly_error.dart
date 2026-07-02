/// رسائل خطأ مفهومة للمستخدم بدل نصوص تقنية.
String friendlyError(Object? error) {
  final raw = error?.toString() ?? '';
  if (raw.isEmpty) return 'حدث خطأ غير متوقع';
  if (raw.contains('SocketException') ||
      raw.contains('Connection') ||
      raw.contains('Network') ||
      raw.contains('timeout')) {
    return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.';
  }
  if (raw.contains('401') || raw.contains('Unauthorized')) {
    return 'انتهت الجلسة. سجّل الدخول مرة أخرى.';
  }
  if (raw.contains('404')) return 'المحتوى غير متوفر حالياً.';
  if (raw.contains('500') || raw.contains('502') || raw.contains('503')) {
    return 'الخادم مشغول مؤقتاً. حاول بعد قليل.';
  }
  if (raw.length > 120) return 'حدث خطأ. حاول مجدداً.';
  return raw;
}
