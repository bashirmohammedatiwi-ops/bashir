import 'dart:async';

import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/cache/image_cache.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/category.dart';
import '../../data/models/paginated.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_refresh.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/category_tree.dart';
import '../worlds/world_theme.dart';
import 'listing_navigation.dart';
import 'widgets/listing_brand_split_grid.dart';
import 'widgets/listing_filters_section.dart';
import 'widgets/listing_page_header.dart';
import 'widgets/listing_theme.dart';

class ProductListingScreen extends ConsumerStatefulWidget {
  final String title;
  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;
  final String? brandId;
  final String? search;
  final bool isNew;
  final bool isBestSeller;
  final bool isPromo;
  final bool isFeatured;
  final String? concernSlug;

  /// نطاق سعر مبدئي (مثلاً من "تسوّقي حسب ميزانيتك" في الرئيسية).
  final int? initialMinPrice;
  final int? initialMaxPrice;

  /// يحصر القائمة بأقسام عالم («عرض الكل» لرفوف العالم: ?world=slug).
  final String? world;

  /// مختارات بعينها بترتيبها (رف مختار يدوياً في الرئيسية: ?ids=a,b,c).
  final List<String>? ids;

  /// أقل نسبة خصم (1–90) — مستويات صفحة العروض.
  final int? minDiscount;

  /// نوع البشرة (oily/dry/…) — من دليل البشرة واختبارها.
  final String? skinType;

  /// [title] صريح من الرابط (عنوان رفّ من لوحة التحكم): يُعرض كما هو بدل العناوين
  /// العامة («الأكثر مبيعاً»، اسم القسم…).
  final bool titleExplicit;

  const ProductListingScreen({
    super.key,
    required this.title,
    this.categoryId,
    this.subcategoryId,
    this.tertiaryCategoryId,
    this.brandId,
    this.search,
    this.isNew = false,
    this.isBestSeller = false,
    this.isPromo = false,
    this.isFeatured = false,
    this.concernSlug,
    this.initialMinPrice,
    this.initialMaxPrice,
    this.world,
    this.ids,
    this.minDiscount,
    this.skinType,
    this.titleExplicit = false,
  });

  @override
  ConsumerState<ProductListingScreen> createState() => _ProductListingScreenState();
}

enum _BrandListingPhase { inCategory, otherBrand, done }

/// صفحات قائمة «براند داخل قسم»: منتجاته في القسم أولاً ثم باقي منتجاته.
///
/// إعادة التحميل تملأ نسخة جديدة وتستبدلها دفعة واحدة — القديمة تبقى ظاهرة حتى ذلك.
class _SplitPages {
  final inCategory = <Product>[];
  final other = <Product>[];
  int inCategoryPage = 1;
  int otherPage = 1;
  bool inCategoryHasMore = true;
  bool otherHasMore = true;
  _BrandListingPhase phase = _BrandListingPhase.inCategory;
  int? total;

  bool get hasMore => inCategoryHasMore || otherHasMore;
  List<Product> get visible => [...inCategory, ...other];
}

class _ProductListingScreenState extends ConsumerState<ProductListingScreen> {
  final _scroll = ScrollController();
  final List<Product> _items = [];
  int _page = 1;
  bool _hasMore = true;
  _SplitPages _split = _SplitPages();
  bool _loading = false;

  /// لم تصل أي صفحة بعد (أو بدأ تحميل جديد بلا منتجات ظاهرة).
  bool _firstLoad = true;
  bool _paginationQueued = false;

  /// يزيد مع كل إعادة تحميل (فلتر، ترتيب، قسم، براند): ردّ طلب أقدم يُهمل بدل أن يُلصق
  /// نتائج الفلاتر السابقة — والضغطة الجديدة لا تُهمل أبداً لأن طلباً ما زال جارياً.
  int _gen = 0;

  /// إعادة تحميل جارية والمنتجات القديمة ظاهرة: تُعتَم حتى تصل الصفحة الأولى.
  bool _resetting = false;

  /// صفحات أُلحقت بعد الأولى — التحديث الصامت لا يستبدل قائمة تصفّحتها أبعد منها.
  int _pagesAppended = 0;

  /// بحث الباركود يُجرَّب مرة واحدة لكل نص بحث، لا مع كل فلتر أو سحب للتحديث.
  bool _barcodeTried = false;

  /// الخطأ الخام — يُصاغ بلغة الواجهة عند العرض.
  Object? _error;

  String _sort = 'default';
  int? _minPrice;
  int? _maxPrice;
  bool _inStock = false;
  bool _onSale = false;
  double? _minRating;
  int? _total;

  int get _activeFilterCount =>
      (_minPrice != null || _maxPrice != null ? 1 : 0) +
      (_inStock ? 1 : 0) +
      (_onSale && !widget.isPromo ? 1 : 0) +
      (_minRating != null ? 1 : 0);

