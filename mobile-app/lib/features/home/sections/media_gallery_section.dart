import 'package:flutter/material.dart';

import '../../../core/widgets/app_network_image.dart';
import '../home_link.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../../../data/models/home_section.dart';

class MediaGallerySection extends StatelessWidget {
  final HomeSection section;
  const MediaGallerySection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final display = section.display ?? section.layout ?? 'scroll';
    final defaultShape = section.shape ?? 'rounded';
    final defaultSize = section.cardSize ?? 'md';
    final height = section.imageHeight ?? _sizeHeight(defaultSize);
    final gap = section.marqueeGap ?? 12;

    return HomeSectionShell(
      section: section,
      wrapCard: display != 'stack',
      child: switch (display) {
        'marquee' => _marquee(context, items, height, gap, defaultShape, defaultSize),
        'grid' => _grid(context, items, height, gap, defaultShape, defaultSize),
        'stack' => _stack(context, items, defaultShape),
        _ => _scroll(context, items, height, gap, defaultShape, defaultSize),
      },
    );
  }

  Widget _scroll(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
  ) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: items.length,
        separatorBuilder: (_, __) => SizedBox(width: gap),
        itemBuilder: (_, i) => _tile(context, items[i], height, defaultShape, defaultSize),
      ),
    );
  }

  Widget _marquee(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
  ) {
    final images = <HomeMarqueeImage>[];
    for (final raw in items) {
      final m = Map<String, dynamic>.from(raw);
      final url = _imageUrl(m);
      if (url.isEmpty) continue;
      final w = _tileWidth(height, m['shape']?.toString() ?? defaultShape, m['size']?.toString() ?? defaultSize);
      images.add(
        HomeMarqueeImage(
          url: url,
          width: w,
          onTap: () => _openLink(context, m),
        ),
      );
    }
    if (images.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: HomeImageMarquee(
        images: images,
        height: height,
        speed: section.marqueeSpeed ?? 5,
        gap: gap,
        radius: _radiusForShape(defaultShape, height),
      ),
    );
  }

  Widget _grid(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
  ) {
    final cols = int.tryParse(section.sectionLayout ?? '') ?? 3;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: cols.clamp(2, 4),
          mainAxisSpacing: gap,
          crossAxisSpacing: gap,
          childAspectRatio: _aspectForShape(defaultShape),
        ),
        itemCount: items.length,
        itemBuilder: (_, i) => _tile(context, items[i], height, defaultShape, defaultSize, expand: true),
      ),
    );
  }

  Widget _stack(BuildContext context, List<Map> items, String defaultShape) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) SizedBox(height: section.marqueeGap ?? 12),
            _stackTile(context, items[i], defaultShape),
          ],
        ],
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    Map raw,
    double height,
    String defaultShape,
    String defaultSize, {
    bool expand = false,
  }) {
    final m = Map<String, dynamic>.from(raw);
    final url = _imageUrl(m);
    if (url.isEmpty) return const SizedBox.shrink();
    final shape = m['shape']?.toString() ?? defaultShape;
    final size = m['size']?.toString() ?? defaultSize;
    final w = expand ? null : _tileWidth(height, shape, size);
    final radius = _radiusForShape(shape, height);

    return GestureDetector(
      onTap: () => _openLink(context, m),
      child: Container(
        width: w,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(radius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: AppNetworkImage(url: url, fit: BoxFit.cover, width: w, height: height),
      ),
    );
  }

  Widget _stackTile(BuildContext context, Map raw, String defaultShape) {
    final m = Map<String, dynamic>.from(raw);
    final url = _imageUrl(m);
    if (url.isEmpty) return const SizedBox.shrink();
    final shape = m['shape']?.toString() ?? defaultShape;
    final aspect = shape == 'banner' ? 16 / 9 : 4 / 3;
    return GestureDetector(
      onTap: () => _openLink(context, m),
      child: AspectRatio(
        aspectRatio: aspect,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_radiusForShape(shape, 120)),
          child: AppNetworkImage(url: url, fit: BoxFit.cover),
        ),
      ),
    );
  }

  void _openLink(BuildContext context, Map<String, dynamic> m) {
    openSectionLink(
      context,
      linkType: m['linkType']?.toString(),
      linkValue: m['linkValue']?.toString(),
      legacyLink: m['link']?.toString(),
    );
  }

  String _imageUrl(Map<String, dynamic> m) {
    final direct = m['imageUrl']?.toString();
    if (direct != null && direct.isNotEmpty) return direct;
    final image = m['image'];
    if (image is Map) {
      final map = Map<String, dynamic>.from(image);
      for (final key in ['url', 'full', 'hero', 'thumb']) {
        final v = map[key]?.toString();
        if (v != null && v.isNotEmpty) return v;
      }
    }
    return '';
  }

  double _sizeHeight(String size) {
    return switch (size) {
      'xs' => 72,
      'sm' => 96,
      'md' => 128,
      'lg' => 160,
      'xl' => 200,
      'full' => 180,
      _ => 128,
    };
  }

  double _tileWidth(double height, String shape, String size) {
    if (size == 'full') return height * 1.6;
    if (shape == 'circle') return height;
    if (shape == 'banner') return height * 1.85;
    return switch (size) {
      'xs' => 72,
      'sm' => 96,
      'md' => 128,
      'lg' => 160,
      'xl' => 200,
      _ => height,
    };
  }

  double _radiusForShape(String shape, double height) {
    return switch (shape) {
      'circle' => height / 2,
      'pill' => height / 2,
      'rect' => 6,
      'banner' => 16,
      _ => 14,
    };
  }

  double _aspectForShape(String shape) {
    return switch (shape) {
      'circle' => 1,
      'banner' => 16 / 9,
      _ => 0.85,
    };
  }
}
