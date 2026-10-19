import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/product.dart';
import '../alerts/restock_alerts_screen.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
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
    // إزالة من القلب في هذه الشاشة: «تراجع» يعيدها فوراً.
    ref.listenManual(wishlistProvider, _offerUndoOnRemoval);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && ref.read(authProvider).isAuthenticated) {
        ref.read(wishlistProvider.notifier).load();
      }
    });
  }

  /// منتج واحد اختفى من قائمة محمّلة دون تحميل جديد = أزالته الزبونة للتو.
  /// (تحميل من الخادم أو تسجيل الخروج لا يُعدّان إزالة.)
  void _offerUndoOnRemoval(WishlistState? prev, WishlistState next) {
    if (prev == null || prev.loading || next.loading || !prev.loaded || !next.loaded) return;
    final removed = prev.products.where((p) => !next.ids.contains(p.id)).toList();
    if (removed.length != 1 || !mounted) return;
    if (!(ModalRoute.of(context)?.isCurrent ?? false)) return;
    final product = removed.single;
    final s = ref.read(stringsProvider);
    final container = ProviderScope.containerOf(context, listen: false);
    final messengerContext = ScaffoldMessenger.maybeOf(context)?.context;
    AppSnackbar.action(
      context,
      message: s.wishlistRemoved,
      actionLabel: s.undo,
      onAction: () async {
        try {
          await container.read(wishlistProvider.notifier).setWished(product, true);
        } catch (e) {
          final ctx = messengerContext;
          if (ctx != null && ctx.mounted) AppSnackbar.error(ctx, friendlyError(e, lang: s.lang));
        }
      },
    );
  }

  /// يضيف للسلة ما يمكن إضافته فعلاً ([_WishlistSummary.addableFrom]) — لا يكرر
  /// ما في السلة أصلاً، ولا يضيف منتجاً يحتاج اختيار درجة.
  void _addAllToCart(List<Product> addable, int needShade) {
    final s = ref.s;
    final cart = ref.read(cartProvider.notifier);
    var added = 0;
    for (final p in addable) {
      if (cart.add(p, shade: p.shadeForCart(selected: null))) added++;
    }
    HapticFeedback.mediumImpact();
    if (added == 0) {
      AppSnackbar.error(context, s.wishlistAddFailed);
      return;
    }
    // الحاوية لا السياق: زر «السلة» قد يُضغط بعد إغلاق هذه الصفحة.
    final container = ProviderScope.containerOf(context, listen: false);
    final extra = needShade > 0 ? s.wishlistNeedShade(needShade) : '';
    AppSnackbar.action(
      context,
      message: s.addedToBagCount(added) + extra,
      actionLabel: s.navCart,
      onAction: () => openCartFromContainer(container),
    );
  }

  /// يرجع للرئيسية داخل التطبيق (يعمل أيضاً حين فُتحت الصفحة من رابط مباشر).
  void _browse() => openHomeTab(context, ProviderScope.containerOf(context, listen: false));

  Future<void> _reload() => ref.read(wishlistProvider.notifier).load();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final wishlist = ref.watch(wishlistProvider);
    final s = ref.s;
    final t = context.worldTheme;
    final hasError = wishlist.errorObject != null || wishlist.error != null;

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
    } else if (hasError && wishlist.products.isEmpty) {
      body = ErrorView.from(
        wishlist.errorObject ?? wishlist.error,
        loading: wishlist.loading,
        onRetry: _reload,
        onRefresh: _reload,
      );
    } else if (wishlist.loading && wishlist.products.isEmpty) {
      body = const ProductGridSkeleton(
        count: 6,
        padding: EdgeInsets.fromLTRB(ProfileUi.hPad, 4, ProfileUi.hPad, 24),
      );
    } else if (wishlist.products.isEmpty) {
      body = RefreshIndicator(
        color: t.accent,
        onRefresh: _reload,
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
      // المتوفر أولاً، ثم النافد في قسم خاص بشريحة «نبّهيني عند التوفر».
      final available = wishlist.products.where((p) => p.inStock).toList();
      final soldOut = wishlist.products.where((p) => !p.inStock).toList();
      const bottom = 24.0;
      body = RefreshIndicator(
        color: t.accent,
        onRefresh: _reload,
        child: CustomScrollView(
          physics: AppScrollPerf.physics,
          cacheExtent: AppScrollPerf.gridCacheExtent,
          slivers: [
            SliverToBoxAdapter(
              child: _WishlistSummary(products: wishlist.products, onAddAll: _addAllToCart),
            ),
            if (available.isNotEmpty)
              ProductGrid.sliver(
                products: available,
                padding: EdgeInsets.fromLTRB(ProfileUi.hPad, 4, ProfileUi.hPad, soldOut.isEmpty ? bottom : 8),
              ),
            if (soldOut.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: AppSectionTitle(
                  title: s.wishlistSoldOutTitle,
                  subtitle: s.wishlistSoldOutSubtitle,
                  padding: EdgeInsetsDirectional.fromSTEB(
                    ProfileUi.hPad,
                    available.isEmpty ? 4 : 16,
                    ProfileUi.hPad,
                    12,
                  ),
                ),
              ),
              ProductActionGrid(
                products: soldOut,
                footerExtent: RestockNotifyChip.extentFor(context),
                padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 0, ProfileUi.hPad, bottom),
                footerBuilder: (_, p) => RestockNotifyChip(product: p),
              ),
            ],
          ],
        ),
      );
    }

    return ProfileScaffold(title: s.wishlist, body: body);
  }
}

