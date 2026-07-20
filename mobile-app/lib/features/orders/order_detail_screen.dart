import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/order_detail_skeleton.dart';
import '../../core/widgets/section_card.dart';
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
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(title: const Text('تفاصيل الطلب'), elevation: 0),
      body: async.when(
        loading: () => const OrderDetailSkeleton(),
        error: (e, _) => ErrorView.from(
          e,
          onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
        ),
        data: (order) => ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _OrderHeader(order: order),
            const SizedBox(height: AppSpacing.lg),
            if (order.status != 'CANCELLED' && order.status != 'RETURNED')
              SectionCard(
                child: _Tracker(status: order.status),
              )
            else
              Container(
                padding: const EdgeInsets.all(AppSpacing.md + 2),
                decoration: BoxDecoration(
                  color: AppColors.sale.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: AppColors.sale.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppColors.sale),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        orderStatusLabel(order.status),
                        style: const TextStyle(color: AppColors.sale, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: AppSpacing.md),
            SectionCard(
              title: 'المنتجات',
              child: Column(
                children: [
                  for (var i = 0; i < order.items.length; i++) ...[
                    if (i > 0) const Divider(height: AppSpacing.lg),
                    _ItemRow(item: order.items[i]),
                  ],
                ],
              ),
            ),
            if (order.address != null) ...[
              const SizedBox(height: AppSpacing.md),
              SectionCard(
                title: 'عنوان التوصيل',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.address!.fullName, style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: AppSpacing.xs),
                    Text(order.address!.phone, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      order.address!.summary,
                      style: AppTypography.caption.copyWith(color: AppColors.textSecondary, height: 1.5),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            SectionCard(
              title: 'ملخّص الدفع',
              child: Column(
                children: [
                  SummaryRow(label: 'المجموع الفرعي', value: formatPrice(order.subtotal)),
                  if (order.discountTotal > 0)
                    SummaryRow(
                      label: 'الخصم',
                      value: '- ${formatPrice(order.discountTotal)}',
                      valueColor: AppColors.success,
                    ),
                  SummaryRow(
                    label: 'الشحن',
                    value: order.shippingTotal == 0 ? 'مجاني' : formatPrice(order.shippingTotal),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    child: Divider(height: 1),
                  ),
                  SummaryRow(label: 'الإجمالي', value: formatPrice(order.total), bold: true),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Icon(Icons.payments_outlined, size: 18, color: AppColors.textSecondary.withValues(alpha: 0.8)),
                      const SizedBox(width: AppSpacing.sm),
                      Text('الدفع عند الاستلام', style: AppTypography.caption),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _reorder(context, ref, order),
                icon: const Icon(Icons.replay_rounded),
                label: const Text('إعادة الطلب'),
              ),
            ),
            if (order.status == 'PENDING' || order.status == 'CONFIRMED') ...[
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: () => _cancel(context, ref),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.sale,
                  side: const BorderSide(color: AppColors.sale),
                ),
                icon: const Icon(Icons.close_rounded),
                label: const Text('إلغاء الطلب'),
              ),
            ],
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  ref.read(navIndexProvider.notifier).state = 0;
                  context.go('/');
                },
                child: const Text('متابعة التسوّق'),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }

  Future<void> _reorder(BuildContext context, WidgetRef ref, AppOrder order) async {
    HapticFeedback.mediumImpact();
    AppSnackbar.show(context, 'جاري إضافة المنتجات إلى السلة…', duration: const Duration(seconds: 4));
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
      AppSnackbar.error(context, 'تعذّر إضافة المنتجات. حاول لاحقاً');
      return;
    }
    AppSnackbar.action(
      context,
      message: 'تمت إضافة $added منتج إلى السلة',
      actionLabel: 'السلة',
      onAction: () {
        ref.read(navIndexProvider.notifier).state = 3;
        context.go('/');
      },
    );
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: const Text('إلغاء الطلب'),
        content: const Text('هل أنت متأكد من إلغاء هذا الطلب؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('تراجع')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('إلغاء الطلب', style: TextStyle(color: AppColors.sale)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiServiceProvider).cancelOrder(orderId);
      ref.invalidate(orderDetailProvider(orderId));
      ref.invalidate(ordersProvider);
      if (context.mounted) AppSnackbar.success(context, 'تم إلغاء الطلب');
    } catch (e) {
      if (context.mounted) AppSnackbar.error(context, friendlyError(e));
    }
  }
}

class _OrderHeader extends StatelessWidget {
  final AppOrder order;
  const _OrderHeader({required this.order});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('#${order.orderNumber}', style: AppTypography.sectionTitle),
              const SizedBox(height: AppSpacing.xs),
              Text(formatDate(order.createdAt), style: AppTypography.caption),
            ],
          ),
        ),
        StatusChip(status: order.status),
      ],
    );
  }
}

class _ItemRow extends StatelessWidget {
  final OrderItem item;
  const _ItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          context.push('/product/${item.productId}');
        },
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.sm),
                child: SizedBox(
                  width: 60,
                  height: 60,
                  child: ProductCoverImage(
                    url: item.imageUrl,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm + 2),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.productName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.body.copyWith(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text('الكمية: ${item.quantity}', style: AppTypography.caption),
                  ],
                ),
              ),
              Text(formatPrice(item.totalPrice), style: AppTypography.price),
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < _statusFlow.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: i <= currentIndex ? AppColors.primary : AppColors.border,
                    shape: BoxShape.circle,
                    boxShadow: i == currentIndex
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    i < currentIndex ? Icons.check_rounded : Icons.circle,
                    color: Colors.white,
                    size: i < currentIndex ? 18 : 8,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  labels[i],
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: i <= currentIndex ? FontWeight.w700 : FontWeight.w400,
                    color: i <= currentIndex ? AppColors.primary : AppColors.textMuted,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
          if (i < _statusFlow.length - 1)
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: SizedBox(
                width: 16,
                child: Container(
                  height: 2,
                  color: i < currentIndex ? AppColors.primary : AppColors.border,
                ),
              ),
            ),
        ],
      ],
    );
  }
}
