import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/free_shipping_banner.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/states.dart';
import '../../data/models/cart_item.dart';
import '../../data/models/coupon.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../catalog/catalog_providers.dart';
import '../shell/main_shell.dart';
import 'cart_provider.dart';
import 'coupon_provider.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});
  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final _couponCtrl = TextEditingController();
  String? _couponError;
  bool _couponLoading = false;

  @override
  void dispose() {
    _couponCtrl.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _couponLoading = true;
      _couponError = null;
    });
    try {
      final coupon = await ref.read(apiServiceProvider).validateCoupon(code);
      final subtotal = ref.read(cartProvider).subtotal;
      if (coupon == null) {
        ref.read(appliedCouponProvider.notifier).state = null;
        setState(() => _couponError = 'الكوبون غير صالح');
        return;
      }
      if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        ref.read(appliedCouponProvider.notifier).state = null;
        setState(() => _couponError = 'الحد الأدنى ${formatPrice(coupon.minOrder)}');
        return;
      }
      ref.read(appliedCouponProvider.notifier).state = coupon;
      setState(() => _couponError = null);
    } catch (_) {
      ref.read(appliedCouponProvider.notifier).state = null;
      setState(() => _couponError = 'الكوبون غير صالح');
    } finally {
      if (mounted) setState(() => _couponLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final coupon = ref.watch(appliedCouponProvider);
    final feed = ref.watch(homeFeedProvider);
    final threshold = feed.maybeWhen(
      data: (d) => d.settings.freeShippingThreshold,
      orElse: () => 50000,
    );
    final discount = coupon?.discountFor(cart.subtotal) ?? 0;
    final total = (cart.subtotal - discount).clamp(0, 1 << 31);

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(
        title: Text(cart.isEmpty ? 'سلة التسوّق' : 'سلة التسوّق (${cart.count} منتجات)'),
        actions: [
          if (!cart.isEmpty) ...[
            IconButton(onPressed: () {}, icon: const Icon(Icons.share_outlined)),
            IconButton(
              onPressed: () => context.push('/wishlist'),
              icon: const Icon(Icons.favorite_border_rounded),
            ),
          ],
        ],
      ),
      body: cart.isEmpty
          ? EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'سلتك فارغة',
              subtitle: 'تصفّح المنتجات وأضف ما يعجبك',
              action: ElevatedButton(
                onPressed: () => ref.read(navIndexProvider.notifier).state = 0,
                child: const Text('ابدأ التسوّق'),
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.only(bottom: 12),
                    children: [
                      FreeShippingBanner(subtotal: cart.subtotal, threshold: threshold),
                      ...cart.items.map((e) => Padding(
                            padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
                            child: _CartTile(item: e),
                          )),
                      _CouponSection(
                        controller: _couponCtrl,
                        error: _couponError,
                        loading: _couponLoading,
                        applied: coupon,
                        onApply: _applyCoupon,
                      ),
                      feed.maybeWhen(
                        data: (d) {
                          final recs = d.bestSellers.take(6).toList();
                          if (recs.isEmpty) return const SizedBox.shrink();
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.fromLTRB(16, 20, 16, 10),
                                child: Text('منتجات قد تنال إعجابك',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                              ),
                              SizedBox(
                                height: 280,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  itemCount: recs.length,
                                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                                  itemBuilder: (_, i) => ProductCard(product: recs[i], width: 155),
                                ),
                              ),
                            ],
                          );
                        },
                        orElse: () => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
                _CheckoutBar(subtotal: cart.subtotal, discount: discount, total: total),
              ],
            ),
    );
  }
}

class _CartTile extends ConsumerWidget {
  final CartItem item;
  const _CartTile({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(cartProvider.notifier);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppNetworkImage(
            url: item.imageUrl,
            width: 88,
            height: 88,
            radius: BorderRadius.circular(10),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                if (item.shadeName != null)
                  Text('الدرجة: ${item.shadeName}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(height: 6),
                Text(formatPrice(item.price),
                    style: const TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          _QtyBtn(icon: Icons.remove, onTap: () => notifier.decrement(item.key)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            child: Text('${item.quantity}',
                                style: const TextStyle(fontWeight: FontWeight.w800)),
                          ),
                          _QtyBtn(icon: Icons.add, onTap: () => notifier.increment(item.key)),
                        ],
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () => notifier.remove(item.key),
                      icon: const Icon(Icons.delete_outline, color: AppColors.textMuted, size: 20),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _QtyBtn({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, size: 16, color: AppColors.textPrimary),
      ),
    );
  }
}

class _CouponSection extends StatelessWidget {
  final TextEditingController controller;
  final String? error;
  final bool loading;
  final Coupon? applied;
  final VoidCallback onApply;
  const _CouponSection({
    required this.controller,
    this.error,
    required this.loading,
    this.applied,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.confirmation_number_outlined, size: 18, color: AppColors.textSecondary),
              SizedBox(width: 6),
              Text('أدخل كوبون أو قسيمة',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: 'كوبون أو قسيمة',
                    errorText: error,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: loading ? null : onApply,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.textPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                  ),
                  child: loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('تطبيق'),
                ),
              ),
            ],
          ),
          if (applied != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success, size: 16),
                  const SizedBox(width: 6),
                  Text('تم تطبيق ${applied!.code}',
                      style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _CheckoutBar extends ConsumerWidget {
  final int subtotal;
  final int discount;
  final int total;
  const _CheckoutBar({required this.subtotal, required this.discount, required this.total});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 14,
              offset: const Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('المجموع', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  Text(formatPrice(total),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
                  if (discount > 0)
                    Text('وفّرت ${formatPrice(discount)}',
                        style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            SizedBox(
              width: 160,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.textPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (!ref.read(authProvider).isAuthenticated) {
                    context.push('/login');
                    return;
                  }
                  context.push('/checkout');
                },
                child: const Text('إتمام الشراء', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
