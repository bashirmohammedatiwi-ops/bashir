import 'package:flutter/foundation.dart';
import '../checkout/delivery_estimate.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../core/cache/image_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/navigation/product_nav.dart';
import '../../core/push/push_service.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ds_strings.dart';
import '../cart/cart_strings.dart';
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
import '../alerts/restock_watch_provider.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../wishlist/wishlist_provider.dart';
import '../worlds/world_theme.dart';
import 'widgets/added_to_cart_sheet.dart';
import 'widgets/product_detail_theme.dart';
import 'widgets/product_shade_picker.dart';
import '../worlds/worlds_provider.dart';

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
    // فُتح من بطاقة: نعرض المنتج فوراً ببياناتها، والتفاصيل تكتمل حين تصل.
    final seed = ProductSeeds.get(widget.idOrSlug);
    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
      body: async.when(
        loading: () => seed != null ? _buildContent(seed) : const ProductDetailSkeleton(),
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
        loading: () => seed == null
            ? null
            : _BottomBar(
                product: seed,
                quantity: _quantity,
                shade: _shade,
                // نسخة البطاقة المختصرة لا تعرف الدرجات بعد: الإضافة تنتظر التفاصيل
                // حتى لا يُضاف منتج متعدد الدرجات بلا درجة.
                onAdd: ProductSeeds.isLite(widget.idOrSlug) || (seed.shades.isEmpty && seed.shadeCount > 1)
                    ? null
                    : () => _addToCart(seed),
              ),
        orElse: () => null,
      ),
    );
  }

  void _addToCart(Product product) {
    final s = ref.s;
    final shade = product.shadeForCart(selected: _shade);
    if (product.hasMultipleDisplayableShades && shade == null) {
      AppSnackbar.show(context, s.selectShadeFirst);
      return;
    }
    HapticFeedback.mediumImpact();
    // ما أُضيف فعلاً — قد يكون أقل من المطلوب إن لم يكفِ المخزون.
    final added = ref.read(cartProvider.notifier).addCounted(product, quantity: _quantity, shade: shade);
    if (added <= 0) {
      AppSnackbar.error(context, s.maxStockReached);
      return;
    }
    if (added < _quantity) {
      AppSnackbar.show(context, s.onlyAddedInStock(added));
    }
    // تأكيد واضح + ما يكمّله + كم يبقى للتوصيل المجاني (بدل إشعار عابر).
    showAddedToCartSheet(
      context,
      product: product,
      shade: shade,
      quantity: added,
      lang: ref.read(languageCodeProvider),
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
                        // الكمية لا تتجاوز مخزون الدرجة الجديدة.
                        onSelect: (s) => setState(() {
                          _shade = s;
                          if (s.stock > 0 && _quantity > s.stock) _quantity = s.stock;
                          if (_quantity < 1) _quantity = 1;
                        }),
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
                  _BoughtTogether(product: product),
                  _SectionCard(
                    child: _ReviewsSection(product: product, idOrSlug: widget.idOrSlug),
                  ),
                  if (product.category != null)
                    _SimilarProducts(
                      categoryId: product.category!.id,
                      excludeId: product.id,
                    ),
                  _RecentlyViewed(excludeId: product.id),
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
            AppSnackbar.success(context, s.linkCopied);
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
                try {
                  final saved = await ref.read(wishlistProvider.notifier).toggle(product);
                  if (saved && context.mounted) {
                    PushService.maybeSoftAsk(context, reason: ref.s.dsWishlistPushReason);
                  }
                } catch (e) {
                  if (context.mounted) AppSnackbar.error(context, ref.friendly(e));
                }
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
                          // الأرقام تُقرأ دائماً من اليسار: 1 / 20 لا 20 / 1.
                          child: Directionality(
                            textDirection: TextDirection.ltr,
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
            // شريحة البراند — تفتح كل منتجات البراند.
            _BrandChip(product: product, name: brand),
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
          _QuickFacts(product: product, lang: lang),
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

/// حقائق سريعة من اسم المنتج: الجنس، تركيز العطر، والحجم — بدل البحث عنها داخل الاسم الطويل.
List<({IconData icon, String label})> productQuickFacts(Product p, bool ar) {
  final n = ' ${p.name} ${p.nameEn ?? ''} '.toLowerCase();
  final facts = <({IconData icon, String label})>[];
  if (RegExp(r'للجنسين|unisex').hasMatch(n)) {
    facts.add((icon: Icons.people_alt_outlined, label: ar ? 'للجنسين' : 'Unisex'));
  } else if (RegExp(r'للرجال|رجالي|pour homme|for men|\bmen\b|homme').hasMatch(n)) {
    facts.add((icon: Icons.man_rounded, label: ar ? 'رجالي' : 'For him'));
  } else if (RegExp(r'للنساء|نسائي|pour femme|for women|femme|\bwomen\b').hasMatch(n)) {
    facts.add((icon: Icons.woman_rounded, label: ar ? 'نسائي' : 'For her'));
  }
  String? conc;
  if (RegExp(r'تواليت|toilette|\bedt\b').hasMatch(n)) {
    conc = ar ? 'أو دو تواليت' : 'Eau de toilette';
  } else if (RegExp(r'إكستريه|اكستريه|extrait').hasMatch(n)) {
    conc = ar ? 'إكستريه' : 'Extrait';
  } else if (RegExp(r'(أو|او) د(و|ي) (بارفيوم|بارفان|برفيوم|برفان|بيرفيوم)|eau de parfum|\bedp\b').hasMatch(n)) {
    conc = ar ? 'أو دو بارفيوم' : 'Eau de parfum';
  } else if (RegExp(r'بارفان|بارفيوم|\bparfum\b').hasMatch(n) && (p.category?.name.contains('عطر') ?? false)) {
    conc = ar ? 'بارفان' : 'Parfum';
  } else if (RegExp(r'كولونيا|cologne').hasMatch(n)) {
    conc = ar ? 'كولونيا' : 'Cologne';
  }
  if (conc != null) facts.add((icon: Icons.water_drop_outlined, label: conc));
  final sizes = RegExp(r'(\d+(?:[.,]\d+)?)\s*(مل|ملل|ml|غم|غرام|جم|gm|g|لتر|l)(?![a-z\u0600-\u06ff])').allMatches(n).toList();
  if (sizes.isNotEmpty) {
    final m = sizes.last;
    final unit = m.group(2)!;
    final u = RegExp(r'^(مل|ملل|ml)$').hasMatch(unit)
        ? (ar ? 'مل' : 'ml')
        : RegExp(r'^(لتر|l)$').hasMatch(unit)
            ? (ar ? 'لتر' : 'L')
            : (ar ? 'غ' : 'g');
    facts.add((icon: Icons.straighten_rounded, label: '${m.group(1)} $u'));
  }
  return facts;
}

class _QuickFacts extends StatelessWidget {
  final Product product;
  final String lang;
  const _QuickFacts({required this.product, required this.lang});

  @override
  Widget build(BuildContext context) {
    final facts = productQuickFacts(product, lang == 'ar');
    if (facts.isEmpty) return const SizedBox.shrink();
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          for (final f in facts)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              decoration: BoxDecoration(
                color: t.accentLight.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(f.icon, size: 14, color: t.accentDark),
                  const SizedBox(width: 4),
                  Text(f.label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: t.accentDark)),
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
          if (ref.watch(loyaltyRulesProvider).pointsFor(price * quantity) > 0) ...[
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
                      // 1% من السعر (من إعدادات المتجر) — لا القيمة المخزنة القديمة على المنتج.
                      s.earnPoints(ref.watch(loyaltyRulesProvider).pointsFor(price * quantity)),
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11.5, color: t.inkSoft),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (stock > 0) const _DeliveryWhen(),
          if (stock > 0) _FreeDeliveryHint(productId: product.id, addition: price * quantity),
        ],
      ),
    );
  }
}

