import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ألوان شعار كوزمتك الحياة — أبيض/فضي على أسود.
abstract final class AlHayaaLogoColors {
  static const lipHighlight = Color(0xFFFFFFFF);
  static const lipMid = Color(0xFFE8E8E8);
  static const lipShadow = Color(0xFFB0B0B0);
  static const banner = Color(0xFFFFFFFF);
  static const textOnBanner = Color(0xFF111111);
  static const glow = Color(0xFFFFFFFF);
}

/// شعار الحياة — شفاه + شريط + «Al hayat» و «الحياة».
class AlHayaaLogo extends StatelessWidget {
  final double width;
  final double lipsProgress;
  final double bannerProgress;
  final double textProgress;
  final double glowIntensity;
  final double shimmerProgress;

  const AlHayaaLogo({
    super.key,
    this.width = 300,
    this.lipsProgress = 1,
    this.bannerProgress = 1,
    this.textProgress = 1,
    this.glowIntensity = 1,
    this.shimmerProgress = 0,
  });

  static const _viewW = 320.0;
  static const _viewH = 168.0;

  @override
  Widget build(BuildContext context) {
    final h = width * (_viewH / _viewW);
    final bannerTop = h * (74 / _viewH);
    final bannerH = h * (34 / _viewH);

    return SizedBox(
      width: width,
      height: h,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // توهج خارجي
          if (glowIntensity > 0)
            Positioned(
              left: width * 0.05,
              right: width * 0.05,
              top: h * 0.05,
              bottom: h * 0.05,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AlHayaaLogoColors.glow.withValues(alpha: 0.12 * glowIntensity),
                      blurRadius: 56,
                      spreadRadius: 12,
                    ),
                    BoxShadow(
                      color: AlHayaaLogoColors.glow.withValues(alpha: 0.06 * glowIntensity),
                      blurRadius: 100,
                      spreadRadius: 24,
                    ),
                  ],
                ),
              ),
            ),

          // الشفاه
          Opacity(
            opacity: lipsProgress.clamp(0, 1),
            child: Transform.scale(
              scale: 0.75 + 0.25 * Curves.easeOutBack.transform(lipsProgress.clamp(0, 1)),
              child: CustomPaint(
                size: Size(width, h),
                painter: _LipsPainter(progress: lipsProgress),
              ),
            ),
          ),

          // Shimmer
          if (shimmerProgress > 0 && shimmerProgress < 1)
            Positioned.fill(
              child: ClipRect(
                child: CustomPaint(
                  painter: _ShimmerPainter(progress: shimmerProgress),
                ),
              ),
            ),

          // الشريط الأبيض
          Positioned(
            left: width * (22 / _viewW),
            right: width * (22 / _viewW),
            top: bannerTop,
            height: bannerH,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(1),
              child: Align(
                alignment: Alignment.center,
                widthFactor: bannerProgress.clamp(0.001, 1),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: AlHayaaLogoColors.banner,
                    borderRadius: BorderRadius.circular(1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withValues(alpha: 0.25 * bannerProgress),
                        blurRadius: 16,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: SizedBox(
                    width: width * (276 / _viewW),
                    height: bannerH,
                  ),
                ),
              ),
            ),
          ),

          // النصوص على الشريط — LTR ثابت مثل اللوغو الأصلي
          Positioned(
            left: width * (22 / _viewW),
            right: width * (22 / _viewW),
            top: bannerTop,
            height: bannerH,
            child: Opacity(
              opacity: textProgress.clamp(0, 1),
              child: Transform.translate(
                offset: Offset(0, 6 * (1 - textProgress)),
                child: Directionality(
                  textDirection: TextDirection.ltr,
                  child: ClipRect(
                    child: Align(
                      alignment: Alignment.center,
                      widthFactor: bannerProgress.clamp(0.001, 1),
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: width * 0.045),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                'الحياة',
                                style: GoogleFonts.amiri(
                                  color: AlHayaaLogoColors.textOnBanner,
                                  fontSize: width * 0.088,
                                  height: 1,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              SizedBox(width: width * 0.05),
                              Text(
                                'Al hayat',
                                style: GoogleFonts.parisienne(
                                  color: AlHayaaLogoColors.textOnBanner,
                                  fontSize: width * 0.095,
                                  height: 1,
                                ),
                              ),
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
        ],
      ),
    );
  }
}

class _LipsPainter extends CustomPainter {
  final double progress;
  const _LipsPainter({required this.progress});

  static const _rect = Rect.fromLTWH(0, 0, 320, 168);

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / _rect.width;
    final sy = size.height / _rect.height;

    canvas.save();
    canvas.scale(sx, sy);

    final reveal = Curves.easeOutCubic.transform(progress.clamp(0, 1));
    canvas.clipRect(Rect.fromLTWH(0, _rect.height * (1 - reveal), _rect.width, _rect.height * reveal));

    final upper = _upperLip();
    final lower = _lowerLip();

    // ظل خلفي ناعم
    final drop = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14);
    canvas.save();
    canvas.translate(0, 6);
    canvas.drawPath(upper, drop);
    canvas.drawPath(lower, drop);
    canvas.restore();

    final body = Paint()
      ..shader = ui.Gradient.linear(
        const Offset(80, 10),
        const Offset(240, 160),
        const [
          AlHayaaLogoColors.lipHighlight,
          AlHayaaLogoColors.lipMid,
          AlHayaaLogoColors.lipShadow,
          AlHayaaLogoColors.lipMid,
          AlHayaaLogoColors.lipHighlight,
        ],
        const [0.0, 0.25, 0.5, 0.75, 1.0],
      );

    canvas.drawPath(upper, body);
    canvas.drawPath(lower, body);

    // فتحة الفم
    canvas.drawPath(_mouthGap(), Paint()..color = const Color(0xFF000000));

    // أسنان
    final tooth = Paint()..color = AlHayaaLogoColors.lipHighlight;
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(142, 78, 13, 16), const Radius.circular(2.5)),
      tooth,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(165, 78, 13, 16), const Radius.circular(2.5)),
      tooth,
    );

    // لمعة علوية
    final gloss = Paint()
      ..shader = ui.Gradient.radial(
        const Offset(115, 42),
        70,
        [Colors.white.withValues(alpha: 0.65), Colors.transparent],
      );
    canvas.drawPath(upper, gloss);

    // خط شفاه
    final line = Paint()
      ..color = Colors.white.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    canvas.drawPath(_lipLine(), line);

    canvas.restore();
  }

  Path _upperLip() {
    return Path()
      ..moveTo(28, 88)
      ..cubicTo(28, 48, 68, 22, 112, 32)
      ..cubicTo(124, 18, 142, 20, 160, 36)
      ..cubicTo(178, 20, 196, 18, 208, 32)
      ..cubicTo(252, 22, 292, 48, 292, 88)
      ..cubicTo(265, 80, 215, 74, 160, 76)
      ..cubicTo(105, 74, 55, 80, 28, 88)
      ..close();
  }

  Path _lowerLip() {
    return Path()
      ..moveTo(38, 104)
      ..cubicTo(60, 98, 105, 100, 160, 102)
      ..cubicTo(215, 100, 260, 98, 282, 104)
      ..cubicTo(268, 128, 225, 154, 160, 158)
      ..cubicTo(95, 154, 52, 128, 38, 104)
      ..close();
  }

  Path _mouthGap() {
    return Path()
      ..moveTo(136, 76)
      ..cubicTo(148, 70, 172, 70, 184, 76)
      ..cubicTo(192, 84, 192, 96, 184, 102)
      ..cubicTo(172, 108, 148, 108, 136, 102)
      ..cubicTo(128, 96, 128, 84, 136, 76)
      ..close();
  }

  Path _lipLine() {
    return Path()
      ..moveTo(38, 104)
      ..cubicTo(80, 96, 120, 94, 160, 95)
      ..cubicTo(200, 94, 240, 96, 282, 104);
  }

  @override
  bool shouldRepaint(covariant _LipsPainter old) => old.progress != progress;
}

