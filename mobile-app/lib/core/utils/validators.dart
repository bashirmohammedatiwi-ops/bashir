abstract final class Validators {
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'البريد الإلكتروني مطلوب';
    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value.trim())) {
      return 'بريد إلكتروني غير صحيح';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) return 'رقم الهاتف مطلوب';
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 10) return 'رقم الهاتف غير صحيح';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'كلمة المرور مطلوبة';
    if (value.length < 6) return 'كلمة المرور قصيرة جداً';
    return null;
  }

  static String? required(String? value, [String field = 'هذا الحقل']) {
    if (value == null || value.trim().isEmpty) return '$field مطلوب';
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value != password) return 'كلمة المرور غير متطابقة';
    return null;
  }
}
