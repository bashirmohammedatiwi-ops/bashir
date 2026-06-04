import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';

class OnboardingSlideData {
  const OnboardingSlideData({
    required this.icon,
    required this.accent,
    required this.title,
    required this.subtitle,
    required this.stepLabel,
  });

  final IconData icon;
  final Color accent;
  final String title;
  final String subtitle;
  final String stepLabel;
}

/// شريحة ترحيب — parallax + حلقات دوّارة + ظهور متتابع.
class OnboardingSlide extends StatefulWidget {
  const OnboardingSlide({
    super.key,
    required this.data,
    required this.pageDelta,
    required this.slideIndex,
  });

  final OnboardingSlideData data;
  final double pageDelta;
  final int slideIndex;

  @override
  State<OnboardingSlide> createState() => _OnboardingSlideState();
}

class _OnboardingSlideState extends State<OnboardingSlide>
    with TickerProviderStateMixin {
  late final AnimationController _enter;
  late final AnimationController _orbit;

  @override
  void initState() {
    super.initState();
    _enter = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
    );
    _orbit = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    );
    if (widget.pageDelta < 0.35) _playEnter();
  }

  @override
  void didUpdateWidget(covariant OnboardingSlide oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pageDelta < 0.35 && oldWidget.pageDelta >= 0.35) {
      _playEnter();
    } else if (widget.pageDelta >= 0.5) {
      _orbit.stop();
    }
  }

  void _playEnter() {
    _enter.forward(from: 0);
    _orbit.repeat();
  }

  @override
  void dispose() {
    _enter.dispose();
    _orbit.dispose();
    super.dispose();
  }

  double _seg(double start, double end) {
    final t = _enter.value;
    if (t <= start) return 0;
    if (t >= end) return 1;
    return Curves.easeOutCubic.transform((t - start) / (end - start));
  }

  @override
  Widget build(BuildContext context) {
    final delta = widget.pageDelta.clamp(0.0, 1.0);
    final focus = 1 - delta;
    final accent = widget.data.accent;

    return AnimatedBuilder(
      animation: Listenable.merge([_enter, _orbit]),
      builder: (context, _) {
        final iconT = _seg(0, 0.5);
        final titleT = _seg(0.22, 0.72);
        final subT = _seg(0.42, 1);
        final orbit = _orbit.value * 2 * math.pi;

        return Opacity(
          opacity: (0.25 + focus * 0.75).clamp(0, 1),
          child: Transform.translate(
            offset: Offset(0, delta * 36),
            child: Transform.scale(
              scale: 0.94 + focus * 0.06,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.xxxl),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Opacity(
                        opacity: titleT * 0.7,
                        child: Text(
                          widget.data.stepLabel,
                          style: AppTextStyles.caption(
                            color: accent,
                            size: 11,
                          ).copyWith(
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Opacity(
                      opacity: iconT,
                      child: Transform.translate(
                        offset: Offset(0, 24 * (1 - iconT) + delta * -12),
                        child: SizedBox(
                          width: 200,
                          height: 200,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Transform.rotate(
                                angle: orbit,
                                child: _OrbitRing(
                                  size: 196,
                                  color: accent.withValues(alpha: 0.14),
                                  dash: true,
                                ),
                              ),
                              Transform.rotate(
                                angle: -orbit * 0.6,
                                child: _OrbitRing(
                                  size: 156,
                                  color: AppColors.gold.withValues(alpha: 0.22),
                                  dash: false,
                                ),
                              ),
                              Container(
                                width: 128,
                                height: 128,
                                decoration: BoxDecoration(
                                  color: AppColors.surface.withValues(alpha: 0.92),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: accent.withValues(alpha: 0.18),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: accent.withValues(alpha: 0.14),
                                      blurRadius: 40,
                                      offset: const Offset(0, 14),
                                    ),
                                  ],
                                ),
                                child: Icon(
                                  widget.data.icon,
                                  size: 54,
                                  color: accent,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 48),
                    Opacity(
                      opacity: titleT,
                      child: Transform.translate(
                        offset: Offset(0, 22 * (1 - titleT)),
                        child: Text(
                          widget.data.title,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.headline(size: 28).copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.6,
                            height: 1.12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: titleT),
                      duration: const Duration(milliseconds: 400),
                      builder: (context, w, _) {
                        return Container(
                          height: 2,
                          width: 32 * w,
                          decoration: BoxDecoration(
                            color: AppColors.gold,
                            borderRadius: BorderRadius.circular(1),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 18),
                    Opacity(
                      opacity: subT,
                      child: Transform.translate(
                        offset: Offset(0, 18 * (1 - subT)),
                        child: Text(
                          widget.data.subtitle,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.body(
                            color: AppColors.textSecondary,
                            size: 15,
                          ).copyWith(height: 1.75),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _OrbitRing extends StatelessWidget {
  const _OrbitRing({
    required this.size,
    required this.color,
    required this.dash,
  });

  final double size;
  final Color color;
  final bool dash;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _RingPainter(color: color, dashed: dash),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.color, required this.dashed});
  final Color color;
  final bool dashed;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 1;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = dashed ? 1.2 : 1.6
      ..color = color;

    if (!dashed) {
      canvas.drawCircle(center, radius, paint);
      return;
    }

    const segments = 48;
    for (var i = 0; i < segments; i++) {
      if (i.isOdd) continue;
      final a0 = (i / segments) * 2 * math.pi;
      final a1 = ((i + 1) / segments) * 2 * math.pi;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        a0,
        a1 - a0,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.color != color;
}
