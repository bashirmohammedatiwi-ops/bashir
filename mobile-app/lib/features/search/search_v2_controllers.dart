import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../core/perf/device_perf.dart';
import '../../data/models/product.dart';
import '../../data/models/search_instant.dart';
import '../../data/services/api_service.dart';
import 'smart_query.dart';

/// طلب أُلغي عمداً (حرف جديد، إعادة ضبط) — ليس فشلاً يُعرض للزبونة.
bool _isCancel(Object e) =>
    (e is DioException && CancelToken.isCancel(e)) || (e is ApiException && e.transportType == DioExceptionType.cancel);

/// اقتراحات فورية: تأخير قصير بحسب الجهاز، كاش صغير، والإبقاء على آخر نتيجة ظاهرة
/// أثناء التحميل ما دامت الكلمة الجديدة تكمل السابقة.
///
/// طلب واحد على الأكثر في الطريق: حرف جديد لا يلغي الطلب الجاري (الإلغاء يقطع الاتصال
/// فيدفع الطلب التالي مصافحة جديدة على شبكة بطيئة) — ينتظر ردّه ثم تُرسل آخر كلمة فقط.
/// الردّ القديم يُهمل بالرقم التسلسلي، إلا إن كانت الكلمة الحالية تكمله فيُعرض مؤقتاً.
/// طلب علق أكثر من [stallAfter] يُلغى ولا تنتظره الكلمة الجديدة.
class InstantSearchController extends ChangeNotifier {
  final ApiService api;

  /// لغة الواجهة — أسماء المنتجات والأقسام والإكمالات تأتي بها (جزء من مفتاح الكاش).
  final String Function() lang;

  InstantSearchController(
    this.api, {
    required this.lang,
    Duration? debounce,
    Duration stallAfter = const Duration(milliseconds: 2500),
  })  : _debounce = debounce ?? Duration(milliseconds: DevicePerf.pick(low: 260, mid: 200)),
        _stallAfter = stallAfter;

  final Duration _debounce;
  final Duration _stallAfter;
  final _cache = <String, SearchInstant>{};
  Timer? _timer;

  /// الطلب الجاري (واحد على الأكثر) ومتى بدأ.
  CancelToken? _token;
  DateTime? _sentAt;

  /// كلمة تنتظر انتهاء الطلب الجاري — تُرسل حين يعود.
  String? _pending;
  int _seq = 0;
  bool _disposed = false;

  String _query = '';
  SearchInstant? _data;
  bool _loading = false;
  bool _failed = false;

  String get query => _query;
  SearchInstant? get data => _data;
  bool get loading => _loading;

  /// آخر طلب فشل (انقطاع/خطأ سيرفر) — اللوحة تعرض «إعادة» بدل فراغ.
  bool get failed => _failed;

  void update(String raw) {
    // المسافة الأخيرة لها معنى (الكلمة اكتملت) — لا نقصّها.
    final q = raw.trimLeft();
    if (q == _query) return;
    _query = q;
    _timer?.cancel();
    _failed = false;
    if (q.trim().length < 2) {
      _supersede();
      _data = null;
      _loading = false;
      _notify();
      return;
    }
    final hit = _cache[_key(q)];
    if (hit != null) {
      _supersede();
      _data = hit;
      _loading = false;
      _notify();
      return;
    }
    // كلمة لا تكمل السابقة: نتائجها القديمة لا تخصّها — هيكل تحميل بدل نتائج قابلة للضغط.
    final prev = _data;
    if (prev != null && !_extends(q, prev.query)) _data = null;
    _loading = true;
    _notify();
    _timer = Timer(_debounce, () => _run(q));
  }

  /// إعادة الطلب الأخير بعد فشل.
  void retry() {
    if (_query.trim().length < 2) return;
    _timer?.cancel();
    _run(_query);
  }

  void _run(String q) {
    _failed = false;
    if (!_loading) {
      _loading = true;
      _notify();
    }
    final token = _token;
    if (token != null) {
      final sentAt = _sentAt;
      if (sentAt != null && DateTime.now().difference(sentAt) < _stallAfter) {
        _pending = q; // يُرسل حين يعود الجاري.
        return;
      }
      // علق الطلب (شبكة متوقفة): لا تنتظره الكلمة الجديدة.
      if (!token.isCancelled) token.cancel('stalled');
      _token = null;
      _sentAt = null;
    }
    unawaited(_send(q));
  }

  Future<void> _send(String q) async {
    _pending = null;
    final seq = ++_seq;
    final token = CancelToken();
    _token = token;
    _sentAt = DateTime.now();
    final l = lang();
    SearchInstant? reply;
    Object? error;
    try {
      reply = await api.searchInstant(q, cancelToken: token, lang: l);
      _cache['$l|$q'] = reply;
      if (_cache.length > 80) _cache.remove(_cache.keys.first);
    } catch (e) {
      error = e;
    }
    if (identical(_token, token)) {
      _token = null;
      _sentAt = null;
    }
    if (_disposed) return;

    // آخر كلمة انتظرت هذا الردّ: تُرسل الآن (أو تُعرض من الكاش إن كانت هي نفسها).
    final next = _pending;
    _pending = null;
    final current = seq == _seq;
    if (next != null && _token == null) {
      final hit = _cache[_key(next)];
      if (hit == null) {
        // ردّ لكلمة تكملها الكلمة الحالية يُعرض مؤقتاً، والتحميل مستمر.
        if (current && reply != null && _extends(_query, q)) {
          _data = reply;
          _notify();
        }
        unawaited(_send(next));
        return;
      }
      if (next == _query) {
        _data = hit;
        _loading = _timer?.isActive ?? false;
        _failed = false;
        _notify();
        return;
      }
    }
    if (!current) return; // ردّ قديم (أُعيد الضبط أو ظهرت النتيجة من الكاش): يُهمل.
    if (reply != null) {
      // ردّ لحرف سابق وصل أثناء مهلة الحرف الجديد: نعرضه إن كانت الكلمة تكمله، والتحميل مستمر.
      if (q == _query || _extends(_query, q)) _data = reply;
      _loading = _query != q || (_timer?.isActive ?? false);
      _notify();
      return;
    }
    if (_isCancel(error!)) return;
    _failed = true;
    _loading = false;
    _notify();
  }

