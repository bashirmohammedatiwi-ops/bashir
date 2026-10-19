import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import '../checkout/delivery_estimate.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../core/cache/image_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/motion/app_motion.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/navigation/product_nav.dart';
import '../../core/push/push_service.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ds_strings.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/ui/ui.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/fullscreen_image_viewer.dart';
import '../../core/widgets/horizontal_product_list.dart';
import '../../core/widgets/quick_shade_sheet.dart';
import '../../core/widgets/product_detail_skeleton.dart';
import '../../core/widgets/states.dart';
import '../../data/models/paginated.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';
import '../advisor/widgets/advisor_ask_card.dart';
import '../alerts/restock_watch_provider.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../compare/compare_provider.dart';
import '../compare/compare_strings.dart';
import '../wishlist/wishlist_provider.dart';
import '../worlds/world_theme.dart';
import 'widgets/added_to_cart_sheet.dart';
import 'widgets/product_detail_theme.dart';
import 'widgets/product_shade_picker.dart';
import '../worlds/worlds_provider.dart';

/// نصوص صفحة المنتج التي لا تُستخدم خارجها.
extension _PdpStringsX on AppStrings {
  String get detailsRefreshFailed => isAr ? 'تعذّر تحديث التفاصيل' : "Couldn't refresh the details";
  String get productRemovedHint => isAr
      ? 'ربما توقّف بيعه أو أُزيل من المتجر — عندنا بدائل قريبة منه'
      : 'It may have been discontinued or removed — we have close alternatives';
  String get browseSimilar => isAr ? 'تصفّحي منتجات مشابهة' : 'Browse similar products';
  String seeAllReviews(int n) => isAr ? 'عرض كل التقييمات (\u2066$n\u2069)' : 'See all reviews ($n)';
  String get editYourReview => isAr ? 'عدّلي تقييمك' : 'Edit your review';
  String get updateReview => isAr ? 'حفظ التعديل' : 'Save changes';
  String get reviewsNewest => isAr ? 'الأحدث' : 'Newest';
  String get reviewsHighest => isAr ? 'الأعلى' : 'Highest';
  String get reviewsLowest => isAr ? 'الأقل' : 'Lowest';
  String get reviewsLoadFailed => isAr ? 'تعذّر تحميل التقييمات' : "Couldn't load the reviews";

  /// توزيع النجوم محسوب من آخر التقييمات المجلوبة فقط — نقولها صراحة.
  String fromLatestReviews(int n) => isAr
      ? 'من آخر ${arCount(n, one: 'تقييم', two: 'تقييمين', few: 'تقييمات', many: 'تقييماً')}'
      : 'From the latest ${enCount(n, 'review', 'reviews')}';
  String starsCount(int n) => isAr
      ? arCount(n, one: 'نجمة واحدة', two: 'نجمتان', few: 'نجوم', many: 'نجمة')
      : enCount(n, 'star', 'stars');

  String get copyLinkHint => isAr ? 'نسخ الرابط' : 'Copy link';
  String get recentlyViewedTitle => isAr ? 'شاهدتِها مؤخراً' : 'Recently viewed';

  // ─── «اشتريها معاً» ───
  String get buyTogetherTitle => isAr ? 'اشتريها معاً' : 'Buy them together';
  String get thisItem => isAr ? 'هذا المنتج' : 'This item';
  String get chooseShadeShort => isAr ? 'اختاري اللون' : 'Choose shade';
  String bundleSave(String amount) => isAr ? 'توفّرين $amount' : 'You save $amount';
  String addSelected(int n) => isAr ? 'أضيفي المحدد (\u2066$n\u2069)' : 'Add selected ($n)';
  String bundleAdded(int n) => isAr
      ? (n == 1 ? 'أُضيف منتج واحد للسلة' : n == 2 ? 'أُضيف منتجان للسلة' : 'أُضيفت ${arProducts(n)} للسلة')
      : 'Added ${enCount(n, 'item', 'items')} to your bag';
  String bundleIncluded(String name) => isAr ? '$name، مشمول' : '$name, included';
  String bundleExcluded(String name) => isAr ? '$name، غير مشمول' : '$name, not included';
}

/// أول صفحة تقييمات (الأحدث) مع تقييم الزبونة نفسها — تتجدد حين تسجّل الدخول أو تخرج.
final _reviewsPreviewProvider = FutureProvider.autoDispose
    .family<({Paginated<Review> page, Review? mine}), String>((ref, productId) {
  ref.watch(authProvider.select((a) => a.isAuthenticated ? a.user?.id : null));
  return ref.read(apiServiceProvider).getProductReviewsPage(productId, limit: _reviewsPreviewLimit);
});

/// عدد التقييمات في المعاينة — يكفي لتوزيع نجوم معقول دون صفحة ثقيلة.
const _reviewsPreviewLimit = 20;

