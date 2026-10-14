import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import 'checkout_theme.dart';

/// رأس إتمام الطلب: رجوع + عنوان + عدد المنتجات + مؤشّر الخطوات
/// (التوصيل ← الدفع ← التأكيد). الضغط على خطوة يمرّر إلى قسمها.
class CheckoutHeader extends StatelessWidget {
  final AppStrings s;
  final int itemCount;
  final VoidCallback onBack;
  final int activeStep;
  final ValueChanged<int>? onStepTap;

  const CheckoutHeader({
    super.key,
    required this.s,
    required this.itemCount,
    required this.onBack,
    this.activeStep = 0,
    this.onStepTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final steps = [s.deliveryStep, s.paymentStep, s.confirmStep];
    return Container(
      decoration: CheckoutTheme.headerDecoration(context),
      padding: EdgeInsetsDirectional.fromSTEB(8, MediaQuery.paddingOf(context).top + 6, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              AppBackButton(onTap: onBack),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  s.checkout,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title1.copyWith(color: t.ink),
                ),
              ),
              if (itemCount > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: t.surface.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(AppCorners.pill),
                    border: Border.all(color: t.accentSoft),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shopping_bag_outlined, size: 14, color: t.accent),
                      const SizedBox(width: 5),
                      Text(s.itemCountLabel(itemCount), style: AppText.micro.copyWith(color: t.accentDark)),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsetsDirectional.only(start: 8),
            child: Row(
              children: [
                for (var i = 0; i < steps.length; i++) ...[
                  Flexible(
                    flex: 3,
                    child: _StepPill(
                      index: i,
                      label: steps[i],
                      state: i < activeStep
                          ? _StepState.done
                          : i == activeStep
                          ? _StepState.active
                          : _StepState.upcoming,
                      onTap: onStepTap == null
                          ? null
                          : () {
                              HapticFeedback.selectionClick();
                              onStepTap!(i);
                            },
                    ),
                  ),
                  if (i < steps.length - 1)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 260),
                        height: 2,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: i < activeStep ? t.accent : t.accentSoft,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum _StepState { done, active, upcoming }

class _StepPill extends StatelessWidget {
  final int index;
  final String label;
  final _StepState state;
  final VoidCallback? onTap;

  const _StepPill({required this.index, required this.label, required this.state, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final on = state != _StepState.upcoming;
    return Semantics(
      button: onTap != null,
      selected: state == _StepState.active,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 36),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                width: 24,
                height: 24,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: on ? t.primaryGradient : null,
                  color: on ? null : t.surface,
                  shape: BoxShape.circle,
                  border: on ? null : Border.all(color: t.hairline),
                ),
                child: state == _StepState.done
                    ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                    : Text(
                        '${index + 1}',
                        style: AppText.micro.copyWith(color: on ? Colors.white : t.inkMuted, height: 1),
                      ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(
                    color: on ? t.ink : t.inkMuted,
                    fontWeight: state == _StepState.active ? FontWeight.w800 : FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
