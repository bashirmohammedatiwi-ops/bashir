import 'address_model.dart';
import 'cart_item_model.dart';

enum OrderStatus { pending, processing, shipped, delivered, cancelled }

extension OrderStatusX on OrderStatus {
  String get label => switch (this) {
        OrderStatus.pending => 'قيد الانتظار',
        OrderStatus.processing => 'قيد المعالجة',
        OrderStatus.shipped => 'تم الشحن',
        OrderStatus.delivered => 'تم التوصيل',
        OrderStatus.cancelled => 'ملغي',
      };
}

class OrderModel {
  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.items,
    required this.address,
    required this.status,
    required this.subtotal,
    required this.discount,
    required this.shipping,
    required this.total,
    required this.createdAt,
    this.pointsEarned = 0,
    this.deliveryDate,
  });

  final String id;
  final String orderNumber;
  final List<CartItemModel> items;
  final AddressModel address;
  final OrderStatus status;
  final int subtotal;
  final int discount;
  final int shipping;
  final int total;
  final DateTime createdAt;
  final int pointsEarned;
  final DateTime? deliveryDate;

  int get itemCount =>
      items.fold(0, (sum, item) => sum + item.quantity);
}
