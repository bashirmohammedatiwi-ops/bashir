import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/address.dart';
import '../../data/models/notification.dart';
import '../../data/models/order.dart';
import '../../data/services/api_service.dart';

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
  return ref.read(apiServiceProvider).getNotifications();
});

/// مناطق الشحن (محافظات + مناطق) لاختيار العنوان واحتساب الأجور.
final shippingZonesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) {
  return ref.read(apiServiceProvider).getShippingZones();
});
