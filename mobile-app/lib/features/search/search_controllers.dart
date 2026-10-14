import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../data/models/paginated.dart';
import '../../data/models/product.dart';
import '../../data/models/search_suggestions.dart';

typedef SuggestFetcher = Future<SearchSuggestions> Function(String q, CancelToken token);
typedef PageFetcher = Future<Paginated<Product>> Function(String q, int page);

/// اقتراحات حية: تأخير خفيف + إلغاء الطلب القديم + تجاهل الردود المتأخرة + كاش صغير.
class SuggestController extends ChangeNotifier {
  final SuggestFetcher fetch;
  final Duration debounce;
  final int cacheSize;

  SuggestController({required this.fetch, this.debounce = const Duration(milliseconds: 250), this.cacheSize = 40});

  final _cache = <String, SearchSuggestions>{}; // مرتّبة بالإدراج (LRU)
  Timer? _timer;
  CancelToken? _token;
  int _seq = 0;
  bool _disposed = false;

  String _query = '';
  String _scope = '';
  SearchSuggestions? _data;
  String _dataQuery = '';
  bool _loading = false;
  bool _failed = false;

  /// الاستعلام الذي تخصّه [data] الحالية.
  String get query => _query;
  SearchSuggestions? get data => _data;

  /// الاستعلام الذي جاءت منه [data] (قد يسبق [query] أثناء التحميل).
  String get dataQuery => _dataQuery;
  bool get loading => _loading;
  bool get failed => _failed;

  /// [scope] يميّز الكاش (اللغة مثلاً) — نتائج العربية ≠ الإنجليزية.
  void update(String raw, {String scope = ''}) {
    final q = raw.trim();
    _timer?.cancel();
    if (q == _query && scope == _scope && (_loading || _dataQuery == q)) return;
    _query = q;
    _scope = scope;
    _failed = false;

    if (q.length < 2) {
      _cancelInFlight();
      _data = null;
      _dataQuery = '';
      _loading = false;
      _notify();
      return;
    }

    final cached = _cache['$scope|${q.toLowerCase()}'];
    if (cached != null) {
      _cancelInFlight();
      _data = cached;
      _dataQuery = q;
      _loading = false;
      _notify();
      return;
    }

    _loading = true;
    _notify();
    _timer = Timer(debounce, () => _run(q, scope));
  }

  Future<SearchSuggestions?> _run(String q, String scope) async {
    _cancelInFlight();
    final seq = ++_seq;
    final token = CancelToken();
    _token = token;
    try {
      final result = await fetch(q, token);
      _remember('$scope|${q.toLowerCase()}', result);
      if (_disposed || seq != _seq) return result; // رد متأخر — لا يغيّر الواجهة.
      _data = result;
      _dataQuery = q;
      _loading = false;
      _notify();
      return result;
    } catch (_) {
      if (_disposed || seq != _seq) return null;
      _loading = false;
      _failed = true;
      _notify();
      return null;
    }
  }

  /// يُرجع الاقتراحات من الكاش أو يجلبها فوراً (للحالة الفارغة: «هل تقصدين…؟»).
  Future<SearchSuggestions?> ensure(String raw, {String scope = ''}) async {
    final q = raw.trim();
    if (q.length < 2) return null;
    final cached = _cache['$scope|${q.toLowerCase()}'];
    if (cached != null) return cached;
    try {
      final result = await fetch(q, CancelToken());
      _remember('$scope|${q.toLowerCase()}', result);
      return result;
    } catch (_) {
      return null;
    }
  }

  void _remember(String key, SearchSuggestions value) {
    _cache.remove(key);
    _cache[key] = value;
    while (_cache.length > cacheSize) {
      _cache.remove(_cache.keys.first);
    }
  }

  void _cancelInFlight() {
    _seq++;
    final t = _token;
    if (t != null && !t.isCancelled) t.cancel('superseded');
    _token = null;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    final t = _token;
    if (t != null && !t.isCancelled) t.cancel('disposed');
    super.dispose();
  }
}

/// نتائج البحث المرقّمة — صفحة أولى ثم «المزيد» بلا تكرار.
class SearchResultsController extends ChangeNotifier {
  final PageFetcher fetch;

  SearchResultsController({required this.fetch});

  String _query = '';
  final List<Product> _items = [];
  final Set<String> _ids = {};
  int _total = 0;
  int _page = 0;
  bool _hasNext = false;
  bool _loading = false;
  bool _loadingMore = false;
  Object? _error;
  Object? _moreError;
  int _seq = 0;
  bool _disposed = false;

  String get query => _query;
  List<Product> get items => List.unmodifiable(_items);
  int get total => _total;
  bool get hasNext => _hasNext;
  bool get loading => _loading;
  bool get loadingMore => _loadingMore;
  Object? get error => _error;
  Object? get moreError => _moreError;
  bool get hasSearched => _query.isNotEmpty;

  /// يبدأ بحثاً جديداً (يتجاهل أي صفحة سابقة متأخرة).
  Future<void> search(String raw) async {
    final q = raw.trim();
    final seq = ++_seq;
    _query = q;
    _items.clear();
    _ids.clear();
    _total = 0;
    _page = 0;
    _hasNext = false;
    _error = null;
    _moreError = null;
    _loadingMore = false;
    _loading = q.length >= 2;
    _notify();
    if (q.length < 2) return;
    try {
      final page = await fetch(q, 1);
      if (_disposed || seq != _seq) return;
      _append(page);
    } catch (e) {
      if (_disposed || seq != _seq) return;
      _error = e;
    }
    _loading = false;
    _notify();
  }

  Future<void> loadMore() async {
    if (_loading || _loadingMore || !_hasNext || _query.isEmpty) return;
    final seq = _seq;
    _loadingMore = true;
    _moreError = null;
    _notify();
    try {
      final page = await fetch(_query, _page + 1);
      if (_disposed || seq != _seq) return;
      _append(page);
    } catch (e) {
      if (_disposed || seq != _seq) return;
      _moreError = e;
    }
    _loadingMore = false;
    _notify();
  }

  void reset() {
    _seq++;
    _query = '';
    _items.clear();
    _ids.clear();
    _total = 0;
    _page = 0;
    _hasNext = false;
    _loading = false;
    _loadingMore = false;
    _error = null;
    _moreError = null;
    _notify();
  }

  void _append(Paginated<Product> page) {
    var added = 0;
    for (final p in page.items) {
      if (_ids.add(p.id)) {
        _items.add(p);
        added++;
      }
    }
    _page = page.page > _page ? page.page : _page + 1;
    _total = page.total > _items.length ? page.total : _items.length;
    // حماية من حلقة لا نهائية إن أعاد الخادم نفس الصفحة.
    _hasNext = page.hasNext && added > 0;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
