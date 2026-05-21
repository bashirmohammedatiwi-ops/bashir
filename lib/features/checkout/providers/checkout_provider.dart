import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/address_model.dart';
import '../../../data/models/order_model.dart';
import '../../../data/remote/app_remote_data_source.dart';
import '../../cart/providers/cart_provider.dart';
import '../../loyalty/providers/loyalty_provider.dart';

enum DeliveryOption { standard, express, pickup }

class CheckoutState {
  const CheckoutState({
    this.step = 0,
    this.selectedAddress,
    this.delivery = DeliveryOption.standard,
    this.couponCode,
    this.couponDiscount = 0,
    this.useLoyaltyPoints = false,
    this.pointsToUse = 0,
    this.isPlacingOrder = false,
    this.lastOrderNumber,
  });

  final int step;
  final AddressModel? selectedAddress;
  final DeliveryOption delivery;
  final String? couponCode;
  final int couponDiscount;
  final bool useLoyaltyPoints;
  final int pointsToUse;
  final bool isPlacingOrder;
  final String? lastOrderNumber;

  CheckoutState copyWith({
    int? step,
    AddressModel? selectedAddress,
    DeliveryOption? delivery,
    String? couponCode,
    int? couponDiscount,
    bool? useLoyaltyPoints,
    int? pointsToUse,
    bool? isPlacingOrder,
    String? lastOrderNumber,
  }) =>
      CheckoutState(
        step: step ?? this.step,
        selectedAddress: selectedAddress ?? this.selectedAddress,
        delivery: delivery ?? this.delivery,
        couponCode: couponCode ?? this.couponCode,
        couponDiscount: couponDiscount ?? this.couponDiscount,
        useLoyaltyPoints: useLoyaltyPoints ?? this.useLoyaltyPoints,
        pointsToUse: pointsToUse ?? this.pointsToUse,
        isPlacingOrder: isPlacingOrder ?? this.isPlacingOrder,
        lastOrderNumber: lastOrderNumber ?? this.lastOrderNumber,
      );
}

class CheckoutNotifier extends StateNotifier<CheckoutState> {
  CheckoutNotifier(this._ref) : super(const CheckoutState());

  final Ref _ref;

  int shippingCost(int subtotal, Map<String, dynamic>? settings) {
    if (state.delivery == DeliveryOption.pickup) return 0;
    final express = (settings?['expressShippingFee'] as num?)?.toInt() ?? 5000;
    final standard = (settings?['shippingFee'] as num?)?.toInt() ?? 5000;
    final freeAt = (settings?['freeShippingThreshold'] as num?)?.toInt() ?? 50000;
    if (state.delivery == DeliveryOption.express) return express;
    return subtotal >= freeAt ? 0 : standard;
  }

  Future<String?> placeOrder() async {
    state = state.copyWith(isPlacingOrder: true);
    try {
      final cart = _ref.read(cartProvider);
      final remote = _ref.read(appRemoteDataSourceProvider);
      final delivery = switch (state.delivery) {
        DeliveryOption.express => 'EXPRESS',
        DeliveryOption.pickup => 'PICKUP',
        _ => 'STANDARD',
      };
      final result = await remote.createOrder({
        'items': cart
            .map((i) => {
                  'productId': i.product.id,
                  'quantity': i.quantity,
                  if (i.selectedShade != null) 'shadeId': i.selectedShade,
                })
            .toList(),
        if (state.selectedAddress != null) 'addressId': state.selectedAddress!.id,
        if (state.couponCode != null) 'couponCode': state.couponCode,
        'deliveryOption': delivery,
        if (state.useLoyaltyPoints && state.pointsToUse > 0)
          'loyaltySpent': state.pointsToUse,
      });
      _ref.read(cartProvider.notifier).clear();
      await _ref.read(loyaltyProvider.notifier).refresh();
      final orderNumber = (result['orderNumber'] as String?) ?? result['id'] as String?;
      state = state.copyWith(isPlacingOrder: false, lastOrderNumber: orderNumber);
      return orderNumber;
    } catch (_) {
      state = state.copyWith(isPlacingOrder: false);
      rethrow;
    }
  }

  void reset() => state = const CheckoutState();
  void update(CheckoutState newState) => state = newState;
}

final checkoutProvider =
    StateNotifierProvider<CheckoutNotifier, CheckoutState>((ref) {
  return CheckoutNotifier(ref);
});

final addressesProvider = FutureProvider<List<AddressModel>>((ref) async {
  return ref.read(appRemoteDataSourceProvider).listAddresses();
});

final ordersProvider = FutureProvider<List<OrderModel>>((ref) async {
  return ref.read(appRemoteDataSourceProvider).listOrders();
});

final orderDetailProvider =
    FutureProvider.family<OrderModel, String>((ref, id) async {
  return ref.read(appRemoteDataSourceProvider).findOrder(id);
});
