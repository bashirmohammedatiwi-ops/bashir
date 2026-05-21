import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../data/mock/mock_orders.dart';
import '../../../data/models/order_model.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    final order = MockOrders.findById(orderId);
    if (order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('الطلب غير موجود')),
      );
    }

    final steps = [
      ('تم الطلب', true),
      ('تأكيد', order.status.index >= 1),
      ('شحن', order.status.index >= 2),
      ('توصيل', order.status == OrderStatus.delivered),
    ];

    return Scaffold(
      appBar: AppBar(title: Text('#${order.orderNumber}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: steps.map((step) {
              return Column(
                children: [
                  Icon(
                    step.$2 ? Icons.check_circle : Icons.circle_outlined,
                    color: step.$2 ? AppColors.success : AppColors.divider,
                  ),
                  const SizedBox(height: 4),
                  Text(step.$1, style: AppTextStyles.caption(size: 10)),
                ],
              );
            }).toList(),
          ).animate().fadeIn(),
          const SizedBox(height: 24),
          Text('المنتجات', style: AppTextStyles.headline()),
          ...order.items.map((item) => ListTile(
                leading: Text('x${item.quantity}'),
                title: Text(item.product.name),
                trailing: Text(CurrencyFormatter.format(item.totalPrice)),
              )),
          const Divider(),
          Text('العنوان', style: AppTextStyles.headline()),
          Text(order.address.fullAddress, style: AppTextStyles.body()),
          const SizedBox(height: 16),
          _row('المجموع', order.subtotal),
          _row('الخصم', -order.discount),
          _row('التوصيل', order.shipping),
          _row('الإجمالي', order.total, bold: true),
          const SizedBox(height: 24),
          CustomButton(
            label: 'إعادة الطلب',
            onPressed: () {},
          ),
          if (order.status == OrderStatus.pending) ...[
            const SizedBox(height: 12),
            CustomOutlineButton(
              label: 'إلغاء الطلب',
              onPressed: () {},
            ),
          ],
        ],
      ),
    );
  }

  Widget _row(String label, int amount, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: bold ? AppTextStyles.title() : AppTextStyles.body()),
          Text(CurrencyFormatter.format(amount.abs())),
        ],
      ),
    );
  }
}
