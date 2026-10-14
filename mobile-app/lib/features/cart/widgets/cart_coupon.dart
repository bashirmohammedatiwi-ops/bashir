import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/coupon.dart';
import '../../worlds/world_theme.dart';
import '../cart_strings.dart';
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
    _open = widget.applied != null || widget.error != null;
  }

  @override
  void didUpdateWidget(CartCouponSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.applied != null || widget.error != null) _open = true;
  }

  void _toggle() {
    HapticFeedback.selectionClick();
    setState(() => _open = !_open);
    if (_open) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) widget.focusNode.requestFocus();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;

    return AnimatedSize(
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
      alignment: AlignmentDirectional.topCenter,
      child: widget.applied != null
          ? _AppliedCoupon(coupon: widget.applied!, discount: widget.discount, onRemove: widget.onRemove)
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  button: true,
                  expanded: _open,
                  child: InkWell(
                    onTap: _toggle,
                    borderRadius: BorderRadius.circular(AppCorners.sm),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: kMinTapTarget),
                      child: Row(
                        children: [
                          CartTheme.iconBadge(context, Icons.local_offer_outlined, size: 36),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              s.haveCouponCode,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.label.copyWith(color: t.ink),
                            ),
                          ),
                          AnimatedRotation(
                            turns: _open ? 0.5 : 0,
                            duration: const Duration(milliseconds: 220),
                            child: Icon(Icons.expand_more_rounded, color: t.inkMuted),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_open) ...[
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: widget.controller,
                          focusNode: widget.focusNode,
                          textCapitalization: TextCapitalization.characters,
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => widget.onApply(),
                          style: AppText.title3.copyWith(color: t.ink, letterSpacing: 1),
                          decoration: InputDecoration(
                            hintText: s.couponPlaceholder,
                            hintStyle: AppText.bodySmall.copyWith(color: t.inkMuted, letterSpacing: 0),
                            isDense: true,
                            filled: true,
                            fillColor: t.surface,
                            prefixIcon: Icon(Icons.confirmation_number_outlined, color: t.accent, size: 20),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppCorners.sm),
                              borderSide: BorderSide(
                                color: widget.error != null ? AppColors.sale.withValues(alpha: 0.6) : t.accentSoft,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppCorners.sm),
                              borderSide: BorderSide(color: t.accent, width: 1.5),
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppCorners.sm),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 50,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: t.primaryGradient,
                            borderRadius: BorderRadius.circular(AppCorners.sm),
                          ),
                          child: FilledButton(
                            onPressed: widget.loading ? null : widget.onApply,
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              disabledBackgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(horizontal: 18),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppCorners.sm)),
                            ),
                            child: widget.loading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : Text(s.applyBtn, style: AppText.label.copyWith(color: Colors.white)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: widget.error == null
                        ? const SizedBox(width: double.infinity)
                        : Padding(
                            key: ValueKey(widget.error),
                            padding: const EdgeInsetsDirectional.only(top: 8, start: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.error_outline_rounded, color: AppColors.sale, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    widget.error!,
                                    style: AppText.caption.copyWith(color: AppColors.sale, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),
                ],
              ],
            ),
    );
  }
}

class _AppliedCoupon extends ConsumerWidget {
  final Coupon coupon;
  final int discount;
  final VoidCallback onRemove;

  const _AppliedCoupon({required this.coupon, required this.discount, required this.onRemove});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Row(
      children: [
        CartTheme.iconBadge(context, Icons.verified_rounded, color: AppColors.success, size: 36),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                coupon.code,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.title3.copyWith(color: t.ink, letterSpacing: 0.8),
              ),
              Text(
                discount > 0 ? s.youSaved(formatPrice(discount)) : coupon.benefitLabel(formatPrice: formatPrice),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppText.caption.copyWith(color: AppColors.success, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
        AppIconButton(
          icon: Icons.close_rounded,
          size: 34,
          iconSize: 17,
          tooltip: s.removeCoupon,
          color: t.inkSoft,
          onTap: onRemove,
        ),
      ],
    );
  }
}
