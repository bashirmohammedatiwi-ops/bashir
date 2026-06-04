import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';

/// بانر هيرو سينمائي بأسلوب editorial:
/// - خلفية متدرجة (فاخرة)
/// - دوائر متحركة + لمعات ذهبية
/// - عنوان بخط Cormorant + tagline متباعد الأحرف
/// - CTA على شكل underline ذهبي
class HeroBannerSlider extends StatefulWidget {
  const HeroBannerSlider({super.key});

  @override
  State<HeroBannerSlider> createState() => _HeroBannerSliderState();
}

class _HeroBannerSliderState extends State<HeroBannerSlider>
    with TickerProviderStateMixin {
  final _controller = PageController(viewportFraction: 0.92);
  late final AnimationController _ambient;
  Timer? _timer;
  int _current = 0;

  static const List<_HeroSlide> _slides = [
    _HeroSlide(
      tag: 'مجموعة الموسم',
      title: 'لمعة المساء',
      subtitle: 'تشكيلة الربيع — خصومات تصل ٥٠٪',
      cta: 'تسوّقي الآن',
      route: '/products?title=%D8%B9%D8%B1%D9%88%D8%B6',
      gradient: AppColors.nightGradient,
      symbol: '✦',
    ),
    _HeroSlide(
      tag: 'حصري',
      title: 'بشرة كالحرير',
      subtitle: 'صيغ علمية لإشراق طبيعي',
      cta: 'اكتشفي',
      route: '/products?categoryId=622a4814-c515-4f6b-aaee-52bda4b1fc0e&title=%D8%A7%D9%84%D8%B9%D8%B7%D9%88%D8%B1',
      gradient: LinearGradient(
        colors: [Color(0xFF8B6BA8), Color(0xFF4A2466)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ),
      symbol: '✿',
    ),
    _HeroSlide(
      tag: 'البيوت العالمية',
      title: 'روائح فاخرة',
      subtitle: 'عبقات تحاكي الشغف',
      cta: 'تصفّحي العطور',
      route: '/products?categoryId=fe2b868f-2cc0-40ec-b677-ef1a6f993771&title=ReBella',
      gradient: LinearGradient(
        colors: [Color(0xFF3A2A24), Color(0xFF6B4A3A)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ),
      symbol: '❋',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _ambient = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) return;
      final next = (_current + 1) % _slides.length;
      _controller.animateToPage(
        next,
        duration: AppMotion.slow,
        curve: AppMotion.gentle,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _ambient.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 198,
          child: PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _current = i),
            itemCount: _slides.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: _HeroCard(slide: _slides[index], ambient: _ambient),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        SmoothPageIndicator(
          controller: _controller,
          count: _slides.length,
          effect: const ExpandingDotsEffect(
            dotHeight: 5,
            dotWidth: 5,
            expansionFactor: 4,
            spacing: 5,
            activeDotColor: AppColors.gold,
            dotColor: AppColors.border,
          ),
        ),
      ],
    );
  }
}

class _HeroSlide {
  const _HeroSlide({
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.route,
    required this.gradient,
    required this.symbol,
  });

  final String tag;
  final String title;
  final String subtitle;
  final String cta;
  final String route;
  final Gradient gradient;
  final String symbol;
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.slide, required this.ambient});
  final _HeroSlide slide;
  final Animation<double> ambient;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: () => context.push(slide.route),
      scale: 0.985,
      child: AnimatedBuilder(
        animation: ambient,
        builder: (context, _) {
          final t = ambient.value;
          return Container(
            decoration: BoxDecoration(
              gradient: slide.gradient,
              borderRadius: BorderRadius.circular(AppSizes.cardRadiusLg),
              boxShadow: const [AppColors.plumShadow],
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                // Decorative big ring (moving)
                Positioned(
                  top: -50 + math.sin(t * math.pi * 2) * 8,
                  right: -50,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.25),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: -30,
                  right: -30,
                  child: Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.gold.withValues(alpha: 0.08),
                    ),
                  ),
                ),
                Positioned(
                  bottom: -50,
                  left: -50,
                  child: Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.05),
                    ),
                  ),
                ),
                // Symbol big watermark
                Positioned(
                  right: 30 + math.cos(t * math.pi * 2) * 4,
                  top: 40,
                  child: Text(
                    slide.symbol,
                    style: TextStyle(
                      fontSize: 110,
                      color: AppColors.gold.withValues(alpha: 0.18),
                      height: 1,
                    ),
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Luxe.editorialBadge(
                        label: slide.tag,
                        color: AppColors.gold,
                        backgroundColor:
                            AppColors.gold.withValues(alpha: 0.14),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        slide.title,
                        style: AppTextStyles.editorial(
                          color: Colors.white,
                          size: 28,
                          weight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        slide.subtitle,
                        style: AppTextStyles.body(
                          color: Colors.white.withValues(alpha: 0.78),
                          size: 12,
                        ).copyWith(height: 1.45),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Text(
                            slide.cta,
                            style: AppTextStyles.caption(
                              color: AppColors.gold,
                              size: 12,
                            ).copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 28,
                            height: 1,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.gold,
                                  AppColors.gold.withValues(alpha: 0),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.arrow_back_rounded,
                            size: 14,
                            color: AppColors.gold,
                          ),
                        ],
                      ),
                    ],
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
