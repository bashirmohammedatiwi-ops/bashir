import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/coupon.dart';
import 'cart_theme.dart';

class CartCouponSection extends ConsumerStatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String? error;
  final bool loading;
  final Coupon? applied;
  final int discount;
  final VoidCallback onApply;
  final VoidCallback onRemove;

  const CartCouponSection({
    super.key,
    required this.controller,
    required this.focusNode,
    this.error,
    required this.loading,
    this.applied,
    required this.discount,
    required this.onApply,
    required this.onRemove,
  });

  @override
  ConsumerState<CartCouponSection> createState() => _CartCouponSectionState();
}

class _CartCouponSectionState extends ConsumerState<CartCouponSection> {
  bool _open = false;

  @override
  void initState() {
    super.initState();
    _open = widget.applied != null;
  }

  @override
  void didUpdateWidget(CartCouponSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.applied != null) _open = true;
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    if (widget.applied != null) {
      return _AppliedCoupon(coupon: widget.applied!, onRemove: widget.onRemove);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _open = !_open),
            borderRadius: BorderRadius.circular(CartTheme.radiusSm),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: CartTheme.brandSoft,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.local_offer_outlined, color: CartTheme.brand, size: 17),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      s.haveCouponCode,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: CartTheme.charcoal),
                    ),
                  ),
                  Icon(
                    _open ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                    color: CartTheme.brandDark.withValues(alpha: 0.6),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (_open) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  focusNode: widget.focusNode,
                  textCapitalization: TextCapitalization.characters,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => widget.onApply(),
                  style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8),
                  decoration: InputDecoration(
                    hintText: s.enterCode,
                    hintStyle: AppTypography.caption,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                      borderSide: const BorderSide(color: CartTheme.brandSoft),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                      borderSide: const BorderSide(color: CartTheme.brand, width: 1.5),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 46,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: CartTheme.brandGradient,
                    borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                  ),
                  child: FilledButton(
                    onPressed: widget.loading ? null : widget.onApply,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                      ),
                    ),
                    child: widget.loading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(s.applyBtn, style: const TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ),
            ],
          ),
          if (widget.error != null) ...[
            const SizedBox(height: 6),
            Text(
              widget.error!,
              style: const TextStyle(color: AppColors.sale, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ],
        ],
      ],
    );
  }
}

class _AppliedCoupon extends StatelessWidget {
  final Coupon coupon;
  final VoidCallback onRemove;

  const _AppliedCoupon({required this.coupon, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF9F4),
        borderRadius: BorderRadius.circular(CartTheme.radiusSm),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(coupon.code, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                Text(
                  coupon.benefitLabel(formatPrice: formatPrice),
                  style: const TextStyle(
                    color: AppColors.success,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            visualDensity: VisualDensity.compact,
            icon: const Icon(Icons.close_rounded, size: 18),
            color: CartTheme.brandDark,
          ),
        ],
      ),
    );
  }
}
