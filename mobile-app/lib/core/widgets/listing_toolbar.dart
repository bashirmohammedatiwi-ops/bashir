import 'package:flutter/material.dart';

import '../../features/worlds/world_theme.dart';

/// شريط ترتيب/تصفية — مسطح بدون ظلال.
class ListingToolbar extends StatelessWidget {
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final bool hasFilter;
  final String sortLabel;
  final String filterLabel;

  const ListingToolbar({
    super.key,
    required this.onSort,
    required this.onFilter,
    required this.sortLabel,
    required this.filterLabel,
    this.hasFilter = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ToolChip(
            icon: Icons.swap_vert_rounded,
            label: sortLabel,
            onTap: onSort,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _ToolChip(
            icon: Icons.tune_rounded,
            label: filterLabel,
            onTap: onFilter,
            active: hasFilter,
          ),
        ),
      ],
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
    final t = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: active ? t.accentLight : t.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: active ? t.accent.withValues(alpha: 0.42) : t.hairline.withValues(alpha: 0.85),
              width: active ? 1.2 : 1,
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 17,
                color: active ? t.accentDark : t.inkMuted,
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: active ? FontWeight.w800 : FontWeight.w700,
                    color: active ? t.accentDark : t.ink,
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
