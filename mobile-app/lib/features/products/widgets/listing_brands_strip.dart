import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../data/models/brand.dart';

/// شريط براندات أفقي لتصفية منتجات القسم الفرعي.
class ListingBrandsStrip extends ConsumerWidget {
  final List<Brand> brands;
  final String? selectedBrandId;
  final bool embedded;
  final ValueChanged<String?> onSelect;

  const ListingBrandsStrip({
    super.key,
    required this.brands,
    required this.onSelect,
    this.selectedBrandId,
    this.embedded = false,
  });

  static const _logoSize = 50.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (brands.isEmpty) return const SizedBox.shrink();

    final lang = ref.watch(languageCodeProvider);
    final s = ref.watch(stringsProvider);

    final strip = SizedBox(
      height: _logoSize + 30,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.horizontalCacheExtent,
        padding: EdgeInsets.fromLTRB(embedded ? 12 : 14, 0, embedded ? 12 : 14, embedded ? 10 : 8),
        itemCount: brands.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          if (i == 0) {
            return _BrandChip(
              label: s.all,
              selected: selectedBrandId == null,
              icon: Icons.storefront_rounded,
              onTap: () {
                HapticFeedback.selectionClick();
                onSelect(null);
              },
            );
          }
          final brand = brands[i - 1];
          final name = brand.localizedName(lang);
          return _BrandChip(
            label: name,
            selected: selectedBrandId == brand.id,
            logoUrl: brand.logoUrl,
            initial: brand.initial ?? name.characters.first,
            onTap: () {
              HapticFeedback.selectionClick();
              onSelect(brand.id);
            },
          );
        },
      ),
    );

    if (embedded) return strip;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
          child: Text(
            s.brands,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary.withValues(alpha: 0.9),
            ),
          ),
        ),
        strip,
      ],
    );
  }
}

class _BrandChip extends StatelessWidget {
  final String label;
  final bool selected;
  final String? logoUrl;
  final String? initial;
  final IconData? icon;
  final VoidCallback onTap;

  const _BrandChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.logoUrl,
    this.initial,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 68,
        child: Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: ListingBrandsStrip._logoSize,
              height: ListingBrandsStrip._logoSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected
                    ? (icon != null ? AppColors.primary : AppColors.primaryLight)
                    : Colors.white,
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.hairline,
                  width: selected ? 2 : 1,
                ),
              ),
              child: ClipOval(
                child: icon != null
                    ? Icon(icon, color: selected ? Colors.white : AppColors.textMuted, size: 22)
                    : Padding(
                        padding: const EdgeInsets.all(6),
                        child: logoUrl != null && logoUrl!.isNotEmpty
                            ? AppNetworkImage(
                                url: logoUrl!,
                                fit: BoxFit.contain,
                                backgroundColor: Colors.white,
                              )
                            : ColoredBox(
                                color: AppColors.primarySoft,
                                child: Center(
                                  child: Text(
                                    initial ?? '•',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ),
                      ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                height: 1.1,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                color: selected ? AppColors.primaryDark : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