/// عدد التقييمات الظاهرة داخل الصفحة؛ البقية في «عرض كل التقييمات».
const _reviewsInline = 5;

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String idOrSlug;

  /// درجة تُختار أولاً (من مسح باركود الدرجة أو رابط `?shade=`) إن كانت متاحة.
  final String? initialShadeId;

  const ProductDetailScreen({super.key, required this.idOrSlug, this.initialShadeId});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  /// الصورة الظاهرة في المعرض — مُبلِّغ لا setState: السحب بين الصور يعيد بناء العدّاد
  /// والمصغّرات فقط، لا الصفحة كلها.
  final _imageIndex = ValueNotifier<int>(0);
  int _quantity = 1;

  /// معرّف الدرجة المختارة فقط — الكائن نفسه يُشتق من نسخة المنتج الحالية في كل بناء،
  /// فلا تبقى صورة البطاقة المصغّرة أو مخزونها وسعرها القديمان بعد وصول التفاصيل.
  String? _shadeId;

  /// [ProductDetailScreen.initialShadeId] طُبّقت (أو تبيّن أنها غير متاحة).
  bool _initialShadeHandled = false;
  final _pageCtrl = PageController();
  String? _precachedGalleryStamp;

  /// وسم صورة البطاقة التي فُتحت منها الصفحة — الصورة الأولى في المعرض تطير منها.
  String? _heroTag;

  @override
  void initState() {
    super.initState();
    _heroTag = ProductSeeds.takeHeroTag(widget.idOrSlug);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _collapsed.dispose();
    _imageIndex.dispose();
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

  /// الدرجة المختارة من نسخة [product] الحالية — أو الوحيدة إن لم يكن للمنتج غيرها.
  ProductShade? _shadeOf(Product product) =>
      product.displayableShades.where((s) => s.id == _shadeId).firstOrNull ?? product.soleDisplayableShade;

  /// القطع الموجودة في السلة من هذا المنتج بهذه الدرجة (نفس مفتاح سطر السلة).
  int _inCartFor(Product product, ProductShade? shade) {
    final key = shade == null ? product.id : '${product.id}:${shade.id}';
    return ref.read(cartProvider).items.where((e) => e.key == key).fold<int>(0, (n, e) => n + e.quantity);
  }

  /// أقصى كمية يمكن إضافتها الآن: مخزون الدرجة ناقص ما في السلة منها (1 على الأقل للعرض).
  int _maxQtyFor(Product product, ProductShade? shade) {
    final cartShade = product.shadeForCart(selected: shade);
    final stock = cartShade?.stock ?? product.stock;
    return math.max(1, math.min(99, stock - _inCartFor(product, cartShade)));
  }

  /// الإضافة متاحة فقط لنسخة تعرف درجاتها — بذرة مختصرة أو بلا درجات (من «شاهدتِها
  /// مؤخراً» بعد إعادة التشغيل مثلاً) قد تضيف منتجاً متعدد الدرجات بلا درجة.
  bool get _seedCanAdd {
    final seed = ProductSeeds.get(widget.idOrSlug);
    return seed != null && !ProductSeeds.isLite(widget.idOrSlug) && seed.shades.isNotEmpty;
  }

  bool _isGone(Object e) => e is ApiException && (e.status == 404 || e.status == 410);

  /// آخر حدّ كمية بُنيت به الصفحة — لنعرف إن غيّرته السلة.
  int? _builtMaxQty;

  void _onCartChanged() {
    if (!mounted) return;
    final product = ref.read(productDetailProvider(widget.idOrSlug)).valueOrNull ?? ProductSeeds.get(widget.idOrSlug);
    if (product == null) return;
    if (_maxQtyFor(product, _shadeOf(product)) != _builtMaxQty) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productDetailProvider(widget.idOrSlug));
    ref.listen(productDetailProvider(widget.idOrSlug), (prev, next) {
      next.whenData((p) => ref.read(recentlyViewedProvider.notifier).add(p));
    });
    // السلة تحدد أقصى كمية للدرجة: نعيد بناء الصفحة فقط إن تغيّر هذا الحد فعلاً
    // (كان كل تغيير في السلة — من أي صفحة أو من «اشتري معه» — يعيد بناء الصفحة كلها).
    ref.listen(cartProvider.select((c) => c.count), (_, __) => _onCartChanged());
    // فُتح من بطاقة: نعرض المنتج فوراً ببياناتها، والتفاصيل تكتمل حين تصل.
    final seed = ProductSeeds.get(widget.idOrSlug);
    final failure = async.hasError && !async.isLoading ? async.error : null;
    final gone = failure != null && _isGone(failure);
    void retry() => ref.invalidate(productDetailProvider(widget.idOrSlug));

    Widget? bottomBar(Product product, {required bool canAdd}) => _BottomBar(
          product: product,
          quantity: _quantity,
          shade: _shadeOf(product),
          onAdd: canAdd ? () => _addToCart(product) : null,
        );

    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
      body: async.when(
        loading: () => seed != null ? _buildContent(seed) : const ProductDetailSkeleton(),
        error: (e, _) {
          // «إعادة المحاولة» جارية: نعرض ما يُعرض أثناء التحميل لا الخطأ السابق.
          if (async.isLoading) return seed != null ? _buildContent(seed) : const ProductDetailSkeleton();
          if (gone) return _GoneView(seed: seed);
          // بيانات البطاقة ظاهرة أصلاً: نبقيها مع تنبيه صغير بدل استبدالها بشاشة خطأ.
          if (seed != null) return _buildContent(seed, onRefreshFailed: retry);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SafeArea(
                bottom: false,
                child: Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(12, 8, 12, 0),
                  child: Align(alignment: AlignmentDirectional.centerStart, child: AppBackButton()),
                ),
              ),
              Expanded(child: ErrorView.from(e, onRetry: retry)),
            ],
          );
        },
        data: (product) => _buildContent(product, complete: true),
      ),
      bottomNavigationBar: async.when(
        data: (product) => bottomBar(product, canAdd: true),
        loading: () => seed == null ? null : bottomBar(seed, canAdd: _seedCanAdd),
        error: (_, __) => seed == null || gone ? null : bottomBar(seed, canAdd: _seedCanAdd),
      ),
    );
  }

  void _addToCart(Product product) {
    final s = ref.read(stringsProvider);
    final shade = product.shadeForCart(selected: _shadeOf(product));
    if (product.hasMultipleDisplayableShades && shade == null) {
      AppSnackbar.show(context, s.selectShadeFirst);
      return;
    }
    HapticFeedback.mediumImpact();
    final requested = _quantity;
    // ما أُضيف فعلاً — قد يكون أقل من المطلوب إن لم يكفِ المخزون.
    final added = ref.read(cartProvider.notifier).addCounted(product, quantity: requested, shade: shade);
    if (added <= 0) {
      AppSnackbar.error(context, s.maxStockReached);
      return;
    }
    if (added < requested) AppSnackbar.show(context, s.addedOnly(added));
    // تأكيد واضح + ما يكمّله + كم يبقى للتوصيل المجاني (بدل إشعار عابر).
    showAddedToCartSheet(
      context,
      product: product,
      shade: shade,
      quantity: requested,
      added: added,
      lang: ref.read(languageCodeProvider),
      onViewCart: () => openCartTab(context, ProviderScope.containerOf(context)),
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

  /// يضبط الدرجة المختارة على نسخة [product] الحالية قبل البناء (بلا إطار وسيط خاطئ):
  /// الدرجة المطلوبة أولاً، ثم أول درجة متوفرة إن لم تُختر درجة أو نفدت المختارة
  /// وغيرها متوفر.
  void _syncShadeSelection(Product product, {required bool complete}) {
    final shades = product.displayableShades;
    // بذرة بلا درجات: ننتظر التفاصيل — لا نحكم على الدرجة المطلوبة بعد.
    if (shades.isEmpty) return;
    if (!_initialShadeHandled) {
      final wanted = widget.initialShadeId;
      final match = wanted == null ? null : shades.where((x) => x.id == wanted).firstOrNull;
      // بذرة البطاقة قد لا تحمل كل الدرجات: لا نستسلم قبل وصول النسخة الكاملة.
      if (match != null || wanted == null || complete) {
        _initialShadeHandled = true;
        if (match != null) {
          _shadeId = match.id;
          if (!match.inStock && shades.any((x) => x.inStock)) {
            final name = match.name;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) AppSnackbar.show(context, ref.read(stringsProvider).shadeSoldOut(name));
            });
          }
        }
      }
    }
    if (!product.hasMultipleDisplayableShades) return;
    final current = shades.where((x) => x.id == _shadeId).firstOrNull;
    final anyInStock = shades.any((x) => x.inStock);
    if (current == null || (!current.inStock && anyInStock)) {
      _shadeId = (shades.where((x) => x.inStock).firstOrNull ?? shades.first).id;
    }
  }

  void _onShadeSelected(Product product, ProductShade shade) {
    setState(() {
      _shadeId = shade.id;
      _quantity = _quantity.clamp(1, _maxQtyFor(product, shade));
    });
    _imageIndex.value = 0;
    // صورة الدرجة أول المعرض: نعود إليها لترى اللون فوراً.
    if (_pageCtrl.hasClients) {
      if (MediaQuery.disableAnimationsOf(context)) {
        _pageCtrl.jumpToPage(0);
      } else {
        _pageCtrl.animateToPage(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOutCubic);
      }
    }
  }

  /// يظهر اسم المنتج في الشريط العلوي بعد تجاوز المعرض.
  final _collapsed = ValueNotifier<bool>(false);

  /// [onRefreshFailed]: عُرضت بيانات البطاقة لأن التفاصيل لم تصل — شريحة «إعادة المحاولة».
  /// [complete]: نسخة التفاصيل الكاملة (لا بذرة البطاقة).
  Widget _buildContent(Product product, {bool complete = false, VoidCallback? onRefreshFailed}) {
    final shades = product.displayableShades;
    _syncShadeSelection(product, complete: complete);
    final shade = _shadeOf(product);
    // الكمية لا تتجاوز ما يمكن إضافته من هذه الدرجة الآن (المخزون ناقص ما في السلة).
    final maxQty = _maxQtyFor(product, shade);
    _builtMaxQty = maxQty;
    if (_quantity > maxQty) _quantity = maxQty;
    _precacheGallery(context, product);
    final gallery = _galleryUrls(product, shade);
    // معرض قصُر (لون بصور أقل): العرض يقصّ الرقم فوراً، والمُبلِّغ يُصحَّح بعد الإطار (لا تغيير أثناء البناء).
    if (_imageIndex.value >= gallery.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _imageIndex.value >= gallery.length) _imageIndex.value = math.max(0, gallery.length - 1);
      });
    }
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
          heroTag: _heroTag,
          product: product,
          gallery: gallery,
          zoomableUrls: zoomableUrls,
          imageIndex: _imageIndex,
          pageCtrl: _pageCtrl,
          selectedShade: shade,
          onPageChanged: (i) => _imageIndex.value = i,
        ),
        // الورقة العليا (العنوان، الدرجات، الشراء، المعلومات) ترتفع فوق المعرض كما
        // كانت، في طبقة رسم مستقلة؛ والأقسام السفلى slivers كسولة منفصلة تحتها.
        SliverToBoxAdapter(
          child: ProductDetailSheetLift(
            lift: ProductDetailTheme.overlap,
            child: ClipRect(
              clipper: const ProductDetailClipBelow(),
              child: RepaintBoundary(
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
                            borderRadius: BorderRadius.circular(AppCorners.pill),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _ProductTitleBlock(product: product),
                      if (onRefreshFailed != null) _RefreshFailedPill(onRetry: onRefreshFailed),
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
                            selected: shade,
                            strings: ref.s,
                            onSelect: (s) => _onShadeSelected(product, s),
                          ),
                        ),
                      ],
                      _ProductCommerceBlock(
                        product: product,
                        shade: shade,
                        quantity: _quantity,
                        maxQuantity: maxQty,
                        onQuantityChanged: (v) {
                          HapticFeedback.selectionClick();
                          setState(() => _quantity = v.clamp(1, maxQty));
                        },
                      ),
                      const _TrustStrip(),
                      // لحظة التردد: «هل يناسبني؟ بديل أرخص؟» — «ديما» بالعربية فقط (البطاقة تخفي نفسها).
                      if (ref.watch(languageCodeProvider) == 'ar')
                        Padding(
                          padding: const EdgeInsets.fromLTRB(
                            ProductDetailTheme.padH,
                            ProductDetailTheme.sectionGap,
                            ProductDetailTheme.padH,
                            0,
                          ),
                          child: AdvisorAskCard(productId: product.id),
                        ),
                      if (product.localizedDescription(ref.watch(languageCodeProvider)).isNotEmpty ||
                          product.howToUse.isNotEmpty ||
                          product.ingredients.isNotEmpty)
                        _SectionCard(
                          padding: EdgeInsets.zero,
                          child: _InfoSections(product: product),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        // الأقسام السفلى: تُبنى حين تقترب من الشاشة لا كلها عند فتح الصفحة،
        // كلٌّ في طبقة رسم مستقلة (addRepaintBoundaries)، ثم تبقى حيّة.
        SliverList(
          delegate: SliverChildListDelegate([
            ProductDetailLazySection(
              key: const ValueKey('bought-together'),
              child: _BoughtTogether(
                product: product,
                shade: shade,
                canAddCurrent: complete || _seedCanAdd,
              ),
            ),
            ProductDetailLazySection(
              key: const ValueKey('reviews'),
              child: _SectionCard(
                child: _ReviewsSection(product: product, idOrSlug: widget.idOrSlug),
              ),
            ),
            if (product.category != null || product.subcategoryId != null || product.tertiaryCategoryId != null)
              ProductDetailLazySection(
                key: const ValueKey('similar'),
                child: _SimilarProducts(product: product),
              ),
            ProductDetailLazySection(
              key: const ValueKey('recent'),
              child: _RecentlyViewed(excludeId: product.id),
            ),
            // 24 كما كانت + مساحة الرفع (كان الإزاحة تترك هذا الفراغ أسفل الصفحة).
            const SizedBox(key: ValueKey('end'), height: 24 + ProductDetailTheme.overlap),
          ]),
        ),
      ],
      ),
    );
  }
}

