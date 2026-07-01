import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';

class ProductListingScreen extends ConsumerStatefulWidget {
  final String title;
  final String? categoryId;
  final String? brandId;
  final String? search;
  final bool isNew;
  final bool isBestSeller;
  final bool isPromo;

  const ProductListingScreen({
    super.key,
    required this.title,
    this.categoryId,
    this.brandId,
    this.search,
    this.isNew = false,
    this.isBestSeller = false,
    this.isPromo = false,
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
    _scroll.addListener(() {
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 400) {
        _fetch();
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
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
            brandId: widget.brandId,
            search: widget.search,
            isNew: widget.isNew ? true : null,
            isBestSeller: widget.isBestSeller ? true : null,
            isPromo: widget.isPromo ? true : null,
            sort: _sort == 'default' ? null : _sort,
            minPrice: _minPrice,
            maxPrice: _maxPrice,
            inStock: _inStock ? true : null,
            minRating: _minRating,
          );
      setState(() {
        _items.addAll(result.items);
        _hasMore = result.hasNext;
        _page++;
        _firstLoad = false;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: Column(
        children: [
          _Toolbar(
            sort: _sort,
            onSort: _openSort,
            onFilter: _openFilter,
            count: _items.length,
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
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => _fetch(reset: true),
      child: GridView.builder(
        controller: _scroll,
        padding: const EdgeInsets.all(12),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.6,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _items.length + (_hasMore ? 2 : 0),
        itemBuilder: (_, i) {
          if (i >= _items.length) {
            return const ShimmerBox(height: double.infinity, radius: 16);
          }
          return ProductCard(product: _items[i]);
        },
      ),
    );
  }

  void _openSort() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
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
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('ترتيب حسب', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ),
              for (final entry in options.entries)
                RadioListTile<String>(
                  value: entry.key,
                  groupValue: _sort,
                  activeColor: AppColors.primary,
                  title: Text(entry.value),
                  onChanged: (v) {
                    Navigator.pop(context);
                    setState(() => _sort = v!);
                    _fetch(reset: true);
                  },
                ),
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
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('تصفية', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
              const SizedBox(height: 16),
              const Text('نطاق السعر', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: minCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'الأدنى'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: maxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'الأعلى'),
                  ),
                ),
              ]),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeThumbColor: AppColors.primary,
                value: inStock,
                title: const Text('المتوفر فقط'),
                onChanged: (v) => setSheet(() => inStock = v),
              ),
              const Text('الحد الأدنى للتقييم', style: TextStyle(fontWeight: FontWeight.w600)),
              Wrap(
                spacing: 8,
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
              const SizedBox(height: 18),
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
                const SizedBox(width: 12),
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

class _Toolbar extends StatelessWidget {
  final String sort;
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final int count;
  final bool hasFilter;
  const _Toolbar({
    required this.sort,
    required this.onSort,
    required this.onFilter,
    required this.count,
    required this.hasFilter,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: TextButton.icon(
              onPressed: onSort,
              icon: const Icon(Icons.swap_vert_rounded, size: 20),
              label: const Text('ترتيب'),
              style: TextButton.styleFrom(foregroundColor: AppColors.textPrimary),
            ),
          ),
          Container(width: 1, height: 24, color: AppColors.border),
          Expanded(
            child: TextButton.icon(
              onPressed: onFilter,
              icon: Icon(Icons.tune_rounded,
                  size: 20, color: hasFilter ? AppColors.primary : AppColors.textPrimary),
              label: Text('تصفية',
                  style: TextStyle(color: hasFilter ? AppColors.primary : AppColors.textPrimary)),
            ),
          ),
        ],
      ),
    );
  }
}
