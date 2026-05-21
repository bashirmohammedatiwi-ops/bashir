import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/mock/mock_products.dart';
import '../../../data/models/product_model.dart';

class WishlistNotifier extends StateNotifier<List<String>> {
  WishlistNotifier(this._ref) : super([]) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    final prefs = _ref.read(prefsProvider);
    state = prefs.wishlistIds;
  }

  Future<void> _save() async {
    final prefs = _ref.read(prefsProvider);
    await prefs.setWishlistIds(state);
  }

  bool contains(String id) => state.contains(id);

  void toggle(String id) {
    if (state.contains(id)) {
      state = state.where((i) => i != id).toList();
    } else {
      state = [...state, id];
    }
    _save();
  }

  void remove(String id) {
    state = state.where((i) => i != id).toList();
    _save();
  }

  List<ProductModel> get products =>
      state.map(MockProducts.findById).whereType<ProductModel>().toList();
}

final wishlistProvider =
    StateNotifierProvider<WishlistNotifier, List<String>>((ref) {
  return WishlistNotifier(ref);
});

final wishlistCountProvider = Provider<int>((ref) {
  return ref.watch(wishlistProvider).length;
});
