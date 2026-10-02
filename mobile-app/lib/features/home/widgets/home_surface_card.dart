import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../worlds/world_theme.dart';

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
    final t = context.worldTheme;
    return Padding(
      padding: margin,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color ?? t.surface,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          border: Border.all(color: t.hairline.withValues(alpha: 0.45)),
          boxShadow: showShadow ? t.cardShadow : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          child: padding != null ? Padding(padding: padding!, child: child) : child,
        ),
      ),
    );
  }
}
