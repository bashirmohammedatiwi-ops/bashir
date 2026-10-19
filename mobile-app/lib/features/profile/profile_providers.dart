import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/address.dart';
import '../../data/models/notification.dart';
import '../../data/models/order.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

/// معرّف الزبونة المسجّلة (null للزائرة). المزوّدات الشخصية تراقبه هو لا حالة الحساب
/// كاملة — فتحديث بيانات الحساب (بعد الطلب أو تعديل الملف) لا يعيد طلبها.
final _signedInUserIdProvider = Provider<String?>(
  (ref) => ref.watch(authProvider.select((a) => a.isAuthenticated ? a.user?.id : null)),
);

final addressesProvider = FutureProvider.autoDispose<List<Address>>((ref) {
  return ref.read(apiServiceProvider).getAddresses();
});

/// طلبات الزبونة — فارغة للزائرة، وتتجدد فقط حين تتغير الزبونة نفسها.
final ordersProvider = FutureProvider.autoDispose<List<AppOrder>>((ref) async {
  final uid = ref.watch(_signedInUserIdProvider);
  if (uid == null) return const [];
  final result = await ref.read(apiServiceProvider).getOrders();
  return result.items;
});

final orderDetailProvider = FutureProvider.family.autoDispose<AppOrder, String>(
  (ref, id) {
    return ref.read(apiServiceProvider).getOrder(id);
  },
);

/// نسخة من الإشعار مقروءة — بلا انتظار الشبكة.
AppNotification _markedRead(AppNotification n) => n.read
    ? n
    : AppNotification(
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        imageUrl: n.imageUrl,
        linkType: n.linkType,
        linkId: n.linkId,
        linkSlug: n.linkSlug,
        linkLabel: n.linkLabel,
        externalUrl: n.externalUrl,
        read: true,
        createdAt: n.createdAt,
      );

/// إشعارات الزبونة: الصفحة الأولى عند الفتح، والتالية بـ [loadMore].
///
/// القراءة فورية على الجهاز ([markRead] / [markAllRead]) والسيرفر يُبلَّغ في الخلفية —
/// لا ينتظر فتح الإشعار رحلة شبكة، ولا تُعاد القائمة كلها من أجل علامة واحدة.
class NotificationsNotifier extends AutoDisposeAsyncNotifier<List<AppNotification>> {
  static const pageSize = 30;

  int _page = 1;
  bool _hasMore = false;
  bool _loadingMore = false;

  /// يتغير مع كل بناء أو إغلاق — صفحة وصلت بعد التحديث تُهمل بدل أن تختلط بالجديدة.
  int _epoch = 0;

  /// هل على السيرفر إشعارات أقدم لم تُحمَّل بعد؟
  bool get hasMore => _hasMore;
  bool get isLoadingMore => _loadingMore;

  @override
  FutureOr<List<AppNotification>> build() {
    _epoch++;
    ref.onDispose(() => _epoch++);
    _page = 1;
    _hasMore = false;
    _loadingMore = false;
    final uid = ref.watch(_signedInUserIdProvider);
    if (uid == null) return const [];
    return _firstPage();
  }

  Future<List<AppNotification>> _firstPage() async {
    final items = await ref.read(apiServiceProvider).getNotifications(limit: pageSize);
    _hasMore = items.length >= pageSize;
    return items;
  }

  /// الصفحة التالية (تُستدعى عند الوصول لآخر القائمة). لا تفعل شيئاً إن لم يبقَ المزيد
  /// أو كان تحميل جارٍ. الفشل لا يمس ما هو معروض.
  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || !_hasMore || _loadingMore || state.isLoading) return;
    final epoch = _epoch;
    final next = _page + 1;
    _loadingMore = true;
    try {
      final page = await ref.read(apiServiceProvider).getNotifications(page: next, limit: pageSize);
      if (epoch != _epoch) return;
      final latest = state.valueOrNull ?? current;
      final seen = {for (final n in latest) n.id};
      _page = next;
      _hasMore = page.length >= pageSize;
      state = AsyncData([...latest, ...page.where((n) => !seen.contains(n.id))]);
    } catch (_) {
      // بلا اتصال: تبقى القائمة كما هي، والمحاولة التالية تطلب نفس الصفحة.
    } finally {
      if (epoch == _epoch) _loadingMore = false;
    }
  }

  /// يعلّم إشعاراً مقروءاً على الجهاز فوراً، ويبلّغ السيرفر في الخلفية.
  void markRead(String id) {
    final current = state.valueOrNull;
    final item = current?.where((n) => n.id == id).firstOrNull;
    // مقروء أصلاً: لا تغيير ولا طلب.
    if (item != null && item.read) return;
    if (item != null) {
      state = AsyncData([for (final n in current!) n.id == id ? _markedRead(n) : n]);
    }
    unawaited(ref.read(apiServiceProvider).markNotificationRead(id));
  }

  /// «قراءة الكل»: فوراً على الجهاز، ثم السيرفر (لا يرمي خطأً).
  Future<void> markAllRead() {
    final current = state.valueOrNull;
    if (current != null && current.any((n) => !n.read)) {
      state = AsyncData([for (final n in current) _markedRead(n)]);
    }
    return ref.read(apiServiceProvider).markAllNotificationsRead();
  }
}

final notificationsProvider =
    AutoDisposeAsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

/// عدد غير المقروء — أثناء إعادة التحميل يبقى آخر رقم معروف (لا يقفز الجرس إلى صفر).
final unreadNotificationsCountProvider = Provider<int>((ref) {
  if (ref.watch(_signedInUserIdProvider) == null) return 0;
  return ref.watch(notificationsProvider).valueOrNull?.where((n) => !n.read).length ?? 0;
});

/// مناطق الشحن (محافظات + مناطق) لاختيار العنوان واحتساب الأجور.
final shippingZonesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  return ref.read(apiServiceProvider).getShippingZones();
});

/// إعادة المحاولة بعد فشل تحميل مناطق الشحن (المزوّد يحفظ الخطأ حتى يُطلب من جديد).
void retryShippingZones(WidgetRef ref) => ref.invalidate(shippingZonesProvider);
