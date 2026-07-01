import '../../core/utils/json.dart';
import '../../core/utils/formatters.dart';
import 'address.dart';

class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String? shadeId;
  final int quantity;
  final int unitPrice;
  final int totalPrice;
  final String imageUrl;

  const OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.shadeId,
    this.quantity = 1,
    this.unitPrice = 0,
    this.totalPrice = 0,
    this.imageUrl = '',
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final product = asMap(json['product']);
    final images = asList(product['images']);
    String img = '';
    if (images.isNotEmpty) {
      final media = asMap(images.first['media']);
      final variants = asMap(media['variants']);
      final medium = asMap(asMap(variants['medium'])['formats']);
      img = (medium['webp'] ?? medium['jpg'] ?? '').toString();
    }
    return OrderItem(
      id: asString(json['id']),
      productId: asString(json['productId']),
      productName: asString(json['productName']),
      shadeId: json['shadeId']?.toString(),
      quantity: asInt(json['quantity'], 1),
      unitPrice: asInt(json['unitPrice']),
      totalPrice: asInt(json['totalPrice']),
      imageUrl: img,
    );
  }
}

class AppOrder {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final int subtotal;
  final int discountTotal;
  final int shippingTotal;
  final int total;
  final int loyaltyEarned;
  final String deliveryOption;
  final String? notes;
  final DateTime? createdAt;
  final List<OrderItem> items;
  final Address? address;
  final int itemCount;

  const AppOrder({
    required this.id,
    required this.orderNumber,
    this.status = 'PENDING',
    this.paymentStatus = 'PENDING',
    this.paymentMethod = 'COD',
    this.subtotal = 0,
    this.discountTotal = 0,
    this.shippingTotal = 0,
    this.total = 0,
    this.loyaltyEarned = 0,
    this.deliveryOption = 'STANDARD',
    this.notes,
    this.createdAt,
    this.items = const [],
    this.address,
    this.itemCount = 0,
  });

  factory AppOrder.fromJson(Map<String, dynamic> json) {
    final count = asMap(json['_count']);
    final items = asList(json['items']).map(OrderItem.fromJson).toList();
    return AppOrder(
      id: asString(json['id']),
      orderNumber: asString(json['orderNumber']),
      status: asString(json['status'], 'PENDING'),
      paymentStatus: asString(json['paymentStatus'], 'PENDING'),
      paymentMethod: asString(json['paymentMethod'], 'COD'),
      subtotal: asInt(json['subtotal']),
      discountTotal: asInt(json['discountTotal']),
      shippingTotal: asInt(json['shippingTotal']),
      total: asInt(json['total']),
      loyaltyEarned: asInt(json['loyaltyEarned']),
      deliveryOption: asString(json['deliveryOption'], 'STANDARD'),
      notes: json['notes']?.toString(),
      createdAt: parseDate(json['createdAt']),
      items: items,
      address: json['address'] is Map ? Address.fromJson(asMap(json['address'])) : null,
      itemCount: items.isNotEmpty ? items.length : asInt(count['items']),
    );
  }

  String get statusLabel => orderStatusLabel(status);
  String get totalLabel => formatPrice(total);
}

String orderStatusLabel(String status) => switch (status) {
      'PENDING' => 'قيد المراجعة',
      'CONFIRMED' => 'مؤكد',
      'PROCESSING' => 'قيد التجهيز',
      'SHIPPED' => 'تم الشحن',
      'DELIVERED' => 'تم التسليم',
      'CANCELLED' => 'ملغي',
      'RETURNED' => 'مُرجع',
      _ => status,
    };
