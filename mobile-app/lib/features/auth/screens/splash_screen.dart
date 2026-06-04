import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/home_feed_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/providers/prefs_provider.dart';
import '../providers/auth_provider.dart' show authProvider, guestModeProvider;
import '../widgets/splash_motion_logo.dart';
import '../widgets/welcome_ambient_background.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _canNavigate = false;
  bool _prefsReady = false;
  late bool _goHome;
  late bool _goOnboarding;

  @override
  void initState() {
    super.initState();
    ref.read(apiHealthProvider.future);
    ref.read(homeFeedProvider.future);
    _prepareNavigation();
  }

  Future<void> _prepareNavigation() async {
    final prefs = ref.read(prefsProvider);
    if (!mounted) return;
    final isLoggedIn = ref.read(authProvider).valueOrNull != null;
    final isGuest = ref.read(guestModeProvider) || prefs.isGuest;
    _goHome = isLoggedIn || isGuest;
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
      body: Stack(
        fit: StackFit.expand,
        children: [
          const WelcomeAmbientBackground(),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
              child: SplashMotionLogo(
                onAnimationComplete: () {
                  _canNavigate = true;
                  _tryNavigate();
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
