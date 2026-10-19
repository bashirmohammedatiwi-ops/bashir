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

  /// أول موضع لكل منتج — مفتاح البطاقة له وحده (منتج مكرر بين صفحتين لا يكرر المفتاح بين الإخوة).
  Map<String, int> _firstIndexById() {
    final out = <String, int>{};
    for (var i = 0; i < products.length; i++) {
      out.putIfAbsent(products[i].id, () => i);
    }
    return out;
  }

  /// المفتاح على الودجت المُعادة نفسها: بها يطابق الـ sliver البطاقة بمنتجها حين تتغير القائمة
  /// (ترتيب، فلتر، حذف) فتبقى حالتها معها بدل إعادة بنائها حسب الموضع. حدّ الرسم يضيفه
  /// الـ delegate نفسه (addRepaintBoundaries).
  Widget _itemBuilder(String scope, int i, Map<String, int> firstIndex) {
    if (i >= products.length) return const ProductCardSkeleton();
    final product = products[i];
    return ProductCard(
      key: firstIndex[product.id] == i ? ValueKey<String>(product.id) : null,
      product: product,
      heroTag: productHeroTag(scope, product),
      showPromoBadge: showPromoBadge,
      showRating: showRating,
      lite: !listingStyle,
      style: listingStyle ? ProductCardStyle.listing : ProductCardStyle.standard,
    );
  }

  ChildIndexGetter _indexForKey(Map<String, int> firstIndex) =>
      (key) => key is ValueKey<String> ? firstIndex[key.value] : null;

  /// الشبكة وتذييلها كقائمة slivers.
  List<Widget> _slivers(BuildContext context, String scope, Map<String, int> firstIndex) => [
        SliverPadding(
          padding: padding,
          sliver: SliverGrid(
            gridDelegate: delegateFor(context, listing: listingStyle),
            delegate: SliverChildBuilderDelegate(
              (context, i) => _itemBuilder(scope, i, firstIndex),
              childCount: products.length + extraSlots,
              addAutomaticKeepAlives: false,
              addRepaintBoundaries: true,
              findChildIndexCallback: _indexForKey(firstIndex),
            ),
          ),
        ),
        if (footer != null) SliverToBoxAdapter(child: footer!),
      ];

  @override
  Widget build(BuildContext context) {
    final scope = productHeroScope(context, 'grid', heroScope);
    final firstIndex = _firstIndexById();
    if (_sliver) return SliverMainAxisGroup(slivers: _slivers(context, scope, firstIndex));

    if (header != null || footer != null) {
      return CustomScrollView(
        controller: controller,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.grid,
        slivers: [
          if (header != null) SliverToBoxAdapter(child: header!),
          ..._slivers(context, scope, firstIndex),
        ],
      );
    }

    return GridView.builder(
      controller: controller,
      padding: padding,
      physics: AppScrollPerf.physics,
      cacheExtent: AppScrollPerf.grid,
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      gridDelegate: delegateFor(context, listing: listingStyle),
      itemCount: products.length + extraSlots,
      findChildIndexCallback: _indexForKey(firstIndex),
      itemBuilder: (context, i) => _itemBuilder(scope, i, firstIndex),
    );
  }
}
