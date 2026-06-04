import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../data/models/banner_model.dart';
import 'hero_banner_slider.dart';

/// يعرض بنرات الـ API إن وُجدت، وإلا البانر التحريري الافتراضي.
class StoreHeroBanner extends StatefulWidget {
  const StoreHeroBanner({this.banners, super.key});

  final List<BannerModel>? banners;

  @override
  State<StoreHeroBanner> createState() => _StoreHeroBannerState();
}

class _StoreHeroBannerState extends State<StoreHeroBanner> {
  final _controller = PageController(viewportFraction: 0.9);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final withImages = (widget.banners ?? [])
        .where((b) => b.imageUrl.isNotEmpty)
        .toList();
    if (withImages.isEmpty) return const HeroBannerSlider();

    return Column(
      children: [
        SizedBox(
          height: 176,
          child: PageView.builder(
            controller: _controller,
            itemCount: withImages.length,
            onPageChanged: (_) => setState(() {}),
            itemBuilder: (context, i) {
              final b = withImages[i];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: GestureDetector(
                  onTap: () {
                    if (b.actionRoute != null) context.push(b.actionRoute!);
                  },
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        CachedImageWidget(imageUrl: b.imageUrl, fit: BoxFit.cover),
                        DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.42),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                        Positioned(
                          right: 16,
                          bottom: 16,
                          left: 16,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (b.title.isNotEmpty)
                                Text(
                                  b.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              if (b.subtitle.isNotEmpty)
                                Text(
                                  b.subtitle,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.85),
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        SmoothPageIndicator(
          controller: _controller,
          count: withImages.length,
          effect: const ExpandingDotsEffect(
            dotHeight: 5,
            dotWidth: 5,
            expansionFactor: 2.2,
            activeDotColor: AppColors.primary,
            dotColor: AppColors.divider,
          ),
        ),
      ],
    );
  }
}
