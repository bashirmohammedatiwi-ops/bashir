import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/product_card.dart';
import '../../data/models/cart_item.dart';
import '../../data/models/coupon.dart';
import '../../data/models/product.dart';
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
  bool _couponExpanded = false;

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

  void _clearCart() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تفريغ السلة؟'),
        content: const Text('سيتم حذف جميع المنتجات من سلتك.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          TextButton(
            onPressed: () {
              ref.read(cartProvider.notifier).clear();
              ref.read(appliedCouponProvider.notifier).state = null;
              Navigator.pop(ctx);
            },
            child: const Text('تفريغ', style: TextStyle(color: AppColors.sale)),
          ),
        ],
      ),
    );
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
    final topPad = MediaQuery.paddingOf(context).top;

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: cart.isEmpty
          ? _EmptyCart(topPad: topPad)
          : Column(
              children: [
                Expanded(
                  child: CustomScrollView(
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(child: _CartHeader(count: cart.count, topPad: topPad, onClear: _clearCart)),
                      SliverToBoxAdapter(
                        child: _ShippingProgressCard(
                          subtotal: cart.subtotal,
                          threshold: threshold,
                          onBrowse: () {
                            context.go('/');
                            ref.read(navIndexProvider.notifier).state = 0;
                          },
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                        sliver: SliverList.separated(
                          itemCount: cart.items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, i) => _CartItemCard(item: cart.items[i]),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: _CouponCard(
                          expanded: _couponExpanded,
                          onToggle: () => setState(() => _couponExpanded = !_couponExpanded),
                          controller: _couponCtrl,
                          error: _couponError,
                          loading: _couponLoading,
                          applied: coupon,
                          onApply: _applyCoupon,
                          onRemove: () {
                            ref.read(appliedCouponProvider.notifier).state = null;
                            _couponCtrl.clear();
                            setState(() => _couponError = null);
                          },
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: _OrderSummaryCard(
                          subtotal: cart.subtotal,
                          discount: discount,
                          itemCount: cart.count,
                        ),
                      ),
                      feed.maybeWhen(
                        data: (d) {
                          final recs = d.bestSellers.take(8).toList();
                          if (recs.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                          return SliverToBoxAdapter(
                            child: _RecommendationsRow(products: recs),
                          );
                        },
                        orElse: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    ],
                  ),
                ),
                _CheckoutPanel(subtotal: cart.subtotal, discount: discount, total: total, itemCount: cart.count),
              ],
            ),
    );
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

class _CartHeader extends StatelessWidget {
  final int count;
  final double topPad;
  final VoidCallback onClear;

  const _CartHeader({required this.count, required this.topPad, required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.fromLTRB(8, topPad + 4, 8, 14),
      child: Row(
        children: [
          IconButton(
            onPressed: onClear,
            icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.textMuted, size: 22),
            tooltip: 'تفريغ السلة',
          ),
          Expanded(
            child: Column(
              children: [
                const Text(
                  'سلة التسوّق',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  '$count ${count == 1 ? 'منتج' : 'منتجات'}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.push('/wishlist'),
            icon: const Icon(Icons.favorite_border_rounded, color: AppColors.textPrimary, size: 22),
          ),
        ],
      ),
    );
  }
}

// ─── Empty ────────────────────────────────────────────────────────────────────

class _EmptyCart extends ConsumerWidget {
  final double topPad;
  const _EmptyCart({required this.topPad});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        SizedBox(height: topPad + 16),
        const Text(
          'سلة التسوّق',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.primaryLight,
                          AppColors.primaryLight.withValues(alpha: 0.4),
                        ],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Icon(Icons.shopping_bag_outlined, size: 52, color: AppColors.primary.withValues(alpha: 0.7)),
                        Positioned(
                          bottom: 28,
                          right: 28,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                            child: const Icon(Icons.add_rounded, size: 16, color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'سلتك فارغة',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'اكتشفي أجمل المنتجات وأضيفيها لسلتك',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryDark],
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: () => ref.read(navIndexProvider.notifier).state = 0,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('تسوّقي الآن', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Shipping progress ────────────────────────────────────────────────────────

class _ShippingProgressCard extends StatelessWidget {
  final int subtotal;
  final int threshold;
  final VoidCallback? onBrowse;

  const _ShippingProgressCard({
    required this.subtotal,
    required this.threshold,
    this.onBrowse,
  });

  @override
  Widget build(BuildContext context) {
    if (threshold <= 0) return const SizedBox.shrink();
    final remaining = (threshold - subtotal).clamp(0, threshold);
    final progress = (subtotal / threshold).clamp(0.0, 1.0);
    final achieved = remaining == 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: achieved ? null : onBrowse,
        borderRadius: BorderRadius.circular(16),
        child: Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: achieved
              ? [const Color(0xFFE8F5E9), const Color(0xFFF1F8E9)]
              : [const Color(0xFFFFF3E0), const Color(0xFFFFF8E1)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: achieved ? AppColors.success.withValues(alpha: 0.3) : const Color(0xFFFFE082),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.85),
              shape: BoxShape.circle,
            ),
            child: Icon(
              achieved ? Icons.local_shipping_rounded : Icons.delivery_dining_rounded,
              color: achieved ? AppColors.success : AppColors.warning,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  achieved
                      ? 'توصيل مجاني!'
                      : 'أضيفي ${formatPrice(remaining)} للتوصيل المجاني • تسوقي الآن',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: achieved ? AppColors.success : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 6,
                    backgroundColor: Colors.white.withValues(alpha: 0.7),
                    color: achieved ? AppColors.success : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
        ),
      ),
    );
  }
}

// ─── Cart item ────────────────────────────────────────────────────────────────

class _CartItemCard extends ConsumerWidget {
  final CartItem item;
  const _CartItemCard({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(cartProvider.notifier);

    return Dismissible(
      key: Key(item.key),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 24),
        decoration: BoxDecoration(
          color: AppColors.sale,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 26),
      ),
      onDismissed: (_) {
        HapticFeedback.mediumImpact();
        notifier.remove(item.key);
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text('حُذف «${item.name}»'), duration: const Duration(seconds: 2)));
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 92,
                  height: 92,
                  child: item.imageUrl.isNotEmpty
                      ? AppNetworkImage(url: item.imageUrl, fit: BoxFit.cover)
                      : Container(
                          color: AppColors.primaryLight,
                          alignment: Alignment.center,
                          child: Text(
                            item.name.isNotEmpty ? item.name[0].toUpperCase() : '?',
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, height: 1.25),
                    ),
                    if (item.shadeName != null) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.scaffold,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          item.shadeName!,
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          formatPrice(item.price),
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          formatPrice(item.lineTotal),
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _QtyStepper(
                          quantity: item.quantity,
                          onDecrement: () => notifier.decrement(item.key),
                          onIncrement: () => notifier.increment(item.key),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => notifier.remove(item.key),
                          child: const Padding(
                            padding: EdgeInsets.all(4),
                            child: Icon(Icons.close_rounded, size: 18, color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

class _QtyStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _QtyStepper({
    required this.quantity,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepBtn(icon: Icons.remove_rounded, onTap: onDecrement),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              '$quantity',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.primary),
            ),
          ),
          _StepBtn(icon: Icons.add_rounded, onTap: onIncrement),
        ],
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _StepBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
      ),
    );
  }
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

class _CouponCard extends StatelessWidget {
  final bool expanded;
  final VoidCallback onToggle;
  final TextEditingController controller;
  final String? error;
  final bool loading;
  final Coupon? applied;
  final VoidCallback onApply;
  final VoidCallback onRemove;

  const _CouponCard({
    required this.expanded,
    required this.onToggle,
    required this.controller,
    this.error,
    required this.loading,
    this.applied,
    required this.onApply,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onToggle,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.local_offer_outlined, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'كوبون خصم',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                        if (applied != null)
                          Text(
                            'مطبّق: ${applied!.code}',
                            style: const TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w600),
                          )
                        else
                          const Text(
                            'اضغط لإدخال الكود',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                  if (applied != null)
                    IconButton(
                      onPressed: onRemove,
                      icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.textMuted),
                      visualDensity: VisualDensity.compact,
                    )
                  else
                    Icon(
                      expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                      color: AppColors.textMuted,
                    ),
                ],
              ),
            ),
          ),
          if (expanded && applied == null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: controller,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        hintText: 'أدخل الكود',
                        errorText: error,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 46,
                    child: ElevatedButton(
                      onPressed: loading ? null : onApply,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.textPrimary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('تطبيق', style: TextStyle(fontWeight: FontWeight.w700)),
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

// ─── Order summary ────────────────────────────────────────────────────────────

class _OrderSummaryCard extends StatelessWidget {
  final int subtotal;
  final int discount;
  final int itemCount;

  const _OrderSummaryCard({
    required this.subtotal,
    required this.discount,
    required this.itemCount,
  });

  @override
  Widget build(BuildContext context) {
    final total = (subtotal - discount).clamp(0, 1 << 31);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('ملخص الطلب', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 14),
          _SummaryRow(label: 'المجموع الفرعي ($itemCount)', value: formatPrice(subtotal)),
          if (discount > 0) ...[
            const SizedBox(height: 8),
            _SummaryRow(label: 'خصم الكوبون', value: '- ${formatPrice(discount)}', valueColor: AppColors.success),
          ],
          const SizedBox(height: 8),
          _SummaryRow(label: 'التوصيل', value: 'يُحسب عند الدفع', valueColor: AppColors.textMuted, small: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: AppColors.divider),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('الإجمالي', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              Text(
                formatPrice(total),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool small;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: small ? 12 : 13)),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: small ? 12 : 13,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────────

class _RecommendationsRow extends StatelessWidget {
  final List<Product> products;
  const _RecommendationsRow({required this.products});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
          child: Text('قد يعجبك أيضاً', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        ),
        SizedBox(
          height: 256,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => ProductCard(product: products[i], width: 148),
          ),
        ),
      ],
    );
  }
}

// ─── Checkout panel ───────────────────────────────────────────────────────────

class _CheckoutPanel extends ConsumerWidget {
  final int subtotal;
  final int discount;
  final int total;
  final int itemCount;

  const _CheckoutPanel({
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.itemCount,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -4)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      formatPrice(total),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: AppColors.textPrimary),
                    ),
                    if (discount > 0)
                      Text(
                        'وفّرت ${formatPrice(discount)} 🎉',
                        style: const TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w700),
                      )
                    else
                      Text(
                        '$itemCount ${itemCount == 1 ? 'منتج' : 'منتجات'}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: SizedBox(
                  height: 54,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () {
                        if (!ref.read(authProvider).isAuthenticated) {
                          context.push('/login');
                          return;
                        }
                        context.push('/checkout');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('إتمام الشراء', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_back_rounded, size: 18),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
