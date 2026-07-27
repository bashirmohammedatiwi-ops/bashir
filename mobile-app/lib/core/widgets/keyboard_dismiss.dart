import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// يخفّي لوحة المفاتيح بسلوك أقرب للتطبيقات الاحترافية:
/// - لا يختفي عند لمس الحقل التالي (انتقال سلس بين الحقول)
/// - يختفي عند النقر خارج حقول الإدخال (وليس عند اللمس الأول)
/// - يختفي عند بدء التمرير
abstract final class KeyboardDismiss {
  static const tapSlop = 18.0;

  static void onTapOutside(BuildContext context) {
    FocusManager.instance.primaryFocus?.unfocus();
  }

  static bool hitTargetsTextInput(HitTestResult result) {
    for (final entry in result.path) {
      final target = entry.target;
      if (target is RenderEditable) return true;
      if (target is RenderSemanticsAnnotations &&
          target.properties.textField == true) {
        return true;
      }
    }
    return false;
  }

  static bool hitAt(BuildContext context, Offset position) {
    final result = HitTestResult();
    WidgetsBinding.instance.hitTestInView(
      result,
      position,
      View.of(context).viewId,
    );
    return hitTargetsTextInput(result);
  }

  static void onPointerUp(BuildContext context, Offset down, Offset up) {
    if ((up - down).distance > tapSlop) return;

    final focus = FocusManager.instance.primaryFocus;
    if (focus == null || !focus.hasFocus) return;

    // انتظر اكتمال انتقال التركيز بين الحقول قبل قرار الإخفاء.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final current = FocusManager.instance.primaryFocus;
      if (current == null || !current.hasFocus) return;
      if (hitAt(context, up)) return;
      current.unfocus();
    });
  }

  static bool onScroll(ScrollNotification notification) {
    if (notification is! ScrollUpdateNotification) return false;
    if (notification.dragDetails == null) return false;
    if (notification.metrics.axis == Axis.horizontal) return false;

    final delta = notification.dragDetails!.delta.dy.abs();
    if (delta < 2) return false;

    final focus = FocusManager.instance.primaryFocus;
    if (focus != null && focus.hasFocus) {
      focus.unfocus();
    }
    return false;
  }
}

/// يلفّ التطبيق لإخفاء لوحة المفاتيح عند النقر خارج حقول الإدخال.
class DismissKeyboard extends StatefulWidget {
  final Widget child;

  const DismissKeyboard({super.key, required this.child});

  @override
  State<DismissKeyboard> createState() => _DismissKeyboardState();
}

class _DismissKeyboardState extends State<DismissKeyboard> {
  Offset? _pointerDown;

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: KeyboardDismiss.onScroll,
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (event) => _pointerDown = event.position,
        onPointerUp: (event) {
          final down = _pointerDown;
          _pointerDown = null;
          if (down == null) return;
          KeyboardDismiss.onPointerUp(context, down, event.position);
        },
        onPointerCancel: (_) => _pointerDown = null,
        child: widget.child,
      ),
    );
  }
}
