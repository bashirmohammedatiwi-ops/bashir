import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import 'home_surface_card.dart';

/// عرض العنوان — يُتحكم به من لوحة التحكم (حقل showTitle).
bool homeSectionShowsTitle(HomeSection section) => section.showTitle;

/// غلاف موحّد لأقسام الرئيسية — بطاقة عائمة وعناوين أنيقة.
class HomeSectionShell extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? headerTrailing;
  final bool? showTitle;
  final bool elevated;
  final Widget child;

  const HomeSectionShell({
    super.key,
    required this.section,
    required this.child,
    this.compactTop = false,
    this.actionLabel,
    this.onAction,
    this.headerTrailing,
    this.showTitle,
    this.elevated = true,
  });

  bool get _showTitle => showTitle ?? homeSectionShowsTitle(section);

  @override
  Widget build(BuildContext context) {
    final cmsBg = parseHexColor(section.backgroundColor);
    final surfaceColor = cmsBg ?? AppColors.homeSurface;

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_showTitle)
          SectionHeader(
            title: section.title ?? '',
            actionLabel: actionLabel,
            onAction: onAction,
            style: SectionHeaderStyle.niceOne,
            compact: compactTop,
            trailing: headerTrailing,
          )
        else if ((actionLabel != null && onAction != null) || headerTrailing != null)
          Padding(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.screenH,
              compactTop ? AppSpacing.xs : AppSpacing.sm,
              AppSpacing.screenH,
              AppSpacing.xs,
            ),
            child: Row(
              children: [
                if (headerTrailing != null) ...[
                  headerTrailing!,
                  const Spacer(),
                ] else
                  const Spacer(),
                if (actionLabel != null && onAction != null)
                  _ViewAllPill(label: actionLabel!, onTap: onAction!),
              ],
            ),
          ),
        if (section.subtitle != null && section.subtitle!.isNotEmpty && _showTitle)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screenH + 14,
              0,
              AppSpacing.screenH,
              AppSpacing.sm,
            ),
            child: Text(
              section.subtitle!,
              style: TextStyle(
                color: AppColors.textSecondary.withValues(alpha: 0.85),
                fontSize: 13,
                height: 1.45,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        child,
      ],
    );

    if (!elevated) {
      return ColoredBox(color: surfaceColor, child: content);
    }

    return HomeSurfaceCard(
      color: surfaceColor,
      child: content,
    );
  }
}

class _ViewAllPill extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ViewAllPill({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.primaryLight.withValues(alpha: 0.55),
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
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Icon(Icons.chevron_left, size: 16, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}
