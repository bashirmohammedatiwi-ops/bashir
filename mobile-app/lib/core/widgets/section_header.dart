import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

enum SectionHeaderStyle { standard, niceOne }

class SectionHeader extends StatelessWidget {
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
  Widget build(BuildContext context) {
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
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
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
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
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
              _NiceViewAll(label: actionLabel!, onTap: onAction!),
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
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              child: Row(
                children: [
                  Text(actionLabel!, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Icon(Icons.chevron_left, size: 18),
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

  const _NiceViewAll({required this.label, required this.onTap});

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
