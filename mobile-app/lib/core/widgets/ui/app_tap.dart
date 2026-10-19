import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// سطح قابل للضغط موحّد للبطاقات والشرائح والتبويبات المخصّصة — بدل GestureDetector عارٍ.
///
/// يعطي: دور «زر» وحالة الاختيار لقارئ الشاشة، تموّجاً، تصغيراً خفيفاً عند الضغط،
/// وتظليلاً فوق المحتوى يظهر حتى فوق الصور المعتمة (التموّج وحده يُرسم تحتها فيختفي).
/// عناصر الضغط الداخلية (قلب المفضلة مثلاً) تبقى تعمل: التظليل لا يستقبل اللمس.
class AppTap extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;

  /// حالة الاختيار لقارئ الشاشة (تبويب، شريحة، خيار اختبار). null = ليس عنصر اختيار.
  final bool? selected;

  final String? semanticsLabel;

  /// شكل التموّج والتظليل — مرّري زاوية البطاقة نفسها.
  final BorderRadius? radius;

  /// مقدار التصغير عند الضغط (1 = بلا تصغير).
  final double pressScale;

  final bool haptic;

  const AppTap({
    super.key,
    required this.child,
    this.onTap,
    this.selected,
    this.semanticsLabel,
    this.radius,
    this.pressScale = 0.97,
    this.haptic = true,
  });

  @override
  State<AppTap> createState() => _AppTapState();
}

class _AppTapState extends State<AppTap> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  void _handleTap() {
    if (widget.haptic) HapticFeedback.selectionClick();
    widget.onTap?.call();
  }

  @override
  void didUpdateWidget(covariant AppTap oldWidget) {
    super.didUpdateWidget(oldWidget);
    // تعطّل أثناء الضغط: لا يبقى مصغّراً.
    if (widget.onTap == null) _pressed = false;
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final radius = widget.radius ?? BorderRadius.zero;
    final pressed = enabled && _pressed;

    return Semantics(
      button: true,
      enabled: enabled,
      selected: widget.selected,
      label: widget.semanticsLabel,
      child: AnimatedScale(
        scale: pressed && !reduceMotion ? widget.pressScale : 1,
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: enabled ? _handleTap : null,
            onHighlightChanged: _setPressed,
            borderRadius: radius,
            // التظليل يُرسم فوق المحتوى أدناه — لا تظليل مزدوج تحته.
            highlightColor: Colors.transparent,
            child: Stack(
              fit: StackFit.passthrough,
              children: [
                widget.child,
                Positioned.fill(
                  child: IgnorePointer(
                    child: AnimatedOpacity(
                      opacity: pressed ? 1 : 0,
                      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 120),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.06),
                          borderRadius: radius,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
