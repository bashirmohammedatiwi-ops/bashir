import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../features/worlds/world_theme.dart';
import '../../theme/app_text.dart';

/// عنوان قسم موحّد لكل التطبيق: خط لوني صغير + عنوان + وصف اختياري + "عرض الكل".
class AppSectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;
  final bool showAccent;

  /// لون العنوان فوق خلفية مخصّصة (مجموعة أقسام داكنة مثلاً). الوصف يأخذ نفس اللون أخفّ،
  /// و«عرض الكل» يتحوّل لنسخة الخلفية الداكنة حين يكون اللون فاتحاً.
  final Color? titleColor;

  const AppSectionTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.trailing,
    this.padding = const EdgeInsetsDirectional.fromSTEB(16, 20, 16, 12),
    this.showAccent = false,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final hasSubtitle = subtitle != null && subtitle!.isNotEmpty;
    final onDark = titleColor != null && titleColor!.computeLuminance() > 0.5;
    return Padding(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (showAccent) ...[
            Container(
              width: 4,
              height: hasSubtitle ? 34 : 20,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [t.accent, t.accent.withValues(alpha: 0.35)],
                ),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title2.copyWith(color: titleColor ?? t.ink, fontWeight: FontWeight.w800, fontSize: 19),
                ),
                if (hasSubtitle) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: titleColor?.withValues(alpha: 0.72) ?? t.inkMuted),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            ViewAllButton(label: actionLabel!, onTap: onAction!, onDark: onDark),
          ],
        ],
      ),
    );
  }
}

/// زر "عرض الكل" الوحيد في التطبيق — نفس الشكل في كل مكان.
class ViewAllButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool onDark;

  const ViewAllButton({super.key, required this.label, required this.onTap, this.onDark = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fg = onDark ? Colors.white : t.accentDark;
    // حبّة ناعمة بلون العالم الفاتح + سهم صغير — هادئة لا تنافس العنوان.
    final bg = onDark ? Colors.white.withValues(alpha: 0.18) : t.accentLight;
    return Semantics(
      button: true,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(AppCorners.pill),
        // منطقة لمس 44 والشكل نفسه في المنتصف — لا يكبر الشكل ولا تضيع الضغطة.
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: kMinTapTarget),
          child: Center(
            widthFactor: 1,
            child: Container(
              padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 8, 6),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(AppCorners.pill),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: AppText.label.copyWith(color: fg, fontSize: 12.5, fontWeight: FontWeight.w700, height: 1.2),
                  ),
                  const SizedBox(width: 3),
                  Icon(Icons.chevron_right_rounded, size: 18, color: fg),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
