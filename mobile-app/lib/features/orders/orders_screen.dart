import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/order.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/ui/ui.dart';
import '../cart/widgets/cart_theme.dart';
import '../cart/widgets/pill_buttons.dart';
import '../shell/main_shell.dart';
import '../payments/pay_now_card.dart';
import '../worlds/world_theme.dart';
import 'order_strings.dart';
import 'widgets/order_status.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  final _scroll = ScrollController();
  final _items = <AppOrder>[];
  int _page = 1;
  bool _hasMore = true;

  /// أول تحميل (لا شيء نعرضه بعد) — الهيكل يظهر هنا فقط، لا عند السحب للتحديث.
  bool _initialLoading = true;

  /// إعادة تحميل الصفحة الأولى والقائمة الحالية ظاهرة (سحب، تبديل الحالة، العودة).
  bool _reloading = false;
  bool _loadingMore = false;

  /// رقم آخر طلب تحميل — ردّ طلب قديم (قبل تحديث أو تبديل حالة) يُهمل.
  int _req = 0;

  /// تصفية بحالة واحدة — null = كل الطلبات.
  String? _status;

  /// الخطأ الخام — يُصاغ بلغة الواجهة عند العرض.
  Object? _error;

  @override
  void initState() {
    super.initState();
    // الزائرة لا تُرسل طلباً (كان يعود 401 فيظهر «كلمة المرور غير صحيحة» بعد الدخول).
    // نحمّل حين تصبح الجلسة مسجّلة، ونمسح القائمة عند الخروج.
    ref.listenManual<AuthState>(authProvider, (prev, next) {
      final was = prev?.isAuthenticated == true;
      if (next.isAuthenticated && (!was || prev?.user?.id != next.user?.id)) {
        // زبونة أخرى: طلبات السابقة لا تبقى ظاهرة لحظة واحدة.
        if (was) _items.clear();
        _reload(clear: true);
      } else if (!next.isAuthenticated && was) {
        _req++;
        if (mounted) {
          setState(() {
            _items.clear();
            _initialLoading = true;
            _reloading = false;
            _loadingMore = false;
            _error = null;
          });
        }
      }
    }, fireImmediately: true);
    _scroll.addListener(() {
      // لا محاولات متكررة مع كل حركة تمرير بعد فشل — زر «إعادة» في الذيل.
      if (_error != null) return;
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) _loadMore();
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  /// الصفحة الأولى من جديد. القائمة الحالية تبقى ظاهرة حتى يصل الجديد (بلا وميض الهيكل).
  /// [clear]: تغيّرت الحالة المختارة أو الزبونة — ما يظهر الآن لم يعد صحيحاً عند الفشل.
  Future<void> _reload({bool clear = false}) async {
    if (!ref.read(authProvider).isAuthenticated) return;
    final api = ref.read(apiServiceProvider);
    final req = ++_req;
    setState(() {
      _reloading = true;
      _loadingMore = false;
      if (_items.isEmpty) _initialLoading = true;
    });
    try {
      final result = await api.getOrders(page: 1, limit: AppConfig.pageSize, status: _status);
      if (!mounted || req != _req) return;
      setState(() {
        _items
          ..clear()
          ..addAll(result.items);
        _page = 2;
        _hasMore = result.hasNext;
        _error = null;
        _initialLoading = false;
        _reloading = false;
      });
    } catch (e) {
      if (!mounted || req != _req) return;
      final keep = !clear && _items.isNotEmpty;
      setState(() {
        if (!keep) {
          _items.clear();
          _error = e;
        }
        _initialLoading = false;
        _reloading = false;
      });
      // القائمة ما زالت صالحة: تنبيه صغير بدل استبدالها بصفحة خطأ.
      if (keep) AppSnackbar.error(context, ref.friendly(e));
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _reloading || _initialLoading || !_hasMore || _error != null || _items.isEmpty) return;
    final api = ref.read(apiServiceProvider);
    final req = _req;
    setState(() => _loadingMore = true);
    try {
      final result = await api.getOrders(page: _page, limit: AppConfig.pageSize, status: _status);
      if (!mounted || req != _req) return;
      setState(() {
        _items.addAll(result.items);
        _hasMore = result.hasNext;
        _page++;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted || req != _req) return;
      setState(() {
        _error = e;
        _loadingMore = false;
      });
    }
  }

  void _retryMore() {
    setState(() => _error = null);
    _loadMore();
  }

  void _setStatus(String? status) {
    if (status == _status) return;
    setState(() => _status = status);
    if (_scroll.hasClients) _scroll.jumpTo(0);
    _reload(clear: true);
  }

  /// بعد العودة من التفاصيل (إلغاء، دفع بالبطاقة…): نحدّث هذا الطلب وحده في مكانه.
  Future<void> _refreshOne(String id) async {
    try {
      final fresh = await ref.read(apiServiceProvider).getOrder(id);
      if (!mounted) return;
      final idx = _items.indexWhere((e) => e.id == id);
      if (idx < 0) return;
      setState(() {
        // لم يعد يطابق التصفية الحالية (أُلغي مثلاً): يخرج منها.
        if (_status != null && fresh.status != _status) {
          _items.removeAt(idx);
        } else {
          _items[idx] = fresh;
        }
      });
    } catch (_) {
      // القائمة تبقى كما هي — السحب للتحديث متاح.
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    return AuthGate(
      title: s.myOrders,
      emptyTitle: s.loginToViewOrders,
      child: Scaffold(
        backgroundColor: t.canvas,
        appBar: AppBar(
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: AppBackButton()),
          ),
          leadingWidth: 60,
          titleSpacing: 4,
          title: Text(s.myOrders, style: AppText.title1.copyWith(color: t.ink)),
          backgroundColor: t.canvas,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
        body: Column(
          children: [
            // الشرائح تظهر متى كان هناك ما يُصفّى (أو تصفية مختارة يمكن إلغاؤها).
            if (_status != null || _items.isNotEmpty)
              _StatusFilterBar(selected: _status, onSelect: _setStatus),
            // تحميل خفيف أعلى القائمة أثناء تبديل الحالة — القائمة لا تختفي.
            SizedBox(
              height: 2,
              child: _reloading && !_initialLoading && _items.isNotEmpty
                  ? LinearProgressIndicator(color: t.accent, backgroundColor: Colors.transparent, minHeight: 2)
                  : null,
            ),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    final s = ref.s;
    final t = context.worldTheme;
    if (_initialLoading && _items.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 16),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: CartTheme.itemGap),
        itemBuilder: (_, __) => const ShimmerBox(height: 132, radius: AppCorners.lg),
      );
    }
    if (_error != null && _items.isEmpty) {
      return ErrorView.from(_error, onRetry: _reload, onRefresh: _reload, loading: _reloading);
    }
    if (_items.isEmpty) {
      if (_status != null) {
        return EmptyState(
          icon: Icons.filter_list_off_rounded,
          title: s.ordersFilteredEmpty,
          subtitle: s.ordersFilteredEmptyHint,
          onRefresh: _reload,
          action: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 260),
            child: SecondaryPillButton(
              label: s.ordersShowAll,
              icon: Icons.receipt_long_outlined,
              onTap: () => _setStatus(null),
            ),
          ),
        );
      }
      return EmptyState(
        icon: Icons.receipt_long_outlined,
        title: s.noOrdersTitle,
        subtitle: s.noOrdersSubtitle,
        onRefresh: _reload,
        action: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 260),
          child: PrimaryPillButton(
            label: s.startShopping,
            icon: Icons.storefront_outlined,
            onTap: () {
              ref.read(navIndexProvider.notifier).state = 0;
              context.go('/');
            },
          ),
        ),
      );
    }
    final showFooter = _hasMore || _error != null;
    return RefreshIndicator(
      color: t.accent,
      onRefresh: _reload,
      child: ListView.separated(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 24),
        itemCount: _items.length + (showFooter ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: CartTheme.itemGap),
        itemBuilder: (_, i) {
          if (i >= _items.length) {
            if (_error != null) return _LoadMoreError(error: _error!, onRetry: _retryMore);
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: t.accent, strokeWidth: 2.4),
                ),
              ),
            );
          }
          final order = _items[i];
          return _OrderCard(
            key: ValueKey(order.id),
            order: order,
            onReturn: () => _refreshOne(order.id),
          );
        },
      ),
    );
  }
}

