import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/shimmer_card.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/models/product_model.dart';
import '../../brands/widgets/brand_listing_banner.dart';
import '../providers/filter_provider.dart';
import '../widgets/filter_bottom_sheet.dart';
import '../widgets/sort_bottom_sheet.dart';

class ProductListingScreen extends ConsumerStatefulWidget {
  const ProductListingScreen({
    super.key,
    this.categoryId,
    this.subcategoryId,
    this.brandId,
    this.title,
  });

  final String? categoryId;
  final String? subcategoryId;
  final String? brandId;
  final String? title;

  @override
  ConsumerState<ProductListingScreen> createState() =>
      _ProductListingScreenState();
}

class _ProductListingScreenState extends ConsumerState<ProductListingScreen> {
  bool _isGrid = true;
  int _visibleCount = 20;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(filterProvider.notifier).update(FilterState(
        categoryId: widget.categoryId,
        subcategoryId: widget.subcategoryId,
        brandId: widget.brandId,
      ));
    });
  }

  Future<void> _load() async {
    ref.invalidate(filteredProductsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(filteredProductsProvider);
    final brandsAsync = ref.watch(brandsProvider);

    return productsAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: Text(widget.title ?? 'المنتجات')),
        body: const ShimmerProductGrid(),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: Text(widget.title ?? 'المنتجات')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'تعذر تحميل المنتجات',
                style: AppTextStyles.body(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      ),
      data: (products) {
        final visible = products.take(_visibleCount).toList();
        BrandModel? brand;
        if (widget.brandId != null) {
          brand = brandsAsync.valueOrNull
              ?.where((b) => b.id == widget.brandId)
              .firstOrNull;
        }
        return _buildProductList(context, products, visible, brand);
      },
    );
  }

  Widget _buildProductList(
    BuildContext context,
    List<ProductModel> products,
    List<ProductModel> visible,
    BrandModel? brand,
  ) {
    final showcaseLayout = brand != null
        ? ProductShowcaseLayout.brandSpotlight
        : ProductShowcaseLayout.gridCard;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? 'المنتجات'),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      child: _HeaderPanel(
                        title: widget.title ?? 'كل المنتجات',
                        count: products.length,
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 2, 16, 10),
                      child: _ControlsRow(
                        isGrid: _isGrid,
                        onToggleLayout: () => setState(() => _isGrid = !_isGrid),
                        onSort: () => showModalBottomSheet(
                          context: context,
                          builder: (_) => const SortBottomSheet(),
                        ),
                        onFilter: () => showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => const FilterBottomSheet(),
                        ),
                      ),
                    ),
                  ),
                  if (brand != null && visible.isNotEmpty)
                    SliverToBoxAdapter(
                      child: BrandListingBanner(
                        brand: brand,
                        featuredProduct: visible.first,
                        productCount: products.length,
                      ),
                    ),
                  if (products.isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyProductsState(),
                    )
                  else if (_isGrid)
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.68,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 6,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            if (index == visible.length - 1 &&
                                _visibleCount < products.length) {
                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                if (mounted) {
                                  setState(() => _visibleCount += 20);
                                }
                              });
                            }
                            return ProductCard(
                              product: visible[index],
                              index: index,
                              showcaseLayout: showcaseLayout,
                            );
                          },
                          childCount: visible.length,
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: ProductCard(
                              product: visible[index],
                              index: index,
                              showcaseLayout: showcaseLayout,
                            ),
                          ),
                          childCount: visible.length,
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

class _HeaderPanel extends StatelessWidget {
  const _HeaderPanel({
    required this.title,
    required this.count,
  });

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.title(size: 16).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$count منتج متاح',
                  style: AppTextStyles.caption(
                    color: AppColors.textMuted,
                    size: 11,
                  ).copyWith(letterSpacing: 0.2),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.tune_rounded,
                  size: 14,
                  color: AppColors.primaryDark,
                ),
                const SizedBox(width: 4),
                Text(
                  'نتائج ذكية',
                  style: AppTextStyles.caption(
                    color: AppColors.primaryDark,
                    size: 10.5,
                  ).copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ControlsRow extends StatelessWidget {
  const _ControlsRow({
    required this.isGrid,
    required this.onToggleLayout,
    required this.onSort,
    required this.onFilter,
  });

  final bool isGrid;
  final VoidCallback onToggleLayout;
  final VoidCallback onSort;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ControlChip(
            icon: Icons.filter_list_rounded,
            label: 'فلترة',
            onTap: onFilter,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _ControlChip(
            icon: Icons.swap_vert_rounded,
            label: 'ترتيب',
            onTap: onSort,
          ),
        ),
        const SizedBox(width: 8),
        _ControlChip(
          icon: isGrid ? Icons.view_list_rounded : Icons.grid_view_rounded,
          label: '',
          compact: true,
          onTap: onToggleLayout,
        ),
      ],
    );
  }
}

class _ControlChip extends StatelessWidget {
  const _ControlChip({
    required this.icon,
    required this.label,
    required this.onTap,
    this.compact = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 40,
          padding: EdgeInsets.symmetric(horizontal: compact ? 10 : 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: AppColors.textPrimary),
              if (!compact) ...[
                const SizedBox(width: 6),
                Text(
                  label,
                  style: AppTextStyles.caption(
                    color: AppColors.textPrimary,
                    size: 12,
                  ).copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyProductsState extends StatelessWidget {
  const _EmptyProductsState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 66,
              height: 66,
              decoration: BoxDecoration(
                color: AppColors.canvas,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: const Icon(
                Icons.inventory_2_outlined,
                size: 30,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'لا توجد منتجات مطابقة',
              style: AppTextStyles.title(size: 15).copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'جرّبي تعديل الفلاتر أو اختيار تصنيف آخر',
              style: AppTextStyles.caption(
                color: AppColors.textMuted,
                size: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
