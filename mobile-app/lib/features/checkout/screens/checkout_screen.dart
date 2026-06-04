import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../data/models/address_model.dart';
import '../../cart/providers/cart_provider.dart';
import '../providers/checkout_provider.dart';

class CheckoutScreen extends ConsumerWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkout = ref.watch(checkoutProvider);
    final addresses = ref.watch(addressesProvider).valueOrNull ?? [];
    final cart = ref.watch(cartProvider);
    final subtotal = cart.fold(0, (s, i) => s + i.totalPrice);
    final shipping = ref.read(checkoutProvider.notifier).shippingCost(subtotal);

    return Scaffold(
      appBar: AppBar(title: const Text('إتمام الطلب')),
      body: Column(
        children: [
          _ProgressBar(step: checkout.step),
          Expanded(
            child: IndexedStack(
              index: checkout.step,
              children: [
                _AddressStep(addresses: addresses, ref: ref),
                _DeliveryStep(ref: ref),
                _PaymentStep(
                  subtotal: subtotal,
                  shipping: shipping,
                  ref: ref,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (checkout.step > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => ref
                          .read(checkoutProvider.notifier)
                          .update(checkout.copyWith(step: checkout.step - 1)),
                      child: const Text('السابق'),
                    ),
                  ),
                if (checkout.step > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: CustomButton(
                    label: checkout.step == 2
                        ? AppStrings.confirmOrder
                        : 'التالي',
                    isLoading: checkout.isPlacingOrder,
                    onPressed: () async {
                      if (checkout.step < 2) {
                        ref.read(checkoutProvider.notifier)
                            .update(checkout.copyWith(step: checkout.step + 1));
                      } else {
                        final orderNum = await ref
                            .read(checkoutProvider.notifier)
                            .placeOrder();
                        if (context.mounted && orderNum != null) {
                          context.go(
                            '/order-confirmation?order=$orderNum',
                          );
                        }
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({required this.step});
  final int step;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _step(0, AppStrings.address),
          Expanded(child: LinearProgressIndicator(value: (step + 1) / 3)),
          _step(1, AppStrings.delivery),
          Expanded(child: LinearProgressIndicator(value: step >= 1 ? 1 : 0)),
          _step(2, AppStrings.payment),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _step(int index, String label) {
    return Column(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor:
              step >= index ? AppColors.primary : AppColors.divider,
          child: Text(
            '${index + 1}',
            style: TextStyle(
              color: step >= index ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ),
        Text(label, style: AppTextStyles.caption(size: 10)),
      ],
    );
  }
}

class _AddressStep extends StatelessWidget {
  const _AddressStep({required this.addresses, required this.ref});
  final List<AddressModel> addresses;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: addresses.map((addr) {
        return Card(
          child: RadioListTile<AddressModel>(
            value: addr,
            groupValue: ref.watch(checkoutProvider).selectedAddress,
            title: Text(addr.name),
            subtitle: Text(addr.fullAddress),
            onChanged: (v) {
              ref.read(checkoutProvider.notifier).update(
                  ref.read(checkoutProvider).copyWith(selectedAddress: v));
            },
          ),
        );
      }).toList(),
    );
  }
}

class _DeliveryStep extends ConsumerWidget {
  const _DeliveryStep({required this.ref});
  final WidgetRef ref;

  @override
  Widget build(BuildContext context, WidgetRef _) {
    final delivery = ref.watch(checkoutProvider).delivery;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RadioListTile<DeliveryOption>(
          value: DeliveryOption.standard,
          groupValue: delivery,
          title: const Text('توصيل عادي (3-5 أيام)'),
          subtitle: const Text('مجاني فوق ٥٠,٠٠٠ د.ع'),
          onChanged: (v) {
            if (v != null) {
              ref.read(checkoutProvider.notifier).update(
                  ref.read(checkoutProvider).copyWith(delivery: v));
            }
          },
        ),
        RadioListTile<DeliveryOption>(
          value: DeliveryOption.express,
          groupValue: delivery,
          title: const Text('توصيل سريع (1-2 أيام)'),
          subtitle: Text(CurrencyFormatter.format(5000)),
          onChanged: (v) {
            if (v != null) {
              ref.read(checkoutProvider.notifier).update(
                  ref.read(checkoutProvider).copyWith(delivery: v));
            }
          },
        ),
        RadioListTile<DeliveryOption>(
          value: DeliveryOption.pickup,
          groupValue: delivery,
          title: const Text('استلام من المحل'),
          subtitle: const Text('مجاني'),
          onChanged: (v) {
            if (v != null) {
              ref.read(checkoutProvider.notifier).update(
                  ref.read(checkoutProvider).copyWith(delivery: v));
            }
          },
        ),
      ],
    );
  }
}

class _PaymentStep extends StatelessWidget {
  const _PaymentStep({
    required this.subtotal,
    required this.shipping,
    required this.ref,
  });
  final int subtotal;
  final int shipping;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const ListTile(
          leading: Icon(Icons.money, color: AppColors.primary),
          title: Text(AppStrings.cashOnDelivery),
          subtitle: Text('الدفع عند الاستلام فقط'),
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _row('المجموع', subtotal),
                _row('التوصيل', shipping),
                const Divider(),
                _row('الإجمالي', subtotal + shipping, bold: true),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _row(String label, int amount, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: bold ? AppTextStyles.title() : AppTextStyles.body()),
          Text(
            CurrencyFormatter.format(amount),
            style: bold ? AppTextStyles.title(color: AppColors.primary) : null,
          ),
        ],
      ),
    );
  }
}
