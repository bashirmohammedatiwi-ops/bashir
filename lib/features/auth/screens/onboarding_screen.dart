import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/reveal.dart';
import '../providers/auth_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen>
    with TickerProviderStateMixin {
  final _controller = PageController();
  late final AnimationController _ambient;
  int _page = 0;

  static const _slides = <_Slide>[
    _Slide(
      title: 'كل ما يلمع... هنا',
      subtitle: 'تشكيلة فاخرة من ماركات عالمية بأسلوب راقٍ يعكس أنوثتك.',
      emoji: '💄',
      gradient: AppColors.nightGradient,
      tag: 'الموسم الذهبي',
    ),
    _Slide(
      title: 'بشرة كالحرير',
      subtitle: 'صيغ علمية للعناية بالبشرة تمنحكِ توهجاً يدوم.',
      emoji: '✦',
      gradient: LinearGradient(
        colors: [Color(0xFF6B4A7E), Color(0xFF2A1338)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ),
      tag: 'حصري',
    ),
    _Slide(
      title: 'يصلكِ بأمان',
      subtitle: 'توصيل سريع وموثوق لجميع المحافظات بحُلّة فاخرة.',
      emoji: '🎁',
      gradient: LinearGradient(
        colors: [Color(0xFF3A2A24), Color(0xFF1C1C24)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ),
      tag: 'تجربة مميزة',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _ambient = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    _ambient.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(authProvider.notifier).completeOnboarding();
    if (mounted) context.go(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView.builder(
        controller: _controller,
        onPageChanged: (p) => setState(() => _page = p),
        itemCount: _slides.length,
        itemBuilder: (context, index) {
          return _OnboardingPage(
            slide: _slides[index],
            ambient: _ambient,
            isLast: index == _slides.length - 1,
            onNext: () => _controller.nextPage(
              duration: AppMotion.medium,
              curve: AppMotion.precise,
            ),
            onFinish: _finish,
            onSkip: _finish,
            page: _page,
            totalPages: _slides.length,
          );
        },
      ),
    );
  }
}

class _Slide {
  const _Slide({
    required this.title,
    required this.subtitle,
    required this.emoji,
    required this.gradient,
    required this.tag,
  });
  final String title;
  final String subtitle;
  final String emoji;
  final Gradient gradient;
  final String tag;
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({
    required this.slide,
    required this.ambient,
    required this.isLast,
    required this.onNext,
    required this.onFinish,
    required this.onSkip,
    required this.page,
    required this.totalPages,
  });

  final _Slide slide;
  final Animation<double> ambient;
  final bool isLast;
  final VoidCallback onNext;
  final VoidCallback onFinish;
  final VoidCallback onSkip;
  final int page;
  final int totalPages;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ambient,
      builder: (context, _) {
        final t = ambient.value;
        return Container(
          decoration: BoxDecoration(gradient: slide.gradient),
          child: SafeArea(
            child: Stack(
              children: [
                // Decorative big rings
                Positioned(
                  top: -100 + math.sin(t * math.pi * 2) * 10,
                  right: -100,
                  child: Container(
                    width: 320,
                    height: 320,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.22),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: -50,
                  right: -50,
                  child: Container(
                    width: 230,
                    height: 230,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.gold.withValues(alpha: 0.06),
                    ),
                  ),
                ),
                Positioned(
                  bottom: -120,
                  left: -80,
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.04),
                    ),
                  ),
                ),
                // Skip button
                Positioned(
                  top: 8,
                  left: 12,
                  child: TextButton(
                    onPressed: onSkip,
                    child: Text(
                      'تخطّي',
                      style: AppTextStyles.caption(
                        color: Colors.white.withValues(alpha: 0.7),
                        size: 12,
                      ).copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.xxxl,
                    vertical: AppSizes.xl,
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      // Big emoji circle
                      Reveal(
                        offset: const Offset(0, 24),
                        duration: const Duration(milliseconds: 700),
                        child: Container(
                          width: 220,
                          height: 220,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [
                                AppColors.gold.withValues(alpha: 0.18),
                                Colors.transparent,
                              ],
                            ),
                          ),
                          child: Center(
                            child: Container(
                              width: 160,
                              height: 160,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.06),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.gold.withValues(alpha: 0.35),
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  slide.emoji,
                                  style: const TextStyle(fontSize: 78),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const Spacer(),
                      Reveal(
                        delay: const Duration(milliseconds: 200),
                        child: Luxe.editorialBadge(
                          label: slide.tag,
                          color: AppColors.gold,
                          backgroundColor:
                              AppColors.gold.withValues(alpha: 0.16),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Reveal(
                        delay: const Duration(milliseconds: 300),
                        child: Text(
                          slide.title,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.editorial(
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Reveal(
                        delay: const Duration(milliseconds: 420),
                        child: Container(
                          height: 1.5,
                          width: 60,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.gold.withValues(alpha: 0),
                                AppColors.gold,
                                AppColors.gold.withValues(alpha: 0),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Reveal(
                        delay: const Duration(milliseconds: 480),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Text(
                            slide.subtitle,
                            textAlign: TextAlign.center,
                            style: AppTextStyles.body(
                              color: Colors.white.withValues(alpha: 0.78),
                              size: 13.5,
                            ).copyWith(height: 1.6),
                          ),
                        ),
                      ),
                      const Spacer(),
                      // Dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(totalPages, (i) {
                          final active = i == page;
                          return AnimatedContainer(
                            duration: AppMotion.fast,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: active ? 24 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: active
                                  ? AppColors.gold
                                  : Colors.white.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 24),
                      Reveal(
                        delay: const Duration(milliseconds: 580),
                        child: SizedBox(
                          width: double.infinity,
                          child: isLast
                              ? Luxe.primaryButton(
                                  label: 'ابدئي الآن',
                                  icon: Icons.arrow_back_rounded,
                                  color: AppColors.gold,
                                  onTap: onFinish,
                                )
                              : Luxe.primaryButton(
                                  label: 'التالي',
                                  icon: Icons.arrow_back_rounded,
                                  onTap: onNext,
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
