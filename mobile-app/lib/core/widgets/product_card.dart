import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/worlds/world_theme.dart';
import '../l10n/app_strings.dart';
import '../l10n/locale_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_text.dart';
import '../utils/formatters.dart';
import 'app_network_image.dart';
import 'product_card_actions.dart';
import '../navigation/product_nav.dart';

/// كان هناك أسلوبان مختلفان؛ الآن تصميم واحد موحّد لكل التطبيق.
/// يبقى الـ enum للتوافق مع الاستدعاءات القديمة.
enum ProductCardStyle { standard, listing }

/// بطاقة المنتج الموحّدة:
/// صورة داخل إطار ناعم + شارة خصم/جديد + قلب + زر سلة،
/// ثم البراند، الاسم (سطران ثابتان)، التقييم، السعر، ودرجات الألوان.
class ProductCard extends ConsumerWidget {
  final Product product;
  final double? width;
  final bool showPromoBadge;
  final bool showRating;
  final bool lite;
  final ProductCardStyle style;

  const ProductCard({
    super.key,
    required this.product,
    this.width,
    this.showPromoBadge = false,
    this.showRating = false,
    this.lite = false,
    this.style = ProductCardStyle.standard,
  });

  static const radius = 20.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    return Semantics(
      button: true,
      label: product.localizedName(lang),
      // الظل على حاوية خارجية — طبقة التموّج في Material تقصّ ما يخرج عن حدودها.
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: [
            BoxShadow(
              color: t.accentDark.withValues(alpha: 0.07),
              blurRadius: 18,
              offset: const Offset(0, 8),
              spreadRadius: -4,
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 3,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(radius),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => openProduct(context, product),
          borderRadius: BorderRadius.circular(radius),
          splashColor: t.accent.withValues(alpha: 0.06),
          highlightColor: t.accent.withValues(alpha: 0.03),
          child: SizedBox(
            width: width,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _CardImage(
                    product: product,
                    showPromoBadge: showPromoBadge,
                    lite: lite,
                  ),
                ),
                _CardInfo(product: product, showRating: showRating),
              ],
            ),
          ),
        ),
      ),
      ),
    );
  }
}

class _CardImage extends ConsumerWidget {
  final Product product;
  final bool showPromoBadge;
  final bool lite;

  const _CardImage({
    required this.product,
    required this.showPromoBadge,
    required this.lite,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final (String? badge, Color badgeColor) = product.hasDiscount
        ? (formatDiscount(product.discountPercent), AppColors.sale)
        : product.isNew
        ? (s.newBadge, t.ink)
        : (showPromoBadge && product.isPromo)
        ? (s.offerBadge, t.accent)
        : (null, t.accent);

    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 6, 6, 0),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // إطار الصورة: خلفية دافئة خفيفة تجعل صور المنتجات البيضاء تبدو أنيقة.
          DecoratedBox(
            decoration: BoxDecoration(
              // أبيض مثل خلفيات صور المنتجات — لا مربعات ظاهرة حول الصورة.
              color: Colors.white,
              borderRadius: BorderRadius.circular(ProductCard.radius - 5),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
              child: LayoutBuilder(
                builder: (context, c) => Opacity(
                  opacity: product.inStock ? 1 : 0.45,
                  child: ProductCoverImage(
                    url: product.coverUrl,
                    width: c.maxWidth,
                    height: c.maxHeight,
                    fit: BoxFit.contain,
                    filterQuality: lite
                        ? FilterQuality.low
                        : FilterQuality.medium,
                  ),
                ),
              ),
            ),
          ),
          if (badge != null)
            PositionedDirectional(
              top: 8,
              start: 8,
              child: _Badge(label: badge, color: badgeColor),
            ),
          PositionedDirectional(
            top: 2,
            end: 2,
            child: RepaintBoundary(
              child: ProductCardWishButton(product: product, size: 32),
            ),
          ),
          if (!product.inStock)
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: t.ink.withValues(alpha: 0.82),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  s.soldOut,
                  style: AppText.micro.copyWith(color: Colors.white),
                ),
              ),
            )
          else
            PositionedDirectional(
              end: 2,
              bottom: 2,
              child: ProductCardCartControl(product: product, compact: true),
            ),
        ],
      ),
    );
  }
}

class _CardInfo extends ConsumerWidget {
  final Product product;
  final bool showRating;

  const _CardInfo({required this.product, required this.showRating});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    final brand = product.brandLabel;
    final hasShades =
        product.shades.where((x) => x.hasBarcode).length > 1 ||
        product.shadeCount > 1;

