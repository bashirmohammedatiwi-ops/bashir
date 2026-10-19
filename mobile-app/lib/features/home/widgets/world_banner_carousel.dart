import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/motion/app_motion.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/store_world.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';
import '../home_link.dart';
import 'home_theme.dart';
import 'world_showcase.dart';

const _interval = Duration(seconds: 5);

/// بنرات العالم: بطاقات بزوايا كبيرة مع لمحة من التالية، عنوان + وصف + سهم دائري،
/// ونقاط أسفلها (النشطة ممتدّة بلون العالم).
///
/// [slug] يثبّت العالم المعروض: أثناء تبديل العالم تبقى الطبقة الخارجة ببنراتها
/// حتى تختفي بدل أن تقفز لبنرات العالم الجديد. بدونه: العالم المختار.
class WorldBannerCarousel extends ConsumerStatefulWidget {
  final String? slug;

  const WorldBannerCarousel({super.key, this.slug});

  @override
  ConsumerState<WorldBannerCarousel> createState() => _WorldBannerCarouselState();
}

class _WorldBannerCarouselState extends ConsumerState<WorldBannerCarousel> {
  final _page = PageController(viewportFraction: 0.9);
  Timer? _timer;
  int _index = 0;
  String? _key;
  bool _touching = false;

  /// يتغير عند كل إعادة ضبط للمؤقت حتى يبدأ امتلاء النقطة من جديد.
  int _cycle = 0;

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  void _arm(int count) {
    _timer?.cancel();
    if (mounted) setState(() => _cycle++);
    // «تقليل الحركة»: لا تقليب تلقائي — التنقل بالسحب فقط.
    if (count < 2 || MediaQuery.disableAnimationsOf(context)) return;
    _timer = Timer.periodic(_interval, (_) {
      if (!mounted || !_page.hasClients || _touching) return;
      _page.animateToPage(
        (_index + 1) % count,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final worlds = ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    final slug =
        widget.slug ?? resolveWorldSlug(selected: ref.watch(selectedWorldSlugProvider), worlds: worlds);
    if (slug == null) return const SizedBox.shrink();
    final world =
        ref.watch(worldDetailProvider(slug)).valueOrNull ??
        worlds.where((w) => w.slug == slug).firstOrNull;
    if (world == null) return const SizedBox.shrink();
    final banners =
        ref.watch(worldFeedProvider(slug)).valueOrNull?.banners.where((b) => b.hasImage).toList() ??
        const <AppBanner>[];
    final t = context.worldTheme;

    final key = '$slug-${banners.length}';
    if (_key != key) {
      _key = key;
      _index = 0;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (_page.hasClients) _page.jumpToPage(0);
        _arm(banners.length);
      });
    }
    if (banners.isEmpty) return const SizedBox.shrink();

    // إطار 16:9 مثل الموقع — البنر رسالة مصمّمة (نص وسعر وشعار) فلا نقصّ أطرافه.
    // البطاقة = 90% من العرض ناقص الحشوة الأفقية (5+5)، و8 للحشوة العمودية (4+4).
    const aspect = 16 / 9;
    final width = MediaQuery.sizeOf(context).width;
    final cardW = width * 0.9 - 10;
    final height = cardW / aspect + 8;
    final lang = ref.watch(languageCodeProvider);
    final s = ref.watch(stringsProvider);
    final color = worldBandColor(world);

    return Column(
      children: [
        SizedBox(
          height: height,
          child: Listener(
            onPointerDown: (_) => _touching = true,
            onPointerUp: (_) {
              _touching = false;
              _arm(banners.length);
            },
            onPointerCancel: (_) => _touching = false,
            child: PageView.builder(
              controller: _page,
              itemCount: banners.length,
              onPageChanged: (i) {
                // اهتزاز للسحب باليد فقط — التقليب التلقائي يمرّ بصمت.
                if (_touching) AppHaptics.select();
                setState(() => _index = i);
              },
              itemBuilder: (context, i) {
                final b = banners[i];
                // صورة نقية بلا أي كتابة: البنر نفسه هو الرسالة.
                // البطاقة النشطة بحجمها الكامل، والمجاورة تصغر وتخفت قليلاً — عمق راقٍ.
                return AnimatedBuilder(
                  animation: _page,
                  child: AppNetworkImage(
                    url: b.imageUrl,
                    fit: BoxFit.cover,
                    backgroundColor: Color.lerp(color, Colors.white, 0.82),
                  ),
                  builder: (context, image) {
                    var delta = (i - _index).toDouble();
                    if (_page.hasClients && _page.position.haveDimensions) {
                      delta = ((_page.page ?? 0) - i).clamp(-1.0, 1.0);
                    }
                    final d = delta.abs().clamp(0.0, 1.0);
                    final rtl = Directionality.of(context) == TextDirection.rtl;
                    return Semantics(
                      button: b.hasLink,
                      image: true,
                      label: b.titleForLang(lang) ?? s.homeMediaPromotion,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                        child: Transform.scale(
                          scale: 1 - d * 0.08,
                          child: Opacity(
                            opacity: 1 - d * 0.35,
                            child: GestureDetector(
                              onTap: b.hasLink ? () => openBannerLink(context, b) : null,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(HomeTheme.radiusBanner),
                                  boxShadow: [
                                    BoxShadow(
                                      color: color.withValues(alpha: 0.22 * (1 - d)),
                                      blurRadius: 16,
                                      offset: const Offset(0, 6),
                                      spreadRadius: -6,
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(HomeTheme.radiusBanner),
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      // اختلاف منظور خفيف: الصورة تتحرك أبطأ من بطاقتها.
                                      // تكبير 4% يكفي لإزاحة 14 بكسل دون قصّ أطراف البنر.
                                      ClipRect(
                                        child: Transform.translate(
                                          offset: Offset((rtl ? -1 : 1) * delta * 14, 0),
                                          child: Transform.scale(scale: 1.04, child: image),
                                        ),
                                      ),
                                      // حافة داخلية رفيعة — لمسة زجاجية تحدد البطاقة بأناقة.
                                      DecoratedBox(
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            HomeTheme.radiusBanner,
                                          ),
                                          border: Border.all(
                                            color: Colors.white.withValues(alpha: 0.35),
                                            width: 1,
                                          ),
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
                  },
                );
              },
            ),
          ),
        ),
        if (banners.length > 1) ...[
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < banners.length; i++)
                // النقطة النشطة تمتلئ بلون العالم حتى البنر التالي — مؤشر وقت هادئ.
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _index ? 26 : 6,
                  height: 6,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: i == _index ? color.withValues(alpha: 0.25) : t.hairline,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: AlignmentDirectional.centerStart,
                  child: i == _index
                      ? TweenAnimationBuilder<double>(
                          key: ValueKey('dot-$_index-$_cycle'),
                          tween: Tween(begin: 0, end: 1),
                          // «تقليل الحركة»: لا تقليب تلقائي، فالنقطة النشطة ممتلئة مباشرة.
                          duration: banners.length > 1 && !MediaQuery.disableAnimationsOf(context)
                              ? _interval
                              : Duration.zero,
                          builder: (_, v, __) => FractionallySizedBox(
                            widthFactor: v,
                            heightFactor: 1,
                            child: ColoredBox(color: color),
                          ),
                        )
                      : null,
                ),
            ],
          ),
        ],
      ],
    );
  }
}
