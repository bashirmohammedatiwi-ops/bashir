import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/phone_util.dart';
import '../../core/utils/support_links.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/order_detail_skeleton.dart';
import '../../core/widgets/quick_shade_sheet.dart' show shadeSwatchColor;
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/order.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../cart/widgets/cart_theme.dart';
import '../cart/widgets/pill_buttons.dart';
import '../catalog/catalog_providers.dart';
import '../checkout/checkout_strings.dart';
import '../payments/pay_now_card.dart';
import '../profile/profile_providers.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import '../worlds/worlds_provider.dart';
import 'order_strings.dart';
import 'widgets/order_status.dart';

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    // رابط إشعار أو حملة والزائرة غير مسجّلة: شاشة الدخول بدل خطأ 401 بنص مضلّل.
    return AuthGate(
      title: s.orderDetails,
      emptyTitle: s.loginToViewOrders,
      child: _OrderDetailView(orderId: orderId),
    );
  }
}

class _OrderDetailView extends ConsumerStatefulWidget {
  final String orderId;
  const _OrderDetailView({required this.orderId});

  @override
  ConsumerState<_OrderDetailView> createState() => _OrderDetailViewState();
}

class _OrderDetailViewState extends ConsumerState<_OrderDetailView> {
  bool _reordering = false;
  bool _cancelling = false;

  /// تحديث تلقائي كل دقيقة ما دام الطلب في الطريق والتطبيق ظاهراً.
  Timer? _poll;
  late final AppLifecycleListener _lifecycle;
  bool _resumed = true;

  /// تحديث في الخلفية (المؤقّت/العودة للتطبيق): فشله لا يزعج الزبونة بتنبيه.
  bool _silent = false;

  AutoDisposeFutureProvider<AppOrder> get _provider => orderDetailProvider(widget.orderId);

  @override
  void initState() {
    super.initState();
    ref.listenManual<AsyncValue<AppOrder>>(_provider, (prev, next) {
      _syncPolling(next.valueOrNull?.status);
      if (next.isLoading) return;
      // فشل تحديث والطلب ظاهر: يبقى الطلب كما هو مع تنبيه صغير (لا صفحة خطأ كاملة).
      if (next.hasError && next.hasValue) {
        if (!_silent && mounted) AppSnackbar.error(context, ref.friendly(next.error));
      }
      _silent = false;
    }, fireImmediately: true);
    _lifecycle = AppLifecycleListener(
      onStateChange: (state) {
        final resumed = state == AppLifecycleState.resumed;
        if (resumed == _resumed) return;
        _resumed = resumed;
        final status = ref.read(_provider).valueOrNull?.status;
        // عادت للتطبيق والطلب ما زال في الطريق: الحالة قد تغيّرت أثناء غيابها.
        if (resumed && status != null && isOrderActive(status)) _refreshSilently();
        _syncPolling(status);
      },
    );
  }

  @override
  void dispose() {
    _poll?.cancel();
    _lifecycle.dispose();
    super.dispose();
  }

  void _refreshSilently() {
    _silent = true;
    ref.invalidate(_provider);
  }

