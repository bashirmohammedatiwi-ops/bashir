import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/order.dart';
import '../../data/services/api_service.dart';

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
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthGate(
      title: 'طلباتي',
      emptyTitle: 'سجّل الدخول لعرض طلباتك',
      child: Scaffold(
        backgroundColor: AppColors.scaffold,
        appBar: AppBar(title: const Text('طلباتي'), elevation: 0),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_firstLoad && _loading) {
      return ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.md),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm + 2),
        itemBuilder: (_, __) => const ShimmerBox(height: 110, radius: AppRadius.lg),
      );
    }
    if (_items.isEmpty) {
      return const EmptyState(
          icon: Icons.receipt_long_outlined,
          title: 'لا توجد طلبات بعد',
          subtitle: 'ستظهر طلباتك هنا بعد الشراء');
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => _fetch(reset: true),
      child: ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: _items.length + (_hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm + 2),
        itemBuilder: (_, i) {
          if (i >= _items.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            );
          }
          return _OrderCard(order: _items[i]);
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final AppOrder order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/orders/${order.id}'),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md + 2),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('#${order.orderNumber}', style: AppTypography.body.copyWith(fontWeight: FontWeight.w800)),
                const Spacer(),
                _StatusChip(status: order.status),
              ],
            ),
            const SizedBox(height: AppSpacing.xs + 2),
            Text(formatDateTime(order.createdAt), style: AppTypography.caption),
            const Divider(height: AppSpacing.lg + 2),
            Row(
              children: [
                Text('${order.itemCount} منتج', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                const Spacer(),
                Text(order.totalLabel, style: AppTypography.price.copyWith(fontSize: 16)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  Color get _color => switch (status) {
        'DELIVERED' => AppColors.success,
        'CANCELLED' || 'RETURNED' => AppColors.sale,
        'SHIPPED' || 'PROCESSING' => AppColors.warning,
        _ => AppColors.primary,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(orderStatusLabel(status),
          style: TextStyle(color: _color, fontSize: 12, fontWeight: FontWeight.w700)),
    );
  }
}