/// تعذّر جلب التفاصيل وعُرضت بيانات البطاقة: تنبيه صغير تحت العنوان مع إعادة المحاولة.
class _RefreshFailedPill extends ConsumerWidget {
  final VoidCallback onRetry;
  const _RefreshFailedPill({required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(ProductDetailTheme.padH, 10, ProductDetailTheme.padH, 0),
      child: Align(
        alignment: AlignmentDirectional.centerStart,
        child: Semantics(
          button: true,
          label: '${s.detailsRefreshFailed}${s.isAr ? '، ' : ', '}${s.retryAction}',
          excludeSemantics: true,
          child: Material(
            color: AppColors.warning.withValues(alpha: 0.1),
            shape: StadiumBorder(side: BorderSide(color: AppColors.warning.withValues(alpha: 0.3))),
            child: InkWell(
              customBorder: const StadiumBorder(),
              onTap: () {
                HapticFeedback.selectionClick();
                onRetry();
              },
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: kMinTapTarget),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 14, 6),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.cloud_off_rounded, size: 16, color: AppColors.warning),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text.rich(
                          TextSpan(children: [
                            TextSpan(text: '${s.detailsRefreshFailed} · '),
                            TextSpan(
                              text: s.retryAction,
                              style: AppText.caption.copyWith(color: t.accentDark),
                            ),
                          ]),
                          style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w700),
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
    );
  }
}

/// المنتج حُذف أو أُوقف (404): رسالة واضحة وطريق لبدائل قريبة بدل نسخة قديمة.
class _GoneView extends ConsumerWidget {
  final Product? seed;
  const _GoneView({this.seed});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final category = seed?.category;
    final lang = ref.watch(languageCodeProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SafeArea(
          bottom: false,
          child: Padding(
            padding: EdgeInsetsDirectional.fromSTEB(12, 8, 12, 0),
            child: Align(alignment: AlignmentDirectional.centerStart, child: AppBackButton()),
          ),
        ),
        Expanded(
          child: EmptyState(
            icon: Icons.inventory_2_outlined,
            title: s.productNoLongerAvailable,
            subtitle: s.productRemovedHint,
            action: FilledButton.icon(
              onPressed: () {
                if (category != null && category.id.isNotEmpty) {
                  context.pushReplacement(Uri(path: '/products', queryParameters: {
                    'categoryId': category.id,
                    'title': category.localizedName(lang),
                  }).toString());
                } else {
                  openCategoriesTab(context, ProviderScope.containerOf(context));
                }
              },
              style: FilledButton.styleFrom(minimumSize: const Size(0, kMinTapTarget)),
              icon: const Icon(Icons.auto_awesome_rounded, size: 18),
              label: Text(category != null ? s.browseSimilar : s.browseCategories),
            ),
          ),
        ),
      ],
    );
  }
}

/// معرض الصور — خلفية بيضاء، أزرار عائمة، مصغّرات أسفل الصورة.
class _GalleryAppBar extends ConsumerWidget {
  final ValueListenable<bool> collapsed;

  /// وسم صورة البطاقة التي فُتحت منها الصفحة (null = بلا انتقال مشترك).
  final String? heroTag;
  final Product product;
  final List<String> gallery;
  final List<String> zoomableUrls;
  final ValueListenable<int> imageIndex;
  final PageController pageCtrl;
  final ProductShade? selectedShade;
  final ValueChanged<int> onPageChanged;

  const _GalleryAppBar({
    required this.collapsed,
    this.heroTag,
    required this.product,
    required this.gallery,
    required this.zoomableUrls,
    required this.imageIndex,
    required this.pageCtrl,
    this.selectedShade,
    required this.onPageChanged,
  });

  /// القلب: يتغيّر فوراً (المزوّد متفائل)، والخطأ يُعرض بدل أن يضيع. الزائرة تسجّل
  /// الدخول ثم يُحفظ المنتج تلقائياً — لا تعود لتضغط مرة ثانية.
  Future<void> _toggleWishlist(BuildContext context, WidgetRef ref) async {
    HapticFeedback.selectionClick();
    if (!ref.read(authProvider).isAuthenticated) {
      await context.push<bool>('/login');
      if (!context.mounted || !ref.read(authProvider).isAuthenticated) return;
    }
    try {
      final saved = await ref.read(wishlistProvider.notifier).toggle(product);
      if (!saved || !context.mounted) return;
      final s = ref.read(stringsProvider);
      AppSnackbar.action(
        context,
        message: s.savedToWishlist,
        actionLabel: s.viewWishlist,
        onAction: () => context.push('/wishlist'),
      );
      PushService.maybeSoftAsk(context, reason: s.dsWishlistPushReason);
    } catch (e) {
      if (context.mounted) AppSnackbar.error(context, ref.friendly(e));
    }
  }

  String get _shareUrl => AppConfig.productShareUrl(product.slug.isNotEmpty ? product.slug : product.id);

  /// ورقة المشاركة في النظام (واتساب، إنستغرام، تيليغرام…) — وإن تعذّرت نُسخ الرابط.
  Future<void> _share(BuildContext buttonContext, AppStrings s) async {
    HapticFeedback.selectionClick();
    final name = product.localizedName(s.lang);
    // آيباد يحتاج مكان الزر ليفتح ورقة المشاركة بجانبه.
    final box = buttonContext.findRenderObject() as RenderBox?;
    final origin = box != null && box.hasSize ? box.localToGlobal(Offset.zero) & box.size : null;
    try {
      await SharePlus.instance.share(
        ShareParams(text: '$name\n$_shareUrl', subject: name, sharePositionOrigin: origin),
      );
    } catch (_) {
      if (buttonContext.mounted) await _copyLink(buttonContext, s);
    }
  }

  /// ضغطة مطوّلة على زر المشاركة: نسخ الرابط مباشرة.
  Future<void> _copyLink(BuildContext context, AppStrings s) async {
    HapticFeedback.selectionClick();
    await Clipboard.setData(ClipboardData(text: _shareUrl));
    if (context.mounted) AppSnackbar.success(context, s.linkCopied);
  }

  /// أثناء طيران الصورة: صورة الغلاف كاملة (لا مقصوصة) على الأبيض — مثل البطاقة والمعرض.
  Widget _heroShuttle(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection direction,
    BuildContext fromContext,
    BuildContext toContext,
  ) {
    // الطائرة = صورة البطاقة نفسها (الرابط وعرض الفكّ ذاتهما): النسخة المفكوكة في الذاكرة
    // تظهر فوراً — عرض فكّ مختلف كان يعني فكّاً جديداً (وبياضاً) وسط الطيران.
    final cardContext = direction == HeroFlightDirection.push ? fromContext : toContext;
    final cardHero = cardContext.widget;
    final cardImage = cardHero is Hero && cardHero.child is ProductCoverImage ? cardHero.child as ProductCoverImage : null;
    final url = cardImage?.url ?? (product.coverUrl.isNotEmpty ? product.coverUrl : gallery.first);
    final box = cardContext.findRenderObject();
    final cardWidth = box is RenderBox && box.hasSize ? box.size.width : null;
    return ColoredBox(
      color: Colors.white,
      child: ProductCoverImage(
        url: url,
        fit: BoxFit.contain,
        decodeWidth: cardImage?.decodeWidth ??
            (cardWidth != null && cardWidth > 0
                ? cachePixelWidth(cardContext, cardWidth)
                : lastImageDecodeWidth(url) ??
                    cachePixelWidth(flightContext, MediaQuery.sizeOf(flightContext).width)),
      ),
    );
  }

