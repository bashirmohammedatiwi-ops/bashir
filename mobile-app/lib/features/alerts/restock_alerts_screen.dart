import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/push/push_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ds_strings.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
import '../worlds/world_theme.dart';
import 'restock_watch_provider.dart';

/// منتجات تنبيهات التوفّر كاملة.
///
/// دفعة واحدة بـ `getProductsByIds` أولاً، ثم ما سقط منها يُجلب بصفحته: إعداد
/// «إخفاء النافد» في القوائم يخفي بالضبط ما تنتظره الزبونة. المحذوف يُهمل بصمت.
final restockAlertProductsProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  ref.watch(authProvider.select((a) => a.user?.id));
  final api = ref.read(apiServiceProvider);
  final ids = await api.getRestockWatches();
  ref.read(restockWatchProvider.notifier).sync(ids);
  if (ids.isEmpty) return const [];

  final batch = await api.getProductsByIds(ids.toList(), forceRefresh: true);
  final byId = {for (final p in batch) p.id: p};
  final missing = ids.where((id) => !byId.containsKey(id)).toList();
  if (missing.isNotEmpty) {
    final fetched = await Future.wait(
      missing.map((id) => api.getProduct(id).then<Product?>((p) => p, onError: (_) => null)),
    );
    for (final p in fetched) {
      if (p != null) byId[p.id] = p;
    }
  }
  // ما عاد للمخزون أولاً — هو ما يستحق انتباهها الآن.
  final products = [for (final id in ids) ?byId[id]];
  final back = products.where((p) => p.inStock);
  final waiting = products.where((p) => !p.inStock);
  return [...back, ...waiting];
});

/// «تنبيهات التوفّر» — ما طلبت الزبونة أن ننبّهها عند عودته (/alerts).
///
/// كل بطاقة تحمل حالتها («بانتظار التوفر» أو «عاد متوفراً») وزر «إلغاء التنبيه».
class RestockAlertsScreen extends ConsumerStatefulWidget {
  const RestockAlertsScreen({super.key});

  @override
  ConsumerState<RestockAlertsScreen> createState() => _RestockAlertsScreenState();
}

class _RestockAlertsScreenState extends ConsumerState<RestockAlertsScreen> {
  /// السؤال اللطيف عن الإشعارات مرة واحدة لكل فتح — التنبيه بلا إشعار لا يصل.
  bool _askedPush = false;

  void _maybeAskPush() {
    if (_askedPush) return;
    _askedPush = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) PushService.maybeSoftAsk(context, reason: ref.read(stringsProvider).alertsPushReason);
    });
  }

  Future<void> _refresh() =>
      ref.refresh(restockAlertProductsProvider.future).then((_) {}, onError: (_) {});

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final auth = ref.watch(authProvider);

    final Widget body;
    if (!auth.isAuthenticated) {
      body = EmptyState(
        icon: Icons.notifications_none_rounded,
        title: s.loginToViewAlerts,
        subtitle: s.alertsHint,
        action: ProfilePrimaryButton(label: s.login, onPressed: () => context.push('/login')),
      );
    } else {
      final async = ref.watch(restockAlertProductsProvider);
      // ما أُلغي تنبيهه (من الزر أو من جرس البطاقة) يختفي فوراً بلا طلب جديد.
      final watched = ref.watch(restockWatchProvider);

      body = async.when(
        skipLoadingOnRefresh: true,
        loading: () => const ProductGridSkeleton(
          count: 4,
          padding: EdgeInsets.fromLTRB(ProfileUi.hPad, 12, ProfileUi.hPad, 24),
        ),
        error: (e, _) => ErrorView.from(
          e,
          onRetry: () => ref.invalidate(restockAlertProductsProvider),
          onRefresh: _refresh,
        ),
        data: (all) {
          final products = all.where((p) => watched.contains(p.id)).toList();
          if (products.isEmpty) {
            return EmptyState(
              icon: Icons.notifications_none_rounded,
              title: s.alertsEmptyTitle,
              subtitle: s.alertsEmptySubtitle,
              onRefresh: _refresh,
              action: ProfilePrimaryButton(
                label: s.browseProductsBtn,
                icon: Icons.shopping_bag_outlined,
                onPressed: () => openHomeTab(context, ProviderScope.containerOf(context, listen: false)),
              ),
            );
          }
          _maybeAskPush();
          final back = products.where((p) => p.inStock).length;
          return RefreshIndicator(
            color: context.worldTheme.accent,
            onRefresh: _refresh,
            child: CustomScrollView(
              physics: AppScrollPerf.physics,
              cacheExtent: AppScrollPerf.gridCacheExtent,
              slivers: [
                SliverToBoxAdapter(child: _AlertsHeader(total: products.length, backInStock: back)),
                ProductActionGrid(
                  products: products,
                  footerExtent: RestockAlertFooter.extentFor(context),
                  padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 4, ProfileUi.hPad, 24),
                  footerBuilder: (_, p) => RestockAlertFooter(product: p),
                ),
              ],
            ),
          );
        },
      );
    }

    return ProfileScaffold(title: s.restockAlerts, body: body);
  }
}

