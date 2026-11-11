import 'package:flutter_test/flutter_test.dart';
import 'package:manager_app/core/theme.dart';
import 'package:manager_app/data/pick_models.dart';
import 'package:manager_app/features/pick/pick_widgets.dart';

Map<String, dynamic> _view({List<Map<String, dynamic>>? lines, String stage = 'PICKING'}) => {
  'order': {'id': 'o1', 'orderNumber': 'ORD-MH3K2J1AF3C9', 'stage': stage, 'status': 'PROCESSING', 'total': 48000, 'paymentStatus': 'PENDING'},
  'lines':
      lines ??
      [
        {'id': 'a', 'kind': 'ORDERED', 'name': 'أحمر شفاه', 'barcode': '6281000000011', 'orderedQty': 2, 'pickedQty': 1, 'unitPrice': 10000, 'state': 'PENDING', 'color': 'grey', 'label': 'لم يُمسح بعد'},
        {'id': 'b', 'kind': 'ORDERED', 'name': 'سيروم', 'orderedQty': 1, 'pickedQty': 0, 'unitPrice': 15000, 'state': 'SHORT', 'color': 'red', 'label': 'ناقص', 'reason': 'نفد المخزون'},
        {'id': 'x', 'kind': 'EXTRA', 'name': 'بديل', 'orderedQty': 0, 'pickedQty': 1, 'unitPrice': 6500, 'charge': 'FREE', 'state': 'EXTRA', 'color': 'yellow', 'label': 'إضافي'},
      ],
  'counts': {'matched': 0, 'short': 1, 'pending': 1, 'extra': 1, 'orderedUnits': 3, 'pickedOrderedUnits': 1, 'extraUnits': 1},
  'money': {'finalTotal': 15000, 'codAmount': 15000, 'shortageValue': 25000, 'changed': true, 'allMissing': false},
  'canFinish': true,
};

void main() {
  group('order code', () {
    test('accepts the printed order number in any case, with or without the dash', () {
      expect(isOrderCode('ORD-MH3K2J1AF3C9'), isTrue);
      expect(isOrderCode('ord-mh3k2j1af3c9'), isTrue);
      expect(isOrderCode('ORDMH3K2J1AF3C9'), isTrue);
    });
    test('product barcodes are not order codes', () {
      expect(isOrderCode('6281000000011'), isFalse);
      expect(isOrderCode('ORD-12'), isFalse);
    });
  });

  group('pick view', () {
    test('parses lines, ordered vs extra, short lines and units', () {
      final v = PickView.fromJson(_view());
      expect(v.ordered.length, 2);
      expect(v.extras.single.isFree, isTrue);
      expect(v.shortLines.map((l) => l.id), ['a', 'b']);
      expect(v.pickedUnits, 1);
      expect(v.orderedUnits, 3);
      expect(v.picking, isTrue);
      expect(v.money.codAmount, 15000);
    });

    test('instant scan display turns a completed line green', () {
      final v = PickView.fromJson(_view());
      final a = v.ordered.first;
      final done = a.withPicked(2);
      expect(done.color, 'green');
      expect(done.missingQty, 0);
      final nv = v.replaceLine(done);
      expect(nv.pickedUnits, 2);
      expect(nv.shortLines.map((l) => l.id), ['b']);
    });

    test('finished stages', () {
      expect(PickView.fromJson(_view(stage: 'PICKED')).finished, isTrue);
      expect(PickView.fromJson(_view(stage: 'READY_FOR_PICKUP')).finished, isTrue);
      expect(PickView.fromJson(_view(stage: 'CONFIRMED')).startable, isTrue);
    });
  });

  group('colours', () {
    test('green matched, red short, yellow extra, grey pending', () {
      expect(pickColor('green').fg, AppColors.success);
      expect(pickColor('red').fg, AppColors.danger);
      expect(pickColor('yellow').fg, AppColors.warning);
      expect(pickColor('grey').fg, AppColors.muted);
    });
  });

  test('every server stage has an Arabic label', () {
    for (final s in ['NEW', 'CONFIRMED', 'PICKING', 'PICKED', 'READY_FOR_PICKUP', 'INVOICED', 'HANDED_OVER', 'OUT_FOR_DELIVERY', 'DELIVERY_ISSUE', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNING', 'RETURNED', 'CANCELLED']) {
      expect(stageLabels[s], isNotNull, reason: s);
    }
  });
}
