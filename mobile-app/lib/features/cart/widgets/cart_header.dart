import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import 'cart_theme.dart';

/// رأس السلة: العنوان + عدد المنتجات + زر التفريغ + شارات الثقة.
/// يُستخدم أيضاً في حالة السلة الفارغة (بدون عدد ولا تفريغ).
class CartHeader extends ConsumerWidget {
  final int count;
  final double topPad;
  final VoidCallback? onClear;

  const CartHeader({super.key, required this.count, required this.topPad, this.onClear});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Container(
      width: double.infinity,
      padding: EdgeInsetsDirectional.fromSTEB(CartTheme.hPad, topPad + 12, 8, 18),
      decoration: CartTheme.headerDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.cartTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.display.copyWith(color: t.ink),
                    ),
                    if (count > 0) ...[
                      const SizedBox(height: 2),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: Text(
                          s.itemCountLabel(count),
                          key: ValueKey(count),
                          style: AppText.label.copyWith(color: t.accentDark),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (onClear != null && count > 0)
                AppIconButton(
                  icon: Icons.delete_sweep_outlined,
                  tooltip: s.clearCartTooltip,
                  color: t.inkSoft,
                  onTap: onClear,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _TrustChip(icon: Icons.verified_outlined, label: s.authentic),
                _TrustChip(icon: Icons.local_shipping_outlined, label: s.fastDelivery),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TrustChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(8, 5, 12, 5),
      decoration: BoxDecoration(
        color: t.surface.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: Border.all(color: t.accentSoft),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: t.accent),
          const SizedBox(width: 5),
          Text(label, style: AppText.micro.copyWith(color: t.accentDark)),
        ],
      ),
    );
  }
}
