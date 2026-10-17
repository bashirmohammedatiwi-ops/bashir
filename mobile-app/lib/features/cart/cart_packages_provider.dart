import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/beauty.dart';
import 'cart_provider.dart';

/// باقة أُضيفت للسلة: منتجاتها وكمياتها وسعرها الخاص.
class CartPackage {
  final String id;
  final String routeId;
  final String name;
  final int price;
  final bool isRoutine;
  final String? coverUrl;
  final Map<String, int> items; // productId → الكمية في الباقة الواحدة
  final int sets;

  const CartPackage({
    required this.id,
    required this.routeId,
    required this.name,
    required this.price,
    required this.items,
    this.isRoutine = false,
    this.coverUrl,
    this.sets = 1,
  });

  factory CartPackage.from(BeautyPackage p) => CartPackage(
        id: p.id,
        routeId: p.routeId,
        name: p.name,
        price: p.price,
        isRoutine: p.isRoutine,
        coverUrl: p.coverUrl ?? (p.thumbs.isNotEmpty ? p.thumbs.first : null),
        items: {for (final i in p.items) i.product.id: i.quantity},
      );

  CartPackage copyWith({int? sets}) => CartPackage(
        id: id,
        routeId: routeId,
        name: name,
        price: price,
        isRoutine: isRoutine,
        coverUrl: coverUrl,
        items: items,
        sets: sets ?? this.sets,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'routeId': routeId,
        'name': name,
        'price': price,
        'isRoutine': isRoutine,
        'coverUrl': coverUrl,
        'items': items,
        'sets': sets,
      };

  factory CartPackage.fromJson(Map<String, dynamic> j) => CartPackage(
        id: j['id'].toString(),
        routeId: (j['routeId'] ?? j['id']).toString(),
        name: (j['name'] ?? '').toString(),
        price: (j['price'] as num?)?.toInt() ?? 0,
        isRoutine: j['isRoutine'] == true,
        coverUrl: j['coverUrl']?.toString(),
        items: Map<String, dynamic>.from(j['items'] as Map? ?? const {})
            .map((k, v) => MapEntry(k, (v as num?)?.toInt() ?? 1)),
        sets: (j['sets'] as num?)?.toInt() ?? 1,
      );
}

/// حالة باقة داخل السلة الآن: كم نسخة مكتملة، التوفير، وما ينقصها.
class CartPackageStatus {
  final CartPackage pack;
  final int completeSets;
  final int itemsTotal;
  final int saving;
  final List<String> missingProductIds;
  const CartPackageStatus({
    required this.pack,
    required this.completeSets,
    required this.itemsTotal,
    required this.saving,
    required this.missingProductIds,
  });
  bool get complete => completeSets > 0;
}

class CartPackagesNotifier extends StateNotifier<List<CartPackage>> {
  CartPackagesNotifier() : super(const []) {
    _load();
  }

  static const _key = 'cart_packages_v1';

  Future<void> _load() async {
    try {
      final raw = (await SharedPreferences.getInstance()).getString(_key);
      if (raw == null) return;
      state = (jsonDecode(raw) as List).map((e) => CartPackage.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    } catch (_) {}
  }

  Future<void> _persist() async {
    (await SharedPreferences.getInstance()).setString(_key, jsonEncode(state.map((e) => e.toJson()).toList()));
  }

  void add(BeautyPackage p) {
    final i = state.indexWhere((e) => e.id == p.id);
    state = i >= 0
        ? [for (final e in state) e.id == p.id ? e.copyWith(sets: e.sets + 1) : e]
        : [...state, CartPackage.from(p)];
    _persist();
  }

  void remove(String id) {
    state = state.where((e) => e.id != id).toList();
    _persist();
  }

  void clear() {
    state = const [];
    _persist();
  }
}

final cartPackagesProvider =
    StateNotifierProvider<CartPackagesNotifier, List<CartPackage>>((ref) => CartPackagesNotifier());

/// حالة كل باقة في السلة — بنفس قاعدة السيرفر: القطعة لا تُحسب لباقتين.
final cartPackageStatusProvider = Provider<List<CartPackageStatus>>((ref) {
  final cart = ref.watch(cartProvider);
  final packs = ref.watch(cartPackagesProvider);
  if (packs.isEmpty) return const [];
  final left = <String, int>{};
  final price = <String, int>{};
  for (final it in cart.items) {
    left[it.productId] = (left[it.productId] ?? 0) + it.quantity;
    price[it.productId] = it.price;
  }
  final out = <CartPackageStatus>[];
  for (final p in packs) {
    var sets = p.sets;
    final missing = <String>[];
    p.items.forEach((pid, need) {
      final have = (left[pid] ?? 0) ~/ need;
      if (have == 0) missing.add(pid);
      if (have < sets) sets = have;
    });
    final itemsTotal = p.items.entries.fold<int>(0, (s, e) => s + (price[e.key] ?? 0) * e.value);
    final perSet = itemsTotal - p.price;
    if (sets > 0) {
      p.items.forEach((pid, need) => left[pid] = (left[pid] ?? 0) - sets * need);
    }
    out.add(CartPackageStatus(
      pack: p,
      completeSets: sets,
      itemsTotal: itemsTotal,
      saving: sets > 0 && perSet > 0 ? perSet * sets : 0,
      missingProductIds: missing,
    ));
  }
  return out;
});

/// مجموع توفير الباقات المكتملة في السلة.
final cartPackageSavingProvider = Provider<int>(
  (ref) => ref.watch(cartPackageStatusProvider).fold<int>(0, (s, e) => s + e.saving),
);
