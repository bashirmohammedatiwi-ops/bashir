import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_motion.dart';
import '../../core/utils/responsive.dart';
import '../home/widgets/home_theme.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';
import 'shell_nav_bar.dart';

export 'shell_nav_bar.dart' show ShellNavBar;

final navIndexProvider = StateProvider<int>((ref) => 0);

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  final _visited = <int>{0};

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(navIndexProvider);
    final cartCount = ref.watch(cartProvider.select((c) => c.count));
    final navHeight = Responsive.shellNavDockHeight(context);
    _visited.add(index);

    return Scaffold(
      backgroundColor: HomeTheme.canvas,
      floatingActionButton: FloatingActionButton(
        heroTag: 'assistant-fab',
        tooltip: ref.watch(stringsProvider).isAr ? 'المساعد الذكي' : 'AI Assistant',
        backgroundColor: HomeTheme.accent,
        onPressed: () => context.push('/assistant'),
        child: const Icon(Icons.auto_awesome, color: Colors.white),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          Padding(
            padding: EdgeInsets.only(bottom: navHeight),
            child: IndexedStack(
              index: index,
              sizing: StackFit.expand,
              children: [
                _TabEntrance(active: index == 0, child: const HomeScreen()),
                TickerMode(
                  enabled: index == 1,
                  child: _TabEntrance(
                    active: index == 1,
                    child: _visited.contains(1) ? const CategoriesScreen() : const SizedBox.shrink(),
                  ),
                ),
                TickerMode(
                  enabled: index == 2,
                  child: _TabEntrance(
                    active: index == 2,
                    child: _visited.contains(2) ? const OffersScreen() : const SizedBox.shrink(),
                  ),
                ),
                TickerMode(
                  enabled: index == 3,
                  child: _TabEntrance(
                    active: index == 3,
                    child: _visited.contains(3) ? const CartScreen() : const SizedBox.shrink(),
                  ),
                ),
                TickerMode(
                  enabled: index == 4,
                  child: _TabEntrance(
                    active: index == 4,
                    child: _visited.contains(4) ? const AccountScreen() : const SizedBox.shrink(),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: ShellNavBar(
              currentIndex: index,
              cartCount: cartCount,
              onSelect: _selectTab,
              strings: ref.watch(stringsProvider),
            ),
          ),
        ],
      ),
    );
  }

  void _selectTab(int i) {
    // اللمسة اللمسية تطلقها ShellNavBar نفسها عند النقر.
    ref.read(navIndexProvider.notifier).state = i;
  }
}

/// دخول التبويب عند التنشيط — fade-through خفيف مع رفعة بسيطة، مرة لكل تبديل.
/// يحافظ على حالة التبويبات (IndexedStack) عكس AnimatedSwitcher.
class _TabEntrance extends StatefulWidget {
  final bool active;
  final Widget child;

  const _TabEntrance({required this.active, required this.child});

  @override
  State<_TabEntrance> createState() => _TabEntranceState();
}

class _TabEntranceState extends State<_TabEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.fadeThrough);
    if (widget.active) _controller.value = 1;
  }

  @override
  void didUpdateWidget(_TabEntrance oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !oldWidget.active) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = Curves.easeOutCubic.transform(_controller.value);
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(0, (1 - t) * 8),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}
