import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/auth/auth_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../../features/worlds/world_theme.dart';
import '../l10n/app_strings.dart';
import '../theme/app_colors.dart';
import '../theme/app_text.dart';
import 'app_snackbar.dart';

/// زر المفضلة على بطاقة المنتج — قلب وردي ينبض عند الإضافة.
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
    final wished = ref.watch(
      wishlistProvider.select((s) => s.ids.contains(product.id)),
    );
    final t = context.worldTheme;
    final s = ref.s;

    return Semantics(
      button: true,
      toggled: wished,
      label: s.isAr ? 'المفضلة' : 'Wishlist',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () async {
          HapticFeedback.lightImpact();
          if (!ref.read(authProvider).isAuthenticated) {
            context.push('/login');
            return;
          }
          await ref.read(wishlistProvider.notifier).toggle(product);
        },
        // مساحة لمس أوسع من الشكل المرئي.
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.surface.withValues(alpha: 0.94),
              border: Border.all(
                color: wished
                    ? AppColors.sale.withValues(alpha: 0.35)
                    : t.hairline.withValues(alpha: 0.8),
              ),
              boxShadow: [
                BoxShadow(
                  color: t.ink.withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              transitionBuilder: (child, a) => ScaleTransition(
                scale: Tween(begin: 0.4, end: 1.0).animate(
                  CurvedAnimation(parent: a, curve: Curves.easeOutBack),
                ),
                child: child,
              ),
              child: Icon(
                wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                key: ValueKey(wished),
                size: size * 0.5,
                color: wished ? AppColors.sale : t.inkSoft,
              ),
            ),
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
    context.push(
      '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
    );
  }

  void _addFirst(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    HapticFeedback.mediumImpact();
    ref
        .read(cartProvider.notifier)
        .add(product, shade: product.soleDisplayableShade);
    AppSnackbar.cartAdded(
      context,
      title: s.addedToCart,
      viewCartLabel: s.viewCart,
      onViewCart: () {
        openCartTab(context, ProviderScope.containerOf(context, listen: false));
      },
    );
  }

  void _increment(BuildContext context, WidgetRef ref) {
    HapticFeedback.selectionClick();
    final ok = ref.read(cartProvider.notifier).incrementProduct(product);
    if (!ok && context.mounted)
      AppSnackbar.show(context, ref.read(stringsProvider).maxStockReached);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final side = compact ? 34.0 : 36.0;
    if (!product.inStock) return const SizedBox.shrink();

    // المنتجات ذات الدرجات تحتاج اختيار درجة — نفتح صفحة المنتج.
    if (product.hasDisplayableShades) {
      return _RoundCartButton(
        side: side,
        icon: Icons.palette_outlined,
        onTap: () {
          HapticFeedback.lightImpact();
          _openProduct(context);
        },
      );
    }

    final qty = ref.watch(cartProvider.select(_qty));

    if (style == ProductCardCartStyle.homeBadge || qty <= 0) {
      return _RoundCartButton(
        side: side,
        icon: qty > 0
            ? Icons.shopping_bag_rounded
            : Icons.add_shopping_cart_rounded,
        filled: qty > 0,
        badge: style == ProductCardCartStyle.homeBadge ? qty : 0,
        onTap: () =>
            qty <= 0 ? _addFirst(context, ref) : _increment(context, ref),
      );
    }

    return _CartQtyPill(
      height: side,
      quantity: qty,
      onIncrement: () => _increment(context, ref),
      onDecrement: () {
        HapticFeedback.selectionClick();
        ref.read(cartProvider.notifier).decrementProduct(product.id);
      },
    );
  }
}

class _RoundCartButton extends StatelessWidget {
  final double side;
  final IconData icon;
  final bool filled;
  final int badge;
  final VoidCallback onTap;

  const _RoundCartButton({
    required this.side,
    required this.icon,
    required this.onTap,
    this.filled = false,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              width: side,
              height: side,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: filled ? t.accent : t.surface,
                border: Border.all(
                  color: filled ? t.accent : t.hairline.withValues(alpha: 0.9),
                ),
                boxShadow: [
                  BoxShadow(
                    color: (filled ? t.accent : t.ink).withValues(
                      alpha: filled ? 0.28 : 0.07,
                    ),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(
                icon,
                size: side * 0.5,
                color: filled ? Colors.white : t.accentDark,
              ),
            ),
            if (badge > 0)
              PositionedDirectional(
                top: -4,
                end: -4,
                child: Container(
                  constraints: const BoxConstraints(
                    minWidth: 17,
                    minHeight: 17,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.sale,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    badge > 99 ? '99+' : '$badge',
                    style: AppText.micro.copyWith(
                      color: Colors.white,
                      fontSize: 9.5,
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

/// عدّاد الكمية على البطاقة بعد الإضافة — حبة ممتلئة بلون العالم.
class _CartQtyPill extends StatelessWidget {
  final double height;
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _CartQtyPill({
    required this.height,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    Widget btn(IconData icon, VoidCallback onTap) => GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: SizedBox(
        width: height + 4,
        height: height,
        child: Icon(icon, size: 17, color: Colors.white),
      ),
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: t.accent,
          borderRadius: BorderRadius.circular(999),
          boxShadow: [
            BoxShadow(
              color: t.accent.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            btn(
              quantity <= 1
                  ? Icons.delete_outline_rounded
                  : Icons.remove_rounded,
              onDecrement,
            ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 160),
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: Text(
                '$quantity',
                key: ValueKey(quantity),
                style: AppText.label.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  height: 1,
                ),
              ),
            ),
            btn(Icons.add_rounded, onIncrement),
          ],
        ),
      ),
    );
  }
}
