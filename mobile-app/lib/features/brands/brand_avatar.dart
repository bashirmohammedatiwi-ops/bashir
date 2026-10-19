import 'package:flutter/material.dart';

import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/brand.dart';
import '../worlds/world_theme.dart';

/// شعار البراند الموحّد — دليل البراندات، المميزة، وفقاعات لوحة الأقسام:
/// الشعار على أبيض، أو الحرف الأول على لون البراند حين لا شعار.
class BrandAvatar extends StatelessWidget {
  final Brand brand;

  /// قطر الدائرة (أو ضلع المربع حين [framed] = false).
  final double size;

  /// دائرة بيضاء بحلقة ناعمة حول الشعار. تُطفأ حين يأتي اللوح الأبيض من الخارج.
  final bool framed;

  const BrandAvatar({
    super.key,
    required this.brand,
    required this.size,
    this.framed = true,
  });

  /// الحرف الظاهر بلا شعار — لا يرمي أبداً: «initial» قد يُحفظ فارغاً من لوحة التحكم.
  static String initialOf(Brand brand) {
    final saved = brand.initial?.trim() ?? '';
    final src = saved.isNotEmpty ? saved : brand.label.trim();
    if (src.isEmpty) return '·';
    return src.characters.first.toUpperCase();
  }

  /// لون الخلفية بلا شعار: لون البراند من لوحة التحكم، وإلا فاتح العالم.
  static Color fallbackColor(Brand brand, WorldThemePalette t) {
    final hex = brand.bgColorHex?.replaceFirst('#', '').trim();
    if (hex == null || hex.length < 6) return t.accentLight;
    final v = int.tryParse(hex.substring(0, 6), radix: 16);
    return v == null ? t.accentLight : Color(0xFF000000 | v);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final Widget inner;
    if (brand.logoUrl.isNotEmpty) {
      // أبعاد محددة: يُفكّ الشعار بحجم ظهوره لا بنصف عرض الشاشة.
      final inset = framed ? size * 0.14 : 0.0;
      final side = size - inset * 2;
      inner = Padding(
        padding: EdgeInsets.all(inset),
        child: AppNetworkImage(
          url: brand.logoUrl,
          width: side,
          height: side,
          fit: BoxFit.contain,
          backgroundColor: Colors.white,
        ),
      );
    } else {
      final bg = fallbackColor(brand, t);
      final dark = bg.computeLuminance() < 0.4;
      final letter = Container(
        width: size,
        height: size,
        color: bg,
        alignment: Alignment.center,
        padding: EdgeInsets.all(size * 0.2),
        child: FittedBox(
          child: Text(
            initialOf(brand),
            textScaler: TextScaler.noScaling,
            style: AppText.title1.copyWith(
              fontSize: size * 0.4,
              height: 1,
              fontWeight: FontWeight.w800,
              color: dark ? Colors.white : t.accentDark.withValues(alpha: 0.8),
            ),
          ),
        ),
      );
      inner = framed ? letter : ClipOval(child: letter);
    }

    // الاسم يقرؤه العنصر الأب (البطاقة أو الفقاعة) — الشعار زخرفة لقارئ الشاشة.
    return ExcludeSemantics(
      child: SizedBox.square(
        dimension: size,
        child: framed
            ? DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  border: Border.all(color: t.accentSoft.withValues(alpha: 0.8)),
                ),
                child: ClipOval(child: inner),
              )
            : Center(child: inner),
      ),
    );
  }
}
