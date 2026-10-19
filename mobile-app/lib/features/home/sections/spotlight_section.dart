import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/product_card_actions.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/home_section.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import '../home_strings.dart';
import '../widgets/home_product_row.dart';
import '../widgets/home_section_shell.dart';

/// هل تصلح قائمة المنتجات لتكون «واجهة عرض»؟ فقط بتخطيط افتراضي أو «spotlight» —
/// تخطيط «film» وغيره مما يختاره المشرف يبقى كما هو.
bool isSpotlightCandidate(HomeSection section) {
  final layout = (section.layout ?? '').trim();
  return section.type == 'PRODUCT_LIST' &&
      section.products.isNotEmpty &&
      (layout.isEmpty || layout == 'spotlight');
}

/// أول قائمة منتجات في العالم تُعرض كـ"واجهة عرض":
/// منتج بطل كبير في بطاقة تحريرية، ثم بقية المختارات في صف — كسر لرتابة الصفوف المتكررة.
/// العنوان والخلفية و«عرض الكل» من لوحة التحكم كبقية الأقسام.
class ProductSpotlightSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;
  const ProductSpotlightSection({
    super.key,
    required this.section,
    this.compactTop = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = section.products
        .where((p) => p.coverUrl.isNotEmpty)
        .toList();
    if (products.isEmpty) return const SizedBox.shrink();
    final s = ref.s;
    // البطل: أول منتج متوفر.
    final hero = products.firstWhere(
      (p) => p.inStock,
      orElse: () => products.first,
    );
    final rest = products.where((p) => p.id != hero.id).toList();
    void viewAll() => openViewAllLink(
      context,
      query: section.viewAllQuery,
      fallbackQuery: 'isFeatured=1',
    );

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: section.showTitle,
      actionLabel: section.showViewAll ? s.viewAll : null,
      onAction: section.showViewAll ? viewAll : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _HeroProductCard(product: hero, badge: s.homeSpotlightBadge),
          if (rest.isNotEmpty) ...[
            const SizedBox(height: 14),
            HomeProductRow(
              products: rest,
              showPromoBadge: true,
              itemWidth: Responsive.scaledCarouselWidth(
                context,
                cardSizeSpec(
                  section.productCardSize ?? section.cardSize,
                ).productWidth,
              ),
              onViewAll: section.showViewAll ? viewAll : null,
              viewAllLabel: s.viewAll,
            ),
          ],
        ],
      ),
    );
  }
}

class _HeroProductCard extends ConsumerWidget {
  final Product product;
  final String badge;
  const _HeroProductCard({required this.product, required this.badge});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final brand = product.brandLabel;
    void open() {
      HapticFeedback.lightImpact();
      context.push(
        '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
      );
    }

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: Responsive.horizontalPadding(context),
      ),
      child: GestureDetector(
        onTap: open,
        child: Container(
          // ارتفاع أدنى لا ثابت: مع تكبير الخط حتى 1.25 تتمدد البطاقة بدل أن يخرج
          // السعر وزر السلة منها.
          constraints: const BoxConstraints(minHeight: 178),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: t.accentSoft.withValues(alpha: 0.7)),
            boxShadow: [
              BoxShadow(
                color: t.accentDark.withValues(alpha: 0.10),
                blurRadius: 26,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Row(
            children: [
              // لوحة الصورة: بيضاء (صور المنتجات بخلفية بيضاء) مع منصة عرض بلون العالم.
              Container(
                width: 150,
                height: 162,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: t.accentLight),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned(
                      bottom: 12,
                      child: Container(
                        width: 110,
                        height: 18,
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.all(
                            Radius.elliptical(55, 9),
                          ),
                          gradient: RadialGradient(
                            colors: [
                              t.accentSoft,
                              t.accentSoft.withValues(alpha: 0),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 22, 14, 14),
                      child: ProductCoverImage(
                        url: product.coverUrl,
                        fit: BoxFit.contain,
                        width: 122,
                        height: 150,
                      ),
                    ),
                    if (product.hasDiscount)
                      PositionedDirectional(
                        top: 10,
                        start: 10,
                        child: DiscountBadge(percent: product.discountPercent),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(14, 8, 6, 2),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: t.accentLight,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.auto_awesome,
                              size: 11,
                              color: t.accentDark,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              badge,
                              style: AppText.micro.copyWith(
                                color: t.accentDark,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      if (brand.isNotEmpty)
                        Text(
                          brand.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.micro.copyWith(
                            color: t.inkMuted,
                            letterSpacing: 0.8,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      const SizedBox(height: 3),
                      Text(
                        product.localizedName(lang),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.title3.copyWith(
                          color: t.ink,
                          height: 1.35,
                          fontSize: 14.5,
                        ),
                      ),
                      if (product.rating > 0) ...[
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              size: 15,
                              color: AppColors.star,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              product.rating.toStringAsFixed(1),
                              style: AppText.micro.copyWith(color: t.inkSoft),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 10),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: AlignmentDirectional.centerStart,
                              child: PriceView(
                                price: product.price,
                                oldPrice: product.hasDiscount
                                    ? product.originalPrice
                                    : null,
                                stacked: true,
                              ),
                            ),
                          ),
                          ProductCardCartControl(product: product),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
