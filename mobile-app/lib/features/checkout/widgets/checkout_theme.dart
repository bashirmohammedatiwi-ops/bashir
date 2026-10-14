import 'package:flutter/material.dart';

import '../../../core/widgets/ui/ui.dart';
import '../../cart/widgets/cart_theme.dart';
import '../../worlds/world_theme.dart';

/// ثيم إتمام الطلب — نفس منطق السلة: الألوان من العالم النشط.
abstract final class CheckoutTheme {
  static double shellNavReserve(BuildContext context) => CartTheme.shellNavReserve(context);

  static List<BoxShadow> dockShadow(BuildContext context) => CartTheme.dockShadow(context);

  static BoxDecoration cardDecoration(BuildContext context, {Color? color, bool selected = false}) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: color ?? t.surface,
      borderRadius: BorderRadius.circular(CartTheme.radiusLg),
      border: Border.all(color: selected ? t.accent : t.accentSoft, width: selected ? 1.5 : 1),
      boxShadow: CartTheme.softShadow(context),
    );
  }

  static BoxDecoration headerDecoration(BuildContext context) => CartTheme.headerDecoration(context);

  static InputDecoration fieldDecoration(BuildContext context, {required String label, String? hint, IconData? icon}) {
    final t = context.worldTheme;
    OutlineInputBorder border(Color c, [double w = 1]) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(CartTheme.radiusMd),
      borderSide: BorderSide(color: c, width: w),
    );
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: AppText.bodySmall.copyWith(color: t.inkSoft),
      floatingLabelStyle: AppText.label.copyWith(color: t.accentDark),
      hintStyle: AppText.bodySmall.copyWith(color: t.inkMuted),
      errorStyle: AppText.caption.copyWith(fontWeight: FontWeight.w600),
      errorMaxLines: 2,
      prefixIcon: icon != null ? Icon(icon, color: t.accent, size: 20) : null,
      filled: true,
      fillColor: t.accentLight,
      border: border(Colors.transparent),
      enabledBorder: border(t.accentSoft),
      focusedBorder: border(t.accent, 1.5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
    );
  }
}

/// رأس قسم داخل بطاقة إتمام الطلب — أيقونة ناعمة + عنوان + وصف + رقم الخطوة.
class CheckoutSectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final int? step;

  const CheckoutSectionHeader({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.step,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 14),
      child: Row(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              CartTheme.iconBadge(context, icon),
              if (step != null)
                PositionedDirectional(
                  top: -5,
                  end: -5,
                  child: Container(
                    width: 18,
                    height: 18,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: t.accent,
                      shape: BoxShape.circle,
                      border: Border.all(color: t.surface, width: 1.5),
                    ),
                    child: Text('$step', style: AppText.micro.copyWith(color: Colors.white, height: 1)),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title3.copyWith(color: t.ink),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 1),
                  Text(
                    subtitle!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: t.inkMuted),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
