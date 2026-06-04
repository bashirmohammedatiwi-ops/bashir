import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';

/// شريط تقدم علوي — ثلاث شرائح أنيقة.
class OnboardingProgress extends StatelessWidget {
  const OnboardingProgress({
    super.key,
    required this.count,
    required this.progress,
    this.accent = AppColors.primary,
  });

  final int count;
  /// موضع الصفحة الحالي (0, 1, 2 …).
  final double progress;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: List.generate(count, (i) {
          final fill = (progress - i).clamp(0.0, 1.0);
          return Expanded(
            child: Padding(
              padding: EdgeInsetsDirectional.only(start: i == 0 ? 0 : 6),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: SizedBox(
                  height: 3,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ColoredBox(color: AppColors.divider),
                      AnimatedAlign(
                        duration: AppMotion.fast,
                        curve: AppMotion.precise,
                        alignment: AlignmentDirectional.centerStart,
                        widthFactor: fill,
                        child: ColoredBox(color: accent),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
