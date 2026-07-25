import '../network/api_exception.dart';

/// رسائل خطأ مفهومة للمستخدم بدل نصوص تقنية.
String friendlyError(Object? error) {
  if (error is ApiException) {
    return _friendlyApiError(error.message, error.status);
  }

  final raw = error?.toString() ?? '';
  if (raw.isEmpty) return 'حدث خطأ غير متوقع';
  return _friendlyApiError(raw, _statusFromText(raw));
}

int? _statusFromText(String raw) {
  final m = RegExp(r'\b(400|401|403|404|409|422|429|500|502|503)\b').firstMatch(raw);
  return m != null ? int.tryParse(m.group(1)!) : null;
}

String _friendlyApiError(String message, int? status) {
  final trimmed = message.trim();
  final lower = trimmed.toLowerCase();

  if (status == 409 ||
      lower.contains('already registered') ||
      lower.contains('email already') ||
      trimmed.contains('مسجّل مسبقاً') ||
      trimmed.contains('مسجل مسبقاً')) {
    return 'هذا البريد الإلكتروني مسجّل مسبقاً. سجّل الدخول أو استخدم بريداً آخر.';
  }

  if (status == 409 && (lower.contains('phone') || trimmed.contains('الهاتف'))) {
    return 'رقم الهاتف مستخدم في حساب آخر.';
  }

  if (status == 401 ||
      lower.contains('invalid credentials') ||
      trimmed.contains('غير صحيحة')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  if (status == 403 || lower.contains('account disabled') || trimmed.contains('معطّل')) {
    return 'تم تعطيل هذا الحساب. تواصل مع الدعم.';
  }

  if (status == 400 || status == 422) {
    if (lower.contains('email') || trimmed.contains('بريد')) {
      return 'أدخل بريداً إلكترونياً صحيحاً.';
    }
    if (lower.contains('password') || trimmed.contains('كلمة المرور')) {
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
    }
    if (lower.contains('name') || trimmed.contains('الاسم')) {
      return 'أدخل اسماً صحيحاً (حرفان على الأقل).';
    }
    if (lower.contains('phone') || trimmed.contains('هاتف')) {
      return 'رقم الهاتف غير صالح أو مستخدم مسبقاً.';
    }
  }

  if (lower.contains('socketexception') ||
      lower.contains('connection timeout') ||
      lower.contains('connection error') ||
      trimmed.contains('تحقق من اتصالك')) {
    return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.';
  }

  if (status == 404 || lower.contains('not found')) {
    return 'المحتوى غير متوفر حالياً.';
  }

  if (status == 429 || lower.contains('too many')) {
    return 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
  }

  if (status == 500 || status == 502 || status == 503) {
    return 'الخادم مشغول مؤقتاً. حاول بعد قليل.';
  }

  if (trimmed.isNotEmpty &&
      trimmed != 'تعذّر الاتصال بالخادم' &&
      trimmed != 'تعذر الاتصال بالخادم') {
    return trimmed;
  }

  return 'حدث خطأ. حاول مجدداً.';
}

/// هل الخطأ يعني أن البريد مسجّل مسبقاً؟
bool isEmailAlreadyRegisteredError(Object? error) {
  if (error is ApiException) {
    if (error.status == 409) return true;
    final m = error.message.toLowerCase();
    return m.contains('already registered') || error.message.contains('مسجّل');
  }
  return false;
}
