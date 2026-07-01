import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

class WishlistState {
  final List<Product> products;
  final Set<String> ids;
  final bool loading;
  const WishlistState({this.products = const [], this.ids = const {}, this.loading = false});
}

class WishlistNotifier extends StateNotifier<WishlistState> {
  final Ref _ref;
  WishlistNotifier(this._ref) : super(const WishlistState());

  ApiService get _api => _ref.read(apiServiceProvider);

  bool isWishlisted(String productId) => state.ids.contains(productId);

  Future<void> load() async {
    if (!_ref.read(authProvider).isAuthenticated) {
      state = const WishlistState();
      return;
    }
    state = WishlistState(products: state.products, ids: state.ids, loading: true);
    try {
      final products = await _api.getWishlist();
      state = WishlistState(products: products, ids: products.map((e) => e.id).toSet());
    } catch (_) {
      state = WishlistState(products: state.products, ids: state.ids);
    }
  }

  /// يبدّل حالة المفضلة. يعيد true إن أصبح مضافاً.
  void clear() => state = const WishlistState();

  Future<bool> toggle(Product product) async {
    final added = await _api.toggleWishlist(product.id);
    final ids = {...state.ids};
    final products = [...state.products];
    if (added) {
      ids.add(product.id);
      if (!products.any((e) => e.id == product.id)) products.insert(0, product);
    } else {
      ids.remove(product.id);
      products.removeWhere((e) => e.id == product.id);
    }
    state = WishlistState(products: products, ids: ids);
    return added;
  }
}

final wishlistProvider =
    StateNotifierProvider<WishlistNotifier, WishlistState>((ref) {
  final notifier = WishlistNotifier(ref);
  ref.listen(authProvider, (prev, next) {
    if (next.isAuthenticated) {
      notifier.load();
    } else if (prev?.isAuthenticated == true) {
      notifier.clear();
    }
  });
  return notifier;
});
