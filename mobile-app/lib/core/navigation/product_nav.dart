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

  /// وسم صورة البطاقة التي فُتح منها المنتج (للانتقال المشترك) — يُستهلك مرة واحدة.
  static final Map<String, String> _heroTags = {};

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
      _heroTags.remove(oldest);
    }
  }

  /// يحفظ وسم الصورة لفتح المنتج القادم (أو يمسح وسماً قديماً حين يكون null).
  static void putHeroTag(Product p, String? tag) {
    for (final key in {if (p.id.isNotEmpty) p.id, if (p.slug.isNotEmpty) p.slug}) {
      if (tag == null) {
        _heroTags.remove(key);
      } else {
        _heroTags[key] = tag;
      }
    }
  }

  /// وسم الصورة لهذا الفتح — يُمسح بعد قراءته حتى لا يطير فتح لاحق من بطاقة قديمة.
  static String? takeHeroTag(String idOrSlug) {
    final tag = _heroTags.remove(idOrSlug);
    if (tag != null) _heroTags.removeWhere((_, v) => v == tag);
    return tag;
  }

  static Product? get(String idOrSlug) => _seeds[idOrSlug];

  /// هل البذرة المحفوظة لهذا المنتج مختصرة؟ (false إن لم توجد بذرة أصلاً.)
  static bool isLite(String idOrSlug) => _lite.contains(idOrSlug);
}

/// يفتح صفحة المنتج من بطاقة: يحفظ بياناتها أولاً ليظهر المنتج بلا انتظار.
///
/// [heroTag]: وسم `Hero` حول صورة البطاقة — تطير الصورة منها إلى معرض الصفحة.
/// يجب أن يكون فريداً في المسار كله (الشاشة + القسم + المنتج).
void openProduct(BuildContext context, Product p, {String? heroTag}) {
  ProductSeeds.put(p);
  ProductSeeds.putHeroTag(p, heroTag);
  context.push('/product/${p.slug.isNotEmpty ? p.slug : p.id}');
}
