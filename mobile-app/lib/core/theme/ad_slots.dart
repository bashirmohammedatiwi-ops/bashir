import '../../../data/models/home_section.dart';

/// مقاسات الإعلانات — يطابق admin ad-slots.ts
class AdSlotSpec {
  final double aspect;
  final bool fullBleed;

  const AdSlotSpec({required this.aspect, this.fullBleed = false});
}

const _adSlots = <String, AdSlotSpec>{
  'fullBleed': AdSlotSpec(aspect: 2.05, fullBleed: true),
  'stripUltra': AdSlotSpec(aspect: 3),
  'ultraWide': AdSlotSpec(aspect: 2.33),
  'wide169': AdSlotSpec(aspect: 1.78),
  'wide21': AdSlotSpec(aspect: 2),
  'hero': AdSlotSpec(aspect: 2.22),
  'wide': AdSlotSpec(aspect: 2.35),
  'standard43': AdSlotSpec(aspect: 1.33),
  'square': AdSlotSpec(aspect: 1),
  'portrait34': AdSlotSpec(aspect: 0.75),
  'portrait23': AdSlotSpec(aspect: 0.67),
  'tall': AdSlotSpec(aspect: 0.72),
  'compact': AdSlotSpec(aspect: 1.05),
  'xs': AdSlotSpec(aspect: 1.15),
  'sm': AdSlotSpec(aspect: 1.25),
  'md': AdSlotSpec(aspect: 1.35),
  'lg': AdSlotSpec(aspect: 1.45),
  'xl': AdSlotSpec(aspect: 1.55),
};

class BannerLayoutConfig {
  final double aspect;
  final bool fullBleed;
  final double radius;
  final String? adSlot;

  const BannerLayoutConfig({
    required this.aspect,
    this.fullBleed = false,
    this.radius = 20,
    this.adSlot,
  });

  double heightFor(double width) => width / aspect;
}

BannerLayoutConfig resolveBannerLayout(
  HomeSection section, {
  int index = 0,
  String? itemCardSize,
}) {
  final customAspect = section.bannerAspect;
  final slotId = itemCardSize ??
      section.adSlot ??
      section.cardSize ??
      _defaultSlotForType(section.type, index: index, section: section);
  final spec = _adSlots[slotId] ?? _adSlots['wide']!;
  final fullBleed = section.fullBleed ||
      spec.fullBleed ||
      slotId == 'fullBleed' ||
      section.sectionLayout == 'fullBleed';
  final aspect =
      (customAspect != null && customAspect > 0) ? customAspect : spec.aspect;
  final radius = fullBleed ? 0.0 : _radiusForAspect(aspect);
  return BannerLayoutConfig(
    aspect: aspect,
    fullBleed: fullBleed,
    radius: radius,
    adSlot: slotId,
  );
}

String _defaultSlotForType(String type, {int index = 0, HomeSection? section}) {
  if (type == 'HERO_BANNER') return 'hero';
  if (type == 'BANNER_FULL' || type == 'CUSTOM_BANNER') return 'wide';
  if (type == 'BANNER_CAROUSEL') return 'wide169';
  if (type == 'BANNER_GRID_2') {
    if (section?.sectionLayout == 'asymmetric') {
      return index == 0 ? 'tall' : 'compact';
    }
    return 'tall';
  }
  if (type == 'BANNER_GRID_3') return 'compact';
  return 'wide';
}

double _radiusForAspect(double aspect) {
  if (aspect >= 2.5) return 18;
  if (aspect >= 1.8) return 20;
  if (aspect <= 0.8) return 18;
  return 16;
}
