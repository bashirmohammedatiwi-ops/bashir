import '../network/api_exception.dart';

/// رسائل خطأ مفهومة للمستخدم بدل نصوص تقنية.
String friendlyError(Object? error, {String lang = 'ar'}) {
  final isAr = lang == 'ar';
  if (error is ApiException) {
    return _friendlyApiError(error.message, error.status, isAr);
  }

  final raw = error?.toString() ?? '';
  if (raw.isEmpty) return isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred';
  return _friendlyApiError(raw, _statusFromText(raw), isAr);
}

int? _statusFromText(String raw) {
  final m = RegExp(r'\b(400|401|403|404|409|422|429|500|502|503)\b').firstMatch(raw);
  return m != null ? int.tryParse(m.group(1)!) : null;
}

String _friendlyApiError(String message, int? status, bool isAr) {
  final trimmed = message.trim();
  final lower = trimmed.toLowerCase();

  if (status == 409 ||
      lower.contains('already registered') ||
      lower.contains('email already') ||
      trimmed.contains('مسجّل مسبقاً') ||
      trimmed.contains('مسجل مسبقاً')) {
    return isAr
        ? 'هذا البريد الإلكتروني مسجّل مسبقاً. سجّل الدخول أو استخدم بريداً آخر.'
        : 'This email is already registered. Sign in or use another email.';
  }

  if (status == 409 && (lower.contains('phone') || trimmed.contains('الهاتف'))) {
    return isAr ? 'رقم الهاتف مستخدم في حساب آخر.' : 'This phone number is already in use.';
  }

  if (status == 401 ||
      lower.contains('invalid credentials') ||
      trimmed.contains('غير صحيحة')) {
    return isAr
        ? 'رقم الهاتف أو كلمة المرور غير صحيحة.'
        : 'Incorrect phone number or password.';
  }

  if (status == 403 || lower.contains('account disabled') || trimmed.contains('معطّل')) {
    return isAr ? 'تم تعطيل هذا الحساب. تواصل مع الدعم.' : 'This account is disabled. Contact support.';
  }

  if (status == 400 || status == 422) {
    if (lower.contains('email') || trimmed.contains('بريد')) {
      return isAr ? 'أدخل بريداً إلكترونياً صحيحاً.' : 'Enter a valid email address.';
    }
    if (lower.contains('password') || trimmed.contains('كلمة المرور')) {
      return isAr
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'
          : 'Password must be at least 6 characters.';
    }
    if (lower.contains('name') || trimmed.contains('الاسم')) {
      return isAr ? 'أدخل اسماً صحيحاً (حرفان على الأقل).' : 'Enter a valid name (at least 2 characters).';
    }
    if (lower.contains('phone') || trimmed.contains('هاتف')) {
      return isAr
          ? 'رقم الهاتف غير صالح أو مستخدم مسبقاً.'
          : 'Invalid phone number or already in use.';
    }
  }

  if (lower.contains('socketexception') ||
      lower.contains('connection timeout') ||
      lower.contains('connection error') ||
      trimmed.contains('تحقق من اتصالك')) {
    return isAr
        ? 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.'
        : 'Could not connect. Check your internet and try again.';
  }

  if (status == 404 || lower.contains('not found')) {
    return isAr ? 'المحتوى غير متوفر حالياً.' : 'Content is not available right now.';
  }

  if (status == 429 || lower.contains('too many')) {
    return isAr ? 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.' : 'Too many attempts. Wait and try again.';
  }

  if (status == 500 || status == 502 || status == 503) {
    return isAr ? 'الخادم مشغول مؤقتاً. حاول بعد قليل.' : 'Server is busy. Try again shortly.';
  }

  if (trimmed.isNotEmpty &&
      trimmed != 'تعذّر الاتصال بالخادم' &&
      trimmed != 'تعذر الاتصال بالخادم') {
    return trimmed;
  }

  return isAr ? 'حدث خطأ. حاول مجدداً.' : 'Something went wrong. Please try again.';
}

bool isPhoneAlreadyRegisteredError(Object? error) {
  if (error is ApiException) {
    if (error.status == 409) {
      final m = error.message.toLowerCase();
      return m.contains('phone') || error.message.contains('الهاتف');
    }
  }
  return false;
}

bool isEmailAlreadyRegisteredError(Object? error) {
  if (error is ApiException) {
    if (error.status == 409) return true;
    final m = error.message.toLowerCase();
    return m.contains('already registered') || error.message.contains('مسجّل');
  }
  return false;
}
