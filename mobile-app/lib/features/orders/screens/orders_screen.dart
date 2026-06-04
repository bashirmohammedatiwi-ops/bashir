import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/order_model.dart';
import '../providers/orders_provider.dart';

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
    final ordersAsync = ref.watch(ordersListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('طلباتي'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'الكل'),
            Tab(text: 'جارية'),
            Tab(text: 'مكتملة'),
            Tab(text: 'ملغاة'),
          ],
        ),
      ),
      body: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('تعذر تحميل الطلبات')),
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
                  child: ListTile(
                    title: Text(order.orderNumber),
                    subtitle: Text(order.status.label),
                    trailing: Text(
                      CurrencyFormatter.format(order.total),
                      style: AppTextStyles.title(color: _statusColor(order.status)),
                    ),
                    onTap: () => context.push('/orders/${order.id}'),
                  ),
                ).animate().fadeIn(delay: (50 * index).ms);
              },
            );
          }),
        ),
      ),
    );
  }
}
