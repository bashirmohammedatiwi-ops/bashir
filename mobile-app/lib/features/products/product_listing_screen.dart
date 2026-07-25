import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/cache/image_cache.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/category.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/category_tree.dart';
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

class _ProductListingScreenState extends ConsumerState<ProductListingScreen> {
  final _scroll = ScrollController();
  final List<Product> _items = [];
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;
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
    if (_paginationQueued || _loading || !_hasMore) return;
    if (_scroll.position.pixels < _scroll.position.maxScrollExtent - 480) return;
    _paginationQueued = true;
    _fetch().whenComplete(() => _paginationQueued = false);
  }

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

  Future<void> _fetch({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _items.clear();
      _firstLoad = true;
    }
    if (!_hasMore) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref.read(apiServiceProvider).getProducts(
            page: _page,
            limit: AppConfig.pageSize,
            categoryId: widget.categoryId,
            subcategoryId: widget.subcategoryId,
            tertiaryCategoryId: widget.tertiaryCategoryId,
            brandId: widget.brandId,
            search: widget.search,
            isNew: widget.isNew ? true : null,
            isBestSeller: widget.isBestSeller ? true : null,
            isPromo: widget.isPromo ? true : null,
            isFeatured: widget.isFeatured ? true : null,
            concernSlug: widget.concernSlug,
            sort: _sort == 'default' ? null : _sort,
            minPrice: _minPrice,
            maxPrice: _maxPrice,
            inStock: _inStock ? true : null,
            minRating: _minRating,
            forceRefresh: reset,
          );
      setState(() {
        _items.addAll(result.items);
        _hasMore = result.hasNext;
        _page++;
        _firstLoad = false;
      });
      if (mounted && result.items.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          precacheProductCovers(
            context,
            result.items.map((p) => p.coverUrl),
            limit: 20,
          );
        });
      }
    } catch (e) {
      setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final roots = ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
    final title = _resolveTitle(lang, s, roots);
    return Scaffold(
      backgroundColor: ListingTheme.canvas,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListingPageHeader(
            title: title,
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
    if (_error != null && _items.isEmpty) {
      return ErrorView(message: _error!, onRetry: () => _fetch(reset: true));
    }
    if (_items.isEmpty) {
      return EmptyState(
        icon: Icons.inventory_2_outlined,
        title: s.noProducts,
        subtitle: s.noProductsHint,
      );
    }

    final categoriesAsync = ref.watch(categoriesProvider);
    final roots = categoriesAsync.valueOrNull ?? const <Category>[];
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

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => _fetch(reset: true),
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
      'default': (s.sortLatest, Icons.schedule_rounded),
      'price_asc': (s.sortPriceAsc, Icons.arrow_downward_rounded),
      'price_desc': (s.sortPriceDesc, Icons.arrow_upward_rounded),
      'rating': (s.sortRating, Icons.star_rounded),
      'popular': (s.sortPopular, Icons.local_fire_department_rounded),
    };

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text(s.sortBy, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
                ),
              ),
              for (final entry in options.entries)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Material(
                    color: _sort == entry.key ? AppColors.primaryLight : ListingTheme.chipBg,
                    borderRadius: BorderRadius.circular(14),
                    child: ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      leading: Icon(
                        entry.value.$2,
                        color: _sort == entry.key ? AppColors.primary : AppColors.textMuted,
                      ),
                      title: Text(
                        entry.value.$1,
                        style: TextStyle(
                          fontWeight: _sort == entry.key ? FontWeight.w800 : FontWeight.w600,
                          color: _sort == entry.key ? AppColors.primaryDark : AppColors.textPrimary,
                        ),
                      ),
                      trailing: _sort == entry.key
                          ? const Icon(Icons.check_circle_rounded, color: AppColors.primary)
                          : null,
                      onTap: () {
                        Navigator.pop(context);
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
      ),
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
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(s.filterProducts, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
              const SizedBox(height: AppSpacing.lg),
              Text(s.priceRange, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: minCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: s.minPrice,
                      filled: true,
                      fillColor: ListingTheme.chipBg,
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
                      fillColor: ListingTheme.chipBg,
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
                activeThumbColor: AppColors.primary,
                value: inStock,
                title: Text(s.inStockOnly, style: const TextStyle(fontWeight: FontWeight.w600)),
                onChanged: (v) => setSheet(() => inStock = v),
              ),
              Text(s.minRating, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                children: [
                  for (final r in [0.0, 3.0, 4.0, 4.5])
                    ChoiceChip(
                      label: Text(r == 0 ? s.all : '$r★'),
                      selected: (minR ?? 0) == r,
                      selectedColor: AppColors.primaryLight,
                      labelStyle: TextStyle(
                        fontWeight: (minR ?? 0) == r ? FontWeight.w800 : FontWeight.w600,
                        color: (minR ?? 0) == r ? AppColors.primaryDark : AppColors.textSecondary,
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
        ),
      ),
    );
  }
}
