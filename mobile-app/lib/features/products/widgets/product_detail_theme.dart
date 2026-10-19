import 'dart:math' as math;

import 'package:flutter/foundation.dart' show clampDouble;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

import '../../../core/perf/device_perf.dart';
import '../../../core/theme/app_text.dart';
import '../../worlds/world_theme.dart';

/// ثيم صفحة تفاصيل المنتج — يتبع العالم النشط.
abstract final class ProductDetailTheme {
  static const sheetRadius = AppCorners.xl;
  static const overlap = 20.0;
  static const padH = 18.0;
  static const sectionGap = 14.0;

  /// أبيض مثل خلفيات صور المنتجات — المعرض يبدو امتداداً للصورة.
  static Color galleryBg(BuildContext context) => Colors.white;

  /// مساحة المعرض المرنة في الشريط العلوي. على الأجهزة البسيطة: نفس انطواء
  /// FlexibleSpaceBar لكن تلاشي المعرض عند الانطواء بغطاء أبيض بدل Opacity
  /// (طبقة saveLayer في كل إطار من آخر مسافة الانطواء).
  static Widget flexibleSpace(BuildContext context, {required Widget background}) => DevicePerf.isLow
      ? ProductDetailVeiledSpace(veil: galleryBg(context), background: background)
      : FlexibleSpaceBar(background: background);

  static BoxDecoration sheetDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.canvas,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(sheetRadius)),
      boxShadow: [
        BoxShadow(
          color: t.ink.withValues(alpha: 0.05),
          blurRadius: 24,
          offset: const Offset(0, -6),
        ),
      ],
    );
  }

  static BoxDecoration heroCardDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      borderRadius: BorderRadius.circular(AppCorners.lg),
      border: Border.all(color: t.hairline.withValues(alpha: 0.55)),
    );
  }

  static BoxDecoration sectionDecoration(BuildContext context) => BoxDecoration(
        color: context.worldTheme.surface,
        borderRadius: BorderRadius.circular(AppCorners.lg),
        border: Border.all(color: context.worldTheme.hairline.withValues(alpha: 0.6)),
      );

  static BoxDecoration shadeSectionDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      borderRadius: BorderRadius.circular(AppCorners.lg),
      border: Border.all(color: t.accentSoft.withValues(alpha: 0.55)),
    );
  }

  static BoxDecoration chipDecoration(BuildContext context, {bool active = false}) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: active ? t.accentLight : t.canvasWarm,
      borderRadius: BorderRadius.circular(AppCorners.pill),
      border: Border.all(
        color: active ? t.accent.withValues(alpha: 0.25) : t.hairline,
      ),
    );
  }

  static BoxDecoration stockPillDecoration(Color color) => BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      );

  static BoxDecoration bottomBarDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      border: Border(top: BorderSide(color: t.hairline.withValues(alpha: 0.8))),
      boxShadow: [
        BoxShadow(
          color: t.accentDark.withValues(alpha: 0.06),
          blurRadius: 20,
          offset: const Offset(0, -4),
        ),
      ],
    );
  }

  /// عنوان قسم داخل الصفحة — من سلّم الخطوط الموحّد بلون حبر العالم.
  static TextStyle sectionTitleStyle(BuildContext context) =>
      AppText.title3.copyWith(color: context.worldTheme.ink);
}

/// يرفع ورقة الصفحة [lift] بكسل فوق المعرض (نفس أثر Transform.translate السابق)
/// لكن يقصّ [lift] من ارتفاعها في التخطيط — فالأقسام التالية (slivers مستقلة
/// كسولة) تبدأ تماماً حيث تنتهي الورقة المرسومة، بلا فراغ ولا مناطق لمس ميتة.
class ProductDetailSheetLift extends SingleChildRenderObjectWidget {
  final double lift;

  const ProductDetailSheetLift({super.key, required this.lift, required super.child});

  @override
  RenderObject createRenderObject(BuildContext context) => RenderProductDetailSheetLift(lift);

  @override
  void updateRenderObject(BuildContext context, RenderProductDetailSheetLift renderObject) {
    renderObject.lift = lift;
  }
}

class RenderProductDetailSheetLift extends RenderProxyBox {
  RenderProductDetailSheetLift(this._lift);

