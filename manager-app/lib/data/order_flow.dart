import '../core/format.dart';
import 'models.dart';
import 'pick_models.dart';

// مسار الطلب في المحل: التجهيز بالمسح ← كاشير الطلبات ← هاي إكسبريس.
// ملف بلا واجهة (قابل للاختبار) — الألوان والأيقونات في features/orders/order_widgets.dart.

int _int(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
int? _intOrNull(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse('$v'));
String? _str(dynamic v) => v == null || '$v'.trim().isEmpty ? null : '$v';

/// قبل بدء التجهيز.
const stagesBeforePicking = {'NEW', 'CONFIRMED'};

/// فُوتر في كاشير الطلبات أو بعده (الشحن والتسليم والمرتجع).
const stagesInvoicedOrLater = {
  'INVOICED',
  'HANDED_OVER',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ISSUE',
  'DELIVERED',
  'PARTIALLY_DELIVERED',
  'RETURNING',
  'RETURNED',
};

/// يُلغى الطلب من التطبيق قبل الفوترة فقط (بعدها الإلغاء من الكاشير أو شركة التوصيل).
const stagesCancellable = {'NEW', 'CONFIRMED', 'PICKING', 'PICKED', 'READY_FOR_PICKUP'};

/// مراحل المشاكل والمرتجعات (تبويب وشارة تنبيه).
const stagesIssues = {'DELIVERY_ISSUE', 'RETURNING', 'RETURNED', 'PARTIALLY_DELIVERED'};

/// بدأ التجهيز (أو انتهى) — نعرض نتيجة المسح بدل الأصناف المطلوبة.
bool pickStartedFor(String? stage) => stage != null && !stagesBeforePicking.contains(stage) && stage != 'CANCELLED';

// ---------------------------------------------------------------- نتيجة التجهيز المختصرة

/// ملخص التجهيز في الطابور وتفاصيل الطلب. null قبل بدء التجهيز أو من سيرفر أقدم.
/// `units` = ما سيُسلَّم فعلاً (المطابق + الإضافي).
class PickTally {
  const PickTally({
    required this.lines,
    required this.units,
    required this.matchedUnits,
    required this.missingUnits,
    required this.extraUnits,
    required this.extraLines,
    required this.shortLines,
  });

  static PickTally? fromJson(dynamic j) => j is Map
      ? PickTally(
          lines: _int(j['lines']),
          units: _int(j['units']),
          matchedUnits: _int(j['matchedUnits']),
          missingUnits: _int(j['missingUnits']),
          extraUnits: _int(j['extraUnits']),
          extraLines: _int(j['extraLines']),
          shortLines: _int(j['shortLines']),
        )
      : null;

  final int lines, units, matchedUnits, missingUnits, extraUnits, extraLines, shortLines;
}

/// «4 بنود · 7 قطع» — أو القطع وحدها إن لم يُرسل السيرفر عدد البنود.
String orderSizeLabel({required int lines, required int units}) =>
    lines > 0 ? '${linesLabel(lines)} · ${piecesLabel(units)}' : piecesLabel(units);

/// «سيُسلَّم 7 قطع في 4 بنود».
String deliverLabel({required int units, int lines = 0}) =>
    lines > 0 ? 'سيُسلَّم ${piecesLabel(units)} في ${linesLabel(lines, genitive: true)}' : 'سيُسلَّم ${piecesLabel(units)}';

// ---------------------------------------------------------------- مسار المراحل

class StageStep {
  const StageStep(this.key, this.label);
  final String key, label;
}

/// شريط تنبيه للمراحل غير العادية (مشكلة توصيل، مرتجع، إلغاء).
class StageAlert {
  const StageAlert({required this.stage, required this.title, required this.message, this.severe = true});
  final String stage, title, message;

  /// أحمر (true) أو أصفر (false).
  final bool severe;
}

class StageTrack {
  const StageTrack({required this.steps, required this.current, required this.complete, this.alert});
  final List<StageStep> steps;

  /// موضع المرحلة الحالية في المسار (-1 = خارج المسار، مثل الإلغاء).
  final int current;

  /// وصل الطلب للنهاية (تم التسليم).
  final bool complete;
  final StageAlert? alert;

  bool isDone(int i) => i < current || (complete && i == current);
}

const _deliverySteps = [
  StageStep('NEW', 'جديد'),
  StageStep('PICKING', 'قيد التجهيز'),
  StageStep('PICKED', 'بانتظار الكاشير'),
  StageStep('INVOICED', 'مُفوتر'),
  StageStep('OUT_FOR_DELIVERY', 'مع المندوب'),
  StageStep('DELIVERED', 'تم التسليم'),
];

const _pickupSteps = [
  StageStep('NEW', 'جديد'),
  StageStep('PICKING', 'قيد التجهيز'),
  StageStep('READY_FOR_PICKUP', 'جاهز للاستلام'),
  StageStep('DELIVERED', 'تم التسليم'),
];

const _alerts = {
  'DELIVERY_ISSUE': StageAlert(
    stage: 'DELIVERY_ISSUE',
    title: 'مشكلة توصيل',
    message: 'تعذّر التوصيل مؤقتاً — راجع حالة الشحنة وتواصل مع الزبونة.',
  ),
  'RETURNING': StageAlert(stage: 'RETURNING', title: 'راجع للمحل', message: 'الشحنة في طريق العودة إلى المحل.'),
  'RETURNED': StageAlert(stage: 'RETURNED', title: 'مُرتجع', message: 'عادت الشحنة — سجّل إيصال الإرجاع في كاشير الطلبات.'),
  'PARTIALLY_DELIVERED': StageAlert(
    stage: 'PARTIALLY_DELIVERED',
    title: 'تسليم جزئي',
    message: 'استلمت الزبونة جزءاً من الطلب والباقي يعود للمحل.',
    severe: false,
  ),
  'CANCELLED': StageAlert(stage: 'CANCELLED', title: 'الطلب ملغي', message: 'لا يُجهَّز ولا يُشحن.'),
};

/// مسار الطلب حسب مرحلته: توصيل (6 خطوات) أو استلام من المحل (4 خطوات).
StageTrack stageTrack(String stage, {required bool pickup}) {
  final base = pickup ? _pickupSteps : _deliverySteps;
  final int current = pickup
      ? switch (stage) {
          'NEW' || 'CONFIRMED' => 0,
          'PICKING' => 1,
          'DELIVERED' || 'PARTIALLY_DELIVERED' => 3,
          'CANCELLED' => -1,
          _ => 2,
        }
      : switch (stage) {
          'NEW' || 'CONFIRMED' => 0,
          'PICKING' => 1,
          'PICKED' || 'READY_FOR_PICKUP' => 2,
          'INVOICED' || 'HANDED_OVER' => 3,
          'OUT_FOR_DELIVERY' || 'DELIVERY_ISSUE' || 'RETURNING' || 'RETURNED' => 4,
          'DELIVERED' || 'PARTIALLY_DELIVERED' => 5,
          _ => -1,
        };
  // المرحلة الفعلية تظهر باسمها في موضعها (مؤكد، سُلّم للشحن، تسليم جزئي).
  final steps = [
    for (var i = 0; i < base.length; i++)
      i == current && const {'CONFIRMED', 'HANDED_OVER', 'PARTIALLY_DELIVERED'}.contains(stage)
          ? StageStep(stage, stageLabels[stage]!)
          : base[i],
  ];
  return StageTrack(
    steps: steps,
    current: current,
    complete: stage == 'DELIVERED' || stage == 'PARTIALLY_DELIVERED',
    alert: _alerts[stage],
  );
}

/// ما ينتظره الطلب بعد التجهيز — يظهر مكان الأزرار (لا انتقالات يدوية).
({String title, String? hint})? stageWaiting(String? stage, {bool pickup = false}) => switch (stage) {
  'PICKED' => (title: 'بانتظار كاشير الطلبات', hint: 'ضع قائمة التجهيز مع الكيس عند الكاشير ليفوتره'),
  'READY_FOR_PICKUP' => (title: 'جاهز للاستلام من المحل', hint: 'تُسلَّم للزبونة من كاشير الطلبات'),
  'INVOICED' => (title: 'مُفوتر — بانتظار هاي إكسبريس', hint: 'يُسلَّم الكيس لمندوب شركة التوصيل'),
  'HANDED_OVER' => (title: 'سُلّم لهاي إكسبريس', hint: 'تتحدث الحالة تلقائياً من شركة التوصيل'),
  'OUT_FOR_DELIVERY' => (title: 'مع المندوب', hint: 'تتحدث الحالة تلقائياً من شركة التوصيل'),
  'DELIVERY_ISSUE' => (title: 'مشكلة توصيل', hint: 'راجع بطاقة الشحنة وتواصل مع الزبونة'),
  'DELIVERED' => (title: 'تم التسليم', hint: pickup ? 'استلمته الزبونة من المحل' : null),
  'PARTIALLY_DELIVERED' => (title: 'تسليم جزئي', hint: 'الجزء الراجع يُستلم بإيصال إرجاع في الكاشير'),
  'RETURNING' => (title: 'راجع للمحل', hint: 'استلم الكيس وسجّل الإرجاع في كاشير الطلبات'),
  'RETURNED' => (title: 'مُرتجع', hint: null),
  _ => null,
};

// ---------------------------------------------------------------- تبويبات الطابور

/// تبويب في طابور الطلبات: حالة العميل («open») أو مراحل التجهيز («stage:A,B»).
class OrderTab {
  const OrderTab(this.key, this.label);
  final String key, label;

  String? get status => key.startsWith('stage:') ? null : key;
  String? get stage => key.startsWith('stage:') ? key.substring(6) : null;

  /// العدد من `counts` (مفاتيح «stage:X» تُجمع). null إن لم يُرسله السيرفر.
  int? countIn(Map<String, int> counts) {
    final s = stage;
    if (s == null) return counts[key];
    final parts = s.split(',');
    if (!parts.any((p) => counts.containsKey('stage:$p'))) return null;
    return parts.fold<int>(0, (n, p) => n + (counts['stage:$p'] ?? 0));
  }
}

const tabOpen = OrderTab('open', 'المفتوحة');
const tabNew = OrderTab('stage:NEW', 'جديدة');
const tabToPick = OrderTab('stage:CONFIRMED', 'للتجهيز');
const tabPicking = OrderTab('stage:PICKING', 'قيد التجهيز');
const tabCashier = OrderTab('stage:PICKED,READY_FOR_PICKUP', 'بانتظار الكاشير');
const tabCourier = OrderTab('stage:INVOICED,HANDED_OVER', 'بانتظار شركة التوصيل');
const tabOut = OrderTab('stage:OUT_FOR_DELIVERY', 'مع المندوب');
const tabIssues = OrderTab('stage:DELIVERY_ISSUE,RETURNING,RETURNED,PARTIALLY_DELIVERED', 'مشاكل ومرتجعات');
const tabDone = OrderTab('stage:DELIVERED', 'مكتملة');
const tabCancelled = OrderTab('stage:CANCELLED', 'ملغاة');

const orderTabs = [tabOpen, tabNew, tabToPick, tabPicking, tabCashier, tabCourier, tabOut, tabIssues, tabDone];

/// مفتاح تبويب من رابط قديم بحالة العميل (مثل «orders:PENDING» في صحة المتجر).
String orderTabKey(String? raw, List<OrderTab> tabs) {
  if (raw == null || raw.isEmpty) return tabOpen.key;
  if (tabs.any((t) => t.key == raw)) return raw;
  final legacy = switch (raw) {
    'PENDING' => tabNew.key,
    'CONFIRMED' => tabToPick.key,
    'PROCESSING' => tabPicking.key,
    'SHIPPED' => tabCourier.key,
    'DELIVERED' => tabDone.key,
    'CANCELLED' || 'REFUNDED' => tabCancelled.key,
    _ => tabOpen.key,
  };
  return tabs.any((t) => t.key == legacy) ? legacy : tabOpen.key;
}

// ---------------------------------------------------------------- الشحنة (هاي إكسبريس)

const shipmentStateLabels = {
  'PENDING': 'بانتظار الإنشاء',
  'CREATING': 'قيد الإنشاء',
  'CREATED': 'أُنشئت',
  'RETRYING': 'إعادة المحاولة',
  'FAILED': 'تعذّر الإنشاء',
  'CANCELLED': 'ملغاة',
};

class ShipmentEvent {
  ShipmentEvent.fromJson(Map<String, dynamic> j)
    : label = _str(j['label']) ?? '',
      note = _str(j['note']),
      at = parseDate(j['statusAt'] ?? j['receivedAt']);
  final String label;
  final String? note;
  final DateTime? at;
}

class ShipmentInfo {
  ShipmentInfo.fromJson(Map<String, dynamic> j)
    : state = '${j['state'] ?? ''}',
      trackingNumber = _str(j['trackingNumber']),
      statusName = _str(j['statusName']),
      statusAt = parseDate(j['statusAt']),
      driverName = _str(j['driverName']),
      codAmount = _intOrNull(j['codAmount']),
      collectedAmount = _intOrNull(j['collectedAmount']),
      deliveryAttempts = _int(j['deliveryAttempts']),
      lastError = _str(j['lastError']),
      alert = _str(j['alert']),
      isFinal = j['isFinal'] == true,
      events = (j['events'] is List ? j['events'] as List : const [])
          .whereType<Map>()
          .map((e) => ShipmentEvent.fromJson(Map<String, dynamic>.from(e)))
          .where((e) => e.label.isNotEmpty)
          .toList();

  /// null أو شكل غير متوقع = لا شحنة.
  static ShipmentInfo? tryParse(dynamic j) => j is Map && j.isNotEmpty ? ShipmentInfo.fromJson(Map<String, dynamic>.from(j)) : null;

  final String state;
  final String? trackingNumber, statusName, driverName, lastError, alert;
  final DateTime? statusAt;
  final int? codAmount, collectedAmount;
  final int deliveryAttempts;
  final bool isFinal;
  final List<ShipmentEvent> events;

  String get stateLabel => shipmentStateLabels[state] ?? state;
  bool get failing => state == 'FAILED' || state == 'RETRYING';
}

// ---------------------------------------------------------------- الخط الزمني

/// سطر التفاصيل تحت حدث الخط الزمني (من حقل data).
String? timelineDetail(TimelineEntry e) {
  final d = e.data;
  String? s(String k) => _str(d[k]);
  String join(Iterable<String?> parts) => parts.whereType<String>().where((x) => x.trim().isNotEmpty).join(' · ');
  String? totals(String from, String to) {
    final a = _intOrNull(d[from]), b = _intOrNull(d[to]);
    return a != null && b != null && a != b ? '${money(a)} ← ${money(b)}' : null;
  }

  final out = switch (e.type) {
    'STATUS_CHANGED' => join([
      if (s('status') != null) 'إلى «${orderStatusLabels[s('status')] ?? s('status')}»',
      s('reason'),
    ]),
    'PICK_FINISHED' => join([
      if (d['matched'] != null) 'مطابق ${_int(d['matched'])}',
      if (_int(d['short']) > 0) 'ناقص ${_int(d['short'])}',
      if (_int(d['extra']) > 0) 'إضافي ${_int(d['extra'])}',
      if (d['parcelCount'] != null) '${_int(d['parcelCount'])} كيس',
      totals('originalTotal', 'finalTotal'),
    ]),
    'PICK_EXTRA_ADDED' => join([
      [s('name'), if (s('shadeName') != null) '(${s('shadeName')})'].whereType<String>().join(' '),
      if (d['qty'] != null) '×${_int(d['qty'])}',
      if (s('charge') == 'FREE') 'هدية',
      s('reason'),
    ]),
    'PICK_LINE_EDITED' => join([s('line') ?? s('name'), s('reason')]),
    'POS_EDIT' => join([
      [s('name'), if (s('shadeName') != null) '(${s('shadeName')})'].whereType<String>().join(' '),
      if (d['from'] != null && d['to'] != null) '${_int(d['from'])} ← ${_int(d['to'])}',
      totals('oldTotal', 'newTotal'),
    ]),
    'INVOICED' || 'PICKUP_HANDED' || 'POS_RETURN' => join([
      if (s('receiptNumber') != null) 'إيصال ${s('receiptNumber')}',
      if (d['total'] != null) money(_int(d['total'])),
    ]),
    'SHIPMENT_CREATED' => join([if (s('tracking') != null) 'رقم التتبع ${s('tracking')}']),
    'COURIER_STATUS' => join([s('label'), s('note'), if (s('driver') != null) 'المندوب: ${s('driver')}']),
    'CUSTOMER_NOTIFIED' => join([s('title')]),
    'SHIPMENT_DECISION' => join([s('decision'), s('note')]),
    _ => join([s('reason') ?? s('note') ?? s('error') ?? s('message')]),
  };
  return out.isEmpty ? null : out;
}

/// من قام بالحدث: «سارة · كاشير الطلبات».
String? timelineActor(TimelineEntry e) {
  final role = switch (e.actorType) {
    'CASHIER' => 'كاشير الطلبات',
    'COURIER' => 'هاي إكسبريس',
    'CUSTOMER' => 'الزبونة',
    'SYSTEM' => 'النظام',
    _ => null,
  };
  final name = e.actorName;
  if (name == null || name.trim().isEmpty) return role;
  return role == null ? name : '$name · $role';
}
