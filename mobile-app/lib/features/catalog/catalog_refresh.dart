import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../data/services/api_service.dart';
import '../shell/main_shell.dart' show navIndexProvider;
import '../shell/nav_tabs.dart';
import '../worlds/worlds_provider.dart';
import 'catalog_providers.dart';

DateTime? _lastStorefrontRefresh;

/// أقل مدة بين تحديثين عند العودة للتطبيق.
const _resumeThrottle = Duration(minutes: 3);

/// كاش القوائم بكل إصداراته (products_v2 / v3 / v4…) وكاش تفاصيل المنتجات.
const _listingsCachePrefix = 'products_v';
const _productCachePrefix = 'product_v2_';

/// يجلب أحدث بيانات المتجر (سحب للتحديث / بعد تعديل من لوحة التحكم).
///
/// الجلب من الشبكة إجباري: فشلها يُرمى بدل إعادة النسخة المحفوظة، فيُرجع false ويبقى كل
/// شيء معروضاً كما هو (لا يُمسح كاش) — لتعرض الشاشة «لا يوجد اتصال — نعرض آخر نسخة
/// محفوظة». عند النجاح (true) يُمسح كاش القوائم والمنتجات ليُجلب من جديد عند فتحها،
/// وتُبطَل المزوّدات فتقرأ ما وصل للتو من الكاش — بلا تنزيل ثانٍ.
Future<bool> refreshStorefrontCatalog(WidgetRef ref) async {
  final cache = ref.read(apiCacheProvider);
  final api = ref.read(apiServiceProvider);
  final slug = resolveWorldSlug(
    selected: ref.read(selectedWorldSlugProvider),
    worlds: ref.read(worldsProvider).valueOrNull,
  );

  // ليست شرطاً لنجاح التحديث: فشلها وحدها يُبقي نسختها المحفوظة.
  // البراندات بنفس طلب brandsProvider (all: true) — نفس مفتاح الكاش فيقرأ الجديد بعد الإبطال.
  final extras = Future.wait([
    api.getBrands(all: true, forceRefresh: true, staleOnError: false).then<void>((_) {}, onError: (_) {}),
    if (slug != null)
      api.getWorld(slug, forceRefresh: true, staleOnError: false).then<void>((_) {}, onError: (_) {}),
  ]);
  try {
    await Future.wait([
      api.getWorlds(forceRefresh: true, staleOnError: false),
      api.getHome(worldSlug: slug, forceRefresh: true, staleOnError: false),
      api.getCategories(forceRefresh: true, staleOnError: false),
    ]);
  } catch (_) {
    return false; // بلا اتصال: نبقي ما هو معروض كما هو.
  }
  await extras;

  await cache.removePrefix(_listingsCachePrefix);
  await cache.removePrefix(_productCachePrefix);
  _lastStorefrontRefresh = DateTime.now();

  try {
    ref.invalidate(worldsProvider);
    if (slug != null) {
      ref.invalidate(worldFeedProvider(slug));
      ref.invalidate(worldDetailProvider(slug));
    } else {
      ref.invalidate(homeFeedProvider);
    }
    ref.invalidate(categoriesProvider);
    ref.invalidate(brandsProvider);
  } catch (_) {
    // الشاشة التي طلبت التحديث أُغلقت أثناء الجلب — الكاش محدَّث وتقرؤه المزوّدات عند بنائها.
    return true;
  }
  // العروض في الخلفية — لا تؤخر انتهاء السحب.
  unawaited(
    api.getOffers(forceRefresh: true).then((_) => ref.invalidate(offersFeedProvider)).catchError((_) {}),
  );
  return true;
}

/// عند العودة للتطبيق: تحديث خفيف مرة كل 3 دقائق على الأكثر — العوالم، وواجهة العالم
/// الظاهر فقط إن كانت الرئيسية هي التبويب المفتوح (لا تنزيل ولا إعادة بناء لواجهة مخفية
/// خلف السلة أو الدفع).
///
/// يُرجع false إن تعذّر الاتصال (لا يتغيّر شيء)، و true إن نجح أو لم يحن موعده بعد.
Future<bool> refreshStorefrontCatalogOnResume(WidgetRef ref) async {
  final now = DateTime.now();
  final last = _lastStorefrontRefresh;
  if (last != null && now.difference(last) < _resumeThrottle) return true;
  _lastStorefrontRefresh = now;

  final api = ref.read(apiServiceProvider);
  final onHome = ref.read(navIndexProvider) == NavTabs.home;
  final slug = resolveWorldSlug(
    selected: ref.read(selectedWorldSlugProvider),
    worlds: ref.read(worldsProvider).valueOrNull,
  );
  try {
    await Future.wait([
      api.getWorlds(forceRefresh: true, staleOnError: false),
      if (onHome) api.getHome(worldSlug: slug, forceRefresh: true, staleOnError: false),
    ]);
  } catch (_) {
    return false;
  }
  try {
    ref.invalidate(worldsProvider);
    if (onHome) {
      if (slug != null) {
        ref.invalidate(worldFeedProvider(slug));
      } else {
        ref.invalidate(homeFeedProvider);
      }
    }
  } catch (_) {
    // أُغلق صاحب ref أثناء الجلب — الكاش محدَّث ويُقرأ عند البناء التالي.
  }
  return true;
}
