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
  final _couponFocus = FocusNode();
  String? _couponError;
  bool _couponLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final applied = ref.read(appliedCouponProvider);
      if (applied != null) {
        _couponCtrl.text = applied.code;
      }
    });
  }

  @override
  void dispose() {
    _couponCtrl.dispose();
    _couponFocus.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) {
      setState(() => _couponError = 'أدخل كود الخصم');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _couponLoading = true;
      _couponError = null;
    });

    try {
      final coupon = await ref.read(apiServiceProvider).validateCoupon(code);
      final subtotal = ref.read(cartProvider).subtotal;

      if (coupon == null) {
        ref.read(appliedCouponProvider.notifier).state = null;
        setState(() => _couponError = 'كود الخصم غير صالح أو منتهي');
        return;
      }

      if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        ref.read(appliedCouponProvider.notifier).state = null;
        setState(() => _couponError = 'الحد الأدنى للطلب ${formatPrice(coupon.minOrder)}');
        return;
      }

      ref.read(appliedCouponProvider.notifier).state = coupon;
      setState(() => _couponError = null);
      HapticFeedback.mediumImpact();
      if (mounted) {
        AppSnackbar.success(context, 'تم تطبيق الكوبون ${coupon.code}');
      }
    } on ApiException catch (e) {
      ref.read(appliedCouponProvider.notifier).state = null;
      setState(() => _couponError = e.message);
    } catch (e) {
      ref.read(appliedCouponProvider.notifier).state = null;
      setState(() => _couponError = friendlyError(e));
    } finally {
      if (mounted) setState(() => _couponLoading = false);
    }
  }

  void _removeCoupon() {
    ref.read(appliedCouponProvider.notifier).state = null;
    _couponCtrl.clear();
    setState(() => _couponError = null);
    HapticFeedback.selectionClick();
  }

  void _clearCart() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: const Text('تفريغ السلة؟'),
        content: const Text('سيتم حذف جميع المنتجات من سلتك.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          TextButton(
            onPressed: () {
              ref.read(cartProvider.notifier).clear();
              _removeCoupon();
              Navigator.pop(ctx);
            },
            child: const Text('تفريغ', style: TextStyle(color: AppColors.sale)),
          ),
        ],
      ),
    );
  }

  void _validateCouponOnCartChange(CartState cart, Coupon? coupon) {
    if (coupon == null) return;
    if (coupon.minOrder > 0 && cart.subtotal < coupon.minOrder) {
      ref.read(appliedCouponProvider.notifier).state = null;
      if (mounted) {
        setState(() => _couponError = 'الحد الأدنى للطلب ${formatPrice(coupon.minOrder)}');
      }
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

    ref.listen<CartState>(cartProvider, (prev, next) {
      if (prev?.subtotal != next.subtotal) {
        _validateCouponOnCartChange(next, ref.read(appliedCouponProvider));
      }
    });

    final discount = coupon?.discountFor(cart.subtotal) ?? 0;
    final freeShipping = coupon?.freeShipping ?? false;
    final total = (cart.subtotal - discount).clamp(0, 1 << 31);
    final topPad = MediaQuery.paddingOf(context).top;
    final bottomPad = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: cart.isEmpty
          ? _EmptyCart(topPad: topPad)
          : Stack(
              children: [
                CustomScrollView(
                  physics: const BouncingScrollPhysics(),
                  slivers: [
                    SliverToBoxAdapter(
                      child: _CartHeroHeader(
                        count: cart.count,
                        topPad: topPad,
                        onClear: _clearCart,
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: _FreeShippingBanner(
                        subtotal: cart.subtotal,
                        threshold: threshold,
                        freeShippingCoupon: freeShipping,
                        onBrowse: () {
                          context.go('/');
                          ref.read(navIndexProvider.notifier).state = 0;
                        },
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      sliver: SliverList.separated(
                        itemCount: cart.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) => _CartProductTile(item: cart.items[i]),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: _CouponSection(
                        controller: _couponCtrl,
                        focusNode: _couponFocus,
                        error: _couponError,
                        loading: _couponLoading,
                        applied: coupon,
                        discount: discount,
                        onApply: _applyCoupon,
                        onRemove: _removeCoupon,
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: _OrderBreakdown(
                        subtotal: cart.subtotal,
                        discount: discount,
                        freeShipping: freeShipping,
                        itemCount: cart.count,
                        total: total,
                      ),
                    ),
                    feed.maybeWhen(
                      data: (d) {
                        final recs = d.bestSellers.take(8).toList();
                        if (recs.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                        return SliverToBoxAdapter(child: _YouMayLike(products: recs));
                      },
                      orElse: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                    ),
                    SliverToBoxAdapter(child: SizedBox(height: 120 + bottomPad)),
                  ],
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: _CheckoutDock(
                    total: total,
                    discount: discount,
                    itemCount: cart.count,
                    coupon: coupon,
                  ),
                ),
              ],
            ),
    );
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

class _CartHeroHeader extends StatelessWidget {
  final int count;
  final double topPad;
  final VoidCallback onClear;

  const _CartHeroHeader({
    required this.count,
    required this.topPad,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(8, topPad + 6, 8, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            AppColors.primaryLight,
            const Color(0xFFFFF5F8),
            AppColors.scaffold,
          ],
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: onClear,
            icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.textSecondary),
            tooltip: 'تفريغ السلة',
          ),
          Expanded(
            child: Column(
              children: [
                Text('سلة التسوّق', style: AppTypography.sectionTitle.copyWith(fontSize: 22)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    '$count ${count == 1 ? 'منتج' : 'منتجات'}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.push('/wishlist'),
            icon: const Icon(Icons.favorite_border_rounded, color: AppColors.primary),
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
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.only(top: topPad + 24),
            child: const Center(
              child: Text('سلة التسوّق', style: AppTypography.sectionTitle),
            ),
          ),
        ),
        SliverFillRemaining(
          hasScrollBody: false,
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primaryLight,
                        AppColors.primary.withValues(alpha: 0.08),
                      ],
                    ),
                  ),
                  child: Icon(
                    Icons.shopping_bag_outlined,
                    size: 56,
                    color: AppColors.primary.withValues(alpha: 0.75),
                  ),
                ),
                const SizedBox(height: 28),
                const Text(
                  'سلتك فارغة',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                Text(
                  'اكتشفي أجمل منتجات التجميل وأضيفيها لسلتك',
                  textAlign: TextAlign.center,
                  style: AppTypography.caption.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                      ),
                      borderRadius: BorderRadius.circular(AppRadius.lg),
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                        ),
                      ),
                      child: const Text(
                        'تسوّقي الآن',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Free shipping ────────────────────────────────────────────────────────────

class _FreeShippingBanner extends StatelessWidget {
  final int subtotal;
  final int threshold;
  final bool freeShippingCoupon;
  final VoidCallback? onBrowse;

  const _FreeShippingBanner({
    required this.subtotal,
    required this.threshold,
    required this.freeShippingCoupon,
    this.onBrowse,
  });

  @override
  Widget build(BuildContext context) {
    if (threshold <= 0 && !freeShippingCoupon) return const SizedBox.shrink();

    final achieved = freeShippingCoupon || (threshold > 0 && subtotal >= threshold);
    final remaining = threshold > 0 ? (threshold - subtotal).clamp(0, threshold) : 0;
    final progress = threshold > 0 ? (subtotal / threshold).clamp(0.0, 1.0) : 1.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: achieved ? null : onBrowse,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          child: Ink(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.xl),
              gradient: LinearGradient(
                colors: achieved
                    ? [const Color(0xFFE8F8EE), const Color(0xFFF4FBF6)]
                    : [const Color(0xFFFFF8F0), const Color(0xFFFFF3E8)],
              ),
              border: Border.all(
                color: achieved
                    ? AppColors.success.withValues(alpha: 0.25)
                    : AppColors.warning.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: (achieved ? AppColors.success : AppColors.warning)
                            .withValues(alpha: 0.2),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Icon(
                    achieved ? Icons.local_shipping_rounded : Icons.delivery_dining_rounded,
                    color: achieved ? AppColors.success : AppColors.warning,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        achieved
                            ? (freeShippingCoupon ? 'شحن مجاني مع الكوبون!' : 'مبروك! توصيل مجاني')
                            : 'باقي ${formatPrice(remaining)} للتوصيل المجاني',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: achieved ? AppColors.success : AppColors.textPrimary,
                        ),
                      ),
                      if (!achieved && threshold > 0) ...[
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 7,
                            backgroundColor: AppColors.surface.withValues(alpha: 0.8),
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Cart item ────────────────────────────────────────────────────────────────

class _CartProductTile extends ConsumerWidget {
  final CartItem item;

  const _CartProductTile({required this.item});

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
          gradient: const LinearGradient(colors: [Color(0xFFFF6B6B), AppColors.sale]),
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 28),
      ),
      onDismissed: (_) {
        HapticFeedback.mediumImpact();
        notifier.remove(item.key);
        AppSnackbar.show(context, 'حُذف «${item.name}»');
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.textPrimary.withValues(alpha: 0.04),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: SizedBox(
                  width: 96,
                  height: 96,
                  child: item.imageUrl.isNotEmpty
                      ? ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain)
                      : ColoredBox(
                          color: AppColors.primaryLight,
                          child: Center(
                            child: Text(
                              item.name.isNotEmpty ? item.name.characters.first : '?',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                              ),
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
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, height: 1.3),
                    ),
                    if (item.shadeName != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.scaffold,
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Text(
                          item.shadeName!,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Text(
                          formatPrice(item.price),
                          style: AppTypography.price.copyWith(fontSize: 15),
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
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QtyControl(
                          quantity: item.quantity,
                          onDecrement: () {
                            HapticFeedback.selectionClick();
                            notifier.decrement(item.key);
                          },
                          onIncrement: () {
                            HapticFeedback.selectionClick();
                            notifier.increment(item.key);
                          },
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => notifier.remove(item.key),
                          icon: const Icon(Icons.close_rounded, size: 20),
                          color: AppColors.textMuted,
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
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

class _QtyControl extends StatelessWidget {
  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _QtyControl({
    required this.quantity,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 38,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _QtyBtn(icon: Icons.remove_rounded, onTap: onDecrement),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              '$quantity',
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 14,
                color: AppColors.primary,
              ),
            ),
          ),
          _QtyBtn(icon: Icons.add_rounded, onTap: onIncrement),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: Padding(
          padding: const EdgeInsets.all(9),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
      ),
    );
  }
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

class _CouponSection extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String? error;
  final bool loading;
  final Coupon? applied;
  final int discount;
  final VoidCallback onApply;
  final VoidCallback onRemove;

  const _CouponSection({
    required this.controller,
    required this.focusNode,
    this.error,
    required this.loading,
    this.applied,
    required this.discount,
    required this.onApply,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              const Text('كود الخصم', style: AppTypography.screenTitle),
            ],
          ),
          const SizedBox(height: 12),
          if (applied != null)
            _AppliedCouponBanner(
              coupon: applied!,
              discount: discount,
              onRemove: onRemove,
            )
          else
            _CouponInputCard(
              controller: controller,
              focusNode: focusNode,
              error: error,
              loading: loading,
              onApply: onApply,
            ),
        ],
      ),
    );
  }
}

class _CouponInputCard extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String? error;
  final bool loading;
  final VoidCallback onApply;

  const _CouponInputCard({
    required this.controller,
    required this.focusNode,
    this.error,
    required this.loading,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: error != null ? AppColors.sale.withValues(alpha: 0.5) : AppColors.border,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primaryLight,
                      AppColors.primary.withValues(alpha: 0.12),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.confirmation_number_outlined, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  textCapitalization: TextCapitalization.characters,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => onApply(),
                  style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 1.2),
                  decoration: InputDecoration(
                    hintText: 'أدخل كود الخصم',
                    hintStyle: AppTypography.caption,
                    isDense: true,
                    filled: true,
                    fillColor: AppColors.scaffold,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (error != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.error_outline_rounded, size: 16, color: AppColors.sale),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    error!,
                    style: const TextStyle(
                      color: AppColors.sale,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: loading ? null : onApply,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.textPrimary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
              ),
              child: loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('تطبيق الكود', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}

class _AppliedCouponBanner extends StatelessWidget {
  final Coupon coupon;
  final int discount;
  final VoidCallback onRemove;

  const _AppliedCouponBanner({
    required this.coupon,
    required this.discount,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8F8EE), Color(0xFFF0FAF3)],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  coupon.code,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                ),
                const SizedBox(height: 2),
                Text(
                  coupon.benefitLabel(formatPrice: formatPrice),
                  style: const TextStyle(
                    color: AppColors.success,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (discount > 0) ...[
                  const SizedBox(height: 2),
                  Text(
                    'وفّرت ${formatPrice(discount)}',
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(Icons.close_rounded, size: 20),
            color: AppColors.textMuted,
            tooltip: 'إزالة الكوبون',
          ),
        ],
      ),
    );
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

class _OrderBreakdown extends StatelessWidget {
  final int subtotal;
  final int discount;
  final bool freeShipping;
  final int itemCount;
  final int total;

  const _OrderBreakdown({
    required this.subtotal,
    required this.discount,
    required this.freeShipping,
    required this.itemCount,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('ملخص الطلب', style: AppTypography.screenTitle),
            const SizedBox(height: 16),
            _Line(label: 'المجموع ($itemCount منتج)', value: formatPrice(subtotal)),
            if (discount > 0) ...[
              const SizedBox(height: 10),
              _Line(
                label: 'خصم الكوبون',
                value: '- ${formatPrice(discount)}',
                valueColor: AppColors.success,
              ),
            ],
            if (freeShipping) ...[
              const SizedBox(height: 10),
              const _Line(
                label: 'الشحن',
                value: 'مجاني',
                valueColor: AppColors.success,
              ),
            ] else ...[
              const SizedBox(height: 10),
              const _Line(
                label: 'الشحن',
                value: 'يُحسب عند الدفع',
                muted: true,
              ),
            ],
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Divider(height: 1),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('الإجمالي', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                Text(
                  formatPrice(total),
                  style: AppTypography.priceLarge.copyWith(fontSize: 20),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool muted;

  const _Line({
    required this.label,
    required this.value,
    this.valueColor,
    this.muted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: muted ? AppColors.textMuted : AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────────

class _YouMayLike extends StatelessWidget {
  final List<Product> products;

  const _YouMayLike({required this.products});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 28, 16, 12),
          child: Text('قد يعجبك أيضاً', style: AppTypography.sectionTitle),
        ),
        SizedBox(
          height: 260,
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

// ─── Checkout dock ────────────────────────────────────────────────────────────

class _CheckoutDock extends ConsumerWidget {
  final int total;
  final int discount;
  final int itemCount;
  final Coupon? coupon;

  const _CheckoutDock({
    required this.total,
    required this.discount,
    required this.itemCount,
    this.coupon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, bottom + 10),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.97),
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(formatPrice(total), style: AppTypography.priceLarge.copyWith(fontSize: 22)),
                if (discount > 0)
                  Text(
                    'وفّرت ${formatPrice(discount)}',
                    style: const TextStyle(
                      color: AppColors.success,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  )
                else if (coupon?.freeShipping ?? false)
                  const Text(
                    'شحن مجاني مُفعّل',
                    style: TextStyle(
                      color: AppColors.success,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  )
                else
                  Text(
                    '$itemCount ${itemCount == 1 ? 'منتج' : 'منتجات'}',
                    style: AppTypography.caption,
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 5,
            child: SizedBox(
              height: 54,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, Color(0xFFFF4D8D)],
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.4),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
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
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                    ),
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
    );
  }
}
