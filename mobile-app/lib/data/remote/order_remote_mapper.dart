import '../models/address_model.dart';
import '../models/cart_item_model.dart';
import '../models/order_model.dart';
import 'product_remote_mapper.dart';

class OrderRemoteMapper {
  static OrderStatus _status(String? s) {
    return switch (s?.toUpperCase()) {
      'PENDING' => OrderStatus.pending,
      'PROCESSING' => OrderStatus.processing,
      'SHIPPED' => OrderStatus.shipped,
      'DELIVERED' => OrderStatus.delivered,
      'CANCELLED' => OrderStatus.cancelled,
      _ => OrderStatus.pending,
    };
  }

  static OrderModel fromJson(Map<String, dynamic> json) {
    final itemsRaw = (json['items'] as List?) ?? [];
    final items = itemsRaw.map((raw) {
      final m = Map<String, dynamic>.from(raw as Map);
      final productJson = m['product'] as Map<String, dynamic>?;
      final product = productJson != null
          ? ProductRemoteMapper.fromJson(productJson)
          : null;
      if (product == null) return null;
      return CartItemModel(
        product: product,
        quantity: (m['quantity'] as num?)?.toInt() ?? 1,
        selectedShade: m['shadeName'] as String?,
      );
    }).whereType<CartItemModel>().toList();

    final addr = json['address'] as Map<String, dynamic>?;
    final address = addr != null
        ? AddressModel.fromJson(addr)
        : const AddressModel(
            id: '',
            name: '',
            phone: '',
            governorate: '',
            area: '',
            street: '',
            house: '',
          );

    return OrderModel(
      id: json['id'] as String,
      orderNumber: (json['orderNumber'] as String?) ?? json['id'] as String,
      items: items,
      address: address,
      status: _status(json['status'] as String?),
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
      discount: (json['discount'] as num?)?.toInt() ?? 0,
      shipping: (json['shipping'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toInt() ?? 0,
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      pointsEarned: (json['pointsEarned'] as num?)?.toInt() ?? 0,
    );
  }
}
