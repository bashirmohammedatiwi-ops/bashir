import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/order_model.dart';
import '../../../data/remote/order_remote_mapper.dart';
import '../../../data/remote/store_api.dart';
import '../../auth/providers/auth_provider.dart';

final ordersListProvider = FutureProvider<List<OrderModel>>((ref) async {
  if (!ref.watch(isLoggedInProvider)) return [];
  final raw = await ref.read(storeApiProvider).orders();
  return raw.map(OrderRemoteMapper.fromJson).toList();
});