    return Padding(
      padding: const EdgeInsets.fromLTRB(11, 9, 11, 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 14,
            child: Text(
              brand.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.micro.copyWith(
                fontSize: 10.5,
                color: t.accentDark,
                letterSpacing: 0.3,
              ),
            ),
          ),
          const SizedBox(height: 3),
          // ارتفاع ثابت لسطرين — كل البطاقات في الصف بنفس المحاذاة.
          SizedBox(
            height: 34,
            child: Text(
              product.localizedName(lang),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppText.bodySmall.copyWith(
                fontSize: 12.5,
                height: 1.32,
                fontWeight: FontWeight.w600,
                color: t.ink,
              ),
            ),
          ),
          if (showRating && product.rating > 0) ...[
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(Icons.star_rounded, size: 13, color: AppColors.star),
                const SizedBox(width: 2),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: AppText.micro.copyWith(color: t.inkSoft),
                ),
                if (product.reviewCount > 0)
                  Text(
                    ' (${product.reviewCount})',
                    style: AppText.micro.copyWith(
                      color: t.inkMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: AlignmentDirectional.centerStart,
                  // السعر الحالي بارزاً والقديم بجانبه صغيراً — سطر واحد أنظف.
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        formatPrice(product.price),
                        maxLines: 1,
                        style: AppText.price.copyWith(
                          color: product.hasDiscount ? AppColors.sale : t.ink,
                        ),
                      ),
                      if (product.hasDiscount) ...[
                        const SizedBox(width: 5),
                        Text(
                          formatPrice(product.originalPrice),
                          maxLines: 1,
                          style: AppText.caption.copyWith(
                            fontSize: 10.5,
                            height: 1.1,
                            color: t.inkMuted,
                            decoration: TextDecoration.lineThrough,
                            decorationColor: t.inkMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              if (hasShades) ...[
                const SizedBox(width: 6),
                ProductShadeSwatchRow(
                  shades: product.shades,
                  shadeCount: product.shadeCount,
                  max: 5,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.28),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        label,
        style: AppText.micro.copyWith(
          color: Colors.white,
          fontSize: 10.5,
          height: 1,
        ),
      ),
    );
  }
}

/// نقاط درجات الألوان (مكياج) — حتى [max] نقاط ثم "+N".
class ProductShadeSwatchRow extends StatelessWidget {
  final List<ProductShade> shades;
  final int shadeCount;
  final int max;

  const ProductShadeSwatchRow({
    super.key,
    required this.shades,
    this.shadeCount = 0,
    this.max = 5,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final real = shades.where((s) => s.hasBarcode).toList();
    final total = real.length > 1
        ? real.length
        : (shadeCount > 1 && real.isEmpty ? shadeCount : real.length);
    if (total < 2) return const SizedBox.shrink();
    final visible = real.take(max).toList();
    final extra = total - visible.length;

    // بلا ألوان في بيانات القائمة: «🎨 21 درجة» أوضح من «+21» وحدها.
    if (visible.isEmpty) {
      final ar = Directionality.of(context) == TextDirection.rtl;
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.palette_outlined, size: 12.5, color: t.accent),
          const SizedBox(width: 3),
          Text(
            ar ? '$total درجة' : '$total shades',
            style: AppText.micro.copyWith(fontSize: 10.5, color: t.inkSoft, height: 1),
          ),
        ],
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // نقاط متراكبة قليلاً — شكل أنيق ومساحة أقل.
        SizedBox(
          // دوائر صغيرة للدلالة فقط — أول 5 درجات متراكبة قليلاً.
          width: visible.isEmpty ? 0 : 11 + (visible.length - 1) * 8.0,
          height: 11,
          child: Stack(
            children: [
              for (var i = 0; i < visible.length; i++)
                PositionedDirectional(
                  start: i * 8.0,
                  child: _ShadeDot(
                    shade: visible[i],
                    size: 11,
                    ring: t.surface,
                  ),
                ),
            ],
          ),
        ),
        if (extra > 0) ...[
          const SizedBox(width: 3),
          Text(
            '+$extra',
            style: AppText.micro.copyWith(
              fontSize: 10.5,
              color: t.inkSoft,
              height: 1,
            ),
          ),
        ],
      ],
    );
  }
}

class _ShadeDot extends StatelessWidget {
  final ProductShade shade;
  final double size;
  final Color ring;
  const _ShadeDot({
    required this.shade,
    required this.size,
    required this.ring,
  });

  Color _hex(String hex) {
    final h = hex.replaceAll('#', '');
    final v = h.length == 6 ? 'FF$h' : h;
    return Color(int.tryParse(v, radix: 16) ?? 0xFFCCCCCC);
  }

  @override
  Widget build(BuildContext context) {
    final start = _hex(shade.colorHex);
    final end = _hex(shade.colorHexEnd ?? shade.colorHex);
    final hasGradient =
        shade.colorHexEnd != null &&
        shade.colorHexEnd!.trim().isNotEmpty &&
        shade.colorHexEnd!.toLowerCase() != shade.colorHex.toLowerCase();

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hasGradient ? null : start,
        gradient: hasGradient
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [start, end],
              )
            : null,
        border: Border.all(color: ring, width: 1.5),
      ),
    );
  }
}
