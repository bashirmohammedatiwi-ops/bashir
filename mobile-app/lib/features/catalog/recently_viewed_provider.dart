import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/product.dart';

const _key = 'recently_viewed_v1';
const _max = 12;

Map<String, dynamic> productListSnapshot(Product p) {
  final m = <String, dynamic>{
    'id': p.id,
    'sku': p.sku,
    'name': p.name,
    'slug': p.slug,
    'price': p.price,
    'originalPrice': p.originalPrice,
    'discountPercent': p.discountPercent,
    'rating': p.rating,
    'reviewCount': p.reviewCount,
    'stock': p.stock,
    'soldCount': p.soldCount,
    'isNew': p.isNew,
    'isBestSeller': p.isBestSeller,
    'isFeatured': p.isFeatured,
    'isPromo': p.isPromo,
  };
  final url = p.coverUrl;
  if (url.isNotEmpty) {
    m['images'] = [
      {
        'id': '',
        'isPrimary': true,
        'media': {
          'variants': {
            'thumb': {'url': url},
            'medium': {'formats': {'webp': url}},
          }
        }
      }
    ];
  }
  if (p.brand != null) {
    m['brand'] = {
      'id': p.brand!.id,
      'name': p.brand!.name,
      'slug': p.brand!.slug,
    };
  }
  return m;
}

class RecentlyViewedNotifier extends StateNotifier<List<Product>> {
  RecentlyViewedNotifier() : super(const []) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      final list = (jsonDecode(raw) as List)
          .map((e) => Product.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      state = list;
    } catch (_) {}
  }

  Future<void> add(Product product) async {
    if (product.id.isEmpty) return;
    final items = [product, ...state.where((p) => p.id != product.id)].take(_max).toList();
    state = items;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode(items.map(productListSnapshot).toList()),
    );
  }

  Future<void> clear() async {
    state = const [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

final recentlyViewedProvider =
    StateNotifierProvider<RecentlyViewedNotifier, List<Product>>((ref) {
  return RecentlyViewedNotifier();
});
