import '../../core/utils/json.dart';
import '../../core/utils/media_url.dart';
import '../../core/utils/formatters.dart';
import 'address.dart';

class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String? shadeId;

  /// اسم ولون الدرجة المطلوبة — من درجات المنتج المرفقة بالطلب.
  final String? shadeName;
  final String? shadeHex;
  final int quantity;
  final int unitPrice;
  final int totalPrice;
  final String imageUrl;

  const OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.shadeId,
    this.shadeName,
    this.shadeHex,
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
    final shadeId = json['shadeId']?.toString();
    Map<String, dynamic> shade = const {};
    if (shadeId != null && shadeId.isNotEmpty) {
      for (final s in asList(product['shades'])) {
        if (s['id']?.toString() == shadeId) {
          shade = s;
          break;
        }
      }
    }
    return OrderItem(
      id: asString(json['id']),
      productId: asString(json['productId']),
      productName: asString(json['productName']),
      shadeId: shadeId,
      shadeName: _nonEmpty(json['shadeName']) ?? _nonEmpty(shade['name']),
      shadeHex: _nonEmpty(json['shadeHex']) ?? _nonEmpty(shade['colorHex']),
      quantity: asInt(json['quantity'], 1),
      unitPrice: asInt(json['unitPrice']),
      totalPrice: asInt(json['totalPrice']),
      imageUrl: resolveMediaUrl(img),
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

  /// كل الخصومات: الكوبون + توفير الباقات ([packageDiscount] جزء منه).
  final int discountTotal;

  /// توفير الباقات (سعر الباقة أقل من مجموع منتجاتها) — جزء من [discountTotal].
  final int packageDiscount;

  /// كود الكوبون المستخدم إن وُجد.
  final String? couponCode;
  final int shippingTotal;
  final int total;
  final int loyaltyEarned;
  final int loyaltySpent;
  /// خصم النقاط بالدينار (يحفظه السيرفر وقت الطلب — قيمة النقطة تغيّرت مع الوقت).
  final int loyaltyDiscount;
  final String deliveryOption;
  final String? notes;
  final bool isGift;
  final String? giftMessage;
  final bool giftHidePrices;
  final DateTime? createdAt;
  final List<OrderItem> items;
  final Address? address;

  /// عدد المنتجات الفعلي — القائمة المختصرة ترسل أول 6 منتجات فقط مع `_count`.
  final int itemCount;

  const AppOrder({
    required this.id,
    required this.orderNumber,
    this.status = 'PENDING',
    this.paymentStatus = 'PENDING',
    this.paymentMethod = 'COD',
    this.subtotal = 0,
    this.discountTotal = 0,
    this.packageDiscount = 0,
    this.couponCode,
    this.shippingTotal = 0,
    this.total = 0,
    this.loyaltyEarned = 0,
    this.loyaltySpent = 0,
    this.loyaltyDiscount = 0,
    this.deliveryOption = 'STANDARD',
    this.notes,
    this.isGift = false,
    this.giftMessage,
    this.giftHidePrices = false,
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
      packageDiscount: asInt(json['packageDiscount']),
      couponCode: _nonEmpty(asMap(json['coupon'])['code']),
      shippingTotal: asInt(json['shippingTotal']),
      total: asInt(json['total']),
      loyaltyEarned: asInt(json['loyaltyEarned']),
      loyaltySpent: asInt(json['loyaltySpent']),
      loyaltyDiscount: asInt(json['loyaltyDiscount'], asInt(json['loyaltySpent'])),
      deliveryOption: asString(json['deliveryOption'], 'STANDARD'),
      notes: json['notes']?.toString(),
      isGift: asBool(json['isGift'], false),
      giftMessage: (json['giftMessage']?.toString().trim().isNotEmpty ?? false) ? json['giftMessage'].toString() : null,
      giftHidePrices: asBool(json['giftHidePrices'], false),
      createdAt: parseDate(json['createdAt']),
      items: items,
      address: json['address'] is Map ? Address.fromJson(asMap(json['address'])) : null,
      // تفاصيل الطلب بلا `_count`: العدد = المنتجات المرفقة.
      itemCount: asInt(count['items'], items.length),
    );
  }

  /// خصم الكوبون وحده (بلا توفير الباقات).
  int get couponDiscount {
    final v = discountTotal - packageDiscount;
    return v > 0 ? v : 0;
  }

  bool get isPickup => deliveryOption == 'PICKUP';

  String get statusLabel => orderStatusLabel(status);
  String statusLabelFor(String lang) => orderStatusLabel(status, lang: lang);
  String get totalLabel => formatPrice(total);
}

String orderStatusLabel(String status, {String lang = 'ar'}) {
  final ar = lang == 'ar';
  return switch (status) {
    'PENDING' => ar ? 'قيد المراجعة' : 'Under review',
    'CONFIRMED' => ar ? 'مؤكد' : 'Confirmed',
    'PROCESSING' => ar ? 'قيد التجهيز' : 'Preparing',
    'SHIPPED' => ar ? 'تم الشحن' : 'Shipped',
    'DELIVERED' => ar ? 'تم التسليم' : 'Delivered',
    'CANCELLED' => ar ? 'ملغي' : 'Cancelled',
    // REFUNDED هي الحالة في السيرفر؛ RETURNED اسم قديم لنفس المعنى.
    'REFUNDED' || 'RETURNED' => ar ? 'مُسترجع' : 'Refunded',
    _ => status,
  };
}

String? _nonEmpty(dynamic v) {
  final s = v?.toString().trim() ?? '';
  return s.isEmpty ? null : s;
}
