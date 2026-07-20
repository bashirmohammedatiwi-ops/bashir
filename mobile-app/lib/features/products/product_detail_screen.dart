import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/fullscreen_image_viewer.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/product_detail_skeleton.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../shell/main_shell.dart';
import '../wishlist/wishlist_provider.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String idOrSlug;
  const ProductDetailScreen({super.key, required this.idOrSlug});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _imageIndex = 0;
  int _quantity = 1;
  ProductShade? _shade;
  final _pageCtrl = PageController();

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productDetailProvider(widget.idOrSlug));
    ref.listen(productDetailProvider(widget.idOrSlug), (prev, next) {
      next.whenData((p) => ref.read(recentlyViewedProvider.notifier).add(p));
    });
    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: async.when(
        loading: () => const ProductDetailSkeleton(),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: ErrorView.from(
            e,
            onRetry: () => ref.invalidate(productDetailProvider(widget.idOrSlug)),
          ),
        ),
        data: (product) => _buildContent(product),
      ),
      bottomNavigationBar: async.maybeWhen(
        data: (product) => _BottomBar(
          product: product,
          quantity: _quantity,
          shade: _shade,
          onAdd: () => _addToCart(product),
        ),
        orElse: () => null,
      ),
    );
  }

  void _addToCart(Product product) {
    if (product.shades.isNotEmpty && _shade == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('يرجى اختيار الدرجة أولاً')));
      return;
    }
    HapticFeedback.mediumImpact();
    ref.read(cartProvider.notifier).add(product, quantity: _quantity, shade: _shade);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: const Text('أُضيف إلى السلة'),
        action: SnackBarAction(
          label: 'عرض السلة',
          textColor: Colors.white,
          onPressed: () {
            context.go('/');
            ref.read(navIndexProvider.notifier).state = 3;
          },
        ),
      ));
  }

  Widget _buildContent(Product product) {
    final gallery = product.galleryUrls.isNotEmpty ? product.galleryUrls : [''];
    final zoomableUrls = gallery.where((u) => u.trim().isNotEmpty).toList();

    return CustomScrollView(
      slivers: [
        _GalleryAppBar(
          product: product,
          gallery: gallery,
          zoomableUrls: zoomableUrls,
          imageIndex: _imageIndex,
          pageCtrl: _pageCtrl,
          onPageChanged: (i) => setState(() => _imageIndex = i),
        ),
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // معلومات أساسية
              _SectionCard(
                child: _MainInfo(product: product, shade: _shade),
              ),
              // الدرجات
              if (product.shades.isNotEmpty)
                _SectionCard(
                  child: _ShadeBlock(
                    shades: product.shades,
                    selected: _shade,
                    onSelect: (s) => setState(() => _shade = s),
                  ),
                ),
              // الكمية + النقاط
              _SectionCard(
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Text('الكمية',
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                        const Spacer(),
                        _QuantityStepper(
                          quantity: _quantity,
                          onChanged: (v) {
                            HapticFeedback.selectionClick();
                            setState(() => _quantity = v);
                          },
                        ),
                      ],
                    ),
                    if (product.pointsEarned > 0) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primaryLight, Color(0xFFFFF9FB)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primarySoft),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.stars_rounded, color: AppColors.primary, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'اكسبي ${product.pointsEarned} نقطة عند شراء هذا المنتج',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 12.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // شريط الثقة
              const _TrustStrip(),
              // الوصف والتفاصيل
              if (product.description.isNotEmpty ||
                  product.howToUse.isNotEmpty ||
                  product.ingredients.isNotEmpty)
                _SectionCard(
                  padding: EdgeInsets.zero,
                  child: _InfoSections(product: product),
                ),
              // التقييمات
              _SectionCard(
                child: _ReviewsSection(product: product),
              ),
              // منتجات مشابهة
              if (product.category != null)
                _SimilarProducts(
                  categoryId: product.category!.id,
                  excludeId: product.id,
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ],
    );
  }
}

/// معرض الصور — خلفية بيضاء، أزرار عائمة، مصغّرات أسفل الصورة.
class _GalleryAppBar extends ConsumerWidget {
  final Product product;
  final List<String> gallery;
  final List<String> zoomableUrls;
  final int imageIndex;
  final PageController pageCtrl;
  final ValueChanged<int> onPageChanged;

