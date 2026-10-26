import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/deep_link_redirect.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../data/models/beauty.dart';

import '../../features/advisor/advisor_screen.dart';
import '../../features/alerts/restock_alerts_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/brands/brand_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/order_success_screen.dart';
import '../../features/compare/compare_screen.dart';
import '../../features/orders/order_detail_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/packages/package_detail_screen.dart';
import '../../features/packages/packages_screen.dart';
import '../../features/beauty/skin_guide_screen.dart';
import '../../features/beauty/skin_quiz_screen.dart';
import '../../features/products/product_detail_screen.dart';
import '../../features/products/product_listing_screen.dart';
import '../../features/products/slug_listing_screen.dart';
import '../../features/profile/addresses_screen.dart';
import '../../features/profile/change_password_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/profile/loyalty_screen.dart';
import '../../features/profile/notifications_screen.dart';
import '../../features/search/qr_scan_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/settings/about_app_screen.dart';
import '../../features/settings/help_screen.dart';
import '../../features/settings/language_picker_screen.dart';
import '../../features/settings/legal_document_screen.dart';
import '../../features/settings/open_source_licenses_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/shell/nav_tabs.dart';
import '../../features/wishlist/wishlist_screen.dart';
import '../../features/worlds/world_screen.dart';
import '../../features/worlds/worlds_provider.dart';
import '../../features/profile/widgets/profile_ui.dart';
import '../config/app_config.dart';
import '../theme/app_spacing.dart';
import '../utils/support_links.dart';
import '../widgets/app_snackbar.dart';
import '../widgets/states.dart';