  @override
  void initState() {
    super.initState();
    _minPrice = widget.initialMinPrice;
    _maxPrice = widget.initialMaxPrice;
    _fetch(reset: true);
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    // بعد خطأ صفحة تالية: إعادة المحاولة بزرّها في التذييل، لا مع كل حركة تمرير.
    if (_paginationQueued || _loading || _error != null || !_effectiveHasMore) return;
    if (_scroll.position.pixels < _scroll.position.maxScrollExtent - 480) return;
    _paginationQueued = true;
    _fetch().whenComplete(() => _paginationQueued = false);
  }

  bool get _splitBrandByCategory =>
      widget.brandId != null &&
      (widget.categoryId != null || widget.subcategoryId != null || widget.tertiaryCategoryId != null);

  bool get _effectiveHasMore => _splitBrandByCategory ? _split.hasMore : _hasMore;

  List<Product> get _visibleItems => _splitBrandByCategory ? _split.visible : _items;

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ProductListingScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.search != widget.search) _barcodeTried = false;
    if (oldWidget.categoryId != widget.categoryId ||
        oldWidget.subcategoryId != widget.subcategoryId ||
        oldWidget.tertiaryCategoryId != widget.tertiaryCategoryId ||
        oldWidget.brandId != widget.brandId ||
        oldWidget.search != widget.search ||
        oldWidget.isNew != widget.isNew ||
        oldWidget.isBestSeller != widget.isBestSeller ||
        oldWidget.isPromo != widget.isPromo ||
        oldWidget.isFeatured != widget.isFeatured ||
        oldWidget.concernSlug != widget.concernSlug ||
        oldWidget.world != widget.world ||
        oldWidget.skinType != widget.skinType ||
        oldWidget.minDiscount != widget.minDiscount ||
        !listEquals(oldWidget.ids, widget.ids)) {
      _fetch(reset: true);
    }
  }

  String _resolveTitle(String lang, AppStrings s, List<Category> roots) {
    if (widget.titleExplicit && widget.title.trim().isNotEmpty) return widget.title;
    final categoryId = widget.tertiaryCategoryId ?? widget.subcategoryId ?? widget.categoryId;
    if (categoryId != null) {
      final cat = findCategoryById(roots, categoryId);
      if (cat != null) return cat.localizedName(lang);
    }
    if (widget.brandId != null) {
      for (final brand in ref.watch(brandsProvider).valueOrNull ?? const []) {
        if (brand.id == widget.brandId) return brand.localizedName(lang);
      }
    }
    if (widget.isBestSeller) return s.sortPopular;
    if (widget.isNew) return s.newArrivals;
    if (widget.isPromo) return s.allOffers;
    if (widget.isFeatured) return s.products;
    return widget.title;
  }

  /// نص البحث باركود لمنتج: يفتح صفحته مكان القائمة (الرجوع لا يقع على قائمة فارغة).
  Future<bool> _tryOpenBarcodeProduct(String code) async {
    try {
      final hit = await ref.read(apiServiceProvider).lookupProductByBarcode(code);
      if (!mounted || hit == null) return false;
      context.pushReplacement('/product/${hit.productSlug}');
      return true;
    } catch (_) {
      return false;
    }
  }

  /// [reset] يبدأ القائمة من الصفحة الأولى (فلتر، ترتيب، قسم…) ويُلغي أي طلب جارٍ.
  /// المنتجات الظاهرة تبقى (معتمة) حتى تصل الصفحة الأولى ثم تُستبدل دفعة واحدة.
  /// [keepItems] (السحب للتحديث): عند الفشل تبقى القائمة كما هي مع رسالة.
  /// [force] يتجاوز كاش الجهاز — للسحب للتحديث فقط؛ الفتح العادي يرسم من الكاش فوراً.
  Future<void> _fetch({bool reset = false, bool keepItems = false, bool force = false}) async {
    if (!reset && (_loading || !_effectiveHasMore)) return;
    if (reset) {
      _gen++;
      _paginationQueued = false;
    }
    final gen = _gen;

    setState(() {
      _loading = true;
      // السحب للتحديث له مؤشره الخاص — التعتيم لتغيير الفلاتر والأقسام فقط.
      _resetting = reset && !keepItems;
      _error = null;
    });

    final search = widget.search?.trim();
    if (!_barcodeTried && search != null && isBarcodeSearchQuery(search)) {
      _barcodeTried = true;
      final opened = await _tryOpenBarcodeProduct(search);
      if (!mounted || gen != _gen || opened) return;
    }

    final watch = Stopwatch()..start();
    try {
      if (_splitBrandByCategory) {
        await _fetchSplitBrandListing(gen, reset: reset, force: force);
      } else {
        await _fetchStandardListing(gen, reset: reset, force: force);
      }
      // وصلت الصفحة الأولى فوراً = من كاش الجهاز: نسخة الشبكة تُجلب بصمت وتحلّ محلها
      // إن اختلفت (سعر، مخزون، منتج جديد).
      if (reset && !force && mounted && gen == _gen && watch.elapsedMilliseconds < 300) {
        unawaited(_silentRefresh(gen));
      }
    } catch (e) {
      if (!mounted || gen != _gen) return;
      if (reset && keepItems && _visibleItems.isNotEmpty) {
        AppSnackbar.error(context, ref.friendly(e));
      } else {
        setState(() {
          _error = e;
          // نتائج فلاتر سابقة لا تُعرض تحت فلاتر جديدة.
          if (reset) _clearItems();
        });
      }
    } finally {
      if (mounted && gen == _gen) {
        setState(() {
          _loading = false;
          _resetting = false;
          _firstLoad = false;
        });
      }
    }
  }

  void _clearItems() {
    _items.clear();
    _page = 1;
    _hasMore = true;
    _split = _SplitPages();
    _pagesAppended = 0;
    _total = null;
  }

  Future<void> _refresh() async {
    await refreshStorefrontCatalog(ref);
    await _fetch(reset: true, keepItems: true, force: true);
  }

  Future<void> _fetchStandardListing(int gen, {required bool reset, required bool force}) async {
    final page = reset ? 1 : _page;
    final result = await _queryProducts(
      page: page,
      force: force,
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    if (!mounted || gen != _gen) return;
    setState(() {
      if (reset) {
        _items.clear();
        _pagesAppended = 0;
        _total = result.total;
      } else {
        _pagesAppended++;
      }
      // تغيّر الترتيب بين صفحتين قد يكرر منتجاً — مرة واحدة فقط في الشبكة.
      final seen = {for (final p in _items) p.id};
      _items.addAll(result.items.where((p) => seen.add(p.id)));
      _hasMore = result.hasNext;
      _page = page + 1;
    });
    _precacheLatest(result.items);
  }

  Future<void> _fetchSplitBrandListing(int gen, {required bool reset, required bool force}) async {
    final pages = reset ? _SplitPages() : _split;
    final done = await _advanceSplit(pages, gen, force: force, live: !reset);
    if (!done || !mounted || gen != _gen) return;
    setState(() {
      if (reset) {
        _split = pages;
        _pagesAppended = 0;
        _total = pages.total;
      } else {
        _pagesAppended++;
      }
    });
  }

  /// يجلب في [pages] الدفعة الظاهرة التالية. [live] = [pages] هي المعروضة الآن، فيُعاد
  /// البناء بعد كل طلب. يعيد false إن ألغاه تحميل أحدث.
  Future<bool> _advanceSplit(_SplitPages pages, int gen, {required bool force, required bool live}) async {
    while (true) {
      if (pages.phase == _BrandListingPhase.inCategory && pages.inCategoryHasMore) {
        final result = await _queryProducts(
          page: pages.inCategoryPage,
          force: force && pages.inCategoryPage == 1,
          categoryId: widget.categoryId,
          subcategoryId: widget.subcategoryId,
          tertiaryCategoryId: widget.tertiaryCategoryId,
        );
        if (!mounted || gen != _gen) return false;
        if (pages.inCategoryPage == 1) pages.total = result.total;
        final seen = {for (final p in pages.inCategory) p.id};
        pages.inCategory.addAll(result.items.where((p) => seen.add(p.id)));
        pages.inCategoryHasMore = result.hasNext;
        pages.inCategoryPage++;
        if (!pages.inCategoryHasMore) pages.phase = _BrandListingPhase.otherBrand;
        if (live) setState(() {});
        _precacheLatest(result.items);
        if (pages.inCategoryHasMore) return true;
        continue;
      }

      if (pages.phase == _BrandListingPhase.otherBrand && pages.otherHasMore) {
        final result = await _queryProducts(page: pages.otherPage, force: force && pages.otherPage == 1);
        if (!mounted || gen != _gen) return false;
        final seen = {for (final p in pages.inCategory) p.id, for (final p in pages.other) p.id};
        final batch = result.items.where((p) => seen.add(p.id)).toList();
        pages.other.addAll(batch);
        pages.otherHasMore = result.hasNext;
        pages.otherPage++;
        if (!pages.otherHasMore) pages.phase = _BrandListingPhase.done;
        if (live) setState(() {});
        _precacheLatest(batch);
        // دفعة كلها مكررة (أو بلا قسم): لا شيء جديد يظهر — نكمل للصفحة التالية فوراً
        // بدل هياكل تحميل عالقة تنتظر حركة تمرير.
        if (pages.otherHasMore && !batch.any((p) => p.category != null)) continue;
        return true;
      }

      pages.phase = _BrandListingPhase.done;
      if (live) setState(() {});
      return true;
    }
  }

  /// نسخة الشبكة للصفحة الأولى بعد رسمها من الكاش — تُستبدل فقط إن اختلفت ولم يتغير
  /// شيء في الأثناء (فلتر جديد، صفحة تالية، تحميل جارٍ).
  Future<void> _silentRefresh(int gen) async {
    bool stillCurrent() => mounted && gen == _gen && !_loading && _pagesAppended == 0;
    try {
      if (_splitBrandByCategory) {
        final pages = _SplitPages();
        final done = await _advanceSplit(pages, gen, force: true, live: false);
        if (!done || !stillCurrent()) return;
        if (pages.total == _total && _sameProducts(pages.visible, _split.visible)) return;
        setState(() {
          _split = pages;
          _total = pages.total;
        });
        return;
      }
      final result = await _queryProducts(
        page: 1,
        force: true,
        categoryId: widget.categoryId,
        subcategoryId: widget.subcategoryId,
        tertiaryCategoryId: widget.tertiaryCategoryId,
      );
      if (!stillCurrent()) return;
      if (result.total == _total && _sameProducts(result.items, _items)) return;
      setState(() {
        _items
          ..clear()
          ..addAll(result.items);
        _hasMore = result.hasNext;
        _page = 2;
        _total = result.total;
      });
      _precacheLatest(result.items);
    } catch (_) {
      // صامت: يبقى ما رُسم من الكاش.
    }
  }

  /// نفس المنتجات بنفس الترتيب والسعر والمخزون.
  static bool _sameProducts(List<Product> a, List<Product> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      final x = a[i];
      final y = b[i];
      if (x.id != y.id || x.price != y.price || x.originalPrice != y.originalPrice || x.stock != y.stock) {
        return false;
      }
    }
    return true;
  }

  Future<Paginated<Product>> _queryProducts({
    required int page,
    bool force = false,
    String? categoryId,
    String? subcategoryId,
    String? tertiaryCategoryId,
  }) {
    return ref
        .read(apiServiceProvider)
        .getProducts(
          page: page,
          limit: AppConfig.pageSize,
          categoryId: categoryId,
          subcategoryId: subcategoryId,
          tertiaryCategoryId: tertiaryCategoryId,
          brandId: widget.brandId,
          search: widget.search,
          isNew: widget.isNew ? true : null,
          isBestSeller: widget.isBestSeller ? true : null,
          isPromo: widget.isPromo || _onSale ? true : null,
          isFeatured: widget.isFeatured ? true : null,
          concernSlug: widget.concernSlug,
          sort: _sort == 'default' || _sort == 'brand' ? 'brand' : _sort,
          minPrice: _minPrice,
          maxPrice: _maxPrice,
          inStock: _inStock ? true : null,
          minRating: _minRating,
          world: widget.world,
          ids: widget.ids,
          minDiscount: widget.minDiscount,
          skinType: widget.skinType,
          // الصفحات التالية من الكاش أيضاً إن وُجدت؛ الأولى تُفرض فقط بالسحب للتحديث.
          forceRefresh: force && page == 1,
        );
  }

  void _precacheLatest(Iterable<Product> products) {
    if (!mounted || products.isEmpty) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      precacheProductCovers(context, products.map((p) => p.coverUrl), limit: 20);
    });
  }

  String? _resolveBrandName(String lang) {
    if (widget.brandId == null) return null;
    for (final brand in ref.read(brandsProvider).valueOrNull ?? const []) {
      if (brand.id == widget.brandId) return brand.localizedName(lang);
    }
    return null;
  }

  String? _resolveCategoryScopeName(String lang, List<Category> roots) {
    final id = widget.tertiaryCategoryId ?? widget.subcategoryId ?? widget.categoryId;
    if (id == null) return null;
    return findCategoryById(roots, id)?.localizedName(lang);
  }

  /// يجمع باقي منتجات البراند (خارج القسم الحالي — أزالها منع التكرار أصلاً) في مجموعات:
  /// داخل قسم فرعي أو ثالث حسب القسم الفرعي (أخوات القسم في نفس القسم الرئيسي تظهر
  /// أيضاً)، وداخل قسم رئيسي حسب القسم الرئيسي. الترتيب كما وصلت من الخادم.
  List<BrandCategoryGroup> _buildOtherGroups(String lang, List<Category> roots) {
    final s = ref.read(stringsProvider);
    final groups = <String, List<Product>>{};
    final labels = <String, String>{};
    final bySubcategory = widget.subcategoryId != null || widget.tertiaryCategoryId != null;

    for (final p in _split.other) {
      final cat = p.category;
      if (cat == null) continue;
      final String key;
      final String label;
      final subId = p.subcategory?.id ?? p.subcategoryId;
      if (bySubcategory && subId != null && subId.isNotEmpty) {
        key = subId;
        label = (p.subcategory ?? findCategoryById(roots, subId))?.localizedName(lang) ?? cat.localizedName(lang);
      } else {
        final root = findRootCategory(roots, cat.id);
        key = root?.id ?? cat.id;
        label = root?.localizedName(lang) ?? cat.localizedName(lang);
      }
      groups.putIfAbsent(key, () => []).add(p);
      labels.putIfAbsent(key, () => label);
    }

    return [
      for (final e in groups.entries)
        BrandCategoryGroup(
          categoryId: e.key,
          label: '${labels[e.key] ?? ''} · ${s.brandGroupCount(e.value.length)}',
          products: e.value,
        ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final roots = ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
    final title = _resolveTitle(lang, s, roots);
    final crumb = categoryBreadcrumb(
      roots,
      lang,
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListingPageHeader(
            title: title,
            subtitle: crumb,
            filters: ListingQuickFilters(
              sortLabel: s.sortShortFor(_sort),
              sortActive: _sort != 'default',
              priceLabel: _priceLabel(s),
              inStock: _inStock,
              onSale: _onSale || widget.isPromo,
              showOnSale: !widget.isPromo,
              ratingLabel: _minRating == null ? null : s.lfRatingAtLeast(_fmtRating(_minRating!)),
              activeCount: _activeFilterCount,
              total: _total,
            ),
            onSort: _openSort,
            onPrice: _openPrice,
            onRating: _openRating,
            onAllFilters: _openFilter,
            onToggleInStock: () => _applyAndFetch(() => _inStock = !_inStock),
            onToggleSale: () => _applyAndFetch(() => _onSale = !_onSale),
            onClearAll: _clearFilters,
          ),
          Expanded(child: _buildBody(s, lang, roots, title)),
        ],
      ),
    );
  }

  /// الجسم تمرير واحد: الفلاتر (أشرطة الأقسام والبراندات) أولاً وتبقى مركّبة في كل
  /// الحالات — تحميل، فراغ، خطأ — فلا تقفز ولا يضيع موضعها، ثم المحتوى تحتها.
  Widget _buildBody(AppStrings s, String lang, List<Category> roots, String title) {
    final t = context.worldTheme;
    final items = _visibleItems;
    final hasItems = items.isNotEmpty;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    const gridPadding = EdgeInsets.fromLTRB(ListingTheme.padH, 12, ListingTheme.padH, 32);

    final effectiveSubId = listingSubcategoryId(
      roots,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    final filtersSection = _buildFiltersSection(s, lang, roots, title, effectiveSubId);

    final Widget content;
    if (!hasItems && _error != null) {
      content = SliverFillRemaining(
        hasScrollBody: false,
        child: ErrorView.from(_error, onRetry: () => _fetch(reset: true)),
      );
    } else if (!hasItems && (_loading || _firstLoad)) {
      // نفس شكل شبكة القائمة وهوامشها — لا قفزة عند وصول المنتجات.
      content = const SliverToBoxAdapter(child: ProductGridSkeleton(count: 8, listing: true, padding: gridPadding));
    } else if (!hasItems) {
      content = SliverFillRemaining(hasScrollBody: false, child: _buildEmptyState(s, title, effectiveSubId));
    } else {
      // خطأ في صفحة تالية: لا هياكل عالقة — رسالة مع إعادة المحاولة.
      final pageFailed = _error != null;
      final footer = pageFailed ? _LoadMoreFailed(onRetry: () => _fetch()) : null;
      final extraSlots = !pageFailed && _effectiveHasMore && !_resetting ? 2 : 0;
      final Widget grid;
      if (_splitBrandByCategory) {
        final brandName = _resolveBrandName(lang) ?? widget.title;
        final categoryName = _resolveCategoryScopeName(lang, roots) ?? title;
        final otherGroups = _buildOtherGroups(lang, roots);
        final otherCount = otherGroups.fold<int>(0, (sum, g) => sum + g.products.length);
        grid = ListingBrandSplitGrid.sliver(
          inCategory: _split.inCategory,
          otherGroups: otherGroups,
          inCategoryLabel: s.brandInThisSection(categoryName, _split.inCategory.length),
          otherLabel: s.brandInOtherSections(brandName, otherCount),
          dividerLabel: s.brandSplitDivider(brandName),
          showPromoBadge: widget.isPromo,
          showRating: true,
          extraSlots: extraSlots,
          footer: footer,
        );
      } else {
        grid = ProductGrid.sliver(
          products: _items,
          showPromoBadge: widget.isPromo,
          showRating: true,
          listingStyle: true,
          padding: gridPadding,
          extraSlots: extraSlots,
          footer: footer,
        );
      }
      // تحميل جديد فوق نتائج ظاهرة: تبقى معتمة وغير قابلة للمس حتى تصل الجديدة.
      content = SliverAnimatedOpacity(
        opacity: _resetting ? 0.5 : 1,
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 180),
        sliver: SliverIgnorePointer(ignoring: _resetting, sliver: grid),
      );
    }

    return Stack(
      children: [
        RefreshIndicator(
          color: t.accent,
          onRefresh: _refresh,
          child: CustomScrollView(
            controller: _scroll,
            physics: AppScrollPerf.physics,
            cacheExtent: AppScrollPerf.gridCacheExtent,
            slivers: [
              if (filtersSection != null) SliverToBoxAdapter(child: filtersSection),
              content,
            ],
          ),
        ),
        if (_resetting && hasItems)
          PositionedDirectional(
            top: 0,
            start: 0,
            end: 0,
            child: LinearProgressIndicator(
              minHeight: 2,
              color: t.accent,
              backgroundColor: Colors.transparent,
              semanticsLabel: s.loading,
            ),
          ),
      ],
    );
  }

  Widget? _buildFiltersSection(AppStrings s, String lang, List<Category> roots, String title, String? effectiveSubId) {
    final childCategories = listingChildCategories(
      roots,
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    final showChildStrip =
        (widget.categoryId != null || widget.subcategoryId != null || widget.tertiaryCategoryId != null) &&
        childCategories.isNotEmpty;
    final activeChildId = listingActiveChildId(
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );

    final stripParentTitle = effectiveSubId != null
        ? (findCategoryById(roots, effectiveSubId)?.localizedName(lang) ?? title)
        : title;

    final showBrandsStrip = effectiveSubId != null || widget.categoryId != null;
    if (!showChildStrip && !showBrandsStrip) return null;
    final brandsAsync = effectiveSubId != null
        ? ref.watch(subcategoryBrandsProvider(effectiveSubId))
        : widget.categoryId != null
        ? ref.watch(categoryBrandsProvider(widget.categoryId!))
        : null;

    return ListingFiltersSection(
      childCategories: childCategories,
      activeChildId: activeChildId,
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
      parentTitle: stripParentTitle,
      showTertiaryLabel: widget.subcategoryId != null,
      effectiveSubId: effectiveSubId,
      brandsAsync: brandsAsync,
      selectedBrandId: widget.brandId,
      listingTitle: title,
    );
  }

  /// لا نتائج: مخرج واضح دائماً — مسح الفلاتر، أو كل براندات القسم، أو تصفّح الأقسام.
  Widget _buildEmptyState(AppStrings s, String title, String? effectiveSubId) {
    final hasFilters = _activeFilterCount > 0;
    final inScope = widget.categoryId != null || effectiveSubId != null || widget.tertiaryCategoryId != null;
    const buttonSize = Size(200, 48);

    final Widget action;
    if (hasFilters) {
      action = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FilledButton.icon(
            onPressed: _clearFilters,
            icon: const Icon(Icons.filter_alt_off_rounded, size: 20),
            label: Text(s.lfClearAll),
            style: FilledButton.styleFrom(minimumSize: buttonSize),
          ),
          if (widget.brandId != null && inScope) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => _showAllBrands(title, effectiveSubId),
              style: TextButton.styleFrom(minimumSize: const Size(44, 44)),
              child: Text(s.viewAllBrands),
            ),
          ],
        ],
      );
    } else if (widget.brandId != null && inScope) {
      action = OutlinedButton.icon(
        onPressed: () => _showAllBrands(title, effectiveSubId),
        icon: const Icon(Icons.storefront_outlined, size: 20),
        label: Text(s.viewAllBrands),
        style: OutlinedButton.styleFrom(minimumSize: buttonSize),
      );
    } else {
      action = OutlinedButton.icon(
        onPressed: () => openCategoriesTab(context, ProviderScope.containerOf(context, listen: false)),
        icon: const Icon(Icons.grid_view_rounded, size: 20),
        label: Text(s.browseCategories),
        style: OutlinedButton.styleFrom(minimumSize: buttonSize),
      );
    }

    return EmptyState(
      icon: hasFilters ? Icons.filter_alt_outlined : Icons.inventory_2_outlined,
      title: s.noProducts,
      subtitle: hasFilters ? s.tryRemovingFilters : s.noProductsHint,
      action: action,
    );
  }

  /// نفس القسم بلا براند محدد.
  void _showAllBrands(String title, String? effectiveSubId) {
    navigateListingBrand(
      context: context,
      categoryId: effectiveSubId == null ? widget.categoryId : null,
      subcategoryId: effectiveSubId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
      brandId: null,
      title: title,
    );
  }

  static const _pricePresets = <(int?, int?)>[(null, 10000), (10000, 25000), (25000, 50000), (50000, null)];

  String? _priceLabel(AppStrings s) {
    if (_minPrice == null && _maxPrice == null) return null;
    if (_minPrice == null) return s.lfPriceUnder(formatNumber(_maxPrice));
    if (_maxPrice == null) return s.lfPriceOver(formatNumber(_minPrice));
    return s.lfPriceBetween(formatNumber(_minPrice), formatNumber(_maxPrice));
  }

  String _fmtRating(double r) => r == r.roundToDouble() ? r.toStringAsFixed(0) : r.toString();

  void _clearFilters() {
    HapticFeedback.mediumImpact();
    setState(() {
      _minPrice = null;
      _maxPrice = null;
      _inStock = false;
      _onSale = false;
      _minRating = null;
    });
    _fetch(reset: true);
  }

  void _applyAndFetch(VoidCallback change) {
    setState(change);
    _fetch(reset: true);
  }

  void _openSort() {
    final s = ref.read(stringsProvider);
    final options = {
      'default': (s.sortByBrand, Icons.auto_awesome_rounded),
      'popular': (s.sortPopular, Icons.local_fire_department_rounded),
      'latest': (s.sortLatest, Icons.schedule_rounded),
      'price_asc': (s.sortPriceAsc, Icons.trending_up_rounded),
      'price_desc': (s.sortPriceDesc, Icons.trending_down_rounded),
      'rating': (s.sortRating, Icons.star_rounded),
    };
    showAppSheet(
      context: context,
      title: s.sortBy,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
        children: [
          for (final e in options.entries)
            _SheetOption(
              icon: e.value.$2,
              label: e.value.$1,
              selected: _sort == e.key,
              onTap: () {
                Navigator.pop(ctx);
                if (_sort != e.key) _applyAndFetch(() => _sort = e.key);
              },
            ),
        ],
      ),
    );
  }

  void _openPrice() {
    final s = ref.read(stringsProvider);
    showAppSheet(
      context: context,
      title: s.priceRange,
      builder: (ctx) => _PriceSheetBody(
        strings: s,
        presets: _pricePresets,
        min: _minPrice,
        max: _maxPrice,
        onApply: (min, max) {
          Navigator.pop(ctx);
          _applyAndFetch(() {
            _minPrice = min;
            _maxPrice = max;
          });
        },
      ),
    );
  }

  void _openRating() {
    final s = ref.read(stringsProvider);
    showAppSheet(
      context: context,
      title: s.minRating,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
        children: [
          for (final r in const <double?>[null, 3, 4, 4.5])
            _SheetOption(
              icon: r == null ? Icons.all_inclusive_rounded : Icons.star_rounded,
              label: r == null ? s.all : s.lfRatingAtLeast(_fmtRating(r)),
              selected: _minRating == r,
              onTap: () {
                Navigator.pop(ctx);
                if (_minRating != r) _applyAndFetch(() => _minRating = r);
              },
            ),
        ],
      ),
    );
  }

  /// كل الفلاتر في ورقة واحدة — تُطبّق دفعة واحدة عند "عرض النتائج".
  ///
  /// «إعادة ضبط» و«عرض النتائج» مثبّتان في تذييل الورقة (لا تمرير للوصول إليهما)،
  /// والمسودة مشتركة بين المحتوى والتذييل عبر [ValueNotifier].
  void _openFilter() {
    final s = ref.read(stringsProvider);
    final draft = ValueNotifier<_FilterDraft>((
      minP: _minPrice,
      maxP: _maxPrice,
      inStock: _inStock,
      onSale: _onSale,
      minR: _minRating,
    ));
    void edit(_FilterDraft Function(_FilterDraft d) change) => draft.value = change(draft.value);

    showAppSheet<void>(
      context: context,
      title: s.filterProducts,
      footer: ValueListenableBuilder<_FilterDraft>(
        valueListenable: draft,
        builder: (ctx, d, _) {
          final pristine = d.minP == null && d.maxP == null && !d.inStock && !d.onSale && d.minR == null;
          return Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: pristine
                      ? null
                      : () => draft.value = (minP: null, maxP: null, inStock: false, onSale: false, minR: null),
                  child: Text(s.reset),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _applyAndFetch(() {
                      _minPrice = d.minP;
                      _maxPrice = d.maxP;
                      _inStock = d.inStock;
                      _onSale = d.onSale;
                      _minRating = d.minR;
                    });
                  },
                  child: Text(s.lfShowResults),
                ),
              ),
            ],
          );
        },
      ),
      builder: (ctx) => ValueListenableBuilder<_FilterDraft>(
        valueListenable: draft,
        builder: (ctx, d, _) {
          final t = ctx.worldTheme;
          Widget label(String text) => Padding(
            padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
            child: Text(text, style: AppText.title3.copyWith(color: t.ink)),
          );
          return ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            children: [
              label(s.priceRange),
              // AppChoiceChip مساحة لمسه 44 (4 فوق وتحت الحبة) — الفراغ المرئي يبقى 8.
              Wrap(
                spacing: 8,
                runSpacing: 0,
                children: [
                  AppChoiceChip(
                    label: s.lfAnyPrice,
                    selected: d.minP == null && d.maxP == null,
                    onTap: () =>
                        edit((d) => (minP: null, maxP: null, inStock: d.inStock, onSale: d.onSale, minR: d.minR)),
                  ),
                  for (final p in _pricePresets)
                    AppChoiceChip(
                      label: p.$1 == null
                          ? s.lfPriceUnder(formatNumber(p.$2))
                          : p.$2 == null
                          ? s.lfPriceOver(formatNumber(p.$1))
                          : s.lfPriceBetween(formatNumber(p.$1), formatNumber(p.$2)),
                      selected: d.minP == p.$1 && d.maxP == p.$2,
                      onTap: () =>
                          edit((d) => (minP: p.$1, maxP: p.$2, inStock: d.inStock, onSale: d.onSale, minR: d.minR)),
                    ),
                ],
              ),
              label(s.minRating),
              // AppChoiceChip مساحة لمسه 44 (4 فوق وتحت الحبة) — الفراغ المرئي يبقى 8.
              Wrap(
                spacing: 8,
                runSpacing: 0,
                children: [
                  for (final r in const <double?>[null, 3, 4, 4.5])
                    AppChoiceChip(
                      label: r == null ? s.all : s.lfRatingAtLeast(_fmtRating(r)),
                      icon: r == null ? null : Icons.star_rounded,
                      selected: d.minR == r,
                      onTap: () =>
                          edit((d) => (minP: d.minP, maxP: d.maxP, inStock: d.inStock, onSale: d.onSale, minR: r)),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              _SwitchRow(
                label: s.inStockOnly,
                icon: Icons.inventory_2_outlined,
                value: d.inStock,
                onChanged: (v) => edit((d) => (minP: d.minP, maxP: d.maxP, inStock: v, onSale: d.onSale, minR: d.minR)),
              ),
              if (!widget.isPromo)
                _SwitchRow(
                  label: s.lfOffersOnly,
                  icon: Icons.local_offer_outlined,
                  value: d.onSale,
                  onChanged: (v) =>
                      edit((d) => (minP: d.minP, maxP: d.maxP, inStock: d.inStock, onSale: v, minR: d.minR)),
                ),
            ],
          );
        },
      ),
    );
  }
}

