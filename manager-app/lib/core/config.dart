/// عناوين السيرفر — الافتراضي الإنتاج. للتجربة المحلية:
/// flutter run --dart-define=API_BASE_URL=http://localhost:3077/api/v1
class AppConfig {
  static const apiBase = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://deemaalhayat.com/api/v1');

  /// رابط صفحة المنتج في المتجر (للمشاركة/الفتح).
  static const storeBase = String.fromEnvironment('STORE_BASE_URL', defaultValue: 'https://deemaalhayat.com');

  /// تعبئة تلقائية لبيانات الدخول في نسخ التطوير فقط.
  static const devEmail = String.fromEnvironment('DEV_EMAIL');
  static const devPassword = String.fromEnvironment('DEV_PASSWORD');
}
