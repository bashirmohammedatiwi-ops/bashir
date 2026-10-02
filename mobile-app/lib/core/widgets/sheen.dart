import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_motion.dart';

/// لمعان فاخر — شريط ضوء قطري يمرّ فوق زر متدرج دورياً (كل ~3.6 ث).
/// طبقة غير تفاعلية فوق المحتوى، معزولة بـ RepaintBoundary، وتتوقف مع TickerMode.
class Sheen extends StatefulWidget {
  final Widget child;
  final Color color;

  const Sheen({super.key, required this.child, this.color = Colors.white});

  @override
  State<Sheen> createState() => _SheenState();
}

class _SheenState extends State<Sheen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Timer? _idleTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.slow);
    _scheduleSweep();
  }

  void _scheduleSweep() {
    _idleTimer = Timer(const Duration(milliseconds: 3600), () {
      if (mounted) {
        _controller.forward(from: 0).then((_) => _scheduleSweep());
      }
    });
  }

  @override
  void dispose() {
    _idleTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Stack(
        children: [
          widget.child,
          Positioned.fill(
            child: IgnorePointer(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: AnimatedBuilder(
                  animation: _controller,
                  builder: (context, _) {
                    if (_controller.value == 0 || _controller.value == 1) {
                      return const SizedBox.shrink();
                    }
                    final t = Curves.easeOutCubic.transform(_controller.value);
                    return FractionalTranslation(
                      translation: Offset(-1.4 + 2.8 * t, 0),
                      child: Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: FractionallySizedBox(
                          widthFactor: 0.28,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: AlignmentDirectional.centerStart,
                                end: AlignmentDirectional.centerEnd,
                                colors: [
                                  widget.color.withValues(alpha: 0),
                                  widget.color.withValues(alpha: 0.28 * (1 - (2 * t - 1).abs())),
                                  widget.color.withValues(alpha: 0),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
