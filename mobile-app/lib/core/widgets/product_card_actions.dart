import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/auth/auth_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../l10n/locale_provider.dart';
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
            color: wished ? AppColors.primaryLight : const Color(0xFFF5F5F6),
            border: Border.all(
              color: wished ? AppColors.primarySoft : AppColors.hairline.withValues(alpha: 0.85),
              width: wished ? 1.2 : 0.8,
            ),
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
    final lang = ref.read(languageCodeProvider);
    HapticFeedback.lightImpact();
    ref.read(cartProvider.notifier).add(product);
    AppSnackbar.cartAdded(
      context,
      productName: product.localizedName(lang),
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

    final hasShades = product.hasDisplayableShades;
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

  static const _bg = Color(0xFFF3F3F4);
  static const _icon = Color(0xFF7A757F);

  @override
  Widget build(BuildContext context) {
    final side = compact ? 36.0 : 38.0;
    final radius = compact ? 11.0 : 12.0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: Ink(
          width: side,
          height: side,
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: AppColors.hairline.withValues(alpha: 0.75)),
          ),
          child: Icon(
            Icons.shopping_bag_outlined,
            color: _icon,
            size: compact ? 17 : 18,
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
    final radius = compact ? 11.0 : 12.0;
    return Container(
      width: side,
      height: side,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFEBEBED),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.6)),
      ),
      child: Icon(
        Icons.shopping_bag_outlined,
        size: compact ? 16 : 17,
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
    final radius = compact ? 11.0 : 12.0;

    return Container(
      height: height,
      constraints: BoxConstraints(minWidth: compact ? 92 : 96),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F3F4),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.8)),
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
                color: AppColors.textPrimary,
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
                borderRadius: BorderRadius.circular(8),
                color: filled ? const Color(0xFF7A757F) : Colors.transparent,
                border: filled ? null : Border.all(color: AppColors.hairline),
              ),
              child: Icon(
                icon,
                size: filled ? 16 : 15,
                color: filled ? Colors.white : const Color(0xFF7A757F),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
