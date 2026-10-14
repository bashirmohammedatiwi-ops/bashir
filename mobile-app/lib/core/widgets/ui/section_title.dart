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

  const AppSectionTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.trailing,
    this.padding = const EdgeInsetsDirectional.fromSTEB(16, 20, 16, 12),
    this.showAccent = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final hasSubtitle = subtitle != null && subtitle!.isNotEmpty;
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
                  style: AppText.title2.copyWith(color: t.ink),
                ),
                if (hasSubtitle) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: t.inkMuted),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            ViewAllButton(label: actionLabel!, onTap: onAction!),
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
    return Semantics(
      button: true,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(AppCorners.pill),
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(6, 6, 2, 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: AppText.label.copyWith(color: fg, fontSize: 12.5, fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 7),
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: onDark ? Colors.white.withValues(alpha: 0.2) : t.accent,
                  boxShadow: onDark
                      ? null
                      : [BoxShadow(color: t.accent.withValues(alpha: 0.28), blurRadius: 8, offset: const Offset(0, 3))],
                ),
                child: const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
