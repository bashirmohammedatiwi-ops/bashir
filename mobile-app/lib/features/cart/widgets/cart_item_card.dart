import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/cart_item.dart';
import '../../worlds/world_theme.dart';
import '../cart_provider.dart';
import '../cart_strings.dart';
import 'cart_theme.dart';

/// يحذف عنصراً من السلة مع إشعار "تراجع" يعيده لمكانه.
void removeCartItemWithUndo(BuildContext context, WidgetRef ref, CartItem item) {
  final s = ref.read(stringsProvider);
  final lang = ref.read(languageCodeProvider);
  final notifier = ref.read(cartProvider.notifier);
  final index = ref.read(cartProvider).items.indexWhere((e) => e.key == item.key);
  HapticFeedback.mediumImpact();
  notifier.remove(item.key);
  AppSnackbar.action(
    context,
    message: s.itemRemoved(item.localizedName(lang)),
    actionLabel: s.undo,
    onAction: () {
      HapticFeedback.selectionClick();
      notifier.restore(item, index: index < 0 ? null : index);
    },
  );
}

class CartItemCard extends ConsumerWidget {
  final CartItem item;

  const CartItemCard({super.key, required this.item});

  void _openProduct(BuildContext context) {
    HapticFeedback.selectionClick();
    context.push('/product/${item.routeId}');
  }

  void _onQuantity(BuildContext context, WidgetRef ref, int next) {
    final notifier = ref.read(cartProvider.notifier);
    if (next <= 0) {
      removeCartItemWithUndo(context, ref, item);
      return;
    }
    if (next > item.quantity) {
      final ok = notifier.increment(item.key);
      if (!ok && context.mounted) AppSnackbar.show(context, ref.read(stringsProvider).maxQtyReached);
    } else if (next < item.quantity) {
      notifier.decrement(item.key);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final t = context.worldTheme;
    final displayName = item.localizedName(lang);
    final imageSize = Responsive.cartItemImageSize(context);
    final lowStock = item.stock > 0 && item.stock <= 5;

    return Dismissible(
      key: ValueKey('cart-${item.key}'),
      direction: DismissDirection.endToStart,
      dismissThresholds: const {DismissDirection.endToStart: 0.35},
      background: Container(
        alignment: AlignmentDirectional.centerEnd,
        padding: const EdgeInsetsDirectional.only(end: 24),
        decoration: BoxDecoration(color: AppColors.sale, borderRadius: BorderRadius.circular(CartTheme.radiusLg)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
            const SizedBox(height: 4),
            Text(s.removeItem, style: AppText.micro.copyWith(color: Colors.white)),
          ],
        ),
      ),
      onDismissed: (_) => removeCartItemWithUndo(context, ref, item),
      // الظل على حاوية خارجية: طبقة التموّج في Material تقصّ ما يخرج عن حدودها.
      child: DecoratedBox(
        decoration: CartTheme.cardDecoration(context),
        child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CartTheme.radiusLg),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _openProduct(context),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 4, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Thumb(item: item, name: displayName, size: imageSize),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                displayName,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.bodySmall.copyWith(
                                  color: t.ink,
                                  fontWeight: FontWeight.w700,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ),
                          Transform.translate(
                            offset: const Offset(0, -6),
                            child: AppIconButton(
                              icon: Icons.close_rounded,
                              size: 30,
                              iconSize: 17,
                              outlined: false,
                              background: Colors.transparent,
                              color: t.inkMuted,
                              tooltip: s.removeItem,
                              onTap: () => removeCartItemWithUndo(context, ref, item),
                            ),
                          ),
                        ],
                      ),
                      if (item.shadeName != null || lowStock) ...[
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            if (item.shadeName != null) _ShadeChip(label: item.shadeName!),
                            if (lowStock)
                              _MetaChip(
                                icon: Icons.bolt_rounded,
                                label: s.onlyLeftInStock(item.stock),
                                color: AppColors.warning,
                              ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 10),
                      Padding(
                        padding: const EdgeInsetsDirectional.only(end: 8),
                        child: LayoutBuilder(
                          builder: (context, c) {
                            final price = _PriceBlock(item: item);
                            final stepper = QuantityStepper(
                              quantity: item.quantity,
                              min: 0,
                              max: item.stock > 0 ? item.stock : null,
                              onChanged: (q) => _onQuantity(context, ref, q),
                            );
                            if (c.maxWidth < 220) {
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [price, const SizedBox(height: 8), stepper],
                              );
                            }
                            return Row(
                              children: [
                                Expanded(child: price),
                                const SizedBox(width: 8),
                                stepper,
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final CartItem item;
  final String name;
  final double size;

  const _Thumb({required this.item, required this.name, required this.size});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(color: t.accentSoft),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppCorners.md - 1),
        child: item.imageUrl.isNotEmpty
            ? Padding(
                padding: const EdgeInsets.all(4),
                child: ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain),
              )
            : Center(
                child: Text(
                  name.isNotEmpty ? name.characters.first : '?',
                  style: AppText.display.copyWith(color: t.accent),
                ),
              ),
      ),
    );
  }
}

class _PriceBlock extends ConsumerWidget {
  final CartItem item;
  const _PriceBlock({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: AlignmentDirectional.centerStart,
          child: PriceView(price: item.lineTotal),
        ),
        if (item.quantity > 1)
          Text(
            ref.s.pricePerPiece(formatPrice(item.price)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.caption.copyWith(color: t.inkMuted),
          ),
      ],
    );
  }
}

class _ShadeChip extends StatelessWidget {
  final String label;
  const _ShadeChip({required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return _MetaChip(icon: Icons.palette_outlined, label: label, color: t.accentDark);
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MetaChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 180),
      padding: const EdgeInsetsDirectional.fromSTEB(6, 3, 9, 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.micro.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}
