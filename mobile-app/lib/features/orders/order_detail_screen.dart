import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../../data/models/order.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../cart/cart_provider.dart';
import '../profile/profile_providers.dart';
import '../shell/main_shell.dart';

const _statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(orderDetailProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('تفاصيل الطلب')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => ErrorView(
            message: e.toString(), onRetry: () => ref.invalidate(orderDetailProvider(orderId))),
        data: (order) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Text('#${order.orderNumber}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                const Spacer(),
                Text(formatDate(order.createdAt),
                    style: const TextStyle(color: AppColors.textMuted)),
              ],
            ),
            const SizedBox(height: 16),
            if (order.status != 'CANCELLED' && order.status != 'RETURNED')
              _Tracker(status: order.status)
            else
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                    color: AppColors.sale.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  const Icon(Icons.info_outline, color: AppColors.sale),
                  const SizedBox(width: 8),
                  Text(orderStatusLabel(order.status),
                      style: const TextStyle(color: AppColors.sale, fontWeight: FontWeight.w700)),
                ]),
              ),
            const SizedBox(height: 20),
            _card(
              title: 'المنتجات',
              child: Column(
                children: [for (final item in order.items) _ItemRow(item: item)],
              ),
            ),
            const SizedBox(height: 12),
            if (order.address != null)
              _card(
                title: 'عنوان التوصيل',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.address!.fullName,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(order.address!.phone,
                        style: const TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 2),
                    Text(order.address!.summary,
                        style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            _card(
              title: 'ملخّص الدفع',
              child: Column(
                children: [
                  _row('المجموع الفرعي', formatPrice(order.subtotal)),
                  if (order.discountTotal > 0)
                    _row('الخصم', '- ${formatPrice(order.discountTotal)}',
                        color: AppColors.success),
                  _row('الشحن',
                      order.shippingTotal == 0 ? 'مجاني' : formatPrice(order.shippingTotal)),
                  const Divider(height: 18),
                  _row('الإجمالي', formatPrice(order.total), bold: true),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.payments_outlined, size: 18, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    const Text('الدفع عند الاستلام',
                        style: TextStyle(color: AppColors.textSecondary)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _reorder(context, ref, order),
                icon: const Icon(Icons.replay_rounded),
                label: const Text('إعادة الطلب'),
              ),
            ),
            if (order.status == 'PENDING' || order.status == 'CONFIRMED') ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _cancel(context, ref),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.sale,
                  side: const BorderSide(color: AppColors.sale),
                ),
                icon: const Icon(Icons.close),
                label: const Text('إلغاء الطلب'),
              ),
            ],
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  ref.read(navIndexProvider.notifier).state = 0;
                  context.go('/');
                },
                child: const Text('متابعة التسوّق'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _reorder(BuildContext context, WidgetRef ref, AppOrder order) async {
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(
      const SnackBar(content: Text('جاري إضافة المنتجات إلى السلة…')),
    );
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
    messenger.hideCurrentSnackBar();
    if (added == 0) {
      messenger.showSnackBar(
        const SnackBar(content: Text('تعذّر إضافة المنتجات. حاول لاحقاً')),
      );
      return;
    }
    messenger.showSnackBar(
      SnackBar(
        content: Text('تمت إضافة $added منتج إلى السلة'),
        action: SnackBarAction(
          label: 'السلة',
          onPressed: () {
            ref.read(navIndexProvider.notifier).state = 3;
            context.go('/');
          },
        ),
      ),
    );
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('إلغاء الطلب'),
        content: const Text('هل أنت متأكد من إلغاء هذا الطلب؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('تراجع')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('إلغاء الطلب', style: TextStyle(color: AppColors.sale))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiServiceProvider).cancelOrder(orderId);
      ref.invalidate(orderDetailProvider(orderId));
      ref.invalidate(ordersProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Widget _card({required String title, required Widget child}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            child,
          ],
        ),
      );

  Widget _row(String label, String value, {bool bold = false, Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Text(label, style: const TextStyle(color: AppColors.textSecondary)),
            const Spacer(),
            Text(value,
                style: TextStyle(
                    fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
                    color: color ?? (bold ? AppColors.primary : AppColors.textPrimary),
                    fontSize: bold ? 16 : 14)),
          ],
        ),
      );
}

class _ItemRow extends StatelessWidget {
  final OrderItem item;
  const _ItemRow({required this.item});
  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/product/${item.productId}'),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            children: [
              AppNetworkImage(
                url: item.imageUrl,
                width: 56,
                height: 56,
                radius: BorderRadius.circular(8),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.productName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Text('الكمية: ${item.quantity}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Text(formatPrice(item.totalPrice),
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Tracker extends StatelessWidget {
  final String status;
  const _Tracker({required this.status});
  @override
  Widget build(BuildContext context) {
    final currentIndex = _statusFlow.indexOf(status).clamp(0, _statusFlow.length - 1);
    const labels = ['تم الطلب', 'مؤكد', 'التجهيز', 'الشحن', 'التسليم'];
    return Row(
      children: [
        for (int i = 0; i < _statusFlow.length; i++) ...[
          Column(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: i <= currentIndex ? AppColors.primary : AppColors.border,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  i < currentIndex ? Icons.check : Icons.circle,
                  color: Colors.white,
                  size: i < currentIndex ? 16 : 10,
                ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                width: 54,
                child: Text(labels[i],
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: i <= currentIndex ? FontWeight.w700 : FontWeight.w400,
                        color: i <= currentIndex ? AppColors.primary : AppColors.textMuted)),
              ),
            ],
          ),
          if (i < _statusFlow.length - 1)
            Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.only(bottom: 22),
                color: i < currentIndex ? AppColors.primary : AppColors.border,
              ),
            ),
        ],
      ],
    );
  }
}
