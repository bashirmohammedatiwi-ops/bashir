import 'dart:async';

import 'package:alhayaa/data/models/paginated.dart';
import 'package:alhayaa/data/models/product.dart';
import 'package:alhayaa/data/models/search_instant.dart';
import 'package:alhayaa/data/services/api_service.dart';
import 'package:alhayaa/features/search/search_v2_controllers.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

/// طلب معلّق في الواجهة الوهمية — الاختبار يقرر متى وبماذا يُجاب.
class _Call<T> {
  final String q;
  final String? lang;
  final SearchFilters? filters;
  final int page;
  final Completer<T> completer = Completer<T>();
  _Call(this.q, this.lang, {this.filters, this.page = 1});
}

/// ApiService وهمي: يسجّل طلبات البحث ويتركها معلّقة حتى يُجيب الاختبار.
class _FakeApi implements ApiService {
  final instantCalls = <_Call<SearchInstant>>[];
  final pageCalls = <_Call<SearchPage>>[];

  /// مثل Dio: إلغاء الرمز يُنهي الطلب بخطأ إلغاء.
  bool honorCancel = true;

  @override
  Future<SearchInstant> searchInstant(String q, {CancelToken? cancelToken, String? lang, String? world}) {
    final call = _Call<SearchInstant>(q, lang);
    instantCalls.add(call);
    _wireCancel(cancelToken, call.completer);
    return call.completer.future;
  }

  @override
  Future<SearchPage> searchPage(
    String q,
    SearchFilters filters, {
    int page = 1,
    int limit = 24,
    CancelToken? cancelToken,
    String? lang,
    String? world,
  }) {
    final call = _Call<SearchPage>(q, lang, filters: filters, page: page);
    pageCalls.add(call);
    _wireCancel(cancelToken, call.completer);
    return call.completer.future;
  }

