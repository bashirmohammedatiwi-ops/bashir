import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../shell/main_shell.dart';
import '../../shell/nav_tabs.dart';
import '../../worlds/world_theme.dart';
import 'home_animations.dart';
import 'home_theme.dart';

class HomeQuickDock extends ConsumerWidget {
  const HomeQuickDock({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(activeWorldThemeProvider);
    final s = ref.s;
    final items = [
      _Item(Icons.local_offer_outlined, s.quickOffers, () {
        ref.read(navIndexProvider.notifier).state = NavTabs.offers;
      }),
      _Item(Icons.grid_view_rounded, s.navCategories, () {
        ref.read(navIndexProvider.notifier).state = NavTabs.categories;
      }),
      // تبويب البراندات كإخوته — لا دفع '/brands' الذي يكدّس نسخة ثانية من الواجهة.
      _Item(Icons.storefront_outlined, s.quickBrands, () {
        ref.read(navIndexProvider.notifier).state = NavTabs.brands;
      }),
      _Item(Icons.favorite_border_rounded, s.quickWishlist, () {
        context.push('/wishlist');
      }),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        HomeTheme.paddingH,
        12,
        HomeTheme.paddingH,
        0,
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
          border: Border.all(color: t.divider),
        ),
        child: Row(children: [for (final item in items) Expanded(child: item)]),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _Item(this.icon, this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: HomeTapScale(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [t.accent.withValues(alpha: 0.14), t.accentLight],
                ),
                shape: BoxShape.circle,
                border: Border.all(color: t.divider),
              ),
              alignment: Alignment.center,
              child: Icon(icon, size: 20, color: t.accentDark),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              style: HomeTheme.circleLabel.copyWith(
                fontSize: 10,
                color: t.inkSoft,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
