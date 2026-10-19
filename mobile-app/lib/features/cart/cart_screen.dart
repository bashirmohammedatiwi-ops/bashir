import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/free_shipping_progress.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/coupon.dart';
import '../catalog/catalog_providers.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import 'cart_provider.dart';
import 'cart_packages_provider.dart';
import 'widgets/cart_packages_card.dart';
import 'coupon_provider.dart';
import 'widgets/cart_checkout_bar.dart';
import 'widgets/cart_coupon.dart';
import 'widgets/cart_empty.dart';
import 'widgets/cart_header.dart';
import 'widgets/cart_item_card.dart';
import 'widgets/cart_recommendations.dart';
import '../../data/models/product.dart';
import 'widgets/cart_theme.dart';
import '../worlds/world_theme.dart';
import 'cart_strings.dart';
import '../worlds/worlds_provider.dart';

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

  /// صف «أكملي للتوصيل المجاني» — يقفز إليه زر «أضيفي المزيد» في شريط التقدّم.
  final _fillersKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final applied = ref.read(appliedCouponProvider);
      if (applied != null) _couponCtrl.text = applied.code;
      // التبويب يُبنى أول مرة حين يُفتح: نتحقق من الأسعار والمخزون الآن.
      _revalidate();
    });
  }

  /// يتحقق من السلة مع السيرفر (مرة في الدقيقة على الأكثر) ويخبرها بما تغيّر.
  Future<void> _revalidate() async {
    if (ref.read(cartProvider).isEmpty) return;
    final report = await ref.read(cartProvider.notifier).revalidate();
    if (!mounted || !report.hasChanges) return;
    final s = ref.s;
    final parts = <String>[
      if (report.unavailableKeys.isNotEmpty) s.cartUnavailableCount(report.unavailableKeys.length),
      if (report.changedPriceKeys.isNotEmpty) s.cartPricesUpdated(report.changedPriceKeys.length),
      if (report.clampedKeys.isNotEmpty) s.cartQuantitiesClamped,
      if (report.droppedPackageNames.isNotEmpty) s.cartPackagesEnded(report.droppedPackageNames.join('، ')),
    ];
    if (parts.isEmpty) return;
    AppSnackbar.show(context, parts.join(' · '), duration: const Duration(seconds: 4));
  }

  void _browse() {
    context.go('/');
    ref.read(navIndexProvider.notifier).state = NavTabs.home;
  }

  /// «أضيفي المزيد»: إلى صف المنتجات المقترحة إن ظهر، وإلا للتسوّق.
  void _fillGap() {
    final ctx = _fillersKey.currentContext;
    if (ctx == null) {
      _browse();
      return;
    }
    HapticFeedback.selectionClick();
    Scrollable.ensureVisible(
      ctx,
      duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
      alignment: 0.1,
    );
  }

  @override
  void dispose() {
    _couponCtrl.dispose();
    _couponFocus.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _couponCtrl.text.trim();
    FocusScope.of(context).unfocus();
    setState(() {
      _couponLoading = code.isNotEmpty;
      _couponError = null;
    });
    // الكود السابق يبقى مطبّقاً إن رُفض الجديد أو انقطعت الشبكة.
    final int packageSaving = ref.read(cartPackageSavingProvider);
    final base = ref.read(cartProvider).subtotal - packageSaving;
    final err = await applyCouponFromField(ref, code, subtotal: base);
    if (!mounted) return;
    setState(() {
      _couponLoading = false;
      _couponError = err;
    });
    final applied = ref.read(appliedCouponProvider);
    if (err == null && applied != null) AppSnackbar.success(context, ref.s.couponApplied(applied.code));
  }

  void _removeCoupon() {
    removeAppliedCoupon(ref);
    _couponCtrl.clear();
    setState(() => _couponError = null);
  }

  void _clearCart() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CartTheme.radiusLg)),
        icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.sale),
        title: Text(ref.s.clearCartTitle),
        content: Text(ref.s.clearCartBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(ref.s.cancel)),
          TextButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              ref.read(cartProvider.notifier).clear();
              ref.read(cartPackagesProvider.notifier).clear();
              _removeCoupon();
              Navigator.pop(ctx);
            },
            child: Text(ref.s.clearCart, style: AppText.label.copyWith(color: AppColors.sale)),
          ),
        ],
      ),
    );
  }

  void _validateCouponOnCartChange(Coupon? coupon) {
    // لا نلغي الكود حين ينزل المجموع عن حدّه: الخصم يتوقف ويظهر «أضيفي X» حتى يبلغه مجدداً.
    if (coupon == null || _couponError == null) return;
    if (coupon.eligibleFor(ref.read(cartProvider).subtotal) && mounted) setState(() => _couponError = null);
  }


  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final coupon = ref.watch(appliedCouponProvider);
    // آخر إعدادات معروفة؛ قبل وصولها لا نعد بحد لا نعرفه.
    final threshold = ref.watch(storeSettingsProvider)?.freeShippingThreshold ?? 0;

    ref.listen<CartState>(cartProvider, (prev, next) {
      if (prev?.subtotal != next.subtotal) {
        _validateCouponOnCartChange(ref.read(appliedCouponProvider));
      }
    });
    // كل فتح لتبويب السلة: الأسعار والمخزون كما هي الآن على السيرفر.
    ref.listen<int>(navIndexProvider, (prev, next) {
      if (next == NavTabs.cart && prev != NavTabs.cart) _revalidate();
    });

    // الباقات المكتملة أولاً، ثم الكوبون على ما تبقّى (نفس قاعدة السيرفر).
    final packageSaving = ref.watch(cartPackageSavingProvider);
    final couponBase = cart.subtotal - packageSaving;
    final discount = coupon?.discountFor(couponBase) ?? 0;
    final freeShipping = coupon?.freeShipping ?? false;
    final total = (couponBase - discount).clamp(0, 1 << 31);
    final topPad = MediaQuery.paddingOf(context).top;
    final t = context.worldTheme;

    return Scaffold(
      backgroundColor: t.canvas,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        child: cart.isEmpty
            ? CartEmptyView(key: const ValueKey('empty'), topPad: topPad)
            : Column(
                key: const ValueKey('filled'),
                children: [
                  Expanded(
                    child: CustomScrollView(
                      physics: const BouncingScrollPhysics(),
                      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                      slivers: [
                        SliverToBoxAdapter(
                          child: CartHeader(count: cart.count, topPad: topPad, onClear: _clearCart),
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 14, CartTheme.hPad, 0),
                            child: FreeShippingProgress(
                              subtotal: cart.subtotal,
                              threshold: threshold,
                              viaCoupon: freeShipping,
                              onFillGap: _fillGap,
                            ),
                          ),
                        ),
                        if (!freeShipping && threshold > cart.subtotal)
                          SliverToBoxAdapter(
                            child: KeyedSubtree(
                              key: _fillersKey,
                              child: _FreeShippingFillers(remaining: threshold - cart.subtotal),
                            ),
                          ),
                        const SliverToBoxAdapter(child: CartPackagesCard()),
                        SliverToBoxAdapter(
                          child: CartSectionLabel(title: ref.s.yourProducts, subtitle: ref.s.swipeToRemoveHint),
                        ),
                        SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: CartTheme.hPad),
                          sliver: SliverList.separated(
                            itemCount: cart.items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: CartTheme.itemGap),
                            itemBuilder: (_, i) => CartItemCard(key: ValueKey(cart.items[i].key), item: cart.items[i]),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 16, CartTheme.hPad, 0),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 260),
                              padding: const EdgeInsetsDirectional.fromSTEB(14, 10, 10, 10),
                              decoration: CartTheme.cardDecoration(
                                context,
                                color: coupon != null
                                    ? Color.alphaBlend(AppColors.success.withValues(alpha: 0.06), t.surface)
                                    : t.surface,
                              ),
                              child: CartCouponSection(
                                controller: _couponCtrl,
                                focusNode: _couponFocus,
                                error: _couponError,
                                loading: _couponLoading,
                                applied: coupon,
                                discount: discount,
                                onApply: _applyCoupon,
                                onRemove: _removeCoupon,
                                subtotal: couponBase,
                              ),
                            ),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: CartSummaryCard(
                            subtotal: cart.subtotal,
                            discount: discount,
                            packageSaving: packageSaving,
                            total: total,
                            itemCount: cart.count,
                            freeShippingThreshold: threshold,
                            freeShipping: freeShipping,
                          ),
                        ),
                        // «يكمّل سلتكِ»: ما يُشترى عادةً مع أغلى ما في السلة (بلا تكرار لما فيها).
                        SliverToBoxAdapter(child: _CartPairs(cart: cart)),
                        const SliverToBoxAdapter(child: SizedBox(height: 20)),
                      ],
                    ),
                  ),
                  CartCheckoutBar(total: total, itemCount: cart.count),
                ],
              ),
      ),
    );
  }
}

