import 'package:flutter/material.dart';

import '../../../core/theme/ad_slots.dart';
import '../home_link.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../../../data/models/home_section.dart';

class ImageMarqueeSection extends StatelessWidget {
  final HomeSection section;
  const ImageMarqueeSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final height = section.imageHeight ?? 120;
    final speed = section.marqueeSpeed ?? 5;
    final gap = section.marqueeGap ?? 12;
    final layout = resolveBannerLayout(section);
    final imageAspect = layout.aspect.clamp(0.8, 3.0);
    final imageW = height * imageAspect;

    final images = <HomeMarqueeImage>[];
    for (final raw in items) {
      final m = Map<String, dynamic>.from(raw);
      final url = _imageUrl(m);
      if (url.isEmpty) continue;
      images.add(
        HomeMarqueeImage(
          url: url,
          width: imageW,
          height: height,
          shape: m['shape']?.toString() ?? 'rounded',
          onTap: () => openSectionLink(
            context,
            linkType: m['linkType']?.toString(),
            linkValue: m['linkValue']?.toString(),
            legacyLink: m['link']?.toString(),
          ),
        ),
      );
    }

    if (images.isEmpty) return const SizedBox.shrink();

    return HomeSectionShell(
      section: section,
      wrapCard: false,
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: layout.fullBleed ? 0 : HomeTheme.paddingH,
        ),
        child: HomeImageMarquee(
          images: images,
          height: height,
          speed: speed,
          gap: gap,
          radius: layout.fullBleed ? 0 : 14,
        ),
      ),
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
}
