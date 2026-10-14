import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../core/cache/image_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/ui/ui.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/fullscreen_image_viewer.dart';
import '../../core/widgets/horizontal_product_list.dart';
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
import '../shell/nav_tabs.dart';
import '../wishlist/wishlist_provider.dart';
import '../worlds/world_theme.dart';
import 'widgets/product_detail_theme.dart';
import 'widgets/product_shade_picker.dart';

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
  String? _precachedGalleryStamp;

  @override
  void dispose() {
    _pageCtrl.dispose();
    _collapsed.dispose();
    super.dispose();
  }

  void _precacheGallery(BuildContext context, Product product) {
    final urls = product.galleryUrls;
    if (urls.isEmpty) return;
    final stamp = urls.join('|');
    if (_precachedGalleryStamp == stamp) return;
    _precachedGalleryStamp = stamp;
    precacheProductCovers(
      context,
      urls,
      limit: urls.length.clamp(1, 8),
      layoutWidth: MediaQuery.sizeOf(context).width,
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productDetailProvider(widget.idOrSlug));
    ref.listen(productDetailProvider(widget.idOrSlug), (prev, next) {
      next.whenData((p) => ref.read(recentlyViewedProvider.notifier).add(p));
    });
    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
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
    final s = ref.s;
    final shade = product.shadeForCart(selected: _shade);
    if (product.hasMultipleDisplayableShades && shade == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(s.selectShadeFirst)),
      );
      return;
    }
    HapticFeedback.mediumImpact();
    final added =
        ref.read(cartProvider.notifier).add(product, quantity: _quantity, shade: shade);
    if (!added) {
      AppSnackbar.error(context, s.maxStockReached);
      return;
    }
    AppSnackbar.cartAdded(
      context,
      title: s.addedToCart,
      viewCartLabel: s.viewCart,
      onViewCart: () {
        context.go('/');
        ref.read(navIndexProvider.notifier).state = NavTabs.cart;
      },
    );
  }

  List<String> _galleryUrls(Product product, ProductShade? shade) {
    final urls = <String>[];
    final shadeUrl = shade?.image?.full ?? shade?.image?.thumb ?? '';
    if (shadeUrl.isNotEmpty) urls.add(shadeUrl);
    for (final u in product.galleryUrls) {
      if (u.isNotEmpty && !urls.contains(u)) urls.add(u);
    }
    if (urls.isEmpty) urls.add('');
    return urls;
  }

  void _syncShadeSelection(Product product) {
    final shades = product.displayableShades;
    if (!product.hasMultipleDisplayableShades) {
      final sole = product.soleDisplayableShade;
      if (_shade?.id != sole?.id) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) setState(() => _shade = sole);
        });
      }
      return;
    }
    if (shades.isEmpty) {
      if (_shade != null) setState(() => _shade = null);
      return;
    }
    if (_shade != null && shades.any((s) => s.id == _shade!.id)) return;
    final pick = shades.firstWhere((s) => s.inStock, orElse: () => shades.first);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _shade = pick);
    });
  }

  /// يظهر اسم المنتج في الشريط العلوي بعد تجاوز المعرض.
  final _collapsed = ValueNotifier<bool>(false);

  Widget _buildContent(Product product) {
    final shades = product.displayableShades;
    _syncShadeSelection(product);
    _precacheGallery(context, product);
    final gallery = _galleryUrls(product, _shade);
    final zoomableUrls = gallery.where((u) => u.trim().isNotEmpty).toList();

    final collapseAt = Responsive.galleryExpandedHeight(context, hasThumbs: gallery.length > 1) -
        kToolbarHeight -
        MediaQuery.paddingOf(context).top;
    return NotificationListener<ScrollUpdateNotification>(
      onNotification: (n) {
        if (n.depth == 0) _collapsed.value = n.metrics.pixels > collapseAt;
        return false;
      },
      child: CustomScrollView(
      slivers: [
        _GalleryAppBar(
          collapsed: _collapsed,
          product: product,
          gallery: gallery,
          zoomableUrls: zoomableUrls,
          imageIndex: _imageIndex,
          pageCtrl: _pageCtrl,
          selectedShade: _shade,
          onPageChanged: (i) => setState(() => _imageIndex = i),
        ),
        SliverToBoxAdapter(
          child: Transform.translate(
            offset: const Offset(0, -ProductDetailTheme.overlap),
            child: DecoratedBox(
              decoration: ProductDetailTheme.sheetDecoration(context),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 10),
                  Center(
                    child: Container(
                      width: 32,
                      height: 3.5,
                      decoration: BoxDecoration(
                        color: context.worldTheme.accentSoft,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _ProductTitleBlock(product: product),
                  if (product.hasMultipleDisplayableShades) ...[
                    Container(
                      margin: const EdgeInsets.fromLTRB(
                        ProductDetailTheme.padH,
                        ProductDetailTheme.sectionGap,
                        ProductDetailTheme.padH,
                        0,
                      ),
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                      decoration: ProductDetailTheme.shadeSectionDecoration(context),
                      child: ProductShadePicker(
                        shades: shades,
                        selected: _shade,
                        strings: ref.s,
                        onSelect: (s) => setState(() => _shade = s),
                      ),
                    ),
                  ],
                  _ProductCommerceBlock(
                    product: product,
                    shade: _shade,
                    quantity: _quantity,
                    onQuantityChanged: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _quantity = v);
                    },
                  ),
                  const _TrustStrip(),
                  if (product.localizedDescription(ref.watch(languageCodeProvider)).isNotEmpty ||
                      product.howToUse.isNotEmpty ||
                      product.ingredients.isNotEmpty)
                    _SectionCard(
                      padding: EdgeInsets.zero,
                      child: _InfoSections(product: product),
                    ),
                  _SectionCard(
                    child: _ReviewsSection(product: product, idOrSlug: widget.idOrSlug),
                  ),
                  if (product.category != null)
                    _SimilarProducts(
                      categoryId: product.category!.id,
                      excludeId: product.id,
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ],
      ),
    );
  }
}

/// معرض الصور — خلفية بيضاء، أزرار عائمة، مصغّرات أسفل الصورة.
class _GalleryAppBar extends ConsumerWidget {
  final ValueListenable<bool> collapsed;
  final Product product;
  final List<String> gallery;
  final List<String> zoomableUrls;
  final int imageIndex;
  final PageController pageCtrl;
  final ProductShade? selectedShade;
  final ValueChanged<int> onPageChanged;

  const _GalleryAppBar({
    required this.collapsed,
    required this.product,
    required this.gallery,
    required this.zoomableUrls,
    required this.imageIndex,
    required this.pageCtrl,
    this.selectedShade,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wished = ref.watch(wishlistProvider.select((s) => s.ids.contains(product.id)));
    final galleryWidth = MediaQuery.sizeOf(context).width;
    final hasThumbs = gallery.length > 1;

    final s = ref.s;

    return SliverAppBar(
      pinned: true,
      expandedHeight: Responsive.galleryExpandedHeight(context, hasThumbs: hasThumbs),
      backgroundColor: ProductDetailTheme.galleryBg(context),
      surfaceTintColor: Colors.transparent,
      leadingWidth: 60,
      leading: const Center(child: AppBackButton()),
      centerTitle: true,
      title: ValueListenableBuilder<bool>(
        valueListenable: collapsed,
        builder: (context, show, _) => AnimatedOpacity(
          opacity: show ? 1 : 0,
          duration: const Duration(milliseconds: 180),
          child: AnimatedSlide(
            offset: show ? Offset.zero : const Offset(0, 0.3),
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            child: Text(
              product.localizedName(ref.watch(languageCodeProvider)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.title3.copyWith(color: context.worldTheme.ink),
            ),
          ),
        ),
      ),
          actions: [
        _CircleAction(
          icon: Icons.ios_share_rounded,
          onTap: () {
            final slug = product.slug.isNotEmpty ? product.slug : product.id;
            final url = AppConfig.productShareUrl(slug);
            Clipboard.setData(ClipboardData(text: url));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(s.linkCopied), behavior: SnackBarBehavior.floating),
            );
          },
        ),
        _CircleAction(
          icon: wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          color: wished ? AppColors.sale : context.worldTheme.ink,
          onTap: () async {
            HapticFeedback.selectionClick();
                if (!ref.read(authProvider).isAuthenticated) {
                  context.push('/login');
                  return;
                }
                await ref.read(wishlistProvider.notifier).toggle(product);
              },
            ),
        const SizedBox(width: 10),
          ],
          flexibleSpace: FlexibleSpaceBar(
        background: DecoratedBox(
          decoration: BoxDecoration(
            color: ProductDetailTheme.galleryBg(context),
            border: Border(bottom: BorderSide(color: context.worldTheme.hairline, width: 0.5)),
          ),
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
                              label: formatDiscount(product.discountPercent),
                              color: AppColors.sale,
                            )
                          else if (product.isNew)
                            _GalleryBadge(label: s.newBadge, color: context.worldTheme.accentDark),
                          if (product.isBestSeller) ...[
                            const SizedBox(width: 6),
                            _GalleryBadge(label: s.bestSeller, color: context.worldTheme.accent),
                          ],
                        ],
                      ),
                    ),
                    // عدّاد الصور — pill زجاجي أنيق.
                    if (gallery.length > 1)
                      PositionedDirectional(
                        end: 14,
                        bottom: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                          decoration: BoxDecoration(
                            color: context.worldTheme.ink.withValues(alpha: 0.45),
                            borderRadius: BorderRadius.circular(99),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${imageIndex + 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  height: 1,
                                ),
                              ),
                              Text(
                                ' / ${gallery.length}',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.65),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                  height: 1,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    else if (zoomableUrls.isNotEmpty)
                      PositionedDirectional(
                        end: 14,
                        bottom: 12,
                        child: Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: context.worldTheme.ink.withValues(alpha: 0.45),
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
                if (selectedShade != null) _GalleryShadeAccent(shade: selectedShade!),
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
                            color: context.worldTheme.blush,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: active ? context.worldTheme.accent : context.worldTheme.hairline,
                              width: active ? 1.8 : 0.8,
                            ),
                            boxShadow: active ? context.worldTheme.cardShadow : null,
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
              ] else if (gallery.length > 1) ...[
                  if (selectedShade != null) _GalleryShadeAccent(shade: selectedShade!),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, top: 4),
                    child: AnimatedSmoothIndicator(
                    activeIndex: imageIndex,
                      count: gallery.length,
                      effect: WormEffect(
                        dotHeight: 7,
                        dotWidth: 7,
                        activeDotColor: context.worldTheme.accent,
                        dotColor: context.worldTheme.hairline,
                      ),
                    ),
                  ),
              ] else if (selectedShade != null) ...[
                _GalleryShadeAccent(shade: selectedShade!),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// شريط التدرج المختار — يربط المعرض باختيار الدرجة.
class _GalleryShadeAccent extends StatelessWidget {
  final ProductShade shade;

  const _GalleryShadeAccent({required this.shade});

  @override
  Widget build(BuildContext context) {
    final colors = shadeGradientColors(shade);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(99),
        child: SizedBox(
          height: 5,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: colors,
              ),
            ),
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
    this.color = AppColors.ink,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Material(
        color: context.worldTheme.surface,
        elevation: 0,
        shadowColor: context.worldTheme.accentDark.withValues(alpha: 0.1),
        shape: CircleBorder(
          side: BorderSide(color: context.worldTheme.hairline.withValues(alpha: 0.7), width: 0.6),
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

  const _SectionCard({
    required this.child,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(ProductDetailTheme.padH, ProductDetailTheme.sectionGap, ProductDetailTheme.padH, 0),
      padding: padding ?? const EdgeInsets.all(16),
      decoration: ProductDetailTheme.sectionDecoration(context),
      child: child,
    );
  }
}

/// عنوان المنتج — شريحة براند + تقييم داخل بطاقة سطر أنيقة.
class _ProductTitleBlock extends ConsumerWidget {
  final Product product;

  const _ProductTitleBlock({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final t = context.worldTheme;
    final brand = product.brandNameFor(lang);

    return Padding(
      padding: const EdgeInsets.fromLTRB(ProductDetailTheme.padH, 0, ProductDetailTheme.padH, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (brand.isNotEmpty) ...[
            // شريحة البراند مع نقطة توقيع — بداية تحريرية للصفحة.
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: t.accentLight,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: t.accentSoft.withValues(alpha: 0.7)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      gradient: t.signatureGradient,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      brand.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: t.accentDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 10.5,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
          Text(
            product.localizedName(lang),
            style: AppTypography.sectionTitle.copyWith(
              fontSize: 21,
              height: 1.3,
              letterSpacing: -0.45,
              fontWeight: FontWeight.w800,
              color: t.ink,
            ),
          ),
          const SizedBox(height: 10),
          // سطر الأدلة: تقييم + مبيعات داخل pill ناعم موحّد.
          if (product.rating > 0 || product.soldCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
              decoration: BoxDecoration(
                color: t.canvasWarm,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: t.hairline.withValues(alpha: 0.7)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (product.rating > 0) ...[
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 15),
                    const SizedBox(width: 3),
                    Text(
                      product.rating.toStringAsFixed(1),
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: t.ink),
                    ),
                    if (product.reviewCount > 0) ...[
                      const SizedBox(width: 5),
                      Text(
                        '(${product.reviewCount})',
                        style: TextStyle(color: t.inkMuted, fontSize: 11.5, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                  if (product.rating > 0 && product.soldCount > 0) ...[
                    const SizedBox(width: 7),
                    Container(width: 3.5, height: 3.5, decoration: BoxDecoration(color: t.inkMuted, shape: BoxShape.circle)),
                    const SizedBox(width: 7),
                  ],
                  if (product.soldCount > 0)
                    Flexible(
                      child: Text(
                        '${formatNumber(product.soldCount)}+ ${s.sales}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: t.inkMuted, fontSize: 11.5, fontWeight: FontWeight.w600),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// السعر، المخزون، والكمية — بطاقة الشراء الرئيسية بعمق بصري.
class _ProductCommerceBlock extends ConsumerWidget {
  final Product product;
  final ProductShade? shade;
  final int quantity;
  final ValueChanged<int> onQuantityChanged;

  const _ProductCommerceBlock({
    required this.product,
    required this.shade,
    required this.quantity,
    required this.onQuantityChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final price = shade?.price ?? product.price;
    final t = context.worldTheme;
    final stock = shade?.stock ?? product.stock;

    return Container(
      margin: const EdgeInsets.fromLTRB(ProductDetailTheme.padH, ProductDetailTheme.sectionGap, ProductDetailTheme.padH, 0),
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
      decoration: ProductDetailTheme.heroCardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // صف السعر — القيمة الكبيرة مع شريط لوني جانبي يمنحها تسلسلاً هرمياً.
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                width: 4,
                height: 34,
                margin: const EdgeInsetsDirectional.only(end: 10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: product.hasDiscount
                        ? [AppColors.sale, AppColors.sale.withValues(alpha: 0.35)]
                        : [t.accent, t.accent.withValues(alpha: 0.35)],
                  ),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              Expanded(
                child: Wrap(
                  crossAxisAlignment: WrapCrossAlignment.end,
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    Text(
                      formatPrice(price),
                      style: AppTypography.priceLarge.copyWith(
                        fontSize: Responsive.priceDisplaySize(context),
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.6,
                        color: product.hasDiscount ? AppColors.sale : t.ink,
                      ),
                    ),
                    if (product.hasDiscount) ...[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          formatPrice(product.originalPrice),
                          style: TextStyle(
                            color: t.inkMuted,
                            decoration: TextDecoration.lineThrough,
                            fontSize: 12.5,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.sale.withValues(alpha: 0.14),
                                AppColors.sale.withValues(alpha: 0.05),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(99),
                            border: Border.all(color: AppColors.sale.withValues(alpha: 0.35)),
                          ),
                          child: Text(
                            s.savePercent(product.discountPercent),
                            style: TextStyle(
                              color: AppColors.sale,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              _StockBadge(stock: stock),
              const Spacer(),
              if (stock > 0)
                Text(
                  s.quantity,
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: t.inkMuted),
                ),
              if (stock > 0) const SizedBox(width: 10),
              if (stock > 0)
                QuantityStepper(
                  quantity: quantity,
                  onChanged: onQuantityChanged,
                  max: stock.clamp(1, 99),
                  compact: true,
                ),
            ],
          ),
          if (product.pointsEarned > 0) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: AlignmentDirectional.centerStart,
                  end: AlignmentDirectional.centerEnd,
                  colors: [
                    t.accentLight.withValues(alpha: 0.65),
                    t.accentLight.withValues(alpha: 0.25),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: t.accentSoft.withValues(alpha: 0.6)),
              ),
              child: Row(
                children: [
                  Icon(Icons.stars_rounded, color: t.accentDark, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      s.earnPoints(product.pointsEarned),
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5, color: t.inkSoft),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StockBadge extends ConsumerWidget {
  final int stock;
  const _StockBadge({required this.stock});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final inStock = stock > 0;
    final low = inStock && stock <= 5;
    final color = !inStock ? AppColors.sale : (low ? AppColors.warning : AppColors.success);
    final label = !inStock ? s.outOfStockNow : (low ? s.lowStock(stock) : s.inStock);

    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: AlignmentDirectional.centerStart,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: ProductDetailTheme.stockPillDecoration(color),
          child: Text(
            label,
            maxLines: 1,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 11,
              height: 1.2,
            ),
          ),
        ),
      ),
    );
  }
}



/// شريط الثقة — رقائق أفقية خفيفة مع دوائر أيقون.
class _TrustStrip extends ConsumerWidget {
  const _TrustStrip();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Padding(
      padding: const EdgeInsets.fromLTRB(ProductDetailTheme.padH, ProductDetailTheme.sectionGap, ProductDetailTheme.padH, 0),
      child: DecoratedBox(
        decoration: ProductDetailTheme.sectionDecoration(context),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          child: Row(
            children: [
              Expanded(child: _TrustChip(icon: Icons.verified_outlined, label: s.authentic100)),
              Container(width: 1, height: 34, color: context.worldTheme.divider),
              Expanded(child: _TrustChip(icon: Icons.local_shipping_outlined, label: s.fastDelivery)),
              Container(width: 1, height: 34, color: context.worldTheme.divider),
              Expanded(child: _TrustChip(icon: Icons.payments_outlined, label: s.securePayment)),
            ],
          ),
        ),
      ),
    );
  }
}

class _TrustChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TrustChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.accentLight.withValues(alpha: 0.8),
              border: Border.all(color: t.accentSoft.withValues(alpha: 0.7)),
            ),
            child: Icon(icon, color: t.accentDark, size: 15),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: t.inkSoft,
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}

/// أقسام المعلومات — قابلة للتوسيع بدل تبويبات مقصوصة.
class _InfoSections extends ConsumerWidget {
  final Product product;
  const _InfoSections({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.watch(stringsProvider);
    final desc = cleanRichText(product.localizedDescription(lang));
    final sections = <(IconData, String, String)>[
      if (desc.isNotEmpty) (Icons.notes_rounded, s.description, desc),
      if (product.howToUse.isNotEmpty)
        (Icons.auto_fix_high_rounded, s.howToUse, cleanRichText(product.howToUse)),
      if (product.ingredients.isNotEmpty)
        (Icons.science_outlined, s.ingredients, cleanRichText(product.ingredients)),
    ];

    return Column(
      children: [
        for (var i = 0; i < sections.length; i++) ...[
          if (i > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Divider(height: 1, thickness: 0.6, color: context.worldTheme.divider),
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
                    color: context.worldTheme.accentLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(widget.icon, size: 17, color: context.worldTheme.accent),
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
                  child: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: context.worldTheme.inkMuted,
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
                style: TextStyle(
                  height: 1.7,
                  color: context.worldTheme.inkSoft,
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
  final String idOrSlug;
  const _ReviewsSection({required this.product, required this.idOrSlug});

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
      ref.invalidate(productDetailProvider(widget.idOrSlug));
      if (mounted) {
        setState(() {
          _showForm = false;
          _commentCtrl.clear();
          _rating = 5;
        });
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(ref.s.thanksForReview)));
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
    final s = ref.s;
    final t = context.worldTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                s.ratingsTitle,
                style: ProductDetailTheme.sectionTitleStyle(context),
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
                foregroundColor: context.worldTheme.accent,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              icon: Icon(_showForm ? Icons.close_rounded : Icons.rate_review_outlined, size: 17),
              label: Text(
                _showForm ? s.cancel : s.addReview,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
              ),
              ),
          ],
        ),
        if (product.rating > 0) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: AlignmentDirectional.centerStart,
                end: AlignmentDirectional.centerEnd,
                colors: [
                  t.accentLight.withValues(alpha: 0.9),
                  t.canvasWarm,
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: t.accentSoft.withValues(alpha: 0.6)),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      product.rating.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        height: 1,
                        letterSpacing: -0.8,
                        color: t.ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        for (var i = 1; i <= 5; i++)
                          Icon(
                            i <= product.rating.round()
                                ? Icons.star_rounded
                                : Icons.star_border_rounded,
                            color: AppColors.star,
                            size: 13,
                          ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(width: 14),
                Container(width: 1, height: 38, color: t.hairline),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.fromReviews(product.reviewCount),
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: t.inkSoft,
                        ),
                      ),
                      if (product.soldCount > 0) ...[
                        const SizedBox(height: 3),
                        Text(
                          '${formatNumber(product.soldCount)}+ ${s.sales}',
                          style: TextStyle(fontSize: 11, color: t.inkMuted, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ],
                  ),
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
            unratedColor: context.worldTheme.hairline,
            itemBuilder: (_, __) => const Icon(Icons.star_rounded, color: AppColors.star),
            onRatingUpdate: (v) => setState(() => _rating = v),
          ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _commentCtrl,
            maxLines: 3,
            decoration: InputDecoration(hintText: s.reviewHint),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: context.worldTheme.signatureGradient,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: _submitting ? null : _submit,
                  child: Center(
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(
                            s.submitReview,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                          ),
                  ),
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 6),
        async.when(
          loading: () => Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Center(
                child: CircularProgressIndicator(color: context.worldTheme.accent, strokeWidth: 2)),
          ),
          error: (e, _) => ErrorView(
            message: friendlyError(e),
            onRetry: () => ref.invalidate(productReviewsProvider(widget.product.id)),
          ),
          data: (reviews) {
            if (reviews.isEmpty && !_showForm) {
              return Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  authed ? s.beFirstToReview : s.loginToReview,
                  style: TextStyle(color: context.worldTheme.inkMuted, fontSize: 13),
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
    final t = context.worldTheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: t.canvas,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: t.hairline.withValues(alpha: 0.55)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      t.accentLight,
                      Color.lerp(t.accent, t.accentLight, 0.6)!,
                    ],
                  ),
                  border: Border.all(color: t.accentSoft.withValues(alpha: 0.8)),
                ),
                alignment: Alignment.center,
                child: Text(
                  review.userName.isNotEmpty ? review.userName[0] : '·',
                  style: TextStyle(color: t.accentDark, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.userName,
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: t.ink)),
                    const SizedBox(height: 1),
                    Text(review.dateLabel,
                        style: TextStyle(fontSize: 10.5, color: t.inkMuted)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: t.surface,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  border: Border.all(color: t.hairline, width: 0.7),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                children: [
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 13),
                    const SizedBox(width: 2),
                    Text(
                      review.rating.toStringAsFixed(1),
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5, color: t.ink),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 9),
            Text(review.comment,
                style: TextStyle(
                    height: 1.6, color: t.inkSoft, fontSize: 13)),
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

    final s = ref.s;
    return async.maybeWhen(
      data: (products) {
        if (products.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                ProductDetailTheme.padH,
                22,
                ProductDetailTheme.padH,
                12,
              ),
              child: Text(
                s.youMayAlsoLike,
                style: ProductDetailTheme.sectionTitleStyle(context),
              ),
            ),
            HorizontalProductList(
              products: products,
              padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
            ),
          ],
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

/// الشريط السفلي — الإجمالي + زر إضافة.
class _BottomBar extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final stock = shade?.stock ?? product.stock;
    final enabled = stock > 0;
    final unitPrice = shade?.price ?? product.price;
    final total = unitPrice * quantity;

    final narrow = Responsive.isNarrow(context);

    return Container(
      padding: EdgeInsets.fromLTRB(narrow ? 14 : 18, 12, narrow ? 14 : 18, 12),
      decoration: ProductDetailTheme.bottomBarDecoration(context),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  quantity > 1 ? s.totalWithQty(quantity) : s.total,
                  style: TextStyle(fontSize: 10.5, color: context.worldTheme.inkMuted, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  formatPrice(total),
                  style: AppTypography.price.copyWith(
                    fontSize: narrow ? 17 : 19,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                    color: context.worldTheme.ink,
                  ),
                ),
              ],
            ),
            SizedBox(width: narrow ? 10 : 14),
            Expanded(
              child: SizedBox(
                height: narrow ? 46 : 50,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: enabled ? context.worldTheme.signatureGradient : null,
                    color: enabled ? null : context.worldTheme.divider,
                    borderRadius: BorderRadius.circular(999),
                    boxShadow: enabled
                        ? [
                            BoxShadow(
                              color: context.worldTheme.accent.withValues(alpha: 0.28),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: enabled ? onAdd : null,
                      borderRadius: BorderRadius.circular(999),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.shopping_bag_rounded,
                            size: narrow ? 18 : 20,
                            color: enabled ? Colors.white : context.worldTheme.inkMuted,
                          ),
                          SizedBox(width: narrow ? 6 : 8),
                          Flexible(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                enabled ? s.addToCartBtn : s.outOfStock,
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: narrow ? 13 : 14,
                                  color: enabled ? Colors.white : context.worldTheme.inkMuted,
                                ),
                              ),
                            ),
                          ),
                        ],
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
