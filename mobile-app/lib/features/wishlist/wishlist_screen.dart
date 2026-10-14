import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../auth/auth_provider.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
import '../shell/main_shell.dart';
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
    final count = wishlist.products.length;

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
          header: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(
              ProfileUi.hPad + 4,
              14,
              ProfileUi.hPad,
              10,
            ),
            child: Row(
              children: [
                Icon(Icons.favorite_rounded, size: 16, color: t.accent),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    s.acctItemsCount(count),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.label.copyWith(color: t.inkSoft),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return ProfileScaffold(title: s.wishlist, body: body);
  }
}
