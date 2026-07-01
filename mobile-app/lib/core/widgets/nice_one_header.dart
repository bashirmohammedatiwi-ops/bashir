import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/address.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/profile/profile_providers.dart';
import '../../features/shell/main_shell.dart';

/// هيدر Nice One — زجاجي شفاف فوق البنر أو مدمج عند التمرير.
class NiceOneHeader extends ConsumerWidget {
  final bool compact;
  final bool onLightBackground;
  const NiceOneHeader({super.key, this.compact = false, this.onLightBackground = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final unread = auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;
    String deliveryLabel = 'حدّد العنوان';

    if (auth.isAuthenticated) {
      final addresses = ref.watch(addressesProvider);
      deliveryLabel = addresses.maybeWhen(
        data: (list) {
          if (list.isEmpty) return 'أضف عنوان التوصيل';
          Address? def;
          for (final a in list) {
            if (a.isDefault) {
              def = a;
              break;
            }
          }
          final chosen = def ?? list.first;
          return chosen.summary.isNotEmpty ? chosen.summary : chosen.city;
        },
        orElse: () => deliveryLabel,
      );
    }

    return Padding(
      padding: EdgeInsets.fromLTRB(12, compact ? 2 : 4, 12, compact ? 4 : 8),
      child: Column(
        children: [
          if (!compact)
            GestureDetector(
              onTap: () {
                if (auth.isAuthenticated) {
                  context.push('/addresses');
                } else {
                  context.push('/login');
                }
              },
              child: Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width - 48),
                  child: _GlassPill(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    light: onLightBackground,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_on_outlined,
                            color: _fg(onLightBackground, 0.95), size: 16),
                        const SizedBox(width: 4),
                        Text(
                          'التوصيل إلى:',
                          style: TextStyle(
                            color: _fg(onLightBackground, 0.88),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            deliveryLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: _fg(onLightBackground, 0.98),
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Icon(Icons.keyboard_arrow_down_rounded,
                            color: _fg(onLightBackground, 0.9), size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          if (!compact) const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _SearchBar(
                onTap: () => context.push('/search'),
                onQrTap: () => context.push('/scan'),
                light: onLightBackground,
              )),
              const SizedBox(width: 8),
              _CircleBtn(
                icon: Icons.grid_view_rounded,
                light: onLightBackground,
                onTap: () => ref.read(navIndexProvider.notifier).state = 1,
              ),
              const SizedBox(width: 8),
              _CircleBtn(
                icon: Icons.notifications_none_rounded,
                light: onLightBackground,
                badgeCount: unread,
                onTap: () => context.push('/notifications'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _fg(bool light, double alpha) =>
      light ? Colors.black.withValues(alpha: alpha * 0.85) : Colors.white.withValues(alpha: alpha);
}

/// سطح زجاجي — ضبابية + شفافية + حدود لامعة.
class _GlassSurface extends StatelessWidget {
  final Widget child;
  final BorderRadius borderRadius;
  final EdgeInsetsGeometry? padding;
  final double blur;
  final double fillOpacity;
  final double borderOpacity;
  final bool light;

  const _GlassSurface({
    required this.child,
    required this.borderRadius,
    this.padding,
    this.blur = 14,
    this.fillOpacity = 0.22,
    this.borderOpacity = 0.42,
    this.light = false,
  });

  @override
  Widget build(BuildContext context) {
    final fill = light ? Colors.white.withValues(alpha: 0.95) : Colors.white.withValues(alpha: fillOpacity);
    final border = light
        ? Colors.black.withValues(alpha: 0.08)
        : Colors.white.withValues(alpha: borderOpacity);
    return ClipRRect(
      borderRadius: borderRadius,
      child: light
          ? DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: borderRadius,
                color: fill,
                border: Border.all(color: border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: padding != null ? Padding(padding: padding!, child: child) : child,
            )
          : BackdropFilter(
              filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: borderRadius,
                  color: fill,
                  border: Border.all(color: border, width: 0.75),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: padding != null ? Padding(padding: padding!, child: child) : child,
              ),
            ),
    );
  }
}

class _GlassPill extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool light;
  const _GlassPill({required this.child, required this.padding, this.light = false});

  @override
  Widget build(BuildContext context) {
    return _GlassSurface(
      borderRadius: BorderRadius.circular(20),
      padding: padding,
      blur: 12,
      fillOpacity: light ? 0.95 : 0.16,
      borderOpacity: light ? 0.08 : 0.35,
      light: light,
      child: child,
    );
  }
}

class _SearchBar extends StatelessWidget {
  final VoidCallback onTap;
  final VoidCallback? onQrTap;
  final bool light;
  const _SearchBar({required this.onTap, this.onQrTap, this.light = false});

  Color _fg(double a) => light ? Colors.black.withValues(alpha: a * 0.7) : Colors.white.withValues(alpha: a);

  @override
  Widget build(BuildContext context) {
    return _GlassSurface(
      borderRadius: BorderRadius.circular(12),
      blur: 16,
      fillOpacity: light ? 0.95 : 0.24,
      light: light,
      child: SizedBox(
        height: 42,
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: onTap,
                behavior: HitTestBehavior.opaque,
                child: Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Icon(Icons.search_rounded, color: _fg(0.92), size: 21),
                    ),
                    Expanded(
                      child: Text(
                        'ابحث عن منتج، براند…',
                        style: TextStyle(color: _fg(0.78), fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(width: 1, height: 22, color: _fg(0.28)),
            GestureDetector(
              onTap: onQrTap ?? onTap,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Icon(Icons.qr_code_scanner_rounded, color: _fg(0.9), size: 21),
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
  final bool light;
  final int badgeCount;
  const _CircleBtn({
    required this.icon,
    required this.onTap,
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
              borderRadius: BorderRadius.circular(21),
              blur: 14,
              fillOpacity: light ? 0.95 : 0.24,
              light: light,
              child: SizedBox(
                width: 42,
                height: 42,
                child: Icon(
                  icon,
                  size: 20,
                  color: light
                      ? Colors.black.withValues(alpha: 0.75)
                      : Colors.white.withValues(alpha: 0.95),
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
