import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/product_card.dart';
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

    return Scaffold(
      appBar: AppBar(title: const Text('المفضلة')),
      body: !auth.isAuthenticated
          ? EmptyState(
              icon: Icons.favorite_border_rounded,
              title: 'سجّل الدخول لعرض المفضلة',
              subtitle: 'احفظ منتجاتك المفضلة وتابعها بسهولة',
              action: ElevatedButton(
                onPressed: () => context.push('/login'),
                child: const Text('تسجيل الدخول'),
              ),
            )
          : wishlist.loading && wishlist.products.isEmpty
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : wishlist.products.isEmpty
                  ? EmptyState(
                      icon: Icons.favorite_border_rounded,
                      title: 'قائمة المفضلة فارغة',
                      subtitle: 'أضف منتجات لتجدها هنا',
                      action: ElevatedButton(
                        onPressed: () => ref.read(navIndexProvider.notifier).state = 0,
                        child: const Text('تصفّح المنتجات'),
                      ),
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () => ref.read(wishlistProvider.notifier).load(),
                      child: GridView.builder(
                        padding: const EdgeInsets.all(12),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.6,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: wishlist.products.length,
                        itemBuilder: (_, i) => ProductCard(product: wishlist.products[i]),
                      ),
                    ),
    );
  }
}
