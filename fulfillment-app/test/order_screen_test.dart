import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fulfillment_app/core/api.dart';
import 'package:fulfillment_app/data/models.dart';
import 'package:fulfillment_app/data/repo.dart';
import 'package:fulfillment_app/features/orders/order_screen.dart';

/// سيرفر وهمي: طلب انتهى تجهيزه (بانتظار الكاشير) بنقص صنف وإضافة بديل.
class _FakeRepo extends Repo {
  _FakeRepo(this.stage) : super(Api());
  final String stage;

  @override
  Future<OrderDetail> order(String id) async => OrderDetail.fromJson({
    'id': id,
    'orderNumber': 'ORD-MH3K2J1AF3C9',
    'status': 'PROCESSING',
    'paymentStatus': 'PENDING',
    'paymentMethod': 'COD',
    'deliveryOption': 'STANDARD',
    'fulfillmentStage': stage,
    'subtotal': 45000,
    'shippingTotal': 5000,
    'total': 50000,
    'finalTotal': 40000,
    'codAmount': 40000,
    'linesCount': 2,
    'unitsCount': 3,
    'customer': {'name': 'سارة ${'الاسم الطويل ' * 4}', 'phone': '07701234567', 'ordersCount': 3},
    'items': [
      {'id': 'i1', 'name': 'أحمر شفاه', 'quantity': 2, 'unitPrice': 10000},
      {'id': 'i2', 'name': 'سيروم', 'quantity': 1, 'unitPrice': 25000},
    ],
  });

  @override
  Future<PickView> pickView(String id) async => PickView.fromJson({
    'order': {'id': id, 'orderNumber': 'ORD-MH3K2J1AF3C9', 'stage': stage, 'status': 'PROCESSING', 'total': 50000, 'parcelCount': 1},
    'lines': [
      {'id': 'a', 'kind': 'ORDERED', 'name': 'أحمر شفاه', 'orderedQty': 2, 'pickedQty': 2, 'state': 'MATCHED', 'color': 'green', 'label': 'مطابق'},
      {'id': 'b', 'kind': 'ORDERED', 'name': 'سيروم', 'orderedQty': 1, 'pickedQty': 0, 'state': 'SHORT', 'color': 'red', 'label': 'ناقص', 'reason': 'نفد المخزون'},
      {'id': 'x', 'kind': 'EXTRA', 'name': 'سيروم بديل', 'orderedQty': 0, 'pickedQty': 1, 'unitPrice': 15000, 'charge': 'PAID', 'substituteForLineId': 'b', 'state': 'EXTRA', 'color': 'yellow', 'label': 'إضافي'},
    ],
    'counts': {},
    'money': {'finalTotal': 40000, 'codAmount': 40000, 'shortageValue': 25000, 'extrasValue': 15000},
  });

  @override
  Future<ShipmentInfo?> shipment(String id) async => null;

  @override
  Future<List<TimelineEntry>> timeline(String id) async => [
    TimelineEntry.fromJson({'type': 'PICK_FINISHED', 'label': 'انتهى التجهيز', 'actorType': 'STAFF', 'actorName': 'نور', 'data': {'matched': 1, 'short': 1, 'extra': 1}}),
  ];
}

void main() {
  Future<void> pump(WidgetTester tester, String stage) async {
    tester.view.physicalSize = const Size(360, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [repoProvider.overrideWithValue(_FakeRepo(stage))],
        child: const MaterialApp(
          home: Directionality(textDirection: TextDirection.rtl, child: OrderScreen(orderId: 'o1')),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('after picking: stage track, pick result, waiting bar — no legacy buttons', (tester) async {
    await pump(tester, 'PICKED');
    expect(tester.takeException(), isNull);
    // مسار المراحل لا الحالة القديمة.
    expect(find.text('بانتظار الكاشير'), findsWidgets);
    expect(find.text('قيد التحضير'), findsNothing);
    // نتيجة التجهيز.
    expect(find.text('سيُسلَّم 3 قطع في بندين'), findsOneWidget);
    expect(find.text('بديل عن: سيروم'), findsOneWidget);
    expect(find.text('نفد المخزون'), findsOneWidget);
    expect(find.text('عرض التجهيز'), findsOneWidget);
    // لا أزرار تتجاوز الكاشير وشركة التوصيل.
    expect(find.text('جاهز للتوصيل'), findsNothing);
    expect(find.text('تم التسليم'), findsWidgets); // اسم آخر خطوة في المسار فقط
    expect(find.widgetWithText(FilledButton, 'تم التسليم'), findsNothing);
    expect(find.text('بانتظار كاشير الطلبات'), findsOneWidget);
    // المبلغ والخط الزمني.
    expect(find.text('الإجمالي النهائي'), findsOneWidget);
    expect(find.text('انتهى التجهيز'), findsOneWidget);
  });

  testWidgets('before picking: ordered items with correct counts and a start button', (tester) async {
    await pump(tester, 'CONFIRMED');
    expect(tester.takeException(), isNull);
    expect(find.text('بندان · 3 قطع'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'بدء التجهيز بالمسح'), findsOneWidget);
  });
}
