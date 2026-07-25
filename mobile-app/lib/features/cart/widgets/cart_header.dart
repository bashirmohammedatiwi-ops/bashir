import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import 'cart_theme.dart';

class CartHeader extends ConsumerWidget {
  final int count;
  final int total;
  final double topPad;
  final VoidCallback onClear;

  const CartHeader({
    super.key,
    required this.count,
    required this.total,
    required this.topPad,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(CartTheme.hPad, topPad + 6, CartTheme.hPad, 20),
      decoration: CartTheme.headerDecoration(),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -30,
            left: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: CartTheme.brand.withValues(alpha: 0.1),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset(
                      'assets/images/app_icon_source.png',
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.cartTitle,
                          style: AppTypography.sectionTitle.copyWith(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: CartTheme.charcoal,
                            letterSpacing: -0.5,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          s.itemCountLabel(count),
                          style: AppTypography.caption.copyWith(
                            fontSize: 12,
                            color: CartTheme.brandDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (count > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: CartTheme.brandGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: CartTheme.brand.withValues(alpha: 0.25),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Text(
                            s.totalLabel,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            formatPrice(total),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              if (count > 0) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    _Chip(icon: Icons.verified_outlined, label: s.authentic),
                    const SizedBox(width: 8),
                    _Chip(icon: Icons.local_shipping_outlined, label: s.fastDelivery),
                    const Spacer(),
                    TextButton(
                      onPressed: onClear,
                      style: TextButton.styleFrom(
                        foregroundColor: CartTheme.brandDark,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        s.clearCart,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _Chip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: CartTheme.pillDecoration(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: CartTheme.brand),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: CartTheme.brandDark,
            ),
          ),
        ],
      ),
    );
  }
}
