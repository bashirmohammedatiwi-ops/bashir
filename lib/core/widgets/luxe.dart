import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_motion.dart';
import '../constants/app_sizes.dart';
import '../theme/text_styles.dart';

/// مكتبة مكوّنات بصرية فاخرة مشتركة (Luxe = "أنيق").
///
/// كل مكوّن هنا مصمم بمنهج "أقل = أكثر فخامة":
///  - حدود رفيعة، ظلال خفيفة، تباينات هادئة، حركات ناعمة.
class Luxe {
  Luxe._();

  /// خط فاصل ذهبي رفيع — لمسة بوتيكية بين الأقسام.
  static Widget goldenRule({double width = 36, double? height}) {
    return Container(
      width: width,
      height: height ?? 1.5,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.gold.withValues(alpha: 0),
            AppColors.gold.withValues(alpha: 0.8),
            AppColors.gold.withValues(alpha: 0),
          ],
        ),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  /// شارة (chip) بأسلوب editorial.
  static Widget editorialBadge({
    required String label,
    Color? color,
    Color? backgroundColor,
    IconData? icon,
  }) {
    final c = color ?? AppColors.primaryDark;
    final bg = backgroundColor ?? AppColors.canvas;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
        border: Border.all(color: c.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: c),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: AppTextStyles.caption(color: c, size: 10).copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  /// زر دائري شفاف (نموذجي للـ Hero header).
  static Widget glassIconButton({
    required IconData icon,
    required VoidCallback onTap,
    Color iconColor = Colors.white,
    Color background = const Color(0x33000000),
    double size = 40,
  }) {
    return _PressedScale(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: background,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
    );
  }

  /// زر أيقونة على خلفية فاتحة (سطح).
  static Widget surfaceIconButton({
    required IconData icon,
    required VoidCallback onTap,
    Color iconColor = AppColors.textPrimary,
    double size = 42,
  }) {
    return _PressedScale(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppColors.surface,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.divider),
          boxShadow: const [AppColors.softShadow],
        ),
        child: Icon(icon, color: iconColor, size: 19),
      ),
    );
  }

  /// عنوان قسم بأسلوب editorial مع خط ذهبي رفيع تحته.
  static Widget sectionTitle({
    required String title,
    String? subtitle,
    String? actionLabel,
    VoidCallback? onAction,
    EdgeInsetsGeometry? padding,
  }) {
    return Padding(
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: AppSizes.xl,
            vertical: AppSizes.md,
          ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.title(size: 17).copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: AppTextStyles.caption(
                          color: AppColors.textMuted,
                          size: 11,
                        ).copyWith(letterSpacing: 0.2),
                      ),
                    ],
                  ],
                ),
              ),
              if (onAction != null)
                _PressedScale(
                  onTap: onAction,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 4,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          actionLabel ?? 'عرض الكل',
                          style: AppTextStyles.caption(
                            color: AppColors.primaryDark,
                            size: 11.5,
                          ).copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_back_rounded,
                          size: 14,
                          color: AppColors.primaryDark,
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          goldenRule(),
        ],
      ),
    );
  }

  /// زر رئيسي بأسلوب فاخر (gradient hover effect).
  static Widget primaryButton({
    required String label,
    required VoidCallback? onTap,
    IconData? icon,
    bool loading = false,
    double height = AppSizes.buttonHeight,
    Color? color,
  }) {
    final enabled = onTap != null && !loading;
    return _PressedScale(
      onTap: enabled ? onTap : null,
      scale: 0.985,
      child: AnimatedContainer(
        duration: AppMotion.fast,
        height: height,
        decoration: BoxDecoration(
          gradient: enabled
              ? LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [
                    color ?? AppColors.primary,
                    color != null
                        ? Color.lerp(color, Colors.black, 0.25)!
                        : AppColors.primaryDark,
                  ],
                )
              : null,
          color: enabled ? null : AppColors.canvasDeep,
          borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
          boxShadow: enabled
              ? const [
                  BoxShadow(
                    color: Color(0x224A2466),
                    blurRadius: 18,
                    offset: Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    color: Colors.white,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      Icon(
                        icon,
                        color: enabled
                            ? Colors.white
                            : AppColors.textMuted,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      label,
                      style: AppTextStyles.title(
                        color: enabled
                            ? Colors.white
                            : AppColors.textMuted,
                        size: 14,
                      ).copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  /// زر ثانوي (Outlined).
  static Widget outlinedButton({
    required String label,
    required VoidCallback? onTap,
    IconData? icon,
    Color color = AppColors.primaryDark,
  }) {
    return _PressedScale(
      onTap: onTap,
      child: Container(
        height: AppSizes.buttonHeight,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
          border: Border.all(color: AppColors.border),
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, color: color, size: 17),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: AppTextStyles.title(color: color, size: 13.5).copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// مغلّف صغير يعطي تأثير ضغط ناعم (scale + ripple).
class _PressedScale extends StatefulWidget {
  const _PressedScale({
    required this.child,
    required this.onTap,
    this.scale = 0.96,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  @override
  State<_PressedScale> createState() => _PressedScaleState();
}

class _PressedScaleState extends State<_PressedScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: widget.onTap == null ? null : (_) => setState(() => _down = true),
      onTapUp: widget.onTap == null ? null : (_) => setState(() => _down = false),
      onTapCancel: widget.onTap == null ? null : () => setState(() => _down = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1.0,
        duration: AppMotion.micro,
        curve: AppMotion.standard,
        child: widget.child,
      ),
    );
  }
}

/// مغلّف عام مفعّل لمكوّن `PressedScale` (لاستخدام من غير الـLuxe library).
class PressedScale extends StatelessWidget {
  const PressedScale({
    super.key,
    required this.child,
    required this.onTap,
    this.scale = 0.96,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  @override
  Widget build(BuildContext context) {
    return _PressedScale(onTap: onTap, scale: scale, child: child);
  }
}
