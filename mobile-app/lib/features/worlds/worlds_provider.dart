import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/perf/device_perf.dart';
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

/// واجهة عالم: تبقى ما دامت معروضة، ثم 5 دقائق بعد آخر من يعرضها (عودة سريعة بلا
/// تحميل) — لا للأبد: واجهة كل عالم مئات العناصر، ونسختها محفوظة على القرص أصلاً.
final worldFeedProvider = FutureProvider.autoDispose.family<HomeFeed, String>((ref, slug) {
  _keepWhileRecentlyUsed(ref, _worldFeedIdle);
  return ref.read(apiServiceProvider).getHome(worldSlug: slug);
});

const _worldFeedIdle = Duration(minutes: 5);

/// يُبقي المزوّد حياً ما دام له مستمع، ثم [idle] بعد أن يغادر آخرهم. ما قُرئ بلا مستمع
/// (التجهيز المسبق) يبقى [idle] أيضاً ثم يُغلق.
void _keepWhileRecentlyUsed(Ref<Object?> ref, Duration idle) {
  KeepAliveLink? link = ref.keepAlive();
  Timer? timer;
  void release() {
    timer?.cancel();
    timer = Timer(idle, () {
      link?.close();
      link = null;
    });
  }

  release();
  ref.onCancel(() {
    link ??= ref.keepAlive();
    release();
  });
  ref.onResume(() => timer?.cancel());
  ref.onDispose(() => timer?.cancel());
}

/// تفاصيل عالم فشل تحميلها تبقى خطأً حتى يُعاد طلبها (لا تعيد المحاولة وحدها):
/// يُستدعى عند التبديل إليه أو العودة للتطبيق، فتعود ألوانه وأقسامه بدل لوحة المتجر
/// العامة. واجهته (worldFeedProvider) لها تحديثها الخاص في الرئيسية فلا تُطلب مرتين.
void retryWorldIfErrored(WidgetRef ref, String slug) {
  if (ref.read(worldDetailProvider(slug)).hasError) ref.invalidate(worldDetailProvider(slug));
}

/// يجهّز العوالم الأخرى في الخلفية حتى يكون التبديل فورياً — بحذر على شبكة بطيئة:
///
/// - لا يبدأ قبل أن تصل واجهة العالم الظاهر، ثم ~3 ثوانٍ هدوء (صور الواجهة وتفاعل
///   الزبونة الأول قبل أي تنزيل إضافي).
/// - الأجهزة البسيطة وبيانات الهاتف: لا تجهيز (الواجهة تُطلب عند فتح العالم وتُعرض
///   نسختها المحفوظة فوراً). الواي فاي: الجاران في المحدّد (متوسطة) أو الكل (قوية).
/// - العالم الذي حُفظت واجهته خلال 15 دقيقة يُتخطّى، والبقية واحداً تلو الآخر بانتظار
///   الشبكة فعلاً (لا موجة تحديثات خلفية متزامنة).
///
/// الفشل لا يُحفظ: العالم الذي تعذّر يُطلب حين يُفتح، والجولة كلها تُعاد لاحقاً.
bool _prefetching = false;
String? _prefetchedFor;
DateTime? _prefetchFailedAt;

/// مهلة قبل إعادة جولة فشلت — بلا إنترنت لا نكرر الطلبات مع كل إعادة بناء.
const _prefetchRetryAfter = Duration(seconds: 45);

/// هدوء بعد ظهور الواجهة قبل التجهيز.
const _prefetchIdle = Duration(seconds: 3);

/// واجهة حُفظت خلال هذه المدة لا تُعاد.
const _prefetchFreshFor = Duration(minutes: 15);

void prefetchWorldContent(dynamic ref, List<StoreWorld> worlds) {
  final signature = worlds.map((w) => w.slug).join('|');
  if (_prefetching || worlds.isEmpty || _prefetchedFor == signature) return;
  // جهاز بسيط: لا تجهيز إطلاقاً (ذاكرة وشبكة للعالم الظاهر وحده).
  if (DevicePerf.isLow) return;
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
      await Future<void>.delayed(_prefetchIdle);
      if (!await _onUnmeteredNetwork()) return; // بيانات الهاتف: لا تنزيل لما لم يُطلب.
      final api = ref.read(apiServiceProvider) as ApiService;
      for (final slug in _prefetchTargets(worlds, visible)) {
        // مزوّد قائم (فُتح أو جُهّز قبل قليل) يحدّث نفسه بنفسه.
        if (ref.exists(worldFeedProvider(slug)) as bool) continue;
        if (await api.isHomeCachedWithin(worldSlug: slug, within: _prefetchFreshFor)) continue;
        try {
          // من الشبكة الآن وبانتظارها — ثم يقرأ المزوّد ما وصل من الكاش بلا طلب ثانٍ.
          await api.getHome(worldSlug: slug, forceRefresh: true, staleOnError: false);
          await ref.read(worldFeedProvider(slug).future);
        } catch (_) {
          failed = true;
          // لا نُبقي الخطأ محفوظاً: أول من يفتح هذا العالم يطلبه من جديد.
          ref.invalidate(worldFeedProvider(slug));
          break; // الشبكة متعثّرة: لا نكمل بالبقية الآن.
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

/// واي فاي أو إيثرنت (لا بيانات هاتف). تعذّر الفحص = نفترض أنها محدودة.
Future<bool> _onUnmeteredNetwork() async {
  try {
    final results = await Connectivity().checkConnectivity();
    return results.any((r) => r == ConnectivityResult.wifi || r == ConnectivityResult.ethernet) &&
        !results.contains(ConnectivityResult.mobile);
  } catch (_) {
    return false;
  }
}

/// ما يُجهَّز بعد العالم الظاهر: جاراه في المحدّد (متوسطة)، أو كل العوالم (قوية).
List<String> _prefetchTargets(List<StoreWorld> worlds, String? visible) {
  final slugs = worlds.map((w) => w.slug).toList();
  final index = visible == null ? -1 : slugs.indexOf(visible);
  final neighbours = <String>{
    if (index >= 0 && index + 1 < slugs.length) slugs[index + 1],
    if (index - 1 >= 0) slugs[index - 1],
  };
  if (!DevicePerf.isHigh) return neighbours.toList();
  return {...neighbours, ...slugs}.where((s) => s != visible).toList();
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