  /// هل [q] تكمل [shown]؟ (فتبقى نتائج [shown] ظاهرة أثناء تحميلها)
  static bool _extends(String q, String shown) => normalizeQuery(q).startsWith(normalizeQuery(shown));

  String _key(String q) => '${lang()}|$q';

  /// ما في الطريق لم يعد يخصّ الكلمة الظاهرة: ردّه يُهمل (لكنه يصل ويُحفظ في الكاش).
  void _supersede() {
    _seq++;
    _pending = null;
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
    _token = null;
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
  Object? _moreError;
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

  /// فشل تحميل الصفحة التالية — يبقى حتى تضغط «إعادة» (لا إعادة مع كل تمرير).
  Object? get moreError => _moreError;
  bool get active => _query.isNotEmpty;

  /// عدّادات الفلاتر وما فهمه البحث.
  SearchPage? get meta => _meta;

  /// [exact]: بالكلمة كما كُتبت بلا تصحيح إملائي.
  Future<void> search(String raw, {SearchFilters? filters, bool exact = false}) async {
    final q = raw.trim();
    _query = q;
    final f = filters ?? const SearchFilters();
    _filters = exact ? f.copyWith(exact: true) : f;
    await _reload();
  }

  Future<void> setFilters(SearchFilters f) async {
    if (_query.isEmpty) return;
    _filters = f;
    await _reload(keepMeta: true);
  }

  /// يمسح الفلاتر ويُبقي وضع «بالكلمة كما كُتبت» إن كان مختاراً.
  Future<void> clearFilters() => setFilters(SearchFilters(exact: _filters.exact));

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
    _moreError = null;
    _loadingMore = false;
    if (!keepMeta) _meta = null;
    _loading = true;
    _notify();
    try {
      final r = await api.searchPage(_query, _filters, page: 1, cancelToken: token, lang: lang());
      if (_disposed || seq != _seq) return;
      final prev = _meta;
      _meta = keepMeta && prev != null ? _mergeMeta(prev, r) : r;
      _append(r);
    } catch (e) {
      if (_disposed || seq != _seq || _isCancel(e)) return;
      _error = e;
    }
    _loading = false;
    _notify();
  }

  /// عدّادات السيرفر محسوبة بلا فلاتر البراند/النوع/القسم، فنأخذها طازجة دائماً.
  /// الاستثناء: مدى السعر يضيق مع فلتر السعر — نُبقي المدى الكامل ليبقى الاختيار ممكناً.
  /// والمختار الذي اختفى من العدّادات الجديدة يبقى (بعدد 0) ليمكن إلغاؤه.
  SearchPage _mergeMeta(SearchPage prev, SearchPage r) {
    final f = _filters;
    final priced = f.minPrice != null || f.maxPrice != null;
    return SearchPage(
      page: r.page,
      brands: _keepSelected(r.brands, prev.brands, f.brandIds),
      kinds: _keepSelected(r.kinds, prev.kinds, {if (f.kind != null) f.kind!}),
      categories: _keepSelected(r.categories, prev.categories, {if (f.categoryId != null) f.categoryId!}),
      priceMin: priced ? prev.priceMin : r.priceMin,
      priceMax: priced ? prev.priceMax : r.priceMax,
      priceBuckets: r.priceBuckets.isNotEmpty ? r.priceBuckets : prev.priceBuckets,
      budget: r.budget,
      corrected: r.corrected,
      understood: r.understood,
    );
  }

  static List<SearchFacet> _keepSelected(List<SearchFacet> fresh, List<SearchFacet> old, Set<String> selected) {
    if (selected.isEmpty) return fresh;
    final ids = {for (final x in fresh) x.id};
    final missing = [
      for (final id in selected)
        if (!ids.contains(id))
          for (final o in old.where((o) => o.id == id).take(1)) SearchFacet(id: o.id, name: o.name, slug: o.slug),
    ];
    return missing.isEmpty ? fresh : [...fresh, ...missing];
  }

  /// [retry]: بعد فشل سابق — من زر «إعادة» فقط، لا من التمرير.
  Future<void> loadMore({bool retry = false}) async {
    if (_loading || _loadingMore || !_hasNext || _query.isEmpty) return;
    if (_moreError != null && !retry) return;
    final seq = _seq;
    _moreError = null;
    _loadingMore = true;
    _notify();
    try {
      final r = await api.searchPage(_query, _filters, page: _page + 1, lang: lang());
      if (_disposed || seq != _seq) return;
      _append(r);
    } catch (e) {
      if (_disposed || seq != _seq) return;
      _moreError = e;
    }
    _loadingMore = false;
    _notify();
  }

  void reset() {
    _seq++;
    _token?.cancel('reset');
    _token = null;
    _query = '';
    _filters = const SearchFilters();
    _items.clear();
    _ids.clear();
    _total = 0;
    _page = 0;
    _hasNext = false;
    _meta = null;
    _loading = false;
    _loadingMore = false;
    _error = null;
    _moreError = null;
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
