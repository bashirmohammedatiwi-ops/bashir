import 'package:flutter/material.dart';

import '../../features/worlds/world_theme.dart';
import '../perf/device_perf.dart';

/// ظلال موحّدة بثلاث درجات ارتفاع — بلون العالم النشط بدل ظلال مبنية يدوياً في كل مكوّن.
///
/// بحسب قدرة الجهاز ([DevicePerf]): على Impeller كل ظل تمويه يُعاد رسمه مع كل إطار
/// تمرير وكلفته تكبر مع نصف قطره، فـ:
/// * القوي: الظلال كاملة كما صُمّمت (ظل منتشر + خط تلامس).
/// * المتوسط: ظل واحد يجمع الاثنين (نفس الإحساس بالعمق بنصف عدد التمويهات).
/// * البسيط: ظل واحد قصير (تمويه ≤ 6) — حدّ ناعم يفصل البطاقة بلا كلفة تُذكر.
abstract final class AppShadows {
  /// بطاقة على خلفية الصفحة: ظل ناعم منتشر بلون العالم + خط تلامس رفيع.
  /// في الليلي ظل أسود أعمق — لون العالم الفاتح يتوهّج فوق الخلفية الداكنة.
  static List<BoxShadow> card(WorldThemePalette t) => switch (DevicePerf.tier) {
        PerfTier.low => [
            BoxShadow(
              color: t.isDark
                  ? Colors.black.withValues(alpha: 0.30)
                  : t.accentDark.withValues(alpha: 0.08),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        PerfTier.mid when !t.isDark => [
            // المنتشر وخط التلامس في ظل واحد: أقصر قليلاً وأقرب فيحدّد الحافة أيضاً.
            BoxShadow(
              color: t.accentDark.withValues(alpha: 0.085),
              blurRadius: 14,
              offset: const Offset(0, 6),
              spreadRadius: -4,
            ),
          ],
        _ => t.isDark
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.32),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                  spreadRadius: -4,
                ),
              ]
            : [
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
              ],
      };

  /// عنصر صغير فاتح مرفوع فوق صورة أو بطاقة (القلب، زر السلة، شريط البحث).
  static List<BoxShadow> raised(WorldThemePalette t) => [
        BoxShadow(
          // ink فاتح في الليلي فيتوهّج — ظل أسود بدلاً منه.
          color: t.isDark ? Colors.black.withValues(alpha: 0.30) : t.ink.withValues(alpha: 0.07),
          blurRadius: DevicePerf.isLow ? 5 : 10,
          offset: Offset(0, DevicePerf.isLow ? 2 : 3),
        ),
      ];

  /// عنصر ممتلئ باللون (زر أساسي، عدّاد، شارة خصم): توهّج خفيف بلونه نفسه.
  /// [tint] لون العنصر إن لم يكن لون العالم (مثل وردي الخصم).
  static List<BoxShadow> floating(WorldThemePalette t, {Color? tint}) => [
        BoxShadow(
          color: (tint ?? t.accent).withValues(alpha: DevicePerf.isLow ? 0.24 : 0.28),
          blurRadius: DevicePerf.isLow ? 5 : 10,
          offset: Offset(0, DevicePerf.isLow ? 2 : 3),
        ),
      ];
}
