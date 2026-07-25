import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// شريط ترتيب/تصفية — بسيط وأنيق.
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
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
      child: Row(
        children: [
          Expanded(
            child: _ToolChip(
              icon: Icons.sort_rounded,
              label: sortLabel ?? 'ترتيب',
              onTap: onSort,
            ),
          ),
          const SizedBox(width: 8),
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
      color: active ? AppColors.primaryLight : const Color(0xFFF5F2F3),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: active ? AppColors.primary : AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5,
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
