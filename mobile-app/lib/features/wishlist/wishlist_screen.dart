import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/product.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import 'wishlist_provider.dart';

class WishlistScreen extends ConsumerStatefulWidget {
  const WishlistScreen({super.key});
  @override
  ConsumerState<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends ConsumerState<WishlistScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authProvider).isAuthenticated) {
        ref.read(wishlistProvider.notifier).load();
      }
    });
  }

  /// يضيف كل المتوفر للسلة دفعة واحدة. المنتجات متعددة الدرجات تحتاج اختيار درجة فتُترك.
  void _addAllToCart() {
    final s = ref.s;
    final cart = ref.read(cartProvider.notifier);
    var added = 0;
    var needShade = 0;
    for (final p in ref.read(wishlistProvider).products) {
      if (!p.inStock) continue;
      final shade = p.shadeForCart(selected: null);
      if (p.hasMultipleDisplayableShades && shade == null) {
        needShade++;
        continue;
      }
      if (cart.add(p, shade: shade)) added++;
    }
    HapticFeedback.mediumImpact();
    if (added == 0) {
      AppSnackbar.error(context, s.isAr ? 'اختاري الدرجة من صفحة المنتج أولاً' : 'Pick a shade on the product page first');
      return;
    }
    final extra = needShade > 0
        ? (s.isAr ? ' — $needShade تحتاج اختيار درجة' : ' — $needShade need a shade')
        : '';
    AppSnackbar.action(
      context,
      message: (s.isAr ? 'أُضيف $added منتج للسلة' : 'Added $added to bag') + extra,
      actionLabel: s.navCart,
      onAction: () {
        ref.read(navIndexProvider.notifier).state = NavTabs.cart;
        context.go('/');
      },
    );
  }

  /// يرجع للرئيسية داخل التطبيق (التبويب الأول) ثم يغلق هذه الصفحة.
  void _browse() {
    ref.read(navIndexProvider.notifier).state = 0;
    if (context.canPop()) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final wishlist = ref.watch(wishlistProvider);
    final s = ref.s;
    final t = context.worldTheme;

    final Widget body;
    if (!auth.isAuthenticated) {
      body = ProfileEmptyState(
        icon: Icons.favorite_border_rounded,
        title: s.loginToViewWishlist,
        subtitle: s.wishlistEmptySubtitle,
        action: ProfilePrimaryButton(
          label: s.login,
          onPressed: () => context.push('/login'),
        ),
      );
    } else if (wishlist.error != null && wishlist.products.isEmpty) {
      body = ErrorView(
        message: friendlyError(wishlist.error!),
        onRetry: () => ref.read(wishlistProvider.notifier).load(),
      );
    } else if (wishlist.loading && wishlist.products.isEmpty) {
      body = const ProductGridSkeleton(count: 6);
    } else if (wishlist.products.isEmpty) {
      body = RefreshIndicator(
        color: t.accent,
        onRefresh: () => ref.read(wishlistProvider.notifier).load(),
        child: ProfileEmptyState(
          icon: Icons.favorite_border_rounded,
          title: s.wishlistIsEmpty,
          subtitle: s.wishlistAddHint,
          action: ProfilePrimaryButton(
            label: s.browseProductsBtn,
            icon: Icons.shopping_bag_outlined,
            onPressed: _browse,
          ),
        ),
      );
    } else {
      body = RefreshIndicator(
        color: t.accent,
        onRefresh: () => ref.read(wishlistProvider.notifier).load(),
        child: ProductGrid(
          products: wishlist.products,
          padding: const EdgeInsets.fromLTRB(
            ProfileUi.hPad,
            4,
            ProfileUi.hPad,
            24,
          ),
          header: _WishlistSummary(products: wishlist.products, onAddAll: _addAllToCart),
        ),
      );
    }

    return ProfileScaffold(title: s.wishlist, body: body);
  }
}

/// ملخص المفضلة: العدد والقيمة والعروض + إضافة المتوفر للسلة.
class _WishlistSummary extends ConsumerWidget {
  final List<Product> products;
  final VoidCallback onAddAll;
  const _WishlistSummary({required this.products, required this.onAddAll});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final ar = s.isAr;
    final value = products.fold<int>(0, (sum, p) => sum + p.price);
    final onSale = products.where((p) => p.hasDiscount).length;
    final available = products.where((p) => p.inStock).length;

    Widget stat(String v, String label) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(v, style: AppText.title3.copyWith(color: Colors.white)),
            Text(label, style: AppText.micro.copyWith(color: Colors.white.withValues(alpha: 0.8))),
          ],
        );

    return Padding(
      padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 12, ProfileUi.hPad, 14),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
        decoration: BoxDecoration(
          gradient: t.signatureGradient,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(color: t.accent.withValues(alpha: 0.28), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.favorite_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    s.acctItemsCount(products.length),
                    style: AppText.label.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: stat(formatPrice(value), ar ? 'القيمة الكلية' : 'Total value')),
                Expanded(child: stat('$onSale', ar ? 'عليها عروض' : 'On sale')),
                Expanded(child: stat('$available', ar ? 'متوفرة الآن' : 'In stock')),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.notifications_active_rounded, size: 15, color: Colors.white.withValues(alpha: 0.9)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    ar ? 'سننبهك فور انخفاض سعر أي منتج هنا' : "We'll alert you when any of these drops in price",
                    style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                  ),
                ),
              ],
            ),
            if (available > 0) ...[
              const SizedBox(height: 14),
              GestureDetector(
                onTap: onAddAll,
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shopping_bag_rounded, size: 18, color: t.accentDark),
                      const SizedBox(width: 8),
                      Text(
                        ar ? 'أضيفي المتوفر إلى السلة' : 'Add available to bag',
                        style: AppText.label.copyWith(color: t.accentDark, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
