import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';

/// شعار سبلاش سينمائي:
/// 1. حلقة ذهبية تُرسم بدوران ناعم.
/// 2. نقاط ذهبية مدارية تحوم حول الحرف الرئيسي.
/// 3. الحرف "A" يظهر بـ scale + shimmer ذهبي.
/// 4. كلمة "ALHAYAA" تنفجر حرفًا حرفًا.
/// 5. خط ذهبي رفيع ينمو + اسم عربي + tagline متباعد الأحرف.
class SplashMotionLogo extends StatefulWidget {
  const SplashMotionLogo({super.key, this.onAnimationComplete});

  final VoidCallback? onAnimationComplete;

  @override
  State<SplashMotionLogo> createState() => _SplashMotionLogoState();
}

class _SplashMotionLogoState extends State<SplashMotionLogo>
    with TickerProviderStateMixin {
  late final AnimationController _master;
  late final AnimationController _shimmer;

  static const _word = 'ALHAYAA';

  @override
  void initState() {
    super.initState();
    _master = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..forward();
    _shimmer = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    _master.addStatusListener((s) {
      if (s == AnimationStatus.completed) {
        widget.onAnimationComplete?.call();
      }
    });
  }

  @override
  void dispose() {
    _master.dispose();
    _shimmer.dispose();
    super.dispose();
  }

  double _seg(double t, double start, double end) {
    if (t <= start) return 0;
    if (t >= end) return 1;
    return Curves.easeOutCubic.transform((t - start) / (end - start));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_master, _shimmer]),
      builder: (context, _) {
        final t = _master.value;
        final ringT = _seg(t, 0.00, 0.45);
        final markT = _seg(t, 0.18, 0.50);
        final orbitT = _seg(t, 0.25, 0.85);
        final wordT = _seg(t, 0.45, 0.80);
        final lineT = _seg(t, 0.65, 0.85);
        final subT = _seg(t, 0.78, 1.0);

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Logo mark with ring + orbit + shimmer
            RepaintBoundary(
              child: SizedBox(
                width: 150,
                height: 150,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer ring (gold)
                    CustomPaint(
                      size: const Size(150, 150),
                      painter: _RingPainter(
                        progress: ringT,
                        color: AppColors.gold,
                        strokeWidth: 1.6,
                        sweep: 0.92,
                      ),
                      isComplex: false,
                      willChange: ringT < 1.0,
                    ),
                    // Inner ring (plum)
                    CustomPaint(
                      size: const Size(120, 120),
                      painter: _RingPainter(
                        progress: _seg(t, 0.05, 0.55),
                        color: AppColors.primary.withValues(alpha: 0.35),
                        strokeWidth: 1.0,
                        sweep: 0.78,
                        startAngle: math.pi,
                      ),
                      isComplex: false,
                      willChange: t < 0.55,
                    ),
                    // Orbiting dots
                    Opacity(
                      opacity: orbitT,
                      child: Transform.rotate(
                        angle: _shimmer.value * math.pi * 2,
                        child: SizedBox(
                          width: 130,
                          height: 130,
                          child: Stack(
                            children: List.generate(3, (i) {
                              final ang = (i / 3) * math.pi * 2;
                              const r = 60.0;
                              return Positioned(
                                left: 65 + math.cos(ang) * r - 3,
                                top: 65 + math.sin(ang) * r - 3,
                                child: Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: AppColors.gold,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color:
                                            AppColors.gold.withValues(alpha: 0.6),
                                        blurRadius: 8,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }),
                          ),
                        ),
                      ),
                    ),
                    // Letter mark
                    Opacity(
                      opacity: markT,
                      child: Transform.scale(
                        scale: 0.6 + markT * 0.4,
                        child: _LetterMark(shimmer: _shimmer.value),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 36),

            // ALHAYAA word — letter-by-letter reveal
            SizedBox(
              height: 38,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_word.length, (i) {
                  final local = (wordT * _word.length - i).clamp(0.0, 1.0);
                  return Opacity(
                    opacity: local,
                    child: Transform.translate(
                      offset: Offset(0, 14 * (1 - local)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2.5),
                        child: Text(
                          _word[i],
                          style: AppTextStyles.brandLatin(size: 32),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 12),

            // Golden growing line
            Container(
              height: 1.5,
              width: 200 * lineT,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.gold.withValues(alpha: 0),
                    AppColors.gold,
                    AppColors.gold.withValues(alpha: 0),
                  ],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // Arabic name
            Opacity(
              opacity: subT,
              child: Transform.translate(
                offset: Offset(0, 8 * (1 - subT)),
                child: Text(
                  AppStrings.appName,
                  style: AppTextStyles.brandArabic(),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Opacity(
              opacity: subT,
              child: Text(
                AppStrings.tagline,
                style: AppTextStyles.brandTagline(),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _LetterMark extends StatelessWidget {
  const _LetterMark({required this.shimmer});
  final double shimmer;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryDark, AppColors.primary],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color(0x334A2466),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Shimmer band
            Positioned(
              left: -64 + shimmer * 128,
              top: 0,
              bottom: 0,
              child: Container(
                width: 32,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0),
                      AppColors.gold.withValues(alpha: 0.4),
                      Colors.white.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            Text(
              'A',
              style: AppTextStyles.serif(
                color: AppColors.gold,
                size: 34,
                weight: FontWeight.w400,
                style: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
    this.sweep = 0.95,
    this.startAngle = -math.pi / 2,
  });

  final double progress;
  final Color color;
  final double strokeWidth;
  final double sweep;
  final double startAngle;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      2 * math.pi * sweep * progress,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..color = color,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      (old.progress - progress).abs() > 0.01;
}
