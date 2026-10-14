import 'package:flutter/material.dart';

import '../../../core/utils/responsive.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';

/// ثيم السلة — مقاسات ثابتة، والألوان تُقرأ من لوحة العالم النشط
/// (`context.worldTheme`) حتى تتلوّن السلة مع العالم كبقية التطبيق.
abstract final class CartTheme {
  static const radiusXl = AppCorners.xl;
  static const radiusLg = AppCorners.lg;
  static const radiusMd = AppCorners.md;
  static const radiusSm = AppCorners.sm;
  static const hPad = 16.0;
  static const itemGap = 12.0;
  static const imageSize = 88.0;

  static double shellNavReserve(BuildContext context) {
    return Responsive.shellBottomReserve(context);
  }

  static List<BoxShadow> softShadow(BuildContext context) {
    final t = context.worldTheme;
    return [
      BoxShadow(color: t.accent.withValues(alpha: 0.07), blurRadius: 18, offset: const Offset(0, 6), spreadRadius: -4),
      BoxShadow(color: t.ink.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
    ];
  }

  static List<BoxShadow> dockShadow(BuildContext context) => [
    BoxShadow(
      color: context.worldTheme.accentDark.withValues(alpha: 0.08),
      blurRadius: 22,
      offset: const Offset(0, -6),
      spreadRadius: -4,
    ),
  ];

  static BoxDecoration cardDecoration(BuildContext context, {Color? color}) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: color ?? t.surface,
      borderRadius: BorderRadius.circular(radiusLg),
      border: Border.all(color: t.accentSoft),
      boxShadow: softShadow(context),
    );
  }

  static BoxDecoration pillDecoration(BuildContext context, {Color? fill}) => BoxDecoration(
    color: fill ?? context.worldTheme.accentLight,
    borderRadius: BorderRadius.circular(AppCorners.pill),
  );

  static BoxDecoration headerDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      gradient: LinearGradient(
        begin: AlignmentDirectional.topStart.resolve(Directionality.of(context)),
        end: AlignmentDirectional.bottomEnd.resolve(Directionality.of(context)),
        colors: [t.accentSoft, t.canvas, t.canvas],
        stops: const [0, 0.7, 1],
      ),
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(radiusXl)),
    );
  }

  /// دائرة أيقونة ناعمة موحّدة (البانرات، الكوبون، الأقسام).
  static Widget iconBadge(BuildContext context, IconData icon, {Color? color, double size = 40}) {
    final t = context.worldTheme;
    final c = color ?? t.accentDark;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color == null ? t.accentSoft : c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppCorners.sm),
      ),
      child: Icon(icon, color: c, size: size * 0.5),
    );
  }
}

/// عنوان قسم داخل السلة — نفس عنوان الأقسام الموحّد للتطبيق.
class CartSectionLabel extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const CartSectionLabel({super.key, required this.title, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    return AppSectionTitle(
      title: title,
      subtitle: subtitle,
      trailing: trailing,
      padding: const EdgeInsetsDirectional.fromSTEB(CartTheme.hPad, 22, CartTheme.hPad, 12),
    );
  }
}
