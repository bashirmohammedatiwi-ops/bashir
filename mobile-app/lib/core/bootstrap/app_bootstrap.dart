import '../services/prefs_service.dart';

/// تهيئة التطبيق — بدون كتالوج وهمي.
class AppBootstrap {
  AppBootstrap._();

  static PrefsService? _prefs;

  static PrefsService get prefs {
    final p = _prefs;
    if (p == null) {
      throw StateError('AppBootstrap.init() not called');
    }
    return p;
  }

  static bool get isReady => _prefs != null;

  static Future<void> init() async {
    _prefs ??= await PrefsService.init();
  }

  static Future<void> ensureCatalog() async {}
}
