import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import '../widgets/gallery_photo_card.dart';
import '../widgets/gallery_tile_sizer.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

/// معرض صور — تصميم موحّد لكل الصور حسب إعدادات القسم من لوحة التحكم.
class PhotoWallSection extends StatelessWidget {
  final HomeSection section;
  const PhotoWallSection({super.key, required this.section});

  GalleryRenderStyle get _style => GalleryRenderStyle.fromSection(section);

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final style = _style;
    final display = _resolveDisplay(section.display ?? section.layout ?? section.sectionLayout);
    final gap = section.marqueeGap ?? HomeTheme.itemGap;
    final padH = section.fullBleed ? 0.0 : HomeTheme.paddingH;
    final columns = _columns(section);

    void onTap(Map<String, dynamic> raw) => openSectionItemLink(context, raw);

    // الصفوف الأفقية (تمرير/شريط متحرك) تمتد حتى حافة الشاشة والحشوة داخلها، مثل صفوف
    // المنتجات؛ الشبكة والمكدّس والفسيفساء والصفحات تبقى داخل الحشوة.
    final Widget child = switch (display) {
      'marquee' => _marquee(items, gap, style, padH),
      'scroll' => GalleryHorizontalLayout(
        section: section,
        items: items,
        gap: gap,
        style: style,
        onTap: onTap,
        padding: EdgeInsets.symmetric(horizontal: padH),
      ),
      _ => Padding(
        padding: EdgeInsets.symmetric(horizontal: padH),
        child: switch (display) {
          'mosaic' => _mosaic(items, gap, style, onTap),
          'stack' => GalleryStackLayout(
            section: section,
            items: items,
            gap: gap,
            style: style,
            onTap: onTap,
          ),
          'pager' => _PhotoPager(section: section, items: items, style: style, onTap: onTap),
          _ => GalleryGridLayout(
            section: section,
            items: items,
            gap: gap,
            style: style,
            columns: columns,
            onTap: onTap,
          ),
        },
      ),
    };

    return HomeSectionShell(section: section, wrapCard: false, child: child);
  }

  int _columns(HomeSection section) {
    final layout = (section.sectionLayout ?? section.layout ?? '').toLowerCase();
    if (layout == 'grid3' || layout == '3') return 3;
    final fromDisplay = int.tryParse(layout.replaceAll('grid', ''));
    if (fromDisplay != null && fromDisplay > 0) return fromDisplay.clamp(2, 3);
    return 2;
  }

  String _resolveDisplay(String? raw) {
    final d = raw?.trim().toLowerCase() ?? '';
    return switch (d) {
      'marquee' => 'marquee',
      'grid' || 'grid2' || 'grid3' => 'grid',
      'mosaic' => 'mosaic',
      'stack' => 'stack',
      'pager' || 'flip' => 'pager',
      'scroll' || 'carousel' => 'scroll',
      'bento' || 'stagger' => 'grid',
      _ => switch (section.type) {
        'IMAGE_MARQUEE' => 'marquee',
        'PHOTO_WALL' || 'IMAGE_COLLAGE' => 'grid',
        'IMAGE_TILES' => 'grid',
        _ => 'scroll',
      },
    };
  }

  Widget _mosaic(
    List<Map<String, dynamic>> items,
    double gap,
    GalleryRenderStyle style,
    void Function(Map<String, dynamic> raw) onTap,
  ) {
    if (items.isEmpty) return const SizedBox.shrink();
    final first = items.first;
    final rest = items.skip(1).toList();
    return Column(
      children: [
        GalleryStackLayout(section: section, items: [first], gap: gap, style: style, onTap: onTap),
        if (rest.isNotEmpty) ...[
          SizedBox(height: gap),
          GalleryGridLayout(
            section: section,
            items: rest,
            gap: gap,
            style: style,
            columns: 2,
            onTap: onTap,
          ),
        ],
      ],
    );
  }

  Widget _marquee(
    List<Map<String, dynamic>> items,
    double gap,
    GalleryRenderStyle style,
    double padH,
  ) {
    final shape = style.defaultShape;
    // الأشكال ذات الزوايا المحسوبة (حبة/قوس/دائرة) تتجاهلها البلاطة نفسها.
    final radius = style.tileCornerRadius ?? HomeTheme.galleryRadius;

    return LayoutBuilder(
      builder: (context, constraints) {
        final sizer = GalleryTileSizer.forSection(
          // الشريط بعرض الشاشة، ومقاس البلاطات كما كان داخل الحشوة.
          viewportWidth: math.max(0.0, constraints.maxWidth - padH * 2),
          gap: gap,
          section: section,
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
        );
        final tileH = sizer.tileHeight;
        final tileW = sizer.tileWidth;

        final images = <HomeMarqueeImage>[];
        for (final raw in items) {
          final data = style.tileData(raw);
          if (data.imageUrl.isEmpty) continue;
          images.add(
            HomeMarqueeImage.fromItem(
              url: data.imageUrl,
              width: tileW,
              height: tileH,
              shape: shape,
              raw: raw,
            ),
          );
        }
        if (images.isEmpty) return const SizedBox.shrink();

        return HomeImageMarquee(
          key: ValueKey(
            'marquee-${section.id}-${images.map((e) => '${e.url}:${e.linkSignature}').join('|')}',
          ),
          images: images,
          height: tileH,
          speed: section.marqueeSpeed ?? 5,
          gap: gap,
          radius: radius,
          startFromEndInRtl: true,
          reverse: section.motion == 'reverse',
        );
      },
    );
  }
}