  void _wireCancel<T>(CancelToken? token, Completer<T> c) {
    if (!honorCancel || token == null) return;
    token.whenCancel.then((e) {
      if (!c.isCompleted) c.completeError(e);
    });
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => throw UnimplementedError('${invocation.memberName}');
}

SearchInstant _instant(String q, {List<String> completions = const ['x']}) => SearchInstant(
      query: q,
      completions: [for (final c in completions) SearchCompletion(c, 'term')],
      total: completions.length,
    );

Product _p(String id) => Product(id: id, sku: '', name: 'P$id', slug: 'p$id', price: 1000);

SearchPage _page(
  List<String> ids, {
  int page = 1,
  bool hasNext = false,
  int total = 0,
  List<SearchFacet> brands = const [],
  int? priceMin,
  int? priceMax,
}) =>
    SearchPage(
      page: Paginated(items: [for (final id in ids) _p(id)], page: page, hasNext: hasNext, total: total),
      brands: brands,
      priceMin: priceMin,
      priceMax: priceMax,
    );

/// يترك المؤقتات والـ microtasks تعمل.
Future<void> _tick([int ms = 1]) => Future<void>.delayed(Duration(milliseconds: ms));

void main() {
  group('InstantSearchController', () {
    late _FakeApi api;
    late String lang;
    late InstantSearchController c;

    setUp(() {
      api = _FakeApi();
      lang = 'ar';
      c = InstantSearchController(api, lang: () => lang, debounce: Duration.zero);
    });
    tearDown(() => c.dispose());

    test('a late reply for an older query is ignored', () async {
      api.honorCancel = false;
      c.update('عطر');
      await _tick();
      c.update('شامبو');
      await _tick();
      expect(api.instantCalls.map((e) => e.q), ['عطر', 'شامبو']);

      api.instantCalls[1].completer.complete(_instant('شامبو'));
      await _tick();
      api.instantCalls[0].completer.complete(_instant('عطر'));
      await _tick();

      expect(c.data?.query, 'شامبو');
      expect(c.loading, isFalse);
    });

    test('a query that does not extend the shown one drops stale results', () async {
      c.update('شامبو');
      await _tick();
      api.instantCalls.last.completer.complete(_instant('شامبو'));
      await _tick();
      expect(c.data?.query, 'شامبو');

      c.update('شامبو ل');
      expect(c.data?.query, 'شامبو', reason: 'an extension keeps the previous rows while loading');
      c.update('عطر');
      expect(c.data, isNull);
      expect(c.loading, isTrue);

      c.update('ع');
      expect(c.data, isNull);
      expect(c.loading, isFalse);
    });

    test('a superseded reply updates the rows but keeps loading', () async {
      final slow = InstantSearchController(api, lang: () => lang, debounce: const Duration(milliseconds: 40));
      addTearDown(slow.dispose);
      slow.update('عط');
      await _tick(60);
      expect(api.instantCalls.single.q, 'عط');

      // حرف جديد ثم يصل رد «عط» أثناء مهلة «عطر».
      slow.update('عطر');
      api.instantCalls.single.completer.complete(_instant('عط'));
      await _tick();
      expect(slow.data?.query, 'عط');
      expect(slow.loading, isTrue);

      await _tick(60);
      expect(api.instantCalls.last.q, 'عطر');
      api.instantCalls.last.completer.complete(_instant('عطر'));
      await _tick();
      expect(slow.data?.query, 'عطر');
      expect(slow.loading, isFalse);
    });

    test('cache hit answers at once; the language is part of the key', () async {
      c.update('سيروم');
      await _tick();
      api.instantCalls.last.completer.complete(_instant('سيروم'));
      await _tick();
      c.update('شامبو');
      await _tick();
      api.instantCalls.last.completer.complete(_instant('شامبو'));
      await _tick();
      expect(api.instantCalls, hasLength(2));

      c.update('سيروم');
      expect(c.data?.query, 'سيروم');
      expect(c.loading, isFalse);
      await _tick();
      expect(api.instantCalls, hasLength(2));

      lang = 'en';
      c.update('شامبو');
      await _tick();
      expect(api.instantCalls, hasLength(3));
      expect(api.instantCalls.last.lang, 'en');
    });

    test('a failure sets failed; retry clears it; a cancellation is not a failure', () async {
      c.update('عطر');
      await _tick();
      api.instantCalls.last.completer.completeError(const ApiException('Connection error'));
      await _tick();
      expect(c.failed, isTrue);
      expect(c.loading, isFalse);

      c.retry();
      expect(c.failed, isFalse);
      expect(c.loading, isTrue);
      await _tick();
      api.instantCalls.last.completer.complete(_instant('عطر'));
      await _tick();
      expect(c.failed, isFalse);
      expect(c.data?.query, 'عطر');

      // حرف جديد يلغي الطلب الجاري — لا يُعدّ فشلاً.
      c.update('عطر ف');
      await _tick();
      c.update('عطر فر');
      await _tick();
      expect(c.failed, isFalse);
      expect(c.loading, isTrue);
    });
  });

  group('SearchResultsV2Controller', () {
    late _FakeApi api;
    late SearchResultsV2Controller r;

    setUp(() {
      api = _FakeApi();
      r = SearchResultsV2Controller(api, lang: () => 'en');
    });
    tearDown(() => r.dispose());

    test('loadMore error keeps hasNext, waits for retry, then appends', () async {
      final first = r.search('cream');
      api.pageCalls.single.completer.complete(_page(['1', '2'], hasNext: true, total: 4));
      await first;
      expect(api.pageCalls.single.lang, 'en');
      expect(r.items, hasLength(2));

      final more = r.loadMore();
      api.pageCalls.last.completer.completeError(const ApiException('Connection error'));
      await more;
      expect(r.moreError, isNotNull);
      expect(r.hasNext, isTrue);
      expect(r.loadingMore, isFalse);

      // التمرير وحده لا يعيد المحاولة.
      await r.loadMore();
      expect(api.pageCalls, hasLength(2));

      final retry = r.loadMore(retry: true);
      expect(r.moreError, isNull);
      expect(api.pageCalls.last.page, 2);
      api.pageCalls.last.completer.complete(_page(['3', '4'], page: 2, total: 4));
      await retry;
      expect(r.items.map((p) => p.id), ['1', '2', '3', '4']);
      expect(r.hasNext, isFalse);
    });

    test('reset during flight ignores the reply and clears everything', () async {
      final first = r.search('cream');
      expect(r.loading, isTrue);
      r.reset();
      expect(r.loading, isFalse);
      expect(r.active, isFalse);
      await first;
      expect(r.items, isEmpty);
      expect(r.total, 0);
      expect(r.hasNext, isFalse);
      expect(r.error, isNull, reason: 'a cancelled request is not an error');
    });

    test('setFilters refreshes facets, keeps the selected brand and the full price range', () async {
      final first = r.search('cream');
      api.pageCalls.single.completer.complete(_page(
        ['1'],
        brands: const [SearchFacet(id: 'a', name: 'A', count: 10), SearchFacet(id: 'b', name: 'B', count: 5)],
        priceMin: 5000,
        priceMax: 90000,
      ));
      await first;

      final next = r.setFilters(r.filters.copyWith(brandIds: {'b'}, deals: true, minPrice: 10000, maxPrice: 25000));
      final call = api.pageCalls.last;
      expect(call.filters?.deals, isTrue);
      call.completer.complete(_page(
        ['2'],
        brands: const [SearchFacet(id: 'a', name: 'A', count: 3)],
        priceMin: 10000,
        priceMax: 25000,
      ));
      await next;

      final brands = r.meta!.brands;
      expect(brands.map((b) => '${b.id}:${b.count}'), ['a:3', 'b:0']);
      expect(brands.last.name, 'B');
      expect(r.meta!.priceMin, 5000);
      expect(r.meta!.priceMax, 90000);
    });

    test('exact search and clearFilters keep the exact flag', () async {
      final first = r.search('maskara', exact: true);
      expect(api.pageCalls.single.filters?.exact, isTrue);
      expect(api.pageCalls.single.filters?.toQuery()['exact'], '1');
      api.pageCalls.single.completer.complete(_page(const []));
      await first;

      final cleared = r.clearFilters();
      expect(api.pageCalls.last.filters?.exact, isTrue);
      api.pageCalls.last.completer.complete(_page(const []));
      await cleared;
      expect(r.filters.active, isFalse);
    });
  });
}
