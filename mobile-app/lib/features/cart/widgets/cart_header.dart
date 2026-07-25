import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import 'cart_theme.dart';

class CartHeader extends ConsumerWidget {
  final int count;
  final double topPad;
  final VoidCallback onClear;

  const CartHeader({
    super.key,
    required this.count,
    required this.topPad,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(CartTheme.hPad, topPad + 8, CartTheme.hPad, 20),
      decoration: CartTheme.heroDecoration(),
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
                      style: AppTypography.sectionTitle.copyWith(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      s.itemCountLabel(count),
                      style: AppTypography.caption.copyWith(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton.filledTonal(
                onPressed: () => context.push('/wishlist'),
                icon: const Icon(Icons.favorite_border_rounded, size: 22),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.surface.withValues(alpha: 0.9),
                  foregroundColor: AppColors.primary,
                ),
              ),
            ],
          ),
          if (count > 0) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                _TrustChip(icon: Icons.verified_user_outlined, label: 'دفع آمن'),
                const SizedBox(width: 8),
                _TrustChip(icon: Icons.local_shipping_outlined, label: 'توصيل سريع'),
                const Spacer(),
                TextButton.icon(
                  onPressed: onClear,
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  label: Text(s.clearCart),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                ),
              ],
            ),
          ],
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.accent),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
