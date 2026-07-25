import 'package:flutter/material.dart';

/// إعدادات تمرير موحّدة — أداء أعلى وحركة أنعم في كل التطبيق.
abstract final class AppScrollPerf {
  static const verticalCacheExtent = 2000.0;
  static const horizontalCacheExtent = 520.0;
  static const gridCacheExtent = 1100.0;

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
        cacheExtent: AppScrollPerf.horizontalCacheExtent,
        addAutomaticKeepAlives: false,
        addRepaintBoundaries: true,
        itemCount: itemCount,
        separatorBuilder: (_, __) => SizedBox(width: itemGap),
        itemBuilder: itemBuilder,
      ),
    );
  }
}
