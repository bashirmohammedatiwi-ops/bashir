import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/models/cart_item_model.dart';
import '../../../data/models/product_model.dart';
import '../../../data/remote/app_remote_data_source.dart';

class CartNotifier extends StateNotifier<List<CartItemModel>> {
  CartNotifier(this._ref) : super([]) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    final prefs = _ref.read(prefsProvider);
    final json = prefs.cartJson;
    if (json == null) return;
    try {
      final list = jsonDecode(json) as List;
      final remote = _ref.read(appRemoteDataSourceProvider);
      final items = <CartItemModel>[];
      for (final e in list) {
        final map = e as Map<String, dynamic>;
        try {
          final product = await remote.findProduct(map['productId'] as String);
          items.add(
            CartItemModel(
              product: product,
              quantity: map['quantity'] as int,
              selectedShade: map['selectedShade'] as String?,
              selectedSize: map['selectedSize'] as String?,
            ),
          );
        } catch (_) {}
      }
      state = items;
    } catch (_) {}
  }

  Future<void> _save() async {
    final prefs = _ref.read(prefsProvider);
    final json = jsonEncode(state.map((e) => e.toJson()).toList());
    await prefs.setCartJson(json);
  }

  int get itemCount => state.fold(0, (sum, i) => sum + i.quantity);
  int get subtotal => state.fold(0, (sum, i) => sum + i.totalPrice);

  void addProduct(
    ProductModel product, {
    int quantity = 1,
    String? shade,
    String? size,
  }) {
    final key = '${product.id}_${shade ?? ''}_${size ?? ''}';
    final existing = state.indexWhere((i) => i.key == key);
    if (existing >= 0) {
      final updated = [...state];
      updated[existing] = updated[existing]
          .copyWith(quantity: updated[existing].quantity + quantity);
      state = updated;
    } else {
      state = [
        ...state,
        CartItemModel(
          product: product,
          quantity: quantity,
          selectedShade: shade,
          selectedSize: size,
        ),
      ];
    }
    _save();
  }

  void updateQuantity(String key, int qty) {
    if (qty <= 0) {
      removeItem(key);
      return;
    }
    state = state.map((i) => i.key == key ? i.copyWith(quantity: qty) : i).toList();
    _save();
  }

  void removeItem(String key) {
    state = state.where((i) => i.key != key).toList();
    _save();
  }

  void clear() {
    state = [];
    _save();
  }
}

final cartProvider =
    StateNotifierProvider<CartNotifier, List<CartItemModel>>((ref) {
  return CartNotifier(ref);
});

final cartCountProvider = Provider<int>((ref) {
  return ref.watch(cartProvider.notifier).itemCount;
});
