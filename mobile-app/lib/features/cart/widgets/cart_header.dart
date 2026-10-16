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
      padding: EdgeInsetsDirectional.fromSTEB(CartTheme.hPad, topPad + 10, 10, 16),
      decoration: CartTheme.headerDecoration(context),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Flexible(
            child: Text(
              s.cartTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.title1.copyWith(color: t.ink, fontSize: 24, height: 1.2),
            ),
          ),
          if (count > 0) ...[
            const SizedBox(width: 10),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: Container(
                key: ValueKey(count),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  gradient: t.signatureGradient,
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                ),
                child: Text(
                  s.itemCountLabel(count),
                  style: AppText.micro.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ],
          const Spacer(),
          if (onClear != null && count > 0)
            _ClearButton(label: s.clearCart, tooltip: s.clearCartTooltip, onTap: onClear!),
        ],
      ),
    );
  }
}

/// زر تفريغ هادئ — نص وأيقونة بدل دائرة ثقيلة.
class _ClearButton extends StatelessWidget {
  final String label;
  final String tooltip;
  final VoidCallback onTap;
  const _ClearButton({required this.label, required this.tooltip, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        child: Container(
          height: 36,
          padding: const EdgeInsetsDirectional.fromSTEB(10, 0, 12, 0),
          decoration: BoxDecoration(
            color: t.surface.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(AppCorners.pill),
            border: Border.all(color: t.hairline),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.delete_outline_rounded, size: 17, color: t.inkSoft),
              const SizedBox(width: 4),
              Text(label, style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
