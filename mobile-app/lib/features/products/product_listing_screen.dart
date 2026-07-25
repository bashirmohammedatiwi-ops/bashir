import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
import 'listing_navigation.dart';
import 'widgets/category_children_strip.dart';
import 'widgets/listing_brands_strip.dart';
import 'widgets/listing_page_header.dart';

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

  static const _sortLabels = {
    'default': 'الأحدث',
    'price_asc': 'السعر ↑',
    'price_desc': 'السعر ↓',
    'rating': 'التقييم',
    'popular': 'الأكثر مبيعاً',
  };

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
    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F8),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListingPageHeader(
            title: widget.title,
            productCount: _firstLoad ? null : _items.length,
            hasMore: _hasMore,
            sortLabel: _sortLabels[_sort] ?? 'ترتيب',
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
    if (_firstLoad && _loading) return const ProductGridSkeleton(count: 8);
    if (_error != null && _items.isEmpty) {
      return ErrorView(message: _error!, onRetry: () => _fetch(reset: true));
    }
    if (_items.isEmpty) {
      return const EmptyState(icon: Icons.search_off_rounded, title: 'لا توجد منتجات مطابقة');
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
        ? (findCategoryById(roots, effectiveSubId)?.name ?? widget.title)
        : widget.title;

    final showBrandsStrip = effectiveSubId != null;
    final brandsAsync = showBrandsStrip
        ? ref.watch(subcategoryBrandsProvider(effectiveSubId))
        : null;

    Widget? listingHeader;
    if (showChildStrip || showBrandsStrip) {
      listingHeader = Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (showChildStrip) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
              child: Text(
                widget.subcategoryId != null ? 'القسم الثانوي' : 'القسم الفرعي',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
              ),
            ),
            CategoryChildrenStrip(
              children: childCategories,
              selectedChildId: activeChildId,
              onSelect: (child) => navigateListingChild(
                context: context,
                categoryId: widget.categoryId,
                subcategoryId: effectiveSubId ?? widget.subcategoryId,
                tertiaryCategoryId: widget.tertiaryCategoryId,
                child: child,
                parentTitle: stripParentTitle,
              ),
            ),
          ],
          if (showBrandsStrip && brandsAsync != null)
            brandsAsync.when(
              loading: () => const SizedBox(
                height: 90,
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ),
              error: (_, __) => const SizedBox.shrink(),
              data: (brands) => ListingBrandsStrip(
                brands: brands,
                selectedBrandId: widget.brandId,
                onSelect: (brandId) => navigateListingBrand(
                  context: context,
                  subcategoryId: effectiveSubId,
                  tertiaryCategoryId: widget.tertiaryCategoryId,
                  brandId: brandId,
                  title: widget.title,
                ),
              ),
            ),
        ],
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => _fetch(reset: true),
      child: ProductGrid(
        controller: _scroll,
        products: _items,
        showPromoBadge: widget.isPromo,
        showRating: true,
        listingStyle: true,
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 28),
        extraSlots: _hasMore ? 2 : 0,
        header: listingHeader,
      ),
    );
  }

  void _openSort() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (_) {
        const options = {
          'default': 'الأحدث',
          'price_asc': 'السعر: من الأقل',
          'price_desc': 'السعر: من الأعلى',
          'rating': 'الأعلى تقييماً',
          'popular': 'الأكثر مبيعاً',
        };
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Text('ترتيب حسب', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ),
              for (final entry in options.entries)
                ListTile(
                  leading: Icon(
                    _sort == entry.key ? Icons.radio_button_checked : Icons.radio_button_off,
                    color: _sort == entry.key ? AppColors.primary : AppColors.textMuted,
                  ),
                  title: Text(entry.value),
                  onTap: () {
                    Navigator.pop(context);
                    setState(() => _sort = entry.key);
                    _fetch(reset: true);
                  },
                ),
              const SizedBox(height: AppSpacing.sm),
            ],
          ),
        );
      },
    );
  }

  void _openFilter() {
    int? minP = _minPrice;
    int? maxP = _maxPrice;
    bool inStock = _inStock;
    double? minR = _minRating;
    final minCtrl = TextEditingController(text: minP?.toString() ?? '');
    final maxCtrl = TextEditingController(text: maxP?.toString() ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: AppSpacing.lg,
            right: AppSpacing.lg,
            top: AppSpacing.lg,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const Text('تصفية', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
              const SizedBox(height: AppSpacing.lg),
              const Text('نطاق السعر', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: minCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'الأدنى'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: TextField(
                    controller: maxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'الأعلى'),
                  ),
                ),
              ]),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeThumbColor: AppColors.primary,
                value: inStock,
                title: const Text('المتوفر فقط'),
                onChanged: (v) => setSheet(() => inStock = v),
              ),
              const Text('الحد الأدنى للتقييم', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                children: [
                  for (final r in [0.0, 3.0, 4.0, 4.5])
                    ChoiceChip(
                      label: Text(r == 0 ? 'الكل' : '$r★'),
                      selected: (minR ?? 0) == r,
                      selectedColor: AppColors.primaryLight,
                      onSelected: (_) => setSheet(() => minR = r == 0 ? null : r),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(children: [
                Expanded(
                  child: OutlinedButton(
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
                    child: const Text('إعادة تعيين'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: ElevatedButton(
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
                    child: const Text('تطبيق'),
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
