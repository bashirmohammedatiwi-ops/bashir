import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/product_model.dart';
import '../../../data/remote/app_remote_data_source.dart';

class WishlistNotifier extends StateNotifier<AsyncValue<List<ProductModel>>> {
  WishlistNotifier(this._ref) : super(const AsyncValue.loading()) {
    refresh();
  }

  final Ref _ref;

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final items = await _ref.read(appRemoteDataSourceProvider).wishlist();
      state = AsyncValue.data(items);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggle(String productId) async {
    await _ref.read(appRemoteDataSourceProvider).toggleWishlist(productId);
    await refresh();
  }

  bool contains(String productId) {
    return state.valueOrNull?.any((p) => p.id == productId) ?? false;
  }
}

final wishlistProvider =
    StateNotifierProvider<WishlistNotifier, AsyncValue<List<ProductModel>>>((ref) {
  return WishlistNotifier(ref);
});

final notificationsProvider = FutureProvider((ref) async {
  return ref.read(appRemoteDataSourceProvider).notifications();
});

final wishlistCountProvider = Provider<int>((ref) {
  return ref.watch(wishlistProvider).valueOrNull?.length ?? 0;
});

final isProductWishlistedProvider = Provider.family<bool, String>((ref, id) {
  return ref.watch(wishlistProvider).valueOrNull?.any((p) => p.id == id) ?? false;
});
