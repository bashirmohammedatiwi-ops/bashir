import 'package:flutter/material.dart';

/// يمرّر الشاشة إلى أول عنصر مرتبط بـ [key] داخل ScrollView.
Future<void> scrollToFormField(GlobalKey key, {double alignment = 0.1}) async {
  for (var attempt = 0; attempt < 4; attempt++) {
    await WidgetsBinding.instance.endOfFrame;
    final ctx = key.currentContext;
    if (ctx == null) continue;

    await Scrollable.ensureVisible(
      ctx,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
      alignment: alignment,
      alignmentPolicy: ScrollPositionAlignmentPolicy.explicit,
    );
    return;
  }
}

/// يمرّر إلى أول قسم في [sectionKeys] يحتوي حقل [FormField] غير صالح.
Future<void> scrollToFirstInvalidFormSection(List<GlobalKey> sectionKeys) async {
  await WidgetsBinding.instance.endOfFrame;

  for (final key in sectionKeys) {
    if (!_sectionHasInvalidField(key)) continue;
    await scrollToFormField(key);
    return;
  }
}

bool _sectionHasInvalidField(GlobalKey key) {
  final ctx = key.currentContext;
  if (ctx == null) return false;

  var hasError = false;
  void visit(Element element) {
    if (hasError) return;
    if (element is StatefulElement && element.state is FormFieldState) {
      final state = element.state as FormFieldState<dynamic>;
      if (!state.isValid) {
        hasError = true;
        return;
      }
    }
    element.visitChildren(visit);
  }

  visit(ctx as Element);
  return hasError;
}
