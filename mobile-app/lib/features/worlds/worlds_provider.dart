import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils/barcode_util.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/models/store_world.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';

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
///
/// العالم المعروض أولاً؛ البقية بالتتابع بعد لحظة — لا نحمّل كل العوالم دفعة
/// واحدة مع أول إطار فنزاحم تحميل الشاشة الظاهرة.
bool _prefetching = false;
String? _prefetchedFor;
void prefetchWorldContent(dynamic ref, List<StoreWorld> worlds) {
  final signature = worlds.map((w) => w.slug).join('|');
  if (_prefetching || worlds.isEmpty || _prefetchedFor == signature) return;
  _prefetching = true;
  _prefetchedFor = signature;
  Future<void>(() async {
    try {
      await Future<void>.delayed(const Duration(milliseconds: 1200));
      for (final world in worlds) {
        try {
          await ref.read(worldDetailProvider(world.slug).future);
          await ref.read(worldFeedProvider(world.slug).future);
        } catch (_) {}
      }
    } finally {
      _prefetching = false;
    }
  });
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

/// الواجهة الرئيسية المعروضة فعلاً: العالم المختار، أو العامة فقط إن لم تكن هناك عوالم.
/// مصدر الإعدادات (واتساب، حد التوصيل المجاني…) — بدل جلب واجهة عامة لا تُعرض.
final activeHomeFeedProvider = Provider<AsyncValue<HomeFeed>>((ref) {
  final worlds = ref.watch(worldsProvider).valueOrNull;
  final slug = resolveWorldSlug(selected: ref.watch(selectedWorldSlugProvider), worlds: worlds);
  if (slug != null) return ref.watch(worldFeedProvider(slug));
  if (worlds != null && worlds.isEmpty) return ref.watch(homeFeedProvider);
  return const AsyncValue.loading();
});
