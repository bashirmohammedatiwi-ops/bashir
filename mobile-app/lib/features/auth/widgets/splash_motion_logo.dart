import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';

/// شعار افتتاحي سينمائي — حلقتان + ظهور متتابع.
class SplashMotionLogo extends StatefulWidget {
  const SplashMotionLogo({super.key, this.onAnimationComplete});

  final VoidCallback? onAnimationComplete;

  @override
  State<SplashMotionLogo> createState() => _SplashMotionLogoState();
}

class _SplashMotionLogoState extends State<SplashMotionLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..forward().whenComplete(() {
        Future.delayed(const Duration(milliseconds: 350), () {
          widget.onAnimationComplete?.call();
        });
      });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  double _seg(double start, double end) {
    final t = _c.value;
    if (t <= start) return 0;
    if (t >= end) return 1;
    return Curves.easeOutCubic.transform((t - start) / (end - start));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final outerRing = _seg(0.04, 0.42);
        final innerRing = _seg(0.10, 0.48);
        final mark = _seg(0.22, 0.55);
        final line = _seg(0.48, 0.68);
        final name = _seg(0.55, 0.82);
        final tag = _seg(0.72, 1.0);
        final breathe = 0.92 + math.sin(_c.value * math.pi) * 0.04;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 136,
              height: 136,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Opacity(
                    opacity: outerRing * 0.5,
                    child: Transform.scale(
                      scale: breathe,
                      child: Container(
                        width: 128,
                        height: 128,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primarySoft,
                        ),
                      ),
                    ),
                  ),
                  CustomPaint(
                    size: const Size(118, 118),
                    painter: _ArcPainter(
                      progress: outerRing,
                      color: AppColors.primary.withValues(alpha: 0.35),
                      stroke: 2,
                      sweep: 0.88,
                    ),
                  ),
                  CustomPaint(
                    size: const Size(96, 96),
                    painter: _ArcPainter(
                      progress: innerRing,
                      color: AppColors.gold.withValues(alpha: 0.7),
                      stroke: 1.5,
                      sweep: 0.65,
                      start: math.pi * 0.35,
                    ),
                  ),
                  Opacity(
                    opacity: mark,
                    child: Transform.scale(
                      scale: 0.78 + mark * 0.22,
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.12),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              blurRadius: 32,
                              offset: const Offset(0, 12),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'A',
                          style: AppTextStyles.serif(
                            color: AppColors.primary,
                            size: 36,
                            weight: FontWeight.w500,
                            style: FontStyle.italic,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),
            Opacity(
              opacity: name,
              child: Transform.translate(
                offset: Offset(0, 18 * (1 - name)),
                child: Text(
                  AppStrings.appName,
                  style: AppTextStyles.headline(size: 32).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.8,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 2,
              width: 40 + line * 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.gold.withValues(alpha: 0),
                    AppColors.gold,
                    AppColors.gold.withValues(alpha: 0),
                  ],
                ),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
            const SizedBox(height: 16),
            Opacity(
              opacity: tag,
              child: Transform.translate(
                offset: Offset(0, 12 * (1 - tag)),
                child: Text(
                  AppStrings.tagline,
                  style: AppTextStyles.caption(
                    color: AppColors.textSecondary,
                    size: 13.5,
                  ).copyWith(letterSpacing: 0.5),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ArcPainter extends CustomPainter {
  _ArcPainter({
    required this.progress,
    required this.color,
    required this.stroke,
    this.sweep = 0.85,
    this.start = -math.pi / 2,
  });

  final double progress;
  final Color color;
  final double stroke;
  final double sweep;
  final double start;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - stroke;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      start,
      2 * math.pi * sweep * progress,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..color = color,
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) =>
      (old.progress - progress).abs() > 0.008;
}
