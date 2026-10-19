import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/catalog/catalog_providers.dart';
import '../../features/catalog/catalog_refresh.dart';
import '../../features/update/app_update.dart';
import '../../features/worlds/worlds_provider.dart';
import '../perf/device_perf.dart';

/// مهلة ما لا يظهر في أول شاشة (العروض، البراندات) — لا يزاحم واجهة العالم الظاهر
/// على الشبكة ولا على فكّ JSON في أول ثانيتين.
const _deferredDelay = Duration(milliseconds: 2500);

/// يبدأ تحميل البيانات الأساسية عند فتح التطبيق — بترتيب ما يظهر أولاً.
///
/// 1. العوالم، ثم واجهة العالم الظاهر وتفاصيله (ألوانه) معاً: هذا ما تراه الزبونة
///    لحظة انتهاء الافتتاح.
/// 2. الأقسام (شرائح الرئيسية) وفحص تحديث التطبيق — طلبان خفيفان.
/// 3. بعد ~2.5 ث: العروض، والبراندات (وعلى الهواتف البسيطة لا تُجلب البراندات حتى
///    يُفتح تبويبها).
void warmupAppData(WidgetRef ref) {
  // ما يُجلب الآن حديث: أول عودة للتطبيق خلال 3 دقائق لا تعيد جلبه.
  markStorefrontFresh();
  unawaited(_warmVisibleWorld(ref));
  ref.read(categoriesProvider.future).ignore();
  // الفحص يبدأ مع الإقلاع (لا ينتظر شيئاً) — بوابة التحديث تقرأ نتيجته نفسها.
  ref.read(appUpdateProvider.future).ignore();

  Timer(_deferredDelay, () {
    try {
      ref.read(offersFeedProvider.future).ignore();
      if (!DevicePerf.isLow) ref.read(brandsProvider.future).ignore();
    } catch (_) {
      // التطبيق أُغلق قبل المهلة.
    }
  });
}

/// العوالم أولاً (من الكاش عادةً)، ثم العالم الظاهر: واجهته وتفاصيله بالتوازي.
Future<void> _warmVisibleWorld(WidgetRef ref) async {
  try {
    final worlds = await ref.read(worldsProvider.future);
    final slug = resolveWorldSlug(
      selected: ref.read(selectedWorldSlugProvider),
      worlds: worlds,
    );
    if (slug == null) return; // لا عوالم: الرئيسية تطلب الواجهة العامة بنفسها.
    ref.read(worldDetailProvider(slug).future).ignore();
    ref.read(worldFeedProvider(slug).future).ignore();
  } catch (_) {
    // بلا اتصال ولا نسخة محفوظة: الرئيسية تعرض الخطأ وتعيد المحاولة بنفسها.
  }
}
