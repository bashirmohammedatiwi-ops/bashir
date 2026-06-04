import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/order_model.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return orderAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: const Text('تفاصيل الطلب')),
        body: const Center(child: Text('تعذر تحميل الطلب')),
      ),
      data: (order) {
        if (order == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('تفاصيل الطلب')),
            body: const Center(child: Text('الطلب غير موجود')),
          );
        }
        return Scaffold(
          appBar: AppBar(title: Text(order.orderNumber)),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(order.status.label, style: AppTextStyles.title()),
              Text(order.address.fullAddress, style: AppTextStyles.body()),
              const SizedBox(height: 16),
              ...order.items.map(
                (item) => ListTile(
                  title: Text(item.product.name),
                  subtitle: Text('× ${item.quantity}'),
                  trailing: Text(CurrencyFormatter.format(item.totalPrice)),
                ),
              ),
              const Divider(),
              ListTile(
                title: const Text('المجموع'),
                trailing: Text(
                  CurrencyFormatter.format(order.total),
                  style: AppTextStyles.title(color: AppColors.primary),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
