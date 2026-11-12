import '../core/format.dart';

int _int(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
String? _str(dynamic v) => v?.toString();
List<Map<String, dynamic>> _list(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

// ---------------------------------------------------------------- picking (التجهيز بالمسح)

/// مراحل التجهيز الداخلية بالعربي (مرحلة الطلب في السيرفر).
const stageLabels = {
  'NEW': 'جديد',
  'CONFIRMED': 'مؤكد',
  'PICKING': 'قيد التجهيز',
  'PICKED': 'بانتظار الكاشير',
  'READY_FOR_PICKUP': 'جاهز للاستلام',
  'INVOICED': 'مُفوتر',
  'HANDED_OVER': 'سُلّم للشحن',
  'OUT_FOR_DELIVERY': 'مع المندوب',
  'DELIVERY_ISSUE': 'مشكلة توصيل',
  'DELIVERED': 'تم التسليم',
  'PARTIALLY_DELIVERED': 'تسليم جزئي',
  'RETURNING': 'راجع للمحل',
  'RETURNED': 'مُرتجع',
  'CANCELLED': 'ملغي',
};

/// يبدأ منها التجهيز أو يكمل.
const pickableStages = {'NEW', 'CONFIRMED', 'PICKING'};

/// أسباب النقص الجاهزة (تُكتب كما هي في السجل).
const shortageReasons = ['نفد المخزون', 'تالف', 'لم يُعثر عليه', 'ألغته الزبونة'];

/// أسباب الصنف الإضافي.
const extraReasons = ['بديل لصنف ناقص', 'طلبته الزبونة هاتفياً', 'هدية', 'عينة'];

/// رمز طلب ممسوح؟ (ORD-XXXX بأي حالة أحرف، وقد يُسقط الماسح الشرطة) — مطابق لقاعدة السيرفر.
bool isOrderCode(String raw) => RegExp(r'^ORD-?[A-Z0-9]{6,32}$').hasMatch(normalizeCode(raw).toUpperCase());

class PickLine {
  PickLine.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      kind = '${j['kind']}',
      productId = _str(j['productId']),
      barcode = _str(j['barcode']),
      name = '${j['name'] ?? ''}',
      shadeName = _str(j['shadeName']),
      orderedQty = _int(j['orderedQty']),
      pickedQty = _int(j['pickedQty']),
      unitPrice = _int(j['unitPrice']),
      charge = '${j['charge'] ?? 'PAID'}',
      reason = _str(j['reason']),
      substituteForLineId = _str(j['substituteForLineId']),
      manualConfirm = j['manualConfirm'] == true,
      state = '${j['state']}',
      color = '${j['color']}',
      label = '${j['label'] ?? ''}',
      thumb = _str(j['thumb']);

  PickLine._copy(PickLine o, {required this.pickedQty, required this.state, required this.color, required this.label})
    : id = o.id,
      kind = o.kind,
      productId = o.productId,
      barcode = o.barcode,
      name = o.name,
      shadeName = o.shadeName,
      orderedQty = o.orderedQty,
      unitPrice = o.unitPrice,
      charge = o.charge,
      reason = o.reason,
      substituteForLineId = o.substituteForLineId,
      manualConfirm = o.manualConfirm,
      thumb = o.thumb;

  final String id, kind, name, charge, state, color, label;
  final String? productId, barcode, shadeName, reason, substituteForLineId, thumb;
  final int orderedQty, pickedQty, unitPrice;
  final bool manualConfirm;

  bool get isExtra => kind == 'EXTRA';
  bool get isFree => charge == 'FREE';
  bool get complete => !isExtra && pickedQty >= orderedQty;
  int get missingQty => isExtra ? 0 : (orderedQty - pickedQty).clamp(0, orderedQty);
  bool get isShort => state == 'SHORT' || state == 'PENDING';

  /// نسخة بعدد ممسوح مختلف — عرض فوري للمسحة قبل رد السيرفر.
  PickLine withPicked(int n) {
    final full = !isExtra && n >= orderedQty;
    return PickLine._copy(this, pickedQty: n, state: full ? 'MATCHED' : state, color: full ? 'green' : color, label: full ? 'مطابق' : label);
  }
}

class PickMoney {
  PickMoney.fromJson(Map<String, dynamic> j)
    : orderedSubtotal = _int(j['orderedSubtotal']),
      shortageValue = _int(j['shortageValue']),
      extrasValue = _int(j['extrasValue']),
      freeExtrasValue = _int(j['freeExtrasValue']),
      finalSubtotal = _int(j['finalSubtotal']),
      finalDiscountTotal = _int(j['finalDiscountTotal']),
      shippingTotal = _int(j['shippingTotal']),
      giftWrapFee = _int(j['giftWrapFee']),
      loyaltyDiscount = _int(j['loyaltyDiscount']),
      roundingDiscount = _int(j['roundingDiscount']),
      finalTotal = _int(j['finalTotal']),
      codAmount = _int(j['codAmount']),
      refundAmount = _int(j['refundAmount']),
      adjustmentTotal = _int(j['adjustmentTotal']),
      prepaid = j['prepaid'] == true,
      changed = j['changed'] == true,
      allMissing = j['allMissing'] == true,
      needsApproval = j['needsApproval'] == true;
  final int orderedSubtotal, shortageValue, extrasValue, freeExtrasValue, finalSubtotal, finalDiscountTotal;
  final int shippingTotal, giftWrapFee, loyaltyDiscount, roundingDiscount, finalTotal, codAmount, refundAmount, adjustmentTotal;
  final bool prepaid, changed, allMissing, needsApproval;
}

class PickCounts {
  PickCounts.fromJson(Map<String, dynamic> j)
    : matched = _int(j['matched']),
      short = _int(j['short']),
      pending = _int(j['pending']),
      extra = _int(j['extra']),
      orderedUnits = _int(j['orderedUnits']),
      pickedOrderedUnits = _int(j['pickedOrderedUnits']),
      extraUnits = _int(j['extraUnits']);
  final int matched, short, pending, extra, orderedUnits, pickedOrderedUnits, extraUnits;
}

/// المطلوب مقابل المُجهَّز كما يحسبه السيرفر.
class PickView {
  PickView.fromJson(Map<String, dynamic> j)
    : order = Map<String, dynamic>.from(j['order'] as Map),
      lines = _list(j['lines']).map(PickLine.fromJson).toList(),
      counts = PickCounts.fromJson(Map<String, dynamic>.from(j['counts'] as Map)),
      money = PickMoney.fromJson(Map<String, dynamic>.from(j['money'] as Map)),
      canFinish = j['canFinish'] == true;
  PickView._(this.order, this.lines, this.counts, this.money, this.canFinish);
  final Map<String, dynamic> order;
  final List<PickLine> lines;
  final PickCounts counts;
  final PickMoney money;
  final bool canFinish;

  String get id => '${order['id']}';
  String get orderNumber => '${order['orderNumber']}';
  String get stage => '${order['stage']}';
  String get status => '${order['status']}';
  String? get pickerId => order['pickerId'] as String?;
  String? get pickerName => order['pickerName'] as String?;
  String get paymentMethod => '${order['paymentMethod']}';
  String get paymentStatus => '${order['paymentStatus']}';
  String get deliveryOption => '${order['deliveryOption']}';
  bool get isGift => order['isGift'] == true;
  String? get giftMessage => order['giftMessage'] as String?;
  String? get notes => order['notes'] as String?;
  int get total => _int(order['total']);
  int? get parcelCount => order['parcelCount'] == null ? null : _int(order['parcelCount']);
  bool get invoiced => order['invoiced'] == true;
  bool get picking => stage == 'PICKING';
  bool get finished => stage == 'PICKED' || stage == 'READY_FOR_PICKUP';
  bool get startable => pickableStages.contains(stage);

  List<PickLine> get ordered => lines.where((l) => !l.isExtra).toList();
  List<PickLine> get extras => lines.where((l) => l.isExtra).toList();

  /// الأسطر الناقصة الآن (لأسباب النقص والبدائل).
  List<PickLine> get shortLines => ordered.where((l) => l.pickedQty < l.orderedQty).toList();

  /// عدد القطع المطلوبة الممسوحة (يشمل العرض الفوري).
  int get pickedUnits => ordered.fold(0, (n, l) => n + l.pickedQty.clamp(0, l.orderedQty));
  int get orderedUnits => ordered.fold(0, (n, l) => n + l.orderedQty);

  /// ما سيُسلَّم فعلاً: المطابق حتى المطلوب + الإضافي.
  int get deliverUnits => pickedUnits + extraUnits;

  /// البنود التي فيها شيء سيُسلَّم.
  int get deliverLines => lines.where((l) => l.pickedQty > 0).length;
  int get missingUnits => ordered.fold(0, (n, l) => n + l.missingQty);
  int get extraUnits => extras.fold(0, (n, l) => n + l.pickedQty);

  /// الأسطر الحمراء (نقص مسجّل) — بعد الإنهاء تصبح كل الناقصة حمراء.
  List<PickLine> get redLines => ordered.where((l) => l.color == 'red').toList();

  /// لم تكتمل بعد ولم يُسجَّل نقصها.
  List<PickLine> get remainingLines => ordered.where((l) => l.pickedQty < l.orderedQty && l.color != 'red').toList();

  PickView replaceLine(PickLine line) => PickView._(order, [for (final l in lines) l.id == line.id ? line : l], counts, money, canFinish);
}

/// نتيجة مسحة واحدة.
class ScanOutcome {
  ScanOutcome.fromJson(Map<String, dynamic> j)
    : result = '${j['result']}',
      message = '${j['message'] ?? ''}',
      proposal = j['proposal'] is Map ? ExtraProposal.fromJson(Map<String, dynamic>.from(j['proposal'])) : null,
      view = PickView.fromJson(Map<String, dynamic>.from(j['view'] as Map));
  final String result, message;
  final ExtraProposal? proposal;
  final PickView view;
}

/// صنف ليس في الطلب — يعرضه التطبيق ليؤكد الموظف إضافته.
class ExtraProposal {
  ExtraProposal.fromJson(Map<String, dynamic> j)
    : barcode = '${j['barcode']}',
      name = '${j['name'] ?? ''}',
      shadeName = _str(j['shadeName']),
      price = _int(j['price']),
      thumb = _str(j['thumb']);
  ExtraProposal.unknownPrice(this.barcode, this.name) : shadeName = null, price = 0, thumb = null;
  final String barcode, name;
  final String? shadeName, thumb;
  final int price;
}

class TimelineEntry {
  TimelineEntry.fromJson(Map<String, dynamic> j)
    : id = '${j['id'] ?? ''}',
      type = '${j['type']}',
      label = '${j['label'] ?? j['type']}',
      actorType = _str(j['actorType']),
      actorName = _str(j['actorName']),
      data = j['data'] is Map ? Map<String, dynamic>.from(j['data']) : const {},
      at = parseDate(j['at']);
  final String id, type, label;

  /// STAFF | CASHIER | SYSTEM | COURIER | CUSTOMER
  final String? actorType, actorName;
  final Map<String, dynamic> data;
  final DateTime? at;
}
