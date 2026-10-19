import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_snackbar.dart';
import '../advisor/widgets/advisor_launcher.dart';
import '../auth/auth_provider.dart';
import '../brands/brands_screen.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';
import '../worlds/world_theme.dart';
import 'nav_tabs.dart';
import 'shell_nav_bar.dart';

export 'shell_nav_bar.dart' show ShellNavBar;

final navIndexProvider = StateProvider<int>((ref) => 0);

/// يزداد عند لمس تبويب "الرئيسية" وهي مفتوحة — الرئيسية تصعد للأعلى.
final homeScrollToTopProvider = StateProvider<int>((ref) => 0);

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
    final theme = ref.watch(activeWorldThemeProvider);
    final navHeight = Responsive.shellNavDockHeight(context);
    _visited.add(index);

    // انتهت الجلسة من السيرفر (رفض التجديد): نخبرها ونعرض الدخول بلمسة.
    ref.listen<int>(sessionExpiredProvider, (prev, next) {
      if (next <= (prev ?? 0) || !context.mounted) return;
      final s = ref.read(stringsProvider);
      AppSnackbar.action(
        context,
        message: s.sessionExpired,
        actionLabel: s.login,
        onAction: () {
          if (context.mounted) context.push('/login');
        },
      );
    });

    // ثيم العالم يأتي من جذر التطبيق (appThemeDataProvider) — هنا لون الخلفية فقط.
    return AnimatedContainer(
      duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      color: theme.canvas,
      child: Scaffold(
        backgroundColor: theme.canvas,
        body: Stack(
          fit: StackFit.expand,
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: navHeight),
              // كل إشعار يُفتح من التبويبات يظهر فوق الشريط العائم لا عليه.
              child: ShellDockInsets(
                height: navHeight,
                child: IndexedStack(
                  index: index,
                  sizing: StackFit.expand,
                  children: [
                    TickerMode(enabled: index == 0, child: const HomeScreen()),
                    TickerMode(
                      enabled: index == NavTabs.categories,
                      child: _visited.contains(NavTabs.categories) ? const _DarkStatusBar(child: CategoriesScreen()) : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.offers,
                      child: _visited.contains(NavTabs.offers) ? const _DarkStatusBar(child: OffersScreen()) : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.cart,
                      child: _visited.contains(NavTabs.cart) ? const _DarkStatusBar(child: CartScreen()) : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.account,
                      child: _visited.contains(NavTabs.account) ? const _DarkStatusBar(child: AccountScreen()) : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.brands,
                      child: _visited.contains(NavTabs.brands)
                          ? const _DarkStatusBar(child: BrandsScreen(embedded: true))
                          : const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),
            PositionedDirectional(
              end: 14,
              bottom: navHeight + 12,
              child: AdvisorLauncher(visible: index == NavTabs.home),
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
                theme: theme,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _selectTab(int i) {
    if (i == ref.read(navIndexProvider)) {
      if (i == NavTabs.home) ref.read(homeScrollToTopProvider.notifier).state++;
      // لمسة ثانية على تبويب مفتوح: البراندات والأقسام تمسح البحث وتصعد لأعلى.
      ref.read(tabReselectProvider.notifier).update((r) => (tab: i, tick: r.tick + 1));
    }
    ref.read(navIndexProvider.notifier).state = i;
  }
}

/// تبويبات الخلفية الفاتحة — أيقونات شريط الحالة داكنة دائماً
/// (الرئيسية تدير شريطها بنفسها لأنها تبدأ فوق صورة).
class _DarkStatusBar extends StatelessWidget {
  final Widget child;
  const _DarkStatusBar({required this.child});

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
        child: child,
      );
}