class _PhotoPager extends StatefulWidget {
  final HomeSection section;
  final List<Map<String, dynamic>> items;
  final GalleryRenderStyle style;
  final void Function(Map<String, dynamic> raw) onTap;

  const _PhotoPager({
    required this.section,
    required this.items,
    required this.style,
    required this.onTap,
  });

  @override
  State<_PhotoPager> createState() => _PhotoPagerState();
}

class _PhotoPagerState extends State<_PhotoPager> {
  late final PageController _page;
  Timer? _timer;
  int _index = 0;
  bool _tickerEnabled = true;
  bool _reduceMotion = false;
  bool _initialized = false;
  ModalRoute<dynamic>? _route;

  List<Map<String, dynamic>> get _visible => [
    for (final raw in widget.items)
      if (widget.style.tileData(raw).imageUrl.isNotEmpty) raw,
  ];

  @override
  void initState() {
    super.initState();
    _page = PageController(viewportFraction: 0.9);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // تُقرأ هنا لا داخل المؤقت (لا اعتماديات من خارج build).
    _tickerEnabled = TickerMode.valuesOf(context).enabled;
    _route = ModalRoute.of(context);
    final reduce = MediaQuery.disableAnimationsOf(context);
    if (reduce != _reduceMotion || !_initialized) {
      _initialized = true;
      _reduceMotion = reduce;
      _arm();
    }
  }

  @override
  void didUpdateWidget(_PhotoPager old) {
    super.didUpdateWidget(old);
    if (old.items.length != widget.items.length ||
        old.section.marqueeSpeed != widget.section.marqueeSpeed) {
      final count = _visible.length;
      if (_index >= count) _index = count == 0 ? 0 : count - 1;
      _arm();
    }
  }

  /// يبدأ العدّ من جديد — بعد كل سحب يدوي تُحسب المهلة كاملة.
  void _arm() {
    _timer?.cancel();
    _timer = null;
    final count = _visible.length;
    // «تقليل الحركة»: لا تقليب تلقائي — التنقل بالسحب فقط.
    if (count < 2 || _reduceMotion) return;
    final seconds = (11 - (widget.section.marqueeSpeed ?? 4).clamp(1, 10)).clamp(3, 10);
    _timer = Timer.periodic(Duration(seconds: seconds.toInt()), (_) {
      // لا تقليب والتبويب مخفي، أو فوقه شاشة أخرى، أو القسم خارج الشاشة.
      if (!mounted || !_page.hasClients || !_tickerEnabled) return;
      if (_route != null && !_route!.isCurrent) return;
      if (!_onScreen()) return;
      final next = (_index + 1) % count;
      _page.animateToPage(
        next,
        duration: const Duration(milliseconds: 560),
        curve: Curves.easeOutCubic,
      );
    });
  }

  bool _onScreen() {
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.hasSize || !box.attached) return false;
    final top = box.localToGlobal(Offset.zero).dy;
    return top < MediaQuery.sizeOf(context).height && top + box.size.height > 0;
  }

  bool _onScroll(ScrollNotification n) {
    if (n.depth != 0) return false;
    if (n is ScrollStartNotification && n.dragDetails != null) {
      // العميلة تسحب: لا نقلب الصفحة من تحت إصبعها.
      _timer?.cancel();
      _timer = null;
    } else if (n is ScrollEndNotification) {
      _arm();
    }
    return false;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final items = _visible;
    if (items.isEmpty) return const SizedBox.shrink();
    final aspect = GalleryTileSizer.resolveAspect(
      widget.section,
      defaultAspect: widget.style.defaultAspect,
    );
    return Column(
      children: [
        AspectRatio(
          aspectRatio: aspect <= 0 ? 16 / 9 : aspect,
          child: NotificationListener<ScrollNotification>(
            onNotification: _onScroll,
            child: PageView.builder(
              controller: _page,
              itemCount: items.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) {
                final raw = items[i];
                final data = widget.style.tileData(raw);
                return LayoutBuilder(
                  builder: (context, constraints) => GalleryPhotoCard(
                    data: data,
                    width: constraints.maxWidth,
                    height: constraints.maxHeight,
                    fit: widget.style.fit,
                    cornerRadiusOverride: widget.style.cornerRadiusFor(data.shape),
                    onTap: () => widget.onTap(raw),
                    showShadow: widget.section.showShadow,
                  ),
                );
              },
            ),
          ),
        ),
        if (items.length > 1) ...[
          const SizedBox(height: 8),
          ExcludeSemantics(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < items.length; i++)
                  AnimatedContainer(
                    duration: _reduceMotion ? Duration.zero : const Duration(milliseconds: 180),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: i == _index ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _index ? t.accent : t.hairline.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
