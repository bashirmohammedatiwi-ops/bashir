import 'package:flutter/material.dart';

import '../perf/device_perf.dart';

/// إعدادات تمرير موحّدة — أداء أعلى وحركة أنعم في كل التطبيق.
abstract final class AppScrollPerf {
  /// القيم القصوى (للأجهزة القوية) — ثوابت للتوافق مع الاستعمالات `const` القديمة.
  /// الجديد يستعمل [vertical] / [horizontal] / [grid] / [home] بحسب قدرة الجهاز.
  static const verticalCacheExtent = 2000.0;
  static const horizontalCacheExtent = 520.0;
  static const gridCacheExtent = 1100.0;
  static const homeCacheExtent = 1000.0;

  /// مدى البناء المسبق بحسب الجهاز: كل بكسل إضافي بطاقاتٌ تُبنى وتُفكّ صورها
  /// قبل أن تُرى — على الهاتف البسيط ذاكرة وإطارات متقطّعة، وعلى القوي تمرير بلا فراغ.
  static double get vertical =>
      DevicePerf.pick(low: 700.0, mid: 1200.0, high: verticalCacheExtent);
  static double get horizontal =>
      DevicePerf.pick(low: 220.0, mid: 400.0, high: horizontalCacheExtent);
  static double get grid =>
      DevicePerf.pick(low: 500.0, mid: 800.0, high: gridCacheExtent);

  /// قائمة الرئيسية (أقسام ثقيلة: دوّارات، أشرطة فيلم).
  static double get home =>
      DevicePerf.pick(low: 600.0, mid: 900.0, high: homeCacheExtent);

  static ScrollPhysics get physics => const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      );
}

/// سلوك تمرير خفيف — بدون توهج overscroll على أندرويد.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return child;
  }

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) => AppScrollPerf.physics;
}

/// قائمة أفقية محسّنة للتمرير السريع.
class AppHorizontalList extends StatelessWidget {
  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double itemGap;
  final EdgeInsetsGeometry? padding;
  final ScrollPhysics? physics;

  const AppHorizontalList({
    super.key,
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    this.itemGap = 10,
    this.padding,
    this.physics,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: physics ?? AppScrollPerf.physics,
        padding: padding,
        cacheExtent: AppScrollPerf.horizontal,
        addAutomaticKeepAlives: false,
        addRepaintBoundaries: true,
        itemCount: itemCount,
        separatorBuilder: (_, __) => SizedBox(width: itemGap),
        itemBuilder: itemBuilder,
      ),
    );
  }
}
