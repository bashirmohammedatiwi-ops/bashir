import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// شريط ترتيب/تصفية موحّد لقوائم المنتجات.
class ListingToolbar extends StatelessWidget {
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final int count;
  final bool hasFilter;
  final String? sortLabel;

  const ListingToolbar({
    super.key,
    required this.onSort,
    required this.onFilter,
    required this.count,
    this.hasFilter = false,
    this.sortLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.xs, AppSpacing.md, AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (count > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm, right: 4),
              child: Text(
                '$count منتج',
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: _ToolChip(
                  icon: Icons.swap_vert_rounded,
                  label: sortLabel ?? 'ترتيب',
                  onTap: onSort,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _ToolChip(
                  icon: Icons.tune_rounded,
                  label: 'تصفية',
                  onTap: onFilter,
                  active: hasFilter,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ToolChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;

  const _ToolChip({
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.primaryLight : AppColors.scaffold,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: active ? AppColors.primary : AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: active ? AppColors.primary : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