  double _lift;
  double get lift => _lift;
  set lift(double value) {
    if (value == _lift) return;
    _lift = value;
    markNeedsLayout();
  }

  Size _shrink(Size s) => Size(s.width, (s.height - _lift).clamp(0.0, double.infinity));

  @override
  Size computeDryLayout(BoxConstraints constraints) {
    final c = child;
    if (c == null) return constraints.smallest;
    return constraints.constrain(_shrink(c.getDryLayout(constraints)));
  }

  @override
  void performLayout() {
    final c = child;
    if (c == null) {
      size = constraints.smallest;
      return;
    }
    c.layout(constraints, parentUsesSize: true);
    size = constraints.constrain(_shrink(c.size));
  }

  @override
  double computeMinIntrinsicHeight(double width) =>
      (super.computeMinIntrinsicHeight(width) - _lift).clamp(0.0, double.infinity);

  @override
  double computeMaxIntrinsicHeight(double width) =>
      (super.computeMaxIntrinsicHeight(width) - _lift).clamp(0.0, double.infinity);

  Offset get _childOffset => Offset(0, -_lift);

  @override
  void paint(PaintingContext context, Offset offset) {
    final c = child;
    if (c != null) context.paintChild(c, offset + _childOffset);
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    final c = child;
    if (c == null) return false;
    return result.addWithPaintOffset(
      offset: _childOffset,
      position: position,
      hitTest: (result, transformed) => c.hitTest(result, position: transformed),
    );
  }

  @override
  void applyPaintTransform(RenderBox child, Matrix4 transform) {
    transform.translateByDouble(0, -_lift, 0, 1);
  }
}

/// يقصّ ما يرسمه الابن تحت حافته السفلى فقط (ظل الورقة لا يسيل على الأقسام
/// التالية بعد فصلها في slivers مستقلة)، ويترك ما فوقها وعلى جانبيها.
class ProductDetailClipBelow extends CustomClipper<Rect> {
  const ProductDetailClipBelow();

  @override
  Rect getClip(Size size) => Rect.fromLTRB(-size.width, -size.height, size.width * 2, size.height);

  @override
  bool shouldReclip(ProductDetailClipBelow oldClipper) => false;
}

/// قسم سفلي في الصفحة: يُبنى كسولاً حين يقترب من الشاشة، ثم يبقى حيّاً (لا يُعاد
/// جلبه ولا يومض هيكله عند التمرير ذهاباً وإياباً).
class ProductDetailLazySection extends StatefulWidget {
  final Widget child;

  const ProductDetailLazySection({super.key, required this.child});

  @override
  State<ProductDetailLazySection> createState() => _ProductDetailLazySectionState();
}

class _ProductDetailLazySectionState extends State<ProductDetailLazySection>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}

/// مثل `FlexibleSpaceBar(background:)` بانطواء parallax، لكن التلاشي عند الانطواء
/// غطاء بلون [veil] فوق الخلفية بدل Opacity — مطابق بصرياً ما دامت خلفية
/// الشريط نفسها بلون [veil] (أبيض المعرض).
class ProductDetailVeiledSpace extends StatelessWidget {
  final Color veil;
  final Widget background;

  const ProductDetailVeiledSpace({super.key, required this.veil, required this.background});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final settings = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
        if (settings == null) return background;
        final delta = settings.maxExtent - settings.minExtent;
        final t = delta <= 0 ? 0.0 : clampDouble(1 - (settings.currentExtent - settings.minExtent) / delta, 0, 1);
        final fadeStart = delta <= 0 ? 1.0 : math.max(0.0, 1.0 - kToolbarHeight / delta);
        final opacity = fadeStart >= 1 ? 1.0 : 1.0 - Interval(fadeStart, 1.0).transform(t);
        final height = math.max(settings.maxExtent, constraints.maxHeight);
        return ClipRect(
          child: Stack(
            children: [
              Positioned(top: -(delta / 4.0) * t, left: 0, right: 0, height: height, child: background),
              if (opacity < 1)
                Positioned.fill(
                  child: IgnorePointer(child: ColoredBox(color: veil.withValues(alpha: 1 - opacity))),
                ),
            ],
          ),
        );
      },
    );
  }
}