  /// الصورة الأولى داخل `Hero` بوسم البطاقة — يُعطَّل حين ينطوي المعرض (لا تطير الصورة
  /// من خارج الشاشة عند الرجوع) ومع «تقليل الحركة».
  Widget _withHero(BuildContext context, Widget image) {
    final tag = heroTag;
    if (tag == null || MediaQuery.disableAnimationsOf(context)) return image;
    return ValueListenableBuilder<bool>(
      valueListenable: collapsed,
      builder: (_, isCollapsed, child) => HeroMode(enabled: !isCollapsed, child: child!),
      child: Hero(tag: tag, flightShuttleBuilder: _heroShuttle, child: image),
    );
  }

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
        _CompareChip(product: product),
        Builder(
          builder: (buttonContext) => _CircleAction(
            icon: Icons.ios_share_rounded,
            tooltip: s.shareProduct,
            onTap: () => _share(buttonContext, s),
            onLongPress: () => _copyLink(buttonContext, s),
            longPressHint: s.copyLinkHint,
          ),
        ),
        _CircleAction(
          icon: wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          color: wished ? AppColors.sale : context.worldTheme.ink,
          tooltip: wished ? s.removeFromWishlist : s.addToWishlist,
          toggled: wished,
          onTap: () => _toggleWishlist(context, ref),
        ),
        const SizedBox(width: 6),
      ],
          flexibleSpace: ProductDetailTheme.flexibleSpace(
        context,
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
                          child: i == 0
                              ? _withHero(
                                  context,
                                  // غلاف البطاقة (مفكوك في الذاكرة) يملأ المكان حتى تصل الصورة الكبيرة.
                                  ProductCoverImage(
                                    url: gallery[i],
                                    width: galleryWidth,
                                    fit: BoxFit.contain,
                                    placeholderUrl: product.coverUrl,
                                  ),
                                )
                              : ProductCoverImage(url: gallery[i], width: galleryWidth, fit: BoxFit.contain),
                        ),
                      ),
                    ),
                    // شارات
                    PositionedDirectional(
                      start: 14,
                      bottom: 12,
                      child: Row(
                        children: [
                          // خصم الدرجة المختارة نفسها — لا أعلى خصم بين الدرجات.
                          if (product.pctFor(selectedShade) > 0)
                            _GalleryBadge(
                              label: formatDiscount(product.pctFor(selectedShade)),
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
                            borderRadius: BorderRadius.circular(AppCorners.pill),
                          ),
                          // الأرقام تُقرأ دائماً من اليسار: 1 / 20 لا 20 / 1.
                          child: Directionality(
                            textDirection: TextDirection.ltr,
                            child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ValueListenableBuilder<int>(
                                valueListenable: imageIndex,
                                builder: (context, index, _) => Text(
                                  '${math.min(index, gallery.length - 1) + 1}',
                                  style: AppText.micro.copyWith(color: Colors.white, height: 1),
                                ),
                              ),
                              Text(
                                ' / ${gallery.length}',
                                style: AppText.micro.copyWith(
                                  color: Colors.white.withValues(alpha: 0.65),
                                  fontWeight: FontWeight.w500,
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
                    itemBuilder: (_, i) => ValueListenableBuilder<int>(
                      valueListenable: imageIndex,
                      builder: (context, index, _) {
                      final active = i == math.min(index, gallery.length - 1);
                      return Semantics(
                        button: true,
                        selected: active,
                        label: s.imageOf(i + 1, gallery.length),
                        excludeSemantics: true,
                        child: GestureDetector(
                        onTap: () => MediaQuery.disableAnimationsOf(context)
                            ? pageCtrl.jumpToPage(i)
                            : pageCtrl.animateToPage(
                                i,
                                duration: const Duration(milliseconds: 260),
                                curve: Curves.easeOutCubic,
                              ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 54,
                          decoration: BoxDecoration(
                            color: context.worldTheme.blush,
                            borderRadius: BorderRadius.circular(AppCorners.sm),
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
                        ),
                      );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ] else if (gallery.length > 1) ...[
                  if (selectedShade != null) _GalleryShadeAccent(shade: selectedShade!),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, top: 4),
                    child: ValueListenableBuilder<int>(
                      valueListenable: imageIndex,
                      builder: (context, index, _) => AnimatedSmoothIndicator(
                        activeIndex: math.min(index, gallery.length - 1),
                        count: gallery.length,
                        effect: WormEffect(
                          dotHeight: 7,
                          dotWidth: 7,
                          activeDotColor: context.worldTheme.accent,
                          dotColor: context.worldTheme.hairline,
                        ),
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

/// «قارني» بجانب المشاركة: شريحة محدّدة تضيف المنتج للمقارنة أو تزيله، وعلامة
/// صح تنبثق لحظة الإضافة (فورية مع «تقليل الحركة»).
class _CompareChip extends ConsumerWidget {
  final Product product;
  const _CompareChip({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final selected = ref.watch(compareProvider.select((c) => c.contains(product.id)));
    final still = MediaQuery.disableAnimationsOf(context);
    final color = selected ? t.accentDark : t.ink;
    return Center(
      child: Semantics(
        button: true,
        toggled: selected,
        label: selected ? s.compareRemove : s.compareAdd,
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTap: () => toggleCompare(context, ref, product),
          // الشريحة 34 والمساحة القابلة للمس 44.
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: kMinTapTarget, minWidth: kMinTapTarget),
            child: Center(
              child: AnimatedContainer(
                duration: still ? Duration.zero : MotionDurations.fast,
                curve: MotionCurves.standard,
                height: 34,
                padding: const EdgeInsetsDirectional.fromSTEB(10, 0, 12, 0),
                decoration: BoxDecoration(
                  color: selected ? t.accentLight : t.surface,
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                  border: Border.all(
                    color: selected ? t.accentSoft : t.hairline.withValues(alpha: 0.9),
                    width: selected ? 1.2 : 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedSwitcher(
                      duration: still ? Duration.zero : MotionDurations.bump,
                      transitionBuilder: (child, a) => ScaleTransition(
                        scale: Tween(begin: 0.4, end: 1.0).animate(CurvedAnimation(parent: a, curve: MotionCurves.pop)),
                        child: FadeTransition(opacity: a, child: child),
                      ),
                      child: Icon(
                        selected ? Icons.check_rounded : Icons.compare_arrows_rounded,
                        key: ValueKey(selected),
                        size: 17,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(s.compareAction, style: AppText.label.copyWith(color: color, height: 1)),
                  ],
                ),
              ),
            ),
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
        borderRadius: BorderRadius.circular(AppCorners.pill),
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

  /// وصف الزر لقارئ الشاشة وتلميح الضغط المطوّل.
  final String tooltip;

  /// زر بحالتين (المفضلة): يُعلن «مفعّل/غير مفعّل».
  final bool? toggled;

  /// ضغطة مطوّلة (نسخ رابط المشاركة) — مع وصفها لقارئ الشاشة [longPressHint].
  final VoidCallback? onLongPress;
  final String? longPressHint;

  const _CircleAction({
    required this.icon,
    required this.onTap,
    required this.tooltip,
    this.color = AppColors.ink,
    this.toggled,
    this.onLongPress,
    this.longPressHint,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Tooltip(
        message: tooltip,
        excludeFromSemantics: true,
        // الضغطة المطوّلة لها عمل خاص — لا تلميح يسرقها.
        triggerMode: onLongPress != null ? TooltipTriggerMode.manual : null,
        child: Semantics(
          button: true,
          label: tooltip,
          toggled: toggled,
          onTap: onTap,
          onLongPress: onLongPress,
          onLongPressHint: longPressHint,
          excludeSemantics: true,
          // الدائرة 40 والمساحة القابلة للمس 44 — الهامش يلتقط الضغطة دون تكبير الشكل.
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            excludeFromSemantics: true,
            onTap: onTap,
            onLongPress: onLongPress,
            child: SizedBox(
            width: kMinTapTarget,
            height: kMinTapTarget,
            child: Center(
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
                  onLongPress: onLongPress,
                  child: SizedBox(
                    width: 40,
                    height: 40,
                    child: Icon(icon, size: 20, color: color),
                  ),
                ),
              ),
            ),
          ),
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
        borderRadius: BorderRadius.circular(AppCorners.pill),
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
        style: AppText.micro.copyWith(color: Colors.white, height: 1),
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
            style: AppText.title1.copyWith(color: t.ink),
          ),
          _QuickFacts(product: product, lang: lang),
          const SizedBox(height: 10),
          // سطر الأدلة: تقييم + مبيعات داخل pill ناعم موحّد.
          if (product.rating > 0 || product.soldCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
              decoration: BoxDecoration(
                color: t.canvasWarm,
                borderRadius: BorderRadius.circular(AppCorners.pill),
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
                      style: AppText.label.copyWith(color: t.ink),
                    ),
                    if (product.reviewCount > 0) ...[
                      const SizedBox(width: 5),
                      Text(
                        '(${product.reviewCount})',
                        style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
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
                        style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
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

// تعابير «الحقائق السريعة» وعلامة البراند — تُبنى مرة واحدة لا مع كل إعادة بناء للصفحة.
final _reUnisex = RegExp(r'للجنسين|unisex');
final _reMen = RegExp(r'للرجال|رجالي|pour homme|for men|\bmen\b|homme');
final _reWomen = RegExp(r'للنساء|نسائي|pour femme|for women|femme|\bwomen\b');
final _reEdt = RegExp(r'تواليت|toilette|\bedt\b');
final _reExtrait = RegExp(r'إكستريه|اكستريه|extrait');
final _reEdp = RegExp(r'(أو|او) د(و|ي) (بارفيوم|بارفان|برفيوم|برفان|بيرفيوم)|eau de parfum|\bedp\b');
final _reParfum = RegExp(r'بارفان|بارفيوم|\bparfum\b');
final _reCologne = RegExp(r'كولونيا|cologne');
final _reSize = RegExp(r'(\d+(?:[.,]\d+)?)\s*(مل|ملل|ml|غم|غرام|جم|gm|g|لتر|l)(?![a-z\u0600-\u06ff])');
final _reMlUnit = RegExp(r'^(مل|ملل|ml)$');
final _reLitreUnit = RegExp(r'^(لتر|l)$');
final _reArabicChar = RegExp('[\u0600-\u06FF]');

/// حقائق سريعة من اسم المنتج: الجنس، تركيز العطر، والحجم — بدل البحث عنها داخل الاسم الطويل.
List<({IconData icon, String label})> productQuickFacts(Product p, bool ar) {
  final n = ' ${p.name} ${p.nameEn ?? ''} '.toLowerCase();
  final facts = <({IconData icon, String label})>[];
  if (_reUnisex.hasMatch(n)) {
    facts.add((icon: Icons.people_alt_outlined, label: ar ? 'للجنسين' : 'Unisex'));
  } else if (_reMen.hasMatch(n)) {
    facts.add((icon: Icons.man_rounded, label: ar ? 'رجالي' : 'For him'));
  } else if (_reWomen.hasMatch(n)) {
    facts.add((icon: Icons.woman_rounded, label: ar ? 'نسائي' : 'For her'));
  }
  String? conc;
  if (_reEdt.hasMatch(n)) {
    conc = ar ? 'أو دو تواليت' : 'Eau de toilette';
  } else if (_reExtrait.hasMatch(n)) {
    conc = ar ? 'إكستريه' : 'Extrait';
  } else if (_reEdp.hasMatch(n)) {
    conc = ar ? 'أو دو بارفيوم' : 'Eau de parfum';
  } else if (_reParfum.hasMatch(n) && (p.category?.name.contains('عطر') ?? false)) {
    conc = ar ? 'بارفان' : 'Parfum';
  } else if (_reCologne.hasMatch(n)) {
    conc = ar ? 'كولونيا' : 'Cologne';
  }
  if (conc != null) facts.add((icon: Icons.water_drop_outlined, label: conc));
  final sizes = _reSize.allMatches(n).toList();
  if (sizes.isNotEmpty) {
    final m = sizes.last;
    final unit = m.group(2)!;
    final u = _reMlUnit.hasMatch(unit)
        ? (ar ? 'مل' : 'ml')
        : _reLitreUnit.hasMatch(unit)
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
                borderRadius: BorderRadius.circular(AppCorners.pill),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(f.icon, size: 14, color: t.accentDark),
                  const SizedBox(width: 4),
                  Text(f.label, style: AppText.micro.copyWith(color: t.accentDark)),
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

  /// أقصى ما يمكن إضافته الآن من هذه الدرجة (المخزون ناقص ما في السلة).
  final int maxQuantity;
  final ValueChanged<int> onQuantityChanged;

  const _ProductCommerceBlock({
    required this.product,
    required this.shade,
    required this.quantity,
    required this.maxQuantity,
    required this.onQuantityChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    // سعر الدرجة المختارة وخصمها — نفس ما يُحاسب عليه السيرفر.
    final price = product.unitFor(shade);
    final discounted = product.hasDiscountFor(shade);
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
                    colors: discounted
                        ? [AppColors.sale, AppColors.sale.withValues(alpha: 0.35)]
                        : [t.accent, t.accent.withValues(alpha: 0.35)],
                  ),
                  borderRadius: BorderRadius.circular(AppCorners.pill),
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
                      style: AppText.priceLarge.copyWith(
                        fontSize: Responsive.priceDisplaySize(context),
                        color: discounted ? AppColors.sale : t.ink,
                      ),
                    ),
                    if (discounted) ...[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          formatPrice(product.origFor(shade)),
                          style: AppText.caption.copyWith(
                            color: t.inkMuted,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                      if (product.pctFor(shade) > 0)
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
                            borderRadius: BorderRadius.circular(AppCorners.pill),
                            border: Border.all(color: AppColors.sale.withValues(alpha: 0.35)),
                          ),
                          child: Text(
                            s.savePercent(product.pctFor(shade)),
                            style: AppText.micro.copyWith(color: AppColors.sale),
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
                  style: AppText.caption.copyWith(fontWeight: FontWeight.w700, color: t.inkMuted),
                ),
              if (stock > 0) const SizedBox(width: 10),
              if (stock > 0)
                QuantityStepper(
                  quantity: quantity,
                  onChanged: onQuantityChanged,
                  max: maxQuantity,
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
                borderRadius: BorderRadius.circular(AppCorners.sm),
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
                      style: AppText.caption.copyWith(fontWeight: FontWeight.w700, color: t.inkSoft),
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
        borderRadius: BorderRadius.circular(AppCorners.pill),
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
              style: AppText.micro.copyWith(
                color: t.accentDark,
                // تباعد للاسم اللاتيني فقط — أي تباعد يقطع وصل الحروف العربية.
                letterSpacing: _reArabicChar.hasMatch(name) ? 0 : 0.5,
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
            child: Text(text, style: AppText.caption.copyWith(fontWeight: FontWeight.w700, color: t.inkSoft)),
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
                  style: AppText.caption.copyWith(fontWeight: FontWeight.w700, color: t.inkSoft),
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppCorners.pill),
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
            style: AppText.micro.copyWith(color: color),
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
            style: AppText.micro.copyWith(color: t.inkSoft, height: 1.25),
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
                    borderRadius: BorderRadius.circular(AppCorners.sm),
                  ),
                  child: Icon(widget.icon, size: 17, color: context.worldTheme.accent),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    widget.title,
                    style: AppText.title3.copyWith(fontSize: 14, color: context.worldTheme.ink),
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
              child: _ReadableTextScale(
                child: Text(
                  widget.body,
                  style: AppText.bodySmall.copyWith(height: 1.7, color: context.worldTheme.inkSoft),
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

/// نص طويل يُقرأ (الوصف، طريقة الاستخدام، المكوّنات): يتبع تكبير خط النظام حتى 1.6×
/// بدل سقف التطبيق العام 1.25× (المفروض لحماية البطاقات ذات الارتفاع الثابت).
class _ReadableTextScale extends StatelessWidget {
  final Widget child;
  const _ReadableTextScale({required this.child});

  @override
  Widget build(BuildContext context) {
    // سقف التطبيق مطبّق على MediaQuery فوقنا — نعود لتكبير النظام الأصلي ثم نحدّه بـ 1.6.
    final system = MediaQueryData.fromView(View.of(context)).textScaler;
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: system),
      child: MediaQuery.withClampedTextScaling(
        minScaleFactor: 0.85,
        maxScaleFactor: 1.6,
        child: child,
      ),
    );
  }
}

/// التقييمات — ملخّص واضح + توزيع النجوم + نموذج + أحدث التقييمات و«عرض الكل».
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

  /// يفتح النموذج (أو يغلقه). تقييم سابق للزبونة يُعبّأ ليُعدَّل بدل تقييم مكرر.
  void _toggleForm(Review? mine) {
    if (!ref.read(authProvider).isAuthenticated) {
      context.push('/login');
      return;
    }
    setState(() {
      _showForm = !_showForm;
      if (_showForm && mine != null) {
        _rating = mine.rating.clamp(1, 5).toDouble();
        _commentCtrl.text = mine.comment;
      }
    });
  }

  Future<void> _submit() async {
    if (!ref.read(authProvider).isAuthenticated) {
      context.push('/login');
      return;
    }
    setState(() => _submitting = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.addReview(widget.product.id, _rating, _commentCtrl.text.trim());
      // التقييم والعدد تغيّرا على السيرفر: نسخة جديدة بدل المحفوظة قبل إعادة البناء.
      try {
        await api.getProduct(widget.idOrSlug, forceRefresh: true);
      } catch (_) {}
      ref.invalidate(_reviewsPreviewProvider(widget.product.id));
      ref.invalidate(productReviewsProvider(widget.product.id));
      ref.invalidate(productDetailProvider(widget.idOrSlug));
      if (mounted) {
        setState(() {
          _showForm = false;
          _commentCtrl.clear();
          _rating = 5;
        });
        AppSnackbar.success(context, ref.read(stringsProvider).thanksForReview);
      }
    } catch (e) {
      if (mounted) {
        AppSnackbar.error(context, ref.friendly(e));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _openAll(int total) {
    final s = ref.read(stringsProvider);
    showAppSheet<void>(
      context: context,
      title: s.ratingsTitle,
      expand: true,
      builder: (_) => _AllReviewsSheet(productId: widget.product.id, total: total),
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_reviewsPreviewProvider(widget.product.id));
    final authed = ref.watch(authProvider).isAuthenticated;
    final product = widget.product;
    final s = ref.s;
    final t = context.worldTheme;
    final mine = authed ? async.valueOrNull?.mine : null;

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
              onPressed: () => _toggleForm(mine),
              style: TextButton.styleFrom(
                foregroundColor: context.worldTheme.accent,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: const Size(0, kMinTapTarget),
              ),
              icon: Icon(
                _showForm
                    ? Icons.close_rounded
                    : (mine != null ? Icons.edit_rounded : Icons.rate_review_outlined),
                size: 17,
              ),
              label: Text(
                _showForm ? s.cancel : (mine != null ? s.editYourReview : s.addReview),
                style: AppText.label,
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
              borderRadius: BorderRadius.circular(AppCorners.md),
              border: Border.all(color: t.accentSoft.withValues(alpha: 0.6)),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      product.rating.toStringAsFixed(1),
                      style: AppText.display.copyWith(height: 1, color: t.ink),
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
                        style: AppText.caption.copyWith(fontWeight: FontWeight.w700, color: t.inkSoft),
                      ),
                      if (product.soldCount > 0) ...[
                        const SizedBox(height: 3),
                        Text(
                          '${formatNumber(product.soldCount)}+ ${s.sales}',
                          style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
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
            maxLength: 1000,
            decoration: InputDecoration(hintText: s.reviewHint, counterText: ''),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: context.worldTheme.signatureGradient,
                borderRadius: BorderRadius.circular(AppCorners.md),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(AppCorners.md),
                  onTap: _submitting ? null : _submit,
                  child: Center(
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(
                            mine != null ? s.updateReview : s.submitReview,
                            style: AppText.label.copyWith(color: Colors.white, fontSize: 14),
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
          // سطر صغير بدل شاشة خطأ كاملة داخل البطاقة.
          error: (e, _) => _InlineRetryRow(
            message: s.reviewsLoadFailed,
            onRetry: () => ref.invalidate(_reviewsPreviewProvider(widget.product.id)),
          ),
          data: (r) {
            final reviews = r.page.items;
            if (reviews.isEmpty && !_showForm) {
              return Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  authed ? s.beFirstToReview : s.loginToReview,
                  style: AppText.bodySmall.copyWith(color: context.worldTheme.inkMuted),
                ),
              );
            }
            final total = math.max(r.page.total, reviews.length);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (reviews.length >= 3) ...[
                  const SizedBox(height: 8),
                  _RatingBars(reviews: reviews),
                  const SizedBox(height: 6),
                ],
                const SizedBox(height: 4),
                for (final Review x in reviews.take(_reviewsInline)) _ReviewTile(review: x),
                if (total > _reviewsInline)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: OutlinedButton(
                      onPressed: () => _openAll(total),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(kMinTapTarget),
                        side: BorderSide(color: t.accentSoft),
                        shape: const StadiumBorder(),
                        foregroundColor: t.accentDark,
                      ),
                      child: Text(
                        s.seeAllReviews(total),
                        style: AppText.label,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

/// توزيع 5→1 نجوم من التقييمات المجلوبة (لا من كل التقييمات — والعنوان يقول ذلك).
class _RatingBars extends ConsumerWidget {
  final List<Review> reviews;
  const _RatingBars({required this.reviews});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final counts = List<int>.filled(6, 0);
    for (final r in reviews) {
      counts[r.rating.round().clamp(1, 5)]++;
    }
    final n = reviews.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var star = 5; star >= 1; star--)
          Semantics(
            label: '${s.starsCount(star)}: ${counts[star]}',
            excludeSemantics: true,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2.5),
              child: Row(
                children: [
                  SizedBox(
                    width: 14,
                    child: Text('$star', textAlign: TextAlign.center, style: AppText.micro.copyWith(color: t.inkSoft)),
                  ),
                  const Icon(Icons.star_rounded, color: AppColors.star, size: 13),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppCorners.pill),
                      child: LinearProgressIndicator(
                        value: n == 0 ? 0 : counts[star] / n,
                        minHeight: 6,
                        backgroundColor: t.accentLight,
                        color: AppColors.star,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 24,
                    child: Text(
                      '${counts[star]}',
                      textAlign: TextAlign.end,
                      style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 4),
        Text(s.fromLatestReviews(n), style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

/// خطأ صغير داخل بطاقة: نص + «إعادة المحاولة».
class _InlineRetryRow extends ConsumerWidget {
  final String message;
  final VoidCallback onRetry;
  const _InlineRetryRow({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    return Row(
      children: [
        Icon(Icons.cloud_off_rounded, size: 17, color: t.inkMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Text(message, style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w600)),
        ),
        TextButton(
          onPressed: onRetry,
          style: TextButton.styleFrom(
            foregroundColor: t.accentDark,
            minimumSize: const Size(kMinTapTarget, kMinTapTarget),
          ),
          child: Text(ref.s.retryAction, style: AppText.label),
        ),
      ],
    );
  }
}

/// كل التقييمات: صفحات متتالية مع ترتيب (الأحدث / الأعلى / الأقل).
class _AllReviewsSheet extends ConsumerStatefulWidget {
  final String productId;
  final int total;
  const _AllReviewsSheet({required this.productId, required this.total});

  @override
  ConsumerState<_AllReviewsSheet> createState() => _AllReviewsSheetState();
}

class _AllReviewsSheetState extends ConsumerState<_AllReviewsSheet> {
  static const _pageSize = 20;

  final _scroll = ScrollController();
  String _sort = 'newest';
  final _items = <Review>[];
  int _page = 0;
  bool _hasNext = true;
  bool _loading = false;
  Object? _error;

  /// يُهمل ردّ طلب قديم إن تغيّر الترتيب أثناءه.
  int _request = 0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_maybeLoadMore);
    _load();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _maybeLoadMore() {
    if (!_scroll.hasClients || _loading || !_hasNext || _error != null) return;
    if (_scroll.position.extentAfter < 400) _load();
  }

  Future<void> _load({bool reset = false}) async {
    final id = ++_request;
    setState(() {
      if (reset) {
        _items.clear();
        _page = 0;
        _hasNext = true;
      }
      _loading = true;
      _error = null;
    });
    try {
      final r = await ref
          .read(apiServiceProvider)
          .getProductReviewsPage(widget.productId, page: _page + 1, limit: _pageSize, sort: _sort);
      if (!mounted || id != _request) return;
      setState(() {
        final seen = {for (final x in _items) x.id};
        _items.addAll(r.page.items.where((x) => x.id.isEmpty || !seen.contains(x.id)));
        _page = r.page.page;
        _hasNext = r.page.hasNext && r.page.items.isNotEmpty;
        _loading = false;
      });
    } catch (e) {
      if (!mounted || id != _request) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  void _setSort(String sort) {
    if (sort == _sort) return;
    _sort = sort;
    if (_scroll.hasClients) _scroll.jumpTo(0);
    _load(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final sorts = [
      ('newest', s.reviewsNewest),
      ('highest', s.reviewsHighest),
      ('lowest', s.reviewsLowest),
    ];

    Widget body;
    if (_items.isEmpty && _loading) {
      body = Center(child: CircularProgressIndicator(color: t.accent, strokeWidth: 2));
    } else if (_items.isEmpty && _error != null) {
      body = ErrorView.from(_error, onRetry: () => _load(reset: true));
    } else if (_items.isEmpty) {
      body = EmptyState(icon: Icons.rate_review_outlined, title: s.beFirstToReview);
    } else {
      body = ListView.builder(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
        itemCount: _items.length + 1,
        itemBuilder: (_, i) {
          if (i < _items.length) return _ReviewTile(review: _items[i]);
          if (_error != null) {
            return _InlineRetryRow(message: s.loadMoreFailed, onRetry: _load);
          }
          if (_hasNext) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(color: t.accent, strokeWidth: 2),
                ),
              ),
            );
          }
          return const SizedBox(height: 8);
        },
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 2),
          child: Text(s.fromReviews(widget.total), style: AppText.caption.copyWith(color: t.inkMuted)),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            children: [
              for (final (key, label) in sorts) ...[
                AppChoiceChip(label: label, selected: _sort == key, onTap: () => _setSort(key)),
                const SizedBox(width: 8),
              ],
            ],
          ),
        ),
        Expanded(child: body),
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
        borderRadius: BorderRadius.circular(AppCorners.md),
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
                  style: AppText.label.copyWith(color: t.accentDark),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: AppText.label.copyWith(color: t.ink)),
                    const SizedBox(height: 1),
                    Wrap(
                      spacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(review.dateLabelFor(s.lang), style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w500)),
                        if (review.verified)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, size: 12, color: AppColors.success),
                              const SizedBox(width: 3),
                              Text(
                                s.verifiedBuyer,
                                style: AppText.micro.copyWith(color: AppColors.success),
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
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                  border: Border.all(color: t.hairline, width: 0.7),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                children: [
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 13),
                    const SizedBox(width: 2),
                    Text(
                      review.rating.toStringAsFixed(1),
                      style: AppText.micro.copyWith(color: t.ink),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 9),
            Text(review.comment,
                style: AppText.bodySmall.copyWith(height: 1.6, color: t.inkSoft)),
          ],
        ],
      ),
    );
  }
}

/// «قد يعجبكِ أيضاً»: الأكثر مبيعاً المتوفر من أعمق قسم للمنتج (يُكمَل من القسم الأب)،
/// بلا ما يظهر أصلاً في «يُشترى معه غالباً».
class _SimilarProducts extends ConsumerWidget {
  final Product product;

  const _SimilarProducts({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(
      similarProductsProvider((
        categoryId: product.category?.id,
        subcategoryId: product.subcategoryId,
        tertiaryCategoryId: product.tertiaryCategoryId,
        excludeId: product.id,
      )),
    );
    final paired = {
      for (final p in ref.watch(boughtTogetherProvider(product.id)).valueOrNull?.items ?? const <Product>[]) p.id,
    };

    final s = ref.s;
    return async.maybeWhen(
      data: (all) {
        final products = all.where((p) => !paired.contains(p.id)).take(10).toList();
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
              heroScope: 'pdp-${product.id}-similar',
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
            ref.s.recentlyViewedTitle,
            style: ProductDetailTheme.sectionTitleStyle(context),
          ),
        ),
        HorizontalProductList(
          products: items,
          heroScope: 'pdp-$excludeId-recent',
          padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
        ),
      ],
    );
  }
}

/// «يُشترى معه غالباً» — اختيارات الزبونات مع هذا المنتج: صندوق «اشتريها معاً» لإضافة
/// المنتج وأول قطعتين متوفرتين بلمسة، ثم بقية الاقتراحات في شريط.
class _BoughtTogether extends ConsumerWidget {
  final Product product;

  /// الدرجة المختارة في الصفحة — تُضاف بها القطعة الحالية ويُحسب سعرها.
  final ProductShade? shade;

  /// التفاصيل الكاملة وصلت (أو بذرة تعرف درجاتها) — وإلا لا تُضاف القطعة الحالية بعد.
  final bool canAddCurrent;

  const _BoughtTogether({required this.product, required this.shade, required this.canAddCurrent});

  /// أقصى عدد قطع مع المنتج في الصندوق (مثل الموقع).
  static const _bundlePairs = 2;

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
        final pairs = items.where((p) => p.inStock).take(_bundlePairs).toList();
        final paired = {for (final p in pairs) p.id};
        // ما في الصندوق لا يتكرر في الشريط تحته.
        final rest = items.where((p) => !paired.contains(p.id)).toList();
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
            if (pairs.isNotEmpty)
              _BuyTogetherBox(
                product: product,
                shade: shade,
                pairs: pairs,
                canAddCurrent: canAddCurrent,
              ),
            if (rest.isNotEmpty) ...[
              if (pairs.isNotEmpty) const SizedBox(height: 14),
              HorizontalProductList(
                products: rest,
                heroScope: 'pdp-${product.id}-pairs',
                padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
              ),
            ],
          ],
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

/// قطعة في صندوق «اشتريها معاً»: المنتج بالدرجة التي تُضاف بها وسعرها.
typedef _BundleLine = ({Product product, ProductShade? shade, bool current, bool needsShade, bool available});

/// «اشتريها معاً»: هذا المنتج + قطعتان متوفرتان كصور متجاورة بينها «+»، لكل قطعة علامة
/// اختيار (مفعّلة افتراضياً)، المجموع والتوفير، و«أضيفي المحدد» بلمسة واحدة.
///
/// قطعة بعدة درجات لا تُضاف بلا درجة: تعرض «اختاري اللون» وتفتح ورقة الدرجات السريعة.
class _BuyTogetherBox extends ConsumerStatefulWidget {
  final Product product;
  final ProductShade? shade;
  final List<Product> pairs;
  final bool canAddCurrent;

  const _BuyTogetherBox({
    required this.product,
    required this.shade,
    required this.pairs,
    required this.canAddCurrent,
  });

  @override
  ConsumerState<_BuyTogetherBox> createState() => _BuyTogetherBoxState();
}

class _BuyTogetherBoxState extends ConsumerState<_BuyTogetherBox> {
  /// ما ألغت الزبونة اختياره — البقية مختارة (الافتراضي: الكل).
  final _off = <String>{};

  static bool _needsShade(Product p) =>
      p.hasMultipleDisplayableShades || (p.displayableShades.isEmpty && p.shadeCount > 1);

  List<_BundleLine> _lines() {
    final current = widget.product;
    final shade = current.shadeForCart(selected: widget.shade);
    final currentStock = shade?.stock ?? current.stock;
    return [
      (
        product: current,
        shade: shade,
        current: true,
        needsShade: false,
        // بلا درجة معروفة بعد (بذرة) أو نافدة: لا تُضاف — شريط الشراء يتولّاها.
        available: widget.canAddCurrent && currentStock > 0 && !(current.hasMultipleDisplayableShades && shade == null),
      ),
      for (final p in widget.pairs)
        (
          product: p,
          shade: _needsShade(p) ? null : p.shadeForCart(),
          current: false,
          needsShade: _needsShade(p),
          available: p.inStock && !_needsShade(p),
        ),
    ];
  }

  bool _selected(_BundleLine l) => l.available && !_off.contains(l.product.id);

  static int _unit(_BundleLine l) => l.product.unitFor(l.shade);

  /// السعر قبل الخصم (أو السعر نفسه بلا خصم) — للتوفير الإجمالي.
  static int _orig(_BundleLine l) {
    final orig = l.product.origFor(l.shade);
    final unit = _unit(l);
    return orig > unit ? orig : unit;
  }

  void _toggle(_BundleLine l) {
    if (!l.available) return;
    HapticFeedback.selectionClick();
    setState(() {
      if (!_off.remove(l.product.id)) _off.add(l.product.id);
    });
  }

  Future<void> _chooseShade(Product p) async {
    HapticFeedback.selectionClick();
    await showQuickShadeSheet(context, ref, p);
  }

  void _addSelected(List<_BundleLine> picked) {
    final s = ref.read(stringsProvider);
    final cart = ref.read(cartProvider.notifier);
    HapticFeedback.mediumImpact();
    var added = 0;
    for (final l in picked) {
      if (cart.addCounted(l.product, shade: l.shade) > 0) added++;
    }
    if (added == 0) {
      AppSnackbar.error(context, s.maxStockReached);
      return;
    }
    final container = ProviderScope.containerOf(context, listen: false);
    AppSnackbar.cartAdded(
      context,
      title: s.bundleAdded(added),
      viewCartLabel: s.viewCart,
      onViewCart: () => openCartTab(context, container),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final lines = _lines();
    final picked = lines.where(_selected).toList();
    final total = picked.fold<int>(0, (n, l) => n + _unit(l));
    final original = picked.fold<int>(0, (n, l) => n + _orig(l));
    final saving = original - total;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: ProductDetailTheme.padH),
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: ProductDetailTheme.heroCardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(s.buyTogetherTitle, style: ProductDetailTheme.sectionTitleStyle(context)),
          const SizedBox(height: 12),
          // الصور متجاورة بينها «+» — تتقلّص على الشاشات الضيقة بدل أن تفيض.
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var i = 0; i < lines.length; i++) ...[
                  if (i > 0)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Icon(Icons.add_rounded, size: 18, color: t.inkMuted),
                    ),
                  _BundleTile(
                    line: lines[i],
                    selected: _selected(lines[i]),
                    onTap: lines[i].current
                        ? () => _toggle(lines[i])
                        : () => openProduct(context, lines[i].product),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 10),
          for (final l in lines)
            _BundleRow(
              name: l.current ? '${s.thisItem}: ${l.product.localizedName(lang)}' : l.product.localizedName(lang),
              shadeName: l.current && l.product.hasMultipleDisplayableShades ? l.shade?.name : null,
              price: _unit(l),
              selected: _selected(l),
              enabled: l.available,
              chooseShadeLabel: l.needsShade ? s.chooseShadeShort : null,
              onTap: l.needsShade ? () => _chooseShade(l.product) : () => _toggle(l),
            ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Divider(height: 1, thickness: 0.6, color: t.divider),
          ),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.total, style: AppText.caption.copyWith(color: t.inkMuted)),
                    Wrap(
                      spacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.end,
                      children: [
                        Text(formatPrice(total), style: AppText.price.copyWith(color: t.ink)),
                        if (saving > 0)
                          Text(
                            formatPrice(original),
                            style: AppText.caption.copyWith(
                              color: t.inkMuted,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                      ],
                    ),
                    if (saving > 0)
                      Text(
                        s.bundleSave(formatPrice(saving)),
                        style: AppText.micro.copyWith(color: AppColors.sale),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Flexible(
                child: FilledButton.icon(
                  onPressed: picked.isEmpty ? null : () => _addSelected(picked),
                  style: FilledButton.styleFrom(
                    backgroundColor: t.accent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(0, kMinTapTarget),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    shape: const StadiumBorder(),
                  ),
                  icon: const Icon(Icons.shopping_bag_rounded, size: 18),
                  label: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(s.addSelected(picked.length), style: AppText.label),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// صورة 72 لقطعة في الصندوق مع علامة الاختيار (أو لوحة الألوان لقطعة تحتاج درجة).
class _BundleTile extends StatelessWidget {
  final _BundleLine line;
  final bool selected;
  final VoidCallback onTap;

  const _BundleTile({required this.line, required this.selected, required this.onTap});

  static const _side = 72.0;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final image = line.shade?.image?.thumb ?? '';
    final motion = MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 180);
    // الصفوف تحتها تحمل الوصف والاختيار لقارئ الشاشة — الصورة لمسة إضافية فقط.
    return ExcludeSemantics(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox.square(
          dimension: _side + 6,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              PositionedDirectional(
                top: 6,
                start: 0,
                child: AnimatedOpacity(
                  duration: motion,
                  opacity: selected || line.needsShade ? 1 : 0.45,
                  child: Container(
                    width: _side,
                    height: _side,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppCorners.sm),
                      border: Border.all(
                        color: selected ? t.accent.withValues(alpha: 0.6) : t.hairline,
                        width: selected ? 1.4 : 1,
                      ),
                    ),
                    child: ProductCoverImage(
                      url: image.isNotEmpty ? image : line.product.coverUrl,
                      width: _side - 12,
                      height: _side - 12,
                    ),
                  ),
                ),
              ),
              PositionedDirectional(
                top: 0,
                end: 0,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: line.needsShade ? t.accentLight : (selected ? t.accent : t.surface),
                    border: Border.all(color: selected ? t.surface : t.hairline, width: 1.5),
                  ),
                  child: Icon(
                    line.needsShade ? Icons.palette_outlined : Icons.check_rounded,
                    size: 13,
                    color: line.needsShade ? t.accentDark : (selected ? Colors.white : t.inkMuted),
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

/// سطر قطعة في الصندوق: علامة اختيار + الاسم + السعر — أو «اختاري اللون» لقطعة بعدة درجات.
class _BundleRow extends ConsumerWidget {
  final String name;
  final String? shadeName;
  final int price;
  final bool selected;
  final bool enabled;

  /// غير null: القطعة تحتاج درجة — الزر يفتح ورقة الدرجات بدل الاختيار.
  final String? chooseShadeLabel;
  final VoidCallback onTap;

  const _BundleRow({
    required this.name,
    required this.shadeName,
    required this.price,
    required this.selected,
    required this.enabled,
    required this.chooseShadeLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final needsShade = chooseShadeLabel != null;
    final label = shadeName == null ? name : '$name · $shadeName';
    return Semantics(
      button: needsShade,
      checked: needsShade ? null : selected,
      enabled: needsShade || enabled,
      label: needsShade
          ? '$label${s.isAr ? '، ' : ', '}$chooseShadeLabel'
          : (selected ? s.bundleIncluded(label) : s.bundleExcluded(label)),
      excludeSemantics: true,
      child: InkWell(
        onTap: needsShade || enabled ? onTap : null,
        borderRadius: BorderRadius.circular(AppCorners.sm),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: kMinTapTarget),
          child: Row(
            children: [
              if (!needsShade)
                Icon(
                  selected ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                  size: 22,
                  color: enabled ? (selected ? t.accent : t.inkMuted) : t.hairline,
                )
              else
                Icon(Icons.palette_outlined, size: 22, color: t.accentDark),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySmall.copyWith(
                    color: enabled || needsShade ? t.ink : t.inkMuted,
                    height: 1.35,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (needsShade)
                Text(chooseShadeLabel!, style: AppText.label.copyWith(color: t.accentDark))
              else
                Text(
                  formatPrice(price),
                  style: AppText.label.copyWith(color: selected ? t.ink : t.inkMuted),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// الشريط السفلي — الإجمالي + زر إضافة.
class _BottomBar extends ConsumerWidget {
  final Product product;
  final int quantity;
  final ProductShade? shade;

  /// null = التفاصيل لم تصل بعد (الزر ظاهر لكن معطّل مع مؤشر تحميل).
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
    final unitPrice = product.unitFor(shade);
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
                      borderRadius: BorderRadius.circular(AppCorners.pill),
                    ),
                    child: Text(
                      s.isAr ? 'في سلتك ×$inCartQty' : 'In bag ×$inCartQty',
                      style: AppText.micro.copyWith(color: context.worldTheme.accentDark),
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
                            style: AppText.micro.copyWith(color: context.worldTheme.inkSoft),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Text(
                    quantity > 1 ? s.totalWithQty(quantity) : s.total,
                    style: AppText.micro.copyWith(color: context.worldTheme.inkMuted, fontWeight: FontWeight.w600),
                  ),
                const SizedBox(height: 2),
                Text(
                  formatPrice(total),
                  style: (narrow ? AppText.price.copyWith(fontSize: 17) : AppText.title2).copyWith(
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
                          borderRadius: BorderRadius.circular(AppCorners.pill),
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
                            borderRadius: BorderRadius.circular(AppCorners.pill),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // التفاصيل لم تصل بعد: مؤشر صغير بدل الأيقونة — الزر يتفعّل وحده.
                                if (onAdd == null)
                                  SizedBox(
                                    width: narrow ? 16 : 18,
                                    height: narrow ? 16 : 18,
                                    child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                else
                                  Icon(Icons.shopping_bag_rounded, size: narrow ? 18 : 20, color: Colors.white),
                                SizedBox(width: narrow ? 6 : 8),
                                Flexible(
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      s.addToCartBtn,
                                      style: AppText.label.copyWith(
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
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: watching ? Border.all(color: t.accent, width: 1.4) : null,
        boxShadow: watching
            ? null
            : [BoxShadow(color: t.accent.withValues(alpha: 0.28), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppCorners.pill),
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
                    style: AppText.label.copyWith(
                      fontSize: 14,
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
