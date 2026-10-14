import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../../worlds/world_theme.dart';
import '../listing_navigation.dart';
import 'listing_theme.dart';

/// تنقل مدمج فوق شبكة المنتجات: صف أقسام (حبوب بصورة صغيرة) + صف براندات.
/// صفّان رفيعان بدل بطاقة كبيرة — المنتجات تظهر من أول نظرة.
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
    final lang = ref.watch(languageCodeProvider);
    final brands = brandsAsync?.valueOrNull ?? const <Brand>[];
    final showChildren = childCategories.isNotEmpty;
    final showBrands = brands.isNotEmpty;
    if (!showChildren && !showBrands) return const SizedBox(height: 6);

    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (showChildren)
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
                children: [
                  _CategoryPill(
                    label: s.all,
                    selected: activeChildId == null,
                    onTap: () => navigateListingChild(
                      context: context,
                      categoryId: categoryId,
                      subcategoryId: effectiveSubId ?? subcategoryId,
                      tertiaryCategoryId: tertiaryCategoryId,
                      child: null,
                      parentTitle: parentTitle,
                    ),
                  ),
                  for (final c in childCategories) ...[
                    const SizedBox(width: 8),
                    _CategoryPill(
                      label: c.localizedName(lang),
                      imageUrl: c.imageUrl,
                      selected: activeChildId == c.id,
                      onTap: () => navigateListingChild(
                        context: context,
                        categoryId: categoryId,
                        subcategoryId: effectiveSubId ?? subcategoryId,
                        tertiaryCategoryId: tertiaryCategoryId,
                        child: c,
                        parentTitle: parentTitle,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          if (showChildren && showBrands) const SizedBox(height: 10),
          if (showBrands)
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
                children: [
                  for (final b in brands.take(30)) ...[
                    _BrandPill(
                      brand: b,
                      name: b.localizedName(lang),
                      selected: selectedBrandId == b.id,
                      onTap: () => navigateListingBrand(
                        context: context,
                        categoryId: effectiveSubId == null ? categoryId : null,
                        subcategoryId: effectiveSubId,
                        tertiaryCategoryId: tertiaryCategoryId,
                        brandId: selectedBrandId == b.id ? null : b.id,
                        title: listingTitle,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryPill extends StatelessWidget {
  final String label;
  final String? imageUrl;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryPill({required this.label, required this.selected, required this.onTap, this.imageUrl});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (selected) return;
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsetsDirectional.fromSTEB(hasImage ? 4 : 16, 4, 14, 4),
        decoration: BoxDecoration(
          color: selected ? t.ink : t.surface,
          borderRadius: BorderRadius.circular(AppCorners.pill),
          border: Border.all(color: selected ? t.ink : t.hairline),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasImage) ...[
              ClipOval(
                child: SizedBox(
                  width: 30,
                  height: 30,
                  child: AppNetworkImage(url: imageUrl!, fit: BoxFit.cover, backgroundColor: t.accentLight),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: AppText.label.copyWith(
                color: selected ? t.surface : t.ink,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BrandPill extends StatelessWidget {
  final Brand brand;
  final String name;
  final bool selected;
  final VoidCallback onTap;

  const _BrandPill({required this.brand, required this.name, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsetsDirectional.fromSTEB(4, 4, 12, 4),
        decoration: BoxDecoration(
          color: selected ? t.accentSoft : t.surface,
          borderRadius: BorderRadius.circular(AppCorners.pill),
          border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 1.4 : 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 30,
              height: 30,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: t.divider),
              ),
              child: ClipOval(
                child: brand.logoUrl.isNotEmpty
                    ? AppNetworkImage(url: brand.logoUrl, fit: BoxFit.contain, backgroundColor: Colors.white)
                    : Center(
                        child: Text(
                          (brand.initial ?? name).characters.first.toUpperCase(),
                          style: AppText.micro.copyWith(color: t.accent),
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 7),
            Text(
              name,
              style: AppText.label.copyWith(
                color: selected ? t.accentDark : t.ink,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
            if (selected) ...[
              const SizedBox(width: 4),
              Icon(Icons.close_rounded, size: 16, color: t.accentDark),
            ],
          ],
        ),
      ),
    );
  }
}
