import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/cache/image_cache.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
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
  double? _minRating;

  @override
  void initState() {
    super.initState();
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
  }

  Future<void> _fetchStandardListing() async {
    final result = await _queryProducts(page: _page);
    if (!mounted) return;
    setState(() {
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
          isPromo: widget.isPromo ? true : null,
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
            sortLabel: s.sortShortFor(_sort),
            filterLabel: s.filter,
            onSort: _openSort,
            onFilter: _openFilter,
            hasFilter: _minPrice != null || _maxPrice != null || _inStock || _minRating != null,
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

    final showBrandsStrip = effectiveSubId != null;
    final brandsAsync = showBrandsStrip
        ? ref.watch(subcategoryBrandsProvider(effectiveSubId))
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
          otherCategories: _otherBrandItems,
          inCategoryLabel: s.brandInThisSection(categoryName, _inCategoryItems.length),
          otherLabel: s.brandInOtherSections(brandName, _otherBrandItems.length),
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
        padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 10, ListingTheme.padH, 32),
        extraSlots: _hasMore ? 2 : 0,
        header: listingHeader,
      ),
    );
  }

  void _openSort() {
    final s = ref.read(stringsProvider);
    final options = {
      'default': (s.sortByBrand, Icons.layers_rounded),
      'latest': (s.sortLatest, Icons.schedule_rounded),
      'price_asc': (s.sortPriceAsc, Icons.arrow_upward_rounded),
      'price_desc': (s.sortPriceDesc, Icons.arrow_downward_rounded),
      'rating': (s.sortRating, Icons.star_rounded),
      'popular': (s.sortPopular, Icons.local_fire_department_rounded),
    };

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        final t = sheetCtx.worldTheme;
        return Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.divider,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(s.sortBy, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: t.ink)),
                ),
              ),
              for (final entry in options.entries)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Material(
                    color: _sort == entry.key ? t.accentLight : t.surface,
                    borderRadius: BorderRadius.circular(14),
                    child: ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: _sort == entry.key ? t.accentSoft : t.hairline.withValues(alpha: 0.85),
                        ),
                      ),
                      leading: Icon(
                        entry.value.$2,
                        color: _sort == entry.key ? t.accent : t.inkMuted,
                      ),
                      title: Text(
                        entry.value.$1,
                        style: TextStyle(
                          fontWeight: _sort == entry.key ? FontWeight.w800 : FontWeight.w600,
                          color: _sort == entry.key ? t.accentDark : t.ink,
                        ),
                      ),
                      trailing: _sort == entry.key
                          ? Icon(Icons.check_circle_rounded, color: t.accent)
                          : null,
                      onTap: () {
                        Navigator.pop(sheetCtx);
                        setState(() => _sort = entry.key);
                        _fetch(reset: true);
                      },
                    ),
                  ),
                ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      );
      },
    );
  }

  void _openFilter() {
    final s = ref.read(stringsProvider);
    int? minP = _minPrice;
    int? maxP = _maxPrice;
    bool inStock = _inStock;
    double? minR = _minRating;
    final minCtrl = TextEditingController(text: minP?.toString() ?? '');
    final maxCtrl = TextEditingController(text: maxP?.toString() ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => StatefulBuilder(
        builder: (ctx, setSheet) {
          final t = ctx.worldTheme;
          return Container(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: t.divider,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(s.filterProducts, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: t.ink)),
              const SizedBox(height: AppSpacing.lg),
              Text(s.priceRange, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: t.ink)),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: minCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: s.minPrice,
                      filled: true,
                      fillColor: ListingTheme.chipBg(ctx),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: TextField(
                    controller: maxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: s.maxPrice,
                      filled: true,
                      fillColor: ListingTheme.chipBg(ctx),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeThumbColor: t.accent,
                value: inStock,
                title: Text(s.inStockOnly, style: TextStyle(fontWeight: FontWeight.w600, color: t.ink)),
                onChanged: (v) => setSheet(() => inStock = v),
              ),
              Text(s.minRating, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: t.ink)),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                children: [
                  for (final r in [0.0, 3.0, 4.0, 4.5])
                    ChoiceChip(
                      label: Text(r == 0 ? s.all : '$r★'),
                      selected: (minR ?? 0) == r,
                      showCheckmark: false,
                      backgroundColor: t.canvasWarm,
                      selectedColor: t.accentLight,
                      side: BorderSide(
                        color: (minR ?? 0) == r ? t.accentSoft : t.hairline,
                      ),
                      labelStyle: TextStyle(
                        fontWeight: (minR ?? 0) == r ? FontWeight.w800 : FontWeight.w600,
                        color: (minR ?? 0) == r ? t.accentDark : t.inkSoft,
                      ),
                      onSelected: (_) => setSheet(() => minR = r == 0 ? null : r),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {
                        _minPrice = null;
                        _maxPrice = null;
                        _inStock = false;
                        _minRating = null;
                      });
                      _fetch(reset: true);
                    },
                    child: Text(s.reset),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {
                        _minPrice = int.tryParse(minCtrl.text);
                        _maxPrice = int.tryParse(maxCtrl.text);
                        _inStock = inStock;
                        _minRating = minR;
                      });
                      _fetch(reset: true);
                    },
                    child: Text(s.apply),
                  ),
                ),
              ]),
            ],
          ),
        );
        },
      ),
    );
  }
}
