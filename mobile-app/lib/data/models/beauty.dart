import '../../core/utils/media_url.dart';
import '../../core/utils/json.dart';
import 'product.dart';

/// أنواع البشرة — نفس قيم السيرفر ولوحة التحكم.
enum SkinType { dry, oily, combination, normal, sensitive }

extension SkinTypeX on SkinType {
  String get key => name;
  String get labelAr => switch (this) {
        SkinType.dry => 'جافة',
        SkinType.oily => 'دهنية',
        SkinType.combination => 'مختلطة',
        SkinType.normal => 'عادية',
        SkinType.sensitive => 'حساسة',
      };
  String get labelEn => switch (this) {
        SkinType.dry => 'Dry',
        SkinType.oily => 'Oily',
        SkinType.combination => 'Combination',
        SkinType.normal => 'Normal',
        SkinType.sensitive => 'Sensitive',
      };
  String get emoji => switch (this) {
        SkinType.dry => '🏜️',
        SkinType.oily => '💧',
        SkinType.combination => '🌗',
        SkinType.normal => '🌸',
        SkinType.sensitive => '🌿',
      };

  /// وصف قصير بلهجة دافئة لنتيجة الاختبار.
  String get blurbAr => switch (this) {
        SkinType.dry => 'بشرتكِ تحتاج ترطيباً عميقاً وحاجزاً يحبس الرطوبة — ابتعدي عن الغسولات القاسية.',
        SkinType.oily => 'بشرتكِ تفرز دهوناً أكثر — تحتاجين تنظيفاً لطيفاً منتظماً ومرطباً خفيفاً غير زيتي.',
        SkinType.combination => 'منطقة T دهنية والخدود عادية أو جافة — وازني بين التنظيف والترطيب الخفيف.',
        SkinType.normal => 'بشرتكِ متوازنة — حافظي عليها بروتين بسيط وواقي شمس يومي.',
        SkinType.sensitive => 'بشرتكِ تتحسس بسهولة — اختاري تركيبات لطيفة خالية من العطور وجربي أي منتج أولاً.',
      };
}

SkinType? skinTypeFromKey(String? v) {
  for (final t in SkinType.values) {
    if (t.name == v) return t;
  }
  return null;
}

String? _url(dynamic v) {
  final s = v?.toString().trim() ?? '';
  return s.isEmpty ? null : resolveMediaUrl(s);
}

List<String> _strings(dynamic v) =>
    asList(v).map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();

/// مشكلة بشرة من «دليل البشرة».
class SkinConcern {
  final String id;
  final String slug;
  final String name;
  final String? subtitle;
  final String description;
  final String? icon;
  final String? color;
  final String? imageUrl;
  final int productCount;
  final List<String> causes;
  final List<String> tips;
  final List<String> ingredients;
  final List<String> avoid;
  final List<String> skinTypes;

  const SkinConcern({
    required this.id,
    required this.slug,
    required this.name,
    this.subtitle,
    this.description = '',
    this.icon,
    this.color,
    this.imageUrl,
    this.productCount = 0,
    this.causes = const [],
    this.tips = const [],
    this.ingredients = const [],
    this.avoid = const [],
    this.skinTypes = const [],
  });

  factory SkinConcern.fromJson(Map<String, dynamic> j) => SkinConcern(
        id: asString(j['id']),
        slug: asString(j['slug']),
        name: asString(j['nameAr'], asString(j['name'])),
        subtitle: (j['subtitle']?.toString().trim().isNotEmpty ?? false) ? j['subtitle'].toString() : null,
        description: asString(j['description']),
        icon: (j['icon']?.toString().trim().isNotEmpty ?? false) ? j['icon'].toString() : null,
        color: (j['color']?.toString().trim().isNotEmpty ?? false) ? j['color'].toString() : null,
        imageUrl: _url(j['imageUrl']),
        productCount: asInt(j['productCount']),
        causes: _strings(j['causes']),
        tips: _strings(j['tips']),
        ingredients: _strings(j['ingredients']),
        avoid: _strings(j['avoid']),
        skinTypes: _strings(j['skinTypes']),
      );

  bool get hasGuide => tips.isNotEmpty || causes.isNotEmpty || ingredients.isNotEmpty || avoid.isNotEmpty;
}

/// خطوة/منتج داخل باقة أو روتين.
class BeautyPackageItem {
  final String id;
  final String? stepTitle;
  final String? note;
  final int quantity;
  final Product product;

  const BeautyPackageItem({
    required this.id,
    required this.product,
    this.stepTitle,
    this.note,
    this.quantity = 1,
  });

  factory BeautyPackageItem.fromJson(Map<String, dynamic> j) => BeautyPackageItem(
        id: asString(j['id']),
        stepTitle: (j['stepTitle']?.toString().trim().isNotEmpty ?? false) ? j['stepTitle'].toString() : null,
        note: (j['note']?.toString().trim().isNotEmpty ?? false) ? j['note'].toString() : null,
        quantity: asInt(j['quantity'], 1).clamp(1, 10),
        product: Product.fromJson(asMap(j['product'])),
      );

  int get lineTotal => product.price * quantity;
}

