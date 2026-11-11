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
      // صور الطلب مصغّرات (38–44pt): thumb يكفي، ثم الأكبر إن لم يتوفر.
      for (final size in const ['thumb', 'small', 'medium']) {
        final formats = asMap(asMap(variants[size])['formats']);
        img = (formats['webp'] ?? formats['jpg'] ?? '').toString();
        if (img.isNotEmpty) break;
      }
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

/// صنف تغيّر أثناء التجهيز: ناقص (نفد) أو مُضاف — نفس ألوان تطبيقات الموظفين.
class OrderChange {
  final String name;
  final String? shadeName;

  /// `missing` (أحمر) أو `extra` (أصفر).
  final String kind;

  /// الكمية الناقصة أو المضافة.
  final int qty;
  final int ordered;
  final int picked;

  /// إضافة مجانية (هدية من المحل).
  final bool free;
  final int unitPrice;

  const OrderChange({
    required this.name,
    required this.kind,
    this.shadeName,
    this.qty = 1,
    this.ordered = 0,
    this.picked = 0,
    this.free = false,
    this.unitPrice = 0,
  });

  bool get isMissing => kind == 'missing';
  bool get isExtra => kind == 'extra';

  /// null لسطر لا نعرف نوعه — لا نعرض للزبونة شيئاً لا نفهمه.
  static OrderChange? fromJson(Map<String, dynamic> json) {
    var kind = asString(json['kind']).toLowerCase();
    if (kind != 'missing' && kind != 'extra') {
      // سيرفر أقدم/أحدث بلا kind: اللون يكفي.
      kind = switch (asString(json['color']).toLowerCase()) {
        'red' => 'missing',
        'yellow' => 'extra',
        _ => '',
      };
    }
    final name = _nonEmpty(json['name']);
    if (kind.isEmpty || name == null) return null;
    final qty = asInt(json['qty']);
    return OrderChange(
      name: name,
      shadeName: _nonEmpty(json['shadeName']),
      kind: kind,
      qty: qty > 0 ? qty : 1,
      ordered: asInt(json['ordered']),
      picked: asInt(json['picked']),
      free: asBool(json['free'], false),
      unitPrice: asInt(json['unitPrice']),
    );
  }
}

/// تجهيز الطلب وشحنه كما تراه الزبونة (`delivery` في GET /orders/:id).
/// غائب في السيرفر القديم — كل الشاشات تعمل بدونه كما كانت.
class OrderDelivery {
  /// مرحلة التجهيز (NEW … OUT_FOR_DELIVERY، DELIVERY_ISSUE، PARTIALLY_DELIVERED …).
  final String? stage;

  /// تسمية المرحلة للزبونة بالعربية من السيرفر.
  final String? stageLabel;
  final String? courier;
  final String? trackingNumber;
  final String? courierStatus;

  /// اسم المندوب — يرسله السيرفر فقط والطلب مع المندوب.
  final String? driverName;
  final int? originalTotal;
  final int? finalTotal;

  /// المبلغ الذي يُستلم عند الباب (null قبل انتهاء التجهيز).
  final int? codAmount;
  final bool prepaid;

  /// تغيّر المبلغ بعد التجهيز.
  final bool adjusted;
  final List<OrderChange> changes;

  const OrderDelivery({
    this.stage,
    this.stageLabel,
    this.courier,
    this.trackingNumber,
    this.courierStatus,
    this.driverName,
    this.originalTotal,
    this.finalTotal,
    this.codAmount,
    this.prepaid = false,
    this.adjusted = false,
    this.changes = const [],
  });

  /// null إن لم يكن `delivery` كائناً (سيرفر قديم، أو قيمة null).
  static OrderDelivery? fromJson(dynamic raw) {
    if (raw is! Map) return null;
    final json = asMap(raw);
    final changes = <OrderChange>[];
    for (final c in asList(json['changes'])) {
      final change = OrderChange.fromJson(c);
      if (change != null) changes.add(change);
    }
    return OrderDelivery(
      stage: _nonEmpty(json['stage'])?.toUpperCase(),
      stageLabel: _nonEmpty(json['stageLabel']),
      courier: _nonEmpty(json['courier']),
      trackingNumber: _nonEmpty(json['trackingNumber']),
      courierStatus: _nonEmpty(json['courierStatus']),
      driverName: _nonEmpty(json['driverName']),
      originalTotal: _intOrNull(json['originalTotal']),
      finalTotal: _intOrNull(json['finalTotal']),
      codAmount: _intOrNull(json['codAmount']),
      prepaid: asBool(json['prepaid'], false),
      adjusted: asBool(json['adjusted'], false),
      changes: changes,
    );
  }

  bool get hasCourier => courier != null;
  bool get outForDelivery => stage == 'OUT_FOR_DELIVERY';
  bool get deliveryIssue => stage == 'DELIVERY_ISSUE';
  bool get partiallyDelivered => stage == 'PARTIALLY_DELIVERED';

  /// المندوب يظهر فقط والطلب معه.
  String? get activeDriver => outForDelivery ? driverName : null;

  List<OrderChange> get missing => [for (final c in changes) if (c.isMissing) c];
  List<OrderChange> get extras => [for (final c in changes) if (c.isExtra) c];

  /// مدفوع بالكامل مسبقاً — لا شيء يُدفع عند الباب.
  bool get fullyPaid => prepaid && (codAmount ?? 0) <= 0;
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
  /// رسوم تغليف الهدية وقت الطلب (جزء من total).
  final int giftWrapFee;
  final DateTime? createdAt;
  final List<OrderItem> items;
  final Address? address;

  /// عدد المنتجات الفعلي — القائمة المختصرة ترسل أول 6 منتجات فقط مع `_count`.
  final int itemCount;

  /// التجهيز والشحن (تفاصيل الطلب فقط؛ null في القائمة والسيرفر القديم).
  final OrderDelivery? delivery;

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
    this.giftWrapFee = 0,
    this.giftMessage,
    this.giftHidePrices = false,
    this.createdAt,
    this.items = const [],
    this.address,
    this.itemCount = 0,
    this.delivery,
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
      giftWrapFee: asInt(json['giftWrapFee']),
      giftMessage: (json['giftMessage']?.toString().trim().isNotEmpty ?? false) ? json['giftMessage'].toString() : null,
      giftHidePrices: asBool(json['giftHidePrices'], false),
      createdAt: parseDate(json['createdAt']),
      items: items,
      address: json['address'] is Map ? Address.fromJson(asMap(json['address'])) : null,
      // تفاصيل الطلب بلا `_count`: العدد = المنتجات المرفقة.
      itemCount: asInt(count['items'], items.length),
      delivery: OrderDelivery.fromJson(json['delivery']),
    );
  }

  /// خصم الكوبون وحده (بلا توفير الباقات).
  int get couponDiscount {
    final v = discountTotal - packageDiscount;
    return v > 0 ? v : 0;
  }

  bool get isPickup => deliveryOption == 'PICKUP';

  /// تغيّر المبلغ بعد التجهيز (نقص/إضافة) — المبلغ النهائي هو المطلوب.
  bool get isAdjusted => delivery?.adjusted == true && delivery?.finalTotal != null;

  /// المبلغ الذي يُدفع فعلاً: النهائي بعد التجهيز إن تغيّر، وإلا إجمالي الطلب.
  int get amountDue => isAdjusted ? delivery!.finalTotal! : total;

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

int? _intOrNull(dynamic v) {
  if (v == null) return null;
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString().trim());
}

String? _nonEmpty(dynamic v) {
  final s = v?.toString().trim() ?? '';
  return s.isEmpty ? null : s;
}
