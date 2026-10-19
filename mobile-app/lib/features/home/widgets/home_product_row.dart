import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../../../core/theme/app_text.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../worlds/world_theme.dart';
import '../../../data/models/product.dart';
import 'home_product_card.dart';
import 'home_scroll_perf.dart';
import 'home_theme.dart';

/// صف المنتجات الأفقي الموحّد للرئيسية — رفوف لوحة التحكم والرفوف الشخصية
/// («اطلبيها مرة ثانية»، «أكملي من حيث توقفتِ»، المفضلة…) بنفس المقاس المتجاوب.
class HomeProductRow extends StatelessWidget {
  final List<Product> products;
  final bool showPromoBadge;
  final double itemWidth;
  final EdgeInsetsGeometry? padding;

  /// ارتفاع البطاقة — افتراضياً المتجاوب ([Responsive.productCardHeight]).
  /// الصفوف المضغوطة (اقتراحات «أكملي الفرق») تمرّر أقل.
  final double? itemHeight;

  /// بطاقة "عرض الكل" في نهاية الصف — من وصلت للآخر تكمل بلمسة.
  final VoidCallback? onViewAll;
  final String? viewAllLabel;

  const HomeProductRow({
    super.key,
    required this.products,
    this.showPromoBadge = false,
    this.itemWidth = HomeTheme.productCardWidth,
    this.padding,
    this.itemHeight,
    this.onViewAll,
    this.viewAllLabel,
  });

  @override
  Widget build(BuildContext context) {
    final width = itemWidth == HomeTheme.productCardWidth
        ? Responsive.productCardWidth(context)
        : itemWidth;
    final height = itemHeight ?? Responsive.productCardHeight(context);
    return HomeHorizontalList(
      height: height + 4,
      padding:
          padding ??
          EdgeInsets.symmetric(
            horizontal: Responsive.horizontalPadding(context),
          ),
      itemCount: products.length + (onViewAll != null ? 1 : 0),
      itemBuilder: (_, i) => i == products.length
          ? _ViewAllTile(
              width: width * 0.72,
              height: height,
              label: viewAllLabel ?? '',
              onTap: onViewAll!,
            )
          : RepaintBoundary(
              child: HomeProductCard(
                key: ValueKey(products[i].id),
                product: products[i],
                width: width,
                height: height,
                showPromoBadge: showPromoBadge,
              ),
            ),
    );
  }
}

/// هيكل تحميل بنفس أبعاد [HomeProductRow] تماماً — يحجز ارتفاع الرف أثناء
/// التحميل فلا تقفز الصفحة حين تصل المنتجات.
class HomeProductRowSkeleton extends StatelessWidget {
  final int count;
  final double? itemHeight;
  final EdgeInsetsGeometry? padding;

  const HomeProductRowSkeleton({
    super.key,
    this.count = 3,
    this.itemHeight,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final width = Responsive.productCardWidth(context);
    final height = itemHeight ?? Responsive.productCardHeight(context);
    return ExcludeSemantics(
      child: HomeHorizontalList(
        height: height + 4,
        physics: const NeverScrollableScrollPhysics(),
        padding:
            padding ??
            EdgeInsets.symmetric(
              horizontal: Responsive.horizontalPadding(context),
            ),
        itemCount: count,
        itemBuilder: (_, __) => SizedBox(
          width: width,
          height: height,
          child: const ProductCardSkeleton(),
        ),
      ),
    );
  }
}

class _ViewAllTile extends StatelessWidget {
  final double width;
  final double height;
  final String label;
  final VoidCallback onTap;

  const _ViewAllTile({
    required this.width,
    required this.height,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final pill = Color.lerp(t.accent, Colors.black, 0.1)!;
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [t.accentLight, t.surface],
            ),
            border: Border.all(color: t.accentSoft.withValues(alpha: 0.8)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color.lerp(pill, Colors.white, 0.16)!, pill],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: pill.withValues(alpha: 0.32),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_forward_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: AppText.label.copyWith(color: t.ink),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
