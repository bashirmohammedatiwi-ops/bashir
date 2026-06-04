import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

/// خلفية ترحيبية ناعمة — تدرج + دوائر متحركة ببطء.
class WelcomeAmbientBackground extends StatefulWidget {
  const WelcomeAmbientBackground({
    super.key,
    this.accent = AppColors.primary,
    this.pageProgress = 0,
  });

  final Color accent;
  /// 0 → 1 → 2 بين شرائح الترحيب.
  final double pageProgress;

  @override
  State<WelcomeAmbientBackground> createState() =>
      _WelcomeAmbientBackgroundState();
}

class _WelcomeAmbientBackgroundState extends State<WelcomeAmbientBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _drift;

  @override
  void initState() {
    super.initState();
    _drift = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _drift.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _drift,
      builder: (context, _) {
        final t = _drift.value;
        final accent = Color.lerp(
          AppColors.primarySoft,
          widget.accent.withValues(alpha: 0.35),
          (widget.pageProgress / 2).clamp(0, 1),
        )!;

        return Stack(
          fit: StackFit.expand,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.background,
                    Color.lerp(AppColors.background, AppColors.primaryMist, 0.35)!,
                  ],
                ),
              ),
            ),
            Positioned(
              top: -80 + t * 24,
              right: -60 + math.sin(t * math.pi) * 16,
              child: _Orb(size: 220, color: accent.withValues(alpha: 0.55)),
            ),
            Positioned(
              bottom: 120 - t * 20,
              left: -70 + math.cos(t * math.pi) * 12,
              child: _Orb(
                size: 180,
                color: AppColors.roseSoft.withValues(alpha: 0.45),
              ),
            ),
            Positioned(
              top: 180 + t * 18,
              left: 40,
              child: _Orb(
                size: 90,
                color: AppColors.goldSoft.withValues(alpha: 0.35),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({required this.size, required this.color});
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}
