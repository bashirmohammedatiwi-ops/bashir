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
import '../../core/cache/image_cache.dart';
import '../../core/widgets/product_grid.dart';
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
  });

  @override
  ConsumerState<ProductListingScreen> createState() => _ProductListingScreenState();
}

enum _BrandListingPhase { inCategory, otherBrand, done }

class _ProductListingScreenState extends ConsumerState<ProductListingScreen> {
  final _scroll = ScrollController();
  final List<Product> _items = [];
  final List<Product> _inCategoryItems = [];
  final List<Product> _otherBrandItems = [];
  int _page = 1;
  int _inCategoryPage = 1;
  int _otherBrandPage = 1;
  bool _loading = false;
  bool _hasMore = true;
  bool _inCategoryHasMore = true;
  bool _otherBrandHasMore = true;
  _BrandListingPhase _brandPhase = _BrandListingPhase.inCategory;
  bool _firstLoad = true;
  bool _paginationQueued = false;
  String? _error;

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
    _fetch();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_paginationQueued || _loading || !_effectiveHasMore) return;
    if (_scroll.position.pixels < _scroll.position.maxScrollExtent - 480) return;
    _paginationQueued = true;
    _fetch().whenComplete(() => _paginationQueued = false);
  }

  bool get _splitBrandByCategory =>
      widget.brandId != null &&
      (widget.categoryId != null ||
          widget.subcategoryId != null ||
          widget.tertiaryCategoryId != null);

  bool get _effectiveHasMore =>
      _splitBrandByCategory ? (_inCategoryHasMore || _otherBrandHasMore) : _hasMore;

  List<Product> get _visibleItems =>
      _splitBrandByCategory ? [..._inCategoryItems, ..._otherBrandItems] : _items;

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ProductListingScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.categoryId != widget.categoryId ||
        oldWidget.subcategoryId != widget.subcategoryId ||
        oldWidget.tertiaryCategoryId != widget.tertiaryCategoryId ||
        oldWidget.brandId != widget.brandId ||
        oldWidget.search != widget.search) {
      _fetch(reset: true);
    }
  }

  String _resolveTitle(String lang, AppStrings s, List<Category> roots) {
    final categoryId =
        widget.tertiaryCategoryId ?? widget.subcategoryId ?? widget.categoryId;
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

  Future<bool> _tryOpenBarcodeProduct(String code) async {
    if (!isBarcodeSearchQuery(code)) return false;
    try {
      final hit = await ref.read(apiServiceProvider).lookupProductByBarcode(code);
      if (!mounted || hit == null) return false;
      context.push('/product/${hit.productSlug}');
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _fetch({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _resetListingState();
    }
    if (!_effectiveHasMore && !reset) return;

    final search = widget.search?.trim();
    if (_firstLoad && search != null && search.isNotEmpty) {
      final opened = await _tryOpenBarcodeProduct(search);
      if (opened || !mounted) return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (_splitBrandByCategory) {
        await _fetchSplitBrandListing();
      } else {
        await _fetchStandardListing();
      }
    } catch (e) {
      setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _resetListingState() {
    _page = 1;
    _inCategoryPage = 1;
    _otherBrandPage = 1;
    _hasMore = true;
    _inCategoryHasMore = true;
    _otherBrandHasMore = true;
    _brandPhase = _BrandListingPhase.inCategory;
    _items.clear();
    _inCategoryItems.clear();
    _otherBrandItems.clear();
    _firstLoad = true;
    _total = null;
  }

  Future<void> _fetchStandardListing() async {
    final result = await _queryProducts(
      page: _page,
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    if (!mounted) return;
    setState(() {
      if (_page == 1) _total = result.total;
      _items.addAll(result.items);
      _hasMore = result.hasNext;
      _page++;
      _firstLoad = false;
    });
    _precacheLatest(result.items);
  }

  Future<void> _fetchSplitBrandListing() async {
    while (mounted) {
      if (_brandPhase == _BrandListingPhase.inCategory && _inCategoryHasMore) {
        final result = await _queryProducts(
          page: _inCategoryPage,
          categoryId: widget.categoryId,
          subcategoryId: widget.subcategoryId,
          tertiaryCategoryId: widget.tertiaryCategoryId,
        );
        if (!mounted) return;
        setState(() {
          if (_inCategoryPage == 1) _total = result.total;
          _inCategoryItems.addAll(result.items);
          _inCategoryHasMore = result.hasNext;
          _inCategoryPage++;
          _firstLoad = false;
          if (!_inCategoryHasMore) {
            _brandPhase = _BrandListingPhase.otherBrand;
          }
        });
        _precacheLatest(result.items);
        if (_inCategoryHasMore) return;
        continue;
      }

      if (_brandPhase == _BrandListingPhase.otherBrand && _otherBrandHasMore) {
        final result = await _queryProducts(page: _otherBrandPage);
        if (!mounted) return;
        final seen = {
          for (final p in _inCategoryItems) p.id,
          for (final p in _otherBrandItems) p.id,
        };
        final batch = result.items.where((p) => !seen.contains(p.id)).toList();
        setState(() {
          _otherBrandItems.addAll(batch);
          _otherBrandHasMore = result.hasNext;
          _otherBrandPage++;
          _firstLoad = false;
          if (!_otherBrandHasMore) _brandPhase = _BrandListingPhase.done;
        });
        _precacheLatest(batch);
        return;
      }

      setState(() => _brandPhase = _BrandListingPhase.done);
      return;
    }
  }

  Future<Paginated<Product>> _queryProducts({
    required int page,
    String? categoryId,
    String? subcategoryId,
    String? tertiaryCategoryId,
  }) {
    return ref.read(apiServiceProvider).getProducts(
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
          forceRefresh: page == 1,
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

  /// يجمع منتجات البراند خارج القسم الحالي في مجموعات حسب القسم الرئيسي،
  /// بترتيب الأقسام كما في شجرة الأقسام (لوحة التحكم).
  List<BrandCategoryGroup> _buildOtherGroups(String lang, List<Category> roots) {
    final s = ref.read(stringsProvider);
    final groups = <String, List<Product>>{};
    final order = <String>[];

    // القسم الحالي (بأي مستوى) يُستثنى من المجموعات.
    final currentScopeId =
        widget.tertiaryCategoryId ?? widget.subcategoryId ?? widget.categoryId;
    String? currentRootId;
    if (currentScopeId != null) {
      currentRootId = findRootCategory(roots, currentScopeId)?.id;
    }

    for (final p in _otherBrandItems) {
      final cat = p.category;
      if (cat == null) continue;
      final root = findRootCategory(roots, cat.id);
      final rootId = root?.id ?? cat.id;
      if (rootId == currentRootId) continue;

      if (!groups.containsKey(rootId)) {
        groups[rootId] = [];
        order.add(rootId);
        _groupLabelCache[rootId] =
            root?.localizedName(lang) ?? cat.localizedName(lang);
      }
      groups[rootId]!.add(p);
    }

    return [
      for (final rootId in order)
        BrandCategoryGroup(
          categoryId: rootId,
          label:
              '${_groupLabelCache[rootId] ?? ''} · ${s.brandGroupCount(groups[rootId]!.length)}',
          products: groups[rootId]!,
        ),
    ];
  }

  final Map<String, String> _groupLabelCache = {};

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
            onToggleInStock: () {
              setState(() => _inStock = !_inStock);
              _fetch(reset: true);
            },
            onToggleSale: () {
              setState(() => _onSale = !_onSale);
              _fetch(reset: true);
            },
            onClearAll: _clearFilters,
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    if (_firstLoad && _loading) return const ProductGridSkeleton(count: 8);
    if (_error != null && _visibleItems.isEmpty) {
      return ErrorView(message: _error!, onRetry: () => _fetch(reset: true));
    }
    if (_visibleItems.isEmpty) {
      return EmptyState(
        icon: Icons.inventory_2_outlined,
        title: s.noProducts,
        subtitle: s.noProductsHint,
      );
    }

    final categoriesAsync = ref.watch(categoriesProvider);
    final roots = categoriesAsync.valueOrNull ?? const <Category>[];
    final title = _resolveTitle(lang, s, roots);
    final childCategories = listingChildCategories(
      roots,
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    final effectiveSubId = listingSubcategoryId(
      roots,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );
    final showChildStrip = (widget.categoryId != null ||
            widget.subcategoryId != null ||
            widget.tertiaryCategoryId != null) &&
        childCategories.isNotEmpty;
    final activeChildId = listingActiveChildId(
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      tertiaryCategoryId: widget.tertiaryCategoryId,
    );

    final stripParentTitle = effectiveSubId != null
        ? (findCategoryById(roots, effectiveSubId)?.localizedName(lang) ?? _resolveTitle(lang, s, roots))
        : _resolveTitle(lang, s, roots);

    final showBrandsStrip = effectiveSubId != null || widget.categoryId != null;
    final brandsAsync = effectiveSubId != null
        ? ref.watch(subcategoryBrandsProvider(effectiveSubId))
        : widget.categoryId != null
            ? ref.watch(categoryBrandsProvider(widget.categoryId!))
            : null;

    final filtersSection = (showChildStrip || showBrandsStrip)
        ? ListingFiltersSection(
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
            listingTitle: _resolveTitle(lang, s, roots),
          )
        : null;

    final listingHeader = filtersSection;

    if (_splitBrandByCategory) {
      final brandName = _resolveBrandName(lang) ?? widget.title;
      final categoryName = _resolveCategoryScopeName(lang, roots) ?? title;
      final otherGroups = _buildOtherGroups(lang, roots);
      final otherCount = otherGroups.fold<int>(0, (sum, g) => sum + g.products.length);
      return RefreshIndicator(
        color: context.worldTheme.accent,
        onRefresh: () async {
          await refreshStorefrontCatalog(ref);
          await _fetch(reset: true);
        },
        child: ListingBrandSplitGrid(
          controller: _scroll,
          header: listingHeader,
          inCategory: _inCategoryItems,
          otherGroups: otherGroups,
          inCategoryLabel: s.brandInThisSection(categoryName, _inCategoryItems.length),
          otherLabel: s.brandInOtherSections(brandName, otherCount),
          dividerLabel: s.brandSplitDivider(brandName),
          showPromoBadge: widget.isPromo,
          showRating: true,
          extraSlots: _effectiveHasMore ? 2 : 0,
        ),
      );
    }

    return RefreshIndicator(
      color: context.worldTheme.accent,
      onRefresh: () async {
        await refreshStorefrontCatalog(ref);
        await _fetch(reset: true);
      },
      child: ProductGrid(
        controller: _scroll,
        products: _items,
        showPromoBadge: widget.isPromo,
        showRating: true,
        listingStyle: true,
        padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 12, ListingTheme.padH, 32),
        extraSlots: _hasMore ? 2 : 0,
        header: listingHeader,
      ),
    );
  }

  static const _pricePresets = <(int?, int?)>[
    (null, 10000),
    (10000, 25000),
    (25000, 50000),
    (50000, null),
  ];

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
  void _openFilter() {
    final s = ref.read(stringsProvider);
    var minP = _minPrice;
    var maxP = _maxPrice;
    var inStock = _inStock;
    var onSale = _onSale;
    var minR = _minRating;

    showAppSheet(
      context: context,
      title: s.filterProducts,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) {
          final t = ctx.worldTheme;
          Widget label(String text) => Padding(
                padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
                child: Text(text, style: AppText.title3.copyWith(color: t.ink)),
              );
          return ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            children: [
              label(s.priceRange),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  AppChoiceChip(
                    label: s.lfAnyPrice,
                    selected: minP == null && maxP == null,
                    onTap: () => setSheet(() {
                      minP = null;
                      maxP = null;
                    }),
                  ),
                  for (final p in _pricePresets)
                    AppChoiceChip(
                      label: p.$1 == null
                          ? s.lfPriceUnder(formatNumber(p.$2))
                          : p.$2 == null
                              ? s.lfPriceOver(formatNumber(p.$1))
                              : s.lfPriceBetween(formatNumber(p.$1), formatNumber(p.$2)),
                      selected: minP == p.$1 && maxP == p.$2,
                      onTap: () => setSheet(() {
                        minP = p.$1;
                        maxP = p.$2;
                      }),
                    ),
                ],
              ),
              label(s.minRating),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final r in const <double?>[null, 3, 4, 4.5])
                    AppChoiceChip(
                      label: r == null ? s.all : s.lfRatingAtLeast(_fmtRating(r)),
                      icon: r == null ? null : Icons.star_rounded,
                      selected: minR == r,
                      onTap: () => setSheet(() => minR = r),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              _SwitchRow(
                label: s.inStockOnly,
                icon: Icons.inventory_2_outlined,
                value: inStock,
                onChanged: (v) => setSheet(() => inStock = v),
              ),
              if (!widget.isPromo)
                _SwitchRow(
                  label: s.lfOffersOnly,
                  icon: Icons.local_offer_outlined,
                  value: onSale,
                  onChanged: (v) => setSheet(() => onSale = v),
                ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setSheet(() {
                        minP = null;
                        maxP = null;
                        inStock = false;
                        onSale = false;
                        minR = null;
                      }),
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
                          _minPrice = minP;
                          _maxPrice = maxP;
                          _inStock = inStock;
                          _onSale = onSale;
                          _minRating = minR;
                        });
                      },
                      child: Text(s.lfShowResults),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
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
            Expanded(child: Text(label, style: AppText.body.copyWith(color: t.ink, height: 1.2))),
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
