import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/store_world.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';
import '../home_link.dart';
import 'world_showcase.dart';

const _interval = Duration(seconds: 5);

/// بنرات العالم: بطاقات بزوايا كبيرة مع لمحة من التالية، عنوان + وصف + سهم دائري،
/// ونقاط أسفلها (النشطة ممتدّة بلون العالم).
class WorldBannerCarousel extends ConsumerStatefulWidget {
  const WorldBannerCarousel({super.key});

  @override
  ConsumerState<WorldBannerCarousel> createState() =>
      _WorldBannerCarouselState();
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
    if (count < 2) return;
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
    final worlds =
        ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    final slug = resolveWorldSlug(
      selected: ref.watch(selectedWorldSlugProvider),
      worlds: worlds,
    );
    if (slug == null) return const SizedBox.shrink();
    final world =
        ref.watch(worldDetailProvider(slug)).valueOrNull ??
        worlds.firstWhere((w) => w.slug == slug);
    final banners =
        ref
            .watch(worldFeedProvider(slug))
            .valueOrNull
            ?.banners
            .where((b) => b.hasImage)
            .toList() ??
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

    final width = MediaQuery.sizeOf(context).width;
    final height = (width * 0.9 - 12) / 2.15;
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
                HapticFeedback.selectionClick();
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
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 4,
                      ),
                      child: Transform.scale(
                        scale: 1 - d * 0.08,
                        child: Opacity(
                          opacity: 1 - d * 0.35,
                          child: GestureDetector(
                            onTap: () => openBannerLink(context, b),
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(22),
                                boxShadow: [
                                  BoxShadow(
                                    color: color.withValues(
                                      alpha: 0.22 * (1 - d),
                                    ),
                                    blurRadius: 16,
                                    offset: const Offset(0, 6),
                                    spreadRadius: -6,
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(22),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    // اختلاف منظور: الصورة تتحرك أبطأ من بطاقتها.
                                    ClipRect(
                                      child: Transform.translate(
                                        offset: Offset(
                                          (rtl ? -1 : 1) * delta * 40,
                                          0,
                                        ),
                                        child: Transform.scale(
                                          scale: 1.12,
                                          child: image,
                                        ),
                                      ),
                                    ),
                                    // حافة داخلية رفيعة — لمسة زجاجية تحدد البطاقة بأناقة.
                                    DecoratedBox(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(22),
                                        border: Border.all(
                                          color: Colors.white.withValues(
                                            alpha: 0.35,
                                          ),
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
                    color: i == _index
                        ? color.withValues(alpha: 0.25)
                        : t.hairline,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: AlignmentDirectional.centerStart,
                  child: i == _index
                      ? TweenAnimationBuilder<double>(
                          key: ValueKey('dot-$_index-$_cycle'),
                          tween: Tween(begin: 0, end: 1),
                          duration: banners.length > 1
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
