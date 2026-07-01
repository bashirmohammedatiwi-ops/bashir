import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const kAlhayaaLogoAsset = 'assets/images/alhayaa_logo.png';

/// شاشة ترحيب — أسود نقي، لوكو فقط، أنيميشن سينمائي فخم.
class WelcomeScreen extends StatefulWidget {
  final VoidCallback? onAnimationComplete;
  const WelcomeScreen({super.key, this.onAnimationComplete});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with TickerProviderStateMixin {
  late final AnimationController _c;
  late final AnimationController _breathe;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ));

    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 3400));
    _breathe = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));

    _c.forward().whenComplete(_finish);
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted) _breathe.repeat(reverse: true);
    });
  }

  void _finish() {
    if (_done) return;
    _done = true;
    widget.onAnimationComplete?.call();
  }

  @override
  void dispose() {
    _c.dispose();
    _breathe.dispose();
    super.dispose();
  }

  double _t(double time, double a, double b, Curve curve) {
    if (time <= a) return 0;
    if (time >= b) return 1;
    return curve.transform((time - a) / (b - a));
  }

  @override
  Widget build(BuildContext context) {
    final logoW = MediaQuery.sizeOf(context).width * 0.80;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Colors.black,
      ),
      child: Scaffold(
        backgroundColor: Colors.black,
        body: AnimatedBuilder(
          animation: Listenable.merge([_c, _breathe]),
          builder: (context, _) {
            final t = _c.value;

            // ── مراحل الأنيميشن ──
            final exit = _t(t, 0.90, 1.0, Curves.easeInCubic);
            final reveal = _t(t, 0.12, 0.72, Curves.easeInOutCubic);
            final shine = _t(t, 0.58, 0.82, Curves.easeInOut);
            final lineExpand = _t(t, 0.06, 0.28, Curves.easeOutCubic);
            final lineFade = _t(t, 0.55, 0.72, Curves.easeIn);

            final blur = ui.lerpDouble(22, 0, reveal)!;
            final opacity = _t(t, 0.10, 0.45, Curves.easeOut);
            final baseScale = ui.lerpDouble(1.07, 1.0, reveal)!;
            final breatheScale = 1.0 + _breathe.value * 0.012 * reveal;
            final scale = baseScale * breatheScale;

            return Opacity(
              opacity: 1 - exit,
              child: Stack(
                fit: StackFit.expand,
                alignment: Alignment.center,
                children: [
                  // خطوط ذهبية رفيعة — افتتاح سينمائي
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _LuxuryLine(width: logoW * lineExpand, opacity: (1 - lineFade) * 0.55),
                        SizedBox(height: logoW * 0.52 + 24),
                        _LuxuryLine(width: logoW * lineExpand, opacity: (1 - lineFade) * 0.55),
                      ],
                    ),
                  ),

                  // الشعار
                  Transform.scale(
                    scale: scale,
                    child: Opacity(
                      opacity: opacity,
                      child: _CinematicLogo(
                        width: logoW,
                        blur: blur,
                        shine: shine,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

/// خط ذهبي رفيع — لمسة فخمة.
class _LuxuryLine extends StatelessWidget {
  final double width;
  final double opacity;

  const _LuxuryLine({required this.width, required this.opacity});

  @override
  Widget build(BuildContext context) {
    if (width <= 0 || opacity <= 0) return const SizedBox.shrink();
    return Opacity(
      opacity: opacity.clamp(0, 1),
      child: Container(
        width: width,
        height: 0.5,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.transparent,
              Colors.white.withValues(alpha: 0.7),
              const Color(0xFFD4AF37).withValues(alpha: 0.9),
              Colors.white.withValues(alpha: 0.7),
              Colors.transparent,
            ],
            stops: const [0.0, 0.25, 0.5, 0.75, 1.0],
          ),
        ),
      ),
    );
  }
}

/// الشعار — ضبابية → وضوح + لمعان يمرّ مرة واحدة.
class _CinematicLogo extends StatelessWidget {
  final double width;
  final double blur;
  final double shine;

  const _CinematicLogo({
    required this.width,
    required this.blur,
    required this.shine,
  });

  @override
  Widget build(BuildContext context) {
    Widget img = Image.asset(
      kAlhayaaLogoAsset,
      width: width,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
    );

    if (blur > 0.3) {
      img = ImageFiltered(
        imageFilter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: img,
      );
    }

    return SizedBox(
      width: width,
      child: Stack(
        alignment: Alignment.center,
        children: [
          img,
          if (shine > 0 && shine < 1)
            ClipRect(
              child: Align(
                alignment: Alignment(-1.2 + shine * 2.4, 0),
                widthFactor: 0.22,
                child: Transform.rotate(
                  angle: -0.08,
                  child: Container(
                    height: width * 0.55,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.white.withValues(alpha: 0.06 + math.sin(shine * math.pi) * 0.14),
                          Colors.transparent,
                        ],
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
