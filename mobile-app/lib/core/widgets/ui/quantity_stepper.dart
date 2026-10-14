import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../features/worlds/world_theme.dart';
import '../../theme/app_text.dart';

/// عدّاد كمية موحّد — أزرار بمساحة لمس 44، ويتوقف عند حد المخزون.
class QuantityStepper extends StatelessWidget {
  final int quantity;
  final ValueChanged<int> onChanged;
  final int min;
  final int? max;
  final bool compact;

  const QuantityStepper({
    super.key,
    required this.quantity,
    required this.onChanged,
    this.min = 1,
    this.max,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final canDec = quantity > min;
    final canInc = max == null || quantity < max!;
    final h = compact ? 36.0 : 44.0;

    return Container(
      height: h,
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: Border.all(color: t.accentSoft),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove_rounded,
            enabled: canDec,
            size: h,
            onTap: () => onChanged(quantity - 1),
          ),
          SizedBox(
            width: compact ? 26 : 32,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 160),
              transitionBuilder: (child, a) => FadeTransition(
                opacity: a,
                child: ScaleTransition(scale: Tween(begin: 0.7, end: 1.0).animate(a), child: child),
              ),
              child: Text(
                '$quantity',
                key: ValueKey(quantity),
                textAlign: TextAlign.center,
                style: AppText.title3.copyWith(color: t.ink, fontWeight: FontWeight.w800),
              ),
            ),
          ),
          _StepButton(
            icon: Icons.add_rounded,
            enabled: canInc,
            size: h,
            onTap: () => onChanged(quantity + 1),
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final double size;
  final VoidCallback onTap;

  const _StepButton({required this.icon, required this.enabled, required this.size, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return InkResponse(
      onTap: enabled
          ? () {
              HapticFeedback.selectionClick();
              onTap();
            }
          : null,
      radius: size / 2,
      child: SizedBox(
        width: size,
        height: size,
        child: Icon(icon, size: 19, color: enabled ? t.accentDark : t.inkMuted.withValues(alpha: 0.5)),
      ),
    );
  }
}
