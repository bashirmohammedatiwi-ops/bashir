import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_fonts.dart';
import '../theme/app_spacing.dart';
import '../../features/worlds/world_theme.dart';

enum SectionHeaderStyle { standard, niceOne }

class SectionHeader extends ConsumerWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final SectionHeaderStyle style;
  final bool compact;
  final Widget? trailing;
  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.style = SectionHeaderStyle.standard,
    this.compact = false,
    this.trailing,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(activeWorldThemeProvider);
    final chevron = Directionality.of(context) == TextDirection.rtl
        ? Icons.chevron_left
        : Icons.chevron_right;

    if (style == SectionHeaderStyle.niceOne) {
      return Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.screenH,
          compact ? AppSpacing.sm : AppSpacing.lg,
          AppSpacing.screenH,
          AppSpacing.sm,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 4,
              height: 26,
              decoration: BoxDecoration(
                gradient: theme.primaryGradient,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: theme.accent.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: appFont(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: theme.ink,
                      letterSpacing: -0.4,
                      height: 1.15,
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null) ...[
              trailing!,
              if (actionLabel != null) const SizedBox(width: AppSpacing.sm),
            ],
            if (actionLabel != null && onAction != null)
              _NiceViewAll(label: actionLabel!, onTap: onAction!, theme: theme),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 18, AppSpacing.screenH, AppSpacing.sm),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 22,
            decoration: BoxDecoration(
              color: theme.accent,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              title,
              style: appFont(fontSize: 17, fontWeight: FontWeight.w800),
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(foregroundColor: theme.accent),
              child: Row(
                children: [
                  Text(actionLabel!, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Icon(chevron, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _NiceViewAll extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final WorldThemePalette theme;

  const _NiceViewAll({required this.label, required this.onTap, required this.theme});

  @override
  Widget build(BuildContext context) {
    final chevron = Directionality.of(context) == TextDirection.rtl
        ? Icons.chevron_left
        : Icons.chevron_right;

    return Material(
      color: theme.accentLight.withValues(alpha: 0.55),
      borderRadius: BorderRadius.circular(AppRadius.pill),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: appFont(
                  color: theme.accentDark,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Icon(chevron, size: 16, color: theme.accent),
            ],
          ),
        ),
      ),
    );
  }
}
