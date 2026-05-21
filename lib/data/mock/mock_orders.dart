import '../models/address_model.dart';
import '../models/cart_item_model.dart';
import '../models/order_model.dart';
import 'mock_products.dart';

abstract final class MockOrders {
  static final AddressModel _defaultAddress = AddressModel(
    id: 'addr_1',
    name: 'سارة أحمد',
    phone: '+9647701234567',
    governorate: 'بغداد',
    area: 'الكرادة',
    street: 'شارع 62',
    house: 'بناية 5، طابق 3',
    isDefault: true,
  );

  static late final List<OrderModel> all = _generate();

  static List<OrderModel> _generate() {
    final statuses = OrderStatus.values;
    final products = MockProducts.all;
    return List.generate(12, (i) {
      final items = [
        CartItemModel(product: products[i], quantity: 1 + i % 3),
        if (i % 2 == 0)
          CartItemModel(product: products[(i + 5) % products.length], quantity: 1),
      ];
      final subtotal =
          items.fold(0, (sum, item) => sum + item.totalPrice);
      final discount = i % 3 == 0 ? subtotal ~/ 10 : 0;
      final shipping = subtotal > 50000 ? 0 : 5000;
      return OrderModel(
        id: 'order_$i',
        orderNumber: 'HAY-${1000 + i}',
        items: items,
        address: _defaultAddress,
        status: statuses[i % statuses.length],
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        total: subtotal - discount + shipping,
        createdAt: DateTime.now().subtract(Duration(days: i * 5)),
        pointsEarned: subtotal ~/ 1000,
        deliveryDate: i % 2 == 0
            ? DateTime.now().add(Duration(days: 3 + i))
            : null,
      );
    });
  }

  static OrderModel? findById(String id) {
    try {
      return all.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }
}
