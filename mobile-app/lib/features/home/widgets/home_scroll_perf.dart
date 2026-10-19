import 'package:flutter/material.dart';

import '../../../core/widgets/scroll_perf.dart';
import 'home_theme.dart';

export '../../../core/widgets/scroll_perf.dart'
    show AppScrollBehavior, AppScrollPerf;

/// إعدادات تمرير الرئيسية — للتوافق مع الملفات الحالية.
abstract final class HomeScrollPerf {
  static double get verticalCacheExtent => AppScrollPerf.vertical;
  static double get horizontalCacheExtent => AppScrollPerf.horizontal;
  static double get gridCacheExtent => AppScrollPerf.grid;
  static ScrollPhysics get physics => AppScrollPerf.physics;
}

/// قائمة أفقية محسّنة — cacheExtent + بدون keep-alive زائد.
class HomeHorizontalList extends StatelessWidget {
  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double itemGap;
  final EdgeInsetsGeometry? padding;
  final ScrollPhysics? physics;

  const HomeHorizontalList({
    super.key,
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    this.itemGap = HomeTheme.itemGap,
    this.padding,
    this.physics,
  });

  @override
  Widget build(BuildContext context) {
    return AppHorizontalList(
      height: height,
      itemCount: itemCount,
      itemBuilder: itemBuilder,
      itemGap: itemGap,
      physics: physics,
      padding:
          padding ??
          const EdgeInsets.fromLTRB(
            HomeTheme.paddingH,
            0,
            HomeTheme.paddingH,
            4,
          ),
    );
  }
}
