import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fulfillment_app/core/format.dart';
import 'package:fulfillment_app/data/models.dart';
import 'package:fulfillment_app/data/order_flow.dart';
import 'package:fulfillment_app/data/pick_models.dart';
import 'package:fulfillment_app/features/orders/order_widgets.dart';
import 'package:fulfillment_app/features/pick/pick_widgets.dart';

Map<String, dynamic> _summary({Map<String, dynamic>? pick, String stage = 'PICKED', String? customer}) => {
  'id': 'o1',
  'orderNumber': 'ORD-MH3K2J1AF3C9',
  'status': 'PROCESSING',
  'paymentStatus': 'PAID',
  'paymentMethod': 'CARD',
  'deliveryOption': 'STANDARD',
  'total': 48000,
  'itemsCount': 4,
  'quantity': 7,
  'customer': customer ?? 'سارة',
  'place': 'بغداد · المنصور',
  'thumbs': <String>[],
  'fulfillmentStage': stage,
  'pickerName': 'نور',
  'adjusted': true,
  'pick': pick,
};

const _tally = {'lines': 4, 'units': 6, 'matchedUnits': 5, 'missingUnits': 2, 'extraUnits': 1, 'extraLines': 1, 'shortLines': 1};

void main() {
  group('Arabic counts', () {
    test('pieces', () {
      expect(piecesLabel(1), 'قطعة واحدة');
      expect(piecesLabel(2), 'قطعتان');
      expect(piecesLabel(2, genitive: true), 'قطعتين');
      expect(piecesLabel(3), '3 قطع');
      expect(piecesLabel(7), '7 قطع');
      expect(piecesLabel(10), '10 قطع');
      expect(piecesLabel(11), '11 قطعة');
      expect(piecesLabel(100), '100 قطعة');
      expect(piecesLabel(103), '103 قطع');
      expect(piecesLabel(0), '0 قطعة');
    });
    test('lines', () {
      expect(linesLabel(1), 'بند واحد');
      expect(linesLabel(2), 'بندان');
      expect(linesLabel(2, genitive: true), 'بندين');
      expect(linesLabel(4), '4 بنود');
      expect(linesLabel(12), '12 بنداً');
      expect(linesLabel(200), '200 بند');
    });
    test('order size and delivery labels', () {
      expect(orderSizeLabel(lines: 4, units: 7), '4 بنود · 7 قطع');
      expect(orderSizeLabel(lines: 0, units: 7), '7 قطع');
      expect(deliverLabel(units: 6), 'سيُسلَّم 6 قطع');
      expect(deliverLabel(units: 7, lines: 4), 'سيُسلَّم 7 قطع في 4 بنود');
      expect(deliverLabel(units: 2, lines: 2), 'سيُسلَّم قطعتان في بندين');
    });
  });

  group('new optional fields', () {
    test('list row with pick', () {
      final o = OrderSummary.fromJson(_summary(pick: _tally));
      expect(o.itemsCount, 4);
      expect(o.quantity, 7);
      expect(o.pick, isNotNull);
      expect(o.pick!.units, 6);
      expect(o.pick!.missingUnits, 2);
      expect(o.pick!.extraUnits, 1);
      expect(o.stage, 'PICKED');
    });
    test('list row without pick (before picking or older server)', () {
      final j = _summary(stage: 'NEW')..remove('pick');
      final o = OrderSummary.fromJson(j);
      expect(o.pick, isNull);
      expect(OrderSummary.fromJson(_summary(pick: null)).pick, isNull);
    });
    test('detail counts fall back to items when the server omits them', () {
      final base = {
        'id': 'o1',
        'orderNumber': 'ORD-1',
        'status': 'CONFIRMED',
        'fulfillmentStage': 'CONFIRMED',
        'items': [
          {'id': 'i1', 'name': 'أحمر شفاه', 'quantity': 2},
          {'id': 'i2', 'name': 'سيروم', 'quantity': 3},
        ],
      };
      final old = OrderDetail.fromJson(base);
      expect(old.lines, 2);
      expect(old.units, 5);
      expect(old.pick, isNull);
      expect(old.pickStarted, isFalse);
      expect(old.cancellable, isTrue);

      final fresh = OrderDetail.fromJson({
        ...base,
        'fulfillmentStage': 'INVOICED',
        'linesCount': 6,
        'unitsCount': 9,
        'pick': _tally,
        'posInvoicedAt': '2026-11-12T10:00:00Z',
        'posCashierName': 'زينب',
        'posReceiptNumber': 'R-77',
      });
      expect(fresh.lines, 6);
      expect(fresh.units, 9);
      expect(fresh.pick!.lines, 4);
      expect(fresh.posCashierName, 'زينب');
      expect(fresh.invoiced, isTrue);
      expect(fresh.pickStarted, isTrue);
      expect(fresh.cancellable, isFalse);
    });
    test('shipment parse', () {
      expect(ShipmentInfo.tryParse(null), isNull);
      final s = ShipmentInfo.tryParse({
        'state': 'CREATED',
        'trackingNumber': 'HX123',
        'statusName': 'مع المندوب',
        'driverName': 'علي',
        'codAmount': 25000,
        'events': [
          {'label': 'استلم المندوب', 'statusAt': '2026-11-12T10:00:00Z'},
        ],
      })!;
      expect(s.stateLabel, 'أُنشئت');
      expect(s.codAmount, 25000);
      expect(s.events.single.label, 'استلم المندوب');
    });
  });

  group('stage track', () {
    test('delivery path', () {
      final t = stageTrack('NEW', pickup: false);
      expect(t.steps.map((s) => s.label), ['جديد', 'قيد التجهيز', 'بانتظار الكاشير', 'مُفوتر', 'مع المندوب', 'تم التسليم']);
      expect(t.current, 0);
      expect(stageTrack('CONFIRMED', pickup: false).steps.first.label, 'مؤكد');
      expect(stageTrack('PICKING', pickup: false).current, 1);
      expect(stageTrack('PICKED', pickup: false).current, 2);
      expect(stageTrack('INVOICED', pickup: false).current, 3);
      expect(stageTrack('HANDED_OVER', pickup: false).steps[3].label, 'سُلّم للشحن');
      expect(stageTrack('OUT_FOR_DELIVERY', pickup: false).current, 4);
      final done = stageTrack('DELIVERED', pickup: false);
      expect(done.current, 5);
      expect(done.complete, isTrue);
      expect(done.isDone(5), isTrue);
      expect(done.alert, isNull);
    });
    test('pickup path', () {
      final t = stageTrack('READY_FOR_PICKUP', pickup: true);
      expect(t.steps.map((s) => s.label), ['جديد', 'قيد التجهيز', 'جاهز للاستلام', 'تم التسليم']);
      expect(t.current, 2);
      expect(t.isDone(1), isTrue);
      expect(t.isDone(2), isFalse);
      expect(stageTrack('DELIVERED', pickup: true).current, 3);
    });
    test('issues, returns and cancel get a banner', () {
      for (final s in ['DELIVERY_ISSUE', 'RETURNING', 'RETURNED', 'PARTIALLY_DELIVERED', 'CANCELLED']) {
        expect(stageTrack(s, pickup: false).alert, isNotNull, reason: s);
      }
      expect(stageTrack('DELIVERY_ISSUE', pickup: false).current, 4);
      expect(stageTrack('PARTIALLY_DELIVERED', pickup: false).alert!.severe, isFalse);
      expect(stageTrack('CANCELLED', pickup: false).current, -1);
    });
    test('waiting text after picking, nothing before', () {
      expect(stageWaiting('PICKED')!.title, 'بانتظار كاشير الطلبات');
      expect(stageWaiting('INVOICED')!.title, 'مُفوتر — بانتظار هاي إكسبريس');
      expect(stageWaiting('NEW'), isNull);
      expect(stageWaiting('PICKING'), isNull);
    });
  });

  group('queue tabs', () {
    test('counts sum the stage keys', () {
      final counts = {'open': 12, 'stage:INVOICED': 2, 'stage:HANDED_OVER': 3, 'stage:RETURNED': 1};
      expect(tabOpen.countIn(counts), 12);
      expect(tabCourier.countIn(counts), 5);
      expect(tabIssues.countIn(counts), 1);
      expect(tabPicking.countIn(counts), isNull);
      expect(tabCourier.stage, 'INVOICED,HANDED_OVER');
      expect(tabOpen.status, 'open');
    });
    test('legacy status links map to stage tabs', () {
      expect(orderTabKey('PENDING', orderTabs), 'stage:NEW');
      expect(orderTabKey(null, orderTabs), 'open');
      expect(orderTabKey('CANCELLED', orderTabs), 'open');
      expect(orderTabKey('CANCELLED', [...orderTabs, tabCancelled]), 'stage:CANCELLED');
      expect(orderTabs.map((t) => t.label), [
        'المفتوحة',
        'جديدة',
        'للتجهيز',
        'قيد التجهيز',
        'بانتظار الكاشير',
        'بانتظار شركة التوصيل',
        'مع المندوب',
        'مشاكل ومرتجعات',
        'مكتملة',
      ]);
    });
  });

  group('timeline', () {
    test('cashier edit and courier status details', () {
      final edit = TimelineEntry.fromJson({
        'id': 'e1',
        'type': 'POS_EDIT',
        'label': 'عدّل كاشير الطلبات الأصناف',
        'actorType': 'CASHIER',
        'actorName': 'زينب',
        'data': {'name': 'سيروم', 'from': 2, 'to': 1, 'oldTotal': 30000, 'newTotal': 22000},
        'at': '2026-11-12T10:00:00Z',
      });
      expect(timelineDetail(edit), 'سيروم · 2 ← 1 · 30,000 د.ع ← 22,000 د.ع');
      expect(timelineActor(edit), 'زينب · كاشير الطلبات');
      final courier = TimelineEntry.fromJson({
        'type': 'COURIER_STATUS',
        'actorType': 'COURIER',
        'data': {'label': 'مع المندوب', 'driver': 'علي'},
      });
      expect(timelineDetail(courier), 'مع المندوب · المندوب: علي');
      expect(timelineActor(courier), 'هاي إكسبريس');
    });
  });

  group('layout on a 360dp phone', () {
    Future<void> pump(WidgetTester tester, Widget child) async {
      tester.view.physicalSize = const Size(360, 1400);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        MaterialApp(
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: Scaffold(body: ListView(padding: const EdgeInsets.all(16), children: [child])),
          ),
        ),
      );
    }

    testWidgets('order tile with long names does not overflow', (tester) async {
      final long = 'الزبونة ${'اسم طويل جداً ' * 6}';
      await pump(tester, OrderTile(order: OrderSummary.fromJson(_summary(pick: _tally, customer: long)), onTap: () {}));
      expect(tester.takeException(), isNull);
      expect(find.text('سيُسلَّم 6 قطع'), findsOneWidget);
      expect(find.textContaining('ناقص 2'), findsOneWidget);
      expect(find.textContaining('+1 إضافي'), findsOneWidget);
      await pump(tester, OrderTile(order: OrderSummary.fromJson(_summary(stage: 'CONFIRMED')..remove('pick')), onTap: () {}));
      expect(tester.takeException(), isNull);
      expect(find.text('4 بنود · 7 قطع'), findsOneWidget);
      expect(find.textContaining('تأكيد'), findsOneWidget);
      await pump(tester, OrderTile(order: OrderSummary.fromJson(_summary(stage: 'PICKING', pick: _tally)), onTap: () {}));
      expect(find.textContaining('متابعة الجمع'), findsOneWidget);
      expect(tileAction('PICKED')!.label, 'بانتظار الكاشير');
      expect(tileAction('INVOICED'), isNull);
    });

    testWidgets('stage track fits six steps', (tester) async {
      await pump(tester, const StageTrackPanel(stage: 'DELIVERY_ISSUE', pickup: false));
      expect(tester.takeException(), isNull);
      expect(find.text('مشكلة توصيل'), findsWidgets);
    });

    testWidgets('pick result section', (tester) async {
      final v = PickView.fromJson({
        'order': {'id': 'o1', 'orderNumber': 'ORD-1', 'stage': 'PICKED', 'status': 'PROCESSING', 'total': 48000, 'parcelCount': 2, 'pickerName': 'نور'},
        'lines': [
          {'id': 'a', 'kind': 'ORDERED', 'name': 'أحمر شفاه ${'طويل ' * 10}', 'orderedQty': 2, 'pickedQty': 2, 'state': 'MATCHED', 'color': 'green', 'label': 'مطابق'},
          {'id': 'b', 'kind': 'ORDERED', 'name': 'سيروم', 'orderedQty': 1, 'pickedQty': 0, 'state': 'SHORT', 'color': 'red', 'label': 'ناقص', 'reason': 'نفد المخزون'},
          {'id': 'x', 'kind': 'EXTRA', 'name': 'بديل', 'orderedQty': 0, 'pickedQty': 1, 'charge': 'FREE', 'substituteForLineId': 'b', 'state': 'EXTRA', 'color': 'yellow', 'label': 'إضافي'},
        ],
        'counts': {},
        'money': {'finalTotal': 20000, 'codAmount': 20000},
      });
      expect(v.deliverUnits, 3);
      expect(v.deliverLines, 2);
      expect(v.missingUnits, 1);
      expect(v.extraUnits, 1);
      await pump(tester, PickResultSection(view: v));
      expect(tester.takeException(), isNull);
      expect(find.text('سيُسلَّم 3 قطع في بندين'), findsOneWidget);
      expect(find.byType(PickItemCard), findsNWidgets(3));
      expect(find.text('أُزيل'), findsOneWidget);
      expect(find.text('نفد المخزون'), findsOneWidget);
      await pump(tester, PickFinishedSummary(view: v));
      expect(tester.takeException(), isNull);
      await pump(tester, PickProgressHeader(items: v.items, pickerName: 'نور'));
      expect(tester.takeException(), isNull);
      expect(find.text('جُمع 2 من 3 قطع'), findsOneWidget);
      expect(pendingItems(v.items), isEmpty);
    });

    testWidgets('shipment, money and timeline cards', (tester) async {
      final o = OrderDetail.fromJson({
        'id': 'o1',
        'orderNumber': 'ORD-1',
        'status': 'SHIPPED',
        'fulfillmentStage': 'OUT_FOR_DELIVERY',
        'subtotal': 45000,
        'shippingTotal': 5000,
        'total': 50000,
        'finalTotal': 42000,
        'codAmount': 42000,
        'coupon': 'COUPON-${'X' * 30}',
        'discountTotal': 1000,
        'posReceiptNumber': 'R-77',
        'posCashierName': 'زينب ${'الطويلة ' * 5}',
        'posInvoicedAt': '2026-11-12T10:00:00Z',
      });
      await pump(tester, OrderMoneyCard(order: o));
      expect(tester.takeException(), isNull);
      expect(find.text('الإجمالي النهائي'), findsOneWidget);
      await pump(
        tester,
        ShipmentCard(
          shipment: ShipmentInfo.tryParse({
            'state': 'FAILED',
            'trackingNumber': 'HX1234567890123456789',
            'statusName': 'مع المندوب',
            'driverName': 'علي ${'محمد ' * 6}',
            'codAmount': 42000,
            'lastError': 'خطأ ${'طويل ' * 20}',
          })!,
        ),
      );
      expect(tester.takeException(), isNull);
      await pump(
        tester,
        TimelineCard(
          entries: [
            TimelineEntry.fromJson({'type': 'PICK_FINISHED', 'label': 'انتهى التجهيز', 'actorType': 'STAFF', 'actorName': 'نور', 'data': {'matched': 3, 'short': 1, 'parcelCount': 1}}),
            TimelineEntry.fromJson({'type': 'INVOICED', 'label': 'فُوتر في كاشير الطلبات', 'actorType': 'CASHIER', 'actorName': 'زينب', 'data': {'receiptNumber': 'R-77', 'total': 42000}}),
          ],
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('إيصال R-77 · 42,000 د.ع'), findsOneWidget);
    });
  });
}
