import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_fonts.dart';

/// ألوان مستوحاة من اللوغو — متطابقة مع خلفية الرئيسية.
abstract final class SplashTheme {
  static const background = Color(0xFFF6FAF9);
  static const teal = Color(0xFF3A9E8F);
  static const tealDark = Color(0xFF2F7F73);
  static const charcoal = Color(0xFF2D2D2D);
}

/// شاشة افتتاح بسيطة وأنيقة.
class SplashScreen extends StatefulWidget {
  final String lang;

  const SplashScreen({super.key, this.lang = 'ar'});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    _scale = Tween<double>(begin: 0.9, end: 1).animate(_fade);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final storeName = AppConfig.displayStoreName(widget.lang);
    final tagline = widget.lang == 'ar' ? 'جمالك يبدأ من هنا' : 'your beauty starts here';

    return Scaffold(
      backgroundColor: SplashTheme.background,
      body: SafeArea(
        child: Center(
          child: FadeTransition(
            opacity: _fade,
            child: ScaleTransition(
              scale: _scale,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset(
                      'assets/images/app_icon_transparent.png',
                      width: 108,
                      height: 108,
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.high,
                    ),
                    const SizedBox(height: 28),
                    Text(
                      storeName,
                      textAlign: TextAlign.center,
                      style: brandTitleStyle(
                        lang: widget.lang,
                        size: 34,
                        color: SplashTheme.charcoal,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      width: 36,
                      height: 2,
                      decoration: BoxDecoration(
                        color: SplashTheme.teal.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      tagline,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.cairo(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: SplashTheme.tealDark.withValues(alpha: 0.8),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