/// سطر أعلى القائمة: كم عاد منها للمخزون، أو تذكير بأننا سنرسل إشعاراً.
class _AlertsHeader extends ConsumerWidget {
  final int total;
  final int backInStock;
  const _AlertsHeader({required this.total, required this.backInStock});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final hasBack = backInStock > 0;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(ProfileUi.hPad, 12, ProfileUi.hPad, 12),
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: hasBack ? AppColors.successSoft : t.accentSoft,
          borderRadius: BorderRadius.circular(AppCorners.md),
        ),
        child: Row(
          children: [
            Icon(
              hasBack ? Icons.inventory_2_rounded : Icons.notifications_active_rounded,
              size: 20,
              color: hasBack ? AppColors.successDeep : t.accentDark,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                hasBack ? s.alertsBackSummary(backInStock, total) : s.alertsHint,
                style: AppText.bodySmall.copyWith(
                  color: hasBack ? AppColors.successDeep : t.ink,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// شبكة بطاقات المنتج نفسها (أعمدة [ProductGrid] ونسبته) مع شريط إجراء ثابت
/// الارتفاع تحت كل بطاقة — تنبيهات التوفّر، وقسم «نفد» في المفضلة.
class ProductActionGrid extends StatelessWidget {
  final List<Product> products;
  final double footerExtent;
  final EdgeInsetsGeometry padding;
  final Widget Function(BuildContext context, Product product) footerBuilder;

  const ProductActionGrid({
    super.key,
    required this.products,
    required this.footerExtent,
    required this.footerBuilder,
    this.padding = EdgeInsets.zero,
  });

  int? _indexForKey(Key key) {
    if (key is! ValueKey<String>) return null;
    final index = products.indexWhere((p) => p.id == key.value);
    return index >= 0 ? index : null;
  }

  @override
  Widget build(BuildContext context) {
    final cols = Responsive.gridColumns(context);
    final spacing = Responsive.gridSpacing(context);
    final ratio = Responsive.gridChildAspectRatio(context);
    return SliverPadding(
      padding: padding,
      sliver: SliverLayoutBuilder(
        builder: (context, c) {
          final tileWidth = (c.crossAxisExtent - spacing * (cols - 1)) / cols;
          return SliverGrid(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: cols,
              crossAxisSpacing: spacing,
              mainAxisSpacing: spacing,
              mainAxisExtent: tileWidth / ratio + footerExtent,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) {
                final product = products[i];
                return RepaintBoundary(
                  key: ValueKey(product.id),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(child: ProductCard(product: product, showRating: true, lite: true)),
                      SizedBox(height: footerExtent, child: footerBuilder(context, product)),
                    ],
                  ),
                );
              },
              childCount: products.length,
              addAutomaticKeepAlives: false,
              addRepaintBoundaries: false,
              findChildIndexCallback: _indexForKey,
            ),
          );
        },
      ),
    );
  }
}

/// ارتفاع زر الإجراء تحت البطاقة — 44 على الأقل، ويكبر مع تكبير الخط.
double _actionHeight(BuildContext context) =>
    math.max(kMinTapTarget, MediaQuery.textScalerOf(context).scale(AppText.caption.fontSize!) * 1.4 + 18);

