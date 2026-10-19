import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/motion/app_motion.dart';
import '../../../core/motion/offscreen_pause.dart';
import '../../../core/perf/device_perf.dart';
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

class _WorldBannerCarouselState extends ConsumerState<WorldBannerCarousel>
    with SingleTickerProviderStateMixin, MotionGateMixin {
  final _page = PageController(viewportFraction: 0.9);

  /// زمن بقاء البنر الحالي: يملأ النقطة النشطة، وعند اكتماله يُقلب البنر.
  /// متحكّم واحد يتوقف خارج الشاشة/أثناء التمرير/في التبويب المخفي — فلا
  /// إطارات تعمل والرئيسية ساكنة أو مخفية.
  late final AnimationController _dwell = AnimationController(
    vsync: this,
    duration: _interval,
  )..addStatusListener(_onDwellStatus);

  /// الأجهزة البسيطة: مؤقّت بلا إطارات (نقاط ثابتة) بدل متحكّم يرسم كل vsync.
  Timer? _lowTimer;
  int _index = 0;
  int _count = 0;
  String? _key;
  bool _touching = false;
  bool _reduceMotion = false;

  bool get _low => DevicePerf.isLow;

  /// «تقليل الحركة»: لا تقليب تلقائي — التنقل بالسحب فقط.
  bool get _autoPlay => _count >= 2 && !_reduceMotion;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reduceMotion = MediaQuery.disableAnimationsOf(context);
    _sync();
  }

  @override
  void onMotionGateChanged(bool allowed) => _sync();

  @override
  void dispose() {
    _lowTimer?.cancel();
    _dwell.dispose();
    _page.dispose();
    super.dispose();
  }

  /// يبدأ العدّ من جديد — بعد كل تقليب أو سحب يدوي تُحسب المهلة كاملة.
  void _restart() {
    _lowTimer?.cancel();
    _lowTimer = null;
    _dwell.stop();
    _dwell.value = 0;
    _sync();
  }

  /// يشغّل العدّ أو يوقفه بحسب الظهور واللمس — الاستئناف يكمل من حيث توقف.
  void _sync() {
    if (!mounted) return;
    final run = _autoPlay && motionAllowed && !_touching;
    if (_low) {
      if (!run) {
        _lowTimer?.cancel();
        _lowTimer = null;
      } else {
        _lowTimer ??= Timer.periodic(_interval, (_) => _advance());
      }
      return;
    }
    if (!run) {
      if (_dwell.isAnimating) _dwell.stop();
      return;
    }
    if (_dwell.isCompleted) {
      // اكتمل العدّ والبنر خارج الشاشة: نقلب الآن بعد العودة.
      _advance();
    } else if (!_dwell.isAnimating) {
      _dwell.forward();
    }
  }

  void _onDwellStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed) _advance();
  }

  void _advance() {
    if (!mounted || !_page.hasClients || _touching || !motionAllowed || _count < 2) return;
    _page
        .animateToPage(
          (_index + 1) % _count,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOutCubic,
        )
        .then((_) {
          // لم يتغيّر الفهرس (عدد البنرات تبدّل مثلاً): لا نعلق على عدّ مكتمل.
          if (mounted && !_low && _dwell.isCompleted) _restart();
        });
  }

  /// قرب الصفحة [i] من المنتصف: 0 للنشطة، 1 للمجاورة.
  double _delta(int i) {
    if (_page.hasClients && _page.position.haveDimensions) {
      return ((_page.page ?? 0) - i).clamp(-1.0, 1.0);
    }
    return (i - _index).toDouble().clamp(-1.0, 1.0);
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
    _count = banners.length;

    final key = '$slug-${banners.length}';
    if (_key != key) {
      _key = key;
      _index = 0;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (_page.hasClients) _page.jumpToPage(0);
        _restart();
        scheduleMotionGateCheck();
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
    final low = _low;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    // خفوت المجاورة = طبقة بلون الورقة خلفها (يعادل شفافية 65% بصرياً) — لا
    // Opacity ولا saveLayer لكل بطاقة مجاورة.
    final dimColor = t.surface;
    // ظل ثابت (لا يتبدّل كل إطار)، ولا ظل على الأجهزة البسيطة.
    final shadow = low
        ? null
        : [
            BoxShadow(
              color: color.withValues(alpha: 0.18),
              blurRadius: 16,
              offset: const Offset(0, 6),
              spreadRadius: -6,
            ),
          ];
    // النقطة النشطة تمتلئ تدريجياً فقط حين يعمل العدّ بالمتحكّم.
    final animatedDot = !low && _autoPlay;

    return Column(
      children: [
        SizedBox(
          height: height,
          child: Listener(
            onPointerDown: (_) {
              _touching = true;
              _sync();
            },
            onPointerUp: (_) {
              _touching = false;
              _restart();
            },
            onPointerCancel: (_) {
              _touching = false;
              _sync();
            },
            child: PageView.builder(
              controller: _page,
              itemCount: banners.length,
              onPageChanged: (i) {
                // اهتزاز للسحب باليد فقط — التقليب التلقائي يمرّ بصمت.
                if (_touching) AppHaptics.select();
                setState(() => _index = i);
                _restart();
              },
              itemBuilder: (context, i) {
                final b = banners[i];
                final image = AppNetworkImage(
                  url: b.imageUrl,
                  fit: BoxFit.cover,
                  backgroundColor: Color.lerp(color, Colors.white, 0.82),
                );
                // صورة نقية بلا أي كتابة: البنر نفسه هو الرسالة.
                // البطاقة النشطة بحجمها الكامل، والمجاورة تصغر وتخفت قليلاً — عمق راقٍ.
                final card = GestureDetector(
                  onTap: b.hasLink ? () => openBannerLink(context, b) : null,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(HomeTheme.radiusBanner),
                      boxShadow: shadow,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(HomeTheme.radiusBanner),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // اختلاف منظور خفيف: الصورة تتحرك أبطأ من بطاقتها.
                          // تكبير 4% يكفي لإزاحة 14 بكسل دون قصّ أطراف البنر.
                          if (low)
                            image
                          else
                            AnimatedBuilder(
                              animation: _page,
                              child: image,
                              builder: (context, image) => Transform.translate(
                                offset: Offset((rtl ? -1 : 1) * _delta(i) * 14, 0),
                                child: Transform.scale(scale: 1.04, child: image),
                              ),
                            ),
                          AnimatedBuilder(
                            animation: _page,
                            builder: (context, _) {
                              final d = _delta(i).abs();
                              if (d < 0.01) return const SizedBox.shrink();
                              return ColoredBox(color: dimColor.withValues(alpha: d * 0.35));
                            },
                          ),
                          // حافة داخلية رفيعة — لمسة زجاجية تحدد البطاقة بأناقة.
                          DecoratedBox(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(HomeTheme.radiusBanner),
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
                );
                return Semantics(
                  button: b.hasLink,
                  image: true,
                  label: b.titleForLang(lang) ?? s.homeMediaPromotion,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                    child: low
                        ? card
                        : AnimatedBuilder(
                            animation: _page,
                            child: card,
                            builder: (context, card) => Transform.scale(
                              scale: 1 - _delta(i).abs() * 0.08,
                              child: card,
                            ),
                          ),
                  ),
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
                // البسيطة و«تقليل الحركة»: النشطة ممتلئة مباشرة.
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _index ? 26 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _index
                        ? (animatedDot ? color.withValues(alpha: 0.25) : color)
                        : t.hairline,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: i == _index && animatedDot
                      ? RepaintBoundary(
                          child: CustomPaint(
                            painter: _DotFillPainter(
                              progress: _dwell,
                              color: color,
                              rtl: rtl,
                            ),
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

/// امتلاء النقطة النشطة — رسم فقط (بلا بناء ولا تخطيط) مع كل إطار من [progress].
class _DotFillPainter extends CustomPainter {
  final Animation<double> progress;
  final Color color;
  final bool rtl;

  _DotFillPainter({required this.progress, required this.color, required this.rtl})
    : super(repaint: progress);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width * progress.value.clamp(0.0, 1.0);
    if (w <= 0) return;
    final left = rtl ? size.width - w : 0.0;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(left, 0, w, size.height),
        Radius.circular(size.height / 2),
      ),
      Paint()..color = color,
    );
  }

  @override
  bool shouldRepaint(_DotFillPainter old) =>
      old.progress != progress || old.color != color || old.rtl != rtl;
}
