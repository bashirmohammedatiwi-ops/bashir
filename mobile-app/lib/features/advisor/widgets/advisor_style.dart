import 'package:flutter/material.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_fonts.dart';

/// هوية «ديما» البصرية — ثابتة لا تتبع العالم النشط حتى تبقى شخصيتها واحدة.
abstract final class AdvisorStyle {
  static const ink = AppColors.ink;
  static const inkSoft = Color(0xFF5E5670);
  static const inkMuted = Color(0xFF9A93A8);
  static const glass = Color(0xEBFFFFFF);
  static const glassBorder = Color(0xFFF1E8F6);
  static const tint = Color(0xFFF7F0FC);

  /// بنفسجي النصوص المميزة (أسماء بين «»، نسب الملاءمة، الاختيار المحدد).
  static const accentText = Color(0xFF7A3FB8);
  /// حدّ وردي-بنفسجي للبطاقات البارزة والأزرار الثانوية.
  static const accentBorder = Color(0xFFEBD3EE);
  /// خلفية مناطق الصور والبطاقات الثانوية.
  static const surface = Color(0xFFFAF6FC);
  /// لون صفحة «ديما» تحت الشفق، وخلفية الأوراق السفلية.
  static const bg = Color(0xFFFFFAFB);
  static const successBg = Color(0xFFE9F7EF);
  static const successFg = Color(0xFF137A48);
  static const warnBg = Color(0xFFFFF5E3);
  static const warnFg = Color(0xFFA8650A);

  static const gradient = LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    colors: [BrandColors.orchid, BrandColors.rose],
  );

  static const softGradient = LinearGradient(
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
    colors: [Color(0xFFF6EEFD), Color(0xFFFDEEF5)],
  );

  static List<BoxShadow> shadow([double strength = 1]) => [
        BoxShadow(
          color: BrandColors.orchid.withValues(alpha: 0.10 * strength),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
        BoxShadow(
          color: AppColors.ink.withValues(alpha: 0.04 * strength),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static TextStyle text({double size = 14, FontWeight weight = FontWeight.w500, Color color = ink, double height = 1.5}) =>
      appFont(fontSize: size, fontWeight: weight, color: color, height: height);
}

/// كرة «ديما» المصغّرة الثابتة (للفقاعات) — بلا حركة حتى تبقى القائمة خفيفة.
class AdvisorMiniOrb extends StatelessWidget {
  final double size;
  const AdvisorMiniOrb({super.key, this.size = 28});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [BrandColors.orchidLight, BrandColors.orchid, BrandColors.rose],
        ),
        boxShadow: [
          BoxShadow(color: BrandColors.rose.withValues(alpha: 0.28), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      alignment: Alignment.center,
      child: BrandMark(height: size * 0.42, color: Colors.white),
    );
  }
}

/// نص بتدرّج الهوية.
class AdvisorGradientText extends StatelessWidget {
  final String text;
  final TextStyle style;
  const AdvisorGradientText(this.text, {super.key, required this.style});

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (r) => AdvisorStyle.gradient.createShader(r, textDirection: Directionality.of(context)),
      child: Text(text, style: style),
    );
  }
}
