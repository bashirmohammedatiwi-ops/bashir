import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/coupon.dart';
import 'cart_theme.dart';

class CartCouponSection extends StatefulWidget {
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
  State<CartCouponSection> createState() => _CartCouponSectionState();
}

class _CartCouponSectionState extends State<CartCouponSection> {
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    _expanded = widget.applied != null;
  }

  @override
  void didUpdateWidget(CartCouponSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.applied != null) _expanded = true;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 16, CartTheme.hPad, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.applied != null)
            _AppliedCoupon(coupon: widget.applied!, discount: widget.discount, onRemove: widget.onRemove)
          else ...[
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => setState(() => _expanded = !_expanded),
                borderRadius: BorderRadius.circular(CartTheme.radiusLg),
                child: Ink(
                  decoration: CartTheme.cardDecoration(),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.local_offer_outlined, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _expanded ? 'كود الخصم' : 'لديك كود خصم؟',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                      ),
                      Icon(
                        _expanded ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_expanded) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: CartTheme.cardDecoration(
                  borderColor: widget.error != null
                      ? AppColors.sale.withValues(alpha: 0.4)
                      : AppColors.hairline,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: widget.controller,
                      focusNode: widget.focusNode,
                      textCapitalization: TextCapitalization.characters,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => widget.onApply(),
                      style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 1.1),
                      decoration: InputDecoration(
                        hintText: 'أدخل الكود',
                        hintStyle: AppTypography.caption,
                        filled: true,
                        fillColor: AppColors.scaffold,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    if (widget.error != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        widget.error!,
                        style: const TextStyle(
                          color: AppColors.sale,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 46,
                      child: FilledButton(
                        onPressed: widget.loading ? null : widget.onApply,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.ink,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(CartTheme.radiusSm),
                          ),
                        ),
                        child: widget.loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('تطبيق', style: TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _AppliedCoupon extends StatelessWidget {
  final Coupon coupon;
  final int discount;
  final VoidCallback onRemove;

  const _AppliedCoupon({
    required this.coupon,
    required this.discount,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF9F2),
        borderRadius: BorderRadius.circular(CartTheme.radiusLg),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 24),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(coupon.code, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                Text(
                  coupon.benefitLabel(formatPrice: formatPrice),
                  style: const TextStyle(
                    color: AppColors.success,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (discount > 0)
                  Text(
                    'وفّرت ${formatPrice(discount)}',
                    style: AppTypography.caption.copyWith(fontSize: 11),
                  ),
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(Icons.close_rounded, size: 20),
            color: AppColors.textMuted,
          ),
        ],
      ),
    );
  }
}
