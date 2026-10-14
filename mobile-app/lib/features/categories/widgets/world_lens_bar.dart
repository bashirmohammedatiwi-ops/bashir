import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/store_world.dart';
import '../../home/widgets/world_showcase.dart';
import '../../worlds/world_theme.dart';

/// عدسة الأقسام — صفّان:
/// 1. "كل الأقسام" بعرض الشاشة مع حجم الكتالوج.
/// 2. العوالم الأربعة متجاورة بنفس محدّد الرئيسية (أيقونة + اسم + عدد الأقسام).
/// لمس العالم المختار مرة ثانية يعيد إلى "كل الأقسام".
class WorldLensBar extends StatelessWidget {
  final List<StoreWorld> worlds;
  final String? selected;
  final String allLabel;
  final String? allStats;
  final ValueChanged<String?> onSelect;

  const WorldLensBar({
    super.key,
    required this.worlds,
    required this.selected,
    required this.allLabel,
    required this.allStats,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final list = worlds.where((w) => !w.isGift).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _AllRow(
            label: allLabel,
            stats: allStats,
            selected: selected == null,
            onTap: () {
              HapticFeedback.selectionClick();
              onSelect(null);
            },
          ),
        ),
        const SizedBox(height: 10),
        WorldSegments(
          worlds: list,
          selectedSlug: selected,
          onSelect: (slug) => onSelect(slug == selected ? null : slug),
        ),
      ],
    );
  }
}

/// صف "كل الأقسام": حبّة بعرض الشاشة — متدرّجة بألوان الهوية حين تكون مختارة.
class _AllRow extends StatelessWidget {
  final String label;
  final String? stats;
  final bool selected;
  final VoidCallback onTap;

  const _AllRow({
    required this.label,
    required this.stats,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          height: 48,
          padding: const EdgeInsetsDirectional.fromSTEB(6, 6, 16, 6),
          decoration: BoxDecoration(
            color: selected ? null : t.surface,
            gradient: selected
                ? LinearGradient(
                    begin: AlignmentDirectional.centerStart.resolve(
                      Directionality.of(context),
                    ),
                    end: AlignmentDirectional.centerEnd.resolve(
                      Directionality.of(context),
                    ),
                    colors: const [BrandColors.orchid, BrandColors.rose],
                  )
                : null,
            borderRadius: BorderRadius.circular(AppCorners.pill),
            border: Border.all(
              color: selected ? Colors.transparent : t.hairline,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: BrandColors.orchid.withValues(alpha: 0.3),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected
                      ? Colors.white.withValues(alpha: 0.22)
                      : t.accentLight,
                ),
                child: Icon(
                  Icons.grid_view_rounded,
                  size: 18,
                  color: selected ? Colors.white : t.accentDark,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: AppText.label.copyWith(
                  fontSize: 14,
                  color: selected ? Colors.white : t.ink,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              if (stats != null)
                Flexible(
                  child: Text(
                    stats!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(
                      color: selected
                          ? Colors.white.withValues(alpha: 0.85)
                          : t.inkMuted,
                      fontWeight: FontWeight.w600,
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