/// يبدّل تنبيه التوفّر مع تغذية راجعة: تأكيد عند التفعيل (ثم سؤال لطيف عن
/// الإشعارات)، و«تراجع» عند الإلغاء. الحاوية لا العنصر — البطاقة قد تختفي فوراً.
Future<void> toggleRestockAlert(BuildContext context, WidgetRef ref, Product product) async {
  HapticFeedback.lightImpact();
  final container = ProviderScope.containerOf(context, listen: false);
  // سياق المرسال يبقى حياً بعد اختفاء البطاقة — لخطأ «تراجع» إن فشل.
  final messengerContext = ScaffoldMessenger.maybeOf(context)?.context;
  final s = container.read(stringsProvider);
  try {
    final watching = await container.read(restockWatchProvider.notifier).toggle(product.id);
    if (!context.mounted) return;
    if (watching) {
      AppSnackbar.success(context, s.dsRestockWillNotify);
      PushService.maybeSoftAsk(context, reason: s.alertsPushReason);
    } else {
      AppSnackbar.action(
        context,
        message: s.dsRestockCancelled,
        actionLabel: s.undo,
        onAction: () async {
          try {
            await container.read(restockWatchProvider.notifier).toggle(product.id);
          } catch (e) {
            final ctx = messengerContext;
            if (ctx != null && ctx.mounted) AppSnackbar.error(ctx, friendlyError(e, lang: s.lang));
          }
        },
      );
    }
  } catch (e) {
    if (context.mounted) AppSnackbar.error(context, friendlyError(e, lang: s.lang));
  }
}

/// شريط بطاقة «تنبيهات التوفّر»: حالة المنتج + «إلغاء التنبيه».
class RestockAlertFooter extends ConsumerWidget {
  final Product product;
  const RestockAlertFooter({super.key, required this.product});

  /// ارتفاع الشريط بخط الجهاز الحالي (سطر الحالة + الزر + الفواصل).
  static double extentFor(BuildContext context) =>
      8 + MediaQuery.textScalerOf(context).scale(AppText.micro.fontSize!) * 1.5 + 6 + _actionHeight(context);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final back = product.inStock;
    final statusColor = back ? AppColors.successDeep : t.inkSoft;
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: back ? AppColors.success : AppColors.warning,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  back ? s.backInStock : s.waitingRestock,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.micro.copyWith(color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Expanded(
            child: _FooterButton(
              label: s.cancelAlert,
              icon: Icons.notifications_off_outlined,
              semanticsLabel: '${s.cancelAlert}: ${product.localizedName(s.lang)}',
              onTap: () => toggleRestockAlert(context, ref, product),
            ),
          ),
        ],
      ),
    );
  }
}

/// شريحة «نبّهيني عند التوفر» تحت بطاقة منتج نافد (المفضلة). مفعّلة: «بانتظار
/// التوفر» بلون التمييز، ولمسة ثانية تلغيها.
class RestockNotifyChip extends ConsumerWidget {
  final Product product;
  const RestockNotifyChip({super.key, required this.product});

  static double extentFor(BuildContext context) => 8 + _actionHeight(context);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final watching = ref.watch(restockWatchProvider.select((w) => w.contains(product.id)));
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 8),
      child: _FooterButton(
        label: watching ? s.waitingRestock : s.notifyMeWhenAvailable,
        icon: watching ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
        filled: watching,
        toggled: watching,
        semanticsLabel: '${s.notifyMeWhenAvailable}: ${product.localizedName(s.lang)}',
        onTap: () => toggleRestockAlert(context, ref, product),
      ),
    );
  }
}

class _FooterButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool filled;
  final bool? toggled;
  final String semanticsLabel;
  final VoidCallback onTap;

  const _FooterButton({
    required this.label,
    required this.icon,
    required this.semanticsLabel,
    required this.onTap,
    this.filled = false,
    this.toggled,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fg = filled ? t.onAccent : t.accentDark;
    const radius = BorderRadius.all(Radius.circular(AppCorners.pill));
    // زر واحد لقارئ الشاشة: الاسم الكامل (الإجراء + المنتج) وحالة التفعيل.
    return MergeSemantics(
      child: Semantics(
        toggled: toggled,
        child: AppTap(
          onTap: onTap,
          radius: radius,
          haptic: false,
          semanticsLabel: semanticsLabel,
          child: ExcludeSemantics(
            child: AnimatedContainer(
              duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: filled ? t.accent : t.accentSoft,
                borderRadius: radius,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 16, color: fg),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: fg, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// نصوص شاشة التنبيهات الخاصة بها.
extension _AlertsStringsX on AppStrings {
  String get alertsPushReason => isAr
      ? 'فعّلي الإشعارات حتى يصلكِ تنبيه التوفّر لحظة عودة المنتج — قبل أن ينفد من جديد.'
      : 'Turn on notifications so your restock alert reaches you the moment it is back — before it sells out again.';

  /// «عاد 2 من 5 للمخزون — اطلبيها قبل أن تنفد».
  String alertsBackSummary(int back, int total) => isAr
      ? 'عاد ${arProducts(back)} من $total للمخزون — اطلبيها قبل أن تنفد'
      : 'Back in stock: $back of $total — order before they sell out';
}
