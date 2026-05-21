import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/bootstrap/app_bootstrap.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/providers/prefs_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/splash_motion_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  bool _canNavigate = false;
  bool _prefsReady = false;
  late bool _goHome;
  late bool _goOnboarding;

  late final AnimationController _ambient;

  @override
  void initState() {
    super.initState();
    _ambient = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);
    AppBootstrap.warmCatalog();
    _prepareNavigation();
  }

  @override
  void dispose() {
    _ambient.dispose();
    super.dispose();
  }

  Future<void> _prepareNavigation() async {
    await AppBootstrap.ensureCatalog();
    final prefs = ref.read(prefsProvider);
    if (!mounted) return;
    final isLoggedIn =
        ref.read(authProvider).valueOrNull != null || prefs.isLoggedIn;
    _goHome = isLoggedIn;
    _goOnboarding = !prefs.onboardingDone;
    _prefsReady = true;
    _tryNavigate();
  }

  void _tryNavigate() {
    if (!_canNavigate || !_prefsReady || !mounted) return;
    if (_goHome) {
      context.go(AppRoutes.home);
    } else if (_goOnboarding) {
      context.go(AppRoutes.onboarding);
    } else {
      context.go(AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: AnimatedBuilder(
        animation: _ambient,
        builder: (context, _) {
          return Stack(
            fit: StackFit.expand,
            children: [
              // Warm gradient base
              const DecoratedBox(
                decoration: BoxDecoration(gradient: AppColors.ivoryGradient),
              ),

              // Floating blobs (ambient motion)
              Positioned(
                top: -90 + math.sin(_ambient.value * math.pi * 2) * 12,
                right: -60,
                child: _Blob(
                  size: 240,
                  colors: const [
                    AppColors.goldSoft,
                    AppColors.background,
                  ],
                ),
              ),
              Positioned(
                bottom: -120 + math.cos(_ambient.value * math.pi * 2) * 14,
                left: -80,
                child: _Blob(
                  size: 260,
                  colors: const [
                    AppColors.roseSoft,
                    AppColors.background,
                  ],
                ),
              ),
              Positioned(
                top: 200 + math.sin(_ambient.value * math.pi * 2 + 1) * 18,
                left: -40,
                child: _Blob(
                  size: 160,
                  colors: const [
                    AppColors.primarySoft,
                    AppColors.background,
                  ],
                ),
              ),

              // Center logo
              Center(
                child: SplashMotionLogo(
                  onAnimationComplete: () {
                    _canNavigate = true;
                    _tryNavigate();
                  },
                ),
              ),

              // Bottom: subtle "Loading" hairline
              Positioned(
                bottom: 36,
                left: 0,
                right: 0,
                child: Center(
                  child: SizedBox(
                    width: 80,
                    height: 2,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        backgroundColor: AppColors.divider,
                        color: AppColors.gold,
                        value: null,
                        minHeight: 2,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  const _Blob({required this.size, required this.colors});
  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            colors.first.withValues(alpha: 0.55),
            colors.last.withValues(alpha: 0),
          ],
        ),
      ),
    );
  }
}
