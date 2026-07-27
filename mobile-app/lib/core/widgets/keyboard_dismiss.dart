import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// يخفّي لوحة المفاتيح عند النقر خارج حقول الإدخال.
abstract final class KeyboardDismiss {
  static void onTapOutside(BuildContext context) {
    FocusManager.instance.primaryFocus?.unfocus();
  }

  static void onPointerDown(BuildContext context, PointerDownEvent event) {
    final focus = FocusManager.instance.primaryFocus;
    if (focus == null || !focus.hasFocus) return;

    final result = HitTestResult();
    WidgetsBinding.instance.hitTestInView(
      result,
      event.position,
      View.of(context).viewId,
    );

    for (final entry in result.path) {
      if (entry.target is RenderEditable) return;
    }

    focus.unfocus();
  }

  static bool onScroll(ScrollNotification notification) {
    if (notification is! ScrollStartNotification ||
        notification.dragDetails == null) {
      return false;
    }

    final focus = FocusManager.instance.primaryFocus;
    if (focus != null && focus.hasFocus) {
      focus.unfocus();
    }
    return false;
  }
}

/// يلفّ التطبيق لإخفاء لوحة المفاتيح عند النقر في أي مكان غير حقل إدخال.
class DismissKeyboard extends StatelessWidget {
  final Widget child;

  const DismissKeyboard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: KeyboardDismiss.onScroll,
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (event) => KeyboardDismiss.onPointerDown(context, event),
        child: child,
      ),
    );
  }
}
