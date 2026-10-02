import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils/barcode_util.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/models/store_world.dart';
import '../../data/services/api_service.dart';

/// العالم الظاهر داخل الرئيسية وصفحة الأقسام. التبديل لا يفتح صفحة جديدة.
final selectedWorldSlugProvider = StateProvider<String?>((ref) => null);

/// أول عالم غير الهدايا عندما لا يوجد اختيار بعد. يمنع ظهور الرئيسية القديمة.
String? resolveWorldSlug({required String? selected, required List<StoreWorld>? worlds}) {
  if (worlds == null || worlds.isEmpty) return selected;
  if (selected != null && worlds.any((world) => world.slug == selected)) return selected;
  final featured = worlds.where((world) => !world.isGift);
  return (featured.isEmpty ? worlds.first : featured.first).slug;
}

final worldsProvider = FutureProvider<List<StoreWorld>>((ref) async {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getWorlds();
});

final worldDetailProvider = FutureProvider.family<StoreWorld, String>((ref, slug) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getWorld(slug);
});

final worldFeedProvider = FutureProvider.family<HomeFeed, String>((ref, slug) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getHome(worldSlug: slug);
});

/// يجهّز كل العوالم في الخلفية حتى يكون التبديل فورياً.
void prefetchWorldContent(dynamic ref, List<StoreWorld> worlds) {
  for (final world in worlds) {
    ref.read(worldDetailProvider(world.slug).future);
    ref.read(worldFeedProvider(world.slug).future);
  }
}

final worldProductSearchProvider =
    FutureProvider.autoDispose.family<List<Product>, ({String slug, String query})>((ref, args) async {
  final q = args.query.trim();
  if (q.length < 2) return const [];
  final result = await ref.read(apiServiceProvider).searchProducts(q, limit: 30);
  // الباركود يبحث في كل العوالم — لا يُقيَّد بأقسام العالم الحالي.
  if (isBarcodeSearchQuery(q)) return result.items;
  final world = await ref.watch(worldDetailProvider(args.slug).future);
  final roots = world.rootCategoryIds.toSet();
  if (roots.isEmpty) return result.items;
  return result.items.where((p) => p.category != null && roots.contains(p.category!.id)).toList();
});
