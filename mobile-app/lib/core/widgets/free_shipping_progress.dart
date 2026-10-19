import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/worlds/world_theme.dart';
import '../l10n/app_strings.dart';
import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';
import '../theme/app_text.dart';
import '../utils/formatters.dart';
import 'ds_strings.dart';
import 'ui/section_title.dart';

/// التقدّم نحو التوصيل المجاني — مكوّن واحد للسلة وورقة «أُضيف للسلة» والدفع.
///
/// الحد يُقارن بالمجموع الفرعي [subtotal] (قبل الكوبون والنقاط) — نفس قاعدة الخادم.
/// [threshold] صفر أو أقل = لا توصيل مجاني في المتجر، فلا يظهر شيء
/// (إلا إن فعّله كوبون عبر [viaCoupon]).
class FreeShippingProgress extends ConsumerWidget {
  final int subtotal;
  final int threshold;

  /// سطر واحد + شريط رفيع (للأوراق والملخصات) بدل البطاقة الكاملة.
  final bool compact;

  /// «أضيفي المزيد» حين لم يُبلغ الحد بعد — يظهر فقط إن مُرِّر.
  final VoidCallback? onFillGap;

  /// كوبون التوصيل المجاني مفعّل — يُعدّ بالغاً للحد مهما كان المجموع.
  final bool viaCoupon;

  const FreeShippingProgress({
    super.key,
    required this.subtotal,
    required this.threshold,
    this.compact = false,
    this.onFillGap,
    this.viaCoupon = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (threshold <= 0 && !viaCoupon) return const SizedBox.shrink();
    final s = ref.s;
    final t = context.worldTheme;

    final achieved = viaCoupon || subtotal >= threshold;
    final remaining = achieved ? 0 : (threshold - subtotal).clamp(0, threshold);
    final progress = achieved ? 1.0 : (subtotal / threshold).clamp(0.0, 1.0);
    final almost = !achieved && progress >= 0.75;
    final message = achieved
        ? (viaCoupon ? s.dsFreeShippingViaCoupon : s.dsFreeShippingUnlocked)
        : s.dsFreeShippingLeft(formatPrice(remaining));
    final fg = achieved ? AppColors.success : t.ink;
    final icon = achieved ? Icons.celebration_outlined : Icons.local_shipping_outlined;

    if (compact) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              _SwapIcon(achieved: achieved, icon: icon, size: 17, color: achieved ? AppColors.success : t.accentDark),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  message,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: achieved ? AppColors.success : t.inkSoft,
                  ),
                ),
              ),
              if (!achieved && onFillGap != null) ...[
                const SizedBox(width: 6),
                ViewAllButton(label: s.dsAddMore, onTap: onFillGap!),
              ],
            ],
          ),
          const SizedBox(height: 7),
          _ProgressTrack(value: progress, done: achieved, height: 6),
        ],
      );
    }

    final still = MediaQuery.disableAnimationsOf(context);
    return AnimatedContainer(
      duration: still ? Duration.zero : const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        color: achieved ? Color.alphaBlend(AppColors.success.withValues(alpha: 0.08), t.surface) : t.surface,
        borderRadius: BorderRadius.circular(AppCorners.lg),
        border: Border.all(color: achieved ? AppColors.success.withValues(alpha: 0.25) : t.accentSoft),
        boxShadow: AppShadows.card(t),
      ),
      padding: const EdgeInsetsDirectional.fromSTEB(14, 14, 10, 14),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: achieved ? AppColors.success.withValues(alpha: 0.12) : t.accentSoft,
                  borderRadius: BorderRadius.circular(AppCorners.sm),
                ),
                child: _SwapIcon(
                  achieved: achieved,
                  icon: icon,
                  size: 20,
                  color: achieved ? AppColors.success : t.accentDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (almost)
                      Text(
                        s.dsFreeShippingAlmost,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.micro.copyWith(color: t.accent),
                      ),
                    Text(
                      message,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.label.copyWith(color: fg),
                    ),
                  ],
                ),
              ),
              if (!achieved && onFillGap != null) ...[
                const SizedBox(width: 6),
                ViewAllButton(label: s.dsAddMore, onTap: onFillGap!),
              ],
            ],
          ),
          if (!achieved) ...[
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 4),
              child: _ProgressTrack(value: progress, done: false, height: 6),
            ),
          ],
        ],
      ),
    );
  }
}

/// أيقونة الشاحنة تتبدّل لاحتفال عند بلوغ الحد.
class _SwapIcon extends StatelessWidget {
  final bool achieved;
  final IconData icon;
  final double size;
  final Color color;

  const _SwapIcon({
    required this.achieved,
    required this.icon,
    required this.size,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.disableAnimationsOf(context);
    return AnimatedSwitcher(
      duration: still ? Duration.zero : const Duration(milliseconds: 300),
      transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
      child: Icon(icon, key: ValueKey(achieved), size: size, color: color),
    );
  }
}

/// شريط التقدّم — يمتلئ بحركة ناعمة من القيمة السابقة للجديدة.
/// زخرفي فقط لقارئ الشاشة: النص بجانبه يقول كم بقي.
class _ProgressTrack extends StatelessWidget {
  final double value;
  final bool done;
  final double height;

  const _ProgressTrack({required this.value, required this.done, required this.height});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final still = MediaQuery.disableAnimationsOf(context);
    return ExcludeSemantics(
      child: TweenAnimationBuilder<double>(
        tween: Tween(end: value),
        duration: still ? Duration.zero : const Duration(milliseconds: 650),
        curve: Curves.easeOutCubic,
        builder: (context, v, _) => Container(
          height: height,
          decoration: BoxDecoration(color: t.accentSoft, borderRadius: BorderRadius.circular(AppCorners.pill)),
          alignment: AlignmentDirectional.centerStart,
          child: FractionallySizedBox(
            widthFactor: v.clamp(0.04, 1.0),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: done ? AppColors.success : null,
                gradient: done ? null : t.signatureGradient,
                borderRadius: BorderRadius.circular(AppCorners.pill),
              ),
              child: const SizedBox.expand(),
            ),
          ),
        ),
      ),
    );
  }
}
