import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/product.dart';
import '../catalog/catalog_providers.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import '../worlds/worlds_provider.dart';
import 'cart_packages_provider.dart';
import 'cart_provider.dart';
import 'cart_strings.dart';
import 'coupon_provider.dart';
import 'widgets/cart_checkout_bar.dart';
import 'widgets/cart_coupon.dart';
import 'widgets/cart_empty.dart';
import 'widgets/cart_header.dart';
import 'widgets/cart_item_card.dart';
import 'widgets/cart_packages_card.dart';
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

  /// صف «أكملي للتوصيل المجاني» — يقفز إليه زر «أضيفي المزيد» في شريط التقدّم.
  /// سياق لا مفتاح عام: [AnimatedSwitcher] قد يُبقي نسختين من الجسم أثناء الانتقال.
  BuildContext? _fillersContext;

  /// جسم السلة الممتلئة: إشعارات الشاشة تُعرض من داخله فتطفو فوق شريط الدفع.
  BuildContext? _bodyContext;

  /// آخر ما غيّره التحقق مع السيرفر (أسعار، كميات، باقات انتهت) — حتى تخفيه الزبونة.
  CartRevalidation? _notice;

  BuildContext get _snackContext {
    final body = _bodyContext;
    return body != null && body.mounted ? body : context;
  }

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

  /// يتحقق من السلة مع السيرفر (مرة في الدقيقة على الأكثر) ويعرض ما تغيّر أعلى الصفحة.
  /// غير المتوفر يُقرأ حياً من السلة؛ هنا فقط ما تغيّر مرة واحدة (سعر، كمية، باقة).
  Future<void> _revalidate() async {
    if (ref.read(cartProvider).isEmpty) return;
    final report = await ref.read(cartProvider.notifier).revalidate();
    if (!mounted) return;
    final news =
        report.changedPriceKeys.isNotEmpty ||
        report.clampedKeys.isNotEmpty ||
        report.droppedPackageNames.isNotEmpty ||
        report.changedPackageNames.isNotEmpty;
    if (news) setState(() => _notice = report);
  }

  /// «أزيلي غير المتوفر»: بلمسة واحدة يصبح الطلب قابلاً للإتمام.
  void _removeUnavailable() {
    final notifier = ref.read(cartProvider.notifier);
    final cart = ref.read(cartProvider);
    HapticFeedback.mediumImpact();
    for (final item in cart.items.where((e) => cart.isUnavailable(e.key)).toList()) {
      notifier.remove(item.key);
    }
  }

  void _browse() {
    context.go('/');
    ref.read(navIndexProvider.notifier).state = NavTabs.home;
  }

  /// «أضيفي المزيد»: إلى صف المنتجات المقترحة إن ظهر، وإلا للتسوّق.
  void _fillGap() {
    final ctx = _fillersContext;
    // الصف يختفي إن لم نجد منتجين مناسبين: حينها نفتح التسوّق.
    final box = ctx != null && ctx.mounted ? ctx.findRenderObject() : null;
    if (ctx == null || box is! RenderBox || !box.hasSize || box.size.height < 1) {
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
    if (err == null && applied != null) AppSnackbar.success(_snackContext, ref.s.couponApplied(applied.code));
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
              setState(() => _notice = null);
              Navigator.pop(ctx);
            },
            child: Text(ref.s.clearCart, style: AppText.label.copyWith(color: AppColors.sale)),
          ),
        ],
      ),
    );
  }

  /// لا نلغي الكود حين ينزل المجموع عن حدّه: الخصم يتوقف ويظهر «أضيفي X» حتى يبلغه مجدداً.
  /// حين يبلغه يختفي خطأ الحقل القديم (الأساس بعد توفير الباقات، كقاعدة السيرفر).
  void _validateCouponOnCartChange() {
    final coupon = ref.read(appliedCouponProvider);
    if (coupon == null || _couponError == null) return;
    final int packageSaving = ref.read(cartPackageSavingProvider);
    final base = ref.read(cartProvider).subtotal - packageSaving;
    if (coupon.eligibleFor(base) && mounted) setState(() => _couponError = null);
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final coupon = ref.watch(appliedCouponProvider);
    // آخر إعدادات معروفة؛ قبل وصولها لا نعد بحد لا نعرفه.
    final threshold = ref.watch(storeSettingsProvider)?.freeShippingThreshold ?? 0;

    ref.listen<CartState>(cartProvider, (prev, next) {
      if (prev?.subtotal != next.subtotal) _validateCouponOnCartChange();
    });
    // كل فتح لتبويب السلة: الأسعار والمخزون كما هي الآن على السيرفر.
    ref.listen<int>(navIndexProvider, (prev, next) {
      if (next == NavTabs.cart && prev != NavTabs.cart) _revalidate();
    });

    // الباقات المكتملة أولاً، ثم الكوبون على ما تبقّى (نفس قاعدة السيرفر).
    final packageSaving = ref.watch(cartPackageSavingProvider);
    final couponBase = cart.subtotal - packageSaving;
    final discount = coupon?.discountFor(couponBase) ?? 0;
    // كوبون التوصيل المجاني لا يُحسب قبل بلوغ حدّه الأدنى — كما في الدفع والسيرفر.
    final freeShipping = coupon != null && coupon.freeShipping && coupon.eligibleFor(couponBase);
    final shipping = CartShippingTarget.of(
      subtotal: cart.subtotal,
      threshold: threshold,
      coupon: coupon,
      couponBase: couponBase,
    );
    final total = (couponBase - discount).clamp(0, 1 << 31);
    // توفير العروض: الفرق بين السعر الأصلي وسعر العرض لكل سطر.
    final saleSaving = cart.items.fold<int>(0, (sum, e) => sum + e.lineSaving);
    final topPad = MediaQuery.paddingOf(context).top;
    final t = context.worldTheme;
    final unavailableCount = cart.unavailableKeys.length;
    final needsShadeCount = cart.needsShadeKeys.length;

    return Scaffold(
      backgroundColor: t.canvas,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        child: cart.isEmpty
            ? CartEmptyView(key: const ValueKey('empty'), topPad: topPad)
            : ShellDockInsets(
                key: const ValueKey('filled'),
                // الإشعارات تطفو فوق شريط الدفع لا فوقه مباشرة.
                height: Responsive.shellNavDockHeight(context) + CartCheckoutBar.height,
                child: Builder(
                  builder: (bodyContext) {
                    _bodyContext = bodyContext;
                    return Column(
                      children: [
                        Expanded(
                          child: CustomScrollView(
                            physics: const BouncingScrollPhysics(),
                            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                            slivers: [
                              SliverToBoxAdapter(
                                child: CartHeader(count: cart.count, topPad: topPad, onClear: _clearCart),
                              ),
                              if (unavailableCount > 0 || needsShadeCount > 0 || _notice != null)
                                SliverToBoxAdapter(
                                  child: _CartUpdateNotice(
                                    unavailableCount: unavailableCount,
                                    needsShadeCount: needsShadeCount,
                                    report: _notice,
                                    onRemoveUnavailable: _removeUnavailable,
                                    onDismiss: _notice == null ? null : () => setState(() => _notice = null),
                                  ),
                                ),
                              SliverToBoxAdapter(
                                child: CartShippingBanner(target: shipping, onFillGap: _fillGap),
                              ),
                              if (shipping.remaining > 0)
                                SliverToBoxAdapter(
                                  child: Builder(
                                    builder: (fillersContext) {
                                      _fillersContext = fillersContext;
                                      return _FreeShippingFillers(remaining: shipping.remaining);
                                    },
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
                                  itemBuilder: (_, i) =>
                                      CartItemCard(key: ValueKey(cart.items[i].key), item: cart.items[i]),
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
                                  saleSaving: saleSaving,
                                  total: total,
                                  itemCount: cart.count,
                                  freeShippingThreshold: threshold,
                                  freeShipping: freeShipping,
                                ),
                              ),
                              const SliverToBoxAdapter(child: SizedBox(height: 20)),
                            ],
                          ),
                        ),
                        CartCheckoutBar(
                          total: total,
                          itemCount: cart.count,
                          compareAt: cart.subtotal + saleSaving,
                          blocked: cart.blocksCheckout,
                        ),
                      ],
                    );
                  },
                ),
              ),
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

/// تنبيه أعلى السلة بعد التحقق مع السيرفر: ما لم يعد متوفراً (مع إزالته بلمسة)،
/// وما تغيّر سعره أو كميته، والباقات التي انتهى عرضها.
class _CartUpdateNotice extends ConsumerWidget {
  final int unavailableCount;

  /// أسطر تنتظر اختيار اللون (يُختار من بطاقة السطر نفسه).
  final int needsShadeCount;
  final CartRevalidation? report;
  final VoidCallback onRemoveUnavailable;
  final VoidCallback? onDismiss;

  const _CartUpdateNotice({
    required this.unavailableCount,
    this.needsShadeCount = 0,
    required this.report,
    required this.onRemoveUnavailable,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final r = report;
    final urgent = unavailableCount > 0;
    final tone = urgent ? AppColors.sale : AppColors.warning;
    final lines = <String>[
      if (urgent) s.cartUnavailableCount(unavailableCount),
      if (needsShadeCount > 0) s.cartNeedsShadeCount(needsShadeCount),
      if (r != null && r.changedPriceKeys.isNotEmpty) s.cartPricesUpdated(r.changedPriceKeys.length),
      if (r != null && r.clampedKeys.isNotEmpty) s.cartQuantitiesClamped,
      if (r != null && r.droppedPackageNames.isNotEmpty)
        s.cartPackagesEnded(r.droppedPackageNames.join(s.isAr ? '، ' : ', ')),
      if (r != null && r.changedPackageNames.isNotEmpty)
        s.cartPackagesChanged(r.changedPackageNames.join(s.isAr ? '، ' : ', ')),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 14, CartTheme.hPad, 0),
      child: Semantics(
        liveRegion: true,
        container: true,
        child: Container(
          padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 4, 12),
          decoration: BoxDecoration(
            color: Color.alphaBlend(tone.withValues(alpha: 0.08), t.surface),
            borderRadius: BorderRadius.circular(CartTheme.radiusLg),
            border: Border.all(color: tone.withValues(alpha: 0.3)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Icon(urgent ? Icons.error_outline_rounded : Icons.info_outline_rounded, color: tone, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.cartUpdatedTitle, style: AppText.label.copyWith(color: t.ink)),
                    const SizedBox(height: 4),
                    for (final line in lines)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(line, style: AppText.caption.copyWith(color: t.inkSoft, height: 1.45)),
                      ),
                    if (urgent)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: TextButton.icon(
                          onPressed: onRemoveUnavailable,
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.sale,
                            minimumSize: const Size(0, kMinTapTarget),
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            alignment: AlignmentDirectional.centerStart,
                          ),
                          icon: const Icon(Icons.delete_sweep_outlined, size: 18),
                          label: Text(s.cartRemoveAllUnavailable, style: AppText.label.copyWith(color: AppColors.sale)),
                        ),
                      ),
                  ],
                ),
              ),
              if (onDismiss != null)
                AppIconButton(
                  icon: Icons.close_rounded,
                  size: kMinTapTarget,
                  iconSize: 17,
                  outlined: false,
                  background: Colors.transparent,
                  color: t.inkMuted,
                  tooltip: s.cartDismissNotice,
                  onTap: onDismiss,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
