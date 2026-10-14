import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../../../core/theme/app_text.dart';
import '../../../core/utils/responsive.dart';
import '../../worlds/world_theme.dart';
import '../../../data/models/product.dart';
import 'home_product_card.dart';
import 'home_scroll_perf.dart';
import 'home_theme.dart';

class HomeProductRow extends StatelessWidget {
  final List<Product> products;
  final bool showPromoBadge;
  final double itemWidth;
  final EdgeInsetsGeometry? padding;

  /// بطاقة "عرض الكل" في نهاية الصف — من وصلت للآخر تكمل بلمسة.
  final VoidCallback? onViewAll;
  final String? viewAllLabel;

  const HomeProductRow({
    super.key,
    required this.products,
    this.showPromoBadge = false,
    this.itemWidth = HomeTheme.productCardWidth,
    this.padding,
    this.onViewAll,
    this.viewAllLabel,
  });

  @override
  Widget build(BuildContext context) {
    final width = itemWidth == HomeTheme.productCardWidth
        ? Responsive.productCardWidth(context)
        : itemWidth;
    final height = Responsive.productCardHeight(context);
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
      child: GestureDetector(
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
