import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fulfillment_app/core/api.dart';
import 'package:fulfillment_app/core/prefs.dart';
import 'package:fulfillment_app/core/theme.dart';
import 'package:fulfillment_app/data/repo.dart';
import 'package:fulfillment_app/features/pick/pick_screen.dart';
import 'package:fulfillment_app/features/pick/pick_sheets.dart';
import 'package:fulfillment_app/features/pick/pick_widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

Map<String, dynamic> _line(
  String id, {
  String kind = 'ORDERED',
  String? name,
  String? barcode,
  int ordered = 1,
  int picked = 0,
  String? reason,
  String charge = 'PAID',
  String state = 'PENDING',
  Map<String, dynamic> extra = const {},
}) => {
  'id': id,
  'kind': kind,
  'name': name ?? 'منتج $id',
  'barcode': barcode,
  'orderedQty': ordered,
  'pickedQty': picked,
  'unitPrice': 10000,
  'charge': charge,
  'reason': reason,
  'state': state,
  'color': 'grey',
  'label': '',
  ...extra,
};

PickView _view(List<Map<String, dynamic>> lines, {String stage = 'PICKING'}) => PickView.fromJson({
  'order': {'id': 'o1', 'orderNumber': 'ORD-MWCP3XBEA982', 'stage': stage, 'status': 'PROCESSING', 'total': 48000},
  'lines': lines,
  'counts': {},
  'money': {'finalTotal': 48000, 'codAmount': 48000},
  'canFinish': stage == 'PICKING',
});

final _longName = 'أحمر شفاه سائل مات طويل الأمد ${'بلمسة مخملية فاخرة ' * 6}';

