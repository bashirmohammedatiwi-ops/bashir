import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/states.dart';
import '../../data/models/order.dart';
import '../profile/profile_providers.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('طلباتي')),
      body: orders.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) =>
            ErrorView(message: e.toString(), onRetry: () => ref.invalidate(ordersProvider)),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
                icon: Icons.receipt_long_outlined,
                title: 'لا توجد طلبات بعد',
                subtitle: 'ستظهر طلباتك هنا بعد الشراء');
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(ordersProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _OrderCard(order: list[i]),
            ),
          );
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
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('#${order.orderNumber}',
                    style: const TextStyle(fontWeight: FontWeight.w800)),
                const Spacer(),
                _StatusChip(status: order.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(formatDateTime(order.createdAt),
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            const Divider(height: 18),
            Row(
              children: [
                Text('${order.itemCount} منتج',
                    style: const TextStyle(color: AppColors.textSecondary)),
                const Spacer(),
                Text(order.totalLabel,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 16)),
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
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(orderStatusLabel(status),
          style: TextStyle(color: _color, fontSize: 12, fontWeight: FontWeight.w700)),
    );
  }
}