/// مسودة ورقة الفلاتر قبل «عرض النتائج».
typedef _FilterDraft = ({int? minP, int? maxP, bool inStock, bool onSale, double? minR});

/// تذييل «تعذّر تحميل المزيد» مع إعادة المحاولة — بدل هياكل تحميل لا تنتهي.
class _LoadMoreFailed extends ConsumerWidget {
  final VoidCallback onRetry;

  const _LoadMoreFailed({required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 0, ListingTheme.padH, 32),
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(14, 6, 6, 6),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(AppCorners.md),
          border: Border.all(color: t.hairline),
        ),
        child: Row(
          children: [
            Icon(Icons.cloud_off_rounded, size: 20, color: t.inkMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(s.loadMoreFailed, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
            ),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text(s.retryAction),
              style: TextButton.styleFrom(foregroundColor: t.accentDark, minimumSize: const Size(44, 44)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SheetOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SheetOption({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Material(
        color: selected ? t.accentLight : Colors.transparent,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppCorners.md),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
            child: Row(
              children: [
                Icon(icon, size: 21, color: selected ? t.accent : t.inkMuted),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: AppText.body.copyWith(
                      color: selected ? t.accentDark : t.ink,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                      height: 1.2,
                    ),
                  ),
                ),
                AnimatedScale(
                  duration: const Duration(milliseconds: 180),
                  scale: selected ? 1 : 0,
                  child: Icon(Icons.check_circle_rounded, color: t.accent, size: 22),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchRow({required this.label, required this.icon, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(AppCorners.md),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 20, color: t.inkSoft),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: AppText.body.copyWith(color: t.ink, height: 1.2)),
            ),
            Switch.adaptive(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }
}

class _PriceSheetBody extends StatefulWidget {
  final AppStrings strings;
  final List<(int?, int?)> presets;
  final int? min;
  final int? max;
  final void Function(int? min, int? max) onApply;

  const _PriceSheetBody({
    required this.strings,
    required this.presets,
    required this.min,
    required this.max,
    required this.onApply,
  });

  @override
  State<_PriceSheetBody> createState() => _PriceSheetBodyState();
}

class _PriceSheetBodyState extends State<_PriceSheetBody> {
  late final _minCtrl = TextEditingController(text: widget.min?.toString() ?? '');
  late final _maxCtrl = TextEditingController(text: widget.max?.toString() ?? '');

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  String _presetLabel((int?, int?) p) {
    final s = widget.strings;
    if (p.$1 == null) return s.lfPriceUnder(formatNumber(p.$2));
    if (p.$2 == null) return s.lfPriceOver(formatNumber(p.$1));
    return s.lfPriceBetween(formatNumber(p.$1), formatNumber(p.$2));
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.strings;
    final t = context.worldTheme;
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
      children: [
        _SheetOption(
          icon: Icons.all_inclusive_rounded,
          label: s.lfAnyPrice,
          selected: widget.min == null && widget.max == null,
          onTap: () => widget.onApply(null, null),
        ),
        for (final p in widget.presets)
          _SheetOption(
            icon: Icons.payments_outlined,
            label: _presetLabel(p),
            selected: widget.min == p.$1 && widget.max == p.$2,
            onTap: () => widget.onApply(p.$1, p.$2),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 16, 4, 10),
          child: Text(s.lfCustomPrice, style: AppText.label.copyWith(color: t.inkSoft)),
        ),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _minCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(hintText: s.minPrice),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _maxCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(hintText: s.maxPrice),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ElevatedButton(
          onPressed: () {
            var a = int.tryParse(_minCtrl.text);
            var b = int.tryParse(_maxCtrl.text);
            if (a != null && b != null && a > b) (a, b) = (b, a);
            widget.onApply(a, b);
          },
          child: Text(s.apply),
        ),
      ],
    );
  }
}
