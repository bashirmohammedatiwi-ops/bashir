import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/product_model.dart';
import '../../features/cart/providers/cart_provider.dart';
import '../../features/wishlist/providers/wishlist_provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_motion.dart';
import '../constants/app_sizes.dart';
import '../constants/app_strings.dart';
import '../theme/text_styles.dart';
import '../utils/currency_formatter.dart';
import '../utils/product_visuals.dart';
import 'cached_image_widget.dart';
import 'luxe.dart';

/// بطاقة منتج Magazine Editorial — تصميم بوتيكي فاخر.
///
/// مفاتيح التصميم:
/// • Photo well بحدّ ذهبي علوي رفيع + tint ناعم متدرّج + ظل بيضاوي تحت المنتج.
/// • Heart عائم بإطار ذهبي شفاف (يغيّر اللون عند التفعيل).
/// • Discount/New ribbon قطعي بزاوية مقصوصة (chamfer) بأسلوب editorial.
/// • Brand بأحرف Latin uppercase + tracking + نقطة ذهبية فاصلة + Rating بسيط.
/// • اسم المنتج بـ Cairo bold قصير ومركّز.
/// • Footer: السعر بـ Serif Italic كبير، وزر سلة دائري متلألئ بنقطة ذهبية.
/// • Animated reveal عند الدخول + Pressed scale + Heart bounce + Gold sweep.
class ProductCard extends ConsumerStatefulWidget {
  const ProductCard({
    super.key,
    required this.product,
    this.index = 0,
    this.heroTag,
    this.showcaseLayout,
  });

  final ProductModel product;
  final int index;
  final String? heroTag;
  final ProductShowcaseLayout? showcaseLayout;

