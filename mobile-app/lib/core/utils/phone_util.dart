/// Normalize Iraqi mobile numbers to +9647XXXXXXXXX.
String normalizePhone(String raw) {
  var p = raw.replaceAll(RegExp(r'[\s\-().]'), '');
  if (p.isEmpty) return p;

  if (p.startsWith('00')) {
    p = '+${p.substring(2)}';
  } else if (p.startsWith('964') && !p.startsWith('+')) {
    p = '+$p';
  } else if (p.startsWith('0') && p.length >= 10) {
    p = '+964${p.substring(1)}';
  } else if (RegExp(r'^7\d{9}$').hasMatch(p)) {
    p = '+964$p';
  } else if (!p.startsWith('+') && RegExp(r'^[07]').hasMatch(p)) {
    p = '+964${p.replaceFirst(RegExp(r'^0'), '')}';
  }

  return p;
}

bool isValidIraqiPhone(String raw) {
  return RegExp(r'^\+9647\d{9}$').hasMatch(normalizePhone(raw));
}

/// عرض محلي مثل 07701234567
String formatPhoneLocal(String? phone) {
  if (phone == null || phone.isEmpty) return '';
  final normalized = normalizePhone(phone);
  if (RegExp(r'^\+9647\d{9}$').hasMatch(normalized)) {
    return '0${normalized.substring(4)}';
  }
  return phone;
}

String? validateIraqiPhone(String? value, {bool required = true}) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) {
    return required ? 'أدخل رقم الهاتف' : null;
  }
  if (!isValidIraqiPhone(trimmed)) {
    return 'أدخل رقماً عراقياً صحيحاً (مثال: 07701234567)';
  }
  return null;
}
