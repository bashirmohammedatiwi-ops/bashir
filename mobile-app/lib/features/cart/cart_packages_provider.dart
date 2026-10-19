import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/beauty.dart';
import '../../data/services/api_service.dart';
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

  /// من آخر تحقق: السيرفر يتجاهل الباقة الموقوفة أو المنتهية عند الطلب.
  final bool isActive;
  final DateTime? endsAt;

  const CartPackage({
    required this.id,
    required this.routeId,
    required this.name,
    required this.price,
    required this.items,
    this.isRoutine = false,
    this.coverUrl,
    this.sets = 1,
    this.isActive = true,
    this.endsAt,
  });

  factory CartPackage.from(BeautyPackage p) => CartPackage(
        id: p.id,
        routeId: p.routeId,
        name: p.name,
        price: p.price,
        isRoutine: p.isRoutine,
        coverUrl: p.coverUrl ?? (p.thumbs.isNotEmpty ? p.thumbs.first : null),
        items: {for (final i in p.items) i.product.id: i.quantity},
        endsAt: p.endsAt,
      );

  /// صالحة الآن بقاعدة السيرفر: فعّالة ولم ينتهِ وقتها.
  bool get isLive => isActive && (endsAt == null || endsAt!.isAfter(DateTime.now()));

  CartPackage copyWith({int? sets, int? price, bool? isActive, DateTime? endsAt}) => CartPackage(
        id: id,
        routeId: routeId,
        name: name,
        price: price ?? this.price,
        isRoutine: isRoutine,
        coverUrl: coverUrl,
        items: items,
        sets: sets ?? this.sets,
        isActive: isActive ?? this.isActive,
        endsAt: endsAt ?? this.endsAt,
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
        'isActive': isActive,
        if (endsAt != null) 'endsAt': endsAt!.toUtc().toIso8601String(),
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
        isActive: j['isActive'] != false,
        endsAt: DateTime.tryParse(j['endsAt']?.toString() ?? '')?.toLocal(),
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

/// كم قطعة من منتج في السلة (كل تدرجاته معاً) — لإكمال باقة بما ينقصها فقط.
int quantityForProduct(CartState c, String productId) =>
    c.items.where((e) => e.productId == productId).fold(0, (s, e) => s + e.quantity);

class CartPackagesNotifier extends StateNotifier<List<CartPackage>> {
  CartPackagesNotifier(this._ref) : super(const []) {
    _load();
  }

  final Ref _ref;

  static const _key = 'cart_packages_v1';

  Future<void> _load() async {
    try {
      final raw = (await SharedPreferences.getInstance()).getString(_key);
      if (raw == null || !mounted) return;
      final saved = (jsonDecode(raw) as List).map((e) => CartPackage.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      // ما أُضيف قبل اكتمال التحميل يبقى مع المحفوظ.
      final added = state;
      state = [...saved.where((p) => !added.any((e) => e.id == p.id)), ...added];
      if (added.isNotEmpty) _persist();
    } catch (_) {}
  }

  Future<void> _persist() async {
    (await SharedPreferences.getInstance()).setString(_key, jsonEncode(state.map((e) => e.toJson()).toList()));
  }

  void add(BeautyPackage p) {
    final i = state.indexWhere((e) => e.id == p.id);
    // نسخة إضافية تأخذ سعر الباقة وصلاحيتها كما وصلت الآن.
    state = i >= 0
        ? [for (final e in state) e.id == p.id ? CartPackage.from(p).copyWith(sets: e.sets + 1) : e]
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

  /// يُستدعى مع تحقق السلة: يجدّد سعر كل باقة وصلاحيتها ومحتواها (منتجاتها وكمياتها — السيرفر
  /// يحسب التوفير من محتواها الحالي) ويزيل ما انتهى أو أُوقف أو فرغ (السيرفر يعيد 404 للأولين).
  /// يعيد أسماء الباقات المُزالة والتي تغيّر محتواها، ولا يرمي خطأً أبداً:
  /// ما تعذّر الوصول إليه يبقى كما هو إلا إن انتهى وقته على الجهاز.
  Future<({List<String> dropped, List<String> changed})> revalidate() async {
    if (state.isEmpty) return (dropped: const <String>[], changed: const <String>[]);
    final api = _ref.read(apiServiceProvider);
    // null = لم تعد متاحة؛ غياب المفتاح = تعذّر الوصول.
    final fresh = <String, BeautyPackage?>{};
    await Future.wait(state.map((p) async {
      try {
        fresh[p.id] = await api.getPackage(p.routeId);
      } on ApiException catch (e) {
        if (e.status == 404) fresh[p.id] = null;
      } catch (_) {}
    }));
    if (!mounted) return (dropped: const <String>[], changed: const <String>[]);
    final dropped = <String>[];
    final changed = <String>[];
    final next = <CartPackage>[];
    for (final p in state) {
      final CartPackage current;
      if (!fresh.containsKey(p.id)) {
        current = p;
      } else {
        final live = fresh[p.id];
        final items = live == null ? p.items : {for (final i in live.items) i.product.id: i.quantity};
        current = live == null || items.isEmpty
            ? p.copyWith(isActive: false)
            : CartPackage(
                id: p.id,
                routeId: p.routeId,
                name: p.name,
                price: live.price,
                isRoutine: p.isRoutine,
                coverUrl: p.coverUrl,
                items: items,
                sets: p.sets,
                endsAt: live.endsAt,
              );
        if (current.isLive && !mapEquals(items, p.items)) changed.add(current.name);
      }
      if (current.isLive) {
        next.add(current);
      } else {
        dropped.add(current.name);
      }
    }
    if (jsonEncode(next.map((e) => e.toJson()).toList()) != jsonEncode(state.map((e) => e.toJson()).toList())) {
      state = next;
      _persist();
    }
    return (dropped: dropped, changed: changed);
  }
}

final cartPackagesProvider =
    StateNotifierProvider<CartPackagesNotifier, List<CartPackage>>((ref) => CartPackagesNotifier(ref));

/// حالة كل باقة في السلة — بنفس قاعدة السيرفر: القطعة لا تُحسب لباقتين، والباقة
/// الموقوفة أو المنتهية لا توفير لها.
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
    // انتهت أو أُوقفت (قبل أن يزيلها التحقق التالي): لا تحجز قطعاً ولا توفير لها.
    if (!p.isLive) continue;
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
