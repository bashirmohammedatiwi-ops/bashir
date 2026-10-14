import 'dart:async';

import 'package:alhayaa/data/models/brand.dart';
import 'package:alhayaa/data/models/category.dart';
import 'package:alhayaa/data/models/paginated.dart';
import 'package:alhayaa/data/models/product.dart';
import 'package:alhayaa/data/models/search_suggestions.dart';
import 'package:alhayaa/features/search/search_controllers.dart';
import 'package:alhayaa/features/search/search_suggest_merge.dart';
import 'package:flutter_test/flutter_test.dart';

Category _c(String id, String ar, String en, {String? parentId, List<Category> children = const []}) =>
    Category(id: id, name: ar, nameAr: ar, nameEn: en, slug: en.toLowerCase(), parentId: parentId, children: children);

Product _p(String id) => Product(id: id, sku: id, name: 'P$id', slug: 'p-$id');

void main() {
  group('SearchSuggestions.fromJson', () {
    final body = {
      'products': [
        {
          'id': 'p1',
          'slug': 'red-lipstick',
          'name': 'أحمر شفاه',
          'brandName': 'MAC',
          'price': 7500,
          'discountPercent': 25,
          'imageUrl': '/media/a.webp',
        },
        {
          'id': 'p2',
          'slug': '',
          'name': 'Mascara',
          'brandName': null,
          'price': 1000,
          'discountPercent': 0,
          'imageUrl': null,
        },
        {'id': '', 'name': 'broken'},
      ],
      'brands': [
        {'id': 'b1', 'slug': 'mac', 'name': 'MAC'},
      ],
      'categories': [
        {'id': 'c1', 'slug': 'makeup', 'name': 'المكياج'},
      ],
      'corrected': 'mascara',
    };

    test('parses raw body', () {
      final s = SearchSuggestions.fromJson(body);
      expect(s.products.length, 2);
      final p1 = s.products.first;
      expect(p1.brandName, 'MAC');
      expect(p1.price, 7500);
      expect(p1.oldPrice, 10000);
      expect(p1.route, '/product/red-lipstick');
      final p2 = s.products[1];
      expect(p2.brandName, isNull);
      expect(p2.imageUrl, isNull);
      expect(p2.oldPrice, isNull);
      expect(p2.route, '/product/p2');
      expect(s.brands.single.name, 'MAC');
      expect(s.categories.single.id, 'c1');
      expect(s.corrected, 'mascara');
    });

    test('accepts {data: …} envelope and empty/null shapes', () {
      expect(SearchSuggestions.fromJson({'data': body}).products.length, 2);
      final empty = SearchSuggestions.fromJson({'products': [], 'brands': [], 'categories': [], 'corrected': null});
      expect(empty.isEmpty, isTrue);
      expect(SearchSuggestions.fromJson(null).isEmpty, isTrue);
    });
  });

  group('merge', () {
    final roots = [
      _c(
        'makeup',
        'المكياج',
        'Makeup',
        children: [
          _c(
            'lips',
            'الشفاه',
            'Lips',
            parentId: 'makeup',
            children: [_c('lipstick', 'أحمر الشفاه', 'Lipstick', parentId: 'lips')],
          ),
        ],
      ),
    ];
    const brands = [Brand(id: 'b1', name: 'MAC', slug: 'mac'), Brand(id: 'b2', name: 'Maybelline', slug: 'maybelline')];

    test('local matching covers all levels with correct routes', () {
      final local = localSuggestEntries('lipstick', roots, brands, 'en');
      final hit = local.categories.singleWhere((e) => e.id == 'lipstick');
      expect(hit.location, contains('subcategoryId=lips&tertiaryCategoryId=lipstick'));
      expect(hit.subtitle, 'Makeup › Lips');
      // مرادف عربي يطابق نفس القسم
      expect(localSuggestEntries('روج', roots, brands, 'ar').categories.map((e) => e.id), contains('lipstick'));
    });

    test('de-duplicates by id and by normalized title, boosting confirmed items', () {
      final local = localSuggestEntries('mac', roots, brands, 'en');
      expect(local.brands.single.id, 'b1');
      const remote = SearchSuggestions(
        brands: [
          SuggestRef(id: 'b1', slug: 'mac', name: 'MAC'),
          SuggestRef(id: 'b9', slug: 'mac-2', name: 'mac'), // نفس الاسم بمعرّف آخر
          SuggestRef(id: 'b3', slug: 'macqueen', name: 'MacQueen'),
        ],
        categories: [SuggestRef(id: 'makeup', slug: 'makeup', name: 'المكياج')],
      );
      final merged = mergeSuggestions(local: local, remote: remote, roots: roots, brands: brands, lang: 'en');
      expect(merged.brands.map((e) => e.id).toList(), ['b1', 'b3']);
      expect(merged.brands.first.fromServer, isFalse);
      // قسم الخادم يأخذ الاسم المحلي حسب اللغة
      expect(merged.categories.single.title, 'Makeup');
      expect(merged.categories.single.location, startsWith('/products?categoryId=makeup'));
    });

    test('respects max and score order', () {
      final items = [
        for (var i = 0; i < 6; i++)
          SuggestEntry(kind: SuggestKind.brand, id: 'x$i', title: 'Brand $i', location: '/', score: i),
      ];
      final out = dedupeEntries(items, 3);
      expect(out.map((e) => e.id).toList(), ['x5', 'x4', 'x3']);
    });

    test('correction only when actually different', () {
      expect(shouldOfferCorrection('mascra', 'mascara'), isTrue);
      expect(shouldOfferCorrection('Mascara', 'mascara'), isFalse);
      expect(shouldOfferCorrection('أحمر', 'احمر'), isFalse);
      expect(shouldOfferCorrection('x', null), isFalse);
    });
  });

  group('SuggestController', () {
    test('ignores stale responses and caches results', () async {
      final pending = <String, Completer<SearchSuggestions>>{};
      var calls = 0;
      final c = SuggestController(
        debounce: Duration.zero,
        fetch: (q, token) {
          calls++;
          return (pending[q] = Completer<SearchSuggestions>()).future;
        },
      );
      c.update('ma');
      await Future<void>.delayed(Duration.zero);
      c.update('mac');
      await Future<void>.delayed(Duration.zero);
      expect(c.loading, isTrue);

      pending['mac']!.complete(const SearchSuggestions(corrected: 'new'));
      await Future<void>.delayed(Duration.zero);
      pending['ma']!.complete(const SearchSuggestions(corrected: 'old'));
      await Future<void>.delayed(Duration.zero);

      expect(c.dataQuery, 'mac');
      expect(c.data?.corrected, 'new');
      expect(c.loading, isFalse);

      c.update('m'); // قصير — يمسح
      expect(c.data, isNull);
      c.update('mac'); // من الكاش بلا طلب جديد
      expect(c.data?.corrected, 'new');
      expect(calls, 2);
      c.dispose();
    });
  });

  group('SearchResultsController', () {
    test('paginates without duplicates and stops on empty page', () async {
      final pages = {
        1: Paginated<Product>(items: [_p('1'), _p('2')], total: 5, page: 1, hasNext: true),
        2: Paginated<Product>(items: [_p('2'), _p('3')], total: 5, page: 2, hasNext: true),
        3: Paginated<Product>(items: [_p('3')], total: 5, page: 3, hasNext: true),
      };
      final c = SearchResultsController(fetch: (q, page) async => pages[page]!);
      await c.search('lip');
      expect(c.items.length, 2);
      expect(c.hasNext, isTrue);
      await c.loadMore();
      expect(c.items.map((p) => p.id).toList(), ['1', '2', '3']);
      await c.loadMore();
      expect(c.hasNext, isFalse); // صفحة بلا جديد توقف التحميل
      expect(c.total, 5);
      c.dispose();
    });

    test('a newer search wins over a slower older one', () async {
      final slow = Completer<Paginated<Product>>();
      final c = SearchResultsController(
        fetch: (q, page) => q == 'old' ? slow.future : Future.value(Paginated<Product>(items: [_p('n')], total: 1)),
      );
      final first = c.search('old');
      await c.search('new');
      slow.complete(Paginated<Product>(items: [_p('o')], total: 1));
      await first;
      expect(c.query, 'new');
      expect(c.items.single.id, 'n');
      c.dispose();
    });
  });

  test('correction is offered only when close to the query', () {
    expect(shouldOfferCorrection('mascra', 'mascara'), isTrue);
    expect(shouldOfferCorrection('maskara', 'PHYTO Color'), isFalse);
    expect(shouldOfferCorrection('mascara', 'Mascara'), isFalse);
  });
}
