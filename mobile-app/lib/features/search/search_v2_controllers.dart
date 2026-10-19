import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../data/models/product.dart';
import '../../data/models/search_instant.dart';
import '../../data/services/api_service.dart';

/// اقتراحات فورية: تأخير قصير جداً، إلغاء الطلب السابق، كاش صغير، والإبقاء على
/// آخر نتيجة ظاهرة أثناء التحميل (لا وميض ولا شاشة فارغة بين الحروف).
class InstantSearchController extends ChangeNotifier {
  final ApiService api;

  /// لغة الواجهة — أسماء المنتجات والأقسام والإكمالات تأتي بها (جزء من مفتاح الكاش).
  final String Function() lang;

  InstantSearchController(this.api, {required this.lang});

  static const _debounce = Duration(milliseconds: 110);
  final _cache = <String, SearchInstant>{};
  Timer? _timer;
  CancelToken? _token;
  int _seq = 0;
  bool _disposed = false;

  String _query = '';
  SearchInstant? _data;
  bool _loading = false;

  String get query => _query;
  SearchInstant? get data => _data;
  bool get loading => _loading;

  void update(String raw) {
    // المسافة الأخيرة لها معنى (الكلمة اكتملت) — لا نقصّها.
    final q = raw.trimLeft();
    if (q == _query) return;
    _query = q;
    _timer?.cancel();
    if (q.trim().length < 2) {
      _cancel();
      _loading = false;
      _notify();
      return;
    }
    final hit = _cache[_key(q)];
    if (hit != null) {
      _cancel();
      _data = hit;
      _loading = false;
      _notify();
      return;
    }
    if (!_loading) {
      _loading = true;
      _notify();
    }
    _timer = Timer(_debounce, () => _run(q));
  }

  Future<void> _run(String q) async {
    _cancel();
    final seq = ++_seq;
    final token = CancelToken();
    _token = token;
    try {
      final l = lang();
      final r = await api.searchInstant(q, cancelToken: token, lang: l);
      _cache['$l|$q'] = r;
      if (_cache.length > 80) _cache.remove(_cache.keys.first);
      if (_disposed || seq != _seq) return;
      _data = r;
      _loading = false;
      _notify();
    } catch (_) {
      if (_disposed || seq != _seq) return;
      _loading = false;
      _notify();
    }
  }

  String _key(String q) => '${lang()}|$q';

  void _cancel() {
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
    _cancel();
    super.dispose();
  }
}

/// نتائج البحث: صفحة أولى سريعة ثم «المزيد» تلقائياً، والفلاتر تعيد البحث فوراً.
class SearchResultsV2Controller extends ChangeNotifier {
  final ApiService api;

  /// لغة الواجهة للأسماء و«فهمت منكِ» في النتائج.
  final String Function() lang;

  SearchResultsV2Controller(this.api, {required this.lang});

  String _query = '';
  SearchFilters _filters = const SearchFilters();
  final List<Product> _items = [];
  final Set<String> _ids = {};
  int _total = 0;
  int _page = 0;
  bool _hasNext = false;
  bool _loading = false;
  bool _loadingMore = false;
  Object? _error;
  SearchPage? _meta;
  int _seq = 0;
  CancelToken? _token;
  bool _disposed = false;

  String get query => _query;
  SearchFilters get filters => _filters;
  List<Product> get items => _items;
  int get total => _total;
  bool get hasNext => _hasNext;
  bool get loading => _loading;
  bool get loadingMore => _loadingMore;
  Object? get error => _error;
  bool get active => _query.isNotEmpty;

  /// عدّادات الفلاتر وما فهمه البحث (من أول صفحة).
  SearchPage? get meta => _meta;

  Future<void> search(String raw, {SearchFilters? filters}) async {
    final q = raw.trim();
    _query = q;
    _filters = filters ?? const SearchFilters();
    await _reload();
  }

  Future<void> setFilters(SearchFilters f) async {
    if (_query.isEmpty) return;
    _filters = f;
    await _reload(keepMeta: true);
  }

  Future<void> _reload({bool keepMeta = false}) async {
    final seq = ++_seq;
    _token?.cancel('superseded');
    final token = _token = CancelToken();
    _items.clear();
    _ids.clear();
    _total = 0;
    _page = 0;
    _hasNext = false;
    _error = null;
    _loadingMore = false;
    if (!keepMeta) _meta = null;
    _loading = true;
    _notify();
    try {
      final r = await api.searchPage(_query, _filters, page: 1, cancelToken: token, lang: lang());
      if (_disposed || seq != _seq) return;
      // العدّادات من البحث بلا فلاتر البراند/النوع حتى تبقى الخيارات كاملة.
      _meta = keepMeta && _meta != null
          ? SearchPage(
              page: r.page,
              brands: _meta!.brands,
              kinds: _meta!.kinds,
              categories: _meta!.categories,
              priceMin: _meta!.priceMin,
              priceMax: _meta!.priceMax,
              corrected: r.corrected,
              understood: r.understood,
            )
          : r;
      _append(r);
    } catch (e) {
      if (_disposed || seq != _seq) return;
      if (e is DioException && CancelToken.isCancel(e)) return;
      _error = e;
    }
    _loading = false;
    _notify();
  }

  Future<void> loadMore() async {
    if (_loading || _loadingMore || !_hasNext || _query.isEmpty) return;
    final seq = _seq;
    _loadingMore = true;
    _notify();
    try {
      final r = await api.searchPage(_query, _filters, page: _page + 1, lang: lang());
      if (_disposed || seq != _seq) return;
      _append(r);
    } catch (_) {
      if (_disposed || seq != _seq) return;
      _hasNext = false;
    }
    _loadingMore = false;
    _notify();
  }

  void reset() {
    _seq++;
    _token?.cancel('reset');
    _query = '';
    _filters = const SearchFilters();
    _items.clear();
    _ids.clear();
    _meta = null;
    _loading = false;
    _loadingMore = false;
    _error = null;
    _notify();
  }

  void _append(SearchPage r) {
    var added = 0;
    for (final p in r.page.items) {
      if (_ids.add(p.id)) {
        _items.add(p);
        added++;
      }
    }
    _page = r.page.page;
    _total = r.page.total;
    _hasNext = r.page.hasNext && added > 0;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _token?.cancel('disposed');
    super.dispose();
  }
}
