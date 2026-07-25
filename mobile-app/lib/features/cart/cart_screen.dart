import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../data/models/coupon.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../shell/main_shell.dart';
import 'cart_provider.dart';
import 'coupon_provider.dart';
import 'widgets/cart_checkout_bar.dart';
import 'widgets/cart_coupon.dart';
import 'widgets/cart_empty.dart';
import 'widgets/cart_header.dart';
import 'widgets/cart_item_card.dart';
import 'widgets/cart_recommendations.dart';
import 'widgets/cart_shipping_banner.dart';
import 'widgets/cart_theme.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final _couponCtrl = TextEditingController();
  final _couponFocus = FocusNode();
  String? _couponError;
  bool _couponLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final applied = ref.read(appliedCouponProvider);
      if (applied != null) _couponCtrl.text = applied.code;
    });
  }

  @override
  void dispose() {
    _couponCtrl.dispose();
    _couponFocus.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final s = ref.s;
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) {
      setState(() => _couponError = s.enterCouponPrompt);
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _couponLoading = true;
      _couponError = null;
    });

    try {
      final coupon = await ref.read(apiServiceProvider).validateCoupon(code);
      final subtotal = ref.read(cartProvider).subtotal;

      if (coupon == null) {
        ref.read(appliedCouponProvider.notifier).state = null;
        setState(() => _couponError = s.invalidCoupon);
        return;
      }

      if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        ref.read(appliedCouponProvider.notifier).state = null;
        setState(() => _couponError = s.minOrderAmount(formatPrice(coupon.minOrder)));
        return;
      }

      ref.read(appliedCouponProvider.notifier).state = coupon;
      setState(() => _couponError = null);
      HapticFeedback.mediumImpact();
      if (mounted) AppSnackbar.success(context, s.couponApplied(coupon.code));
    } on ApiException catch (e) {
      ref.read(appliedCouponProvider.notifier).state = null;
      setState(() => _couponError = e.message);
    } catch (e) {
      ref.read(appliedCouponProvider.notifier).state = null;
      setState(() => _couponError = friendlyError(e));
    } finally {
      if (mounted) setState(() => _couponLoading = false);
    }
  }

  void _removeCoupon() {
    ref.read(appliedCouponProvider.notifier).state = null;
    _couponCtrl.clear();
    setState(() => _couponError = null);
    HapticFeedback.selectionClick();
  }

  void _clearCart() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CartTheme.radiusLg)),
        title: Text(ref.s.clearCartTitle),
        content: Text(ref.s.clearCartBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(ref.s.cancel)),
          TextButton(
            onPressed: () {
              ref.read(cartProvider.notifier).clear();
              _removeCoupon();
              Navigator.pop(ctx);
            },
            child: Text(ref.s.clearCart, style: const TextStyle(color: AppColors.sale)),
          ),
        ],
      ),
    );
  }

  void _validateCouponOnCartChange(Coupon? coupon) {
    final s = ref.s;
    final cart = ref.read(cartProvider);
    if (coupon == null) return;
    if (coupon.minOrder > 0 && cart.subtotal < coupon.minOrder) {
      ref.read(appliedCouponProvider.notifier).state = null;
      if (mounted) {
        setState(() => _couponError = s.minOrderAmount(formatPrice(coupon.minOrder)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final coupon = ref.watch(appliedCouponProvider);
    final feed = ref.watch(homeFeedProvider);
    final threshold = feed.maybeWhen(
      data: (d) => d.settings.freeShippingThreshold,
      orElse: () => 50000,
    );

    ref.listen<CartState>(cartProvider, (prev, next) {
      if (prev?.subtotal != next.subtotal) {
        _validateCouponOnCartChange(ref.read(appliedCouponProvider));
      }
    });

    final discount = coupon?.discountFor(cart.subtotal) ?? 0;
    final freeShipping = coupon?.freeShipping ?? false;
    final total = (cart.subtotal - discount).clamp(0, 1 << 31);
    final topPad = MediaQuery.paddingOf(context).top;
    final navReserve = CartTheme.shellNavReserve(context);

    return Scaffold(
      backgroundColor: CartTheme.bg,
      body: cart.isEmpty
          ? CartEmptyView(topPad: topPad)
          : Padding(
              padding: EdgeInsets.only(bottom: navReserve),
              child: Column(
                children: [
                  Expanded(
                    child: CustomScrollView(
                      physics: const BouncingScrollPhysics(),
                      slivers: [
                        SliverToBoxAdapter(
                          child: CartHeader(
                            count: cart.count,
                            total: total,
                            topPad: topPad,
                            onClear: _clearCart,
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: CartShippingBanner(
                            subtotal: cart.subtotal,
                            threshold: threshold,
                            freeShippingCoupon: freeShipping,
                            onBrowse: () {
                              context.go('/');
                              ref.read(navIndexProvider.notifier).state = 0;
                            },
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: CartSectionLabel(title: ref.s.yourProducts),
                        ),
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 0, CartTheme.hPad, 0),
                          sliver: SliverList.separated(
                            itemCount: cart.items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: CartTheme.itemGap),
                            itemBuilder: (_, i) => CartItemCard(item: cart.items[i]),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 6, CartTheme.hPad, 0),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: CartTheme.cardDecoration(color: CartTheme.brandWash.withValues(alpha: 0.45)),
                              child: CartCouponSection(
                                controller: _couponCtrl,
                                focusNode: _couponFocus,
                                error: _couponError,
                                loading: _couponLoading,
                                applied: coupon,
                                discount: discount,
                                onApply: _applyCoupon,
                                onRemove: _removeCoupon,
                              ),
                            ),
                          ),
                        ),
                        feed.maybeWhen(
                          data: (d) {
                            final recs = d.bestSellers.take(8).toList();
                            if (recs.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                            return SliverToBoxAdapter(child: CartRecommendations(products: recs));
                          },
                          orElse: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                        ),
                        const SliverToBoxAdapter(child: SizedBox(height: 12)),
                      ],
                    ),
                  ),
                  CartCheckoutBar(
                    subtotal: cart.subtotal,
                    discount: discount,
                    total: total,
                    itemCount: cart.count,
                    freeShipping: freeShipping,
                    coupon: coupon,
                  ),
                ],
              ),
            ),
    );
  }
}
