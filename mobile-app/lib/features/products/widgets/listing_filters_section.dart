import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../listing_navigation.dart';
import 'category_children_strip.dart';
import 'listing_brands_strip.dart';
import 'listing_theme.dart';

/// لوحة فلاتر موحّدة — أقسام فرعية/ثانوية + براندات.
class ListingFiltersSection extends ConsumerWidget {
  final List<Category> childCategories;
  final String? activeChildId;
  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;
  final String parentTitle;
  final bool showTertiaryLabel;
  final String? effectiveSubId;
  final AsyncValue<List<Brand>>? brandsAsync;
  final String? selectedBrandId;
  final String listingTitle;

  const ListingFiltersSection({
    super.key,
    required this.childCategories,
    required this.activeChildId,
    required this.categoryId,
    required this.subcategoryId,
    required this.tertiaryCategoryId,
    required this.parentTitle,
    required this.showTertiaryLabel,
    required this.effectiveSubId,
    required this.brandsAsync,
    required this.selectedBrandId,
    required this.listingTitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final showChildren = childCategories.isNotEmpty;
    final showBrands = effectiveSubId != null && brandsAsync != null;
    if (!showChildren && !showBrands) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 12, ListingTheme.padH, 4),
      child: DecoratedBox(
        decoration: ListingTheme.cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (showChildren) ...[
              _SectionHeader(
                title: showTertiaryLabel ? s.tertiaryCategory : s.subcategory,
                hint: s.selectToFilter,
              ),
              CategoryChildrenStrip(
                embedded: true,
                allLabel: s.all,
                children: childCategories,
                selectedChildId: activeChildId,
                onSelect: (child) => navigateListingChild(
                  context: context,
                  categoryId: categoryId,
                  subcategoryId: effectiveSubId ?? subcategoryId,
                  tertiaryCategoryId: tertiaryCategoryId,
                  child: child,
                  parentTitle: parentTitle,
                ),
              ),
              if (showBrands)
                Divider(height: 1, color: AppColors.hairline.withValues(alpha: 0.7)),
            ],
            if (showBrands)
              brandsAsync!.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 28),
                  child: Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                error: (_, __) => const SizedBox.shrink(),
                data: (brands) {
                  if (brands.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _SectionHeader(title: s.brands),
                      ListingBrandsStrip(
                        embedded: true,
                        brands: brands,
                        selectedBrandId: selectedBrandId,
                        onSelect: (brandId) => navigateListingBrand(
                          context: context,
                          subcategoryId: effectiveSubId,
                          tertiaryCategoryId: tertiaryCategoryId,
                          brandId: brandId,
                          title: listingTitle,
                        ),
                      ),
                    ],
                  );
                },
              ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? hint;

  const _SectionHeader({required this.title, this.hint});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 2),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 14,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(title, style: ListingTheme.sectionTitle)),
          if (hint != null) Text(hint!, style: ListingTheme.sectionHint),
        ],
      ),
    );
  }
}
