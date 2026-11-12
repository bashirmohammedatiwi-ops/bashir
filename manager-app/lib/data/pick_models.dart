import 'dart:math' as math;

import '../core/format.dart';

int _int(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
int? _intOrNull(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse('$v'));
String? _str(dynamic v) => v?.toString();
List<Map<String, dynamic>> _list(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

// ---------------------------------------------------------------- جمع الطلب (منتجاً منتجاً)

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

/// أسباب إزالة منتج أو نقصه (تُكتب كما هي في السجل).
const removeReasons = ['نفد من المحل', 'تالف', 'تاريخ قريب الانتهاء', 'الزبونة ألغته', 'لون/حجم غير متوفر'];

/// أسباب إضافة منتج ليس في الطلب (اختيارية).
const addReasons = ['طلبته الزبونة', 'بديل', 'هدية'];

/// أقصى زيادة/إضافة في مرة واحدة (حد السيرفر).
const maxAddQty = 50;

/// رمز طلب ممسوح؟ (ORD-XXXX بأي حالة أحرف، وقد يُسقط الماسح الشرطة) — مطابق لقاعدة السيرفر.
bool isOrderCode(String raw) => RegExp(r'^ORD-?[A-Z0-9]{6,32}$').hasMatch(normalizeCode(raw).toUpperCase());

/// نفس الباركود؟ (بلا اعتبار لحالة الأحرف والأصفار البادئة).
bool sameBarcode(String? a, String? b) {
  if (a == null || b == null || a.isEmpty || b.isEmpty) return false;
  final x = normalizeCode(a).toUpperCase(), y = normalizeCode(b).toUpperCase();
  return x == y || x.replaceFirst(RegExp(r'^0+'), '') == y.replaceFirst(RegExp(r'^0+'), '');
}

/// آخر 4 أرقام من الباركود — تكفي للتأكد من الرف.
String barcodeTail(String? b) => b == null || b.length <= 4 ? (b ?? '') : '…${b.substring(b.length - 4)}';

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
      thumb = _str(j['thumb']),
      image = _str(j['image']),
      posOnly = j['posOnly'] == true,
      collected = j['collected'] is bool
          ? j['collected'] as bool
          : ('${j['kind']}' == 'EXTRA' ? _int(j['pickedQty']) > 0 : _int(j['pickedQty']) >= _int(j['orderedQty']));

  final String id, kind, name, charge, state, color, label;
  final String? productId, barcode, shadeName, reason, substituteForLineId, thumb;

  /// صورة كبيرة لعرض المنتج (قد تكون null — نستعمل الصغيرة).
  final String? image;
  final int orderedQty, pickedQty, unitPrice;
  final bool manualConfirm;

  /// صنف إضافي من كتالوج المحل غير موجود في التطبيق.
  final bool posOnly;

  /// المطلوب: جُمع كاملاً. الإضافي: فيه قطعة على الأقل (من السيرفر).
  final bool collected;

  bool get isExtra => kind == 'EXTRA';
  bool get isFree => charge == 'FREE';
  bool get complete => !isExtra && pickedQty >= orderedQty;
  int get missingQty => isExtra ? 0 : (orderedQty - pickedQty).clamp(0, orderedQty);
  bool get hasReason => (reason ?? '').trim().isNotEmpty;
  String? get bigImage => (image ?? '').isNotEmpty ? image : thumb;
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

/// المطلوب مقابل المُجمَّع كما يحسبه السيرفر.
class PickView {
  PickView.fromJson(Map<String, dynamic> j)
    : order = Map<String, dynamic>.from(j['order'] as Map),
      lines = _list(j['lines']).map(PickLine.fromJson).toList(),
      counts = PickCounts.fromJson(Map<String, dynamic>.from((j['counts'] as Map?) ?? const {})),
      money = PickMoney.fromJson(Map<String, dynamic>.from((j['money'] as Map?) ?? const {})),
      canFinish = j['canFinish'] == true;
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
  bool get cancelled => stage == 'CANCELLED' || status == 'CANCELLED';

  List<PickLine> get ordered => lines.where((l) => !l.isExtra).toList();
  List<PickLine> get extras => lines.where((l) => l.isExtra).toList();

  /// الأسطر الناقصة الآن.
  List<PickLine> get shortLines => ordered.where((l) => l.pickedQty < l.orderedQty).toList();

  int get pickedUnits => ordered.fold(0, (n, l) => n + l.pickedQty.clamp(0, l.orderedQty));
  int get orderedUnits => ordered.fold(0, (n, l) => n + l.orderedQty);

  /// ما سيُسلَّم فعلاً: المطابق حتى المطلوب + الإضافي.
  int get deliverUnits => pickedUnits + extraUnits;

  /// البنود التي فيها شيء سيُسلَّم.
  int get deliverLines => lines.where((l) => l.pickedQty > 0).length;
  int get missingUnits => ordered.fold(0, (n, l) => n + l.missingQty);
  int get extraUnits => extras.fold(0, (n, l) => n + l.pickedQty);

  /// المنتجات كما تُعرض: الإضافي بنفس باركود منتج مطلوب يُدمج فيه كـ«زيادة».
  List<PickItem> get items => pickItems(lines);
}

// ---------------------------------------------------------------- منتج في شاشة الجمع

/// حالة المنتج في شاشة الجمع (ومنها لونه).
enum PickItemState {
  /// لم يُجمع منه شيء — بطاقة فاتحة.
  pending,

  /// جُمع بعضه ولم يُذكر سبب للباقي.
  partial,

  /// جُمع كاملاً — أخضر.
  collected,

  /// جُمع أكثر من المطلوب — أزرق «زيادة».
  over,

  /// جُمع بعضه والباقي ناقص بسبب — أحمر.
  short,

  /// أُزيل (لا شيء) مع السبب — أحمر.
  removed,

  /// ليس في الطلب (أُضيف بالكاميرا) — أصفر.
  extra,
}

/// منتج في القائمة: سطر مطلوب (مع زيادته إن وجدت) أو صنف إضافي وحده.
/// الكميات هنا قد تكون معروضة مسبقاً (تفاؤلياً) قبل رد السيرفر.
class PickItem {
  const PickItem._(this.line, this.overLine, this.picked, this.overQty, this.reason, this._finalShort);

  factory PickItem.of(PickLine line, [PickLine? over]) => PickItem._(
    line,
    line.isExtra ? null : over,
    line.pickedQty,
    line.isExtra ? 0 : (over?.pickedQty ?? 0),
    line.reason,
    // بعد إنهاء الجمع يعدّ السيرفر كل ناقص «ناقصاً» ولو بلا سبب.
    !line.isExtra && line.state == 'SHORT' && !line.hasReason,
  );

  final PickLine line;

  /// صنف إضافي بنفس الباركود مدموج في هذا المنتج (الزيادة).
  final PickLine? overLine;

  /// المجموع من المطلوب (0..orderedQty)، أو عدد الإضافي.
  final int picked;

  /// الزيادة فوق المطلوب.
  final int overQty;
  final String? reason;
  final bool _finalShort;

  String get id => line.id;
  bool get isExtra => line.isExtra;
  int get orderedQty => line.orderedQty;

  /// كل ما جُمع من هذا المنتج (المطلوب + الزيادة).
  int get total => picked + overQty;
  int get missingQty => isExtra ? 0 : math.max(0, orderedQty - picked);
  bool get hasReason => (reason ?? '').trim().isNotEmpty;

  /// لا يمنع إنهاء الجمع: مكتمل، أو ناقص بسبب، أو إضافي.
  bool get settled => switch (state) {
    PickItemState.pending || PickItemState.partial => false,
    _ => true,
  };

  /// يقبل زيادة فوق المطلوب؟ (تُضاف بالباركود كإضافي مدموج).
  bool get canOver => !isExtra && (line.barcode ?? '').isNotEmpty;

  PickItemState get state {
    if (isExtra) return PickItemState.extra;
    if (overQty > 0) return PickItemState.over;
    if (picked >= orderedQty) return PickItemState.collected;
    if (hasReason || _finalShort) return picked == 0 ? PickItemState.removed : PickItemState.short;
    return picked == 0 ? PickItemState.pending : PickItemState.partial;
  }

  /// نسخة بعدد كلي جديد: يُملأ المطلوب أولاً، والباقي زيادة.
  PickItem withTotal(int t) {
    final n = math.max(0, t);
    if (isExtra) return PickItem._(line, null, n, 0, reason, false);
    final picked = math.min(n, orderedQty);
    // اكتمل المطلوب: سبب النقص القديم لم يعد له معنى.
    final r = picked >= orderedQty ? null : reason;
    return PickItem._(line, overLine, picked, math.max(0, n - orderedQty), r, false);
  }

  /// نسخة بسبب نقص/إزالة (أو بلا سبب).
  PickItem withReason(String? r) => PickItem._(line, overLine, picked, overQty, r, false);

  /// «3 مطلوب · 4 مجموع (زيادة +1)».
  String get qtyText {
    if (isExtra) return '${numFmt(picked)} إضافي';
    if (overQty > 0) return '${numFmt(orderedQty)} مطلوب · ${numFmt(total)} مجموع (زيادة +${numFmt(overQty)})';
    return '${numFmt(picked)}/${numFmt(orderedQty)}';
  }
}

/// يبني المنتجات من أسطر السيرفر: الإضافي المدفوع بنفس باركود منتج مطلوب يصير «زيادة» عليه
/// (ولا يظهر بطاقة صفراء مستقلة). الهدية بنفس الباركود تبقى إضافياً مستقلاً.
List<PickItem> pickItems(List<PickLine> lines) {
  final ordered = lines.where((l) => !l.isExtra).toList();
  final extras = lines.where((l) => l.isExtra).toList();
  final mergedInto = <String, PickLine>{};
  final used = <String>{};
  for (final o in ordered) {
    final hit = extras.where((x) => !used.contains(x.id) && !x.isFree && x.substituteForLineId == null && sameBarcode(x.barcode, o.barcode)).firstOrNull;
    if (hit != null) {
      used.add(hit.id);
      mergedInto[o.id] = hit;
    }
  }
  return [
    for (final o in ordered) PickItem.of(o, mergedInto[o.id]),
    for (final x in extras)
      if (!used.contains(x.id)) PickItem.of(x),
  ];
}

int _rank(PickItemState s) => switch (s) {
  PickItemState.pending => 0,
  PickItemState.partial => 1,
  PickItemState.collected || PickItemState.over => 2,
  PickItemState.short || PickItemState.removed => 3,
  PickItemState.extra => 4,
};

/// الترتيب: لم يُجمع ← جُمع بعضه ← مكتمل ← أُزيل/ناقص ← إضافي (ثابت داخل كل مجموعة).
List<PickItem> sortPickItems(List<PickItem> items) {
  final indexed = items.indexed.toList()
    ..sort((a, b) {
      final r = _rank(a.$2.state).compareTo(_rank(b.$2.state));
      return r != 0 ? r : a.$1.compareTo(b.$1);
    });
  return [for (final e in indexed) e.$2];
}

/// المنتجات التي تمنع «تم جمع الطلب» (لم تكتمل ولا سبب لنقصها).
List<PickItem> pendingItems(List<PickItem> items) => items.where((i) => !i.settled).toList();

/// يُسمح بإنهاء الجمع: لا منتج معلّق وفي الطلب منتج واحد على الأقل.
bool canFinishPick(List<PickItem> items) => items.isNotEmpty && pendingItems(items).isEmpty;

/// إنقاص كمية منتج مطلوب إلى [qty] يحتاج سبباً (نقص أو إزالة).
bool needsReason(PickItem item, int qty) => !item.isExtra && qty < item.orderedQty;

/// الأسطر الناقصة بلا سبب (تُسأل قبل الإنهاء).
List<PickItem> shortWithoutReason(List<PickItem> items) =>
    items.where((i) => !i.isExtra && i.picked < i.orderedQty && !i.hasReason).toList();

/// أعداد الرأس: مجموع / متبقٍ / أُزيل / إضافي (بالمنتجات).
({int collected, int remaining, int removed, int extra}) pickTally(List<PickItem> items) {
  var c = 0, r = 0, x = 0, e = 0;
  for (final i in items) {
    switch (i.state) {
      case PickItemState.collected || PickItemState.over:
        c++;
      case PickItemState.pending || PickItemState.partial:
        r++;
      case PickItemState.short || PickItemState.removed:
        x++;
      case PickItemState.extra:
        e++;
    }
  }
  return (collected: c, remaining: r, removed: x, extra: e);
}

/// القطع المجموعة من المطلوب (بلا الزيادة) والمطلوبة.
({int done, int all}) pickUnits(List<PickItem> items) {
  var d = 0, a = 0;
  for (final i in items.where((i) => !i.isExtra)) {
    d += math.min(i.picked, i.orderedQty);
    a += i.orderedQty;
  }
  return (done: d, all: a);
}

// ---------------------------------------------------------------- منتج بالباركود (إضافة بالكاميرا)

/// المنتج موجود في الطلب أصلاً؟ (من رد `/pick/product`).
class PickInOrder {
  PickInOrder.fromJson(Map<String, dynamic> j)
    : lineId = '${j['lineId']}',
      kind = '${j['kind']}',
      orderedQty = _int(j['orderedQty']),
      pickedQty = _int(j['pickedQty']),
      missingQty = _int(j['missingQty']);
  final String lineId, kind;
  final int orderedQty, pickedQty, missingQty;
  bool get isExtra => kind == 'EXTRA';
}

class PickProductInfo {
  PickProductInfo.fromJson(Map<String, dynamic> j)
    : found = j['found'] == true,
      barcode = '${j['barcode'] ?? ''}',
      name = '${j['name'] ?? ''}',
      shadeName = _str(j['shadeName']),
      price = _int(j['price']),
      posOnly = j['posOnly'] == true,
      stock = _intOrNull(j['stock']),
      thumb = _str(j['thumb']),
      image = _str(j['image']),
      inOrder = j['inOrder'] is Map ? PickInOrder.fromJson(Map<String, dynamic>.from(j['inOrder'] as Map)) : null;
  final bool found, posOnly;
  final String barcode, name;
  final String? shadeName, thumb, image;
  final int price;

  /// مخزون المحل (null = غير معروف).
  final int? stock;
  final PickInOrder? inOrder;
  String? get bigImage => (image ?? '').isNotEmpty ? image : thumb;

  /// كم قطعة ستكمل الناقص (والباقي إضافي/زيادة).
  int get fillsMissing => inOrder != null && !inOrder!.isExtra ? inOrder!.missingQty : 0;
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
