import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/address.dart';
import '../../data/models/notification.dart';
import '../../data/models/order.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

final addressesProvider = FutureProvider.autoDispose<List<Address>>((ref) {
  return ref.read(apiServiceProvider).getAddresses();
});

final ordersProvider = FutureProvider.autoDispose<List<AppOrder>>((ref) async {
  final result = await ref.read(apiServiceProvider).getOrders();
  return result.items;
});

final orderDetailProvider =
    FutureProvider.family.autoDispose<AppOrder, String>((ref, id) {
  return ref.read(apiServiceProvider).getOrder(id);
});

final notificationsProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return Future.value(const []);
  return ref.read(apiServiceProvider).getNotifications();
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return 0;
  return ref.watch(notificationsProvider).maybeWhen(
        data: (list) => list.where((n) => !n.read).length,
        orElse: () => 0,
      );
});

/// مناطق الشحن (محافظات + مناطق) لاختيار العنوان واحتساب الأجور.
final shippingZonesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) {
  return ref.read(apiServiceProvider).getShippingZones();
});