/// شريحة البراند: شعار صغير + الاسم + سهم — تفتح صفحة البراند.
class _BrandChip extends StatelessWidget {
  final Product product;
  final String name;
  const _BrandChip({required this.product, required this.name});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final b = product.brand;
    final logo = b?.logoUrl ?? '';
    final slug = b?.slug ?? '';
    final chip = Container(
      padding: EdgeInsetsDirectional.fromSTEB(logo.isNotEmpty ? 4 : 10, 4, 8, 4),
      decoration: BoxDecoration(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: t.accentSoft.withValues(alpha: 0.7)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (logo.isNotEmpty) ...[
            Container(
              width: 24,
              height: 24,
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: ClipOval(
                child: AppNetworkImage(url: logo, fit: BoxFit.contain, backgroundColor: Colors.white),
              ),
            ),
            const SizedBox(width: 7),
          ] else ...[
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(gradient: t.signatureGradient, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Text(
              name.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: t.accentDark,
                fontWeight: FontWeight.w800,
                fontSize: 11,
                letterSpacing: 0.5,
              ),
            ),
          ),
          if (slug.isNotEmpty) ...[
            const SizedBox(width: 2),
            Icon(Icons.chevron_right_rounded, size: 16, color: t.accentDark),
          ],
        ],
      ),
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: slug.isEmpty
          ? chip
          : GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                HapticFeedback.selectionClick();
                context.push('/brand/$slug');
              },
              child: chip,
            ),
    );
  }
}

