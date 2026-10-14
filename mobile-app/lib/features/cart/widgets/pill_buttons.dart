import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';

/// الزر الأساسي للسلة / الدفع / الطلبات — كبسولة بتدرّج العالم النشط.
class PrimaryPillButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final IconData? trailingIcon;
  final bool loading;
  final double height;
  final bool strongHaptic;

  const PrimaryPillButton({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.trailingIcon,
    this.loading = false,
    this.height = 52,
    this.strongHaptic = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final enabled = onTap != null && !loading;
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 180),
        opacity: onTap == null ? 0.55 : 1,
        child: SizedBox(
          height: height,
          width: double.infinity,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: t.signatureGradient,
              borderRadius: BorderRadius.circular(AppCorners.pill),
              boxShadow: [
                BoxShadow(
                  color: t.accent.withValues(alpha: 0.28),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                  spreadRadius: -2,
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: enabled
                    ? () {
                        strongHaptic ? HapticFeedback.mediumImpact() : HapticFeedback.lightImpact();
                        onTap!();
                      }
                    : null,
                borderRadius: BorderRadius.circular(AppCorners.pill),
                splashColor: Colors.white.withValues(alpha: 0.18),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Center(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: loading
                          ? const SizedBox(
                              key: ValueKey('loading'),
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4),
                            )
                          : Row(
                              key: const ValueKey('label'),
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (icon != null) ...[
                                  Icon(icon, color: Colors.white, size: 20),
                                  const SizedBox(width: 8),
                                ],
                                Flexible(
                                  child: Text(
                                    label,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.title3.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                                  ),
                                ),
                                if (trailingIcon != null) ...[
                                  const SizedBox(width: 8),
                                  Icon(trailingIcon, color: Colors.white, size: 20),
                                ],
                              ],
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// زر ثانوي بنفس الشكل — حدّ رفيع بلون العالم.
class SecondaryPillButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? color;
  final double height;

  const SecondaryPillButton({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.color,
    this.height = 50,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fg = color ?? t.accentDark;
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Material(
        color: t.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppCorners.pill),
          side: BorderSide(color: color?.withValues(alpha: 0.45) ?? t.accentSoft, width: 1.2),
        ),
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          customBorder: const StadiumBorder(),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[Icon(icon, color: fg, size: 19), const SizedBox(width: 8)],
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.label.copyWith(color: fg, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
