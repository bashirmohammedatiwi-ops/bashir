import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/widgets/animated_counter.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/product_showcase.dart';
import '../../../data/models/coupon_model.dart';
import '../../../data/remote/app_remote_data_source.dart';
import '../../loyalty/providers/loyalty_provider.dart';
import '../providers/cart_provider.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final _couponController = TextEditingController();
  String? _appliedCoupon;
  int _couponDiscount = 0;
  bool _usePoints = false;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    final coupon =
        await ref.read(appRemoteDataSourceProvider).validateCoupon(code);
    if (!mounted) return;
    if (coupon == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('كود غير صالح')),
      );
      return;
    }
    final subtotal = ref.read(cartProvider.notifier).subtotal;
    setState(() {
      _appliedCoupon = coupon.code;
      _couponDiscount = coupon.type == CouponType.percent
          ? (subtotal * coupon.value ~/ 100)
          : coupon.type == CouponType.freeShipping
              ? 5000
              : coupon.value;
    });
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final loyaltyPoints = ref.watch(loyaltyProvider).valueOrNull?.points ?? 0;
    final subtotal = cart.fold(0, (s, i) => s + i.totalPrice);
    final pointsDiscount = _usePoints ? (loyaltyPoints ~/ 100) * 1000 : 0;
    final shipping = subtotal >= 50000 ? 0 : 5000;
    final total = subtotal - _couponDiscount - pointsDiscount + shipping;

    if (cart.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(AppStrings.cartTitle),
          backgroundColor: AppColors.surface,
          surfaceTintColor: AppColors.surface,
        ),
        body: EmptyState(
          lottieAsset: 'assets/lottie/empty_cart.json',
          title: AppStrings.emptyCart,
          buttonLabel: AppStrings.startShopping,
          onButtonPressed: () => context.go('/home'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _CartHeader(itemCount: cart.length),
            Expanded(
              child: ListView.builder(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSizes.lg,
                  vertical: AppSizes.sm,
                ),
                itemCount: cart.length,
                itemBuilder: (context, index) {
                  final item = cart[index];
                  return AnimatedSize(
                    duration: AppMotion.medium,
                    curve: AppMotion.precise,
                    child: Dismissible(
                      key: Key(item.key),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsetsDirectional.only(end: 24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.error, Color(0xFF8B3535)],
                          ),
                          borderRadius:
                              BorderRadius.circular(AppSizes.cardRadius),
                        ),
                        alignment: AlignmentDirectional.centerEnd,
                        child: const Icon(
                          Icons.delete_outline_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      onDismissed: (_) => ref
                          .read(cartProvider.notifier)
                          .removeItem(item.key),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CartItemTile(
                          item: item,
                          onAdd: () => ref
                              .read(cartProvider.notifier)
                              .updateQuantity(
                                item.key,
                                item.quantity + 1,
                              ),
                          onRemove: () => ref
                              .read(cartProvider.notifier)
                              .updateQuantity(
                                item.key,
                                item.quantity - 1,
                              ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            _CheckoutSheet(
              subtotal: subtotal,
              shipping: shipping,
              couponDiscount: _couponDiscount,
              pointsDiscount: pointsDiscount,
              total: total,
              appliedCoupon: _appliedCoupon,
              couponController: _couponController,
              onApplyCoupon: _applyCoupon,
              onClearCoupon: () => setState(() {
                _appliedCoupon = null;
                _couponDiscount = 0;
              }),
              usePoints: _usePoints,
              loyaltyPoints: loyaltyPoints,
              onTogglePoints: (v) => setState(() => _usePoints = v),
              onCheckout: () => context.push('/checkout'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartHeader extends StatelessWidget {
  const _CartHeader({required this.itemCount});
  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.lg,
        AppSizes.xl,
        AppSizes.md,
      ),
      child: Row(
        children: [
          PressedScale(
            onTap: () => Navigator.maybePop(context),
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.divider),
                boxShadow: const [AppColors.softShadow],
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                size: 19,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                AppStrings.cartTitle,
                style: AppTextStyles.editorial(size: 26),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(
                    '$itemCount منتجات',
                    style: AppTextStyles.caption(
                      color: AppColors.textMuted,
                      size: 11,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: AppColors.gold,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CartItemTile extends StatelessWidget {
  const _CartItemTile({
    required this.item,
    required this.onAdd,
    required this.onRemove,
  });
  final dynamic item;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.divider),
        boxShadow: const [AppColors.softShadow],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.tinyRadius + 2),
            child: ProductShowcase.forProduct(
              product: item.product,
              imageUrl: item.product.images.first,
              layout: ProductShowcaseLayout.cartThumb,
              width: 84,
              height: 84,
              borderRadius: BorderRadius.circular(AppSizes.tinyRadius + 2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  item.product.brand.toUpperCase(),
                  style: AppTextStyles.caption(
                    color: AppColors.textMuted,
                    size: 9.5,
                  ).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  item.product.name,
                  style: AppTextStyles.title(size: 13).copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.25,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    AnimatedCounter(
                      value: item.totalPrice,
                      style: AppTextStyles.serif(
                        color: AppColors.primaryDark,
                        size: 16,
                        weight: FontWeight.w500,
                        style: FontStyle.italic,
                      ),
                    ),
                    const Spacer(),
                    _QtyControl(
                      qty: item.quantity,
                      onAdd: onAdd,
                      onRemove: onRemove,
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

class _QtyControl extends StatelessWidget {
  const _QtyControl({
    required this.qty,
    required this.onAdd,
    required this.onRemove,
  });
  final int qty;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _MiniBtn(icon: Icons.add_rounded, onTap: onAdd),
          SizedBox(
            width: 22,
            child: Text(
              '$qty',
              textAlign: TextAlign.center,
              style: AppTextStyles.title(size: 12).copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          _MiniBtn(icon: Icons.remove_rounded, onTap: onRemove),
        ],
      ),
    );
  }
}

class _MiniBtn extends StatelessWidget {
  const _MiniBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onTap,
      scale: 0.85,
      child: Container(
        width: 24,
        height: 24,
        decoration: const BoxDecoration(
          color: AppColors.surface,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 13, color: AppColors.primaryDark),
      ),
    );
  }
}

class _CheckoutSheet extends StatelessWidget {
  const _CheckoutSheet({
    required this.subtotal,
    required this.shipping,
    required this.couponDiscount,
    required this.pointsDiscount,
    required this.total,
    required this.appliedCoupon,
    required this.couponController,
    required this.onApplyCoupon,
    required this.onClearCoupon,
    required this.usePoints,
    required this.loyaltyPoints,
    required this.onTogglePoints,
    required this.onCheckout,
  });

  final int subtotal;
  final int shipping;
  final int couponDiscount;
  final int pointsDiscount;
  final int total;
  final String? appliedCoupon;
  final TextEditingController couponController;
  final VoidCallback onApplyCoupon;
  final VoidCallback onClearCoupon;
  final bool usePoints;
  final int loyaltyPoints;
  final ValueChanged<bool> onTogglePoints;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 18,
            offset: Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Coupon input
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(AppSizes.tinyRadius + 2),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 10),
                    const Icon(
                      Icons.local_offer_outlined,
                      color: AppColors.gold,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: couponController,
                        decoration: InputDecoration(
                          hintText: AppStrings.couponHint,
                          hintStyle: AppTextStyles.caption(
                            color: AppColors.textMuted,
                            size: 12,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                        ),
                        style: AppTextStyles.body(size: 13),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(6),
                      child: PressedScale(
                        onTap: onApplyCoupon,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primaryDark,
                            borderRadius:
                                BorderRadius.circular(AppSizes.tinyRadius),
                          ),
                          child: Text(
                            AppStrings.apply,
                            style: AppTextStyles.caption(
                              color: AppColors.gold,
                              size: 11.5,
                            ).copyWith(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (appliedCoupon != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_outline_rounded,
                        size: 14,
                        color: AppColors.success,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'تم تطبيق $appliedCoupon',
                        style: AppTextStyles.caption(
                          color: AppColors.success,
                          size: 11,
                        ).copyWith(fontWeight: FontWeight.w800),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: onClearCoupon,
                        child: const Icon(
                          Icons.close_rounded,
                          size: 14,
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 10),
              // Loyalty points toggle (only if available)
              if (loyaltyPoints >= 100)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(AppSizes.tinyRadius + 2),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.diamond_outlined,
                        size: 16,
                        color: AppColors.gold,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'استخدمي ${CurrencyFormatter.formatPoints(loyaltyPoints)} نقطة',
                          style: AppTextStyles.caption(
                            color: AppColors.textPrimary,
                            size: 11.5,
                          ).copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      Switch(
                        value: usePoints,
                        onChanged: onTogglePoints,
                        activeColor: AppColors.primary,
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 12),
              _SummaryRow(label: AppStrings.subtotal, amount: subtotal),
              if (couponDiscount > 0)
                _SummaryRow(
                  label: AppStrings.discount,
                  amount: -couponDiscount,
                  isDiscount: true,
                ),
              if (pointsDiscount > 0)
                _SummaryRow(
                  label: AppStrings.pointsDiscount,
                  amount: -pointsDiscount,
                  isDiscount: true,
                ),
              _SummaryRow(
                label: AppStrings.shipping,
                amount: shipping,
                isFree: shipping == 0,
              ),
              const SizedBox(height: 6),
              Luxe.goldenRule(width: double.infinity),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    AppStrings.total,
                    style: AppTextStyles.title(size: 14).copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Spacer(),
                  AnimatedCounter(
                    value: total,
                    style: AppTextStyles.serif(
                      color: AppColors.primaryDark,
                      size: 22,
                      weight: FontWeight.w500,
                      style: FontStyle.italic,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Luxe.primaryButton(
                label: AppStrings.checkout,
                icon: Icons.arrow_back_rounded,
                onTap: onCheckout,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.amount,
    this.isDiscount = false,
    this.isFree = false,
  });
  final String label;
  final int amount;
  final bool isDiscount;
  final bool isFree;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Text(
            label,
            style: AppTextStyles.body(
              color: AppColors.textSecondary,
              size: 12.5,
            ),
          ),
          const Spacer(),
          if (isFree)
            Text(
              'مجاني',
              style: AppTextStyles.caption(
                color: AppColors.success,
                size: 12,
              ).copyWith(fontWeight: FontWeight.w800),
            )
          else
            Text(
              '${isDiscount ? '-' : ''}${CurrencyFormatter.format(amount.abs())}',
              style: AppTextStyles.body(
                color: isDiscount ? AppColors.success : AppColors.textPrimary,
                size: 12.5,
              ).copyWith(fontWeight: FontWeight.w700),
            ),
        ],
      ),
    );
  }
}