/// «يصلكِ إلى بغداد بين السبت والأحد» — من مدة توصيل المحافظة في لوحة التحكم.
class _DeliveryWhen extends ConsumerWidget {
  const _DeliveryWhen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final w = ref.watch(deliveryHintProvider);
    if (w == null) return const SizedBox.shrink();
    final t = context.worldTheme;
    final s = ref.s;
    final text = w.governorate == null ? s.deliveryAllIn(w.minDays, w.maxDays) : w.labelFor(s);
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        children: [
          Icon(Icons.schedule_rounded, size: 17, color: t.accentDark),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: t.inkSoft)),
          ),
        ],
      ),
    );
  }
}

/// كم يبقى للتوصيل المجاني إن أضافت الزبونة هذا المنتج — مع شريط تقدّم.
class _FreeDeliveryHint extends ConsumerWidget {
  final String productId;
  final int addition;
  const _FreeDeliveryHint({required this.productId, required this.addition});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final threshold = ref.watch(storeSettingsProvider)?.freeShippingThreshold ?? 0;
    if (threshold <= 0) return const SizedBox.shrink();
    final cart = ref.watch(cartProvider);
    final inCart = cart.items.any((e) => e.productId == productId);
    final subtotal = cart.subtotal + (inCart ? 0 : addition);
    final remaining = threshold - subtotal;
    final done = remaining <= 0;
    final progress = (subtotal / threshold).clamp(0.0, 1.0);
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final label = done
        ? (ar ? 'طلبك يستحق توصيلاً مجانياً' : 'Your order ships free')
        : (ar
            ? 'أضيفي ${formatPrice(remaining)} للتوصيل المجاني'
            : 'Add ${formatPrice(remaining)} for free delivery');

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        children: [
          Icon(
            done ? Icons.check_circle_rounded : Icons.local_shipping_outlined,
            size: 17,
            color: done ? AppColors.success : t.accentDark,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: t.inkSoft),
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: SizedBox(
                    height: 5,
                    width: double.infinity,
                    child: Stack(
                      children: [
                        Positioned.fill(child: ColoredBox(color: t.accentLight)),
                        FractionallySizedBox(
                          widthFactor: progress,
                          alignment: AlignmentDirectional.centerStart,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: done
                                  ? const LinearGradient(colors: [AppColors.success, AppColors.success])
                                  : t.signatureGradient,
                            ),
                          ),
                        ),
                      ],
                    ),
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
      // التقييم والعدد تغيّرا على السيرفر: نسخة جديدة بدل المحفوظة قبل إعادة البناء.
      try {
        await ref.read(apiServiceProvider).getProduct(widget.idOrSlug, forceRefresh: true);
      } catch (_) {}
      ref.invalidate(productDetailProvider(widget.idOrSlug));
      if (mounted) {
        setState(() {
          _showForm = false;
          _commentCtrl.clear();
          _rating = 5;
        });
        AppSnackbar.success(context, ref.s.thanksForReview);
      }
    } catch (e) {
      if (mounted) {
        AppSnackbar.error(context, ref.friendly(e));
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
          error: (e, _) => ErrorView.from(
            e,
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

class _ReviewTile extends ConsumerWidget {
  final Review review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final name = review.userNameFor(s.lang);
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
                  name.isNotEmpty ? name.characters.first : '·',
                  style: TextStyle(color: t.accentDark, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: t.ink)),
                    const SizedBox(height: 1),
                    Wrap(
                      spacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(review.dateLabelFor(s.lang), style: TextStyle(fontSize: 10.5, color: t.inkMuted)),
                        if (review.verified)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, size: 12, color: AppColors.success),
                              const SizedBox(width: 3),
                              Text(
                                s.verifiedBuyer,
                                style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.success),
                              ),
                            ],
                          ),
                      ],
                    ),
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

