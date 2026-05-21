import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../home/providers/home_provider.dart';
import '../providers/filter_provider.dart';

class FilterBottomSheet extends ConsumerStatefulWidget {
  const FilterBottomSheet({super.key});

  @override
  ConsumerState<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends ConsumerState<FilterBottomSheet> {
  late RangeValues _priceRange;
  late double _rating;
  late bool _inStock;

  @override
  void initState() {
    super.initState();
    final f = ref.read(filterProvider);
    _priceRange = RangeValues(
      f.minPrice.toDouble(),
      f.maxPrice.toDouble(),
    );
    _rating = f.minRating;
    _inStock = f.inStockOnly;
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      maxChildSize: 0.9,
      minChildSize: 0.5,
      expand: false,
      builder: (_, controller) => Padding(
        padding: const EdgeInsets.all(24),
        child: ListView(
          controller: controller,
          children: [
            Text('تصفية', style: AppTextStyles.headline()),
            const SizedBox(height: 16),
            Text('السعر', style: AppTextStyles.title()),
            RangeSlider(
              values: _priceRange,
              min: 0,
              max: 500000,
              divisions: 50,
              labels: RangeLabels(
                CurrencyFormatter.format(_priceRange.start.round()),
                CurrencyFormatter.format(_priceRange.end.round()),
              ),
              onChanged: (v) => setState(() => _priceRange = v),
            ),
            Text('التقييم', style: AppTextStyles.title()),
            Slider(
              value: _rating,
              min: 0,
              max: 5,
              divisions: 5,
              label: _rating.toString(),
              onChanged: (v) => setState(() => _rating = v),
            ),
            SwitchListTile(
              title: const Text('متوفر فقط'),
              value: _inStock,
              onChanged: (v) => setState(() => _inStock = v),
            ),
            Text('البراند', style: AppTextStyles.title()),
            ref.watch(brandsProvider).when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: LinearProgressIndicator(),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (brands) => Wrap(
                    spacing: 8,
                    children: brands.take(10).map((brand) {
                      final brandId = brand.id;
                      final brandName = brand.name;
                      final selected = ref
                          .watch(filterProvider)
                          .selectedBrands
                          .contains(brandId);
                      return FilterChip(
                        label: Text(brandName),
                        selected: selected,
                        onSelected: (_) {
                          final current =
                              ref.read(filterProvider).selectedBrands;
                          final updated = selected
                              ? current.where((id) => id != brandId).toList()
                              : [...current, brandId];
                          ref.read(filterProvider.notifier).update(
                                ref
                                    .read(filterProvider)
                                    .copyWith(selectedBrands: updated),
                              );
                        },
                      );
                    }).toList(),
                  ),
                ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                ref.read(filterProvider.notifier).update(
                    ref.read(filterProvider).copyWith(
                          minPrice: _priceRange.start.round(),
                          maxPrice: _priceRange.end.round(),
                          minRating: _rating,
                          inStockOnly: _inStock,
                        ));
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('تطبيق', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
