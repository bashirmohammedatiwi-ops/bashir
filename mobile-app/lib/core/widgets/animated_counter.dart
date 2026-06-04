import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../utils/currency_formatter.dart';

class AnimatedCounter extends StatelessWidget {
  const AnimatedCounter({
    super.key,
    required this.value,
    this.style,
    this.formatCurrency = true,
    this.duration = const Duration(milliseconds: 600),
  });

  final int value;
  final TextStyle? style;
  final bool formatCurrency;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: 0, end: value),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, val, _) {
        final text =
            formatCurrency ? CurrencyFormatter.format(val) : '$val';
        return Text(text, style: style)
            .animate(key: ValueKey(value))
            .fadeIn(duration: 200.ms);
      },
    );
  }
}

class AnimatedCounterSmall extends StatelessWidget {
  const AnimatedCounterSmall({super.key, required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
      child: Text(
        CurrencyFormatter.toArabicDigits('$value'),
        key: ValueKey(value),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
