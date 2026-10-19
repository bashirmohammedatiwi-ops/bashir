import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/push/push_service.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

/// المنتجات التي طلبت الزبونة التنبيه عند عودتها للتوفر.
class RestockWatchNotifier extends StateNotifier<Set<String>> {
  final Ref _ref;
  RestockWatchNotifier(this._ref) : super(const {}) {
    if (_ref.read(authProvider).isAuthenticated) load();
  }

  ApiService get _api => _ref.read(apiServiceProvider);

  Future<void> load() async {
    try {
      state = await _api.getRestockWatches();
    } catch (_) {}
  }

  /// قائمة جلبها غيره من السيرفر (شاشة التنبيهات) — لا داعي لطلب ثانٍ.
  void sync(Set<String> ids) {
    if (mounted) state = ids;
  }

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
      state = before;
      rethrow;
    }
  }
}

final restockWatchProvider = StateNotifierProvider<RestockWatchNotifier, Set<String>>((ref) {
  ref.watch(authProvider.select((a) => a.user?.id));
  return RestockWatchNotifier(ref);
});
