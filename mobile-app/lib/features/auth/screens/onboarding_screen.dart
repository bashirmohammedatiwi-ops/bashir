import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../providers/auth_provider.dart';
import '../widgets/onboarding_progress.dart';
import '../widgets/onboarding_slide.dart';
import '../widgets/welcome_ambient_background.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _slides = [
    OnboardingSlideData(
      icon: Icons.spa_outlined,
      accent: AppColors.primary,
      stepLabel: '01',
      title: 'منتجات مختارة',
      subtitle: 'آلاف المنتجات من مستحضرات التجميل والعناية بين يديكِ.',
    ),
    OnboardingSlideData(
      icon: Icons.diamond_outlined,
      accent: Color(0xFFC97B8E),
      stepLabel: '02',
      title: 'براندات موثوقة',
      subtitle: 'ماركات عالمية وأصيلة بجودة تستحقينها.',
    ),
    OnboardingSlideData(
      icon: Icons.local_shipping_outlined,
      accent: Color(0xFF5A7BA3),
      stepLabel: '03',
      title: 'توصيل سريع',
      subtitle: 'نصل إليكِ في جميع محافظات العراق بأمان.',
    ),
  ];

  Color get _accent => _slides[_page.clamp(0, _slides.length - 1)].accent;

  Future<void> _finish({bool asGuest = false}) async {
    await ref.read(authProvider.notifier).completeOnboarding();
    if (!mounted) return;
    if (asGuest) {
      await ref.read(authProvider.notifier).continueAsGuest();
      if (mounted) context.go(AppRoutes.home);
    } else {
      context.go(AppRoutes.login);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _slides.length - 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final page = _controller.hasClients
              ? (_controller.page ?? _page.toDouble())
              : _page.toDouble();

          return Stack(
            fit: StackFit.expand,
            children: [
              WelcomeAmbientBackground(
                accent: _accent,
                pageProgress: page,
              ),
              SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    OnboardingProgress(
                      count: _slides.length,
                      progress: page,
                      accent: _accent,
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(4, 12, 4, 0),
                      child: Row(
                        children: [
                          TextButton(
                            onPressed: () => _finish(),
                            child: Text(
                              AppStrings.skip,
                              style: AppTextStyles.caption(
                                color: AppColors.textMuted,
                                size: 13,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            AppStrings.appName,
                            style: AppTextStyles.caption(
                              color: AppColors.textMuted,
                              size: 12,
                            ).copyWith(
                              letterSpacing: 1.4,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Spacer(),
                          const SizedBox(width: 72),
                        ],
                      ),
                    ),
                    Expanded(
                      child: PageView.builder(
                        controller: _controller,
                        onPageChanged: (p) => setState(() => _page = p),
                        itemCount: _slides.length,
                        itemBuilder: (context, index) {
                          final delta = (index - page).abs();
                          return OnboardingSlide(
                            key: ValueKey(index),
                            data: _slides[index],
                            slideIndex: index,
                            pageDelta: delta,
                          );
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSizes.xl,
                      ),
                      child: _WelcomeCtaButton(
                        label: isLast ? AppStrings.getStarted : AppStrings.next,
                        accent: _accent,
                        showArrow: !isLast,
                        onPressed: isLast
                            ? () => _finish()
                            : () => _controller.nextPage(
                                  duration: AppMotion.medium,
                                  curve: AppMotion.precise,
                                ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => _finish(asGuest: true),
                      child: Text(
                        AppStrings.continueAsGuest,
                        style: AppTextStyles.caption(
                          color: AppColors.textSecondary,
                          size: 13,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSizes.sm),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _WelcomeCtaButton extends StatefulWidget {
  const _WelcomeCtaButton({
    required this.label,
    required this.onPressed,
    required this.accent,
    this.showArrow = true,
  });

  final String label;
  final VoidCallback onPressed;
  final Color accent;
  final bool showArrow;

  @override
  State<_WelcomeCtaButton> createState() => _WelcomeCtaButtonState();
}

class _WelcomeCtaButtonState extends State<_WelcomeCtaButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onPressed,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: AppMotion.micro,
        curve: AppMotion.standard,
        child: AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.precise,
          height: 54,
          decoration: BoxDecoration(
            color: widget.accent,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: widget.accent.withValues(alpha: 0.28),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.label,
                style: AppTextStyles.title(size: 15).copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (widget.showArrow) ...[
                const SizedBox(width: 6),
                const Icon(
                  Icons.arrow_back_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
