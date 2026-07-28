import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// إخفاء لوحة المفاتيح بسلوك احترافي في كل التطبيق:
/// - **نقر** على أي مكان خارج حقل الإدخال → يختفي فوراً
/// - **انتقال** من حقل إلى حقل → يبقى مفتوحاً بدون وميض
/// - **تمرير** عمودي → يختفي كمساعد إضافي
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

      final typeName = target.runtimeType.toString();
      if (typeName.contains('InputDecorator') ||
          typeName.contains('Editable')) {
        return true;
      }
    }
    return false;
  }

  static bool hitAtView(int viewId, Offset position) {
    final result = HitTestResult();
    WidgetsBinding.instance.hitTestInView(result, position, viewId);
    return hitTargetsTextInput(result);
  }

  static bool hitAt(BuildContext context, Offset position) {
    return hitAtView(View.of(context).viewId, position);
  }

  static void onPointerUp(BuildContext context, Offset down, Offset up) {
    if ((up - down).distance > tapSlop) return;

    final focusBefore = FocusManager.instance.primaryFocus;
    if (focusBefore == null || !focusBefore.hasFocus) return;

    final viewId = View.of(context).viewId;
    final onTextInput = hitAtView(viewId, up);

    // نقر واضح خارج أي حقل — إخفاء فوري (مثل تطبيقات iOS الاحترافية).
    if (!onTextInput) {
      focusBefore.unfocus();
      return;
    }

    // نقر على حقل آخر — انتظر اكتمال نقل التركيز ثم قرّر.
    Future.microtask(() {
      final focusAfter = FocusManager.instance.primaryFocus;
      if (focusAfter == null || !focusAfter.hasFocus) return;
      if (hitAtView(viewId, up)) return;
      focusAfter.unfocus();
    });
  }

  static bool onScroll(ScrollNotification notification) {
    if (notification is! ScrollStartNotification) return false;
    if (notification.dragDetails == null) return false;
    if (notification.metrics.axis == Axis.horizontal) return false;

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
  int? _activePointer;

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: KeyboardDismiss.onScroll,
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (event) {
          _activePointer = event.pointer;
          _pointerDown = event.position;
        },
        onPointerUp: (event) {
          if (_activePointer != event.pointer) return;
          final down = _pointerDown;
          _pointerDown = null;
          _activePointer = null;
          if (down == null) return;
          KeyboardDismiss.onPointerUp(context, down, event.position);
        },
        onPointerCancel: (event) {
          if (_activePointer == event.pointer) {
            _pointerDown = null;
            _activePointer = null;
          }
        },
        child: widget.child,
      ),
    );
  }
}
