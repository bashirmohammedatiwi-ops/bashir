import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/product.dart';
import '../../data/services/api_service.dart';

const _key = 'recently_viewed_v2';

/// النسخة الأولى حُفظت بلا تدرجات (فتُضاف أحمر الشفاه للسلة بلا لون) — تُهمل وتُمسح.
const _legacyKey = 'recently_viewed_v1';
const _max = 12;

/// كم بطاقة نحدّث من السيرفر بعد التحميل — الأولى هي الظاهرة في الرفوف.
const _refreshCount = 6;

/// نسخة خفيفة من المنتج تكفي لبطاقته: الاسمان، البراند، الصورة، التدرجات والأحجام —
/// حتى يفتح زر الإضافة اختيار اللون بعد إعادة التشغيل كما في القوائم.
Map<String, dynamic> productListSnapshot(Product p) {
  final m = <String, dynamic>{
    'id': p.id,
    'sku': p.sku,
    'name': p.name,
    if (p.nameAr != null) 'nameAr': p.nameAr,
    if (p.nameEn != null) 'nameEn': p.nameEn,
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
    '_count': {'shades': p.shadeCount},
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
  final brand = p.brand;
  if (brand != null) {
    m['brand'] = {
      'id': brand.id,
      'name': brand.name,
      if (brand.nameAr != null) 'nameAr': brand.nameAr,
      if (brand.nameEn != null) 'nameEn': brand.nameEn,
      'slug': brand.slug,
    };
  }
  final shades = p.displayableShades;
  if (shades.isNotEmpty) {
    m['shades'] = [
      for (final s in shades)
        {
          'id': s.id,
          'name': s.name,
          'colorHex': s.colorHex,
          if (s.colorHexEnd != null) 'colorHexEnd': s.colorHexEnd,
          if (s.price != null) 'price': s.price,
          if (s.originalPrice != null) 'originalPrice': s.originalPrice,
          'stock': s.stock,
          // التدرجات المعروضة هي ذات الباركود — والعلامة تحفظ ذلك بدل الباركود نفسه.
          'hasBarcode': true,
          if (s.image?.thumb.isNotEmpty == true)
            'image': {
              'variants': {
                'thumb': {'url': s.image!.thumb},
              },
            },
        },
    ];
  }
  if (p.variants.isNotEmpty) {
    m['variants'] = [
      for (final v in p.variants)
        {
          'id': v.id,
          'label': v.label,
          if (v.sizeLabel != null) 'sizeLabel': v.sizeLabel,
          'priceDelta': v.priceDelta,
          'stock': v.stock,
        },
    ];
  }
  return m;
}

/// «شاهدتِها مؤخراً»: آخر 12 منتجاً، محفوظة على الجهاز.
class RecentlyViewedNotifier extends StateNotifier<List<Product>> {
  RecentlyViewedNotifier(this._ref) : super(const []) {
    unawaited(_ready);
  }

  final Ref _ref;

  /// كل تعديل ينتظر اكتمال التحميل — وإلا كتبت الإضافة الأولى فوق السجل المحفوظ.
  late final Future<void> _ready = _load();

  Future<void> _load() async {
    final List<Product> saved;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.containsKey(_legacyKey)) unawaited(prefs.remove(_legacyKey));
      final raw = prefs.getString(_key);
      if (raw == null || !mounted) return;
      saved = (jsonDecode(raw) as List)
          .map((e) => Product.fromJson(Map<String, dynamic>.from(e as Map)))
          .where((p) => p.id.isNotEmpty)
          .toList();
    } catch (_) {
      // تخزين تالف أو غير متاح: نبدأ بقائمة فارغة — والإضافة لا تنتظر للأبد.
      return;
    }
    if (!mounted) return;
    // ما في الذاكرة أحدث من المحفوظ: نضيف إليه ولا نستبدله.
    final inMemory = {for (final p in state) p.id};
    state = _merge(state, saved);
    // النسخ المحفوظة فقط تحتاج تحديثاً — ما شوهد في هذه الجلسة وصل من السيرفر للتو.
    final stale = state
        .where((p) => !inMemory.contains(p.id))
        .take(_refreshCount)
        .map((p) => p.id)
        .toList(growable: false);
    if (stale.isNotEmpty) unawaited(_refreshSnapshots(stale));
  }

  static List<Product> _merge(List<Product> first, List<Product> rest) {
    final ids = {for (final p in first) p.id};
    return [...first, ...rest.where((p) => !ids.contains(p.id))].take(_max).toList();
  }

  /// السعر والمخزون في النسخ المحفوظة قد يكونان قديمين: نحدّث أول البطاقات بهدوء
  /// من السيرفر بطلب واحد (بعد أن تأخذ الشاشة الأولى حاجتها من الشبكة)، ونحذف ما لم
  /// يعد في المتجر.
  Future<void> _refreshSnapshots(List<String> ids) async {
    // النسخ المحفوظة نفسها: ما فتحته الزبونة في الأثناء يصبح نسخة جديدة كاملة فلا نلمسه.
    final saved = {for (final p in state) p.id: p};
    await Future<void>.delayed(const Duration(seconds: 3));
    if (!mounted) return;
    final api = _ref.read(apiServiceProvider);
    final List<Product> batch;
    try {
      // staleOnError: false — بلا اتصال لا نعدّ نسخة محفوظة تحققاً (ولا غياباً عنها حذفاً).
      batch = await api.getProductsByIds(ids, staleOnError: false);
    } catch (_) {
      return; // بلا اتصال: تبقى النسخ كما هي حتى التشغيل القادم.
    }
    if (!mounted) return;
    final fresh = {for (final p in batch) p.id: p};
    // الغائب عن الدفعة: حُذف أو أُوقف — أو أخفته إعدادات القوائم (نافد، بلا صورة)، فصفحته
    // وحدها تفصل (عادة لا شيء هنا).
    final gone = <String>{};
    for (final id in ids.where((id) => !fresh.containsKey(id))) {
      try {
        final p = await api.getProduct(id);
        if (p.id == id) fresh[id] = p;
      } on ApiException catch (e) {
        if (e.status == 404 || e.status == 410) gone.add(id);
      } catch (_) {}
      if (!mounted) return;
    }
    // قد تكون الزبونة فتحت أحدها (فصار أول القائمة بنسخة كاملة) أو مسحت السجل في الأثناء:
    // نحدّث ما بقي من النسخ المحفوظة فقط.
    var changed = false;
    final next = <Product>[];
    for (final e in state) {
      final untouched = identical(saved[e.id], e);
      if (untouched && gone.contains(e.id)) {
        changed = true; // لا نعرض بطاقة لا تفتح.
        continue;
      }
      final update = untouched ? fresh[e.id] : null;
      if (update != null) changed = true;
      next.add(update ?? e);
    }
    if (!changed) return;
    state = next;
    await _persist();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    await prefs.setString(_key, jsonEncode(state.map(productListSnapshot).toList()));
  }

  Future<void> add(Product product) async {
    if (product.id.isEmpty) return;
    await _ready;
    if (!mounted) return;
    state = [product, ...state.where((p) => p.id != product.id)].take(_max).toList();
    await _persist();
  }

  /// «تراجع» بعد المسح: تعود القائمة السابقة، وما شوهد بعد المسح يبقى أولاً.
  Future<void> restore(List<Product> items) async {
    await _ready;
    if (!mounted) return;
    state = _merge(state, items.where((p) => p.id.isNotEmpty).toList());
    await _persist();
  }

  Future<void> clear() async {
    await _ready;
    if (!mounted) return;
    state = const [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

final recentlyViewedProvider =
    StateNotifierProvider<RecentlyViewedNotifier, List<Product>>((ref) {
  return RecentlyViewedNotifier(ref);
});
