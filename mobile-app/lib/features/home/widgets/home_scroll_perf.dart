import 'package:flutter/material.dart';

import 'home_theme.dart';

/// إعدادات تمرير وقوائم الرئيسية — أداء أعلى وحركة أنعم.
abstract final class HomeScrollPerf {
  static const verticalCacheExtent = 1800.0;
  static const horizontalCacheExtent = 420.0;

  static ScrollPhysics get physics => const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      );
}

/// قائمة أفقية محسّنة — cacheExtent + بدون keep-alive زائد.
class HomeHorizontalList extends StatelessWidget {
  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double itemGap;
  final EdgeInsetsGeometry? padding;

  const HomeHorizontalList({
    super.key,
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    this.itemGap = HomeTheme.itemGap,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding ??
            const EdgeInsets.fromLTRB(
              HomeTheme.paddingH,
              0,
              HomeTheme.paddingH,
              4,
            ),
        cacheExtent: HomeScrollPerf.horizontalCacheExtent,
        addAutomaticKeepAlives: false,
        addRepaintBoundaries: true,
        itemCount: itemCount,
        separatorBuilder: (_, __) => SizedBox(width: itemGap),
        itemBuilder: itemBuilder,
      ),
    );
  }
}
