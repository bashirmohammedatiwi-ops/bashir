import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/product.dart';
import 'product_detail_theme.dart';

/// اختيار التدرج — بطاقات أفقية أنيقة بألوان اللوغو.
class ProductShadePicker extends StatelessWidget {
  final List<ProductShade> shades;
  final ProductShade? selected;
  final ValueChanged<ProductShade> onSelect;
  final AppStrings strings;

  const ProductShadePicker({
    super.key,
    required this.shades,
    required this.selected,
    required this.onSelect,
    required this.strings,
  });

  Color _hex(String hex) {
    final h = hex.replaceAll('#', '');
    final v = h.length == 6 ? 'FF$h' : h;
    return Color(int.tryParse(v, radix: 16) ?? 0xFFCCCCCC);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 18,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              strings.selectShade,
              style: ProductDetailTheme.sectionTitleStyle,
            ),
            const Spacer(),
            if (selected != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  selected!.name,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: shades.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final shade = shades[i];
              final active = selected?.id == shade.id;
              return _ShadeTile(
                shade: shade,
                active: active,
                hex: _hex,
                onTap: shade.inStock
                    ? () {
                        HapticFeedback.selectionClick();
                        onSelect(shade);
                      }
                    : null,
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ShadeTile extends StatelessWidget {
  final ProductShade shade;
  final bool active;
  final Color Function(String) hex;
  final VoidCallback? onTap;

  const _ShadeTile({
    required this.shade,
    required this.active,
    required this.hex,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final start = hex(shade.colorHex);
    final end = hex(shade.colorHexEnd ?? shade.colorHex);
    final hasGradient = shade.colorHexEnd != null &&
        shade.colorHexEnd!.trim().isNotEmpty &&
        shade.colorHexEnd!.toLowerCase() != shade.colorHex.toLowerCase();

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        width: 76,
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 6),
        decoration: BoxDecoration(
          color: active ? AppColors.primaryLight : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: active ? AppColors.primary : AppColors.hairline,
            width: active ? 2 : 1,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Opacity(
          opacity: shade.inStock ? 1 : 0.45,
          child: Column(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: hasGradient ? null : start,
                  gradient: hasGradient
                      ? LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [start, end],
                        )
                      : null,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.ink.withValues(alpha: 0.08),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: active
                    ? const Icon(Icons.check_rounded, color: Colors.white, size: 20)
                    : null,
              ),
              const SizedBox(height: 6),
              Text(
                shade.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  height: 1.15,
                  color: active ? AppColors.primaryDark : AppColors.textSecondary,
                  decoration: shade.inStock ? null : TextDecoration.lineThrough,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