/// «شاهدتِها مؤخراً» — للرجوع لمنتج سابق بلمسة (من الجهاز فقط).
class _RecentlyViewed extends ConsumerWidget {
  final String excludeId;
  const _RecentlyViewed({required this.excludeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(recentlyViewedProvider).where((p) => p.id != excludeId).take(10).toList();
    if (items.length < 2) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(ProductDetailTheme.padH, 22, ProductDetailTheme.padH, 12),
          child: Text(
            ref.s.isAr ? 'شاهدتِها مؤخراً' : 'Recently viewed',
            style: ProductDetailTheme.sectionTitleStyle(context),
          ),
        ),
        HorizontalProductList(
          products: items,
          padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
        ),
      ],
    );
  }
}

/// «يُشترى معه غالباً» — اختيارات الزبونات مع هذا المنتج.
class _BoughtTogether extends ConsumerWidget {
  final Product product;
  const _BoughtTogether({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(boughtTogetherProvider(product.id));
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final brand = product.brandNameFor(ref.watch(languageCodeProvider));
    return async.maybeWhen(
      data: (r) {
        final items = r.items.where((p) => p.id != product.id).toList();
        if (items.isEmpty) return const SizedBox.shrink();
        final subtitle = r.fromOrders
            ? (ar ? 'اختيارات زبوناتنا مع هذا المنتج' : 'What customers pair with this')
            : (ar
                ? (brand.isNotEmpty ? 'يكمّل روتينك من $brand' : 'يكمّل روتينك')
                : (brand.isNotEmpty ? 'Complete your routine with $brand' : 'Complete your routine'));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(ProductDetailTheme.padH, 22, ProductDetailTheme.padH, 12),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(gradient: t.signatureGradient, shape: BoxShape.circle),
                    child: Icon(
                      r.fromOrders ? Icons.auto_awesome_rounded : Icons.spa_rounded,
                      color: Colors.white,
                      size: 17,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          r.fromOrders
                              ? (ar ? 'يُشترى معه غالباً' : 'Frequently bought together')
                              : (ar ? 'نكمّله لكِ' : 'Pairs well with'),
                          style: ProductDetailTheme.sectionTitleStyle(context),
                        ),
                        Text(subtitle, style: AppText.caption.copyWith(color: t.inkMuted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            HorizontalProductList(
              products: items,
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

  /// null = التفاصيل لم تصل بعد (الزر ظاهر لكن معطّل).
  final VoidCallback? onAdd;

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
    final inCartQty = ref.watch(cartProvider.select(
      (c) => c.items.where((e) => e.productId == product.id).fold<int>(0, (n, e) => n + e.quantity),
    ));

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
                if (inCartQty > 0)
                  Container(
                    margin: const EdgeInsets.only(bottom: 3),
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: context.worldTheme.accentLight,
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text(
                      s.isAr ? 'في سلتك ×$inCartQty' : 'In bag ×$inCartQty',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: context.worldTheme.accentDark,
                      ),
                    ),
                  )
                else if (shade != null && product.hasMultipleDisplayableShades)
                  // الدرجة المختارة ظاهرة عند الشراء — لا تضيف درجة غير التي تريدها.
                  ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: narrow ? 110 : 140),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 11,
                          height: 11,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(colors: shadeGradientColors(shade!)),
                            border: Border.all(color: Colors.white, width: 1.2),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 2)],
                          ),
                        ),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            quantity > 1 ? '${shade!.name} ×$quantity' : shade!.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 10.5, color: context.worldTheme.inkSoft, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  )
                else
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
              child: enabled
                  ? SizedBox(
                      height: narrow ? 46 : 50,
                      child: Opacity(
                        opacity: onAdd == null ? 0.55 : 1,
                        child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: context.worldTheme.signatureGradient,
                          borderRadius: BorderRadius.circular(999),
                          boxShadow: [
                            BoxShadow(
                              color: context.worldTheme.accent.withValues(alpha: 0.28),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: onAdd,
                            borderRadius: BorderRadius.circular(999),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.shopping_bag_rounded, size: narrow ? 18 : 20, color: Colors.white),
                                SizedBox(width: narrow ? 6 : 8),
                                Flexible(
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      s.addToCartBtn,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: narrow ? 13 : 14,
                                        color: Colors.white,
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
                    )
                  : _NotifyMeButton(productId: product.id, height: narrow ? 46 : 50),
            ),
          ],
        ),
      ),
    );
  }
}

