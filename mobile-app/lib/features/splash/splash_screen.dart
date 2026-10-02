import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_fonts.dart';

/// ألوان مستوحاة من اللوغو — متطابقة مع خلفية الرئيسية.
abstract final class SplashTheme {
  static const background = Color(0xFFF8F6FB);
  static const brand = Color(0xFF9B6BD8);
  static const brandDark = Color(0xFF6E45B0);
  static const charcoal = Color(0xFF2A2431);
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
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF6F0FE), Color(0xFFF8F6FB), Color(0xFFFBF8FF)],
            stops: [0.0, 0.55, 1.0],
          ),
        ),
        child: SafeArea(
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
                          gradient: const LinearGradient(
                            colors: [Color(0xFF9B6BD8), Color(0xFFF0A7C4)],
                          ),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        tagline,
                        textAlign: TextAlign.center,
                        style: appFont(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: SplashTheme.brandDark.withValues(alpha: 0.8),
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
      ),
    );
  }
}
