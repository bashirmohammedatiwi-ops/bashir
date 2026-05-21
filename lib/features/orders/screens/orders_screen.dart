import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/mock/mock_orders.dart';
import '../../../data/models/order_model.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
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

  List<OrderModel> _filter(int tab) {
    final orders = MockOrders.all;
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
      body: TabBarView(
        controller: _tabController,
        children: List.generate(4, (tab) {
          final orders = _filter(tab);
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
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
    );
  }
}