  void _syncPolling(String? status) {
    final want = _resumed && status != null && isOrderActive(status);
    if (want) {
      _poll ??= Timer.periodic(const Duration(seconds: 60), (_) => _refreshSilently());
    } else {
      _poll?.cancel();
      _poll = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final async = ref.watch(_provider);
    return Scaffold(
      backgroundColor: t.canvas,
      appBar: AppBar(
        leading: const Padding(
          padding: EdgeInsetsDirectional.only(start: 8),
          child: Center(child: AppBackButton()),
        ),
        leadingWidth: 60,
        titleSpacing: 4,
        title: Text(s.orderDetails, style: AppText.title1.copyWith(color: t.ink)),
        backgroundColor: t.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      // صفحة قراءة (حالة، عنوان، مبالغ): تكبير خط النظام حتى 1.6.
      body: _ReadableTextScale(
        // skipError: فشل تحديث لاحق لا يُخفي الطلب الظاهر — ErrorView فقط بلا أي قيمة.
        child: async.when(
          skipError: true,
          loading: () => const OrderDetailSkeleton(),
          error: (e, _) => ErrorView.from(
            e,
            onRetry: () => ref.invalidate(_provider),
            onRefresh: () => ref.refresh(_provider.future).then((_) {}, onError: (_) {}),
          ),
          data: (order) => RefreshIndicator(
            color: t.accent,
            // ينتظر النتيجة فعلاً؛ الفشل يُبقي القيمة السابقة ويظهر تنبيهاً من المستمع.
            onRefresh: () => ref.refresh(_provider.future).then((_) {}, onError: (_) {}),
            child: _buildOrder(order),
          ),
        ),
      ),
    );
  }

  Widget _buildOrder(AppOrder order) {
    final s = ref.s;
    final t = context.worldTheme;
    final whatsapp = (ref.watch(storeSettingsProvider)?.whatsapp ?? '').trim();
    final active = isOrderActive(order.status);
    final delivered = order.status == 'DELIVERED';
    final shippingLabel = order.isPickup ? s.branchPickup : s.shipping;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 24),
      children: [
        _OrderHero(order: order),
        const SizedBox(height: CartTheme.itemGap),
        if (orderAwaitsCardPayment(order)) ...[PayNowCard(order: order), const SizedBox(height: CartTheme.itemGap)],
        if (!isOrderClosedNegative(order.status))
          _DetailCard(
            icon: Icons.route_outlined,
            title: s.orderTracking,
            child: _Timeline(status: order.status, pickup: order.isPickup),
          )
        else
          _ClosedNotice(status: order.status),
        // وصل الطلب: أفضل لحظة لتقييم المنتجات.
        if (delivered && order.items.isNotEmpty) ...[
          const SizedBox(height: CartTheme.itemGap),
          _ReviewPrompt(items: order.items),
        ],
        const SizedBox(height: CartTheme.itemGap),
        _DetailCard(
          icon: Icons.shopping_bag_outlined,
          title: s.products,
          trailing: Text(s.itemCountLabel(order.items.length), style: AppText.caption.copyWith(color: t.inkMuted)),
          child: Column(
            children: [
              for (var i = 0; i < order.items.length; i++) ...[
                if (i > 0) Divider(height: 20, color: t.divider),
                _ItemRow(item: order.items[i]),
              ],
            ],
          ),
        ),
        if (order.address != null) ...[
          const SizedBox(height: CartTheme.itemGap),
          _DetailCard(
            icon: order.isPickup ? Icons.storefront_outlined : Icons.location_on_outlined,
            title: order.isPickup ? s.pickupContact : s.deliveryAddress,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoLine(icon: Icons.person_outline_rounded, text: order.address!.fullName, strong: true),
                const SizedBox(height: 8),
                _InfoLine(icon: Icons.phone_outlined, text: formatPhoneLocal(order.address!.phone), ltr: true),
                if (!order.isPickup) ...[
                  const SizedBox(height: 8),
                  _InfoLine(icon: Icons.home_outlined, text: order.address!.summaryFor(s.isAr)),
                ],
              ],
            ),
          ),
        ],
        if ((order.notes ?? '').trim().isNotEmpty) ...[
          const SizedBox(height: CartTheme.itemGap),
          _DetailCard(
            icon: Icons.sticky_note_2_outlined,
            title: s.orderNotes,
            child: Text(order.notes!.trim(), style: AppText.bodySmall.copyWith(color: t.inkSoft, height: 1.5)),
          ),
        ],
        if (order.isGift) ...[
          const SizedBox(height: CartTheme.itemGap),
          _DetailCard(
            icon: Icons.card_giftcard_rounded,
            title: s.orderGiftTitle,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoLine(
                  icon: Icons.favorite_border_rounded,
                  text: order.giftMessage != null ? '«${order.giftMessage}»' : s.orderGiftNoMessage,
                ),
                if (order.giftHidePrices) ...[
                  const SizedBox(height: 8),
                  _InfoLine(icon: Icons.visibility_off_outlined, text: s.orderGiftPricesHidden),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: CartTheme.itemGap),
        _DetailCard(
          icon: Icons.receipt_long_outlined,
          title: s.paymentSummary,
          child: Column(
            children: [
              _SumRow(label: s.subtotal, value: formatPrice(order.subtotal)),
              // توفير الباقات منفصل عن الكوبون — كما يحسبه السيرفر.
              if (order.packageDiscount > 0)
                _SumRow(
                  label: s.packageSavingsLabel,
                  value: '- ${formatPrice(order.packageDiscount)}',
                  valueColor: AppColors.success,
                ),
              if (order.couponDiscount > 0)
                _SumRow(
                  label: order.couponCode != null ? s.discountWithCode(order.couponCode!) : s.discount,
                  value: '- ${formatPrice(order.couponDiscount)}',
                  valueColor: AppColors.success,
                ),
              if (order.loyaltySpent > 0)
                _SumRow(
                  label: s.loyaltyPointsUsed(order.loyaltySpent),
                  value: '- ${formatPrice(order.loyaltyDiscount)}',
                  valueColor: AppColors.success,
                ),
              _SumRow(
                label: shippingLabel,
                value: order.shippingTotal == 0 ? s.free : formatPrice(order.shippingTotal),
                valueColor: order.shippingTotal == 0 ? AppColors.success : null,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Divider(height: 1, color: t.divider),
              ),
              Row(
                children: [
                  Expanded(
                    child: Text(s.total, style: AppText.title3.copyWith(color: t.ink)),
                  ),
                  Text(formatPrice(order.total), style: AppText.title2.copyWith(color: t.accentDark)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(color: t.accentLight, borderRadius: BorderRadius.circular(AppCorners.sm)),
                child: Column(
                  children: [
                    _InfoLine(
                      icon: order.paymentMethod == 'CARD' ? Icons.credit_card_rounded : Icons.payments_outlined,
                      text: paymentLineFor(s, order),
                    ),
                    if (order.loyaltyEarned > 0) ...[
                      const SizedBox(height: 8),
                      _InfoLine(
                        icon: Icons.stars_rounded,
                        iconColor: AppColors.star,
                        text: s.loyaltyPointsEarned(order.loyaltyEarned),
                        strong: true,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        ..._actions(order, whatsapp: whatsapp, active: active),
        const SizedBox(height: 6),
        Center(
          child: TextButton(
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.read(navIndexProvider.notifier).state = 0;
              context.go('/');
            },
            style: TextButton.styleFrom(foregroundColor: t.accentDark, minimumSize: const Size(0, kMinTapTarget)),
            child: Text(s.continueShopping, style: AppText.label),
          ),
        ),
      ],
    );
  }

  /// الأزرار حسب الحالة: في الطريق = التواصل أولاً (والإلغاء قبل التجهيز)، وبعد الانتهاء = إعادة الطلب.
  List<Widget> _actions(AppOrder order, {required String whatsapp, required bool active}) {
    final s = ref.s;
    final t = context.worldTheme;
    final hasContact = whatsapp.isNotEmpty;

    Widget contact({required bool primary}) {
      void open() {
        HapticFeedback.selectionClick();
        openWhatsApp(whatsapp, message: s.orderWhatsAppMessage(order.orderNumber));
      }

      return primary
          ? PrimaryPillButton(label: s.orderContactAbout, icon: Icons.chat_outlined, onTap: open)
          : SecondaryPillButton(label: s.orderContactAbout, icon: Icons.chat_outlined, onTap: open);
    }

    final reorderPrimary = PrimaryPillButton(
      label: s.reorder,
      icon: Icons.replay_rounded,
      loading: _reordering,
      onTap: _reordering ? null : () => _reorder(order),
    );

    if (!active) {
      return [
        reorderPrimary,
        if (hasContact) ...[const SizedBox(height: 10), contact(primary: false)],
      ];
    }

    return [
      if (hasContact) contact(primary: true),
      if (isOrderCancellable(order.status)) ...[
        if (hasContact) const SizedBox(height: 10),
        // أثناء الإلغاء: الزر لا يستقبل ضغطة ثانية (كانت ترسل إلغاءً مكرراً).
        AbsorbPointer(
          absorbing: _cancelling,
          child: SecondaryPillButton(
            label: _cancelling ? s.cancellingOrder : s.cancelOrder,
            icon: _cancelling ? Icons.hourglass_top_rounded : Icons.close_rounded,
            color: AppColors.sale,
            onTap: _cancel,
          ),
        ),
      ],
      const SizedBox(height: 6),
      // إعادة طلب ما طُلب للتو ليست الخطوة الأهم — رابط خفيف.
      Center(
        child: TextButton.icon(
          onPressed: _reordering ? null : () => _reorder(order),
          style: TextButton.styleFrom(foregroundColor: t.accentDark, minimumSize: const Size(0, kMinTapTarget)),
          icon: _reordering
              ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: t.accent))
              : const Icon(Icons.replay_rounded, size: 18),
          label: Text(s.reorder, style: AppText.label),
        ),
      ),
    ];
  }

  Future<void> _reorder(AppOrder order) async {
    if (_reordering || order.items.isEmpty) return;
    // كل ما نحتاجه قبل أي انتظار — الشاشة قد تُغلق أثناء التحميل.
    final s = ref.read(stringsProvider);
    final api = ref.read(apiServiceProvider);
    final cart = ref.read(cartProvider.notifier);
    final nav = ref.read(navIndexProvider.notifier);
    final router = GoRouter.of(context);
    final messenger = ScaffoldMessenger.of(context);
    HapticFeedback.mediumImpact();
    setState(() => _reordering = true);

    // كل المنتجات بالتوازي وبمخزون حديث (لا نسخة الكاش) — الفشل = غير متوفر.
    final products = await Future.wait(
      order.items.map(
        (i) => api.getProduct(i.productId, forceRefresh: true).then<Product?>((p) => p, onError: (_) => null),
      ),
    );

    var added = 0;
    for (var k = 0; k < order.items.length; k++) {
      final item = order.items[k];
      final p = products[k];
      if (p == null || !p.inStock) continue;
      ProductShade? shade;
      if (item.shadeId != null) {
        for (final sh in p.shades) {
          if (sh.id == item.shadeId) {
            shade = sh;
            break;
          }
        }
        // الدرجة اختفت أو نفدت: لا نضع درجة أخرى بدلاً منها.
        if (shade == null || !shade.inStock) continue;
      } else if (p.hasMultipleDisplayableShades) {
        // صار للمنتج درجات منذ الطلب — لا نخمّن أيها.
        continue;
      }
      final ok = cart.add(p, quantity: item.quantity, shade: p.shadeForCart(selected: shade));
      if (ok) added++;
    }

    final total = order.items.length;
    final skipped = total - added;
    if (mounted) setState(() => _reordering = false);
    if (added == 0) {
      if (mounted) AppSnackbar.error(context, skipped > 0 ? s.reorderNoneAvailable : s.reorderFailed);
      return;
    }
    void openCart() {
      nav.state = NavTabs.cart;
      router.go('/');
    }

    final message = skipped == 0 ? s.reorderAdded(added) : s.reorderPartial(added, total, skipped);
    if (mounted) {
      AppSnackbar.action(context, message: message, actionLabel: s.navCart, onAction: openCart);
    } else {
      messenger.showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(label: s.navCart, onPressed: openCart),
        ),
      );
    }
  }

  Future<void> _cancel() async {
    if (_cancelling) return;
    final s = ref.read(stringsProvider);
    final api = ref.read(apiServiceProvider);
    final auth = ref.read(authProvider.notifier);
    setState(() => _cancelling = true);

    // الحالة قد تغيّرت منذ فُتحت الصفحة (بدأ تجهيزه): نتحقق من السيرفر قبل السؤال.
    AppOrder fresh;
    try {
      _silent = true;
      fresh = await ref.refresh(_provider.future);
    } catch (e) {
      if (!mounted) return;
      setState(() => _cancelling = false);
      AppSnackbar.error(context, ref.friendly(e));
      return;
    }
    if (!mounted) return;
    setState(() => _cancelling = false);
    if (!isOrderCancellable(fresh.status)) {
      AppSnackbar.show(context, s.orderNoLongerCancellable, duration: const Duration(seconds: 4));
      return;
    }

    final ok = await _confirmCancel(fresh);
    if (ok != true || !mounted) return;
    setState(() => _cancelling = true);
    final refund = fresh.paymentMethod == 'CARD' && fresh.paymentStatus == 'PAID';
    try {
      await api.cancelOrder(widget.orderId);
      ref.invalidate(_provider);
      ref.invalidate(ordersProvider);
      ref.invalidate(loyaltyProvider);
      auth.refreshUser();
      if (mounted) AppSnackbar.success(context, refund ? s.orderCancelledRefundToast : s.orderCancelledToast);
    } on ApiException catch (e) {
      // 400 = لم يعد قابلاً للإلغاء (بدأ تجهيزه): نعرض الحالة الحالية مع السبب.
      if (e.status == 400) {
        _silent = true;
        ref.invalidate(_provider);
      }
      if (mounted) AppSnackbar.error(context, ref.friendly(e));
    } catch (e) {
      if (mounted) AppSnackbar.error(context, ref.friendly(e));
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  /// ورقة تأكيد الإلغاء: ما يحدث للنقاط والمبلغ المدفوع بالبطاقة، وزرّان بعرض كامل.
  Future<bool?> _confirmCancel(AppOrder order) {
    final s = ref.read(stringsProvider);
    final paidCard = order.paymentMethod == 'CARD' && order.paymentStatus == 'PAID';
    return showAppSheet<bool>(
      context: context,
      title: s.cancelOrder,
      builder: (ctx) {
        final t = ctx.worldTheme;
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CartTheme.iconBadge(ctx, Icons.cancel_outlined, color: AppColors.sale, size: 40),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(s.cancelOrderConfirm, style: AppText.body.copyWith(color: t.ink, height: 1.5)),
                  ),
                ],
              ),
              if (order.loyaltySpent > 0) ...[
                const SizedBox(height: 12),
                _InfoLine(
                  icon: Icons.stars_rounded,
                  iconColor: AppColors.star,
                  text: s.cancelOrderPointsBack(order.loyaltySpent),
                ),
              ],
              if (paidCard) ...[
                const SizedBox(height: 10),
                _InfoLine(
                  icon: Icons.credit_card_rounded,
                  text: s.cancelOrderCardRefund(formatPrice(order.total)),
                  strong: true,
                ),
              ],
            ],
          ),
        );
      },
      footer: Builder(
        builder: (ctx) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            PrimaryPillButton(label: s.goBack, onTap: () => Navigator.pop(ctx, false)),
            const SizedBox(height: 10),
            SecondaryPillButton(
              label: s.cancelOrderYes,
              icon: Icons.close_rounded,
              color: AppColors.sale,
              onTap: () {
                HapticFeedback.mediumImpact();
                Navigator.pop(ctx, true);
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// تكبير خط النظام حتى 1.6 لهذه الصفحة — سقف التطبيق العام (1.25) مطبّق فوقنا،
/// فنعود لقيمة النظام الأصلية ثم نحدّها.
class _ReadableTextScale extends StatelessWidget {
  final Widget child;
  const _ReadableTextScale({required this.child});

  @override
  Widget build(BuildContext context) {
    final system = MediaQueryData.fromView(View.of(context)).textScaler;
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: system),
      child: MediaQuery.withClampedTextScaling(minScaleFactor: 0.85, maxScaleFactor: 1.6, child: child),
    );
  }
}

/// «وصلكِ الطلب — شنو رأيكِ؟» — حتى 3 منتجات، لكل منها «قيّميه» إلى تقييماته.
class _ReviewPrompt extends ConsumerWidget {
  final List<OrderItem> items;
  const _ReviewPrompt({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    // منتج واحد لكل سطر حتى لو طُلبت منه درجتان.
    final seen = <String>{};
    final picks = [
      for (final i in items)
        if (i.productId.isNotEmpty && seen.add(i.productId)) i,
    ].take(3).toList();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: CartTheme.cardDecoration(context).copyWith(
        gradient: LinearGradient(
          begin: AlignmentDirectional.topStart.resolve(Directionality.of(context)),
          end: AlignmentDirectional.bottomEnd.resolve(Directionality.of(context)),
          colors: [Color.alphaBlend(AppColors.star.withValues(alpha: 0.10), t.surface), t.surface],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              CartTheme.iconBadge(context, Icons.star_rounded, color: AppColors.star, size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.reviewPromptTitle, style: AppText.title3.copyWith(color: t.ink)),
                    const SizedBox(height: 2),
                    Text(s.reviewPromptSubtitle, style: AppText.caption.copyWith(color: t.inkMuted)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final item in picks)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: t.accentLight,
                      borderRadius: BorderRadius.circular(AppCorners.sm),
                      border: Border.all(color: t.accentSoft),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppCorners.sm - 1),
                      child: item.imageUrl.isNotEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(3),
                              child: ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain),
                            )
                          : Icon(Icons.spa_outlined, color: t.accent, size: 20),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item.productName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: t.ink, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 8),
                  AppChoiceChip(
                    label: s.rateIt,
                    icon: Icons.star_outline_rounded,
                    selected: false,
                    onTap: () => context.push('/product/${item.productId}?tab=reviews'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// بطاقة قسم موحّدة لتفاصيل الطلب.
class _DetailCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget? trailing;
  final Widget child;

  const _DetailCard({required this.icon, required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: CartTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              CartTheme.iconBadge(context, icon, size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title3.copyWith(color: t.ink),
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _OrderHero extends ConsumerWidget {
  final AppOrder order;
  const _OrderHero({required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: CartTheme.cardDecoration(context).copyWith(
        gradient: LinearGradient(
          begin: AlignmentDirectional.topStart.resolve(Directionality.of(context)),
          end: AlignmentDirectional.bottomEnd.resolve(Directionality.of(context)),
          colors: [t.accentSoft, t.surface],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.orderNumberCaption, style: AppText.caption.copyWith(color: t.inkMuted)),
                    const SizedBox(height: 2),
                    // الرقم نفسه زر نسخ — للتواصل مع خدمة العملاء أو تتبّع الشحنة.
                    Semantics(
                      button: true,
                      label: s.copyOrderNumber,
                      // شفاف: حبر الضغطة يظهر فوق تدرّج البطاقة لا تحته.
                      child: Material(
                        type: MaterialType.transparency,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(AppCorners.sm),
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: order.orderNumber));
                            HapticFeedback.selectionClick();
                            AppSnackbar.success(context, s.orderNumberCopied);
                          },
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(minHeight: kMinTapTarget),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    '#${order.orderNumber}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    textDirection: TextDirection.ltr,
                                    style: AppText.title1.copyWith(color: t.ink, letterSpacing: 0.4),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Icon(Icons.copy_rounded, size: 16, color: t.inkMuted),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              OrderStatusChip(status: order.status),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 16,
            runSpacing: 6,
            children: [
              _InfoLine(
                icon: Icons.event_outlined,
                text: formatDateTime(order.createdAt, lang: s.lang),
                compact: true,
              ),
              _InfoLine(icon: Icons.shopping_bag_outlined, text: s.itemCountLabel(order.itemCount), compact: true),
              _InfoLine(icon: Icons.payments_outlined, text: formatPrice(order.total), compact: true, strong: true),
            ],
          ),
        ],
      ),
    );
  }
}

class _ClosedNotice extends ConsumerWidget {
  final String status;
  const _ClosedNotice({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color.alphaBlend(AppColors.sale.withValues(alpha: 0.06), t.surface),
        borderRadius: BorderRadius.circular(CartTheme.radiusLg),
        border: Border.all(color: AppColors.sale.withValues(alpha: 0.22)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CartTheme.iconBadge(context, orderStatusIcon(status), color: AppColors.sale, size: 36),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.orderStatus(status), style: AppText.title3.copyWith(color: AppColors.sale)),
                const SizedBox(height: 2),
                Text(switch (status) {
                  'REFUNDED' || 'RETURNED' => s.orderRefundedNote,
                  _ => s.orderCancelledNote,
                }, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// خط زمني عمودي واضح لمراحل الطلب.
class _Timeline extends ConsumerWidget {
  final String status;

  /// استلام من الفرع: خطوة الشحن تصبح «جاهز للاستلام» بلا مندوب.
  final bool pickup;
  const _Timeline({required this.status, this.pickup = false});

  String _title(AppStrings s, String step) => switch (step) {
    'SHIPPED' when pickup => s.orderPickupReadyTitle,
    'DELIVERED' when pickup => s.orderPickedUpTitle,
    _ => s.orderStepTitle(step),
  };

  String _hint(AppStrings s, String step) =>
      step == 'SHIPPED' && pickup ? s.orderPickupReadyHint : s.orderStepHint(step);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final current = orderStatusFlow.indexOf(status).clamp(0, orderStatusFlow.length - 1);
    final delivered = status == 'DELIVERED';

    return Column(
      children: [
        for (var i = 0; i < orderStatusFlow.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: 32,
                  child: Column(
                    children: [
                      _Node(
                        icon: orderStatusIcon(orderStatusFlow[i]),
                        done: i < current || (delivered && i == current),
                        active: i == current && !delivered,
                      ),
                      if (i < orderStatusFlow.length - 1)
                        Expanded(
                          child: Container(
                            width: 2,
                            margin: const EdgeInsets.symmetric(vertical: 3),
                            decoration: BoxDecoration(
                              color: i < current ? t.accent : t.accentSoft,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: EdgeInsetsDirectional.only(top: 5, bottom: i < orderStatusFlow.length - 1 ? 18 : 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                _title(s, orderStatusFlow[i]),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.label.copyWith(
                                  color: i <= current ? t.ink : t.inkMuted,
                                  fontWeight: i == current ? FontWeight.w800 : FontWeight.w600,
                                ),
                              ),
                            ),
                            if (i == current && !delivered) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: t.accent,
                                  borderRadius: BorderRadius.circular(AppCorners.pill),
                                ),
                                child: Text(s.currentStep, style: AppText.micro.copyWith(color: Colors.white)),
                              ),
                            ],
                          ],
                        ),
                        if (i <= current) ...[
                          const SizedBox(height: 2),
                          Text(
                            _hint(s, orderStatusFlow[i]),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.caption.copyWith(color: t.inkMuted),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Node extends StatelessWidget {
  final IconData icon;
  final bool done;
  final bool active;
  const _Node({required this.icon, required this.done, required this.active});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final filled = done || active;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        gradient: filled ? t.primaryGradient : null,
        color: filled ? null : t.surface,
        shape: BoxShape.circle,
        border: filled ? null : Border.all(color: t.hairline, width: 1.5),
        boxShadow: active
            ? [BoxShadow(color: t.accent.withValues(alpha: 0.35), blurRadius: 10, spreadRadius: 1)]
            : null,
      ),
      child: Icon(done ? Icons.check_rounded : icon, size: done ? 18 : 16, color: filled ? Colors.white : t.inkMuted),
    );
  }
}

class _InfoLine extends StatelessWidget {
  final IconData icon;
  final String text;
  final bool strong;
  final bool ltr;
  final bool compact;
  final Color? iconColor;

  const _InfoLine({
    required this.icon,
    required this.text,
    this.strong = false,
    this.ltr = false,
    this.compact = false,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final label = Text(
      text,
      textDirection: ltr ? TextDirection.ltr : null,
      style: (compact ? AppText.caption : AppText.bodySmall).copyWith(
        color: strong ? t.ink : t.inkSoft,
        fontWeight: strong ? FontWeight.w700 : FontWeight.w500,
      ),
    );
    return Row(
      mainAxisSize: compact ? MainAxisSize.min : MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.only(top: 2),
          child: Icon(icon, size: compact ? 15 : 17, color: iconColor ?? t.accent),
        ),
        const SizedBox(width: 6),
        if (compact) Flexible(child: label) else Expanded(child: label),
      ],
    );
  }
}

class _SumRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _SumRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.bodySmall.copyWith(color: t.inkSoft),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: AppText.bodySmall.copyWith(color: valueColor ?? t.ink, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _ItemRow extends ConsumerWidget {
  final OrderItem item;
  const _ItemRow({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          context.push('/product/${item.productId}');
        },
        borderRadius: BorderRadius.circular(AppCorners.sm),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: t.accentLight,
                  borderRadius: BorderRadius.circular(AppCorners.sm),
                  border: Border.all(color: t.accentSoft),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppCorners.sm - 1),
                  child: item.imageUrl.isNotEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(4),
                          child: ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain),
                        )
                      : Icon(Icons.spa_outlined, color: t.accent),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.productName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodySmall.copyWith(color: t.ink, fontWeight: FontWeight.w600, height: 1.4),
                    ),
                    if (item.shadeName != null) ...[
                      const SizedBox(height: 4),
                      _ShadeLine(name: item.shadeName!, hex: item.shadeHex),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      item.unitPrice > 0
                          ? s.qtyTimesPrice(item.quantity, formatPrice(item.unitPrice))
                          : '${s.quantityLabel}: ${item.quantity}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: t.inkMuted),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(formatPrice(item.totalPrice), style: AppText.label.copyWith(color: t.ink)),
            ],
          ),
        ),
      ),
    );
  }
}

/// الدرجة المطلوبة تحت اسم المنتج: دائرة بلونها واسمها.
class _ShadeLine extends StatelessWidget {
  final String name;
  final String? hex;
  const _ShadeLine({required this.name, this.hex});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: shadeSwatchColor(hex, fallback: t.accentSoft),
            shape: BoxShape.circle,
            border: Border.all(color: t.hairline),
          ),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
