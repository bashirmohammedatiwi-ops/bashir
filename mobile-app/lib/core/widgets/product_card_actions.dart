import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/auth/auth_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../theme/app_colors.dart';
import 'app_snackbar.dart';

/// زر المفضلة على بطاقة المنتج.
class ProductCardWishButton extends ConsumerWidget {
  final Product product;
  final double size;

  const ProductCardWishButton({
    super.key,
    required this.product,
    this.size = 34,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wished = ref.watch(wishlistProvider.select((s) => s.ids.contains(product.id)));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () async {
          HapticFeedback.selectionClick();
          if (!ref.read(authProvider).isAuthenticated) {
            context.push('/login');
            return;
          }
          await ref.read(wishlistProvider.notifier).toggle(product);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: wished ? AppColors.primaryLight : Colors.white.withValues(alpha: 0.94),
            border: Border.all(
              color: wished ? AppColors.primarySoft : AppColors.hairline.withValues(alpha: 0.9),
              width: wished ? 1.2 : 0.8,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink.withValues(alpha: wished ? 0.08 : 0.06),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Icon(
            wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: size * 0.47,
            color: wished ? AppColors.primary : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}

/// زر إضافة أو عدّاد كمية على بطاقة المنتج.
class ProductCardCartControl extends ConsumerWidget {
  final Product product;
  final bool compact;

  const ProductCardCartControl({
    super.key,
    required this.product,
    this.compact = false,
  });

  int _qty(CartState cart) {
    return cart.items
        .where((e) => e.productId == product.id && e.shadeId == null)
        .fold(0, (sum, e) => sum + e.quantity);
  }

  void _openProduct(BuildContext context) {
    context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}');
  }

  void _addFirst(BuildContext context, WidgetRef ref) {
    HapticFeedback.lightImpact();
    ref.read(cartProvider.notifier).add(product);
    AppSnackbar.cartAdded(
      context,
      productName: product.name,
      onViewCart: () {
        openCartTab(context, ProviderScope.containerOf(context, listen: false));
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!product.inStock) {
      return _DisabledCartButton(compact: compact);
    }

    final hasShades = product.shades.isNotEmpty || product.shadeCount > 0;
    if (hasShades) {
      return _AddCartButton(
        compact: compact,
        onTap: () {
          HapticFeedback.lightImpact();
          _openProduct(context);
        },
      );
    }

    final qty = ref.watch(cartProvider.select(_qty));

    if (qty <= 0) {
      return _AddCartButton(
        compact: compact,
        onTap: () => _addFirst(context, ref),
      );
    }

    return _CartQtyStepper(
      compact: compact,
      quantity: qty,
      onIncrement: () {
        HapticFeedback.selectionClick();
        final ok = ref.read(cartProvider.notifier).incrementProduct(product);
        if (!ok && context.mounted) {
          AppSnackbar.show(context, 'وصلت للحد الأقصى للمخزون');
        }
      },
      onDecrement: () {
        HapticFeedback.selectionClick();
        ref.read(cartProvider.notifier).decrementProduct(product.id);
      },
    );
  }
}

class _AddCartButton extends StatelessWidget {
  final VoidCallback onTap;
  final bool compact;

  const _AddCartButton({required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final side = compact ? 36.0 : 38.0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: RoundedRectangleBorder(borderRadius: BorderRadius.circular(side / 2)),
        child: Ink(
          width: side,
          height: side,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(side / 2),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.28),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Icon(
            Icons.add_shopping_cart_rounded,
            color: Colors.white,
            size: compact ? 18 : 19,
          ),
        ),
      ),
    );
  }
}

class _DisabledCartButton extends StatelessWidget {
  final bool compact;

  const _DisabledCartButton({this.compact = false});

  @override
  Widget build(BuildContext context) {
    final side = compact ? 36.0 : 38.0;
    return Container(
      width: side,
      height: side,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.divider,
        borderRadius: BorderRadius.circular(side / 2),
      ),
      child: Icon(
        Icons.remove_shopping_cart_outlined,
        size: compact ? 17 : 18,
        color: AppColors.textMuted,
      ),
    );
  }
}

class _CartQtyStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final bool compact;

  const _CartQtyStepper({
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final height = compact ? 34.0 : 36.0;

    return Container(
      height: height,
      constraints: BoxConstraints(minWidth: compact ? 92 : 96),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(height / 2),
        border: Border.all(color: AppColors.primarySoft),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepIconButton(
            icon: Icons.remove_rounded,
            onTap: onDecrement,
            size: height,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Text(
              '$quantity',
              style: TextStyle(
                fontSize: compact ? 13 : 14,
                fontWeight: FontWeight.w800,
                color: AppColors.primaryDark,
                height: 1,
              ),
            ),
          ),
          _StepIconButton(
            icon: Icons.add_rounded,
            onTap: onIncrement,
            size: height,
            filled: true,
          ),
        ],
      ),
    );
  }
}

class _StepIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final double size;
  final bool filled;

  const _StepIconButton({
    required this.icon,
    required this.onTap,
    required this.size,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: size,
          height: size,
          child: Center(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: filled ? size - 6 : size - 8,
              height: filled ? size - 6 : size - 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: filled ? AppColors.primary : Colors.white.withValues(alpha: 0.85),
                border: filled ? null : Border.all(color: AppColors.primarySoft),
              ),
              child: Icon(
                icon,
                size: filled ? 16 : 15,
                color: filled ? Colors.white : AppColors.primaryDark,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
