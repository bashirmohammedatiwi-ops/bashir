import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/address.dart';
import '../../data/models/coupon.dart';
import '../../data/services/api_service.dart';
import '../cart/cart_provider.dart';
import '../cart/coupon_provider.dart';
import '../profile/profile_providers.dart';
import '../profile/widgets/address_form.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  Address? _selected;
  Coupon? _coupon;
  String? _couponError;
  int _shippingFee = 0;
  bool _shippingLoading = false;
  bool _placing = false;
  final _couponCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final c = ref.read(appliedCouponProvider);
      if (c != null && mounted) {
        setState(() {
          _coupon = c;
          _couponCtrl.text = c.code;
        });
      }
    });
  }

  @override
  void dispose() {
    _couponCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _refreshShipping() async {
    final subtotal = ref.read(cartProvider).subtotal;
    setState(() => _shippingLoading = true);
    try {
      final fee = await ref.read(apiServiceProvider).shippingQuote(
            governorate: _selected?.governorate ?? _selected?.city,
            area: _selected?.area,
            subtotal: subtotal,
          );
      setState(() => _shippingFee = fee);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _shippingLoading = false);
    }
  }

  Future<void> _applyCoupon() async {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() => _couponError = null);
    try {
      final coupon = await ref.read(apiServiceProvider).validateCoupon(code);
      final subtotal = ref.read(cartProvider).subtotal;
      if (coupon == null) {
        setState(() {
          _coupon = null;
          _couponError = 'الكوبون غير صالح';
        });
        return;
      }
      if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        setState(() {
          _coupon = null;
          _couponError = 'الحد الأدنى للطلب ${formatPrice(coupon.minOrder)}';
        });
        return;
      }
      setState(() => _coupon = coupon);
      ref.read(appliedCouponProvider.notifier).state = coupon;
    } catch (e) {
      setState(() {
        _coupon = null;
        _couponError = 'الكوبون غير صالح';
      });
    }
  }

  Future<void> _placeOrder() async {
    final cart = ref.read(cartProvider);
    if (_selected == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('يرجى اختيار عنوان التوصيل')));
      return;
    }
    setState(() => _placing = true);
    try {
      final order = await ref.read(apiServiceProvider).createOrder(
            items: cart.items.map((e) => e.toOrderItem()).toList(),
            addressId: _selected!.id,
            couponCode: _coupon?.code,
            notes: _notesCtrl.text.trim(),
          );
      ref.read(cartProvider.notifier).clear();
      ref.invalidate(ordersProvider);
      if (mounted) context.pushReplacement('/order-success/${order.id}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.sale));
      }
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final addresses = ref.watch(addressesProvider);
    final subtotal = cart.subtotal;
    final discount = _coupon?.discountFor(subtotal) ?? 0;
    final shipping = (_coupon?.freeShipping ?? false) ? 0 : _shippingFee;
    final total = (subtotal - discount + shipping).clamp(0, 1 << 31);

    return Scaffold(
      appBar: AppBar(title: const Text('إتمام الطلب')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionTitle('عنوان التوصيل'),
          addresses.when(
            loading: () => const Center(child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(color: AppColors.primary),
            )),
            error: (e, _) => Text(e.toString()),
            data: (list) {
              if (_selected == null && list.isNotEmpty) {
                _selected = list.firstWhere((a) => a.isDefault, orElse: () => list.first);
              }
              if (_selected != null && _shippingFee == 0 && !_shippingLoading) {
                WidgetsBinding.instance.addPostFrameCallback((_) => _refreshShipping());
              }
              if (list.isEmpty) {
                return _AddAddressCard(onAdd: () => _addAddress());
              }
              return Column(
                children: [
                  for (final a in list)
                    RadioListTile<String>(
                      value: a.id,
                      groupValue: _selected?.id,
                      activeColor: AppColors.primary,
                      contentPadding: EdgeInsets.zero,
                      title: Text(a.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text('${a.phone}\n${a.summary}'),
                      isThreeLine: true,
                      onChanged: (v) {
                        setState(() => _selected = a);
                        _refreshShipping();
                      },
                    ),
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: TextButton.icon(
                      onPressed: _addAddress,
                      icon: const Icon(Icons.add),
                      label: const Text('إضافة عنوان جديد'),
                    ),
                  ),
                ],
              );
            },
          ),
          const Divider(height: 28),
          _sectionTitle('كود الخصم'),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _couponCtrl,
                  decoration: InputDecoration(
                    hintText: 'أدخل كود الخصم',
                    errorText: _couponError,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 52,
                child: ElevatedButton(onPressed: _applyCoupon, child: const Text('تطبيق')),
              ),
            ],
          ),
          if (_coupon != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success, size: 18),
                  const SizedBox(width: 6),
                  Text('تم تطبيق الكوبون ${_coupon!.code}',
                      style: const TextStyle(color: AppColors.success)),
                ],
              ),
            ),
          const Divider(height: 28),
          _sectionTitle('ملاحظات الطلب'),
          TextField(
            controller: _notesCtrl,
            maxLines: 2,
            decoration: const InputDecoration(hintText: 'أي تعليمات خاصة بالتوصيل...'),
          ),
          const Divider(height: 28),
          _sectionTitle('طريقة الدفع'),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.primary),
            ),
            child: Row(
              children: const [
                Icon(Icons.payments_outlined, color: AppColors.primary),
                SizedBox(width: 10),
                Expanded(
                  child: Text('الدفع عند الاستلام (نقداً)',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                Icon(Icons.check_circle, color: AppColors.primary),
              ],
            ),
          ),
          const Divider(height: 28),
          _sectionTitle('ملخّص الطلب'),
          _row('المجموع الفرعي', formatPrice(subtotal)),
          if (discount > 0) _row('الخصم', '- ${formatPrice(discount)}', color: AppColors.success),
          _row(
            'الشحن',
            _shippingLoading
                ? '...'
                : (shipping == 0 ? 'مجاني' : formatPrice(shipping)),
          ),
          const Divider(height: 20),
          _row('الإجمالي', formatPrice(total), bold: true),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 14,
                offset: const Offset(0, -2)),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _placing ? null : _placeOrder,
              child: _placing
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4))
                  : Text('تأكيد الطلب • ${formatPrice(total)}'),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _addAddress() async {
    final result = await showAddressForm(context);
    if (result == null) return;
    try {
      final created = await ref.read(apiServiceProvider).createAddress(result);
      ref.invalidate(addressesProvider);
      setState(() => _selected = created);
      _refreshShipping();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Widget _sectionTitle(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(t, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
      );

  Widget _row(String label, String value, {bool bold = false, Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Text(label,
                style: TextStyle(
                    color: AppColors.textSecondary,
                    fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
                    fontSize: bold ? 16 : 14)),
            const Spacer(),
            Text(value,
                style: TextStyle(
                    color: color ?? (bold ? AppColors.primary : AppColors.textPrimary),
                    fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
                    fontSize: bold ? 18 : 14)),
          ],
        ),
      );
}

class _AddAddressCard extends StatelessWidget {
  final VoidCallback onAdd;
  const _AddAddressCard({required this.onAdd});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onAdd,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.primary, style: BorderStyle.solid),
          color: AppColors.primaryLight,
        ),
        child: Row(
          children: const [
            Icon(Icons.add_location_alt_outlined, color: AppColors.primary),
            SizedBox(width: 10),
            Text('أضف عنوان التوصيل', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
