import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/widgets/alhayaa_logo.dart';

/// شاشة افتتاحية فاخرة — شعار كوزمتك الحياة.
class SplashScreen extends StatefulWidget {
  final VoidCallback? onAnimationComplete;
  const SplashScreen({super.key, this.onAnimationComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _intro;
  late final AnimationController _breathe;
  late final Animation<double> _lips;
  late final Animation<double> _banner;
  late final Animation<double> _text;
  late final Animation<double> _glow;
  late final Animation<double> _shimmer;
  late final Animation<double> _tagline;
  late final Animation<double> _fadeIn;
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

    _intro = AnimationController(vsync: this, duration: const Duration(milliseconds: 3400));
    _breathe = AnimationController(vsync: this, duration: const Duration(milliseconds: 4000))
      ..repeat();

    _fadeIn = CurvedAnimation(parent: _intro, curve: const Interval(0.0, 0.12, curve: Curves.easeOut));
    _lips = CurvedAnimation(parent: _intro, curve: const Interval(0.08, 0.52, curve: Curves.easeOutCubic));
    _banner = CurvedAnimation(parent: _intro, curve: const Interval(0.42, 0.62, curve: Curves.easeOutQuart));
    _text = CurvedAnimation(parent: _intro, curve: const Interval(0.56, 0.74, curve: Curves.easeOut));
    _glow = CurvedAnimation(parent: _intro, curve: const Interval(0.48, 0.88, curve: Curves.easeInOut));
    _shimmer = CurvedAnimation(parent: _intro, curve: const Interval(0.68, 0.92, curve: Curves.easeInOut));
    _tagline = CurvedAnimation(parent: _intro, curve: const Interval(0.78, 0.98, curve: Curves.easeOut));

    _intro.forward().whenComplete(_notify);
  }

  void _notify() {
    if (_done) return;
    _done = true;
    widget.onAnimationComplete?.call();
  }

  @override
  void dispose() {
    _intro.dispose();
    _breathe.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: Colors.black,
      body: AnimatedBuilder(
        animation: Listenable.merge([_intro, _breathe]),
        builder: (context, _) {
          return Opacity(
            opacity: _fadeIn.value,
            child: Stack(
              fit: StackFit.expand,
              children: [
                AlHayaaSplashBackground(breathe: _breathe.value),

                // خطوط زخرفية رفيعة
                Positioned(
                  left: w * 0.12,
                  right: w * 0.12,
                  top: MediaQuery.sizeOf(context).height * 0.38,
                  child: Opacity(
                    opacity: _glow.value * 0.25,
                    child: Container(
                      height: 0.5,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.white.withValues(alpha: 0.5),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                Center(
                  child: AlHayaaLogo(
                    width: w * 0.78,
                    lipsProgress: _lips.value,
                    bannerProgress: _banner.value,
                    textProgress: _text.value,
                    glowIntensity: _glow.value,
                    shimmerProgress: _shimmer.value,
                  ),
                ),

                // شعار فرعي
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: bottom + 52,
                  child: Opacity(
                    opacity: _tagline.value,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 36,
                          height: 1,
                          color: Colors.white.withValues(alpha: 0.25),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'كوزمتك الحياة',
                          style: GoogleFonts.amiri(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'ALHAYAA COSMETICS',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.22),
                            fontSize: 9,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