/// شرائح التصفية بالحالة — نفس تبويبات المتجر على الويب.
class _StatusFilterBar extends ConsumerWidget {
  final String? selected;
  final ValueChanged<String?> onSelect;
  const _StatusFilterBar({required this.selected, required this.onSelect});

  static const _statuses = <String?>[null, 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return SizedBox(
      height: kMinTapTarget,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: CartTheme.hPad),
        itemCount: _statuses.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final st = _statuses[i];
          return AppChoiceChip(
            label: st == null ? s.ordersFilterAll : s.orderStatus(st),
            selected: st == selected,
            onTap: () => onSelect(st),
          );
        },
      ),
    );
  }
}

/// ذيل القائمة بعد فشل تحميل صفحة لاحقة: السبب وزر إعادة (بدل مؤشر يدور للأبد).
class _LoadMoreError extends ConsumerWidget {
  final Object error;
  final VoidCallback onRetry;
  const _LoadMoreError({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          Text(
            friendlyError(error, lang: s.lang),
            textAlign: TextAlign.center,
            style: AppText.caption.copyWith(color: t.inkMuted),
          ),
          TextButton.icon(
            onPressed: onRetry,
            style: TextButton.styleFrom(foregroundColor: t.accentDark, minimumSize: const Size(0, kMinTapTarget)),
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: Text(s.retry, style: AppText.label),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends ConsumerWidget {
  final AppOrder order;

  /// بعد العودة من صفحة الطلب — لتحديثه في مكانه.
  final VoidCallback onReturn;
  const _OrderCard({super.key, required this.order, required this.onReturn});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final closed = isOrderClosedNegative(order.status);
    final thumbs = order.items.where((e) => e.imageUrl.isNotEmpty).take(3).toList();

    return DecoratedBox(
      decoration: CartTheme.cardDecoration(context),
      child: Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(CartTheme.radiusLg),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          HapticFeedback.selectionClick();
          await context.push('/orders/${order.id}');
          onReturn();
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  CartTheme.iconBadge(
                    context,
                    orderStatusIcon(order.status),
                    color: orderStatusColor(context, order.status),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '#${order.orderNumber}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textDirection: TextDirection.ltr,
                          style: AppText.title3.copyWith(color: t.ink),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatDateTime(order.createdAt, lang: s.lang),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: t.inkMuted),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  OrderStatusChip(status: order.status),
                ],
              ),
              if (!closed) ...[const SizedBox(height: 14), OrderProgressBar(status: order.status)],
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1, color: t.divider),
              ),
              Row(
                children: [
                  if (thumbs.isNotEmpty) ...[
                    _ThumbStack(
                      urls: thumbs.map((e) => e.imageUrl).toList(),
                      extra: order.itemCount - thumbs.length,
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // اسم أول منتج: تعرف الطلب من نظرة بدل رقمه فقط.
                        if (order.items.isNotEmpty)
                          Text(
                            order.items.first.productName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.caption.copyWith(color: t.ink, fontWeight: FontWeight.w700),
                          ),
                        // itemCount = عدد أسطر الطلب كله (المعاينة تحمل أول 6 فقط).
                        Text(
                          order.itemCount > 1 && order.items.isNotEmpty
                              ? s.moreOrderItems(order.itemCount - 1)
                              : s.itemCountLabel(order.itemCount),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: t.inkSoft),
                        ),
                        if (order.paymentMethod == 'CARD') ...[
                          const SizedBox(height: 4),
                          CardPaymentPill(order: order),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(order.totalLabel, style: AppText.price.copyWith(color: t.ink)),
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right_rounded, color: t.inkMuted, size: 22),
                ],
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

class _ThumbStack extends StatelessWidget {
  final List<String> urls;

  /// منتجات أخرى بلا صورة ظاهرة — فقاعة «+N» في آخر الكومة.
  final int extra;
  const _ThumbStack({required this.urls, this.extra = 0});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    const size = 34.0;
    const step = 22.0;
    final count = urls.length + (extra > 0 ? 1 : 0);
    return SizedBox(
      width: size + step * (count - 1),
      height: size,
      child: Stack(
        children: [
          for (var i = 0; i < urls.length; i++)
            PositionedDirectional(
              start: i * step,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  color: t.accentLight,
                  shape: BoxShape.circle,
                  border: Border.all(color: t.surface, width: 2),
                ),
                child: ClipOval(
                  child: Padding(
                    padding: const EdgeInsets.all(3),
                    child: ProductCoverImage(url: urls[i], fit: BoxFit.contain),
                  ),
                ),
              ),
            ),
          if (extra > 0)
            PositionedDirectional(
              start: urls.length * step,
              child: Container(
                width: size,
                height: size,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: t.accentSoft,
                  shape: BoxShape.circle,
                  border: Border.all(color: t.surface, width: 2),
                ),
                child: FittedBox(
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Text(
                      '+$extra',
                      textDirection: TextDirection.ltr,
                      style: AppText.micro.copyWith(color: t.accentDark, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
