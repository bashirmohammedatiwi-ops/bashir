import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../auth/auth_provider.dart';
import '../shell/main_shell.dart';
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

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final wishlist = ref.watch(wishlistProvider);
    final s = ref.s;

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(
        title: Text(s.wishlist),
        elevation: 0,
      ),
      body: !auth.isAuthenticated
          ? EmptyState(
              icon: Icons.favorite_border_rounded,
              title: s.loginToViewWishlist,
              subtitle: s.wishlistEmptySubtitle,
              action: ElevatedButton(
                onPressed: () => context.push('/login'),
                child: Text(s.login),
              ),
            )
          : wishlist.error != null && wishlist.products.isEmpty
              ? ErrorView(
                  message: friendlyError(wishlist.error!),
                  onRetry: () => ref.read(wishlistProvider.notifier).load(),
                )
              : wishlist.loading && wishlist.products.isEmpty
              ? const ProductGridSkeleton(count: 6)
              : wishlist.products.isEmpty
                  ? EmptyState(
                      icon: Icons.favorite_border_rounded,
                      title: s.wishlistIsEmpty,
                      subtitle: s.wishlistAddHint,
                      action: ElevatedButton(
                        onPressed: () => ref.read(navIndexProvider.notifier).state = 0,
                        child: Text(s.browseProductsBtn),
                      ),
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () => ref.read(wishlistProvider.notifier).load(),
                      child: ProductGrid(products: wishlist.products),
                    ),
    );
  }
}
