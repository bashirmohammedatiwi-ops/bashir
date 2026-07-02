import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/cart_item.dart';
import '../../data/models/product.dart';

class CartState {
  final List<CartItem> items;
  const CartState(this.items);

  int get count => items.fold(0, (s, e) => s + e.quantity);
  int get subtotal => items.fold(0, (s, e) => s + e.lineTotal);
  bool get isEmpty => items.isEmpty;
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState([])) {
    _load();
  }

  static const _key = 'cart_items_v1';

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      final list = (jsonDecode(raw) as List)
          .map((e) => CartItem.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      state = CartState(list);
    } catch (_) {}
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(state.items.map((e) => e.toJson()).toList()));
  }

  void add(Product product, {int quantity = 1, ProductShade? shade}) {
    final item = CartItem.fromProduct(product, quantity: quantity, shade: shade);
    final items = [...state.items];
    final idx = items.indexWhere((e) => e.key == item.key);
    if (idx >= 0) {
      final newQty = items[idx].quantity + quantity;
      items[idx] = items[idx].copyWith(quantity: newQty);
    } else {
      items.add(item);
    }
    state = CartState(items);
    _persist();
  }

  void setQuantity(String key, int quantity) {
    if (quantity <= 0) {
      remove(key);
      return;
    }
    final items = [
      for (final e in state.items)
        if (e.key == key) e.copyWith(quantity: quantity) else e
    ];
    state = CartState(items);
    _persist();
  }

  void increment(String key) {
    final item = state.items.firstWhere((e) => e.key == key);
    setQuantity(key, item.quantity + 1);
  }

  void decrement(String key) {
    final item = state.items.firstWhere((e) => e.key == key);
    setQuantity(key, item.quantity - 1);
  }

  int quantityForProduct(String productId) =>
      state.items.where((e) => e.productId == productId).fold(0, (s, e) => s + e.quantity);

  CartItem? firstItemForProduct(String productId) {
    for (final item in state.items) {
      if (item.productId == productId) return item;
    }
    return null;
  }

  void incrementProduct(Product product) {
    if (product.shades.isNotEmpty) return;
    final existing = firstItemForProduct(product.id);
    if (existing != null && existing.shadeId == null) {
      increment(existing.key);
    } else {
      add(product);
    }
  }

  void decrementProduct(String productId) {
    final item = firstItemForProduct(productId);
    if (item != null) decrement(item.key);
  }

  void remove(String key) {
    state = CartState(state.items.where((e) => e.key != key).toList());
    _persist();
  }

  void clear() {
    state = const CartState([]);
    _persist();
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) => CartNotifier());
