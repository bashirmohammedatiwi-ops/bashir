import 'package:alhayaa/data/models/order.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, dynamic> _order([Map<String, dynamic> extra = const {}]) => {
      'id': 'o1',
      'orderNumber': 'ORD-1',
      'status': 'SHIPPED',
      'total': 50000,
      'items': const [],
      ...extra,
    };

void main() {
  group('OrderDelivery parsing (null-safe)', () {
    test('old server: no delivery key', () {
      final o = AppOrder.fromJson(_order());
      expect(o.delivery, isNull);
      expect(o.isAdjusted, isFalse);
      expect(o.amountDue, 50000);
    });

    test('delivery null or not an object', () {
      expect(AppOrder.fromJson(_order({'delivery': null})).delivery, isNull);
      expect(AppOrder.fromJson(_order({'delivery': 'x'})).delivery, isNull);
      expect(AppOrder.fromJson(_order({'delivery': const []})).delivery, isNull);
    });

    test('empty delivery object gives safe defaults', () {
      final d = AppOrder.fromJson(_order({'delivery': <String, dynamic>{}})).delivery!;
      expect(d.stage, isNull);
      expect(d.hasCourier, isFalse);
      expect(d.changes, isEmpty);
      expect(d.prepaid, isFalse);
      expect(d.adjusted, isFalse);
      expect(d.codAmount, isNull);
      expect(d.activeDriver, isNull);
    });

    test('full block: courier, driver, changes, totals', () {
      final o = AppOrder.fromJson(_order({
        'delivery': {
          'stage': 'OUT_FOR_DELIVERY',
          'stageLabel': 'مع المندوب',
          'courier': 'هاي إكسبريس',
          'trackingNumber': 'HX123',
          'courierStatus': 'مع المندوب',
          'driverName': 'علي',
          'originalTotal': 50000,
          'finalTotal': '42000',
          'codAmount': 42000,
          'prepaid': false,
          'adjusted': true,
          'changes': [
            {'name': 'أحمر شفاه', 'shadeName': 'Ruby', 'kind': 'missing', 'color': 'red', 'qty': 1, 'ordered': 2, 'picked': 1, 'free': false, 'unitPrice': 8000},
            {'name': 'عيّنة عطر', 'shadeName': null, 'kind': 'extra', 'color': 'yellow', 'qty': 1, 'ordered': 0, 'picked': 1, 'free': true, 'unitPrice': 0},
          ],
        },
      }));
      final d = o.delivery!;
      expect(d.outForDelivery, isTrue);
      expect(d.hasCourier, isTrue);
      expect(d.trackingNumber, 'HX123');
      expect(d.activeDriver, 'علي');
      expect(d.finalTotal, 42000);
      expect(d.missing.single.shadeName, 'Ruby');
      expect(d.missing.single.qty, 1);
      expect(d.extras.single.free, isTrue);
      expect(d.extras.single.shadeName, isNull);
      expect(d.fullyPaid, isFalse);
      expect(o.isAdjusted, isTrue);
      expect(o.amountDue, 42000);
    });

    test('driver only shown while out for delivery', () {
      final d = OrderDelivery.fromJson({'stage': 'delivery_issue', 'driverName': 'علي'})!;
      expect(d.stage, 'DELIVERY_ISSUE');
      expect(d.deliveryIssue, isTrue);
      expect(d.activeDriver, isNull);
    });

    test('changes: kind falls back to colour, unknown or nameless rows dropped', () {
      final d = OrderDelivery.fromJson({
        'changes': [
          {'name': 'A', 'color': 'red', 'qty': 2},
          {'name': 'B', 'color': 'yellow'},
          {'name': 'C', 'kind': 'weird', 'color': 'green'},
          {'kind': 'missing', 'qty': 1},
          'not-a-map',
          null,
        ],
      })!;
      expect(d.changes.map((c) => c.name), ['A', 'B']);
      expect(d.changes[0].isMissing, isTrue);
      expect(d.changes[0].qty, 2);
      expect(d.changes[1].isExtra, isTrue);
      expect(d.changes[1].qty, 1, reason: 'missing qty defaults to 1');
    });

    test('changes not a list', () {
      expect(OrderDelivery.fromJson({'changes': null})!.changes, isEmpty);
      expect(OrderDelivery.fromJson({'changes': 'x'})!.changes, isEmpty);
    });

    test('prepaid with nothing to collect is fully paid', () {
      expect(OrderDelivery.fromJson({'prepaid': true, 'codAmount': 0})!.fullyPaid, isTrue);
      expect(OrderDelivery.fromJson({'prepaid': true, 'codAmount': 3000})!.fullyPaid, isFalse);
    });

    test('adjusted without finalTotal keeps the original total as amount due', () {
      final o = AppOrder.fromJson(_order({
        'delivery': {'adjusted': true, 'finalTotal': null},
      }));
      expect(o.isAdjusted, isFalse);
      expect(o.amountDue, 50000);
    });

    test('blank strings become null', () {
      final d = OrderDelivery.fromJson({'courier': '  ', 'trackingNumber': '', 'stageLabel': null})!;
      expect(d.courier, isNull);
      expect(d.trackingNumber, isNull);
      expect(d.stageLabel, isNull);
    });
  });
}