void main() {
  group('new PickView fields', () {
    test('image, posOnly and collected are parsed', () {
      final v = _view([
        _line('a', ordered: 2, picked: 2, extra: {'image': 'https://x/large.jpg', 'thumb': 'https://x/t.jpg', 'collected': true}),
        _line('b', ordered: 2, picked: 1, extra: {'collected': false}),
        _line('x', kind: 'EXTRA', ordered: 0, picked: 1, extra: {'posOnly': true, 'collected': true}),
        // سيرفر أقدم بلا الحقول الجديدة: نحسبها.
        _line('c', ordered: 1, picked: 1),
      ]);
      final a = v.lines[0], b = v.lines[1], x = v.lines[2], c = v.lines[3];
      expect(a.image, 'https://x/large.jpg');
      expect(a.bigImage, 'https://x/large.jpg');
      expect(a.collected, isTrue);
      expect(b.collected, isFalse);
      expect(b.bigImage, isNull);
      expect(x.posOnly, isTrue);
      expect(x.collected, isTrue);
      expect(a.posOnly, isFalse);
      expect(c.collected, isTrue);
    });

    test('product info: found with inOrder, and not found', () {
      final p = PickProductInfo.fromJson({
        'found': true,
        'barcode': '6281000000011',
        'name': 'سيروم',
        'shadeName': null,
        'price': 15000,
        'posOnly': true,
        'stock': 4,
        'thumb': 't',
        'image': 'i',
        'inOrder': {'lineId': 'a', 'kind': 'ORDERED', 'orderedQty': 3, 'pickedQty': 1, 'missingQty': 2},
      });
      expect(p.found, isTrue);
      expect(p.posOnly, isTrue);
      expect(p.stock, 4);
      expect(p.bigImage, 'i');
      expect(p.inOrder!.lineId, 'a');
      expect(p.inOrder!.isExtra, isFalse);
      expect(p.fillsMissing, 2);

      final none = PickProductInfo.fromJson({'found': false, 'barcode': '123'});
      expect(none.found, isFalse);
      expect(none.barcode, '123');
      expect(none.inOrder, isNull);
      expect(none.stock, isNull);
      expect(PickProductInfo.fromJson({'found': true, 'barcode': '1', 'name': 'x', 'stock': null, 'inOrder': null}).fillsMissing, 0);
    });
  });

  group('states and colours', () {
    test('state of each item', () {
      final items = _view([
        _line('p', ordered: 2),
        _line('h', ordered: 2, picked: 1),
        _line('c', ordered: 2, picked: 2),
        _line('s', ordered: 2, picked: 1, reason: 'تالف', state: 'SHORT'),
        _line('r', ordered: 1, reason: 'نفد من المحل', state: 'SHORT'),
        _line('x', kind: 'EXTRA', ordered: 0, picked: 1, barcode: '999'),
      ]).items;
      expect(items.map((i) => i.state), [
        PickItemState.pending,
        PickItemState.partial,
        PickItemState.collected,
        PickItemState.short,
        PickItemState.removed,
        PickItemState.extra,
      ]);
    });

    test('colour per state: pending light, collected green, over blue, extra yellow, removed red', () {
      final pending = itemLook(PickItemState.pending);
      expect(pending.bg.computeLuminance(), greaterThan(.9));
      expect(pending.fg, AppColors.muted);
      expect(itemLook(PickItemState.collected).fg, const Color(0xFF1F9D63));
      expect(itemLook(PickItemState.over).fg, const Color(0xFF2563EB));
      expect(itemLook(PickItemState.extra).fg, const Color(0xFFDB8B12));
      expect(itemLook(PickItemState.removed).fg, const Color(0xFFD64545));
      expect(itemLook(PickItemState.short).fg, const Color(0xFFD64545));
    });

    test('after finish a short line without reason counts as removed', () {
      final v = _view([_line('a', ordered: 1, state: 'SHORT')], stage: 'PICKED');
      expect(v.items.single.state, PickItemState.removed);
    });
  });

  group('over-quantity merge', () {
    test('ordered line + same-barcode paid extra become one blue «زيادة» item', () {
      final v = _view([
        _line('a', ordered: 3, picked: 3, barcode: '6281000000011'),
        _line('x', kind: 'EXTRA', ordered: 0, picked: 1, barcode: '06281000000011'),
        _line('y', kind: 'EXTRA', ordered: 0, picked: 2, barcode: '777'),
      ]);
      final items = v.items;
      expect(items.length, 2, reason: 'the merged extra is not a separate card');
      final a = items.first;
      expect(a.id, 'a');
      expect(a.overLine!.id, 'x');
      expect(a.overQty, 1);
      expect(a.total, 4);
      expect(a.state, PickItemState.over);
      expect(itemBadge(a), 'زيادة +1');
      expect(a.qtyText, '3 مطلوب · 4 مجموع (زيادة +1)');
      expect(items.last.id, 'y');
      expect(items.last.state, PickItemState.extra);
    });

    test('a free gift with the same barcode stays a separate yellow extra', () {
      final items = _view([
        _line('a', ordered: 1, picked: 1, barcode: '111'),
        _line('g', kind: 'EXTRA', ordered: 0, picked: 1, barcode: '111', charge: 'FREE'),
      ]).items;
      expect(items.length, 2);
      expect(items.first.state, PickItemState.collected);
      expect(items.last.state, PickItemState.extra);
    });

    test('withTotal fills the order first, then the over part; minus removes over first', () {
      final a = _view([_line('a', ordered: 3, picked: 3, barcode: '111'), _line('x', kind: 'EXTRA', ordered: 0, picked: 2, barcode: '111')]).items.first;
      expect(a.total, 5);
      final down = a.withTotal(4);
      expect((down.picked, down.overQty), (3, 1));
      final less = a.withTotal(2);
      expect((less.picked, less.overQty), (2, 0));
      expect(less.state, PickItemState.partial);
      final up = _view([_line('b', ordered: 2, picked: 1, barcode: '2')]).items.first.withTotal(4);
      expect((up.picked, up.overQty), (2, 2));
      expect(up.state, PickItemState.over);
      expect(canPlus(up), isTrue);
      // بلا باركود لا زيادة.
      expect(canPlus(_view([_line('n', ordered: 1, picked: 1)]).items.first), isFalse);
    });
  });

  group('sort, finish and reasons', () {
    test('pending first, then partial, collected, removed, extras', () {
      final items = _view([
        _line('x', kind: 'EXTRA', ordered: 0, picked: 1, barcode: '9'),
        _line('r', ordered: 1, reason: 'تالف', state: 'SHORT'),
        _line('c', ordered: 1, picked: 1),
        _line('h', ordered: 3, picked: 1),
        _line('p1', ordered: 1),
        _line('p2', ordered: 2),
      ]).items;
      expect(sortPickItems(items).map((i) => i.id), ['p1', 'p2', 'h', 'c', 'r', 'x']);
    });

    test('finish needs every product collected or removed with a reason', () {
      final pending = _view([_line('a', ordered: 1, picked: 1), _line('b', ordered: 1)]).items;
      expect(canFinishPick(pending), isFalse);
      expect(pendingItems(pending).single.id, 'b');

      final removed = _view([_line('a', ordered: 1, picked: 1), _line('b', ordered: 1, reason: 'نفد من المحل', state: 'SHORT')]).items;
      expect(canFinishPick(removed), isTrue);

      final partialNoReason = _view([_line('a', ordered: 3, picked: 2)]).items;
      expect(canFinishPick(partialNoReason), isFalse);
      expect(canFinishPick([partialNoReason.single.withReason('تالف')]), isTrue);

      // إزالة تفاؤلية (قبل رد السيرفر) تكفي أيضاً.
      final optimistic = _view([_line('b', ordered: 2)]).items.single.withTotal(0).withReason('الزبونة ألغته');
      expect(optimistic.state, PickItemState.removed);
      expect(canFinishPick([optimistic]), isTrue);
      expect(canFinishPick(const []), isFalse);
    });

    test('a reason is required below the ordered quantity only', () {
      final a = _view([_line('a', ordered: 3, picked: 3)]).items.single;
      expect(needsReason(a, 3), isFalse);
      expect(needsReason(a, 2), isTrue);
      expect(needsReason(a, 0), isTrue);
      final x = _view([_line('x', kind: 'EXTRA', ordered: 0, picked: 1)]).items.single;
      expect(needsReason(x, 0), isFalse);
      final items = _view([_line('a', ordered: 2, picked: 1), _line('b', ordered: 1, reason: 'تالف', state: 'SHORT'), _line('c', ordered: 1, picked: 1)]).items;
      expect(shortWithoutReason(items).map((i) => i.id), ['a']);
      // اكتمال المنتج يمسح سبب النقص القديم.
      expect(items[1].withTotal(1).hasReason, isFalse);
    });

    test('header tally and units', () {
      final items = _view([
        _line('a', ordered: 2, picked: 2, barcode: '1'),
        _line('ax', kind: 'EXTRA', ordered: 0, picked: 1, barcode: '1'),
        _line('b', ordered: 3, picked: 1),
        _line('r', ordered: 1, reason: 'تالف', state: 'SHORT'),
        _line('x', kind: 'EXTRA', ordered: 0, picked: 1, barcode: '9'),
      ]).items;
      final t = pickTally(items);
      expect((t.collected, t.remaining, t.removed, t.extra), (1, 1, 1, 1));
      final u = pickUnits(items);
      expect((u.done, u.all), (3, 6));
    });
  });

  group('layout on a 360dp phone', () {
    Future<void> pump(WidgetTester tester, Widget child, {double height = 1600}) async {
      tester.view.physicalSize = Size(360, height);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        MaterialApp(
          home: Directionality(textDirection: TextDirection.rtl, child: Scaffold(body: child)),
        ),
      );
    }

    final v = _view([
      _line('p', name: _longName, ordered: 3, barcode: '6281000000011', extra: {'shadeName': 'Rose ${'Velvet ' * 8}'}),
      _line('c', name: _longName, ordered: 1, picked: 1, barcode: '6281000000028'),
      _line('o', name: _longName, ordered: 2, picked: 2, barcode: '6281000000035'),
      _line('ox', kind: 'EXTRA', ordered: 0, picked: 3, barcode: '6281000000035'),
      _line('r', name: _longName, ordered: 1, reason: 'سبب ${'طويل جداً ' * 10}', state: 'SHORT'),
      _line('x', kind: 'EXTRA', name: _longName, ordered: 0, picked: 2, barcode: '999', extra: {'posOnly': true}),
    ]);

    testWidgets('collect list with long Arabic names does not overflow', (tester) async {
      final items = sortPickItems(v.items);
      await pump(
        tester,
        Column(
          children: [
            PickProgressHeader(items: items, pickerName: 'نور ${'الطويلة ' * 8}'),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  for (final i in items) ...[PickItemCard(item: i, editable: true, saving: i.id == 'c', onOpen: () {}, onCollectAll: () {}, onStep: (_) {}), const SizedBox(height: 8)],
                ],
              ),
            ),
          ],
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('جُمع 3 من 7 قطع'), findsOneWidget);
      expect(find.text('زيادة +3'), findsOneWidget);
      expect(find.text('أُزيل'), findsOneWidget);
      expect(find.text('من المحل'), findsOneWidget);
      expect(find.textContaining('2 مطلوب · 5 مجموع'), findsOneWidget);
      // البطاقة الإضافية المدموجة لا تظهر وحدها.
      expect(find.byType(PickItemCard), findsNWidgets(5));
      // أزرار اللمس لا تقل عن 48.
      final minus = tester.getSize(find.ancestor(of: find.byIcon(Icons.remove_rounded).first, matching: find.byType(IconButton)));
      expect(minus.width, greaterThanOrEqualTo(48));
    });

    testWidgets('detail sheet fits with a long name, and the QR card too', (tester) async {
      final data = ValueNotifier(PickSheetData(items: v.items, editable: true));
      addTearDown(data.dispose);
      final calls = <int>[];
      await pump(
        tester,
        PickItemSheet(
          data: data,
          itemId: 'p',
          order: v.items.map((i) => i.id).toList(),
          actions: PickItemActions(
            setTotal: (_, t) => calls.add(t),
            remove: (_) async {},
            shortReason: (_) async {},
            restore: (_) async {},
            setCharge: (_, _) async {},
          ),
        ),
        height: 2000,
      );
      expect(tester.takeException(), isNull);
      expect(find.text('6281000000011'), findsOneWidget);
      expect(find.text('تم جمعه بالكامل'), findsOneWidget);
      expect(find.text('إزالة المنتج'), findsOneWidget);
      expect(find.text('المطلوب 3'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.add_rounded));
      expect(calls, [1]);
      // المنتج التالي: الزيادة الزرقاء.
      await tester.tap(find.byTooltip('التالي'));
      await tester.pump();
      await tester.tap(find.byTooltip('التالي'));
      await tester.pump();
      expect(tester.takeException(), isNull);

      await pump(tester, ListView(padding: const EdgeInsets.all(16), children: const [OrderQrCard(orderNumber: 'ORD-MWCP3XBEA982')]));
      expect(tester.takeException(), isNull);
      expect(find.text('ORD-MWCP3XBEA982'), findsOneWidget);
      expect(find.text('اعرض هذا الرمز على قارئ كاشير الطلبات'), findsOneWidget);
    });
  });

  group('collect screen', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({'vibrate': false, 'sound': false});
      FlutterSecureStorage.setMockInitialValues({});
      await Prefs.init();
    });

    testWidgets('finish stays disabled until every product is collected; one tap collects all', (tester) async {
      tester.view.physicalSize = const Size(360, 1600);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final api = _FakeApi([_line('a', name: _longName, ordered: 1, picked: 1, barcode: '1'), _line('b', name: 'سيروم', ordered: 2, barcode: '2')]);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [repoProvider.overrideWithValue(Repo(api))],
          child: const MaterialApp(
            home: Directionality(textDirection: TextDirection.rtl, child: PickScreen(orderId: 'o1')),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      FilledButton finish() => tester.widget<FilledButton>(find.ancestor(of: find.text('تم جمع الطلب'), matching: find.byWidgetPredicate((w) => w is FilledButton)));
      expect(finish().onPressed, isNull);
      expect(find.textContaining('بقي منتج واحد'), findsOneWidget);

      // الدائرة الفارغة = جمع الكل (تُرسل بعد 400ms).
      final semantics = tester.ensureSemantics();
      await tester.tap(find.bySemanticsLabel('جمع الكل'));
      semantics.dispose();
      await tester.pump();
      expect(finish().onPressed, isNotNull, reason: 'optimistic');
      await tester.pump(const Duration(milliseconds: 450));
      await tester.pumpAndSettle();
      expect(api.patches.length, 1);
      expect(api.patches.single.$1, 'b');
      expect(api.patches.single.$2, {'pickedQty': 2});
      expect(finish().onPressed, isNotNull);
      expect(find.text('جُمع 3 من 3 قطع'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });
}

/// سيرفر وهمي لشاشة الجمع (على مستوى HTTP: يعمل مع أي شكل لـ Repo).
class _FakeApi extends Api {
  _FakeApi(this.lines);
  List<Map<String, dynamic>> lines;
  final patches = <(String, Map<String, dynamic>)>[];

  Map<String, dynamic> get _json => {
    'order': {'id': 'o1', 'orderNumber': 'ORD-MWCP3XBEA982', 'stage': 'PICKING', 'status': 'PROCESSING', 'total': 48000},
    'lines': lines,
    'counts': {},
    'money': {'finalTotal': 48000, 'codAmount': 48000},
    'canFinish': true,
  };

  @override
  Future<T> get<T>(String path, {Map<String, dynamic>? query, T Function(dynamic)? map}) async {
    if (path.endsWith('/pick')) return map!(_json);
    throw ApiError('غير موجود', status: 404);
  }

  @override
  Future<T> patch<T>(String path, {Object? data, T Function(dynamic)? map}) async {
    final lineId = path.split('/').last;
    final patch = Map<String, dynamic>.from(data as Map);
    patches.add((lineId, patch));
    lines = [
      for (final l in lines) l['id'] == lineId && patch['pickedQty'] != null ? {...l, 'pickedQty': patch['pickedQty']} : l,
    ];
    return map!(_json);
  }
}