  const _GalleryAppBar({
    required this.product,
    required this.gallery,
    required this.zoomableUrls,
    required this.imageIndex,
    required this.pageCtrl,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wished = ref.watch(wishlistProvider.select((s) => s.ids.contains(product.id)));
    final galleryWidth = MediaQuery.sizeOf(context).width;
    final hasThumbs = gallery.length > 1;

    return SliverAppBar(
          pinned: true,
      expandedHeight: hasThumbs ? 448 : 396,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      leading: _CircleAction(
        icon: Icons.arrow_forward_rounded,
        onTap: () => context.pop(),
      ),
          actions: [
        _CircleAction(
          icon: wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          color: wished ? AppColors.sale : AppColors.textPrimary,
          onTap: () async {
            HapticFeedback.selectionClick();
                if (!ref.read(authProvider).isAuthenticated) {
                  context.push('/login');
                  return;
                }
                await ref.read(wishlistProvider.notifier).toggle(product);
              },
            ),
        const SizedBox(width: 8),
          ],
          flexibleSpace: FlexibleSpaceBar(
        background: ColoredBox(
          color: Colors.white,
          child: Column(
              children: [
                Expanded(
                child: Stack(
                  children: [
                    PageView.builder(
                      controller: pageCtrl,
                    itemCount: gallery.length,
                      onPageChanged: onPageChanged,
                      itemBuilder: (_, i) => GestureDetector(
                        onTap: zoomableUrls.isEmpty
                            ? null
                            : () => FullScreenImageViewer.show(
                                  context,
                                  urls: zoomableUrls,
                                  initialIndex: zoomableUrls
                                      .indexOf(gallery[i])
                                      .clamp(0, zoomableUrls.length - 1),
                                ),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 56, 20, 8),
                          child: ProductCoverImage(
                            url: gallery[i],
                            width: galleryWidth,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                    // شارات
                    PositionedDirectional(
                      start: 14,
                      bottom: 12,
                      child: Row(
                        children: [
                          if (product.hasDiscount)
                            _GalleryBadge(
                              label: '-${product.discountPercent}%',
                              color: AppColors.sale,
                            )
                          else if (product.isNew)
                            const _GalleryBadge(label: 'جديد', color: AppColors.ink),
                          if (product.isBestSeller) ...[
                            const SizedBox(width: 6),
                            const _GalleryBadge(label: 'الأكثر مبيعاً', color: AppColors.accent),
                          ],
                        ],
                      ),
                    ),
                    if (zoomableUrls.isNotEmpty)
                      PositionedDirectional(
                        end: 14,
                        bottom: 12,
                        child: Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.32),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.zoom_out_map_rounded,
                              color: Colors.white, size: 15),
                        ),
                      ),
                  ],
                ),
              ),
              if (hasThumbs) ...[
                SizedBox(
                  height: 58,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: gallery.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) {
                      final active = i == imageIndex;
                      return GestureDetector(
                        onTap: () => pageCtrl.animateToPage(
                          i,
                          duration: const Duration(milliseconds: 260),
                          curve: Curves.easeOutCubic,
                        ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 54,
                          decoration: BoxDecoration(
                      color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: active ? AppColors.primary : AppColors.hairline,
                              width: active ? 1.8 : 0.8,
                            ),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Padding(
                            padding: const EdgeInsets.all(4),
                            child: ProductCoverImage(
                              url: gallery[i],
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 10),
              ] else if (gallery.length > 1)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, top: 4),
                    child: AnimatedSmoothIndicator(
                    activeIndex: imageIndex,
                      count: gallery.length,
                      effect: const WormEffect(
                        dotHeight: 7,
                        dotWidth: 7,
                        activeDotColor: AppColors.primary,
                        dotColor: AppColors.border,
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

class _CircleAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  const _CircleAction({
    required this.icon,
    required this.onTap,
    this.color = AppColors.textPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Material(
        color: Colors.white,
        shape: CircleBorder(
          side: BorderSide(color: AppColors.hairline.withValues(alpha: 0.9), width: 0.7),
        ),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(
            width: 40,
            height: 40,
            child: Icon(icon, size: 20, color: color),
          ),
        ),
      ),
    );
  }
}

class _GalleryBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _GalleryBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w900,
          height: 1,
        ),
      ),
    );
  }
}

/// بطاقة قسم موحّدة للمحتوى.
class _SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;

  const _SectionCard({required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(AppSpacing.lg, 10, AppSpacing.lg, 0),
      padding: padding ?? const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.hairline, width: 0.7),
        boxShadow: AppColors.cardShadow,
      ),
      child: child,
    );
  }
}

/// الاسم والعلامة والتقييم والسعر.
class _MainInfo extends StatelessWidget {
  final Product product;
  final ProductShade? shade;

  const _MainInfo({required this.product, required this.shade});

  @override
  Widget build(BuildContext context) {
    final price = shade?.price ?? product.price;

    return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
            if (product.brandName.isNotEmpty)
              Expanded(
                child: Text(
                  product.brandName.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 0.6,
                  ),
                ),
              )
            else
                    const Spacer(),
                    if (product.soldCount > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accentSoft,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  '${formatNumber(product.soldCount)}+ عملية بيع',
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.accent,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 7),
        Text(
          product.name,
          style: AppTypography.sectionTitle.copyWith(fontSize: 19, height: 1.35),
        ),
        const SizedBox(height: 10),
        if (product.rating > 0)
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF8E8),
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  border: Border.all(color: const Color(0xFFF5E3B8)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 15),
                    const SizedBox(width: 3),
                    Text(
                      product.rating.toStringAsFixed(1),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '(${product.reviewCount} تقييم)',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
            ],
          ),
        const SizedBox(height: 12),
        const Divider(height: 1, thickness: 0.6, color: AppColors.divider),
        const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
            Text(
              formatPrice(price),
              style: AppTypography.priceLarge.copyWith(
                color: product.hasDiscount ? AppColors.sale : AppColors.textPrimary,
              ),
            ),
                    const SizedBox(width: 10),
            if (product.hasDiscount) ...[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 3),
                child: Text(
                  formatPrice(product.originalPrice),
                            style: const TextStyle(
                                color: AppColors.textMuted,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
                      ),
                    const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                    color: AppColors.sale,
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: Text(
                    'وفّري ${product.discountPercent}%',
                            style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 10),
        _StockBadge(stock: shade?.stock ?? product.stock),
      ],
    );
  }
}

