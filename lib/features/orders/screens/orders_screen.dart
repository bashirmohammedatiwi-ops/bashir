import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/order_model.dart';
import '../../checkout/providers/checkout_provider.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<OrderModel> _filter(List<OrderModel> orders, int tab) {
    return switch (tab) {
      0 => orders,
      1 => orders
          .where((o) =>
              o.status == OrderStatus.pending ||
              o.status == OrderStatus.processing ||
              o.status == OrderStatus.shipped)
          .toList(),
      2 => orders.where((o) => o.status == OrderStatus.delivered).toList(),
      _ => orders.where((o) => o.status == OrderStatus.cancelled).toList(),
    };
  }

  Color _statusColor(OrderStatus status) => switch (status) {
        OrderStatus.pending => AppColors.gold,
        OrderStatus.processing => Colors.blue,
        OrderStatus.shipped => AppColors.primary,
        OrderStatus.delivered => AppColors.success,
        OrderStatus.cancelled => AppColors.error,
      };

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('طلباتي'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'الكل'),
            Tab(text: 'جاري'),
            Tab(text: 'تم التوصيل'),
            Tab(text: 'ملغي'),
          ],
        ),
      ),
      body: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: TextButton(
            onPressed: () => ref.invalidate(ordersProvider),
            child: const Text('إعادة المحاولة'),
          ),
        ),
        data: (orders) => TabBarView(
          controller: _tabController,
          children: List.generate(4, (tab) {
            final filtered = _filter(orders, tab);
            if (filtered.isEmpty) {
              return const Center(child: Text('لا توجد طلبات'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final order = filtered[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    onTap: () => context.push('/orders/${order.id}'),
                    title: Text('#${order.orderNumber}'),
                    subtitle: Text(
                      '${order.itemCount} منتج • ${CurrencyFormatter.format(order.total)}',
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(order.status).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        order.status.label,
                        style: AppTextStyles.caption(
                          color: _statusColor(order.status),
                          size: 11,
                        ),
                      ),
                    ),
                  ),
                ).animate().fadeIn(
                      delay: Duration(milliseconds: index * 50),
                    );
              },
            );
          }),
        ),
      ),
    );
  }
}
