import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../../features/worlds/world_theme.dart';
import '../l10n/app_strings.dart';
import '../navigation/app_navigation.dart';
import '../navigation/product_nav.dart';
import '../push/push_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';
import '../theme/app_text.dart';
import '../utils/friendly_error.dart';
import 'app_snackbar.dart';
import 'ds_strings.dart';
import 'quick_shade_sheet.dart';

/// زر المفضلة على بطاقة المنتج — قلب وردي ينبض عند الإضافة.
///
/// القلب يتغيّر فوراً (المزوّد متفائل)، والخطأ يظهر برسالة بدل أن يضيع بصمت.
/// الضيفة تُرسل لتسجيل الدخول ثم يُحفظ المنتج الذي أرادته.
class ProductCardWishButton extends ConsumerStatefulWidget {
  final Product product;
  final double size;

  const ProductCardWishButton({
    super.key,
    required this.product,
    this.size = 34,
  });

  @override
  ConsumerState<ProductCardWishButton> createState() => _ProductCardWishButtonState();
}

class _ProductCardWishButtonState extends ConsumerState<ProductCardWishButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pop = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 380),
  );

  /// نبضة الإضافة: يكبر القلب قليلاً ثم يستقر بارتداد ناعم.
  late final Animation<double> _scale = TweenSequence<double>([
    TweenSequenceItem(
      tween: Tween(begin: 1.0, end: 1.22).chain(CurveTween(curve: Curves.easeOut)),
      weight: 35,
    ),
    TweenSequenceItem(
      tween: Tween(begin: 1.22, end: 1.0).chain(CurveTween(curve: Curves.easeOutBack)),
      weight: 65,
    ),
  ]).animate(_pop);

  @override
  void dispose() {
    _pop.dispose();
    super.dispose();
  }

  void _celebrate() {
    if (!mounted || MediaQuery.disableAnimationsOf(context)) return;
    _pop.forward(from: 0);
  }

  Future<void> _onTap() async {
    HapticFeedback.lightImpact();
    final product = widget.product;
    final s = ref.read(stringsProvider);
    // الحاوية لا العنصر: البطاقة قد تُعاد بناؤها أثناء صفحة الدخول.
    final container = ProviderScope.containerOf(context, listen: false);
    try {
      if (!container.read(authProvider).isAuthenticated) {
        await context.push('/login');
        if (!container.read(authProvider).isAuthenticated) return;
        // نحمّل المفضلة أولاً ونضيف فقط إن لم يكن محفوظاً — قلب أعمى قد يزيل
        // منتجاً حفظته من جهاز آخر.
        final wishlist = container.read(wishlistProvider.notifier);
        await wishlist.load();
        if (!wishlist.isWishlisted(product.id)) {
          _celebrate();
          await wishlist.setWished(product, true);
        }
        if (mounted) AppSnackbar.success(context, s.dsSavedToWishlist);
        _softAskPush(s);
        return;
      }
      final wishlist = container.read(wishlistProvider.notifier);
      if (!wishlist.isWishlisted(product.id)) _celebrate();
      if (await wishlist.toggle(product)) _softAskPush(s);
    } catch (e) {
      if (mounted) AppSnackbar.error(context, friendlyError(e, lang: s.lang));
    }
  }

  /// بعد الحفظ: دعوة لطيفة لتفعيل الإشعارات (تنبيه السعر والتوفّر). تقيّد نفسها
  /// بمرة كل 14 يوماً ولا تظهر إن كان الإذن ممنوحاً.
  void _softAskPush(AppStrings s) {
    if (mounted) PushService.maybeSoftAsk(context, reason: s.dsWishlistPushReason);
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final size = widget.size;
    final wished = ref.watch(
      wishlistProvider.select((s) => s.ids.contains(product.id)),
    );
    final t = context.worldTheme;
    final s = ref.s;
    final still = MediaQuery.disableAnimationsOf(context);

    return Semantics(
      container: true,
      button: true,
      toggled: wished,
      label: s.dsWishlist,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _onTap,
        // مساحة لمس 44 نقطة حول الشكل المرئي.
        child: SizedBox.square(
          dimension: math.max(kMinTapTarget, size),
          child: Center(
            child: ScaleTransition(
              scale: _scale,
              child: AnimatedContainer(
                duration: still ? Duration.zero : const Duration(milliseconds: 200),
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
                  boxShadow: AppShadows.raised(t),
                ),
                child: AnimatedSwitcher(
                  duration: still ? Duration.zero : const Duration(milliseconds: 260),
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

  /// المنتج يحتاج اختيار درجة — لا إضافة سريعة أبداً. يشمل نسخة مختصرة وصلت
  /// بعدد درجات بلا الدرجات نفسها (لقطة «شاهدتِ مؤخراً» مثلاً): الإضافة هنا
  /// كانت ستضع في السلة منتجاً متعدد الدرجات بلا درجة.
  bool get _needsShade =>
      product.hasDisplayableShades ||
      (product.shadeCount > 1 && product.displayableShades.isEmpty);

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

  /// درجات معروفة: ورقة الاختيار السريعة فوق الصفحة الحالية. بلا درجات في
  /// البيانات: صفحة المنتج (بياناتها الكاملة تجلب الدرجات).
  void _chooseShade(BuildContext context, WidgetRef ref) {
    HapticFeedback.lightImpact();
    if (product.hasDisplayableShades) {
      showQuickShadeSheet(context, ref, product);
    } else {
      openProduct(context, product);
    }
  }

  void _addFirst(BuildContext context, WidgetRef ref) {
    final s = ref.read(stringsProvider);
    HapticFeedback.mediumImpact();
    final ok = ref
        .read(cartProvider.notifier)
        .add(product, shade: product.soleDisplayableShade);
    if (!ok) {
      AppSnackbar.show(context, s.maxStockReached);
      return;
    }
    final container = ProviderScope.containerOf(context, listen: false);
    AppSnackbar.cartAdded(
      context,
      title: s.addedToCart,
      viewCartLabel: s.viewCart,
      // البطاقة قد تختفي قبل الضغط على «عرض السلة» — نفتحها عبر الحاوية.
      onViewCart: () => openCartFromContainer(container),
    );
  }

  void _increment(BuildContext context, WidgetRef ref) {
    HapticFeedback.selectionClick();
    final ok = ref.read(cartProvider.notifier).incrementProduct(product);
    if (!ok && context.mounted) {
      AppSnackbar.show(context, ref.read(stringsProvider).maxStockReached);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final side = compact ? 34.0 : 36.0;
    if (!product.inStock) return const SizedBox.shrink();
    final s = ref.s;

    if (_needsShade) {
      return _RoundCartButton(
        side: side,
        icon: Icons.palette_outlined,
        label: s.dsChooseShade,
        onTap: () => _chooseShade(context, ref),
      );
    }

    final qty = ref.watch(cartProvider.select(_qty));

    if (style == ProductCardCartStyle.homeBadge || qty <= 0) {
      return _RoundCartButton(
        side: side,
        icon: qty > 0
            ? Icons.shopping_bag_rounded
            : Icons.add_shopping_cart_rounded,
        label: qty > 0 ? s.dsIncreaseQty : s.dsAddToCart,
        filled: qty > 0,
        badge: style == ProductCardCartStyle.homeBadge ? qty : 0,
        onTap: () =>
            qty <= 0 ? _addFirst(context, ref) : _increment(context, ref),
      );
    }

    return _CartQtyPill(
      height: side,
      quantity: qty,
      increaseLabel: s.dsIncreaseQty,
      decreaseLabel: qty <= 1 ? s.dsRemoveFromCart : s.dsDecreaseQty,
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
  final String label;
  final bool filled;
  final int badge;
  final VoidCallback onTap;

  const _RoundCartButton({
    required this.side,
    required this.icon,
    required this.label,
    required this.onTap,
    this.filled = false,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final still = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      container: true,
      button: true,
      label: label,
      value: badge > 0 ? '$badge' : null,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        // مساحة لمس 44 نقطة؛ الدائرة المرئية بحجمها في المنتصف.
        child: ExcludeSemantics(
          child: SizedBox.square(
            dimension: math.max(kMinTapTarget, side),
            child: Center(
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  AnimatedContainer(
                    duration: still ? Duration.zero : const Duration(milliseconds: 200),
                    curve: Curves.easeOutCubic,
                    width: side,
                    height: side,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      // buttonFill/onAccent: تباين 4.5:1 مضمون حتى مع ألوان العوالم الفاتحة.
                      color: filled ? t.buttonFill : t.surface,
                      border: Border.all(
                        color: filled ? t.buttonFill : t.hairline.withValues(alpha: 0.9),
                      ),
                      boxShadow: filled ? AppShadows.floating(t) : AppShadows.raised(t),
                    ),
                    child: Icon(
                      icon,
                      size: side * 0.5,
                      color: filled ? t.onAccent : t.accentDark,
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
                          borderRadius: BorderRadius.circular(AppCorners.pill),
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
          ),
        ),
      ),
    );
  }
}

/// عدّاد الكمية على البطاقة بعد الإضافة — حبة ممتلئة بلون العالم.
/// الحبة المرئية بارتفاع [height]، وكل زر مساحة لمسه 44×44 تمتد فوقها وتحتها.
class _CartQtyPill extends StatelessWidget {
  final double height;
  final int quantity;
  final String increaseLabel;
  final String decreaseLabel;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _CartQtyPill({
    required this.height,
    required this.quantity,
    required this.increaseLabel,
    required this.decreaseLabel,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final still = MediaQuery.disableAnimationsOf(context);
    final inset = math.max(0.0, (kMinTapTarget - height) / 2);

    Widget btn(IconData icon, String label, VoidCallback onTap) => Semantics(
          container: true,
          button: true,
          label: label,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onTap,
            child: SizedBox.square(
              dimension: kMinTapTarget,
              child: Icon(icon, size: 17, color: t.onAccent),
            ),
          ),
        );

    return SizedBox(
      height: math.max(kMinTapTarget, height),
      child: Stack(
        alignment: Alignment.center,
        children: [
          PositionedDirectional(
            top: inset,
            bottom: inset,
            start: 3,
            end: 3,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: t.buttonFill,
                borderRadius: BorderRadius.circular(AppCorners.pill),
                boxShadow: AppShadows.floating(t),
              ),
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              btn(
                quantity <= 1
                    ? Icons.delete_outline_rounded
                    : Icons.remove_rounded,
                decreaseLabel,
                onDecrement,
              ),
              // عقدة مستقلة تُعلن الكمية الجديدة — لا تندمج في وصف البطاقة.
              Semantics(
                container: true,
                liveRegion: true,
                child: AnimatedSwitcher(
                  duration: still ? Duration.zero : const Duration(milliseconds: 160),
                  transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                  child: Text(
                    '$quantity',
                    key: ValueKey(quantity),
                    style: AppText.label.copyWith(
                      color: t.onAccent,
                      height: 1,
                    ),
                  ),
                ),
              ),
              btn(Icons.add_rounded, increaseLabel, onIncrement),
            ],
          ),
        ],
      ),
    );
  }
}
