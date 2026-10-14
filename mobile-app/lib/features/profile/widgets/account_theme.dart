import 'package:flutter/material.dart';

import '../../../core/widgets/ui/ui.dart';
import '../../../features/worlds/world_theme.dart';

/// ثيم صفحات الحساب — لون واحد متناغم (لون العالم النشط) لكل الأيقونات،
/// والأحمر محجوز فقط للإجراءات الخطرة (الخروج / الحذف).
abstract final class AccountTheme {
  static const sectionGap = 22.0;
  static const hPad = 16.0;

  /// الاستثناء الوحيد خارج لوحة العالم — للإجراءات الخطرة فقط.
  static const danger = Color(0xFFD64545);
  static Color get dangerSoft => danger.withValues(alpha: 0.08);

  static BoxDecoration pageCard(BuildContext context, {Color? color}) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: color ?? t.surface,
      borderRadius: BorderRadius.circular(AppCorners.lg),
      border: Border.all(color: t.hairline.withValues(alpha: 0.7)),
      boxShadow: t.cardShadow,
    );
  }

  static BoxDecoration heroDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      gradient: t.signatureGradient,
      borderRadius: BorderRadius.circular(AppCorners.xl),
      boxShadow: [
        BoxShadow(
          color: t.accentDark.withValues(alpha: 0.22),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
      ],
    );
  }

  /// مربّع الأيقونة الموحّد: أيقونة accentDark على خلفية accentLight.
  static Widget iconTile(
    BuildContext context,
    IconData icon, {
    double size = 40,
    bool danger = false,
    Color? color,
  }) {
    final t = context.worldTheme;
    final fg = danger ? AccountTheme.danger : (color ?? t.accentDark);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: danger
            ? dangerSoft
            : (color?.withValues(alpha: 0.1) ?? t.accentLight),
        borderRadius: BorderRadius.circular(AppCorners.sm),
        border: Border.all(
          color: danger
              ? AccountTheme.danger.withValues(alpha: 0.12)
              : t.accentSoft,
        ),
      ),
      alignment: Alignment.center,
      child: Icon(icon, color: fg, size: size * 0.5),
    );
  }

  static Widget sectionTitle(
    BuildContext context,
    String title, {
    IconData? icon,
  }) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(4, 0, 4, 10),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: t.accentDark),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(color: t.inkSoft),
            ),
          ),
        ],
      ),
    );
  }
}
