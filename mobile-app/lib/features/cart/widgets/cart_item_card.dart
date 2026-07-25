import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/responsive.dart';
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

  void _openProduct(BuildContext context) {
    context.push('/product/${item.routeId}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final displayName = item.localizedName(lang);
    final imageSize = Responsive.cartItemImageSize(context);
    final notifier = ref.read(cartProvider.notifier);

    return Dismissible(
      key: Key(item.key),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: AlignmentDirectional.centerStart,
        padding: const EdgeInsetsDirectional.only(start: 22),
        decoration: BoxDecoration(
          color: AppColors.sale,
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 22),
      ),
      onDismissed: (_) {
        HapticFeedback.mediumImpact();
        notifier.remove(item.key);
        AppSnackbar.show(context, s.itemRemoved(displayName));
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _openProduct(context),
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
          child: Ink(
            decoration: CartTheme.cardDecoration(),
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: imageSize,
                  height: imageSize,
                  decoration: BoxDecoration(
                    color: CartTheme.brandWash,
                    borderRadius: BorderRadius.circular(CartTheme.radiusMd),
                    border: Border.all(color: CartTheme.brandSoft),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(CartTheme.radiusMd - 1),
                    child: item.imageUrl.isNotEmpty
                        ? ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain)
                        : Center(
                            child: Text(
                              item.name.isNotEmpty ? displayName.characters.first : '?',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: CartTheme.brand,
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
                        displayName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          height: 1.35,
                          color: CartTheme.charcoal,
                        ),
                      ),
                      if (item.shadeName != null) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: CartTheme.pillDecoration(),
                          child: Text(
                            item.shadeName!,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: CartTheme.brandDark,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            formatPrice(item.lineTotal),
                            style: AppTypography.price.copyWith(
                              fontSize: 15,
                              color: CartTheme.brandDark,
                            ),
                          ),
                          if (item.quantity > 1) ...[
                            const SizedBox(width: 6),
                            Text(
                              '× ${item.quantity}',
                              style: AppTypography.caption.copyWith(fontSize: 11),
                            ),
                          ],
                          const Spacer(),
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
                                AppSnackbar.show(context, s.maxQtyReached);
                              }
                            },
                          ),
                        ],
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
      height: 34,
      decoration: BoxDecoration(
        color: CartTheme.brandWash,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: CartTheme.brandSoft),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepBtn(icon: Icons.remove_rounded, onTap: onDecrement),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              '$quantity',
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 13,
                color: CartTheme.charcoal,
              ),
            ),
          ),
          _StepBtn(icon: Icons.add_rounded, onTap: onIncrement, filled: true),
        ],
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  const _StepBtn({required this.icon, required this.onTap, this.filled = false});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? CartTheme.brand : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: SizedBox(
          width: 34,
          height: 34,
          child: Icon(icon, size: 16, color: filled ? Colors.white : CartTheme.brandDark),
        ),
      ),
    );
  }
}
