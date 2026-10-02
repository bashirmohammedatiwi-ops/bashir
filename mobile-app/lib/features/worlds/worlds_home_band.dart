import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
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
      _page.animateToPage(next, duration: const Duration(milliseconds: 520), curve: Curves.easeOut);
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageCodeProvider);
    final worlds = ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    if (worlds.isEmpty) return const SizedBox.shrink();
    final slug = resolveWorldSlug(selected: ref.watch(selectedWorldSlugProvider), worlds: worlds)!;
    final world = worlds.firstWhere((item) => item.slug == slug);
    final detail = ref.watch(worldDetailProvider(slug)).valueOrNull ?? world;
    final banners = ref.watch(worldFeedProvider(slug)).valueOrNull?.banners.where((banner) => banner.hasImage).toList() ??
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
      height: top + 336,
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
                            colors: [accent, Color.alphaBlend(accent.withValues(alpha: 0.55), detail.canvas)],
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
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: top + 230,
                child: const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0x8C141018), Color(0x00141018)],
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
                    const SizedBox(height: 14),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: Text(
                        lang == 'en' ? 'Choose your world' : 'اختر القسم المناسب لك',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          height: 1.15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.2,
                          shadows: [Shadow(color: Color(0x80000000), blurRadius: 10, offset: Offset(0, 1))],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 0, 14, 0),
                      child: _WorldGlassTray(
                        worlds: worlds.where((item) => !item.isGift).take(4).toList(),
                        lang: lang,
                        selectedSlug: slug,
                        onSelect: (item) {
                          if (item.slug == slug) return;
                          HapticFeedback.selectionClick();
                          ref.read(selectedWorldSlugProvider.notifier).state = item.slug;
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
                          duration: const Duration(milliseconds: 180),
                          margin: const EdgeInsets.symmetric(horizontal: 2.5),
                          width: i == _index ? 14 : 5,
                          height: 5,
                          decoration: BoxDecoration(
                            color: i == _index ? Colors.white : Colors.white.withValues(alpha: 0.55),
                            borderRadius: BorderRadius.circular(99),
                            boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 3)],
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
    final worlds = ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    StoreWorld? gift;
    for (final world in worlds) {
      if (world.isGift) {
        gift = world;
        break;
      }
    }
    if (gift == null) return const SizedBox.shrink();
    if (ref.watch(selectedWorldSlugProvider) == gift.slug) return const SizedBox.shrink();
    final forward = Directionality.of(context) == TextDirection.rtl
        ? Icons.arrow_back_rounded
        : Icons.arrow_forward_rounded;
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                  child: Icon(gift.motif, size: 20, color: gift.accent),
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
                Icon(forward, size: 18, color: gift.accent),
              ],
            ),
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
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.white.withValues(alpha: 0.22),
                Colors.white.withValues(alpha: 0.08),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.42)),
            boxShadow: const [
              BoxShadow(color: Color(0x40000000), blurRadius: 20, offset: Offset(0, 8)),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(5, 5, 5, 5),
            child: Row(
              children: [
                for (final world in worlds)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.5),
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        height: 66,
        padding: const EdgeInsets.fromLTRB(3, 6, 3, 5),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: selected
                ? [sheen.withValues(alpha: 0.82), accent.withValues(alpha: 0.62)]
                : [Colors.white.withValues(alpha: 0.20), Colors.white.withValues(alpha: 0.07)],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? Colors.white.withValues(alpha: 0.92) : Colors.white.withValues(alpha: 0.28),
            width: selected ? 1.2 : 0.8,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(color: accent.withValues(alpha: 0.45), blurRadius: 14, offset: const Offset(0, 4)),
                  BoxShadow(color: Colors.white.withValues(alpha: 0.18), blurRadius: 6, offset: const Offset(0, -1)),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 26,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: selected ? 0.32 : 0.18),
                    Colors.white.withValues(alpha: selected ? 0.08 : 0.04),
                  ],
                ),
                border: Border.all(color: Colors.white.withValues(alpha: selected ? 0.55 : 0.22)),
              ),
              child: SizedBox(
                width: 18,
                height: 18,
                child: _WorldMark(slug: world.slug, color: Colors.white, selected: selected),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10.5,
                height: 1.1,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.15,
                color: Colors.white,
                shadows: const [Shadow(color: Color(0xAA000000), blurRadius: 8, offset: Offset(0, 1))],
              ),
            ),
            const SizedBox(height: 3),
            AnimatedContainer(
              duration: const Duration(milliseconds: 260),
              width: selected ? 18 : 0,
              height: 2,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(99),
                boxShadow: selected ? const [BoxShadow(color: Color(0x66FFFFFF), blurRadius: 4)] : null,
              ),
            ),
          ],
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
    final worlds = ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    final featured = worlds.where((world) => !world.isGift).take(4).toList();
    if (featured.isEmpty) return const SizedBox.shrink();
    final theme = ref.watch(activeWorldThemeProvider);
    final selected = resolveWorldSlug(selected: ref.watch(selectedWorldSlugProvider), worlds: worlds);
    final top = MediaQuery.paddingOf(context).top;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.surface.withValues(alpha: 0.96),
            border: Border(bottom: BorderSide(color: theme.hairline)),
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
                      selected: item.slug == selected,
                      onTap: () {
                        if (item.slug == selected) return;
                        HapticFeedback.selectionClick();
                        ref.read(selectedWorldSlugProvider.notifier).state = item.slug;
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
  final bool selected;
  final VoidCallback onTap;

  const _CategoryWorldIcon({
    required this.slug,
    required this.label,
    required this.accent,
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
                    color: selected ? accent.withValues(alpha: 0.14) : accent.withValues(alpha: 0.06),
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
                      color: selected ? Colors.white.withValues(alpha: 0.85) : accent.withValues(alpha: 0.22),
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
              color: selected ? accent : const Color(0xFF5A5458),
            ),
          ),
          const SizedBox(height: 5),
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            width: selected ? 18 : 0,
            height: 3,
            decoration: BoxDecoration(
              color: accent,
              borderRadius: BorderRadius.circular(99),
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

  const _WorldMark({required this.slug, required this.color, this.selected = false});

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

  const _WorldMarkPainter({required this.slug, required this.color, this.selected = false});

  Paint _stroke(double w, {double weight = 1.0, double alpha = 1.0}) => Paint()
    ..color = color.withValues(alpha: alpha)
    ..style = PaintingStyle.stroke
    ..strokeWidth = w * 0.048 * weight
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;

  Paint _fill(double alpha) => Paint()
    ..color = color.withValues(alpha: alpha)
    ..style = PaintingStyle.fill;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final thin = _stroke(w, weight: 0.82);
    final main = _stroke(w);
    final fill = _fill(selected ? 0.95 : 0.88);
    final soft = _fill(selected ? 0.28 : 0.18);

    switch (slug) {
      case 'care-rituals':
        _careRituals(canvas, w, h, main, thin, soft);
      case 'his-elegance':
        _hisElegance(canvas, w, h, main, thin, fill);
      case 'scent-story':
        _scentStory(canvas, w, h, main, thin, fill, soft);
      default:
        _beautySpell(canvas, w, h, main, thin, fill, soft);
    }
  }

  /// وردة أنيقة ببتلات منحنية ولمعة خفيفة — سحر الجمال.
  void _beautySpell(Canvas canvas, double w, double h, Paint main, Paint thin, Paint fill, Paint soft) {
    final cx = w * 0.50;
    final cy = h * 0.50;
    final c = Offset(cx, cy);

    for (var i = 0; i < 5; i++) {
      final a = -math.pi / 2 + i * math.pi * 2 / 5;
      final petal = Path()
        ..moveTo(c.dx, c.dy - h * 0.02)
        ..quadraticBezierTo(
          c.dx + w * 0.22 * math.cos(a - 0.35),
          c.dy + h * 0.22 * math.sin(a - 0.35),
          c.dx + w * 0.30 * math.cos(a),
          c.dy + h * 0.30 * math.sin(a),
        )
        ..quadraticBezierTo(
          c.dx + w * 0.22 * math.cos(a + 0.35),
          c.dy + h * 0.22 * math.sin(a + 0.35),
          c.dx,
          c.dy - h * 0.02,
        );
      canvas.drawPath(petal, main);
    }

    canvas.drawCircle(c, w * 0.055, fill);
    canvas.drawCircle(Offset(cx + w * 0.14, cy - h * 0.20), w * 0.022, soft);
    canvas.drawLine(Offset(cx + w * 0.20, cy - h * 0.26), Offset(cx + w * 0.26, cy - h * 0.32), thin);
    canvas.drawLine(Offset(cx + w * 0.26, cy - h * 0.26), Offset(cx + w * 0.32, cy - h * 0.32), thin);
  }

  /// أوراق متداخلة مع عروق ناعمة — طقوس العناية.
  void _careRituals(Canvas canvas, double w, double h, Paint main, Paint thin, Paint soft) {
    final back = Path()
      ..moveTo(w * 0.52, h * 0.82)
      ..quadraticBezierTo(w * 0.10, h * 0.58, w * 0.34, h * 0.24)
      ..quadraticBezierTo(w * 0.44, h * 0.16, w * 0.52, h * 0.24)
      ..quadraticBezierTo(w * 0.88, h * 0.50, w * 0.52, h * 0.82)
      ..close();
    canvas.drawPath(back, thin);

    final front = Path()
      ..moveTo(w * 0.48, h * 0.84)
      ..quadraticBezierTo(w * 0.18, h * 0.62, w * 0.46, h * 0.30)
      ..quadraticBezierTo(w * 0.50, h * 0.20, w * 0.56, h * 0.30)
      ..quadraticBezierTo(w * 0.82, h * 0.54, w * 0.48, h * 0.84)
      ..close();
    canvas.drawPath(front, main);

    canvas.drawLine(Offset(w * 0.50, h * 0.76), Offset(w * 0.50, h * 0.32), thin);
    canvas.drawLine(Offset(w * 0.50, h * 0.58), Offset(w * 0.38, h * 0.50), thin);
    canvas.drawLine(Offset(w * 0.50, h * 0.46), Offset(w * 0.62, h * 0.40), thin);

    final drop = Path()
      ..moveTo(w * 0.72, h * 0.30)
      ..quadraticBezierTo(w * 0.78, h * 0.42, w * 0.72, h * 0.52)
      ..quadraticBezierTo(w * 0.66, h * 0.42, w * 0.72, h * 0.30)
      ..close();
    canvas.drawPath(drop, soft);
    canvas.drawPath(drop, thin);
  }

  /// ساعة فاخرة بإطار رفيع وتاج جانبي — أناقة الرجل.
  void _hisElegance(Canvas canvas, double w, double h, Paint main, Paint thin, Paint fill) {
    final bandTop = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.38, h * 0.12, w * 0.24, h * 0.10),
      Radius.circular(w * 0.035),
    );
    final bandBot = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.38, h * 0.78, w * 0.24, h * 0.10),
      Radius.circular(w * 0.035),
    );
    canvas.drawRRect(bandTop, thin);
    canvas.drawRRect(bandBot, thin);

    final dial = Offset(w * 0.50, h * 0.50);
    final r = w * 0.22;
    canvas.drawCircle(dial, r, main);
    canvas.drawCircle(dial, r * 0.78, thin);

    for (var i = 0; i < 12; i++) {
      if (i % 3 != 0) continue;
      final a = -math.pi / 2 + i * math.pi / 6;
      final inner = dial + Offset(r * 0.62 * math.cos(a), r * 0.62 * math.sin(a));
      final outer = dial + Offset(r * 0.88 * math.cos(a), r * 0.88 * math.sin(a));
      canvas.drawLine(inner, outer, thin);
    }

    canvas.drawLine(dial, dial + Offset(0, -r * 0.46), main);
    canvas.drawLine(dial, dial + Offset(r * 0.34, r * 0.18), thin);
    canvas.drawCircle(dial, w * 0.028, fill);

    canvas.drawCircle(Offset(w * 0.68, h * 0.50), w * 0.028, main);
    canvas.drawLine(Offset(w * 0.68, h * 0.46), Offset(w * 0.68, h * 0.54), thin);
  }

  /// زجاجة عطر فاخرة بغطاء وذيل رش — حكاية عطر.
  void _scentStory(Canvas canvas, double w, double h, Paint main, Paint thin, Paint fill, Paint soft) {
    final cap = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.38, h * 0.10, w * 0.24, h * 0.09),
      Radius.circular(w * 0.025),
    );
    canvas.drawRRect(cap, main);
    canvas.drawLine(Offset(w * 0.44, h * 0.19), Offset(w * 0.44, h * 0.28), thin);
    canvas.drawLine(Offset(w * 0.56, h * 0.19), Offset(w * 0.56, h * 0.28), thin);

    final neck = Path()
      ..moveTo(w * 0.44, h * 0.28)
      ..lineTo(w * 0.46, h * 0.36)
      ..lineTo(w * 0.54, h * 0.36)
      ..lineTo(w * 0.56, h * 0.28);
    canvas.drawPath(neck, thin);

    final body = Path()
      ..moveTo(w * 0.32, h * 0.40)
      ..quadraticBezierTo(w * 0.26, h * 0.40, w * 0.26, h * 0.52)
      ..lineTo(w * 0.26, h * 0.76)
      ..quadraticBezierTo(w * 0.26, h * 0.88, w * 0.38, h * 0.88)
      ..lineTo(w * 0.62, h * 0.88)
      ..quadraticBezierTo(w * 0.74, h * 0.88, w * 0.74, h * 0.76)
      ..lineTo(w * 0.74, h * 0.52)
      ..quadraticBezierTo(w * 0.74, h * 0.40, w * 0.68, h * 0.40)
      ..close();
    canvas.drawPath(body, main);

    final label = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.36, h * 0.52, w * 0.28, h * 0.18),
      Radius.circular(w * 0.02),
    );
    canvas.drawRRect(label, thin);

    canvas.drawCircle(Offset(w * 0.50, h * 0.61), w * 0.028, fill);

    final mist = Path()
      ..moveTo(w * 0.62, h * 0.14)
      ..quadraticBezierTo(w * 0.70, h * 0.08, w * 0.78, h * 0.12)
      ..quadraticBezierTo(w * 0.72, h * 0.18, w * 0.64, h * 0.16);
    canvas.drawPath(mist, soft);
    canvas.drawPath(mist, thin);
  }

  @override
  bool shouldRepaint(covariant _WorldMarkPainter oldDelegate) =>
      oldDelegate.slug != slug || oldDelegate.color != color || oldDelegate.selected != selected;
}

