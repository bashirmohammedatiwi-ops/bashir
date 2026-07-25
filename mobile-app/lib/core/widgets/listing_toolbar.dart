import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// شريط ترتيب/تصفية — بسيط وأنيق بدون عداد منتجات.
class ListingToolbar extends StatelessWidget {
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final bool hasFilter;
  final String? sortLabel;

  const ListingToolbar({
    super.key,
    required this.onSort,
    required this.onFilter,
    this.hasFilter = false,
    this.sortLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 12),
      child: Row(
        children: [
          Expanded(
            child: _ToolPill(
              icon: Icons.swap_vert_rounded,
              label: sortLabel ?? 'ترتيب',
              onTap: onSort,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _ToolPill(
              icon: Icons.tune_rounded,
              label: 'تصفية',
              onTap: onFilter,
              active: hasFilter,
            ),
          ),
        ],
      ),
    );
  }
}

class _ToolPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;

  const _ToolPill({
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.primaryLight : AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.pill),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            border: Border.all(
              color: active ? AppColors.primarySoft : AppColors.hairline,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 17,
                color: active ? AppColors.primary : AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: active ? AppColors.primaryDark : AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
