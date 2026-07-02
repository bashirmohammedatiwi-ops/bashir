import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/profile/profile_providers.dart';
import '../../features/shell/main_shell.dart';

/// هيدر الصفحة الرئيسية — زجاجي شفاف يتحوّل تدريجياً عند التمرير.
class NiceOneHeader extends ConsumerWidget {
  /// 0 = أعلى الصفحة، 1 = بعد التمرير الكافي.
  final double scrollProgress;

  const NiceOneHeader({super.key, this.scrollProgress = 0});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final unread = auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;
    final light = scrollProgress > 0.35;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 6),
      child: Row(
        children: [
          Expanded(
            child: _SearchBar(
              onTap: () => context.push('/search'),
              onBarcodeTap: () => context.push('/scan'),
              scrollProgress: scrollProgress,
              light: light,
            ),
          ),
          const SizedBox(width: 8),
          _CircleBtn(
            icon: Icons.grid_view_rounded,
            scrollProgress: scrollProgress,
            light: light,
            onTap: () => ref.read(navIndexProvider.notifier).state = 1,
          ),
          const SizedBox(width: 8),
          _CircleBtn(
            icon: Icons.notifications_none_rounded,
            scrollProgress: scrollProgress,
            light: light,
            badgeCount: unread,
            onTap: () => context.push('/notifications'),
          ),
        ],
      ),
    );
  }
}

/// سطح زجاجي — شفافية تتدرج مع التمرير.
class _GlassSurface extends StatelessWidget {
  final Widget child;
  final BorderRadius borderRadius;
  final double scrollProgress;
  final bool light;

  const _GlassSurface({
    required this.child,
    required this.borderRadius,
    required this.scrollProgress,
    this.light = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = scrollProgress.clamp(0.0, 1.0);
    final blur = ui.lerpDouble(10, 0, t)!;
    final fillOpacity = light
        ? ui.lerpDouble(0.72, 0.98, (t - 0.35).clamp(0.0, 1.0) / 0.65)!
        : ui.lerpDouble(0.10, 0.88, t)!;
    final borderOpacity = light
        ? ui.lerpDouble(0.06, 0.1, t)!
        : ui.lerpDouble(0.22, 0.08, t)!;

    final fill = light
        ? Colors.white.withValues(alpha: fillOpacity)
        : Colors.white.withValues(alpha: fillOpacity);
    final border = light
        ? Colors.black.withValues(alpha: borderOpacity)
        : Colors.white.withValues(alpha: borderOpacity);

    final decorated = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        color: fill,
        border: Border.all(color: border, width: 0.75),
        boxShadow: t > 0.15
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05 * t),
                  blurRadius: 8 * t,
                  offset: Offset(0, 2 * t),
                ),
              ]
            : null,
      ),
      child: child,
    );

    if (light || blur < 2) {
      return ClipRRect(borderRadius: borderRadius, child: decorated);
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: decorated,
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  final VoidCallback onTap;
  final VoidCallback? onBarcodeTap;
  final double scrollProgress;
  final bool light;

  const _SearchBar({
    required this.onTap,
    this.onBarcodeTap,
    required this.scrollProgress,
    this.light = false,
  });

  Color _fg(double a) =>
      light ? Colors.black.withValues(alpha: a * 0.78) : Colors.white.withValues(alpha: a);

  @override
  Widget build(BuildContext context) {
    return _GlassSurface(
      borderRadius: BorderRadius.circular(14),
      scrollProgress: scrollProgress,
      light: light,
      child: SizedBox(
        height: 44,
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: onTap,
                behavior: HitTestBehavior.opaque,
                child: Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Icon(Icons.search_rounded, color: _fg(0.95), size: 22),
                    ),
                    Expanded(
                      child: Text(
                        'ابحث عن منتج، براند…',
                        style: TextStyle(
                          color: _fg(0.8),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(width: 1, height: 22, color: _fg(0.22)),
            GestureDetector(
              onTap: onBarcodeTap ?? onTap,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Icon(Icons.barcode_reader, color: _fg(0.92), size: 22),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final double scrollProgress;
  final bool light;
  final int badgeCount;

  const _CircleBtn({
    required this.icon,
    required this.onTap,
    required this.scrollProgress,
    this.light = false,
    this.badgeCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            _GlassSurface(
              borderRadius: BorderRadius.circular(22),
              scrollProgress: scrollProgress,
              light: light,
              child: SizedBox(
                width: 44,
                height: 44,
                child: Icon(
                  icon,
                  size: 20,
                  color: light
                      ? Colors.black.withValues(alpha: 0.72)
                      : Colors.white.withValues(alpha: 0.96),
                ),
              ),
            ),
            if (badgeCount > 0)
              Positioned(
                top: -2,
                right: -2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                  decoration: BoxDecoration(
                    color: AppColors.sale,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    badgeCount > 9 ? '9+' : '$badgeCount',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      height: 1.1,
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
