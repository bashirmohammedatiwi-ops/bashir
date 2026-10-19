import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/utils/barcode_util.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/models/store_settings.dart';
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

/// تفاصيل عالم فشل تحميلها تبقى خطأً حتى يُعاد طلبها (لا تعيد المحاولة وحدها):
/// يُستدعى عند التبديل إليه أو العودة للتطبيق، فتعود ألوانه وأقسامه بدل لوحة المتجر
/// العامة. واجهته (worldFeedProvider) لها تحديثها الخاص في الرئيسية فلا تُطلب مرتين.
void retryWorldIfErrored(WidgetRef ref, String slug) {
  if (ref.read(worldDetailProvider(slug)).hasError) ref.invalidate(worldDetailProvider(slug));
}

/// يجهّز العوالم الأخرى في الخلفية حتى يكون التبديل فورياً.
///
/// لا يبدأ قبل أن تصل واجهة العالم الظاهر (لا نزاحمها على الشبكة)، ثم الجارين
/// (يمين ويسار في المحدّد) ثم البقية بالتتابع. الفشل لا يُحفظ: العالم الذي تعذّر
/// يُعاد طلبه حين يُفتح، والجولة كلها تُعاد لاحقاً.
bool _prefetching = false;
String? _prefetchedFor;
DateTime? _prefetchFailedAt;

/// مهلة قبل إعادة جولة فشلت — بلا إنترنت لا نكرر الطلبات مع كل إعادة بناء.
const _prefetchRetryAfter = Duration(seconds: 45);

void prefetchWorldContent(dynamic ref, List<StoreWorld> worlds) {
  final signature = worlds.map((w) => w.slug).join('|');
  if (_prefetching || worlds.isEmpty || _prefetchedFor == signature) return;
  final failedAt = _prefetchFailedAt;
  if (failedAt != null && DateTime.now().difference(failedAt) < _prefetchRetryAfter) return;
  _prefetching = true;
  Future<void>(() async {
    var failed = false;
    try {
      final visible = resolveWorldSlug(
        selected: ref.read(selectedWorldSlugProvider) as String?,
        worlds: worlds,
      );
      if (visible != null) {
        try {
          await ref.read(worldFeedProvider(visible).future);
        } catch (_) {
          // العالم الظاهر نفسه لم يصل: الشبكة لا تسمح بالتجهيز الآن.
          failed = true;
          return;
        }
      }
      // لحظة لصور الواجهة الظاهرة قبل أن نبدأ بغيرها.
      await Future<void>.delayed(const Duration(milliseconds: 800));
      for (final slug in _prefetchOrder(worlds, visible)) {
        try {
          await ref.read(worldDetailProvider(slug).future);
          await ref.read(worldFeedProvider(slug).future);
        } catch (_) {
          failed = true;
          // لا نُبقي الخطأ محفوظاً: أول من يفتح هذا العالم يطلبه من جديد.
          ref.invalidate(worldDetailProvider(slug));
          ref.invalidate(worldFeedProvider(slug));
        }
      }
    } catch (_) {
      // الشاشة التي بدأت الجولة أُغلقت — لا شيء نفعله.
      failed = true;
    } finally {
      _prefetching = false;
      if (failed) {
        _prefetchFailedAt = DateTime.now();
      } else {
        _prefetchedFor = signature;
        _prefetchFailedAt = null;
      }
    }
  });
}

/// العالم الظاهر أولاً (تفاصيله)، ثم جاراه في المحدّد، ثم البقية بترتيبها.
List<String> _prefetchOrder(List<StoreWorld> worlds, String? visible) {
  final slugs = worlds.map((w) => w.slug).toList();
  final index = visible == null ? -1 : slugs.indexOf(visible);
  if (index < 0) return slugs;
  return {
    visible!,
    if (index + 1 < slugs.length) slugs[index + 1],
    if (index - 1 >= 0) slugs[index - 1],
    ...slugs,
  }.toList();
}

final worldProductSearchProvider =
    FutureProvider.autoDispose.family<List<Product>, ({String slug, String query})>((ref, args) async {
  final q = args.query.trim();
  if (q.length < 2) return const [];
  // الباركود يبحث في كل العوالم — لا يُقيَّد بأقسام العالم الحالي. غيره يحصره
  // السيرفر بقاعدة العالم نفسها (الأقسام المربوطة بأي مستوى) بدل تصفية بعد البحث.
  final barcode = isBarcodeSearchQuery(q);
  final result = await ref
      .read(apiServiceProvider)
      .searchProducts(q, limit: 30, world: barcode ? null : args.slug);
  return result.items;
});

