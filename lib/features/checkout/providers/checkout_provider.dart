import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../cart/providers/cart_provider.dart';
import '../../loyalty/providers/loyalty_provider.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../core/utils/points_calculator.dart';
import '../../../data/models/address_model.dart';

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

  int shippingCost(int subtotal) {
    if (state.delivery == DeliveryOption.pickup) return 0;
    if (state.delivery == DeliveryOption.express) return 5000;
    return subtotal >= 50000 ? 0 : 5000;
  }

  Future<String?> placeOrder() async {
    state = state.copyWith(isPlacingOrder: true);
    await Future.delayed(const Duration(milliseconds: 800));
    final orderNum = 'HAY-${1000 + DateTime.now().millisecondsSinceEpoch % 9000}';
    final cart = _ref.read(cartProvider);
    final subtotal = cart.fold(0, (s, i) => s + i.totalPrice);
    final earned = PointsCalculator.earnFromPurchase(subtotal);
    await _ref.read(loyaltyProvider.notifier).addPoints(earned, 'شراء منتجات');
    final prefs = _ref.read(prefsProvider);
    if (!prefs.firstOrderDone) {
      await _ref.read(loyaltyProvider.notifier).addPoints(50, 'أول طلب');
      await prefs.setFirstOrderDone(true);
    }
    if (state.useLoyaltyPoints && state.pointsToUse > 0) {
      await _ref
          .read(loyaltyProvider.notifier)
          .redeemPoints(state.pointsToUse);
    }
    _ref.read(cartProvider.notifier).clear();
    state = state.copyWith(
      isPlacingOrder: false,
      lastOrderNumber: orderNum,
    );
    return orderNum;
  }

  void reset() => state = const CheckoutState();

  void update(CheckoutState newState) => state = newState;
}

final checkoutProvider =
    StateNotifierProvider<CheckoutNotifier, CheckoutState>((ref) {
  return CheckoutNotifier(ref);
});

final addressesProvider = StateProvider<List<AddressModel>>((ref) {
  return [
    const AddressModel(
      id: 'addr_1',
      name: 'سارة أحمد',
      phone: '+9647701234567',
      governorate: 'بغداد',
      area: 'الكرادة',
      street: 'شارع 62',
      house: 'بناية 5، طابق 3',
      isDefault: true,
    ),
    const AddressModel(
      id: 'addr_2',
      name: 'سارة أحمد',
      phone: '+9647701234567',
      governorate: 'أربيل',
      area: 'عنكاوا',
      street: 'شارع 100',
      house: 'منزل 12',
    ),
  ];
});
