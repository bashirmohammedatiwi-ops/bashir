/// أحجام البطاقات من لوحة التحكم — تطابق backend/card-sizes.util.ts
class CardSizeSpec {
  final double width;
  final double height;
  final double bannerAspect;
  final double productWidth;

  const CardSizeSpec({
    required this.width,
    required this.height,
    this.bannerAspect = 1.35,
    this.productWidth = 158,
  });
}

const _specs = <String, CardSizeSpec>{
  'xs': CardSizeSpec(width: 88, height: 108, bannerAspect: 1.15, productWidth: 136),
  'sm': CardSizeSpec(width: 104, height: 128, bannerAspect: 1.25, productWidth: 148),
  'md': CardSizeSpec(width: 116, height: 142, bannerAspect: 1.35, productWidth: 158),
  'lg': CardSizeSpec(width: 132, height: 158, bannerAspect: 1.45, productWidth: 168),
  'xl': CardSizeSpec(width: 148, height: 172, bannerAspect: 1.55, productWidth: 178),
  'wide': CardSizeSpec(width: 168, height: 112, bannerAspect: 2.35, productWidth: 158),
  'tall': CardSizeSpec(width: 108, height: 176, bannerAspect: 0.72, productWidth: 148),
  'hero': CardSizeSpec(width: 0, height: 200, bannerAspect: 2.35, productWidth: 158),
};

const _variedCycle = ['sm', 'lg', 'md', 'xl', 'md', 'tall'];

CardSizeSpec cardSizeSpec(String? id) => _specs[id] ?? _specs['md']!;

String? readCardSize(Map<String, dynamic>? json) => json?['cardSize']?.toString();

CardSizeSpec resolveItemCardSize({
  String? cardSize,
  String? sectionLayout,
  int index = 0,
  String? defaultSize,
}) {
  if (cardSize != null && cardSize.isNotEmpty) return cardSizeSpec(cardSize);
  if (sectionLayout == 'varied') return cardSizeSpec(_variedCycle[index % _variedCycle.length]);
  if (defaultSize != null && defaultSize.isNotEmpty) return cardSizeSpec(defaultSize);
  return cardSizeSpec('md');
}

double sectionPadding(double? value, double fallback) =>
    value != null && value >= 0 ? value : fallback;
