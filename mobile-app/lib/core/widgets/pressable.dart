import 'package:flutter/material.dart';

import '../theme/app_motion.dart';

/// بطاقة قابلة للنقر بإحساس موحد: تقلص خفيف + رفع الظل عند الضغط.
/// بديل HomeTapScale العام لكل البطاقات القابلة للنقر في التطبيق.
class Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final void Function(LongPressStartDetails)? onLongPressStart;
  final BorderRadius? borderRadius;
  final bool enabled;

  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPressStart,
    this.borderRadius,
    this.enabled = true,
  });

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _pressed = false;

  set pressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.enabled && widget.onTap != null;
    return GestureDetector(
      onTapDown: active ? (_) => pressed = true : null,
      onTapUp: active ? (_) => pressed = false : null,
      onTapCancel: active ? () => pressed = false : null,
      onTap: active ? widget.onTap : null,
      onLongPressStart: widget.onLongPressStart,
      behavior: HitTestBehavior.opaque,
      child: AnimatedScale(
        scale: _pressed ? 0.975 : 1,
        duration: AppMotion.instant,
        curve: AppMotion.ease,
        child: AnimatedOpacity(
          duration: AppMotion.instant,
          opacity: _pressed ? 0.92 : 1,
          child: widget.child,
        ),
      ),
    );
  }
}
