import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fulfillment_app/core/api.dart';
import 'package:fulfillment_app/data/repo.dart';
import 'package:fulfillment_app/features/orders/order_screen.dart';
import 'package:fulfillment_app/features/pick/pick_widgets.dart';
import 'package:qr_flutter/qr_flutter.dart';

/// سيرفر وهمي على مستوى HTTP: طلب انتهى جمعه (بانتظار الكاشير) بنقص صنف وإضافة بديل.
class _FakeApi extends Api {
  _FakeApi(this.stage);
  final String stage;

  @override
  Future<T> get<T>(String path, {Map<String, dynamic>? query, T Function(dynamic)? map}) async {
    final body = switch (path.split('/').last) {
      'pick' => _pick,
      'shipment' => null,
      'timeline' => _timeline,
      _ => _order,
    };
    return map!(body);
  }

  Map<String, dynamic> get _order => {
    'id': 'o1',
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
      {'id': 'i1', 'productId': 'p1', 'name': 'أحمر شفاه', 'quantity': 2, 'unitPrice': 10000},
      {'id': 'i2', 'productId': 'p2', 'name': 'سيروم', 'quantity': 1, 'unitPrice': 25000},
    ],
  };

  Map<String, dynamic> get _pick => {
    'order': {'id': 'o1', 'orderNumber': 'ORD-MH3K2J1AF3C9', 'stage': stage, 'status': 'PROCESSING', 'total': 50000, 'parcelCount': 1},
    'lines': [
      {'id': 'a', 'kind': 'ORDERED', 'name': 'أحمر شفاه', 'orderedQty': 2, 'pickedQty': 2, 'state': 'MATCHED', 'color': 'green', 'label': 'مطابق'},
      {'id': 'b', 'kind': 'ORDERED', 'name': 'سيروم', 'orderedQty': 1, 'pickedQty': 0, 'state': 'SHORT', 'color': 'red', 'label': 'ناقص', 'reason': 'نفد المخزون'},
      {'id': 'x', 'kind': 'EXTRA', 'name': 'سيروم بديل', 'orderedQty': 0, 'pickedQty': 1, 'unitPrice': 15000, 'charge': 'PAID', 'substituteForLineId': 'b', 'state': 'EXTRA', 'color': 'yellow', 'label': 'إضافي'},
    ],
    'counts': {},
    'money': {'finalTotal': 40000, 'codAmount': 40000, 'shortageValue': 25000, 'extrasValue': 15000},
  };

  List<Map<String, dynamic>> get _timeline => [
    {'type': 'PICK_FINISHED', 'label': 'انتهى التجهيز', 'actorType': 'STAFF', 'actorName': 'نور', 'data': {'matched': 1, 'short': 1, 'extra': 1}},
  ];
}

void main() {
  Future<void> pump(WidgetTester tester, String stage) async {
    tester.view.physicalSize = const Size(360, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [repoProvider.overrideWithValue(Repo(_FakeApi(stage)))],
        child: const MaterialApp(
          home: Directionality(textDirection: TextDirection.rtl, child: OrderScreen(orderId: 'o1')),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  // يوقف التحديث التلقائي (مؤقت 15 ثانية) قبل نهاية الاختبار.
  Future<void> unmount(WidgetTester tester) => tester.pumpWidget(const SizedBox());

  testWidgets('after picking: stage track, pick result, QR card — no legacy buttons', (tester) async {
    await pump(tester, 'PICKED');
    expect(tester.takeException(), isNull);
    // مسار المراحل لا الحالة القديمة.
    expect(find.text('بانتظار الكاشير'), findsWidgets);
    expect(find.text('قيد التحضير'), findsNothing);
    // نتيجة الجمع.
    expect(find.text('سيُسلَّم 3 قطع في بندين'), findsOneWidget);
    expect(find.text('نفد المخزون'), findsOneWidget);
    expect(find.text('عرض تفاصيل الجمع'), findsOneWidget);
    // رمز الطلب الكبير للكاشير: محتواه رقم الطلب كما هو.
    expect(find.text('اعرض هذا الرمز على قارئ كاشير الطلبات'), findsOneWidget);
    expect(tester.widget<OrderQr>(find.byType(OrderQr)).orderNumber, 'ORD-MH3K2J1AF3C9');
    expect(find.byType(QrImageView), findsOneWidget);
    expect(find.byTooltip('رمز الطلب للكاشير'), findsOneWidget);
    // لا أزرار تتجاوز الكاشير وشركة التوصيل.
    expect(find.text('جاهز للتوصيل'), findsNothing);
    expect(find.text('تم التسليم'), findsWidgets); // اسم آخر خطوة في المسار فقط
    expect(find.widgetWithText(FilledButton, 'تم التسليم'), findsNothing);
    expect(find.text('عرض الرمز بحجم كبير للكاشير'), findsOneWidget);
    // المبلغ والخط الزمني.
    expect(find.text('الإجمالي النهائي'), findsOneWidget);
    expect(find.text('انتهى التجهيز'), findsOneWidget);
    await unmount(tester);
  });

  testWidgets('before picking: ordered items with correct counts and a confirm button', (tester) async {
    await pump(tester, 'CONFIRMED');
    expect(tester.takeException(), isNull);
    expect(find.text('بندان · 3 قطع'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'تأكيد الطلب'), findsOneWidget);
    expect(find.byType(QrImageView), findsNothing);
    await unmount(tester);
  });
}
