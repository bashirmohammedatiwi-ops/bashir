import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/order_detail_skeleton.dart';
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
import '../profile/profile_providers.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import 'order_strings.dart';
import 'widgets/order_status.dart';

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final async = ref.watch(orderDetailProvider(orderId));
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
      body: async.when(
        loading: () => const OrderDetailSkeleton(),
        error: (e, _) => ErrorView.from(e, onRetry: () => ref.invalidate(orderDetailProvider(orderId))),
        data: (order) => RefreshIndicator(
          color: t.accent,
          onRefresh: () async => ref.invalidate(orderDetailProvider(orderId)),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 24),
            children: [
              _OrderHero(order: order),
              const SizedBox(height: CartTheme.itemGap),
              if (!isOrderClosedNegative(order.status))
                _DetailCard(
                  icon: Icons.route_outlined,
                  title: s.orderTracking,
                  child: _Timeline(status: order.status),
                )
              else
                _ClosedNotice(status: order.status),
              const SizedBox(height: CartTheme.itemGap),
              _DetailCard(
                icon: Icons.shopping_bag_outlined,
                title: s.products,
                trailing: Text(
                  s.itemCountLabel(order.items.length),
                  style: AppText.caption.copyWith(color: t.inkMuted),
                ),
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
                  icon: Icons.location_on_outlined,
                  title: s.deliveryAddress,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _InfoLine(icon: Icons.person_outline_rounded, text: order.address!.fullName, strong: true),
                      const SizedBox(height: 8),
                      _InfoLine(icon: Icons.phone_outlined, text: order.address!.phone, ltr: true),
                      const SizedBox(height: 8),
                      _InfoLine(icon: Icons.home_outlined, text: order.address!.summary),
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
                    if (order.discountTotal > 0)
                      _SumRow(
                        label: s.discount,
                        value: '- ${formatPrice(order.discountTotal)}',
                        valueColor: AppColors.success,
                      ),
                    if (order.loyaltySpent > 0)
                      _SumRow(
                        label: s.loyaltyPointsUsed(order.loyaltySpent),
                        value: '- ${formatPrice((order.loyaltySpent ~/ 100) * 1000)}',
                        valueColor: AppColors.success,
                      ),
                    _SumRow(
                      label: s.shipping,
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
                      decoration: BoxDecoration(
                        color: t.accentLight,
                        borderRadius: BorderRadius.circular(AppCorners.sm),
                      ),
                      child: Column(
                        children: [
                          _InfoLine(icon: Icons.payments_outlined, text: s.cashOnDelivery),
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
              PrimaryPillButton(
                label: s.reorder,
                icon: Icons.replay_rounded,
                onTap: () => _reorder(context, ref, order),
              ),
              if (order.status == 'PENDING' || order.status == 'CONFIRMED') ...[
                const SizedBox(height: 10),
                SecondaryPillButton(
                  label: s.cancelOrder,
                  icon: Icons.close_rounded,
                  color: AppColors.sale,
                  onTap: () => _cancel(context, ref),
                ),
              ],
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
          ),
        ),
      ),
    );
  }

  Future<void> _reorder(BuildContext context, WidgetRef ref, AppOrder order) async {
    final strings = ref.read(stringsProvider);
    HapticFeedback.mediumImpact();
    AppSnackbar.show(context, strings.addingToCart, duration: const Duration(seconds: 4));
    final api = ref.read(apiServiceProvider);
    var added = 0;
    for (final item in order.items) {
      try {
        final product = await api.getProduct(item.productId);
        ProductShade? shade;
        if (item.shadeId != null) {
          for (final s in product.shades) {
            if (s.id == item.shadeId) {
              shade = s;
              break;
            }
          }
        }
        ref.read(cartProvider.notifier).add(product, quantity: item.quantity, shade: shade);
        added++;
      } catch (_) {}
    }
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    if (added == 0) {
      AppSnackbar.error(context, strings.reorderFailed);
      return;
    }
    AppSnackbar.action(
      context,
      message: strings.reorderAdded(added),
      actionLabel: strings.navCart,
      onAction: () {
        ref.read(navIndexProvider.notifier).state = NavTabs.cart;
        context.go('/');
      },
    );
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final s = ref.read(stringsProvider);
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppCorners.lg)),
        icon: const Icon(Icons.cancel_outlined, color: AppColors.sale),
        title: Text(s.cancelOrder),
        content: Text(s.cancelOrderConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.goBack)),
          TextButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.pop(context, true);
            },
            child: Text(s.cancelOrder, style: AppText.label.copyWith(color: AppColors.sale)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiServiceProvider).cancelOrder(orderId);
      ref.invalidate(orderDetailProvider(orderId));
      ref.invalidate(ordersProvider);
      ref.invalidate(loyaltyProvider);
      ref.read(authProvider.notifier).refreshUser();
      if (context.mounted) AppSnackbar.success(context, s.orderCancelledToast);
    } catch (e) {
      if (context.mounted) AppSnackbar.error(context, friendlyError(e));
    }
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
                    Text(
                      '#${order.orderNumber}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.ltr,
                      style: AppText.title1.copyWith(color: t.ink, letterSpacing: 0.4),
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
              _InfoLine(icon: Icons.event_outlined, text: formatDateTime(order.createdAt), compact: true),
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
                Text(
                  status == 'CANCELLED' ? s.orderCancelledNote : s.orderReturnedNote,
                  style: AppText.bodySmall.copyWith(color: t.inkSoft),
                ),
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
  const _Timeline({required this.status});

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
                    padding: EdgeInsets.only(top: 5, bottom: i < orderStatusFlow.length - 1 ? 18 : 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                s.orderStepTitle(orderStatusFlow[i]),
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
                            s.orderStepHint(orderStatusFlow[i]),
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
          padding: const EdgeInsets.only(top: 2),
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
