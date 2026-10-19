import 'dart:collection';

import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';

/// بيانات البطاقة التي فُتح منها المنتج — تُعرض صفحته فوراً بها (الصورة، الاسم،
/// السعر، الدرجات) ريثما تصل التفاصيل الكاملة، بدل هيكل تحميل فارغ.
abstract final class ProductSeeds {
  static const _limit = 40;
  static final LinkedHashMap<String, Product> _seeds = LinkedHashMap();

  /// مفاتيح البذور المختصرة (من لوحة البحث الفوري مثلاً): بلا درجات ولا مخزون
  /// دقيق، فلا تُتاح الإضافة للسلة منها حتى تصل تفاصيل المنتج الكاملة.
  static final Set<String> _lite = {};

  static void put(Product p, {bool lite = false}) {
    for (final key in {if (p.id.isNotEmpty) p.id, if (p.slug.isNotEmpty) p.slug}) {
      final existing = _seeds.remove(key);
      // بذرة مختصرة لا تحلّ محلّ بذرة كاملة للمنتج نفسه — تتقدّم الكاملة فقط.
      if (lite && existing != null && !_lite.contains(key)) {
        _seeds[key] = existing;
        continue;
      }
      _seeds[key] = p;
      if (lite) {
        _lite.add(key);
      } else {
        _lite.remove(key);
      }
    }
    while (_seeds.length > _limit) {
      final oldest = _seeds.keys.first;
      _seeds.remove(oldest);
      _lite.remove(oldest);
    }
  }

  static Product? get(String idOrSlug) => _seeds[idOrSlug];

  /// هل البذرة المحفوظة لهذا المنتج مختصرة؟ (false إن لم توجد بذرة أصلاً.)
  static bool isLite(String idOrSlug) => _lite.contains(idOrSlug);
}

/// يفتح صفحة المنتج من بطاقة: يحفظ بياناتها أولاً ليظهر المنتج بلا انتظار.
void openProduct(BuildContext context, Product p) {
  ProductSeeds.put(p);
  context.push('/product/${p.slug.isNotEmpty ? p.slug : p.id}');
}
