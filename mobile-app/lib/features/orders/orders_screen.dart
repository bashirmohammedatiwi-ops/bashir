import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/order.dart';
import '../../data/services/api_service.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/ui/ui.dart';
import '../cart/widgets/cart_theme.dart';
import '../cart/widgets/pill_buttons.dart';
import '../shell/main_shell.dart';
import '../payments/pay_now_card.dart';
import '../worlds/world_theme.dart';
import 'order_strings.dart';
import 'widgets/order_status.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  final _scroll = ScrollController();
  final _items = <AppOrder>[];
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;
  bool _firstLoad = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
    _scroll.addListener(() {
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
        _fetch();
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _fetch({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _items.clear();
      _firstLoad = true;
      _error = null;
    }
    if (!_hasMore) return;
    setState(() => _loading = true);
    try {
      final result = await ref.read(apiServiceProvider).getOrders(page: _page, limit: AppConfig.pageSize);
      setState(() {
        _items.addAll(result.items);
        _hasMore = result.hasNext;
        _page++;
        _firstLoad = false;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    return AuthGate(
      title: s.myOrders,
      emptyTitle: s.loginToViewOrders,
      child: Scaffold(
        backgroundColor: t.canvas,
        appBar: AppBar(
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: AppBackButton()),
          ),
          leadingWidth: 60,
          titleSpacing: 4,
          title: Text(s.myOrders, style: AppText.title1.copyWith(color: t.ink)),
          backgroundColor: t.canvas,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    final s = ref.s;
    final t = context.worldTheme;
    if (_firstLoad && _loading) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 16),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: CartTheme.itemGap),
        itemBuilder: (_, __) => const ShimmerBox(height: 132, radius: AppCorners.lg),
      );
    }
    if (_error != null && _items.isEmpty) {
      return ErrorView(message: friendlyError(_error!), onRetry: () => _fetch(reset: true));
    }
    if (_items.isEmpty) {
      return EmptyState(
        icon: Icons.receipt_long_outlined,
        title: s.noOrdersTitle,
        subtitle: s.noOrdersSubtitle,
        action: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 260),
          child: PrimaryPillButton(
            label: s.startShopping,
            icon: Icons.storefront_outlined,
            onTap: () {
              ref.read(navIndexProvider.notifier).state = 0;
              context.go('/');
            },
          ),
        ),
      );
    }
    return RefreshIndicator(
      color: t.accent,
      onRefresh: () => _fetch(reset: true),
      child: ListView.separated(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 24),
        itemCount: _items.length + (_hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: CartTheme.itemGap),
        itemBuilder: (_, i) {
          if (i >= _items.length) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: t.accent, strokeWidth: 2.4),
                ),
              ),
            );
          }
          return _OrderCard(order: _items[i]);
        },
      ),
    );
  }
}

class _OrderCard extends ConsumerWidget {
  final AppOrder order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final closed = isOrderClosedNegative(order.status);
    final thumbs = order.items.where((e) => e.imageUrl.isNotEmpty).take(3).toList();

    return DecoratedBox(
      decoration: CartTheme.cardDecoration(context),
      child: Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(CartTheme.radiusLg),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          context.push('/orders/${order.id}');
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  CartTheme.iconBadge(
                    context,
                    orderStatusIcon(order.status),
                    color: orderStatusColor(context, order.status),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '#${order.orderNumber}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textDirection: TextDirection.ltr,
                          style: AppText.title3.copyWith(color: t.ink),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatDateTime(order.createdAt),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: t.inkMuted),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  OrderStatusChip(status: order.status),
                ],
              ),
              if (!closed) ...[const SizedBox(height: 14), OrderProgressBar(status: order.status)],
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1, color: t.divider),
              ),
              Row(
                children: [
                  if (thumbs.isNotEmpty) ...[
                    _ThumbStack(urls: thumbs.map((e) => e.imageUrl).toList()),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // اسم أول منتج: تعرف الطلب من نظرة بدل رقمه فقط.
                        if (order.items.isNotEmpty)
                          Text(
                            order.items.first.productName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.caption.copyWith(color: t.ink, fontWeight: FontWeight.w700),
                          ),
                        Text(
                          order.items.length > 1
                              ? (s.isAr
                                  ? switch (order.items.length - 1) {
                                      1 => 'ومنتج آخر',
                                      2 => 'ومنتجان آخران',
                                      final n => 'و$n منتجات أخرى',
                                    }
                                  : '+ ${order.items.length - 1} more')
                              : s.itemCountLabel(order.itemCount),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: t.inkSoft),
                        ),
                        if (order.paymentMethod == 'CARD') ...[
                          const SizedBox(height: 4),
                          CardPaymentPill(order: order),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(order.totalLabel, style: AppText.price.copyWith(color: t.ink)),
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right_rounded, color: t.inkMuted, size: 22),
                ],
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

class _ThumbStack extends StatelessWidget {
  final List<String> urls;
  const _ThumbStack({required this.urls});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    const size = 34.0;
    const step = 22.0;
    return SizedBox(
      width: size + step * (urls.length - 1),
      height: size,
      child: Stack(
        children: [
          for (var i = 0; i < urls.length; i++)
            PositionedDirectional(
              start: i * step,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  color: t.accentLight,
                  shape: BoxShape.circle,
                  border: Border.all(color: t.surface, width: 2),
                ),
                child: ClipOval(
                  child: Padding(
                    padding: const EdgeInsets.all(3),
                    child: ProductCoverImage(url: urls[i], fit: BoxFit.contain),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