/// «?ids=a,b,c» (أو معامل مكرر) ← قائمة معرّفات؛ null إن لم تُرسل.
List<String>? _idsParam(Uri uri) {
  final ids = [
    for (final raw in uri.queryParametersAll['ids'] ?? const <String>[])
      for (final id in raw.split(','))
        if (id.trim().isNotEmpty) id.trim(),
  ];
  return ids.isEmpty ? null : ids;
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(appLocaleProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final localeSettings = ref.read(appLocaleProvider);
      if (!localeSettings.loaded) return null;

      final path = state.uri.path;
      if (!localeSettings.hasChosen && path != '/language') {
        return '/language';
      }
      if (localeSettings.hasChosen && path == '/language') {
        return '/';
      }

      final mapped = resolveDeepLink(state.uri);
      if (mapped != null) {
        final current = state.uri.hasQuery ? '$path?${state.uri.query}' : path;
        if (mapped != current && mapped != path) return mapped;
      }

      // «ديما» بالعربية فقط — أي رابط إليها بلغة أخرى يعود للرئيسية.
      if (!AppConfig.advisorFor(localeSettings.isArabic ? 'ar' : 'en') && (path == '/advisor' || path.startsWith('/advisor/'))) {
        return '/';
      }

      if (path == '/cart') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openCartTab(context, container);
        });
        return '/';
      }
      if (path == '/offers') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openOffersTab(context, container);
        });
        return '/';
      }
      if (path == '/brands') {
        // البراندات تبويب في الشريط السفلي (لا مسار لها): روابط المنصة و go() تصل هنا،
        // والدفع من داخل التطبيق يمرّ عبر openTabPath. ?q= يملأ بحثها.
        final q = state.uri.queryParameters['q']?.trim();
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          if (q != null && q.isNotEmpty) {
            container.read(brandsSearchRequestProvider.notifier).state = q;
          }
          openMainTab(context, container, NavTabs.brands);
        });
        return '/';
      }
      if (path == '/' && state.uri.hasQuery) {
        // «/?world=slug» (رابط حملة لعالم): نلوّن الرئيسية بعالمه ونُسقط المعامل.
        final world = worldSlugOf(state.uri);
        if (world != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final container = ProviderScope.containerOf(context);
            container.read(selectedWorldSlugProvider.notifier).state = world;
            openMainTab(context, container, NavTabs.home);
          });
        }
        return '/';
      }
      if (path == '/account') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openMainTab(context, container, NavTabs.account);
        });
        return '/';
      }
      if (path == '/categories' || path == '/categories-tab') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openCategoriesTab(context, container);
        });
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/language', builder: (_, __) => const LanguagePickerScreen()),
      GoRoute(path: '/', builder: (_, __) => const MainShell()),
      // extra: رقم الهاتف من صفحة التسجيل (رقم مسجّل مسبقاً) ليُملأ تلقائياً.
      GoRoute(
        path: '/login',
        builder: (_, s) => LoginScreen(initialPhone: s.extra is String ? s.extra as String : null),
      ),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(
        path: '/advisor',
        pageBuilder: (_, s) => CustomTransitionPage(
          key: s.pageKey,
          transitionDuration: const Duration(milliseconds: 420),
          reverseTransitionDuration: const Duration(milliseconds: 300),
          child: AdvisorScreen(
            initialMessage: s.uri.queryParameters['q'],
            productId: s.uri.queryParameters['product'],
            ask: s.uri.queryParameters['ask'],
          ),
          transitionsBuilder: (_, a, __, child) {
            final t = CurvedAnimation(parent: a, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);
            return FadeTransition(
              opacity: t,
              child: ScaleTransition(scale: Tween(begin: 0.94, end: 1.0).animate(t), child: child),
            );
          },
        ),
      ),
      GoRoute(
        path: '/world/:slug',
        builder: (_, s) => WorldScreen(slug: s.pathParameters['slug']!),
      ),
      GoRoute(path: '/scan', builder: (_, st) => QrScanScreen(pickOnly: st.uri.queryParameters['pick'] == '1')),
      GoRoute(
        path: '/product/:id',
        builder: (_, s) => ProductDetailScreen(
          idOrSlug: s.pathParameters['id']!,
          initialShadeId: s.uri.queryParameters['shade'],
        ),
      ),
      GoRoute(
        path: '/category/:slug',
        builder: (_, s) => CategorySlugListingScreen(slug: s.pathParameters['slug']!),
      ),
      GoRoute(
        // المقطع قد يكون slug أو id (ماركات بلا slug)؛ النطاق الاختياري يأتي من الاستعلام.
        path: '/brand/:slug',
        builder: (_, s) => BrandScreen(
          s.pathParameters['slug']!,
          categoryId: s.uri.queryParameters['categoryId'],
          subcategoryId: s.uri.queryParameters['subcategoryId'],
        ),
      ),
      GoRoute(
        path: '/products',
        builder: (_, s) => ProductListingScreen(
          title: s.uri.queryParameters['title'] ?? ref.read(stringsProvider).products,
          // عنوان صريح في الرابط (رف الرئيسية، شريحة الميزانية…) يُعرض كما هو بدل العناوين العامة.
          titleExplicit: (s.uri.queryParameters['title'] ?? '').trim().isNotEmpty,
          categoryId: s.uri.queryParameters['categoryId'],
          subcategoryId: s.uri.queryParameters['subcategoryId'],
          tertiaryCategoryId: s.uri.queryParameters['tertiaryCategoryId'],
          brandId: s.uri.queryParameters['brandId'],
          search: s.uri.queryParameters['search'],
          isNew: s.uri.queryParameters['isNew'] == '1',
          isBestSeller: s.uri.queryParameters['isBestSeller'] == '1',
          isPromo: s.uri.queryParameters['isPromo'] == '1',
          isFeatured: s.uri.queryParameters['isFeatured'] == '1',
          concernSlug: s.uri.queryParameters['concernSlug'],
          initialMinPrice: int.tryParse(s.uri.queryParameters['minPrice'] ?? ''),
          initialMaxPrice: int.tryParse(s.uri.queryParameters['maxPrice'] ?? ''),
          world: s.uri.queryParameters['world'] ?? s.uri.queryParameters['worldSlug'],
          ids: _idsParam(s.uri),
          minDiscount: int.tryParse(s.uri.queryParameters['minDiscount'] ?? ''),
          skinType: s.uri.queryParameters['skinType'],
        ),
      ),
      GoRoute(
        path: '/package/:id',
        // extra: الباقة كاملة من البطاقة المضغوطة — تُعرض فوراً بلا هيكل تحميل.
        builder: (_, s) => PackageDetailScreen(
          idOrSlug: s.pathParameters['id']!,
          initial: s.extra is BeautyPackage ? s.extra as BeautyPackage : null,
        ),
      ),
      GoRoute(
        path: '/packages',
        builder: (_, s) => PackagesScreen(initialTab: s.uri.queryParameters['tab']),
      ),
      GoRoute(path: '/skin-guide', builder: (_, __) => const SkinGuideScreen()),
      GoRoute(
        path: '/skin-guide/:slug',
        builder: (_, s) => SkinConcernScreen(slug: s.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/skin-quiz',
        builder: (_, s) => SkinQuizScreen(showResult: s.uri.queryParameters['result'] == '1'),
      ),
      GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
      GoRoute(
        path: '/order-success/:id',
        builder: (_, s) => OrderSuccessScreen(orderId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
      GoRoute(
        path: '/orders/:id',
        builder: (_, s) => OrderDetailScreen(orderId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/addresses', builder: (_, __) => const AddressesScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/loyalty', builder: (_, __) => const LoyaltyScreen()),
      GoRoute(path: '/edit-profile', builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/change-password', builder: (_, __) => const ChangePasswordScreen()),
      GoRoute(path: '/wishlist', builder: (_, __) => const WishlistScreen()),
      GoRoute(
        path: '/language-settings',
        builder: (_, __) => const LanguagePickerScreen(fromSettings: true),
      ),
      GoRoute(
        path: '/privacy',
        builder: (_, __) => const LegalDocumentScreen(type: LegalDocumentType.privacy),
      ),
      GoRoute(
        path: '/terms',
        builder: (_, __) => const LegalDocumentScreen(type: LegalDocumentType.terms),
      ),
      GoRoute(path: '/about', builder: (_, __) => const AboutAppScreen()),
      // الأسئلة الشائعة والتواصل (يقابل /help في الموقع).
      GoRoute(path: '/help', builder: (_, __) => const HelpScreen()),
      GoRoute(path: '/alerts', builder: (_, __) => const RestockAlertsScreen()),
      // قائمة المقارنة المحفوظة على الجهاز (يقابل /compare في الموقع).
      GoRoute(path: '/compare', builder: (_, __) => const CompareScreen()),
      GoRoute(path: '/licenses', builder: (_, __) => const OpenSourceLicensesScreen()),
    ],
    // رابط لا مقابل له في التطبيق: رأس برجوع (أو للرئيسية إن فُتح من الخارج)،
    // وزر يفتح الصفحة نفسها على الموقع بدل طريق مسدود.
    errorBuilder: (context, state) => Consumer(
      builder: (context, ref, _) {
        final s = ref.watch(stringsProvider);
        return ProfileScaffold(
          title: s.pageNotFound,
          body: EmptyState(
            icon: Icons.link_off_rounded,
            title: s.pageNotFound,
            action: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ProfilePrimaryButton(
                  label: s.goHome,
                  icon: Icons.home_rounded,
                  onPressed: () => context.go('/'),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextButton.icon(
                  style: TextButton.styleFrom(minimumSize: const Size(0, 44)),
                  onPressed: () async {
                    final ok = await openExternalUrl(AppConfig.webUrl(state.uri.toString()));
                    if (!ok && context.mounted) AppSnackbar.show(context, s.linkOpenFailed);
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 18),
                  label: Text(s.viewOnWebsite),
                ),
              ],
            ),
          ),
        );
      },
    ),
  );
});
