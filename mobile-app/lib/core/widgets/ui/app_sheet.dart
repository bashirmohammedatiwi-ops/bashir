import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../features/worlds/world_theme.dart';
import '../../theme/app_text.dart';

/// ورقة سفلية موحّدة: مقبض، عنوان، زر إغلاق، ومحتوى قابل للتمرير.
Future<T?> showAppSheet<T>({
  required BuildContext context,
  required String title,
  required WidgetBuilder builder,
  Widget? footer,
  bool expand = false,
}) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      final t = ctx.worldTheme;
      final maxH = MediaQuery.sizeOf(ctx).height * (expand ? 0.92 : 0.86);
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: Container(
          constraints: BoxConstraints(maxHeight: maxH),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(AppCorners.xl)),
          ),
          child: Column(
            mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: t.hairline,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(20, 10, 8, 4),
                child: Row(
                  children: [
                    Expanded(child: Text(title, style: AppText.title2.copyWith(color: t.ink))),
                    IconButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      icon: Icon(Icons.close_rounded, color: t.inkSoft),
                      tooltip: MaterialLocalizations.of(ctx).closeButtonTooltip,
                    ),
                  ],
                ),
              ),
              Flexible(fit: expand ? FlexFit.tight : FlexFit.loose, child: builder(ctx)),
              if (footer != null)
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: t.surface,
                    border: Border(top: BorderSide(color: t.divider)),
                  ),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      child: footer,
                    ),
                  ),
                ),
            ],
          ),
        ),
      );
    },
  );
}

/// شريحة اختيار موحّدة (فلاتر، ترتيب، أقسام).
class AppChoiceChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final bool showChevron;
  final int? count;

  const AppChoiceChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
    this.showChevron = false,
    this.count,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fg = selected ? t.accentDark : t.ink;
    return Semantics(
      button: true,
      selected: selected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          height: 36,
          padding: EdgeInsetsDirectional.fromSTEB(icon != null ? 10 : 14, 0, showChevron ? 8 : 14, 0),
          decoration: BoxDecoration(
            color: selected ? t.accentSoft : t.surface,
            borderRadius: BorderRadius.circular(AppCorners.pill),
            border: Border.all(color: selected ? t.accent.withValues(alpha: 0.55) : t.hairline),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: selected ? t.accentDark : t.inkSoft),
                const SizedBox(width: 6),
              ],
              Text(label, style: AppText.label.copyWith(color: fg, fontWeight: selected ? FontWeight.w800 : FontWeight.w600)),
              if (count != null && count! > 0) ...[
                const SizedBox(width: 6),
                Container(
                  constraints: const BoxConstraints(minWidth: 18),
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: t.accent,
                    borderRadius: BorderRadius.circular(AppCorners.pill),
                  ),
                  child: Text(
                    '$count',
                    textAlign: TextAlign.center,
                    style: AppText.micro.copyWith(color: Colors.white, fontSize: 10.5),
                  ),
                ),
              ],
              if (showChevron) ...[
                const SizedBox(width: 2),
                Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: selected ? t.accentDark : t.inkMuted),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
