import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/reveal.dart';
import '../../../data/models/loyalty_model.dart';
import '../../../core/auth/auth_guard.dart';
import '../../../core/constants/app_routes.dart';
import '../../auth/providers/auth_provider.dart';
import '../../loyalty/providers/loyalty_provider.dart';
import '../../wishlist/providers/wishlist_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).valueOrNull;
    final isGuest = ref.watch(isGuestProvider) && user == null;
    final loyalty = ref.watch(loyaltyProvider);
    final wishlistCount = ref.watch(wishlistCountProvider);

    Future<void> openProtected(VoidCallback action) async {
      if (isGuest) {
        if (await requireLogin(context, ref)) action();
        return;
      }
      action();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _ProfileHero(
              name: isGuest ? AppStrings.guestGreeting : (user?.name ?? ''),
              phone: isGuest ? AppStrings.guestProfileHint : (user?.phone ?? ''),
              tier: isGuest ? 'زائر' : loyalty.tier.label,
              points: isGuest ? 0 : loyalty.points,
              onEdit: isGuest
                  ? () => requireLogin(context, ref)
                  : () => context.push('/edit-profile'),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSizes.xl,
                vertical: AppSizes.lg,
              ),
              child: _StatsRow(
                orders: user?.orderCount ?? 0,
                wishlist: wishlistCount,
                points: loyalty.points,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSizes.xl,
              vertical: AppSizes.sm,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _SectionLabel('حسابي'),
                Reveal(
                  delay: const Duration(milliseconds: 80),
                  child: _Menu(
                    items: [
                      _MenuData(
                        icon: Icons.shopping_bag_outlined,
                        title: AppStrings.myOrders,
                        subtitle: '${user?.orderCount ?? 3} طلبات',
                        onTap: () => openProtected(() => context.push('/orders')),
                      ),
                      _MenuData(
                        icon: Icons.favorite_outline_rounded,
                        title: AppStrings.wishlist,
                        subtitle: '$wishlistCount منتج',
                        onTap: () => context.push('/wishlist'),
                      ),
                      _MenuData(
                        icon: Icons.diamond_outlined,
                        title: AppStrings.loyaltyPoints,
                        subtitle: isGuest
                            ? 'سجّلي الدخول للمتابعة'
                            : 'لديكِ ${CurrencyFormatter.formatPoints(loyalty.points)} نقطة',
                        onTap: () => openProtected(() => context.push('/loyalty')),
                      ),
                      _MenuData(
                        icon: Icons.location_on_outlined,
                        title: AppStrings.addresses,
                        onTap: () => openProtected(() => context.push('/addresses')),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSizes.md),
                _SectionLabel('الدعم والخدمات'),
                Reveal(
                  delay: const Duration(milliseconds: 160),
                  child: _Menu(
                    items: [
                      _MenuData(
                        icon: Icons.chat_bubble_outline_rounded,
                        title: AppStrings.chatSupport,
                        onTap: () => context.push('/chat'),
                      ),
                      _MenuData(
                        icon: Icons.support_agent_rounded,
                        title: AppStrings.whatsapp,
                        accent: AppColors.whatsapp,
                        onTap: () => launchUrl(
                          Uri.parse(
                              'https://wa.me/${AppStrings.whatsappNumber}'),
                        ),
                      ),
                      _MenuData(
                        icon: Icons.phone_outlined,
                        title: AppStrings.call,
                        onTap: () => launchUrl(
                          Uri.parse('tel:${AppStrings.storePhone}'),
                        ),
                      ),
                      _MenuData(
                        icon: Icons.notifications_outlined,
                        title: AppStrings.notifications,
                        onTap: () => openProtected(() => context.push('/notifications')),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSizes.md),
                _SectionLabel('قانوني'),
                Reveal(
                  delay: const Duration(milliseconds: 240),
                  child: _Menu(
                    items: [
                      _MenuData(
                        icon: Icons.info_outline_rounded,
                        title: AppStrings.about,
                        onTap: () {},
                      ),
                      _MenuData(
                        icon: Icons.privacy_tip_outlined,
                        title: AppStrings.privacy,
                        onTap: () {},
                      ),
                      _MenuData(
                        icon: Icons.description_outlined,
                        title: AppStrings.terms,
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSizes.xl),
                if (isGuest)
                  _GuestAuthCard(
                    onLogin: () => context.push(AppRoutes.login),
                    onRegister: () => context.push(AppRoutes.register),
                    onExitGuest: () async {
                      await ref.read(authProvider.notifier).exitGuestMode();
                      if (context.mounted) context.go(AppRoutes.login);
                    },
                  )
                else
                  _LogoutButton(
                    onLogout: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          backgroundColor: AppColors.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppSizes.cardRadius),
                          ),
                          title: Text(
                            'تسجيل الخروج',
                            style: AppTextStyles.title(size: 15).copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          content: Text(
                            'هل أنتِ متأكدة من تسجيل الخروج؟',
                            style: AppTextStyles.body(size: 13),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: const Text('إلغاء'),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: const Text(
                                'خروج',
                                style: TextStyle(color: AppColors.error),
                              ),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        await ref.read(authProvider.notifier).logout();
                        if (context.mounted) context.go(AppRoutes.login);
                      }
                    },
                  ),
                const SizedBox(height: 140),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.name,
    required this.phone,
    required this.tier,
    required this.points,
    required this.onEdit,
  });

  final String name;
  final String phone;
  final String tier;
  final int points;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 22),
      decoration: const BoxDecoration(
        gradient: AppColors.nightGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Stack(
        children: [
          // Decorative ring
          Positioned(
            top: 0,
            right: -40,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.2),
                ),
              ),
            ),
          ),
          // Edit button
          PositionedDirectional(
            top: 0,
            end: 0,
            child: PressedScale(
              onTap: onEdit,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.3),
                  ),
                ),
                child: const Icon(
                  Icons.edit_outlined,
                  color: AppColors.gold,
                  size: 16,
                ),
              ),
            ),
          ),
          Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.gold, Color(0xFFB8975A)],
                    begin: Alignment.topRight,
                    end: Alignment.bottomLeft,
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.4),
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withValues(alpha: 0.35),
                      blurRadius: 22,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    name.isNotEmpty ? name[0] : '?',
                    style: AppTextStyles.serif(
                      color: AppColors.primaryDark,
                      size: 36,
                      weight: FontWeight.w400,
                      style: FontStyle.italic,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: AppTextStyles.editorial(
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                phone,
                style: AppTextStyles.caption(
                  color: Colors.white.withValues(alpha: 0.7),
                  size: 12,
                ).copyWith(letterSpacing: 0.5),
              ),
              const SizedBox(height: 12),
              Luxe.editorialBadge(
                label: tier,
                icon: Icons.workspace_premium_rounded,
                color: AppColors.gold,
                backgroundColor: AppColors.gold.withValues(alpha: 0.14),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.orders,
    required this.wishlist,
    required this.points,
  });
  final int orders;
  final int wishlist;
  final int points;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.divider),
        boxShadow: const [AppColors.softShadow],
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatBox(
              value: '$orders',
              label: 'الطلبات',
              color: AppColors.primaryDark,
            ),
          ),
          Container(width: 1, height: 36, color: AppColors.divider),
          Expanded(
            child: _StatBox(
              value: '$wishlist',
              label: 'المفضلة',
              color: AppColors.rose,
            ),
          ),
          Container(width: 1, height: 36, color: AppColors.divider),
          Expanded(
            child: _StatBox(
              value: CurrencyFormatter.formatPoints(points),
              label: 'النقاط',
              color: AppColors.gold,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.value,
    required this.label,
    required this.color,
  });
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: AppTextStyles.serif(
            color: color,
            size: 18,
            weight: FontWeight.w500,
            style: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AppTextStyles.caption(
            color: AppColors.textMuted,
            size: 10.5,
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 12, 2, 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 14,
            decoration: BoxDecoration(
              color: AppColors.gold,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 11,
            ).copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuData {
  const _MenuData({
    required this.icon,
    required this.title,
    this.subtitle,
    this.accent,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? accent;
  final VoidCallback onTap;
}

class _Menu extends StatelessWidget {
  const _Menu({required this.items});
  final List<_MenuData> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.divider),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (int i = 0; i < items.length; i++) ...[
            _MenuRow(data: items[i]),
            if (i != items.length - 1)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 14),
                height: 1,
                color: AppColors.divider,
              ),
          ],
        ],
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({required this.data});
  final _MenuData data;

  @override
  Widget build(BuildContext context) {
    final accent = data.accent ?? AppColors.primaryDark;
    return PressedScale(
      onTap: data.onTap,
      scale: 0.99,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSizes.tinyRadius + 2),
              ),
              child: Icon(data.icon, color: accent, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    data.title,
                    style: AppTextStyles.title(size: 13.5).copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (data.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      data.subtitle!,
                      style: AppTextStyles.caption(
                        color: AppColors.textMuted,
                        size: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 13,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}

class _GuestAuthCard extends StatelessWidget {
  const _GuestAuthCard({
    required this.onLogin,
    required this.onRegister,
    required this.onExitGuest,
  });

  final VoidCallback onLogin;
  final VoidCallback onRegister;
  final VoidCallback onExitGuest;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Luxe.primaryButton(
          label: AppStrings.login,
          icon: Icons.login_rounded,
          onTap: onLogin,
        ),
        const SizedBox(height: 10),
        Luxe.outlinedButton(
          label: AppStrings.register,
          icon: Icons.person_add_outlined,
          onTap: onRegister,
        ),
        const SizedBox(height: 14),
        TextButton(
          onPressed: onExitGuest,
          child: Text(
            'الخروج من وضع الزائر',
            style: AppTextStyles.caption(color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onLogout});
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onLogout,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
          border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.logout_rounded,
                color: AppColors.error,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                AppStrings.logout,
                style: AppTextStyles.title(
                  color: AppColors.error,
                  size: 13,
                ).copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
