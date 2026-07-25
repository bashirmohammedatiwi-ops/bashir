import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../data/models/cart_item.dart';
import '../cart_provider.dart';
import 'cart_theme.dart';

class CartItemCard extends ConsumerWidget {
  final CartItem item;

  const CartItemCard({super.key, required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(cartProvider.notifier);

    return Dismissible(
      key: Key(item.key),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        margin: const EdgeInsets.only(bottom: 2),
        padding: const EdgeInsets.only(left: 28),
        decoration: BoxDecoration(
          color: AppColors.sale,
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.delete_outline_rounded, color: Colors.white, size: 26),
            SizedBox(height: 4),
            Text('حذف', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
          ],
        ),
      ),
      onDismissed: (_) {
        HapticFeedback.mediumImpact();
        notifier.remove(item.key);
        AppSnackbar.show(context, 'حُذف «${item.name}»');
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/product/${item.productId}'),
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
          child: Ink(
            decoration: CartTheme.cardDecoration(),
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(CartTheme.radiusMd),
                  child: ColoredBox(
                    color: AppColors.scaffold,
                    child: SizedBox(
                      width: CartTheme.imageSize,
                      height: CartTheme.imageSize,
                      child: item.imageUrl.isNotEmpty
                          ? ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain)
                          : Center(
                              child: Text(
                                item.name.isNotEmpty ? item.name.characters.first : '?',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          height: 1.35,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (item.shadeName != null) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.scaffold,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            item.shadeName!,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Text(
                            formatPrice(item.price),
                            style: AppTypography.price.copyWith(fontSize: 14),
                          ),
                          if (item.quantity > 1) ...[
                            const SizedBox(width: 6),
                            Text(
                              '× ${item.quantity}',
                              style: AppTypography.caption.copyWith(fontSize: 12),
                            ),
                          ],
                          const Spacer(),
                          Text(
                            formatPrice(item.lineTotal),
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _QtyStepper(
                        quantity: item.quantity,
                        onDecrement: () {
                          HapticFeedback.selectionClick();
                          notifier.decrement(item.key);
                        },
                        onIncrement: () {
                          HapticFeedback.selectionClick();
                          final ok = notifier.increment(item.key);
                          if (!ok && context.mounted) {
                            AppSnackbar.show(context, 'وصلتِ للحد الأقصى المتاح');
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QtyStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _QtyStepper({
    required this.quantity,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepBtn(icon: Icons.remove_rounded, onTap: onDecrement),
          ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 36),
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 14,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          _StepBtn(icon: Icons.add_rounded, onTap: onIncrement),
        ],
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _StepBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 18, color: AppColors.textPrimary),
        ),
      ),
    );
  }
}