class _PinnedWorldChip extends StatelessWidget {
  final String label;
  final Color accent;
  final bool selected;
  final VoidCallback onTap;

  const _PinnedWorldChip({
    required this.label,
    required this.accent,
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
                color: selected ? accent : const Color(0xFF6E686C),
              ),
            ),
            const SizedBox(height: 7),
            AnimatedContainer(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              width: selected ? 28 : 0,
              height: 2,
              decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(99)),
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

  const WorldSwitchBar({super.key, this.outerPadding = 16, this.showTitle = true, this.compactFixed = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final worlds = ref.watch(worldsProvider);
    final lang = ref.watch(languageCodeProvider);
    final selected = ref.watch(selectedWorldSlugProvider);
    return worlds.maybeWhen(
      data: (list) {
        if (list.isEmpty) return const SizedBox.shrink();
        final slug = selected != null && list.any((world) => world.slug == selected) ? selected : list.first.slug;
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
                  lang == 'en' ? 'Choose your world' : 'اختر القسم المناسب لك',
                  textAlign: TextAlign.start,
                  style: const TextStyle(fontSize: 20, height: 1.2, fontWeight: FontWeight.w800, color: AppColors.ink),
                ),
              ),
            if (compactFixed)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: outerPadding),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final world in list.where((item) => !item.isGift).take(4))
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: _CategoryWorldIcon(
                            slug: world.slug,
                            label: world.localizedName(lang),
                            accent: world.accent,
                            selected: world.slug == slug,
                            onTap: () {
                              if (world.slug == slug) return;
                              HapticFeedback.selectionClick();
                              ref.read(selectedWorldSlugProvider.notifier).state = world.slug;
                            },
                          ),
                        ),
                      ),
                  ],
                ),
              )
            else
            SizedBox(
              height: 34,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: outerPadding),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final world = list[i];
                  final on = world.slug == slug;
                  return Material(
                    color: on ? world.accent : AppColors.elevated,
                    elevation: on ? 1.5 : 0,
                    shadowColor: world.accent.withValues(alpha: 0.35),
                    shape: StadiumBorder(
                      side: BorderSide(color: on ? world.accent : AppColors.hairline),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        if (on) return;
                        HapticFeedback.selectionClick();
                        ref.read(selectedWorldSlugProvider.notifier).state = world.slug;
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Row(
                          children: [
                            Icon(world.motif, size: 14, color: on ? Colors.white : const Color(0xFF8A848C)),
                            const SizedBox(width: 5),
                            Text(
                              world.localizedName(lang),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: on ? Colors.white : const Color(0xFF3A3438),
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

  const WorldCategoryGallery({super.key, this.outerPadding = 16, this.aspectRatio = _bannerAspect});

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
      _page.animateToPage(next, duration: const Duration(milliseconds: 520), curve: Curves.easeOut);
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
      padding: EdgeInsets.fromLTRB(widget.outerPadding, 0, widget.outerPadding, 2),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: widget.aspectRatio,
            child: PageView.builder(
              controller: _page,
              itemCount: urls.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) => _WideFrame(url: urls[i], accent: widget.accent),
            ),
          ),
          if (urls.length > 1) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < urls.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: i == _index ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _index ? widget.accent : AppColors.hairline,
                      borderRadius: BorderRadius.circular(99),
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
        final banners = data.banners.where((banner) => banner.hasImage).toList();
        if (banners.isEmpty) {
          final cover = world?.coverUrl ?? '';
          if (cover.isNotEmpty) {
            return Padding(
              padding: EdgeInsets.fromLTRB(outerPadding, 12, outerPadding, 4),
              child: _WideFrame(url: cover, accent: world?.accent ?? AppColors.primary),
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

  const WorldCategoryImage({super.key, this.fallbackToBanner = false, this.outerPadding = 16});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slug = ref.watch(selectedWorldSlugProvider);
    if (slug == null) return const SizedBox.shrink();
    final world = ref.watch(worldDetailProvider(slug)).valueOrNull;
    final feed = ref.watch(worldFeedProvider(slug)).valueOrNull;
    final cover = world?.coverUrl ?? '';
    final banners = feed?.banners.where((banner) => banner.hasImage).toList() ?? const <AppBanner>[];
    final firstBanner = banners.isEmpty ? '' : banners.first.imageUrl;
    final url = cover.isNotEmpty ? cover : (fallbackToBanner ? firstBanner : '');
    if (url.isEmpty) return const SizedBox.shrink();
    if (!fallbackToBanner && banners.isNotEmpty && url == firstBanner) return const SizedBox.shrink();
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
      _page.animateToPage(next, duration: const Duration(milliseconds: 520), curve: Curves.easeOut);
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
      padding: EdgeInsets.fromLTRB(widget.outerPadding, 0, widget.outerPadding, 2),
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
                  child: _WideFrame(url: banner.imageUrl, accent: widget.accent, padding: EdgeInsets.zero),
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
                    duration: const Duration(milliseconds: 180),
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: i == _index ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _index ? widget.accent : AppColors.hairline,
                      borderRadius: BorderRadius.circular(99),
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
    final brands = ref.watch(worldFeedProvider(slug)).valueOrNull?.brands ?? const [];
    if (brands.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
          child: Row(
            children: [
              Text(
                lang == 'en' ? 'Our brands' : 'برانداتنا',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink),
              ),
              const Spacer(),
              Material(
                color: AppColors.elevated,
                borderRadius: BorderRadius.circular(999),
                child: InkWell(
                  onTap: () => context.push('/brands'),
                  borderRadius: BorderRadius.circular(999),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    child: Row(
                      children: [
                        Text(lang == 'en' ? 'All' : 'عرض الكل', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        Icon(
                          Directionality.of(context) == TextDirection.rtl ? Icons.chevron_left_rounded : Icons.chevron_right_rounded,
                          size: 18,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 98,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: brands.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final brand = brands[i];
              final name = brand.localizedName(lang);
              return InkWell(
                onTap: () => context.push('/products?brandId=${brand.id}&title=${Uri.encodeComponent(name)}'),
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
                          border: Border.all(color: AppColors.hairline),
                          boxShadow: const [BoxShadow(color: Color(0x0F000000), blurRadius: 8, offset: Offset(0, 3))],
                        ),
                        clipBehavior: Clip.antiAlias,
                        alignment: Alignment.center,
                        padding: const EdgeInsets.all(10),
                        child: brand.logoUrl.isEmpty
                            ? Text(
                                name.isEmpty ? '•' : name.substring(0, 1),
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.ink),
                              )
                            : AppNetworkImage(url: brand.logoUrl, fit: BoxFit.contain, backgroundColor: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF3A3438)),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
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
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(
            begin: AlignmentDirectional.centerStart,
            end: AlignmentDirectional.centerEnd,
            colors: [world.accent, Color.alphaBlend(world.accent.withValues(alpha: 0.45), world.canvas)],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22),
          child: Row(
            children: [
              Icon(world.motif, color: Colors.white, size: 28),
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
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    if (world.localizedTagline(lang).isNotEmpty)
                      Text(
                        world.localizedTagline(lang),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13, fontWeight: FontWeight.w600),
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
          child: AppNetworkImage(url: url, fit: BoxFit.cover, backgroundColor: AppColors.blush),
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
    return Padding(padding: padding, child: AspectRatio(aspectRatio: _bannerAspect, child: framed));
  }
}