/// باقة أو روتين (صباحي/مسائي) — الأسعار والتوفير محسوبة من السيرفر بأسعار اليوم.
class BeautyPackage {
  final String id;
  final String slug;
  final String name;
  final String subtitle;
  final String description;
  final String kind;
  final String? badge;
  final bool isFeatured;
  final int price;
  final int originalPrice;
  final int itemsTotal;
  final int saving;
  final int savingPercent;
  final DateTime? endsAt;
  final bool inStock;
  final String? coverUrl;
  final List<String> thumbs;
  final int stepCount;
  final List<String> concernSlugs;
  final List<String> skinTypes;
  final List<BeautyPackageItem> items;
  final List<BeautyPackage> related;

  const BeautyPackage({
    required this.id,
    required this.slug,
    required this.name,
    this.subtitle = '',
    this.description = '',
    this.kind = 'GENERAL',
    this.badge,
    this.isFeatured = false,
    required this.price,
    this.originalPrice = 0,
    this.itemsTotal = 0,
    this.saving = 0,
    this.savingPercent = 0,
    this.endsAt,
    this.inStock = true,
    this.coverUrl,
    this.thumbs = const [],
    this.stepCount = 0,
    this.concernSlugs = const [],
    this.skinTypes = const [],
    this.items = const [],
    this.related = const [],
  });

  factory BeautyPackage.fromJson(Map<String, dynamic> j) {
    final items = asList(j['items'])
        .map((e) => asMap(e))
        .where((e) => e['product'] is Map)
        .map(BeautyPackageItem.fromJson)
        .toList();
    final itemsTotal = asInt(j['itemsTotal'], items.fold<int>(0, (s, e) => s + e.lineTotal));
    final price = asInt(j['price']);
    return BeautyPackage(
      id: asString(j['id']),
      slug: asString(j['slug'], asString(j['id'])),
      name: asString(j['name']),
      subtitle: asString(j['subtitle']),
      description: asString(j['description']),
      kind: asString(j['kind'], 'GENERAL'),
      badge: (j['badge']?.toString().trim().isNotEmpty ?? false) ? j['badge'].toString() : null,
      isFeatured: asBool(j['isFeatured'], false),
      price: price,
      originalPrice: asInt(j['originalPrice'], itemsTotal),
      itemsTotal: itemsTotal,
      saving: asInt(j['saving'], (itemsTotal - price).clamp(0, 1 << 31)),
      savingPercent: asInt(j['savingPercent']),
      endsAt: DateTime.tryParse(j['endsAt']?.toString() ?? '')?.toLocal(),
      inStock: asBool(j['inStock'], true),
      coverUrl: _url(j['coverUrl']),
      thumbs: _strings(j['thumbs']).map((e) => resolveMediaUrl(e)).toList(),
      stepCount: asInt(j['stepCount'], items.length),
      concernSlugs: _strings(j['concernSlugs']),
      skinTypes: _strings(j['skinTypes']),
      items: items,
      related: asList(j['related']).map((e) => BeautyPackage.fromJson(asMap(e))).toList(),
    );
  }

  bool get isRoutine => kind.startsWith('ROUTINE_');
  bool get isMorning => kind == 'ROUTINE_MORNING';
  bool get isEvening => kind == 'ROUTINE_EVENING';
  bool get isBridal => kind == 'BRIDAL_KIT';
  bool get hasSaving => saving > 0;
  String get routeId => slug.isNotEmpty ? slug : id;

  /// العرض ما زال قائماً (لا موعد انتهاء أو لم يحن).
  bool get isLive => endsAt == null || endsAt!.isAfter(DateTime.now());
}

/// نتيجة «اختبار البشرة».
class SkinMatch {
  final SkinType? skinType;
  final BeautyPackage? morning;
  final BeautyPackage? evening;
  final List<BeautyPackage> routines;
  final List<({SkinConcern concern, List<Product> products})> concerns;

  const SkinMatch({
    this.skinType,
    this.morning,
    this.evening,
    this.routines = const [],
    this.concerns = const [],
  });

  factory SkinMatch.fromJson(Map<String, dynamic> j) => SkinMatch(
        skinType: skinTypeFromKey(j['skinType']?.toString()),
        morning: j['morning'] is Map ? BeautyPackage.fromJson(asMap(j['morning'])) : null,
        evening: j['evening'] is Map ? BeautyPackage.fromJson(asMap(j['evening'])) : null,
        routines: asList(j['routines']).map((e) => BeautyPackage.fromJson(asMap(e))).toList(),
        concerns: asList(j['concerns']).map((e) {
          final m = asMap(e);
          return (
            concern: SkinConcern.fromJson(asMap(m['concern'])),
            products: asList(m['products']).map((p) => Product.fromJson(asMap(p))).toList(),
          );
        }).toList(),
      );
}

/// صفحة الدليل لمشكلة.
class SkinGuide {
  final SkinConcern concern;
  final List<Product> products;
  final int productTotal;
  final List<BeautyPackage> routines;
  final List<SkinConcern> others;

  const SkinGuide({
    required this.concern,
    this.products = const [],
    this.productTotal = 0,
    this.routines = const [],
    this.others = const [],
  });

  factory SkinGuide.fromJson(Map<String, dynamic> j) => SkinGuide(
        concern: SkinConcern.fromJson(asMap(j['concern'])),
        products: asList(j['products']).map((p) => Product.fromJson(asMap(p))).toList(),
        productTotal: asInt(j['productTotal']),
        routines: asList(j['routines']).map((e) => BeautyPackage.fromJson(asMap(e))).toList(),
        others: asList(j['others']).map((e) => SkinConcern.fromJson(asMap(e))).toList(),
      );
}
