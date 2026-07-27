import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/auth/auth_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../l10n/app_strings.dart';
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

/// أسلوب زر السلة على البطاقة.
enum ProductCardCartStyle {
  /// عدّاد + / − (صفحات المنتجات والقوائم).
  stepper,
  /// زر ثابت + شارة العدد (الرئيسية فقط).
  homeBadge,
}

/// زر إضافة أو عدّاد كمية على بطاقة المنتج.
class ProductCardCartControl extends ConsumerWidget {
  final Product product;
  final bool compact;
  final ProductCardCartStyle style;

  const ProductCardCartControl({
    super.key,
    required this.product,
    this.compact = false,
    this.style = ProductCardCartStyle.stepper,
  });

  int _qty(CartState cart) {
    final sole = product.soleDisplayableShade;
    if (sole != null) {
      return cart.items
          .where((e) => e.productId == product.id && e.shadeId == sole.id)
          .fold(0, (sum, e) => sum + e.quantity);
    }
    return cart.items
        .where((e) => e.productId == product.id && e.shadeId == null)
        .fold(0, (sum, e) => sum + e.quantity);
  }

  void _openProduct(BuildContext context) {
    context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}');
  }

  void _addFirst(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    HapticFeedback.lightImpact();
    ref.read(cartProvider.notifier).add(
          product,
          shade: product.soleDisplayableShade,
        );
    AppSnackbar.cartAdded(
      context,
      title: s.addedToCart,
      viewCartLabel: s.viewCart,
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

    if (style == ProductCardCartStyle.homeBadge) {
      return _HomeBadgeCartButton(
        compact: compact,
        quantity: qty,
        onTap: () {
          if (qty <= 0) {
            _addFirst(context, ref);
            return;
          }
          HapticFeedback.selectionClick();
          final ok = ref.read(cartProvider.notifier).incrementProduct(product);
          if (!ok && context.mounted) {
            AppSnackbar.show(context, 'وصلت للحد الأقصى للمخزون');
          }
        },
      );
    }

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

class _HomeBadgeCartButton extends StatelessWidget {
  final bool compact;
  final int quantity;
  final VoidCallback onTap;

  const _HomeBadgeCartButton({
    required this.compact,
    required this.quantity,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final side = compact ? 36.0 : 38.0;
    final radius = compact ? 11.0 : 12.0;
    final inCart = quantity > 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              width: side,
              height: side,
              decoration: BoxDecoration(
                color: inCart ? AppColors.primary : const Color(0xFFF3F3F4),
                borderRadius: BorderRadius.circular(radius),
                border: Border.all(
                  color: inCart ? AppColors.primary : AppColors.hairline.withValues(alpha: 0.75),
                ),
                boxShadow: compact
                    ? [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: inCart ? 0.12 : 0.06),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                Icons.shopping_bag_outlined,
                color: inCart ? Colors.white : const Color(0xFF7A757F),
                size: compact ? 17 : 18,
              ),
            ),
            if (inCart)
              Positioned(
                top: -5,
                right: -5,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.sale,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    quantity > 99 ? '99+' : '$quantity',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w900,
                      height: 1,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
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
      constraints: BoxConstraints(minWidth: compact ? 78 : 96),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F3F4),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.8)),
        boxShadow: compact
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ]
            : null,
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
