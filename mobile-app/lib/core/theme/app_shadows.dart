import 'package:flutter/material.dart';

import '../../features/worlds/world_theme.dart';

/// ظلال موحّدة بثلاث درجات ارتفاع — بلون العالم النشط بدل ظلال مبنية يدوياً في كل مكوّن.
abstract final class AppShadows {
  /// بطاقة على خلفية الصفحة: ظل ناعم منتشر بلون العالم + خط تلامس رفيع.
  static List<BoxShadow> card(WorldThemePalette t) => [
        BoxShadow(
          color: t.accentDark.withValues(alpha: 0.07),
          blurRadius: 18,
          offset: const Offset(0, 8),
          spreadRadius: -4,
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 3,
          offset: const Offset(0, 1),
        ),
      ];

  /// عنصر صغير فاتح مرفوع فوق صورة أو بطاقة (القلب، زر السلة، شريط البحث).
  static List<BoxShadow> raised(WorldThemePalette t) => [
        BoxShadow(
          color: t.ink.withValues(alpha: 0.07),
          blurRadius: 10,
          offset: const Offset(0, 3),
        ),
      ];

  /// عنصر ممتلئ باللون (زر أساسي، عدّاد، شارة خصم): توهّج خفيف بلونه نفسه.
  /// [tint] لون العنصر إن لم يكن لون العالم (مثل وردي الخصم).
  static List<BoxShadow> floating(WorldThemePalette t, {Color? tint}) => [
        BoxShadow(
          color: (tint ?? t.accent).withValues(alpha: 0.28),
          blurRadius: 10,
          offset: const Offset(0, 3),
        ),
      ];
}
