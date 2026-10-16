import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../data/services/api_service.dart';
import '../worlds/worlds_provider.dart';
import 'catalog_providers.dart';

DateTime? _lastStorefrontRefresh;

/// يجلب أحدث بيانات المتجر (سحب للتحديث / بعد تعديل من لوحة التحكم).
///
/// لا يمسح الكاش قبل الجلب: النسخة الحالية تبقى معروضة حتى تصل الجديدة،
/// وبلا إنترنت لا يضيع شيء. كاش القوائم والمنتجات يُمسح فقط بعد نجاح الاتصال.
Future<void> refreshStorefrontCatalog(WidgetRef ref) async {
  final cache = ref.read(apiCacheProvider);
  final api = ref.read(apiServiceProvider);
  final slug = resolveWorldSlug(
    selected: ref.read(selectedWorldSlugProvider),
    worlds: ref.read(worldsProvider).valueOrNull,
  );
  try {
    await Future.wait([
      api.getWorlds(forceRefresh: true),
      api.getHome(worldSlug: slug, forceRefresh: true),
      api.getCategories(forceRefresh: true),
    ]);
  } catch (_) {
    return; // بلا اتصال: نبقي ما هو معروض كما هو.
  }
  await cache.removePrefix('products_v3');
  await cache.removePrefix('products_v2');
  await cache.removePrefix('product_v2_');

  ref.invalidate(worldsProvider);
  if (slug != null) {
    ref.invalidate(worldFeedProvider(slug));
    ref.invalidate(worldDetailProvider(slug));
  } else {
    ref.invalidate(homeFeedProvider);
  }
  ref.invalidate(categoriesProvider);
  ref.invalidate(brandsProvider);
  _lastStorefrontRefresh = DateTime.now();
  // العروض في الخلفية — لا تؤخر انتهاء السحب.
  api.getOffers(forceRefresh: true).then((_) => ref.invalidate(offersFeedProvider)).catchError((_) {});
}

/// عند العودة للتطبيق: تحديث خفيف للعالم المعروض فقط، مرة كل 3 دقائق على الأكثر.
Future<void> refreshStorefrontCatalogOnResume(WidgetRef ref) async {
  final last = _lastStorefrontRefresh;
  if (last != null && DateTime.now().difference(last) < const Duration(minutes: 3)) {
    return;
  }
  _lastStorefrontRefresh = DateTime.now();
  final api = ref.read(apiServiceProvider);
  final slug = resolveWorldSlug(
    selected: ref.read(selectedWorldSlugProvider),
    worlds: ref.read(worldsProvider).valueOrNull,
  );
  try {
    await Future.wait([
      api.getWorlds(forceRefresh: true),
      api.getHome(worldSlug: slug, forceRefresh: true),
    ]);
    ref.invalidate(worldsProvider);
    if (slug != null) {
      ref.invalidate(worldFeedProvider(slug));
    } else {
      ref.invalidate(homeFeedProvider);
    }
  } catch (_) {}
}