  @override
  ConsumerState<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends ConsumerState<ProductCard>
    with TickerProviderStateMixin {
  late final AnimationController _enter;
  late final AnimationController _sweep;

  @override
  void initState() {
    super.initState();
    _enter = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 520),
    );
    _sweep = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
    final delay = (widget.index.clamp(0, 6) * 70);
    Future.delayed(Duration(milliseconds: delay), () {
      if (mounted) _enter.forward();
    });
  }

  @override
  void dispose() {
    _enter.dispose();
    _sweep.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final style = ProductVisuals.resolve(
      p,
      layout: widget.showcaseLayout ?? ProductShowcaseLayout.gridCard,
    );
    final tint = style.backgroundColor;
    final wished = ref.watch(isProductWishlistedProvider(p.id));
    final hero = widget.heroTag ?? 'product_${p.id}';

    return AnimatedBuilder(
      animation: _enter,
      builder: (context, child) {
        final t = CurvedAnimation(parent: _enter, curve: AppMotion.precise).value;
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(0, 18 * (1 - t)),
            child: child,
          ),
        );
      },
      child: RepaintBoundary(
        child: PressedScale(
          onTap: () => context.push('/product/${p.id}'),
          scale: 0.97,
          child: _MagazineCard(
            product: p,
            tint: tint,
            heroTag: hero,
            wished: wished,
            sweep: _sweep,
            onWish: () =>
                ref.read(wishlistProvider.notifier).toggle(p.id),
            onAdd: p.inStock
                ? () {
                    ref.read(cartProvider.notifier).addProduct(p);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        behavior: SnackBarBehavior.floating,
                        backgroundColor: AppColors.primaryDark,
                        margin: const EdgeInsets.all(16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        duration: const Duration(milliseconds: 900),
                        content: Row(
                          children: [
                            const Icon(
                              Icons.check_circle_rounded,
                              color: AppColors.gold,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'تمت الإضافة للسلة',
                              style: AppTextStyles.body(
                                color: Colors.white,
                                size: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                : null,
          ),
        ),
      ),
    );
  }
}

class _MagazineCard extends StatelessWidget {
  const _MagazineCard({
    required this.product,
    required this.tint,
    required this.heroTag,
    required this.wished,
    required this.sweep,
    required this.onWish,
    required this.onAdd,
  });

  final ProductModel product;
  final Color tint;
  final String heroTag;
  final bool wished;
  final Animation<double> sweep;
  final VoidCallback onWish;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.cardRadiusLg),
        border: Border.all(color: AppColors.divider),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 22,
            offset: Offset(0, 8),
          ),
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.cardRadiusLg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 16),

                // ===== Visual stage =====
                _PhotoWell(
                  product: product,
                  tint: tint,
                  wished: wished,
                  onWish: onWish,
                ),

                // ===== Info stage =====
                Padding(
                  padding: const EdgeInsets.fromLTRB(9, 5, 9, 7),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _BrandRow(product: product),

                      const SizedBox(height: 2),

                      SizedBox(
                        height: 23,
                        child: Text(
                          product.name,
                          style: AppTextStyles.title(size: 12.5).copyWith(
                            fontWeight: FontWeight.w700,
                            height: 1.18,
                            letterSpacing: -0.15,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),

                      const SizedBox(height: 3),

                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (product.discountPercent > 0)
                                  Text(
                                    CurrencyFormatter.format(
                                      product.originalPrice,
                                    ),
                                    style: AppTextStyles.caption(
                                      color: AppColors.textMuted,
                                      size: 9.5,
                                    ).copyWith(
                                      decoration: TextDecoration.lineThrough,
                                      decorationColor: AppColors.textMuted,
                                    ),
                                    maxLines: 1,
                                  ),
                                Text(
                                  CurrencyFormatter.format(product.price),
                                  style: AppTextStyles.serif(
                                    color: AppColors.primaryDark,
                                    size: 18.5,
                                    weight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Container(
                                  width: 18,
                                  height: 1.2,
                                  margin: const EdgeInsets.only(top: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 5),
                          if (onAdd != null)
                            _CartOrb(onTap: onAdd!)
                          else
                            const _OutOfStockOrb(),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Floating product visual.
          PositionedDirectional(
            top: -34,
            start: 0,
            end: 0,
            child: IgnorePointer(
              child: _FloatingProductImage(
                heroTag: heroTag,
                imageUrl: product.images.first,
                sweep: sweep,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================ PHOTO WELL ============================
class _PhotoWell extends StatelessWidget {
  const _PhotoWell({
    required this.product,
    required this.tint,
    required this.wished,
    required this.onWish,
  });

  final ProductModel product;
  final Color tint;
  final bool wished;
  final VoidCallback onWish;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1.16,
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Color.lerp(tint, Colors.white, 0.72),
              ),
            ),
          ),

          PositionedDirectional(
            top: 7,
            start: 7,
            child: _ChamferRibbon(product: product),
          ),

          PositionedDirectional(
            top: 7,
            end: 7,
            child: _HeartOrb(active: wished, onTap: onWish),
          ),

          if (product.shades != null && product.shades!.isNotEmpty)
            PositionedDirectional(
              bottom: 7,
              end: 7,
              child: _ShadeDots(product: product),
            ),
        ],
      ),
    );
  }
}

class _FloatingProductImage extends StatelessWidget {
  const _FloatingProductImage({
    required this.heroTag,
    required this.imageUrl,
    required this.sweep,
  });

  final String heroTag;
  final String imageUrl;
  final Animation<double> sweep;

  @override
  Widget build(BuildContext context) {
    final shimmerScale = Tween<double>(
      begin: 1.0,
      end: 1.03,
    ).transform((0.5 - (sweep.value - 0.5).abs()) * 2);
    final bob = Tween<double>(
      begin: 0,
      end: -4,
    ).transform(Curves.easeInOut.transform((0.5 - (sweep.value - 0.5).abs()) * 2));

    return SizedBox(
      height: 164,
      child: Center(
        child: AnimatedBuilder(
          animation: sweep,
          builder: (context, _) {
            return Transform.translate(
              offset: Offset(0, bob),
              child: Transform.scale(
                scale: shimmerScale,
                child: Hero(
                  tag: heroTag,
                  child: CachedImageWidget(
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    transparentPlaceholder: true,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ============================ CHAMFER RIBBON ============================
/// شريط مقصوص الزاوية (تأثير editorial فاخر).
class _ChamferRibbon extends StatelessWidget {
  const _ChamferRibbon({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    String? label;
    Color bg = AppColors.primaryDark;
    Color fg = AppColors.gold;
    bool isItalic = false;

    if (product.discountPercent > 0) {
      label =
          '-${CurrencyFormatter.toArabicDigits('${product.discountPercent}')}٪';
      bg = AppColors.primaryDark;
      fg = AppColors.gold;
      isItalic = true;
    } else if (product.isNew) {
      label = 'جديد';
      bg = AppColors.gold;
      fg = AppColors.primaryDark;
    } else if (product.isBestSeller) {
      label = 'مميز';
      bg = AppColors.rose;
      fg = Colors.white;
    } else if (!product.inStock) {
      label = AppStrings.outOfStock;
      bg = AppColors.textMuted;
      fg = Colors.white;
    }

    if (label == null) return const SizedBox.shrink();

    return ClipPath(
      clipper: _ChamferClipper(),
      child: Container(
        padding: const EdgeInsetsDirectional.only(
          start: 10,
          end: 18,
          top: 5,
          bottom: 5,
        ),
        decoration: BoxDecoration(
          color: bg,
          boxShadow: [
            BoxShadow(
              color: bg.withValues(alpha: 0.25),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isItalic)
              Padding(
                padding: const EdgeInsets.only(right: 3),
                child: Text(
                  '✦',
                  style: TextStyle(color: fg, fontSize: 9, height: 1),
                ),
              ),
            Text(
              label,
              style: AppTextStyles.caption(color: fg, size: 9.5).copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: isItalic ? 0.3 : 1.0,
                fontStyle: isItalic ? FontStyle.italic : FontStyle.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChamferClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final p = Path();
    p.moveTo(0, 0);
    p.lineTo(size.width - 9, 0);
    p.lineTo(size.width, size.height / 2);
    p.lineTo(size.width - 9, size.height);
    p.lineTo(0, size.height);
    p.close();
    return p;
  }

  @override
  bool shouldReclip(_) => false;
}

// ============================ HEART ORB ============================
class _HeartOrb extends StatefulWidget {
  const _HeartOrb({required this.active, required this.onTap});
  final bool active;
  final VoidCallback onTap;

  @override
  State<_HeartOrb> createState() => _HeartOrbState();
}

class _HeartOrbState extends State<_HeartOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bounce;

  @override
  void initState() {
    super.initState();
    _bounce = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 360),
    );
  }

  @override
  void dispose() {
    _bounce.dispose();
    super.dispose();
  }

  void _onTap() {
    _bounce.forward(from: 0);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _onTap,
      child: AnimatedBuilder(
        animation: _bounce,
        builder: (context, child) {
          // bounce: 0 -> 1 with overshoot
          final t = Curves.easeOutBack.transform(_bounce.value.clamp(0, 1));
          final scale = 1.0 + t * 0.35 * (1 - t);
          return Transform.scale(scale: scale, child: child);
        },
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.92),
            shape: BoxShape.circle,
            border: Border.all(
              color: widget.active
                  ? AppColors.rose.withValues(alpha: 0.6)
                  : AppColors.gold.withValues(alpha: 0.35),
              width: widget.active ? 1.5 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: widget.active
                    ? AppColors.rose.withValues(alpha: 0.25)
                    : Colors.black.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: AnimatedSwitcher(
            duration: AppMotion.fast,
            transitionBuilder: (child, anim) => ScaleTransition(
              scale: anim,
              child: FadeTransition(opacity: anim, child: child),
            ),
            child: Icon(
              widget.active
                  ? Icons.favorite_rounded
                  : Icons.favorite_border_rounded,
              key: ValueKey(widget.active),
              size: 16,
              color: widget.active ? AppColors.rose : AppColors.primaryDark,
            ),
          ),
        ),
      ),
    );
  }
}

// ============================ SHADE DOTS ============================
class _ShadeDots extends StatelessWidget {
  const _ShadeDots({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    final shades = product.shades!;
    final visible = shades.take(3).toList();
    final extra = shades.length - visible.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(AppSizes.pillRadius),
        border: Border.all(color: AppColors.divider),
        boxShadow: const [AppColors.softShadow],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < visible.length; i++)
            Padding(
              padding: EdgeInsets.only(right: i == visible.length - 1 ? 0 : 3),
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: Color(
                    int.parse(
                      visible[i].colorHex.replaceFirst('#', '0xFF'),
                    ),
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 1,
                  ),
                ),
              ),
            ),
          if (extra > 0) ...[
            const SizedBox(width: 4),
            Text(
              '+$extra',
              style: AppTextStyles.caption(
                color: AppColors.primaryDark,
                size: 8.5,
              ).copyWith(fontWeight: FontWeight.w800),
            ),
          ],
        ],
      ),
    );
  }
}

// ============================ BRAND ROW ============================
class _BrandRow extends StatelessWidget {
  const _BrandRow({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            product.brand.toUpperCase(),
            style: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 9.2,
            ).copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.star_rounded,
                size: 10,
                color: AppColors.gold,
              ),
              const SizedBox(width: 2),
              Text(
                product.rating.toStringAsFixed(1),
                style: AppTextStyles.caption(
                  color: AppColors.textPrimary,
                  size: 8.7,
                ).copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ============================ CART ORB ============================
class _CartOrb extends StatelessWidget {
  const _CartOrb({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onTap,
      scale: 0.86,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: AppColors.primaryDark.withValues(alpha: 0.18),
            width: 0.7,
          ),
        ),
        child: const Icon(
          Icons.add_rounded,
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }
}

// ============================ OUT OF STOCK ORB ============================
class _OutOfStockOrb extends StatelessWidget {
  const _OutOfStockOrb();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider),
      ),
      child: const Icon(
        Icons.block_rounded,
        color: AppColors.textMuted,
        size: 14,
      ),
    );
  }
}
