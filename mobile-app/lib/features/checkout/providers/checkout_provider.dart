import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cart/providers/cart_provider.dart';
import '../../loyalty/providers/loyalty_provider.dart';
import '../../../data/models/address_model.dart';
import '../../../data/remote/store_api.dart';
import '../../orders/providers/orders_provider.dart';

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
    this.shippingFee = 5000,
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
  final int shippingFee;

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
    int? shippingFee,
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
        shippingFee: shippingFee ?? this.shippingFee,
      );
}

class CheckoutNotifier extends StateNotifier<CheckoutState> {
  CheckoutNotifier(this._ref) : super(const CheckoutState());

  final Ref _ref;

  int shippingCost(int subtotal) {
    if (state.delivery == DeliveryOption.pickup) return 0;
    return state.shippingFee;
  }

  String _deliveryApi(DeliveryOption d) => switch (d) {
        DeliveryOption.standard => 'STANDARD',
        DeliveryOption.express => 'EXPRESS',
        DeliveryOption.pickup => 'PICKUP',
      };

  Future<void> refreshShippingQuote(int subtotal) async {
    final addr = state.selectedAddress;
    if (addr == null) return;
    try {
      final quote = await _ref.read(storeApiProvider).shippingQuote(
            governorate: addr.governorate,
            area: addr.area,
            subtotal: subtotal,
            deliveryOption: _deliveryApi(state.delivery),
          );
      final fee = (quote['shippingFee'] as num?)?.toInt() ??
          (quote['fee'] as num?)?.toInt() ??
          5000;
      state = state.copyWith(shippingFee: fee);
    } catch (_) {}
  }

  Future<String?> placeOrder() async {
    state = state.copyWith(isPlacingOrder: true);
    final cart = _ref.read(cartProvider);
    if (cart.isEmpty) {
      state = state.copyWith(isPlacingOrder: false);
      return null;
    }

    try {
      final addr = state.selectedAddress;
      final body = <String, dynamic>{
        'items': cart
            .map((i) => {
                  'productId': i.product.id,
                  'quantity': i.quantity,
                })
            .toList(),
        if (addr != null) 'addressId': addr.id,
        if (state.couponCode != null && state.couponCode!.isNotEmpty)
          'couponCode': state.couponCode,
        'deliveryOption': _deliveryApi(state.delivery),
        if (state.useLoyaltyPoints && state.pointsToUse > 0)
          'loyaltySpent': state.pointsToUse,
      };
      final order = await _ref.read(storeApiProvider).createOrder(body);
      final orderNum =
          (order['orderNumber'] as String?) ?? (order['id'] as String?) ?? '';
      _ref.read(cartProvider.notifier).clear();
      _ref.invalidate(ordersListProvider);
      await _ref.read(loyaltyProvider.notifier).refreshFromApi();
      state = state.copyWith(isPlacingOrder: false, lastOrderNumber: orderNum);
      return orderNum;
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
  if (!ref.watch(isLoggedInProvider)) return [];
  final raw = await ref.read(storeApiProvider).addresses();
  return raw.map((j) => AddressModel.fromJson(j)).toList();
});
