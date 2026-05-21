import '../services/prefs_service.dart';

/// One-time startup work — must complete before heavy screens.
class AppBootstrap {
  AppBootstrap._();

  static PrefsService? _prefs;
  static bool _ready = false;

  static PrefsService get prefs {
    final p = _prefs;
    if (p == null) {
      throw StateError('AppBootstrap.init() not called');
    }
    return p;
  }

  static bool get isReady => _ready;

  static Future<void> init() async {
    _prefs ??= await PrefsService.init();
    _ready = true;
  }
}