class _ShimmerPainter extends CustomPainter {
  final double progress;
  const _ShimmerPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final x = size.width * (progress * 1.6 - 0.3);
    final paint = Paint()
      ..shader = ui.Gradient.linear(
        Offset(x - 40, 0),
        Offset(x + 40, size.height),
        [
          Colors.transparent,
          Colors.white.withValues(alpha: 0.18),
          Colors.white.withValues(alpha: 0.35),
          Colors.white.withValues(alpha: 0.18),
          Colors.transparent,
        ],
        const [0.0, 0.35, 0.5, 0.65, 1.0],
      );
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);
  }

  @override
  bool shouldRepaint(covariant _ShimmerPainter old) => old.progress != progress;
}

/// خلفية سوداء فاخرة.
class AlHayaaSplashBackground extends StatelessWidget {
  final double breathe;
  const AlHayaaSplashBackground({super.key, required this.breathe});

  @override
  Widget build(BuildContext context) {
    final t = (math.sin(breathe * math.pi * 2) + 1) / 2;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.black,
        gradient: RadialGradient(
          center: const Alignment(0, -0.08),
          radius: 0.95,
          colors: [
            Color.lerp(const Color(0xFF141414), const Color(0xFF222222), t)!,
            const Color(0xFF050505),
            Colors.black,
          ],
          stops: const [0.0, 0.55, 1.0],
        ),
      ),
      child: CustomPaint(
        painter: _AmbientPainter(phase: breathe),
        size: Size.infinite,
      ),
    );
  }
}

class _AmbientPainter extends CustomPainter {
  final double phase;
  const _AmbientPainter({required this.phase});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height * 0.46;
    final pulse = (math.sin(phase * math.pi * 2) + 1) / 2;

    final halo = Paint()
      ..shader = ui.Gradient.radial(
        Offset(cx, cy),
        size.width * (0.28 + pulse * 0.04),
        [
          Colors.white.withValues(alpha: 0.07 + pulse * 0.03),
          Colors.white.withValues(alpha: 0.02),
          Colors.transparent,
        ],
        const [0.0, 0.45, 1.0],
      );
    canvas.drawRect(Offset.zero & size, halo);

    final dust = Paint()..color = Colors.white.withValues(alpha: 0.04);
    for (var i = 0; i < 18; i++) {
      final angle = i * 1.7 + phase * math.pi * 2;
      final r = size.width * (0.15 + (i % 5) * 0.06);
      final x = cx + math.cos(angle) * r;
      final y = cy + math.sin(angle) * r * 0.6;
      final flicker = (math.sin(phase * math.pi * 4 + i) + 1) / 2;
      canvas.drawCircle(Offset(x, y), 0.8 + flicker * 1.2, dust);
    }
  }

  @override
  bool shouldRepaint(covariant _AmbientPainter old) => old.phase != phase;
}