/// الواجهة الرئيسية المعروضة فعلاً: العالم المختار، أو العامة فقط إن لم تكن هناك عوالم.
/// مصدر الإعدادات (واتساب، حد التوصيل المجاني…) — بدل جلب واجهة عامة لا تُعرض.
final activeHomeFeedProvider = Provider<AsyncValue<HomeFeed>>((ref) {
  final worldsAsync = ref.watch(worldsProvider);
  final worlds = worldsAsync.valueOrNull;
  final slug = resolveWorldSlug(selected: ref.watch(selectedWorldSlugProvider), worlds: worlds);
  if (slug != null) return ref.watch(worldFeedProvider(slug));
  // لا عوالم على السيرفر، أو تعذّر جلبها بلا نسخة محفوظة: الواجهة العامة تحمل الإعدادات.
  if (worlds != null && worlds.isEmpty) return ref.watch(homeFeedProvider);
  if (worlds == null && worldsAsync.hasError) return ref.watch(homeFeedProvider);
  return const AsyncValue.loading();
});

// ─── إعدادات المتجر ─────────────────────────────────────────────────────────

const _storeSettingsKey = 'store_settings_v1';

/// آخر إعدادات متجر معروفة (حد التوصيل المجاني، واتساب، قواعد النقاط…).
///
/// لا تختفي أثناء تبديل العالم أو فشل الشبكة، وتُحفظ على الجهاز فتتوفر من أول
/// إطار حتى بلا اتصال. null فقط في أول تشغيل قبل وصول أي واجهة.
class StoreSettingsNotifier extends Notifier<StoreSettings?> {
  String? _savedSignature;

  @override
  StoreSettings? build() {
    ref.listen<AsyncValue<HomeFeed>>(activeHomeFeedProvider, (_, next) {
      final settings = next.valueOrNull?.settings;
      if (settings != null) _keep(settings);
    });
    final live = ref.read(activeHomeFeedProvider).valueOrNull?.settings;
    if (live != null) {
      // الحفظ بعد انتهاء البناء — لا تُعدَّل الحالة أثناءه.
      Future.microtask(() => _keep(live));
      return live;
    }
    return _loadSaved();
  }

  /// الحالة تتغير فقط إن تغيّرت الإعدادات فعلاً — لا إعادة بناء مع كل تحديث للواجهة.
  void _keep(StoreSettings settings) {
    final json = _storeSettingsToJson(settings);
    final signature = jsonEncode(json);
    if (signature == _savedSignature && state != null) return;
    _savedSignature = signature;
    state = settings;
    try {
      unawaited(ref.read(sharedPreferencesProvider).setString(_storeSettingsKey, signature));
    } catch (_) {}
  }

  StoreSettings? _loadSaved() {
    try {
      final raw = ref.read(sharedPreferencesProvider).getString(_storeSettingsKey);
      if (raw == null) return null;
      final json = jsonDecode(raw);
      if (json is! Map) return null;
      _savedSignature = raw;
      return StoreSettings.fromJson(Map<String, dynamic>.from(json));
    } catch (_) {
      return null;
    }
  }
}

/// بنفس مفاتيح السيرفر — تُقرأ بـ StoreSettings.fromJson.
Map<String, dynamic> _storeSettingsToJson(StoreSettings s) => {
      'storeName': s.storeName,
      'freeShippingThreshold': s.freeShippingThreshold,
      if (s.supportPhone != null) 'supportPhone': s.supportPhone,
      if (s.whatsapp != null) 'whatsapp': s.whatsapp,
      'loyalty': {
        'pointValue': s.loyalty.pointValue,
        'earnPercent': s.loyalty.earnPercent,
        'redeemStep': s.loyalty.redeemStep,
        'firstOrderBonus': s.loyalty.firstOrderBonus,
      },
    };

final storeSettingsProvider =
    NotifierProvider<StoreSettingsNotifier, StoreSettings?>(StoreSettingsNotifier.new);