class _StockBadge extends StatelessWidget {
  final int stock;
  const _StockBadge({required this.stock});

  @override
  Widget build(BuildContext context) {
    final inStock = stock > 0;
    final low = inStock && stock <= 5;
    final color = !inStock ? AppColors.sale : (low ? AppColors.warning : AppColors.success);
    final label = !inStock ? 'غير متوفر حالياً' : (low ? 'متبقٍ $stock قطع فقط — اطلبي الآن' : 'متوفر في المخزون');

    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 7),
        Text(
          label,
          style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12.5),
        ),
      ],
    );
  }
}

/// اختيار الدرجة — دوائر ملونة مع اسم الدرجة المختارة.
class _ShadeBlock extends StatelessWidget {
  final List<ProductShade> shades;
  final ProductShade? selected;
  final ValueChanged<ProductShade> onSelect;

  const _ShadeBlock({
    required this.shades,
    required this.selected,
    required this.onSelect,
  });

  Color _color(String hex) {
    final h = hex.replaceAll('#', '');
    final v = h.length == 6 ? 'FF$h' : h;
    return Color(int.tryParse(v, radix: 16) ?? 0xFFCCCCCC);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('اختاري الدرجة',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            const Spacer(),
            if (selected != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  selected!.name,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final s in shades)
          GestureDetector(
                onTap: s.inStock
                    ? () {
                        HapticFeedback.selectionClick();
                        onSelect(s);
                      }
                    : null,
            child: Opacity(
                  opacity: s.inStock ? 1 : 0.35,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 44,
                    height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [
                    _color(s.colorHex),
                    _color(s.colorHexEnd ?? s.colorHex),
                  ]),
                  border: Border.all(
                    color: selected?.id == s.id ? AppColors.primary : AppColors.border,
                        width: selected?.id == s.id ? 2.5 : 1,
                      ),
                      boxShadow: selected?.id == s.id
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.25),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : null,
                ),
                child: selected?.id == s.id
                        ? const Icon(Icons.check_rounded, color: Colors.white, size: 18)
                    : null,
              ),
            ),
              ),
          ],
          ),
      ],
    );
  }
}

class _QuantityStepper extends StatelessWidget {
  final int quantity;
  final ValueChanged<int> onChanged;
  const _QuantityStepper({required this.quantity, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.hairline, width: 0.7),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepBtn(
            icon: Icons.remove_rounded,
            enabled: quantity > 1,
            onTap: () => onChanged(quantity - 1),
          ),
          SizedBox(
            width: 38,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
            ),
          ),
          _StepBtn(
            icon: Icons.add_rounded,
            enabled: true,
            onTap: () => onChanged(quantity + 1),
          ),
        ],
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _StepBtn({required this.icon, required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 38,
        height: 38,
        child: Icon(
          icon,
          size: 19,
          color: enabled ? AppColors.textPrimary : AppColors.textMuted,
        ),
      ),
    );
  }
}

