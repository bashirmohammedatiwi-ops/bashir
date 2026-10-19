import 'dart:async';
import 'dart:math' as math;

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
import '../compare/compare_provider.dart';
import '../compare/compare_tray.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';
import '../update/app_update.dart';
import '../worlds/world_theme.dart';
import 'nav_tabs.dart';
import 'shell_nav_bar.dart';

export 'shell_nav_bar.dart' show ShellNavBar;

final navIndexProvider = StateProvider<int>((ref) => 0);

/// ارتفاع شريط المقارنة العائم مع فراغه — ترتفع «ديما» بقدره حين يظهر.
const double _trayLift = 62;

/// يزداد عند لمس تبويب "الرئيسية" وهي مفتوحة — الرئيسية تصعد للأعلى.
final homeScrollToTopProvider = StateProvider<int>((ref) => 0);

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  final _visited = <int>{0};

  /// «رجوع» مرتين خلال ثانيتين على الرئيسية = خروج؛ الأولى تنبيه فقط.
  static const _exitWindow = Duration(seconds: 2);
  bool _exitArmed = false;
  Timer? _exitTimer;

  @override
  void dispose() {
    _exitTimer?.cancel();
    super.dispose();
  }

  /// زر الرجوع في أندرويد: من أي تبويب يعود للرئيسية أولاً، ومن الرئيسية
  /// يطلب ضغطة ثانية قبل إغلاق المتجر — فلا يخرج أحد منه بالخطأ وسط التسوق.
  void _onBack(bool didPop) {
    if (didPop) return;
    if (ref.read(navIndexProvider) != NavTabs.home) {
      _selectTab(NavTabs.home);
      return;
    }
    setState(() => _exitArmed = true);
    AppSnackbar.show(
      context,
      ref.read(stringsProvider).pressBackAgainToExit,
      duration: _exitWindow,
    );
    _exitTimer?.cancel();
    _exitTimer = Timer(_exitWindow, () {
      if (mounted) setState(() => _exitArmed = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(navIndexProvider);
    final cartCount = ref.watch(cartProvider.select((c) => c.count));
    final theme = ref.watch(activeWorldThemeProvider);
    final softUpdate = ref.watch(softUpdateVisibleProvider);
    final launcherOn = index == NavTabs.home && !softUpdate;
    final navHeight = Responsive.shellNavDockHeight(context);
    // شريط المقارنة: ليس فوق أزرار السلة وحسابي، ولا مع بطاقة التحديث في المكان نفسه.
    final trayAllowed = index != NavTabs.cart && index != NavTabs.account && !softUpdate;
    final trayOn = trayAllowed &&
        ref.watch(compareProvider.select((c) => c.canCompare && !c.trayDismissed));
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    _visited.add(index);

    // انتهت الجلسة من السيرفر (رفض التجديد): نخبرها ونعرض الدخول بلمسة.
    ref.listen<int>(sessionExpiredProvider, (prev, next) {
      if (next <= (prev ?? 0) || !context.mounted) return;
      final s = ref.read(stringsProvider);
      AppSnackbar.action(
        context,
        message: s.sessionExpired,
        actionLabel: s.signInAgain,
        onAction: () {
          if (context.mounted) context.push('/login');
        },
      );
    });

    // تبويب في المكدّس: مؤقّتاته تعمل وهو ظاهر فقط، ولوحة المفاتيح تخصّه وحده.
    Widget tab(int i, Widget child) => _TabInsets(
          active: index == i,
          dock: navHeight,
          child: TickerMode(enabled: index == i, child: child),
        );

    // ثيم العالم يأتي من جذر التطبيق (appThemeDataProvider) — هنا لون الخلفية فقط.
    return PopScope(
      canPop: index == NavTabs.home && _exitArmed,
      onPopInvokedWithResult: (didPop, _) => _onBack(didPop),
      child: AnimatedContainer(
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        color: theme.canvas,
        child: Scaffold(
          backgroundColor: theme.canvas,
          // لا نصغّر الهيكل كله مع لوحة المفاتيح: كان كل إطار من حركة اللوحة يعيد
          // تخطيط كل التبويبات في IndexedStack. التبويب الظاهر وحده يرى ارتفاع
          // اللوحة (عبر _TabInsets) وتصغّر سقالته جسمه بنفسها.
          resizeToAvoidBottomInset: false,
          body: Stack(
            fit: StackFit.expand,
            children: [
              Padding(
                padding: EdgeInsets.only(bottom: navHeight),
                // كل إشعار يُفتح من التبويبات يظهر فوق الشريط العائم لا عليه.
                child: ShellDockInsets(
                  height: navHeight,
                  // التبويبات تحجز أسفل محتواها مساحة شريط المقارنة ما دام ظاهراً.
                  child: ShellFloatingReserve(
                    extra: trayOn ? _trayLift : 0,
                    // طبقة رسم مستقلة عن الشريط وأزرار الطفو فوقها.
                    child: RepaintBoundary(
                      child: IndexedStack(
                        index: index,
                        sizing: StackFit.expand,
                        children: [
                          tab(NavTabs.home, const HomeScreen()),
                          tab(
                            NavTabs.categories,
                            _visited.contains(NavTabs.categories)
                                ? const _DarkStatusBar(child: CategoriesScreen())
                                : const SizedBox.shrink(),
                          ),
                          tab(
                            NavTabs.offers,
                            _visited.contains(NavTabs.offers)
                                ? const _DarkStatusBar(child: OffersScreen())
                                : const SizedBox.shrink(),
                          ),
                          tab(
                            NavTabs.cart,
                            _visited.contains(NavTabs.cart)
                                ? const _DarkStatusBar(child: CartScreen())
                                : const SizedBox.shrink(),
                          ),
                          tab(
                            NavTabs.account,
                            _visited.contains(NavTabs.account)
                                ? const _DarkStatusBar(child: AccountScreen())
                                : const SizedBox.shrink(),
                          ),
                          tab(
                            NavTabs.brands,
                            _visited.contains(NavTabs.brands)
                                ? const _DarkStatusBar(
                                    child: BrandsScreen(embedded: true),
                                  )
                                : const SizedBox.shrink(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              // صور المقارنة والعدد و«قارني الآن» — فوق الشريط مباشرة.
              PositionedDirectional(
                start: 16,
                end: 16,
                bottom: navHeight + 10,
                child: CompareTray(allowed: trayAllowed),
              ),
              // «ديما» على الرئيسية فقط، وتختفي ما دامت بطاقة التحديث ظاهرة فلا
              // يتراكبان. خارجها تبقى حالتها لكن تُطفأ مؤقّتاتها (TickerMode)
              // فلا ترسم إطارات وهي مخفية — وتُخفى فوراً كي لا تتجمّد نصف ظاهرة.
              // شريط المقارنة ظاهر: تصعد فوقه بدل أن تغطّيه.
              AnimatedPositionedDirectional(
                duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 240),
                curve: Curves.easeOutCubic,
                end: 14,
                bottom: navHeight + 12 + (trayOn ? _trayLift : 0),
                child: Visibility(
                  visible: launcherOn,
                  maintainState: true,
                  child: AdvisorLauncher(visible: launcherOn),
                ),
              ),
              if (softUpdate)
                PositionedDirectional(
                  start: 16,
                  end: 16,
                  bottom: navHeight + 8,
                  child: const SoftUpdateCard(),
                ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                // طبقة رسم مستقلة: تمرير التبويبات لا يعيد رسم الشريط ولا العكس.
                child: RepaintBoundary(
                  child: ShellNavBar(
                    currentIndex: index,
                    cartCount: cartCount,
                    onSelect: _selectTab,
                    strings: ref.watch(stringsProvider),
                    theme: theme,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectTab(int i) {
    if (i == ref.read(navIndexProvider)) {
      if (i == NavTabs.home) ref.read(homeScrollToTopProvider.notifier).state++;
      // لمسة ثانية على تبويب مفتوح: البراندات والأقسام تمسح البحث وتصعد لأعلى.
      ref
          .read(tabReselectProvider.notifier)
          .update((r) => (tab: i, tick: r.tick + 1));
    }
    ref.read(navIndexProvider.notifier).state = i;
  }
}

/// لوحة المفاتيح للتبويب الظاهر فقط: ارتفاعها ناقص مساحة الشريط (التبويبات
/// تنتهي فوقه أصلاً) فتصغّر سقالة التبويب جسمه حتى حافة اللوحة تماماً.
/// التبويبات المخفية ترى بيانات ثابتة بلا لوحة، فلا تُعاد بناءً ولا تخطيطاً مع
/// كل إطار من حركتها.
class _TabInsets extends StatelessWidget {
  final bool active;
  final double dock;
  final Widget child;

  const _TabInsets({required this.active, required this.dock, required this.child});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final keyboard = mq.viewInsets.bottom;
    if (keyboard <= 0) return MediaQuery(data: mq, child: child);
    final data = active
        ? mq.copyWith(viewInsets: mq.viewInsets.copyWith(bottom: math.max(0.0, keyboard - dock)))
        // كما لو لا لوحة: بلا إزاحة، والحشوة السفلية كاملة (لا تنقص مع ارتفاع اللوحة).
        : mq.copyWith(
            viewInsets: EdgeInsets.zero,
            padding: mq.padding.copyWith(bottom: mq.viewPadding.bottom),
          );
    return MediaQuery(data: data, child: child);
  }
}

/// تبويبات الخلفية السادة — أيقونات شريط الحالة عكس سطوع الثيم
/// (داكنة في الفاتح، فاتحة في الليلي). الرئيسية تدير شريطها بنفسها لأنها تبدأ فوق صورة.
class _DarkStatusBar extends StatelessWidget {
  final Widget child;
  const _DarkStatusBar({required this.child});

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
    value: (context.worldTheme.isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark)
        .copyWith(statusBarColor: Colors.transparent),
    child: child,
  );
}