/// منتج نافد: «أعلميني عند التوفر» — تنبيه على الهاتف فور عودته.
class _NotifyMeButton extends ConsumerWidget {
  final String productId;
  final double height;
  const _NotifyMeButton({required this.productId, required this.height});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final watching = ref.watch(restockWatchProvider).contains(productId);

    Future<void> onTap() async {
      HapticFeedback.mediumImpact();
      if (!ref.read(authProvider).isAuthenticated) {
        context.push('/login');
        return;
      }
      try {
        final now = await ref.read(restockWatchProvider.notifier).toggle(productId);
        if (!context.mounted) return;
        if (now) {
          AppSnackbar.success(
            context,
            ar ? 'تم! سنرسل لك تنبيهاً فور توفره' : "Done! We'll notify you when it's back",
          );
        }
      } catch (e) {
        if (context.mounted) AppSnackbar.error(context, ref.friendly(e));
      }
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      height: height,
      decoration: BoxDecoration(
        gradient: watching ? null : t.signatureGradient,
        color: watching ? t.accentLight : null,
        borderRadius: BorderRadius.circular(999),
        border: watching ? Border.all(color: t.accent, width: 1.4) : null,
        boxShadow: watching
            ? null
            : [BoxShadow(color: t.accent.withValues(alpha: 0.28), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                child: Icon(
                  watching ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                  key: ValueKey(watching),
                  size: 19,
                  color: watching ? t.accentDark : Colors.white,
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    watching
                        ? (ar ? 'سننبهك فور توفره' : "We'll notify you")
                        : (ar ? 'أعلميني عند التوفر' : 'Notify me when back'),
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13.5,
                      color: watching ? t.accentDark : Colors.white,
                    ),
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
