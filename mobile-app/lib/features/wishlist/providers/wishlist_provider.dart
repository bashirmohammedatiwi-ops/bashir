import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/models/product_model.dart';
import '../../../data/remote/product_remote_mapper.dart';
import '../../../data/remote/store_api.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../../auth/providers/auth_provider.dart';

class WishlistNotifier extends StateNotifier<List<String>> {
  WishlistNotifier(this._ref) : super([]) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    if (_ref.read(isLoggedInProvider)) {
      try {
        final raw = await _ref.read(storeApiProvider).wishlist();
        state = raw
            .map((w) =>
                (w['productId'] ?? (w['product'] as Map?)?['id'])?.toString())
            .whereType<String>()
            .toList();
        return;
      } catch (_) {}
    }
    state = _ref.read(prefsProvider).wishlistIds;
  }

  Future<void> _saveLocal() async {
    await _ref.read(prefsProvider).setWishlistIds(state);
  }

  bool contains(String id) => state.contains(id);

  Future<void> toggle(String id) async {
    if (_ref.read(isLoggedInProvider)) {
      try {
        await _ref.read(storeApiProvider).toggleWishlist(id);
        await _load();
        return;
      } catch (_) {}
    }
    if (state.contains(id)) {
      state = state.where((i) => i != id).toList();
    } else {
      state = [...state, id];
    }
    await _saveLocal();
  }

  void remove(String id) => toggle(id);
}

final wishlistProductsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final ids = ref.watch(wishlistProvider);
  if (ids.isEmpty) return [];

  if (ref.read(isLoggedInProvider)) {
    final api = ref.read(storeApiProvider);
    final products = <ProductModel>[];
    for (final id in ids) {
      try {
        products.add(ProductRemoteMapper.fromJson(await api.product(id)));
      } catch (_) {}
    }
    return products;
  }

  final repo = ref.read(catalogRepositoryProvider);
  final products = <ProductModel>[];
  for (final id in ids) {
    final p = await repo.findProduct(id);
    if (p != null) products.add(p);
  }
  return products;
});

final wishlistProvider =
    StateNotifierProvider<WishlistNotifier, List<String>>((ref) {
  return WishlistNotifier(ref);
});

final wishlistCountProvider = Provider<int>((ref) {
  return ref.watch(wishlistProvider).length;
});
