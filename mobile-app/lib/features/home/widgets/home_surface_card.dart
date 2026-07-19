import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// بطاقة بيضاء عائمة لأقسام الصفحة الرئيسية.
class HomeSurfaceCard extends StatelessWidget {
  final Widget child;
  final Color? color;
  final EdgeInsetsGeometry margin;
  final EdgeInsetsGeometry? padding;
  final bool showShadow;

  const HomeSurfaceCard({
    super.key,
    required this.child,
    this.color,
    this.margin = const EdgeInsets.symmetric(horizontal: AppSpacing.md),
    this.padding,
    this.showShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color ?? AppColors.homeSurface,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.45)),
          boxShadow: showShadow
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.04),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: AppColors.textPrimary.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          child: padding != null ? Padding(padding: padding!, child: child) : child,
        ),
      ),
    );
  }
}
