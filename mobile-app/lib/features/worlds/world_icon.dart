import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// أيقونات العوالم — رسوم ملوّنة مرسومة خصيصاً لديما الحياة (assets/worlds).
/// بدون [color] تُرسم بألوانها الأصلية؛ مع [color] تصبح ظلاً أحادي اللون
/// (للزخرفة الكبيرة الشفافة خلف رأس الصفحة).
class WorldIcon extends StatelessWidget {
  final String slug;
  final double size;
  final Color? color;

  /// نسخة بيضاء "منحوتة": الأجزاء الداكنة أبيض صلب واللمعات أبيض شفاف،
  /// فتبقى تفاصيل الرسم ظاهرة فوق لون العالم.
  final bool white;

  /// مُبقى للتوافق مع الاستدعاءات القديمة — لا أثر له على الرسوم الملوّنة.
  final double strokeWidth;

  const WorldIcon({
    super.key,
    required this.slug,
    this.color,
    this.white = false,
    this.size = 24,
    this.strokeWidth = 1.6,
  });

  static String assetFor(String slug) => switch (slug) {
        'beauty-spell' => 'assets/worlds/beauty.svg',
        'care-rituals' => 'assets/worlds/care.svg',
        'his-elegance' => 'assets/worlds/elegance.svg',
        'scent-story' => 'assets/worlds/scent.svg',
        'gift-moments' => 'assets/worlds/gift.svg',
        _ => 'assets/worlds/sparkles.svg',
      };

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      assetFor(slug),
      width: size,
      height: size,
      colorFilter: white
          ? const ColorFilter.matrix(<double>[
              0, 0, 0, 0, 255,
              0, 0, 0, 0, 255,
              0, 0, 0, 0, 255,
              -0.035, -0.12, -0.015, 1, 0,
            ])
          : color == null
              ? null
              : ColorFilter.mode(color!, BlendMode.srcIn),
    );
  }
}
