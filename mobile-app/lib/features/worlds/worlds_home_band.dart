import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import '../../core/widgets/ui/ui.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../data/models/banner.dart';
import '../../data/models/store_world.dart';
import '../home/home_link.dart';
import '../home/widgets/home_hero_header.dart';
import 'world_icon.dart';
import 'world_theme.dart';
import 'worlds_provider.dart';

const _bannerAspect = 2.4;

/// بنر العالم يمتد للأعلى، وأزرار العوالم تجلس فوقه.
class WorldTopStage extends ConsumerStatefulWidget {
  const WorldTopStage({super.key});

  @override
  ConsumerState<WorldTopStage> createState() => _WorldTopStageState();
}

class _WorldTopStageState extends ConsumerState<WorldTopStage> {
  final _page = PageController();
  Timer? _timer;
  int _index = 0;
  String? _slug;

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  void _arm(int count) {
    _timer?.cancel();
    if (count < 2) return;
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_page.hasClients) return;
      final next = (_index + 1) % count;
      _page.animateToPage(
        next,
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageCodeProvider);
    final worlds =
        ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    if (worlds.isEmpty) return const SizedBox.shrink();
    final slug = resolveWorldSlug(
      selected: ref.watch(selectedWorldSlugProvider),
      worlds: worlds,
    )!;
    final world = worlds.firstWhere((item) => item.slug == slug);
    final detail = ref.watch(worldDetailProvider(slug)).valueOrNull ?? world;
    final banners =
        ref
            .watch(worldFeedProvider(slug))
            .valueOrNull
            ?.banners
            .where((banner) => banner.hasImage)
            .toList() ??
        const <AppBanner>[];
    if (_slug != slug) {
      _slug = slug;
      _index = 0;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_page.hasClients) _page.jumpToPage(0);
        _arm(banners.length);
      });
    }

    final accent = detail.accent;
    final top = MediaQuery.paddingOf(context).top;
    return SizedBox(
      width: double.infinity,
      height: top + 300,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: banners.isEmpty
                ? DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          accent,
                          Color.alphaBlend(
                            accent.withValues(alpha: 0.55),
                            detail.canvas,
                          ),
                        ],
                      ),
                    ),
                  )
                : PageView.builder(
                    controller: _page,
                    itemCount: banners.length,
                    onPageChanged: (i) => setState(() => _index = i),
                    itemBuilder: (_, i) => GestureDetector(
                      onTap: () => openBannerLink(context, banners[i]),
                      child: AppNetworkImage(
                        url: banners[i].imageUrl,
                        fit: BoxFit.cover,
                        backgroundColor: detail.canvas,
                      ),
                    ),
                  ),
          ),
          // تعتيم علوي أخف — البنر يظهر أكثر عبر الشفافية.
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: top + 196,
            child: const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x6E141018), Color(0x00141018)],
                ),
              ),
            ),
          ),
          Positioned(
            top: top,
            left: 0,
            right: 0,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const HomeHeroHeader(overBanner: true),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Row(
                    children: [
                      // خط تأكيد عمودي قبل العنوان — أناقة تحريرية أهدأ.
                      Container(
                        width: 3,
                        height: 16,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(99),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.white.withValues(alpha: 0.95),
                              Colors.white.withValues(alpha: 0.35),
                            ],
                          ),
                          boxShadow: const [
                            BoxShadow(color: Color(0x40000000), blurRadius: 4),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          lang == 'en'
                              ? 'Choose your world'
                              : 'اختاري القسم المناسب لك',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15.5,
                            height: 1.15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.15,
                            shadows: [
                              Shadow(
                                color: Color(0x96000000),
                                blurRadius: 10,
                                offset: Offset(0, 2),
                              ),
                              Shadow(
                                color: Color(0x66000000),
                                blurRadius: 3,
                                offset: Offset(0, 1),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 9),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 0),
                  child: _WorldGlassTray(
                    worlds: worlds
                        .where((item) => !item.isGift)
                        .take(4)
                        .toList(),
                    lang: lang,
                    selectedSlug: slug,
                    onSelect: (item) {
                      if (item.slug == slug) return;
                      HapticFeedback.selectionClick();
                      ref.read(selectedWorldSlugProvider.notifier).state =
                          item.slug;
                    },
                  ),
                ),
              ],
            ),
          ),
          const Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 36,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x00000000), Color(0x33000000)],
                ),
              ),
            ),
          ),
          if (banners.length > 1)
            Positioned(
              left: 0,
              right: 0,
              bottom: 42,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < banners.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 240),
                      curve: Curves.easeOutCubic,
                      margin: const EdgeInsets.symmetric(horizontal: 2.5),
                      width: i == _index ? 16 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: i == _index
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(99),
                        boxShadow: i == _index
                            ? const [
                                BoxShadow(
                                  color: Color(0x4DFFFFFF),
                                  blurRadius: 8,
                                ),
                                BoxShadow(
                                  color: Color(0x40000000),
                                  blurRadius: 3,
                                ),
                              ]
                            : const [
                                BoxShadow(
                                  color: Color(0x2E000000),
                                  blurRadius: 3,
                                ),
                              ],
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class GiftWorldHomeCard extends ConsumerWidget {
  const GiftWorldHomeCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final worlds =
        ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    StoreWorld? gift;
    for (final world in worlds) {
      if (world.isGift) {
        gift = world;
        break;
      }
    }
    if (gift == null) return const SizedBox.shrink();
    if (ref.watch(selectedWorldSlugProvider) == gift.slug)
      return const SizedBox.shrink();
    final forward = Icons.arrow_forward_rounded;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: Material(
        color: gift.canvas,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: gift.accent.withValues(alpha: 0.35)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            ref.read(selectedWorldSlugProvider.notifier).state = gift!.slug;
          },
          child: Stack(
            children: [
              // زخرفة زاوية ناعمة بلون العالم — عمق دون تشويش.
              PositionedDirectional(
                top: -26,
                end: -22,
                child: Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        gift.accent.withValues(alpha: 0.20),
                        gift.accent.withValues(alpha: 0.0),
                      ],
                      stops: const [0, 1],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 13,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Colors.white,
                            Color.lerp(gift.accent, Colors.white, 0.82)!,
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: gift.accent.withValues(alpha: 0.28),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Center(
                        child: WorldIcon(slug: gift.slug, size: 26),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            gift.localizedName(lang),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.2,
                              color: gift.ink,
                            ),
                          ),
                          if (gift.localizedTagline(lang).isNotEmpty)
                            Text(
                              gift.localizedTagline(lang),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: gift.ink.withValues(alpha: 0.55),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: gift.accent.withValues(alpha: 0.10),
                      ),
                      child: Icon(forward, size: 17, color: gift.accent),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// إطار زجاجي واحد فوق البنر، وداخله أربعة مستطيلات أغمق قليلاً.
class _WorldGlassTray extends StatelessWidget {
  final List<StoreWorld> worlds;
  final String lang;
  final String selectedSlug;
  final ValueChanged<StoreWorld> onSelect;

  const _WorldGlassTray({
    required this.worlds,
    required this.lang,
    required this.selectedSlug,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        // ضباب أخف — البنر يتنفّس عبر الزجاج.
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x2EFFFFFF), Color(0x0FFFFFFF)],
            ),
            border: Border.fromBorderSide(
              BorderSide(color: Color(0x59FFFFFF), width: 0.7),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Stack(
              children: [
                // وهج علوي ناعم داخل الإطار — عمق زجاجي.
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.white.withValues(alpha: 0.10),
                          Colors.transparent,
                        ],
                        stops: const [0, 0.5],
                      ),
                    ),
                  ),
                ),
                Row(
                  children: [
                    for (final world in worlds)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: _WorldGlassCell(
                            world: world,
                            label: world.localizedName(lang),
                            selected: world.slug == selectedSlug,
                            onTap: () => onSelect(world),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WorldGlassCell extends StatelessWidget {
  final StoreWorld world;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _WorldGlassCell({
    required this.world,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final accent = world.accent;
    final sheen = Color.lerp(accent, Colors.white, 0.42)!;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedScale(
        scale: selected ? 1.0 : 0.965,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
          height: 62,
          padding: const EdgeInsets.fromLTRB(3, 5, 3, 4),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: selected
                  ? [
                      sheen.withValues(alpha: 0.72),
                      accent.withValues(alpha: 0.52),
                    ]
                  : [
                      Colors.white.withValues(alpha: 0.13),
                      Colors.white.withValues(alpha: 0.04),
                    ],
              stops: const [0, 1],
            ),
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: selected
                  ? Colors.white.withValues(alpha: 0.88)
                  : Colors.white.withValues(alpha: 0.20),
              width: selected ? 1.1 : 0.7,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: accent.withValues(alpha: 0.38),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: Colors.white.withValues(alpha: 0.14),
                      blurRadius: 5,
                      offset: const Offset(0, -1),
                    ),
                  ]
                : const [
                    BoxShadow(
                      color: Color(0x10000000),
                      blurRadius: 5,
                      offset: Offset(0, 2),
                    ),
                  ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOutCubic,
                width: selected ? 27 : 25,
                height: selected ? 27 : 25,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    radius: 0.9,
                    colors: [
                      Colors.white.withValues(alpha: selected ? 0.32 : 0.14),
                      Colors.white.withValues(alpha: selected ? 0.06 : 0.03),
                    ],
                  ),
                  border: Border.all(
                    color: Colors.white.withValues(
                      alpha: selected ? 0.50 : 0.18,
                    ),
                  ),
                ),
                child: SizedBox(
                  width: 17.5,
                  height: 17.5,
                  child: _WorldMark(
                    slug: world.slug,
                    color: Colors.white,
                    selected: selected,
                  ),
                ),
              ),
              const SizedBox(height: 3.5),
              Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  height: 1.08,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.12,
                  color: Colors.white,
                  shadows: const [
                    Shadow(
                      color: Color(0xB0000000),
                      blurRadius: 7,
                      offset: Offset(0, 1),
                    ),
                    Shadow(
                      color: Color(0x55000000),
                      blurRadius: 2,
                      offset: Offset(0, 0.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 2.5),
              // مؤشر انتقاء متوهّج يتوسّع بتخميد نابض.
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutBack,
                width: selected ? 20 : 0,
                height: 2.5,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(99),
                  boxShadow: selected
                      ? const [
                          BoxShadow(
                            color: Color(0xB3FFFFFF),
                            blurRadius: 6,
                            spreadRadius: 0.5,
                          ),
                          BoxShadow(color: Color(0x66FFFFFF), blurRadius: 12),
                        ]
                      : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// شريط علوي بسيط يبقى ظاهراً عند النزول.
class PinnedWorldBar extends ConsumerWidget {
  const PinnedWorldBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final worlds =
        ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    final featured = worlds.where((world) => !world.isGift).take(4).toList();
    if (featured.isEmpty) return const SizedBox.shrink();
    final theme = ref.watch(activeWorldThemeProvider);
    final selected = resolveWorldSlug(
      selected: ref.watch(selectedWorldSlugProvider),
      worlds: worlds,
    );
    final top = MediaQuery.paddingOf(context).top;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.surface.withValues(alpha: 0.96),
            border: Border(bottom: BorderSide(color: theme.hairline)),
            boxShadow: [
              BoxShadow(
                color: theme.ink.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.fromLTRB(12, top + 10, 12, 8),
            child: Row(
              children: [
                for (final item in featured)
                  Expanded(
                    child: _PinnedWorldChip(
                      label: item.localizedName(lang),
                      accent: item.accent,
                      ink: theme.ink,
                      selected: item.slug == selected,
                      onTap: () {
                        if (item.slug == selected) return;
                        HapticFeedback.selectionClick();
                        ref.read(selectedWorldSlugProvider.notifier).state =
                            item.slug;
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// أيقونة عالم دائرية لصفحة الفئات: حلقة ناعمة، تعبئة بلون العالم، واسم تحته.
class _CategoryWorldIcon extends StatelessWidget {
  final String slug;
  final String label;
  final Color accent;
  final Color ink;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryWorldIcon({
    required this.slug,
    required this.label,
    required this.accent,
    required this.ink,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fill = Color.lerp(accent, Colors.white, 0.18)!;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
          SizedBox(
            width: 62,
            height: 62,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  width: selected ? 62 : 52,
                  height: selected ? 62 : 52,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: selected
                        ? RadialGradient(
                            colors: [
                              accent.withValues(alpha: 0.20),
                              accent.withValues(alpha: 0.04),
                            ],
                          )
                        : null,
                    color: selected ? null : accent.withValues(alpha: 0.06),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: selected
                        ? LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [fill, accent],
                          )
                        : null,
                    color: selected ? null : Colors.white,
                    border: Border.all(
                      color: selected
                          ? Colors.white.withValues(alpha: 0.85)
                          : accent.withValues(alpha: 0.22),
                      width: selected ? 1.5 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: accent.withValues(alpha: selected ? 0.32 : 0.10),
                        blurRadius: selected ? 14 : 8,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: _WorldMark(
                    slug: slug,
                    color: selected ? Colors.white : accent,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11.5,
              height: 1.15,
              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              color: selected ? accent : ink.withValues(alpha: 0.72),
            ),
          ),
          const SizedBox(height: 5),
          AnimatedContainer(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutBack,
            width: selected ? 20 : 0,
            height: 2.5,
            decoration: BoxDecoration(
              color: accent,
              borderRadius: BorderRadius.circular(99),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: accent.withValues(alpha: 0.40),
                        blurRadius: 5,
                      ),
                    ]
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}

/// رسم خط رفيع خاص بكل عالم — أسلوب فاخر مخصص لكل قسم.
class _WorldMark extends StatelessWidget {
  final String slug;
  final Color color;
  final bool selected;

  const _WorldMark({
    required this.slug,
    required this.color,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _WorldMarkPainter(slug: slug, color: color, selected: selected),
      child: const SizedBox.expand(),
    );
  }
}

class _WorldMarkPainter extends CustomPainter {
  final String slug;
  final Color color;
  final bool selected;

  const _WorldMarkPainter({
    required this.slug,
    required this.color,
    this.selected = false,
  });

  Paint _stroke(double w, {double weight = 1.0, double alpha = 1.0}) => Paint()
    ..color = color.withValues(alpha: alpha)
    ..style = PaintingStyle.stroke
    ..strokeWidth = w * 0.042 * weight
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;

  Paint _fill(double alpha) => Paint()
    ..color = color.withValues(alpha: alpha)
    ..style = PaintingStyle.fill;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final thin = _stroke(w, weight: 0.75);
    final main = _stroke(w);
    final accentStroke = _stroke(w, weight: 1.15);
    final fill = _fill(selected ? 0.98 : 0.90);
    final soft = _fill(selected ? 0.30 : 0.18);
    final softer = _fill(selected ? 0.16 : 0.10);

    switch (slug) {
      case 'care-rituals':
        _careRituals(canvas, w, h, main, thin, fill, soft);
      case 'his-elegance':
        _hisElegance(canvas, w, h, main, thin, accentStroke, fill);
      case 'scent-story':
        _scentStory(canvas, w, h, main, thin, fill, soft, softer);
      default:
        _beautySpell(canvas, w, h, main, thin, fill, soft, softer);
    }
  }

  /// ── سحر الجمال ────────────────────────────────────────────────────────
  /// مِسحة أحمر شفاه مائلة داخل هالة شرارة — رمز الجمال الأيقوني.
  void _beautySpell(
    Canvas canvas,
    double w,
    double h,
    Paint main,
    Paint thin,
    Paint fill,
    Paint soft,
    Paint softer,
  ) {
    // هالة دائرية خلفية رقيقة تمنح الرمز حضوراً.
    canvas.drawCircle(Offset(w * 0.50, h * 0.54), w * 0.40, softer);
    canvas.drawCircle(
      Offset(w * 0.50, h * 0.54),
      w * 0.40,
      _stroke(w, weight: 0.55, alpha: 0.55),
    );

    // رأس المِسحة: شكل رصاصة مائل بحدبات ناعمة.
    final bulletTip = Offset(w * 0.64, h * 0.16);
    final bullet = Path()
      ..moveTo(bulletTip.dx, bulletTip.dy)
      // الجانب الطويل (أعلى-يسار نحو القاعدة)
      ..quadraticBezierTo(w * 0.52, h * 0.24, w * 0.42, h * 0.36)
      ..quadraticBezierTo(w * 0.34, h * 0.46, w * 0.33, h * 0.56)
      // قاعدة عريضة
      ..quadraticBezierTo(w * 0.44, h * 0.62, w * 0.55, h * 0.52)
      ..quadraticBezierTo(w * 0.66, h * 0.42, w * 0.68, h * 0.30)
      ..quadraticBezierTo(w * 0.69, h * 0.22, bulletTip.dx, bulletTip.dy)
      ..close();
    canvas.drawPath(bullet, main);

    // خط لمعة على جسم الرصاصة.
    canvas.drawLine(
      Offset(w * 0.46, h * 0.42),
      Offset(w * 0.56, h * 0.27),
      thin,
    );

    // القاعدة المعدنية — حزام مضلّع.
    final belt = Path()
      ..moveTo(w * 0.325, h * 0.585)
      ..lineTo(w * 0.60, h * 0.545)
      ..lineTo(w * 0.585, h * 0.72)
      ..lineTo(w * 0.31, h * 0.765)
      ..close();
    canvas.drawPath(belt, main);
    // خطّا تسليخ أفقيان.
    canvas.drawLine(
      Offset(w * 0.317, h * 0.645),
      Offset(w * 0.593, h * 0.605),
      thin,
    );
    canvas.drawLine(
      Offset(w * 0.314, h * 0.703),
      Offset(w * 0.589, h * 0.663),
      thin,
    );

    // جسم الأنبوب السفلي.
    final tube = Path()
      ..moveTo(w * 0.31, h * 0.765)
      ..lineTo(w * 0.585, h * 0.72)
      ..lineTo(w * 0.55, h * 0.90)
      ..quadraticBezierTo(w * 0.545, h * 0.95, w * 0.50, h * 0.95)
      ..quadraticBezierTo(w * 0.42, h * 0.95, w * 0.36, h * 0.92)
      ..quadraticBezierTo(w * 0.30, h * 0.895, w * 0.31, h * 0.765)
      ..close();
    canvas.drawPath(tube, main);

    // شرارات لمعان ثلاث حول الرأس.
    _spark(canvas, Offset(w * 0.80, h * 0.22), w * 0.055, fill);
    _spark(canvas, Offset(w * 0.20, h * 0.28), w * 0.035, soft);
    _spark(canvas, Offset(w * 0.24, h * 0.62), w * 0.028, softer);
  }

  /// نجمة لمعان رباعية الفصوص.
  void _spark(Canvas canvas, Offset c, double r, Paint paint) {
    final spark = Path()
      ..moveTo(c.dx, c.dy - r)
      ..quadraticBezierTo(c.dx + r * 0.18, c.dy - r * 0.18, c.dx + r, c.dy)
      ..quadraticBezierTo(c.dx + r * 0.18, c.dy + r * 0.18, c.dx, c.dy + r)
      ..quadraticBezierTo(c.dx - r * 0.18, c.dy + r * 0.18, c.dx - r, c.dy)
      ..quadraticBezierTo(c.dx - r * 0.18, c.dy - r * 0.18, c.dx, c.dy - r)
      ..close();
    canvas.drawPath(spark, paint);
  }

  /// ── طقوس العناية ──────────────────────────────────────────────────────
  /// قطرة كبيرة تحتضن ورقتين متقابلتين — طقس الطبيعة والعناية.
  void _careRituals(
    Canvas canvas,
    double w,
    double h,
    Paint main,
    Paint thin,
    Paint fill,
    Paint soft,
  ) {
    // القطرة الأم — خط منحنٍ رشيق.
    final drop = Path()
      ..moveTo(w * 0.50, h * 0.08)
      ..quadraticBezierTo(w * 0.78, h * 0.36, w * 0.78, h * 0.58)
      ..quadraticBezierTo(w * 0.78, h * 0.83, w * 0.50, h * 0.92)
      ..quadraticBezierTo(w * 0.22, h * 0.83, w * 0.22, h * 0.58)
      ..quadraticBezierTo(w * 0.22, h * 0.36, w * 0.50, h * 0.08)
      ..close();
    canvas.drawPath(drop, main);

    // انعكاس داخلي ناعم على حافة القطرة.
    canvas.drawArc(
      Rect.fromCenter(
        center: Offset(w * 0.50, h * 0.58),
        width: w * 0.40,
        height: h * 0.52,
      ),
      math.pi * 0.72,
      math.pi * 0.5,
      false,
      thin,
    );

    // ورقتان متقابلتان داخل القطرة — ساق مشتركة من الأسفل.
    final stemBottom = Offset(w * 0.50, h * 0.78);
    canvas.drawLine(stemBottom, Offset(w * 0.50, h * 0.60), main);

    // الورقة اليمنى.
    final leafR = Path()
      ..moveTo(w * 0.50, h * 0.66)
      ..quadraticBezierTo(w * 0.58, h * 0.58, w * 0.66, h * 0.56)
      ..quadraticBezierTo(w * 0.68, h * 0.64, w * 0.62, h * 0.70)
      ..quadraticBezierTo(w * 0.57, h * 0.75, w * 0.50, h * 0.72)
      ..close();
    canvas.drawPath(leafR, fill);
    canvas.drawPath(leafR, thin);
    // عرق الورقة.
    canvas.drawLine(
      Offset(w * 0.52, h * 0.67),
      Offset(w * 0.63, h * 0.595),
      thin,
    );

    // الورقة اليسرى (مرآة).
    final leafL = Path()
      ..moveTo(w * 0.50, h * 0.66)
      ..quadraticBezierTo(w * 0.42, h * 0.58, w * 0.34, h * 0.56)
      ..quadraticBezierTo(w * 0.32, h * 0.64, w * 0.38, h * 0.70)
      ..quadraticBezierTo(w * 0.43, h * 0.75, w * 0.50, h * 0.72)
      ..close();
    canvas.drawPath(leafL, fill);
    canvas.drawPath(leafL, thin);
    canvas.drawLine(
      Offset(w * 0.48, h * 0.67),
      Offset(w * 0.37, h * 0.595),
      thin,
    );

    // برعم صغير أعلى الساق.
    canvas.drawCircle(Offset(w * 0.50, h * 0.485), w * 0.045, fill);
    canvas.drawCircle(Offset(w * 0.50, h * 0.485), w * 0.045, thin);

    // فقاعات خفيفة أعلى القطرة — إحساس الطقس والنقاء.
    canvas.drawCircle(Offset(w * 0.26, h * 0.12), w * 0.045, soft);
    canvas.drawCircle(Offset(w * 0.26, h * 0.12), w * 0.045, thin);
    canvas.drawCircle(Offset(w * 0.75, h * 0.16), w * 0.030, thin);
    canvas.drawCircle(Offset(w * 0.80, h * 0.30), w * 0.020, thin);
  }

  /// ── أناقة الرجل ───────────────────────────────────────────────────────
  /// ربطة عنق فراشية بوربون مائلة داخل إطار ماسي — أناقة كلاسيكية.
  void _hisElegance(
    Canvas canvas,
    double w,
    double h,
    Paint main,
    Paint thin,
    Paint accentStroke,
    Paint fill,
  ) {
    // إطار ماسي خلفي (زوايا مقطوعة).
    final frame = Path()
      ..moveTo(w * 0.50, h * 0.05)
      ..lineTo(w * 0.93, h * 0.50)
      ..lineTo(w * 0.50, h * 0.95)
      ..lineTo(w * 0.07, h * 0.50)
      ..close();
    canvas.drawPath(frame, _stroke(w, weight: 0.6, alpha: 0.45));

    // عقدة الربطة (المثلث العلوي).
    final knot = Path()
      ..moveTo(w * 0.50, h * 0.22)
      ..lineTo(w * 0.62, h * 0.30)
      ..lineTo(w * 0.50, h * 0.38)
      ..lineTo(w * 0.38, h * 0.30)
      ..close();
    canvas.drawPath(knot, fill);
    canvas.drawPath(knot, main);

    // جسم الربطة — ربطة وِنزِر تتسع ثم تنحصر.
    final body = Path()
      ..moveTo(w * 0.44, h * 0.36)
      ..quadraticBezierTo(w * 0.40, h * 0.50, w * 0.34, h * 0.62)
      ..quadraticBezierTo(w * 0.30, h * 0.74, w * 0.26, h * 0.84)
      // الرأس الأيسر للربطة (V الداخلية)
      ..lineTo(w * 0.50, h * 0.72)
      ..lineTo(w * 0.74, h * 0.84)
      ..quadraticBezierTo(w * 0.70, h * 0.74, w * 0.66, h * 0.62)
      ..quadraticBezierTo(w * 0.60, h * 0.50, w * 0.56, h * 0.36)
      ..close();
    canvas.drawPath(body, main);

    // خط وسط يفصل شقي الربطة.
    canvas.drawLine(
      Offset(w * 0.50, h * 0.40),
      Offset(w * 0.50, h * 0.71),
      thin,
    );

    // نقطة تثبيت أسفل العقدة.
    canvas.drawCircle(Offset(w * 0.50, h * 0.375), w * 0.026, fill);

    // شرارة صغيرة أعلى اليمين — لمسة تميّز.
    _spark(canvas, Offset(w * 0.78, h * 0.20), w * 0.040, fill);
    canvas.drawCircle(Offset(w * 0.22, h * 0.76), w * 0.020, fill);
  }

  /// ── حكاية عطر ─────────────────────────────────────────────────────────
  /// زجاجة عطر ممدودة بقلب زهري وقطرات عبير متصاعدة.
  void _scentStory(
    Canvas canvas,
    double w,
    double h,
    Paint main,
    Paint thin,
    Paint fill,
    Paint soft,
    Paint softer,
  ) {
    // قطرات عبير تتصاعد بجانب الفوهة — الحكاية قبل الزجاجة.
    canvas.drawCircle(Offset(w * 0.50, h * 0.045), w * 0.030, fill);
    canvas.drawCircle(Offset(w * 0.32, h * 0.10), w * 0.022, soft);
    canvas.drawCircle(Offset(w * 0.68, h * 0.10), w * 0.022, soft);
    canvas.drawCircle(Offset(w * 0.20, h * 0.19), w * 0.014, thin);

    // الغطاء — قبة أنيقة.
    final cap = Path()
      ..moveTo(w * 0.40, h * 0.22)
      ..quadraticBezierTo(w * 0.50, h * 0.13, w * 0.60, h * 0.22)
      ..close();
    canvas.drawPath(cap, main);
    canvas.drawLine(
      Offset(w * 0.40, h * 0.225),
      Offset(w * 0.60, h * 0.225),
      main,
    );

    // عنق قصير.
    canvas.drawLine(
      Offset(w * 0.44, h * 0.235),
      Offset(w * 0.43, h * 0.29),
      thin,
    );
    canvas.drawLine(
      Offset(w * 0.56, h * 0.235),
      Offset(w * 0.57, h * 0.29),
      thin,
    );
    canvas.drawLine(
      Offset(w * 0.43, h * 0.29),
      Offset(w * 0.57, h * 0.29),
      thin,
    );

    // جسم الزجاجة — كتفان ناعمان وتقويس قاعدة.
    final body = Path()
      ..moveTo(w * 0.43, h * 0.29)
      ..quadraticBezierTo(w * 0.36, h * 0.31, w * 0.33, h * 0.40)
      ..quadraticBezierTo(w * 0.30, h * 0.48, w * 0.30, h * 0.62)
      ..quadraticBezierTo(w * 0.30, h * 0.80, w * 0.50, h * 0.86)
      ..quadraticBezierTo(w * 0.70, h * 0.80, w * 0.70, h * 0.62)
      ..quadraticBezierTo(w * 0.70, h * 0.48, w * 0.67, h * 0.40)
      ..quadraticBezierTo(w * 0.64, h * 0.31, w * 0.57, h * 0.29)
      ..close();
    canvas.drawPath(body, main);

    // انعكاس ضوء على جانب الزجاجة.
    canvas.drawArc(
      Rect.fromCenter(
        center: Offset(w * 0.50, h * 0.58),
        width: w * 0.34,
        height: h * 0.44,
      ),
      math.pi * 0.75,
      math.pi * 0.4,
      false,
      thin,
    );

    // قلب زهري داخل الزجاجة — زهرة خمس بتلات صغيرة كروح العطر.
    final fc = Offset(w * 0.50, h * 0.565);
    for (var i = 0; i < 5; i++) {
      final a = -math.pi / 2 + i * math.pi * 2 / 5;
      final petal = Path()
        ..moveTo(fc.dx, fc.dy)
        ..quadraticBezierTo(
          fc.dx + w * 0.115 * math.cos(a - 0.5),
          fc.dy + h * 0.115 * math.sin(a - 0.5),
          fc.dx + w * 0.15 * math.cos(a),
          fc.dy + h * 0.15 * math.sin(a),
        )
        ..quadraticBezierTo(
          fc.dx + w * 0.115 * math.cos(a + 0.5),
          fc.dy + h * 0.115 * math.sin(a + 0.5),
          fc.dx,
          fc.dy,
        )
        ..close();
      canvas.drawPath(petal, soft);
      canvas.drawPath(petal, thin);
    }
    canvas.drawCircle(fc, w * 0.035, fill);

    // قاعدة أفقية — خط استقرار.
    canvas.drawLine(
      Offset(w * 0.36, h * 0.90),
      Offset(w * 0.64, h * 0.90),
      _stroke(w, weight: 0.7, alpha: 0.7),
    );
  }

  @override
  bool shouldRepaint(covariant _WorldMarkPainter oldDelegate) =>
      oldDelegate.slug != slug ||
      oldDelegate.color != color ||
      oldDelegate.selected != selected;
}

class _PinnedWorldChip extends StatelessWidget {
  final String label;
  final Color accent;
  final Color ink;
  final bool selected;
  final VoidCallback onTap;

  const _PinnedWorldChip({
    required this.label,
    required this.accent,
    required this.ink,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.15,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                color: selected ? accent : ink.withValues(alpha: 0.55),
              ),
            ),
            const SizedBox(height: 7),
            AnimatedContainer(
              duration: const Duration(milliseconds: 260),
              curve: Curves.easeOutCubic,
              width: selected ? 28 : 0,
              height: 2.5,
              decoration: BoxDecoration(
                color: accent,
                borderRadius: BorderRadius.circular(99),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: accent.withValues(alpha: 0.40),
                          blurRadius: 6,
                        ),
                      ]
                    : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// تبديل العوالم داخل الصفحة نفسها، بدون فتح رئيسية منفصلة.
class WorldSwitchBar extends ConsumerWidget {
  final double outerPadding;
  final bool showTitle;
  final bool compactFixed;

  const WorldSwitchBar({
    super.key,
    this.outerPadding = 16,
    this.showTitle = true,
    this.compactFixed = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final worlds = ref.watch(worldsProvider);
    final lang = ref.watch(languageCodeProvider);
    final theme = ref.watch(activeWorldThemeProvider);
    final selected = ref.watch(selectedWorldSlugProvider);
    return worlds.maybeWhen(
      data: (list) {
        if (list.isEmpty) return const SizedBox.shrink();
        final slug =
            selected != null && list.any((world) => world.slug == selected)
            ? selected
            : list.first.slug;
        if (selected != slug) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (ref.read(selectedWorldSlugProvider) != slug) {
              ref.read(selectedWorldSlugProvider.notifier).state = slug;
            }
          });
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (showTitle)
              Padding(
                padding: EdgeInsets.fromLTRB(outerPadding, 8, outerPadding, 10),
                child: Text(
                  lang == 'en' ? 'Choose your world' : 'اختاري القسم المناسب لك',
                  textAlign: TextAlign.start,
                  style: TextStyle(
                    fontSize: 19,
                    height: 1.2,
                    letterSpacing: -0.3,
                    fontWeight: FontWeight.w800,
                    color: theme.ink,
                  ),
                ),
              ),
            if (compactFixed)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: outerPadding),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final world
                        in list.where((item) => !item.isGift).take(4))
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: _CategoryWorldIcon(
                            slug: world.slug,
                            label: world.localizedName(lang),
                            accent: world.accent,
                            ink: theme.ink,
                            selected: world.slug == slug,
                            onTap: () {
                              if (world.slug == slug) return;
                              HapticFeedback.selectionClick();
                              ref
                                      .read(selectedWorldSlugProvider.notifier)
                                      .state =
                                  world.slug;
                            },
                          ),
                        ),
                      ),
                  ],
                ),
              )
            else
              SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: outerPadding),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final world = list[i];
                    final on = world.slug == slug;
                    return Material(
                      color: on ? world.accent : theme.surface,
                      elevation: on ? 1.5 : 0,
                      shadowColor: world.accent.withValues(alpha: 0.35),
                      shape: StadiumBorder(
                        side: BorderSide(
                          color: on ? world.accent : theme.hairline,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () {
                          if (on) return;
                          HapticFeedback.selectionClick();
                          ref.read(selectedWorldSlugProvider.notifier).state =
                              world.slug;
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 13),
                          child: Row(
                            children: [
                              WorldIcon(slug: world.slug, size: 17),
                              const SizedBox(width: 5),
                              Text(
                                world.localizedName(lang),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: on ? Colors.white : theme.inkSoft,
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
          ],
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

/// صور صفحة الفئات الخاصة بالعالم. ليست بنرات الرئيسية.
class WorldCategoryGallery extends ConsumerWidget {
  final double outerPadding;
  final double aspectRatio;

  const WorldCategoryGallery({
    super.key,
    this.outerPadding = 16,
    this.aspectRatio = _bannerAspect,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slug = ref.watch(selectedWorldSlugProvider);
    if (slug == null) return const SizedBox.shrink();
    final detail = ref.watch(worldDetailProvider(slug));
    return detail.maybeWhen(
      data: (world) {
        if (world.galleryUrls.isEmpty) return const SizedBox.shrink();
        return _GalleryCarousel(
          key: ValueKey('$slug:${world.galleryUrls.join('|')}'),
          urls: world.galleryUrls,
          accent: world.accent,
          outerPadding: outerPadding,
          aspectRatio: aspectRatio,
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _GalleryCarousel extends StatefulWidget {
  final List<String> urls;
  final Color accent;
  final double outerPadding;
  final double aspectRatio;

  const _GalleryCarousel({
    super.key,
    required this.urls,
    required this.accent,
    this.outerPadding = 16,
    this.aspectRatio = _bannerAspect,
  });

  @override
  State<_GalleryCarousel> createState() => _GalleryCarouselState();
}

class _GalleryCarouselState extends State<_GalleryCarousel> {
  final _page = PageController();
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _arm();
  }

  @override
  void didUpdateWidget(covariant _GalleryCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.urls.length != widget.urls.length) {
      _index = 0;
      _arm();
    }
  }

  void _arm() {
    _timer?.cancel();
    if (widget.urls.length < 2) return;
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_page.hasClients) return;
      final next = (_index + 1) % widget.urls.length;
      _page.animateToPage(
        next,
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final urls = widget.urls;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        widget.outerPadding,
        0,
        widget.outerPadding,
        2,
      ),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: widget.aspectRatio,
            child: PageView.builder(
              controller: _page,
              itemCount: urls.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) =>
                  _WideFrame(url: urls[i], accent: widget.accent),
            ),
          ),
          if (urls.length > 1) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < urls.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    curve: Curves.easeOutCubic,
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: i == _index ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _index ? widget.accent : AppColors.hairline,
                      borderRadius: BorderRadius.circular(99),
                      boxShadow: i == _index
                          ? [
                              BoxShadow(
                                color: widget.accent.withValues(alpha: 0.35),
                                blurRadius: 6,
                              ),
                            ]
                          : null,
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// بنرات العالم على الرئيسية، بنسبة عرض أنيقة.
class WorldHeroBanners extends ConsumerWidget {
  final double outerPadding;

  const WorldHeroBanners({super.key, this.outerPadding = 16});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slug = ref.watch(selectedWorldSlugProvider);
    if (slug == null) return const SizedBox.shrink();
    final feed = ref.watch(worldFeedProvider(slug));
    final world = ref.watch(worldDetailProvider(slug)).valueOrNull;
    return feed.maybeWhen(
      data: (data) {
        final banners = data.banners
            .where((banner) => banner.hasImage)
            .toList();
        if (banners.isEmpty) {
          final cover = world?.coverUrl ?? '';
          if (cover.isNotEmpty) {
            return Padding(
              padding: EdgeInsets.fromLTRB(outerPadding, 12, outerPadding, 4),
              child: _WideFrame(
                url: cover,
                accent: world?.accent ?? AppColors.primary,
              ),
            );
          }
          if (world == null) return const SizedBox(height: 12);
          final lang = ref.watch(languageCodeProvider);
          return Padding(
            padding: EdgeInsets.fromLTRB(outerPadding, 12, outerPadding, 4),
            child: _WorldPlate(world: world, lang: lang),
          );
        }
        return _WorldBannerCarousel(
          key: ValueKey(slug),
          banners: banners,
          accent: world?.accent ?? AppColors.primary,
          outerPadding: outerPadding,
        );
      },
      orElse: () => const SizedBox(height: 12),
    );
  }
}

/// صورة العالم أعلى قسم الفئات. على صفحة الأقسام تُستخدم أول بنر إن لم توجد صورة غلاف.
class WorldCategoryImage extends ConsumerWidget {
  final bool fallbackToBanner;
  final double outerPadding;

  const WorldCategoryImage({
    super.key,
    this.fallbackToBanner = false,
    this.outerPadding = 16,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slug = ref.watch(selectedWorldSlugProvider);
    if (slug == null) return const SizedBox.shrink();
    final world = ref.watch(worldDetailProvider(slug)).valueOrNull;
    final feed = ref.watch(worldFeedProvider(slug)).valueOrNull;
    final cover = world?.coverUrl ?? '';
    final banners =
        feed?.banners.where((banner) => banner.hasImage).toList() ??
        const <AppBanner>[];
    final firstBanner = banners.isEmpty ? '' : banners.first.imageUrl;
    final url = cover.isNotEmpty
        ? cover
        : (fallbackToBanner ? firstBanner : '');
    if (url.isEmpty) return const SizedBox.shrink();
    if (!fallbackToBanner && banners.isNotEmpty && url == firstBanner)
      return const SizedBox.shrink();
    return Padding(
      padding: EdgeInsets.fromLTRB(outerPadding, 12, outerPadding, 4),
      child: _WideFrame(url: url, accent: world?.accent ?? AppColors.primary),
    );
  }
}

class _WorldBannerCarousel extends StatefulWidget {
  final List<AppBanner> banners;
  final Color accent;
  final double outerPadding;

  const _WorldBannerCarousel({
    super.key,
    required this.banners,
    required this.accent,
    this.outerPadding = 16,
  });

  @override
  State<_WorldBannerCarousel> createState() => _WorldBannerCarouselState();
}

class _WorldBannerCarouselState extends State<_WorldBannerCarousel> {
  final _page = PageController();
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _arm();
  }

  @override
  void didUpdateWidget(covariant _WorldBannerCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.banners.length != widget.banners.length) {
      _index = 0;
      _arm();
    }
  }

  void _arm() {
    _timer?.cancel();
    if (widget.banners.length < 2) return;
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_page.hasClients) return;
      final next = (_index + 1) % widget.banners.length;
      _page.animateToPage(
        next,
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final banners = widget.banners;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        widget.outerPadding,
        0,
        widget.outerPadding,
        2,
      ),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: _bannerAspect,
            child: PageView.builder(
              controller: _page,
              itemCount: banners.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) {
                final banner = banners[i];
                return GestureDetector(
                  onTap: () => openBannerLink(context, banner),
                  child: _WideFrame(
                    url: banner.imageUrl,
                    accent: widget.accent,
                    padding: EdgeInsets.zero,
                  ),
                );
              },
            ),
          ),
          if (banners.length > 1) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < banners.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    curve: Curves.easeOutCubic,
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: i == _index ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _index ? widget.accent : AppColors.hairline,
                      borderRadius: BorderRadius.circular(99),
                      boxShadow: i == _index
                          ? [
                              BoxShadow(
                                color: widget.accent.withValues(alpha: 0.35),
                                blurRadius: 6,
                              ),
                            ]
                          : null,
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// براندات العالم تحت الأقسام، ببطاقات بيضاء مثل المرجع.
class WorldHomeBrands extends ConsumerWidget {
  const WorldHomeBrands({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slug = ref.watch(selectedWorldSlugProvider);
    if (slug == null) return const SizedBox.shrink();
    final lang = ref.watch(languageCodeProvider);
    final theme = ref.watch(activeWorldThemeProvider);
    final brands =
        ref.watch(worldFeedProvider(slug)).valueOrNull?.brands ?? const [];
    if (brands.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: lang == 'en' ? 'Our brands' : 'برانداتنا',
          actionLabel: lang == 'en' ? 'View all' : 'عرض الكل',
          onAction: () => context.push('/brands'),
        ),
        SizedBox(
          height: 100,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: brands.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final brand = brands[i];
              final name = brand.localizedName(lang);
              return _HomeBrandPill(
                name: brand.label,
                logoUrl: brand.logoUrl,
                ring: theme.hairline,
                ink: theme.ink,
                onTap: () => context.push(
                  '/products?brandId=${brand.id}&title=${Uri.encodeComponent(name)}',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// دائرة براند بيضاء بحلقة مزدوجة وظل منخفض — أهدأ من بطاقة المنتج.
class _HomeBrandPill extends StatelessWidget {
  final String name;
  final String logoUrl;
  final Color ring;
  final Color ink;
  final VoidCallback onTap;

  const _HomeBrandPill({
    required this.name,
    required this.logoUrl,
    required this.ring,
    required this.ink,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(40),
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(color: ring),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x12000000),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 3,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              alignment: Alignment.center,
              padding: const EdgeInsets.all(10),
              // بدون شعار: اسم البراند كعلامة كتابية أنيقة بدل حرف واحد.
              child: logoUrl.isEmpty
                  ? FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        name.isEmpty ? '•' : name.toUpperCase(),
                        maxLines: 2,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          height: 1.1,
                          letterSpacing: 0.8,
                          color: ink,
                        ),
                      ),
                    )
                  : AppNetworkImage(
                      url: logoUrl,
                      fit: BoxFit.contain,
                      backgroundColor: Colors.white,
                    ),
            ),
            const SizedBox(height: 6),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.1,
                color: ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorldPlate extends StatelessWidget {
  final StoreWorld world;
  final String lang;

  const _WorldPlate({required this.world, required this.lang});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: _bannerAspect,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: AlignmentDirectional.centerStart,
              end: AlignmentDirectional.centerEnd,
              colors: [
                world.accent,
                Color.lerp(world.accent, world.ink, 0.28)!,
                Color.alphaBlend(
                  world.accent.withValues(alpha: 0.45),
                  world.canvas,
                ),
              ],
              stops: const [0, 0.55, 1],
            ),
          ),
          child: Stack(
            children: [
              // هالة زخرفية بزاوية — عمق للوح الفاليوباك.
              PositionedDirectional(
                bottom: -40,
                start: -30,
                child: Container(
                  width: 170,
                  height: 170,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.14),
                        Colors.white.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 22),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.18),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Center(
                        child: WorldIcon(slug: world.slug, size: 26),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            world.localizedName(lang),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          if (world.localizedTagline(lang).isNotEmpty)
                            Text(
                              world.localizedTagline(lang),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                        ],
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
  }
}

class _WideFrame extends StatelessWidget {
  final String url;
  final Color accent;
  final EdgeInsetsGeometry padding;

  const _WideFrame({
    required this.url,
    required this.accent,
    this.padding = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    final image = ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: accent.withValues(alpha: 0.12)),
        ),
        child: SizedBox.expand(
          child: AppNetworkImage(
            url: url,
            fit: BoxFit.cover,
            backgroundColor: AppColors.blush,
          ),
        ),
      ),
    );
    final framed = Material(
      color: Colors.transparent,
      elevation: 2,
      shadowColor: accent.withValues(alpha: 0.22),
      borderRadius: BorderRadius.circular(18),
      child: image,
    );
    if (padding == EdgeInsets.zero) return framed;
    return Padding(
      padding: padding,
      child: AspectRatio(aspectRatio: _bannerAspect, child: framed),
    );
  }
}
