import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/push/push_service.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

/// المنتجات التي طلبت الزبونة التنبيه عند عودتها للتوفر.
///
/// الخادم يحذف التنبيه بعد إرساله — لذا تُعاد المزامنة عند العودة للتطبيق
/// (وعند وصول إشعار تذكير، من PushService) حتى لا يبقى الجرس «مفعّلاً» بلا اشتراك.
class RestockWatchNotifier extends StateNotifier<Set<String>> {
  final Ref _ref;
  late final AppLifecycleListener _lifecycle;

  RestockWatchNotifier(this._ref) : super(const {}) {
    _lifecycle = AppLifecycleListener(onResume: _onResume);
    if (_ref.read(authProvider).isAuthenticated) load();
  }

  /// لا نعيد المزامنة أكثر من مرة كل 30 ثانية (تبديل التطبيقات السريع).
  static const _resyncEvery = Duration(seconds: 30);
  DateTime? _lastLoaded;

  ApiService get _api => _ref.read(apiServiceProvider);

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  void _onResume() {
    if (!_ref.read(authProvider).isAuthenticated) return;
    final last = _lastLoaded;
    if (last != null && DateTime.now().difference(last) < _resyncEvery) return;
    load();
  }

  Future<void> load() async {
    if (!_ref.read(authProvider).isAuthenticated) {
      if (mounted) state = const {};
      return;
    }
    _lastLoaded = DateTime.now();
    try {
      final ids = await _api.getRestockWatches();
      if (mounted) state = ids;
    } catch (_) {}
  }

  /// قائمة جلبها غيره من السيرفر (شاشة التنبيهات) — لا داعي لطلب ثانٍ.
  void sync(Set<String> ids) {
    if (!mounted) return;
    _lastLoaded = DateTime.now();
    state = ids;
  }

  /// هل طلبت التنبيه لهذا المنتج؟
  bool isWatching(String productId) => state.contains(productId);

  /// المراقَب من [productIds] فقط (بطاقات قائمة بعينها).
  Set<String> watchedAmong(Iterable<String> productIds) => productIds.where(state.contains).toSet();

  /// عدد التنبيهات القائمة (شارة «تنبيهات التوفر» في الحساب).
  int get count => state.length;

  /// تبديل متفائل: الواجهة تتغير فوراً، وتعود إن فشل الطلب.
  Future<bool> toggle(String productId) async {
    final watching = !state.contains(productId);
    final before = state;
    state = watching ? {...state, productId} : ({...state}..remove(productId));
    try {
      await _api.setRestockWatch(productId, watching);
      if (watching) await PushService.requestPermissionInContext();
      return watching;
    } catch (e) {
      if (mounted) state = before;
      rethrow;
    }
  }
}

final restockWatchProvider = StateNotifierProvider<RestockWatchNotifier, Set<String>>((ref) {
  ref.watch(authProvider.select((a) => a.user?.id));
  return RestockWatchNotifier(ref);
});
