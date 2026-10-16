import 'dart:collection';

import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';

/// بيانات البطاقة التي فُتح منها المنتج — تُعرض صفحته فوراً بها (الصورة، الاسم،
/// السعر، الدرجات) ريثما تصل التفاصيل الكاملة، بدل هيكل تحميل فارغ.
abstract final class ProductSeeds {
  static const _limit = 40;
  static final LinkedHashMap<String, Product> _seeds = LinkedHashMap();

  static void put(Product p) {
    for (final key in {p.id, if (p.slug.isNotEmpty) p.slug}) {
      _seeds.remove(key);
      _seeds[key] = p;
    }
    while (_seeds.length > _limit) {
      _seeds.remove(_seeds.keys.first);
    }
  }

  static Product? get(String idOrSlug) => _seeds[idOrSlug];
}

/// يفتح صفحة المنتج من بطاقة: يحفظ بياناتها أولاً ليظهر المنتج بلا انتظار.
void openProduct(BuildContext context, Product p) {
  ProductSeeds.put(p);
  context.push('/product/${p.slug.isNotEmpty ? p.slug : p.id}');
}
