import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import 'restock_watch_provider.dart';

/// منتجات تنبيهات التوفّر كاملة، بترتيب الطلب.
///
/// كل منتج يُجلب بصفحته (كالموقع) لا بقائمة `ids`: إعداد «إخفاء النافد» في
/// القائمة كان سيخفي بالضبط ما تنتظره الزبونة. المنتج المحذوف يُهمل بصمت.
final restockAlertProductsProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  ref.watch(authProvider.select((a) => a.user?.id));
  final api = ref.read(apiServiceProvider);
  final ids = await api.getRestockWatches();
  ref.read(restockWatchProvider.notifier).sync(ids);
  final products = await Future.wait(
    ids.map((id) => api.getProduct(id).then<Product?>((p) => p, onError: (_) => null)),
  );
  return [for (final p in products) ?p];
});

/// «تنبيهات التوفّر» — ما طلبت الزبونة أن ننبّهها عند عودته (/alerts).
///
/// بطاقة النافد تحمل جرس التنبيه نفسه: لمسه يلغي التنبيه فيختفي المنتج من هنا.
class RestockAlertsScreen extends ConsumerWidget {
  const RestockAlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final auth = ref.watch(authProvider);

    final Widget body;
    if (!auth.isAuthenticated) {
      body = ProfileEmptyState(
        icon: Icons.notifications_none_rounded,
        title: s.loginToViewAlerts,
        subtitle: s.alertsHint,
        action: ProfilePrimaryButton(label: s.login, onPressed: () => context.push('/login')),
      );
    } else {
      final async = ref.watch(restockAlertProductsProvider);
      // ما أُلغي تنبيهه من جرس البطاقة يختفي فوراً بلا طلب جديد.
      final watched = ref.watch(restockWatchProvider);
      Future<void> refresh() => ref.refresh(restockAlertProductsProvider.future).then((_) {}, onError: (_) {});

      body = async.when(
        skipLoadingOnRefresh: true,
        loading: () => const ProductGridSkeleton(
          count: 4,
          padding: EdgeInsets.fromLTRB(ProfileUi.hPad, 4, ProfileUi.hPad, 24),
        ),
        error: (e, _) => ErrorView.from(
          e,
          onRetry: () => ref.invalidate(restockAlertProductsProvider),
          onRefresh: refresh,
        ),
        data: (all) {
          final products = all.where((p) => watched.contains(p.id)).toList();
          if (products.isEmpty) {
            return RefreshIndicator(
              color: t.accent,
              onRefresh: refresh,
              child: ProfileEmptyState(
                icon: Icons.notifications_none_rounded,
                title: s.alertsEmptyTitle,
                subtitle: s.alertsEmptySubtitle,
                action: ProfilePrimaryButton(
                  label: s.browseProductsBtn,
                  icon: Icons.shopping_bag_outlined,
                  onPressed: () {
                    ref.read(navIndexProvider.notifier).state = NavTabs.home;
                    context.canPop() ? context.pop() : context.go('/');
                  },
                ),
              ),
            );
          }
          final back = products.where((p) => p.inStock).length;
          return RefreshIndicator(
            color: t.accent,
            onRefresh: refresh,
            child: ProductGrid(
              products: products,
              padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 4, ProfileUi.hPad, 24),
              header: _AlertsHeader(backInStock: back),
            ),
          );
        },
      );
    }

    return ProfileScaffold(title: s.restockAlerts, body: body);
  }
}

class _AlertsHeader extends ConsumerWidget {
  final int backInStock;
  const _AlertsHeader({required this.backInStock});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(ProfileUi.hPad, 12, ProfileUi.hPad, 12),
      child: Row(
        children: [
          Icon(Icons.notifications_active_rounded, size: 18, color: t.accentDark),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              backInStock > 0 ? '${s.backInStock} · $backInStock' : s.alertsHint,
              style: AppText.bodySmall.copyWith(color: t.inkSoft, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
