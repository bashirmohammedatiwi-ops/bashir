import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';

/// اختصارات سريعة على الرئيسية.
class HomeQuickActions extends StatelessWidget {
  const HomeQuickActions({super.key});

  static const _items = [
    _QuickItem(Icons.local_offer_outlined, 'عروض', '/categories'),
    _QuickItem(Icons.favorite_border, 'المفضلة', '/wishlist'),
    _QuickItem(Icons.storefront_outlined, 'براندات', '/brands'),
    _QuickItem(Icons.fiber_new_outlined, 'جديد', '/products?sort=new'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.sm,
        AppSizes.xl,
        AppSizes.md,
      ),
      child: Row(
        children: _items.map((item) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: PressedScale(
                onTap: () => context.push(item.route),
                scale: 0.96,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                    border: Border.all(color: AppColors.dividerLight),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(item.icon, size: 22, color: AppColors.primary),
                      const SizedBox(height: 6),
                      Text(
                        item.label,
                        style: AppTextStyles.caption(size: 11).copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _QuickItem {
  const _QuickItem(this.icon, this.label, this.route);
  final IconData icon;
  final String label;
  final String route;
}