/// شريط الثقة — ثلاث ركائز.
class _TrustStrip extends StatelessWidget {
  const _TrustStrip();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(AppSpacing.lg, 10, AppSpacing.lg, 0),
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.blush, Color(0xFFFDF9FA)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primarySoft.withValues(alpha: 0.6)),
      ),
      child: const Row(
        children: [
          _TrustItem(icon: Icons.verified_rounded, label: 'منتجات\nأصلية 100%'),
          _TrustDivider(),
          _TrustItem(icon: Icons.local_shipping_rounded, label: 'توصيل\nسريع'),
          _TrustDivider(),
          _TrustItem(icon: Icons.lock_rounded, label: 'دفع\nآمن'),
        ],
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TrustItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
              children: [
          Icon(icon, color: AppColors.primary, size: 21),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
                        style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              height: 1.3,
              color: AppColors.textSecondary,
            ),
                  ),
              ],
            ),
    );
  }
}

class _TrustDivider extends StatelessWidget {
  const _TrustDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 0.7,
      height: 34,
      color: AppColors.primarySoft,
    );
  }
}

/// أقسام المعلومات — قابلة للتوسيع بدل تبويبات مقصوصة.
class _InfoSections extends StatelessWidget {
  final Product product;
  const _InfoSections({required this.product});

  @override
  Widget build(BuildContext context) {
    final sections = <(IconData, String, String)>[
      if (product.description.isNotEmpty)
        (Icons.notes_rounded, 'الوصف', product.description),
      if (product.howToUse.isNotEmpty)
        (Icons.auto_fix_high_rounded, 'طريقة الاستخدام', product.howToUse),
      if (product.ingredients.isNotEmpty)
        (Icons.science_outlined, 'المكوّنات', product.ingredients),
    ];

    return Column(
      children: [
        for (var i = 0; i < sections.length; i++) ...[
          if (i > 0)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 14),
              child: Divider(height: 1, thickness: 0.6, color: AppColors.divider),
            ),
          _InfoExpandable(
            icon: sections[i].$1,
            title: sections[i].$2,
            body: sections[i].$3,
            initiallyExpanded: i == 0,
          ),
        ],
      ],
    );
  }
}

class _InfoExpandable extends StatefulWidget {
  final IconData icon;
  final String title;
  final String body;
  final bool initiallyExpanded;

  const _InfoExpandable({
    required this.icon,
    required this.title,
    required this.body,
    this.initiallyExpanded = false,
  });

  @override
  State<_InfoExpandable> createState() => _InfoExpandableState();
}

class _InfoExpandableState extends State<_InfoExpandable> {
  late bool _expanded = widget.initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(widget.icon, size: 17, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    widget.title,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 220),
                  child: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: const SizedBox(width: double.infinity),
          secondChild: Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(
                widget.body,
                style: const TextStyle(
                  height: 1.7,
                  color: AppColors.textSecondary,
                  fontSize: 13.5,
                ),
              ),
            ),
          ),
          crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 220),
          sizeCurve: Curves.easeOutCubic,
        ),
      ],
    );
  }
}

/// التقييمات — ملخّص واضح + نموذج + قائمة.
class _ReviewsSection extends ConsumerStatefulWidget {
  final Product product;
  const _ReviewsSection({required this.product});

