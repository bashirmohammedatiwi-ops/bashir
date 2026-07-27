import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../data/services/api_service.dart';
import 'catalog_providers.dart';

DateTime? _lastStorefrontRefresh;

/// يمسح كاش المتجر ويجلب أحدث بيانات من السيرفر (بعد تعديل من لوحة التحكم).
Future<void> refreshStorefrontCatalog(WidgetRef ref) async {
  final cache = ref.read(apiCacheProvider);
  await cache.remove('home_v3');
  await cache.remove('offers_v1');
  await cache.remove('categories_all_v2');
  await cache.removePrefix('products_v2');
  await cache.removePrefix('product_v2_');

  ref.invalidate(homeFeedProvider);
  ref.invalidate(offersFeedProvider);
  ref.invalidate(categoriesProvider);
  ref.invalidate(brandsProvider);

  final api = ref.read(apiServiceProvider);
  await Future.wait([
    api.getHome(forceRefresh: true),
    api.getCategories(forceRefresh: true),
  ]);
  try {
    await api.getOffers(forceRefresh: true);
  } catch (_) {}
  _lastStorefrontRefresh = DateTime.now();
}

/// تحديث خفيف عند العودة للتطبيق — لا يُكرَّر أكثر من مرة كل 45 ثانية.
Future<void> refreshStorefrontCatalogOnResume(WidgetRef ref) async {
  final last = _lastStorefrontRefresh;
  if (last != null && DateTime.now().difference(last) < const Duration(seconds: 45)) {
    return;
  }
  await refreshStorefrontCatalog(ref);
}