/// ملخص المفضلة: العدد والقيمة والعروض + إضافة المتوفر للسلة.
class _WishlistSummary extends ConsumerWidget {
  final List<Product> products;
  final void Function(List<Product> addable, int needShade) onAddAll;
  const _WishlistSummary({required this.products, required this.onAddAll});

  /// ما يمكن إضافته للسلة بلمسة واحدة: متوفر، درجته معروفة (لا متعدد الدرجات بلا
  /// اختيار)، ليس في السلة أصلاً (لا تتضاعف الكمية بلمسة ثانية)، وله صور أو
  /// درجات معروضة — لا منتجاً مختصراً حُفظ من السلة قبل أن تصل نسخته الكاملة.
  static List<Product> addableFrom(List<Product> products, Set<String> inCart) => [
        for (final p in products)
          if (p.inStock &&
              !_needsShade(p) &&
              !inCart.contains(p.id) &&
              (p.images.isNotEmpty || p.displayableShades.isNotEmpty))
            p,
      ];

  static bool _needsShade(Product p) => p.hasMultipleDisplayableShades && p.shadeForCart(selected: null) == null;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final inCart = ref.watch(cartProvider.select((c) => {for (final i in c.items) i.productId}));
    final addable = addableFrom(products, inCart);
    final needShade = products.where((p) => p.inStock && _needsShade(p) && !inCart.contains(p.id)).length;
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
        padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 14),
        decoration: BoxDecoration(
          gradient: t.signatureGradient,
          borderRadius: BorderRadius.circular(AppCorners.lg),
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
                Expanded(child: stat(formatPrice(value), s.wishlistTotalValue)),
                Expanded(child: stat('$onSale', s.wishlistOnSale)),
                Expanded(child: stat('$available', s.wishlistInStockNow)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.notifications_active_rounded, size: 15, color: Colors.white.withValues(alpha: 0.9)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    s.wishlistPriceDropHint,
                    style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                  ),
                ),
              ],
            ),
            if (addable.isNotEmpty) ...[
              const SizedBox(height: 14),
              AppTap(
                onTap: () => onAddAll(addable, needShade),
                radius: BorderRadius.circular(AppCorners.pill),
                haptic: false,
                child: Container(
                  constraints: const BoxConstraints(minHeight: kMinTapTarget),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppCorners.pill),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shopping_bag_rounded, size: 18, color: t.accentDark),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          s.addAvailableToBag(addable.length),
                          textAlign: TextAlign.center,
                          style: AppText.label.copyWith(color: t.accentDark, fontWeight: FontWeight.w800),
                        ),
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

/// نصوص شاشة المفضلة الخاصة بها.
extension _WishlistStringsX on AppStrings {
  String get wishlistTotalValue => isAr ? 'القيمة الكلية' : 'Total value';
  String get wishlistOnSale => isAr ? 'عليها عروض' : 'On sale';
  String get wishlistInStockNow => isAr ? 'متوفرة الآن' : 'In stock';
  String get wishlistPriceDropHint =>
      isAr ? 'سننبهكِ فور انخفاض سعر أي منتج هنا' : "We'll alert you when any of these drops in price";
  String get wishlistRemoved => isAr ? 'أُزيل من المفضلة' : 'Removed from your wishlist';
  String get wishlistAddFailed =>
      isAr ? 'تعذّرت الإضافة للسلة — راجعي الكمية المتوفرة' : "Couldn't add to your bag — check the available stock";

  /// « — و3 منتجات بحاجة لاختيار درجة» تُلحق برسالة الإضافة.
  String wishlistNeedShade(int n) => isAr
      ? ' — و${arProducts(n)} بحاجة لاختيار درجة من صفحتها'
      : ' — ${enCount(n, 'item needs', 'items need')} a shade picked';
  String get wishlistSoldOutTitle => isAr ? 'نفدت مؤقتاً' : 'Sold out for now';
  String get wishlistSoldOutSubtitle =>
      isAr ? 'اطلبي التنبيه ونخبركِ لحظة عودتها' : "Ask for an alert and we'll tell you the moment they're back";
}