  @override
  ConsumerState<_ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends ConsumerState<_ReviewsSection> {
  bool _showForm = false;
  double _rating = 5;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!ref.read(authProvider).isAuthenticated) {
      context.push('/login');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(apiServiceProvider).addReview(
            widget.product.id,
            _rating,
            _commentCtrl.text.trim(),
          );
      ref.invalidate(productReviewsProvider(widget.product.id));
      ref.invalidate(productDetailProvider(widget.product.id));
      if (mounted) {
        setState(() {
          _showForm = false;
          _commentCtrl.clear();
          _rating = 5;
        });
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('شكراً على تقييمك!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(friendlyError(e)), backgroundColor: AppColors.sale));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productReviewsProvider(widget.product.id));
    final authed = ref.watch(authProvider).isAuthenticated;
    final product = widget.product;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'التقييمات',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
              ),
            ),
              TextButton.icon(
              onPressed: () {
                if (!authed) {
                  context.push('/login');
                  return;
                }
                setState(() => _showForm = !_showForm);
              },
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              icon: Icon(_showForm ? Icons.close_rounded : Icons.rate_review_outlined, size: 17),
              label: Text(
                _showForm ? 'إلغاء' : 'أضيفي تقييماً',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
              ),
              ),
          ],
        ),
        if (product.rating > 0) ...[
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBF2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF5E9CC)),
            ),
            child: Row(
              children: [
                Text(
                  product.rating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    height: 1,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        for (var i = 1; i <= 5; i++)
                          Icon(
                            i <= product.rating.round()
                                ? Icons.star_rounded
                                : Icons.star_border_rounded,
                            color: AppColors.star,
                            size: 18,
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'من ${product.reviewCount} تقييم',
                      style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
        if (_showForm) ...[
          const SizedBox(height: 14),
          Center(
            child: RatingBar.builder(
            initialRating: _rating,
            minRating: 1,
            direction: Axis.horizontal,
            allowHalfRating: true,
            itemCount: 5,
              itemSize: 32,
            unratedColor: AppColors.border,
            itemBuilder: (_, __) => const Icon(Icons.star_rounded, color: AppColors.star),
            onRatingUpdate: (v) => setState(() => _rating = v),
          ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _commentCtrl,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'اكتبي تجربتك مع المنتج...'),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('إرسال التقييم'),
            ),
          ),
        ],
        const SizedBox(height: 6),
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(
                child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
          ),
          error: (_, __) => const SizedBox.shrink(),
          data: (reviews) {
            if (reviews.isEmpty && !_showForm) {
              return Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  authed ? 'كوني أول من يقيّم هذا المنتج' : 'سجّلي الدخول لإضافة تقييم',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              );
            }
            return Column(
              children: [
                const SizedBox(height: 4),
                for (final Review r in reviews.take(5)) _ReviewTile(review: r),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final Review review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: BorderRadius.circular(13),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primaryLight,
                child: Text(
                  review.userName.isNotEmpty ? review.userName[0] : '؟',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.userName,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    Text(review.dateLabel,
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  border: Border.all(color: AppColors.hairline, width: 0.7),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                children: [
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 14),
                    const SizedBox(width: 2),
                    Text(
                      review.rating.toStringAsFixed(1),
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment,
                style: const TextStyle(
                    height: 1.55, color: AppColors.textSecondary, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

/// منتجات مشابهة من نفس القسم.
class _SimilarProducts extends ConsumerWidget {
  final String categoryId;
  final String excludeId;

  const _SimilarProducts({required this.categoryId, required this.excludeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(
      similarProductsProvider((categoryId: categoryId, excludeId: excludeId)),
    );

    return async.maybeWhen(
      data: (products) {
        if (products.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(AppSpacing.lg, 22, AppSpacing.lg, 12),
              child: Text(
                'قد يعجبكِ أيضاً',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
              ),
            ),
            SizedBox(
              height: 296,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: products.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => ProductCard(
                  product: products[i],
                  width: 168,
                ),
              ),
            ),
          ],
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

/// الشريط السفلي — الإجمالي + زر إضافة بتدرج فاخر.
class _BottomBar extends StatelessWidget {
  final Product product;
  final int quantity;
  final ProductShade? shade;
  final VoidCallback onAdd;

  const _BottomBar({
    required this.product,
    required this.quantity,
    required this.shade,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    final stock = shade?.stock ?? product.stock;
    final enabled = stock > 0;
    final unitPrice = shade?.price ?? product.price;
    final total = unitPrice * quantity;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppColors.divider, width: 0.7)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  quantity > 1 ? 'الإجمالي ($quantity قطع)' : 'الإجمالي',
                  style: const TextStyle(fontSize: 10.5, color: AppColors.textMuted),
                ),
                const SizedBox(height: 2),
                Text(
                  formatPrice(total),
                  style: AppTypography.price.copyWith(fontSize: 17),
                ),
              ],
            ),
            const SizedBox(width: 14),
            Expanded(
        child: SizedBox(
                height: 50,
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(15),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: enabled ? AppColors.primaryGradient : null,
                      color: enabled ? null : AppColors.divider,
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: enabled
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                blurRadius: 14,
                                offset: const Offset(0, 5),
                              ),
                            ]
                          : null,
                    ),
                    child: InkWell(
                      onTap: enabled ? onAdd : null,
                      borderRadius: BorderRadius.circular(15),
                      child: Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.shopping_bag_rounded,
                              color: enabled ? Colors.white : AppColors.textMuted,
                              size: 19,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              enabled ? 'إضافة إلى السلة' : 'غير متوفر',
                              style: TextStyle(
                                color: enabled ? Colors.white : AppColors.textMuted,
                                fontWeight: FontWeight.w900,
                                fontSize: 14.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
