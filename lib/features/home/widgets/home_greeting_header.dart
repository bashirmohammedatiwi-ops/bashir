import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cart/providers/cart_provider.dart';

/// رأس الصفحة الرئيسية الفاخر: تحية + Avatar أنيق + إشعارات + سلة.
class HomeGreetingHeader extends ConsumerWidget {
  const HomeGreetingHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).valueOrNull;
    final cartCount = ref.watch(cartCountProvider);
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'صباح الورد'
        : (hour < 18 ? 'مساء الفل' : 'مساء الياسمين');
    final first = user?.name.split(' ').first.trim() ?? '';
    final name = first.isNotEmpty ? first : 'جميلتي';

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.lg,
        AppSizes.xl,
        AppSizes.sm,
      ),
      child: Row(
        children: [
          _Avatar(initial: name.isNotEmpty ? name[0] : 'A'),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      width: 5,
                      height: 5,
                      decoration: const BoxDecoration(
                        color: AppColors.gold,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      greeting,
                      style: AppTextStyles.caption(
                        color: AppColors.textMuted,
                        size: 11,
                      ).copyWith(letterSpacing: 0.4),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      name,
                      style: AppTextStyles.headline(size: 17).copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(width: 6),
                    const Text('✦', style: TextStyle(color: AppColors.gold, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          Luxe.surfaceIconButton(
            icon: Icons.notifications_none_rounded,
            onTap: () => context.push('/notifications'),
          ),
          const SizedBox(width: 6),
          _CartButton(
            count: cartCount,
            onTap: () => context.go('/cart'),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.initial});
  final String initial;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: const BoxDecoration(
        gradient: AppColors.nightGradient,
        shape: BoxShape.circle,
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Gold ring
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.gold.withValues(alpha: 0.6),
                width: 1.2,
              ),
            ),
          ),
          Text(
            initial,
            style: AppTextStyles.serif(
              color: AppColors.gold,
              size: 22,
              weight: FontWeight.w400,
              style: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}

class _CartButton extends StatelessWidget {
  const _CartButton({required this.count, required this.onTap});
  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onTap,
      scale: 0.94,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: AppColors.surface,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.divider),
          boxShadow: const [AppColors.softShadow],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(
              Icons.shopping_bag_outlined,
              color: AppColors.textPrimary,
              size: 19,
            ),
            if (count > 0)
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.surface,
                      width: 1.5,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    count > 9 ? '9+' : '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                      height: 1,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// شريط بحث Premium (chip أنيق على الصفحة).
class HomeSearchBar extends StatelessWidget {
  const HomeSearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.xs,
        AppSizes.xl,
        AppSizes.lg,
      ),
      child: PressedScale(
        onTap: () => context.push('/search'),
        child: Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppSizes.inputRadius + 2),
            border: Border.all(color: AppColors.divider),
            boxShadow: const [AppColors.softShadow],
          ),
          child: Row(
            children: [
              const Icon(
                Icons.search_rounded,
                size: 19,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  AppStrings.searchHint,
                  style: AppTextStyles.body(
                    color: AppColors.textMuted,
                    size: 13,
                  ),
                ),
              ),
              Container(
                width: 1,
                height: 22,
                color: AppColors.divider,
              ),
              const SizedBox(width: 10),
              const Icon(
                Icons.tune_rounded,
                size: 17,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