class _CartPairs extends ConsumerWidget {
  final CartState cart;
  const _CartPairs({required this.cart});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inCart = cart.items.map((e) => e.productId).toSet();
    final anchors = ([...cart.items]..sort((a, b) => b.lineTotal.compareTo(a.lineTotal)))
        .map((e) => e.productId)
        .toSet()
        .take(2)
        .toList();
    final pairs = <Product>[];
    for (final id in anchors) {
      final r = ref.watch(boughtTogetherProvider(id)).valueOrNull;
      for (final p in r?.items ?? const <Product>[]) {
        if (!inCart.contains(p.id) && p.stock > 0 && !pairs.any((x) => x.id == p.id)) pairs.add(p);
      }
    }
    if (pairs.length < 2) return const SizedBox.shrink();
    final ar = ref.s.isAr;
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: CartRecommendations(
        products: pairs.take(10).toList(),
        title: ar ? 'يكمّل سلتكِ' : 'Complete your bag',
        subtitle: ar ? 'اختيارات تناسب ما أضفتِه' : 'Picked to go with your items',
      ),
    );
  }
}

/// «أكملي للتوصيل المجاني»: منتجات بسعر قريب مما ينقص — تظهر فقط إن وُجد منها اثنان.
class _FreeShippingFillers extends ConsumerWidget {
  final int remaining;
  const _FreeShippingFillers({required this.remaining});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(freeShippingFillersFor(remaining)).valueOrNull ?? const <Product>[];
    if (products.length < 2) return const SizedBox.shrink();
    final s = ref.s;
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: CartRecommendations(
        products: products.take(10).toList(),
        title: s.cartCompleteFreeShipping,
        subtitle: s.cartCompleteFreeShippingHint(formatPrice(remaining, lang: s.lang)),
      ),
    );
  }
}
