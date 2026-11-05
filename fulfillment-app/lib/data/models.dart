import 'dart:ui';

import '../core/format.dart';

Color? hexColor(String? hex) {
  if (hex == null) return null;
  var h = hex.trim().replaceAll('#', '');
  if (h.length == 3) h = h.split('').map((c) => '$c$c').join();
  if (h.length != 6) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}

int _int(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
String? _str(dynamic v) => v?.toString();
List<Map<String, dynamic>> _list(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

// ---------------------------------------------------------------- orders

const orderStatusLabels = {
  'PENDING': 'جديد',
  'CONFIRMED': 'مؤكد',
  'PROCESSING': 'قيد التحضير',
  'SHIPPED': 'جاهز للتوصيل',
  'DELIVERED': 'مكتمل',
  'CANCELLED': 'ملغي',
  'REFUNDED': 'مسترد',
};
const orderStatusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const paymentMethodLabels = {'COD': 'الدفع عند الاستلام', 'CARD': 'بطاقة (كي كارد)', 'WALLET': 'محفظة'};
const paymentStatusLabels = {'PENDING': 'بانتظار الدفع', 'PAID': 'مدفوع', 'FAILED': 'فشل الدفع', 'REFUNDED': 'مسترد'};
const deliveryLabels = {'STANDARD': 'توصيل عادي', 'EXPRESS': 'توصيل سريع', 'PICKUP': 'استلام من المتجر'};

class OrderSummary {
  OrderSummary.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      orderNumber = '${j['orderNumber']}',
      status = '${j['status']}',
      paymentStatus = '${j['paymentStatus']}',
      paymentMethod = '${j['paymentMethod']}',
      deliveryOption = '${j['deliveryOption']}',
      total = _int(j['total']),
      itemsCount = _int(j['itemsCount']),
      quantity = _int(j['quantity']),
      createdAt = parseDate(j['createdAt']),
      customer = '${j['customer'] ?? ''}',
      phone = _str(j['phone']),
      place = _str(j['place']),
      thumbs = (j['thumbs'] as List? ?? const []).map((e) => '$e').toList();
  final String id, orderNumber, status, paymentStatus, paymentMethod, deliveryOption, customer;
  final int total, itemsCount, quantity;
  final DateTime? createdAt;
  final String? phone, place;
  final List<String> thumbs;
}

class OrderItemLine {
  OrderItemLine.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      productId = '${j['productId']}',
      name = '${j['name'] ?? ''}',
      sku = _str(j['sku']),
      barcode = _str(j['barcode']),
      quantity = _int(j['quantity']),
      unitPrice = _int(j['unitPrice']),
      totalPrice = _int(j['totalPrice']),
      thumb = _str(j['thumb']),
      shadeName = _str((j['shade'] as Map?)?['name']),
      shadeHex = _str((j['shade'] as Map?)?['colorHex']),
      shadeHexEnd = _str((j['shade'] as Map?)?['colorHexEnd']),
      shadeActive = (j['shade'] as Map?)?['isActive'] != false;
  final String id, productId, name;
  final String? sku, barcode, thumb, shadeName, shadeHex, shadeHexEnd;
  final int quantity, unitPrice, totalPrice;
  final bool shadeActive;
}

class OrderDetail {
  OrderDetail.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      orderNumber = '${j['orderNumber']}',
      status = '${j['status']}',
      paymentStatus = '${j['paymentStatus']}',
      paymentMethod = '${j['paymentMethod']}',
      deliveryOption = '${j['deliveryOption']}',
      notes = _str(j['notes']),
      subtotal = _int(j['subtotal']),
      discountTotal = _int(j['discountTotal']),
      shippingTotal = _int(j['shippingTotal']),
      total = _int(j['total']),
      loyaltySpent = _int(j['loyaltySpent']),
      coupon = _str(j['coupon']),
      createdAt = parseDate(j['createdAt']),
      customerName = '${(j['customer'] as Map?)?['name'] ?? ''}',
      customerPhone = _str((j['customer'] as Map?)?['phone']),
      customerOrders = _int((j['customer'] as Map?)?['ordersCount']),
      address = j['address'] is Map ? Map<String, dynamic>.from(j['address']) : null,
      items = _list(j['items']).map(OrderItemLine.fromJson).toList(),
      history = _list(j['history']),
      payments = _list(j['payments']);
  final String id, orderNumber, status, paymentStatus, paymentMethod, deliveryOption, customerName;
  final String? notes, coupon, customerPhone;
  final int subtotal, discountTotal, shippingTotal, total, loyaltySpent, customerOrders;
  final DateTime? createdAt;
  final Map<String, dynamic>? address;
  final List<OrderItemLine> items;
  final List<Map<String, dynamic>> history, payments;

  int get units => items.fold(0, (n, i) => n + i.quantity);
  String get addressLine => address == null
      ? ''
      : [
          address!['governorate'],
          address!['city'],
          address!['area'],
          address!['street'],
          address!['house'],
        ].where((e) => e != null && '$e'.trim().isNotEmpty).join(' · ');
}
