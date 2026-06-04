import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cart/providers/cart_provider.dart';

/// رأس الرئيسية — تحريري وأنيق.
class HomeGreetingHeader extends ConsumerWidget {
  const HomeGreetingHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).valueOrNull;
    final isGuest = ref.watch(isGuestProvider) && user == null;
    final cartCount = ref.watch(cartCountProvider);
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'صباح الورد'
        : (hour < 18 ? 'مساء الفل' : 'مساء الياسمين');
    final first = user?.name.split(' ').first.trim() ?? '';
    final name = isGuest
        ? AppStrings.guestGreeting
        : (first.isNotEmpty ? first : 'جميلتي');

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.lg,
        AppSizes.xl,
        0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  greeting,
                  style: AppTextStyles.caption(
                    color: AppColors.textMuted,
                    size: 11,
                  ).copyWith(letterSpacing: 0.6),
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: AppTextStyles.headline(size: 24).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.6,
                    height: 1.1,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          _IconAction(
            icon: Icons.notifications_none_rounded,
            onTap: () => context.push('/notifications'),
          ),
          const SizedBox(width: 4),
          _IconAction(
            icon: Icons.shopping_bag_outlined,
            badge: cartCount,
            onTap: () => context.go('/cart'),
          ),
        ],
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({
    required this.icon,
    required this.onTap,
    this.badge = 0,
  });

  final IconData icon;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: onTap,
          icon: Icon(icon, size: 24, color: AppColors.textPrimary),
          style: IconButton.styleFrom(
            minimumSize: const Size(40, 40),
            padding: EdgeInsets.zero,
          ),
        ),
        if (badge > 0)
          Positioned(
            top: 6,
            left: 6,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
          ),
      ],
    );
  }
}

/// شريط بحث ناعم.
class HomeSearchBar extends StatelessWidget {
  const HomeSearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.md,
        AppSizes.xl,
        AppSizes.lg,
      ),
      child: Material(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(16),
        elevation: 0,
        child: InkWell(
          onTap: () => context.push('/search'),
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 50,
            child: Row(
              children: [
                const SizedBox(width: 16),
                Icon(
                  Icons.search_rounded,
                  size: 21,
                  color: AppColors.primary.withValues(alpha: 0.7),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    AppStrings.searchHint,
                    style: AppTextStyles.body(
                      color: AppColors.textMuted,
                      size: 13,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
