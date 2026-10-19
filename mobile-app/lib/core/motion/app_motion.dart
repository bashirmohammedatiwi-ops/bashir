import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// مفردات الحركة واللمس الموحّدة في التطبيق: نفس المدد والمنحنيات والاهتزازات
/// في كل مكان، فتبدو اللحظات المميزة (تبديل العالم، الإضافة للسلة، القلب)
/// من يد واحدة. كل حركة جديدة تُتخطّى حين يفعّل النظام «تقليل الحركة».

/// مدد الحركة: سريعة للتأكيدات الصغيرة، أساسية للتبديل، بطيئة للمشاهد الكبيرة.
abstract final class MotionDurations {
  static const fast = Duration(milliseconds: 160);
  static const base = Duration(milliseconds: 240);
  static const slow = Duration(milliseconds: 360);

  /// نبضة الشارة عند زيادة العدد.
  static const bump = Duration(milliseconds: 260);

  /// مدة بقاء علامة «أُضيف» على زر السلة قبل أن يعود لحالته.
  static const confirm = Duration(milliseconds: 900);
}

/// منحنيات الحركة الموحّدة.
abstract final class MotionCurves {
  /// الدخول والاستقرار — الافتراضي لكل انتقال.
  static const standard = Curves.easeOutCubic;

  /// الخروج: يبدأ هادئاً ويتسارع بعيداً.
  static const exit = Curves.easeInCubic;

  /// ارتداد ناعم للتأكيدات (الشارة، القلب، علامة الصح).
  static const pop = Curves.easeOutBack;
}

/// تفضيلات الحركة من النظام.
abstract final class MotionPrefs {
  /// «تقليل الحركة» مفعّل: لا انزلاق ولا نبض — التغيير فوري.
  static bool reduced(BuildContext context) =>
      MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  /// المدة كما هي، أو صفر حين تُقلَّل الحركة.
  static Duration of(BuildContext context, Duration d) =>
      reduced(context) ? Duration.zero : d;
}

/// اهتزازات بالنيّة لا بالنوع — كل ميزة تختار ما تعنيه اللمسة.
abstract final class AppHaptics {
  /// اختيار أو تنقّل (تبويب، شريحة، عالم).
  static void select() => HapticFeedback.selectionClick();

  /// إضافة شيء (للسلة، كمية).
  static void add() => HapticFeedback.lightImpact();

  /// نجاح يستحق الاحتفال (حفظ في المفضلة، إتمام).
  static void success() => HapticFeedback.mediumImpact();

  /// تنبيه أو فعل لا رجعة فيه.
  static void warn() => HapticFeedback.heavyImpact();
}

/// ينبض ابنه (1 ← 1.25 ← 1) كلما زادت [value] — شارة السلة مثلاً.
/// النقصان والظهور الأول بلا نبض، و«تقليل الحركة» يلغيه تماماً.
class BadgeBump extends StatefulWidget {
  final int value;
  final Widget child;

  const BadgeBump({super.key, required this.value, required this.child});

  @override
  State<BadgeBump> createState() => _BadgeBumpState();
}

class _BadgeBumpState extends State<BadgeBump>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: MotionDurations.bump,
  );

  late final Animation<double> _scale = TweenSequence<double>([
    TweenSequenceItem(
      tween: Tween(
        begin: 1.0,
        end: 1.25,
      ).chain(CurveTween(curve: Curves.easeOutCubic)),
      weight: 40,
    ),
    TweenSequenceItem(
      tween: Tween(
        begin: 1.25,
        end: 1.0,
      ).chain(CurveTween(curve: MotionCurves.pop)),
      weight: 60,
    ),
  ]).animate(_c);

  @override
  void didUpdateWidget(covariant BadgeBump oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value > oldWidget.value && !MotionPrefs.reduced(context)) {
      _c.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      ScaleTransition(scale: _scale, child: widget.child);
}
