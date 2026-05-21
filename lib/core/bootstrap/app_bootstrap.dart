import '../../data/mock/mock_brands.dart';
import '../../data/mock/mock_categories.dart';
import '../../data/mock/mock_products.dart';
import '../services/prefs_service.dart';

/// One-time startup work — must complete before heavy screens.
class AppBootstrap {
  AppBootstrap._();

  static PrefsService? _prefs;
  static bool _catalogReady = false;
  static bool _isWarming = false;

  static PrefsService get prefs {
    final p = _prefs;
    if (p == null) {
      throw StateError('AppBootstrap.init() not called');
    }
    return p;
  }

  static bool get isReady => _prefs != null && _catalogReady;

  /// Call from main() before runApp.
  static Future<void> init() async {
    _prefs ??= await PrefsService.init();
    await warmCatalog();
  }

  /// Heavy mock catalog — run once (splash triggers this).
  static Future<void> warmCatalog() async {
    if (_catalogReady || _isWarming) return;
    _isWarming = true;
    await Future<void>(() {
      MockCategories.all;
      MockBrands.all;
      MockProducts.warmUp();
    });
    _catalogReady = true;
    _isWarming = false;
  }

  static Future<void> ensureCatalog() async {
    if (_catalogReady) return;
    await warmCatalog();
  }
}
