import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/auth_provider.dart';
import '../../profile/profile_providers.dart';
import '../../shell/main_shell.dart';
import 'home_theme.dart';

/// هيدر الرئيسية — علامة في الوسط، أيقونات رفيعة، بحث كبسولة.
class HomeHeader extends ConsumerWidget {
  final double scrollProgress;

  const HomeHeader({super.key, this.scrollProgress = 0});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final unread =
        auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;
    final solid = scrollProgress > 0.06;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      padding: const EdgeInsets.fromLTRB(
        HomeTheme.paddingH,
        2,
        HomeTheme.paddingH,
        12,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: solid ? 0.92 : 0),
        border: Border(
          bottom: BorderSide(
            color: HomeTheme.blushDeep.withValues(alpha: solid ? 0.7 : 0),
            width: 0.5,
          ),
        ),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 44,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Brand mark — center
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: HomeTheme.petal,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.spa_outlined,
                        size: 15,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'الحياة',
                      style: HomeTheme.displayTitle(size: 22),
                    ),
                  ],
                ),
                // Actions — trailing edge (RTL: start = right)
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _IconBtn(
                        icon: Icons.shopping_bag_outlined,
                        onTap: () => context.push('/cart'),
                      ),
                      const SizedBox(width: 2),
                      _IconBtn(
                        icon: Icons.notifications_none_rounded,
                        badge: unread,
                        onTap: () => context.push('/notifications'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _SearchPill(
            onTap: () => context.push('/search'),
            onScan: () => context.push('/scan'),
            onCategories: () => ref.read(navIndexProvider.notifier).state = 1,
          ),
        ],
      ),
    );
  }
}

class _SearchPill extends StatelessWidget {
  final VoidCallback onTap;
  final VoidCallback onScan;
  final VoidCallback onCategories;

  const _SearchPill({
    required this.onTap,
    required this.onScan,
    required this.onCategories,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
        border: Border.all(color: HomeTheme.blushDeep.withValues(alpha: 0.8)),
        boxShadow: HomeTheme.whisperLift,
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: onTap,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsetsDirectional.only(start: 18, end: 8),
                child: Row(
                  children: [
                    Icon(
                      Icons.search_rounded,
                      size: 20,
                      color: HomeTheme.inkMuted,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'ابحثي عن منتج أو براند…',
                        style: HomeTheme.body(size: 14, color: HomeTheme.inkMuted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          _MiniAction(
            icon: Icons.qr_code_scanner_rounded,
            onTap: onScan,
          ),
          _MiniAction(
            icon: Icons.grid_view_rounded,
            onTap: onCategories,
            last: true,
          ),
        ],
      ),
    );
  }
}

class _MiniAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool last;

  const _MiniAction({
    required this.icon,
    required this.onTap,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 44,
        height: 50,
        margin: EdgeInsetsDirectional.only(end: last ? 4 : 0),
        alignment: Alignment.center,
        child: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: HomeTheme.mist,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 18, color: HomeTheme.inkSoft),
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final int badge;

  const _IconBtn({
    required this.icon,
    required this.onTap,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            SizedBox(
              width: 40,
              height: 40,
              child: Icon(icon, size: 22, color: HomeTheme.ink),
            ),
            if (badge > 0)
              Positioned(
                top: 4,
                left: 4,
                child: Container(
                  width: 15,
                  height: 15,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.sale,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    badge > 9 ? '9+' : '$badge',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
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
