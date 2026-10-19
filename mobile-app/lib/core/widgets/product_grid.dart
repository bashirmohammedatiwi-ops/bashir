import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_spacing.dart';
import '../utils/responsive.dart';
import '../widgets/scroll_perf.dart';
import 'product_card.dart';
import 'shimmer_box.dart';

/// شبكة منتجات موحّدة — تباعد، نسبة، وأداء متسق.
///
/// الشكل العادي ويدجت تمرير كاملة. [ProductGrid.sliver] يعيد الشبكة كـ sliver لتوضع مع
/// الفلاتر والحالات في `CustomScrollView` واحد.
class ProductGrid extends StatelessWidget {
  final List<Product> products;
  final ScrollController? controller;
  final bool showPromoBadge;
  final bool showRating;

  /// بطاقات هيكلية بعد المنتجات أثناء تحميل الصفحة التالية.
  final int extraSlots;
  final EdgeInsetsGeometry padding;
  final bool listingStyle;
  final Widget? header;

  /// يظهر بعد آخر عنصر (خطأ «تعذّر تحميل المزيد» مع إعادة المحاولة مثلاً).
  final Widget? footer;

  /// نطاق وسوم صور البطاقات (`شاشة-قسم`) للانتقال المشترك إلى صفحة المنتج؛
  /// إن لم يُمرّر فبصمة الشبكة نفسها (فريدة على الشاشة).
  final String? heroScope;

  final bool _sliver;

  const ProductGrid({
    super.key,
    required this.products,
    this.controller,
    this.showPromoBadge = false,
    this.showRating = true,
    this.extraSlots = 0,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.listingStyle = false,
    this.header,
    this.footer,
    this.heroScope,
  }) : _sliver = false;

  /// الشبكة كـ sliver (مع [footer] بعدها) — بلا متحكّم تمرير ولا رأس: يضعهما الأب.
  const ProductGrid.sliver({
    super.key,
    required this.products,
    this.showPromoBadge = false,
    this.showRating = true,
    this.extraSlots = 0,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.listingStyle = false,
    this.footer,
    this.heroScope,
  })  : controller = null,
        header = null,
        _sliver = true;

  static SliverGridDelegate delegateFor(BuildContext context, {bool listing = false}) {
    final cols = Responsive.gridColumns(context);
    final spacing = Responsive.gridSpacing(context);
    return SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: cols,
      childAspectRatio: Responsive.gridChildAspectRatio(context, listing: listing),
      crossAxisSpacing: spacing,
      mainAxisSpacing: listing ? 14 : spacing,
    );
  }

  int? _indexForKey(Key key) {
    if (key is! ValueKey<String>) return null;
    final id = key.value;
    final index = products.indexWhere((p) => p.id == id);
    return index >= 0 ? index : null;
  }

  Widget _itemBuilder(BuildContext context, String scope, int i) {
    if (i >= products.length) return const ProductCardSkeleton();
    final product = products[i];
    return RepaintBoundary(
      child: ProductCard(
        key: ValueKey(product.id),
        product: product,
        heroTag: productHeroTag(scope, product),
        showPromoBadge: showPromoBadge,
        showRating: showRating,
        lite: !listingStyle,
        style: listingStyle ? ProductCardStyle.listing : ProductCardStyle.standard,
      ),
    );
  }

  /// الشبكة وتذييلها كقائمة slivers.
  List<Widget> _slivers(BuildContext context, String scope) => [
        SliverPadding(
          padding: padding,
          sliver: SliverGrid(
            gridDelegate: delegateFor(context, listing: listingStyle),
            delegate: SliverChildBuilderDelegate(
              (context, i) => _itemBuilder(context, scope, i),
              childCount: products.length + extraSlots,
              addAutomaticKeepAlives: false,
              addRepaintBoundaries: true,
              findChildIndexCallback: _indexForKey,
            ),
          ),
        ),
        if (footer != null) SliverToBoxAdapter(child: footer!),
      ];

  @override
  Widget build(BuildContext context) {
    final scope = productHeroScope(context, 'grid', heroScope);
    if (_sliver) return SliverMainAxisGroup(slivers: _slivers(context, scope));

    if (header != null || footer != null) {
      return CustomScrollView(
        controller: controller,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.gridCacheExtent,
        slivers: [
          if (header != null) SliverToBoxAdapter(child: header!),
          ..._slivers(context, scope),
        ],
      );
    }

    return GridView.builder(
      controller: controller,
      padding: padding,
      physics: AppScrollPerf.physics,
      cacheExtent: AppScrollPerf.gridCacheExtent,
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      gridDelegate: delegateFor(context, listing: listingStyle),
      itemCount: products.length + extraSlots,
      findChildIndexCallback: _indexForKey,
      itemBuilder: (context, i) => _itemBuilder(context, scope, i),
    );
  }
}
