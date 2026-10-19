import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../perf/device_perf.dart';

/// فشل نقل عابر: لا اتصال، انتهاء مهلة، انقطاع أثناء القراءة، أو خادم متعطّل مؤقتاً
/// (5xx / 408 / 429). معه فقط تُعرض آخر نسخة محفوظة.
///
/// أما بقية 4xx (مثل 404 لمنتج حُذف) فتعني أن النسخة المحفوظة لم تعد صحيحة.
bool isTransientNetworkError(Object error) {
  if (error is! DioException) return true;
  switch (error.type) {
    case DioExceptionType.connectionError:
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return true;
    case DioExceptionType.unknown:
      // انقطاع أثناء قراءة الاستجابة (SocketException/HttpException)، أو صفحة غير
      // JSON من شبكة تطلب تسجيل دخول (واي فاي فندق) — ليست دليلاً على حذف المحتوى.
      final inner = error.error;
      if (inner is IOException || inner is FormatException) return true;
    default:
      break;
  }
  final status = error.response?.statusCode ?? 0;
  return status >= 500 || status == 408 || status == 429;
}

/// المحتوى لم يعد موجوداً على الخادم (404 / 410) — تُحذف نسخته المحفوظة.
bool isGoneError(Object error) {
  if (error is! DioException) return false;
  final status = error.response?.statusCode;
  return status == 404 || status == 410;
}

/// كاش بيانات API — ذاكرة + ملفات على القرص مع إعادة تحميل في الخلفية.
///
/// كل مفتاح في ملف مستقل (لا SharedPreferences): ملف التفضيلات يُحمَّل كاملاً عند
/// كل تشغيل ويُعاد كتابته كاملاً عند كل حفظ — مع واجهات بالميغابايت كان ذلك يبطئ
/// الإقلاع ويسبب تقطعاً. فكّ وترميز JSON الكبير يتم خارج خيط الواجهة.
///
/// [getOrFetchJson] يحفظ نص الرد كما وصل (بلا إعادة ترميز)، ويفكّ الكبير ويبني نماذجه
/// معاً في isolate. الذاكرة تحمل الردود الصغيرة فقط ضمن ميزانية بالبايت بحسب الجهاز؛
/// الكبيرة (واجهات العوالم) يحملها مزوّدها نموذجاً جاهزاً، وتُقرأ من القرص عند الحاجة.
///
/// النسخة المحفوظة تُعرض بعد فشل الشبكة فقط ([isTransientNetworkError])؛ 404/410
/// يحذفها. الطلبات المتزامنة لنفس المفتاح تشترك في اتصال واحد.
class ApiCache {
  ApiCache(this._prefs) {
    unawaited(_migrateFromPrefs());
  }

  final SharedPreferences _prefs;
  static const _legacyPrefix = 'api_cache_v1_';
  static const _dirName = 'api_cache_v2';

  /// حد الذاكرة بالعدد: آخر المفاتيح استخداماً فقط (القوائم، المنتجات، الأقسام).
  static const _memoryLimit = 80;

  /// فوق هذا الحجم يُفكّ/يُرمَّز JSON في isolate منفصل.
  static const _isolateThreshold = 48 * 1024;

  /// رد أكبر من هذا لا يُبقى مفكوكاً في الذاكرة (يُقرأ من القرص عند الحاجة).
  static const _memoryEntryMaxBytes = 48 * 1024;

  /// فوق هذا الحجم يُفكّ الرد ويُبنى نموذجه معاً في isolate ([getOrFetchJson]).
  static const _parseIsolateThreshold = 60 * 1024;

  /// ميزانية الذاكرة (بحجم JSON الخام) بحسب قدرة الجهاز.
  static int get _memoryBudget => DevicePerf.pick(low: 3 << 20, mid: 8 << 20, high: 16 << 20);

  /// كم وقت حفظ نتذكّر (لـ [isFresh] و[fetchedAt]) — أرقام صغيرة لا بيانات.
  static const _stampLimit = 600;

  final LinkedHashMap<String, _Entry> _memory = LinkedHashMap();
  int _memoryBytes = 0;

  /// ما وصل من الشبكة ولم يُكتب على القرص بعد — قراءة في هذه اللحظة لا ترى الملف القديم.
  final Map<String, _Entry> _pendingWrites = {};

  /// وقت آخر حفظ معروف لكل مفتاح (من الشبكة أو من القرص) — يبقى بعد خروج البيانات من الذاكرة.
  final LinkedHashMap<String, DateTime> _stamps = LinkedHashMap();

  final Set<String> _revalidating = {};

  /// طلب شبكة جارٍ لكل مفتاح — من يطلب نفس المفتاح أثناءه ينتظر نفس الرد.
  final Map<String, Future<dynamic>> _inflight = {};

  /// مفاتيح عُرضت آخر مرة من النسخة المحفوظة لأن الشبكة فشلت.
  final Set<String> _staleKeys = {};
  Future<Directory>? _dir;
  int _tmpSeq = 0;

  /// يقرأ [key] من الذاكرة/القرص أو يجلبه من الشبكة.
  ///
  /// - أحدث من [ttl]: يُعرض كما هو.
  /// - أقدم من [ttl] وأحدث من `ttl × maxStaleFactor`: يُعرض فوراً ويُحدَّث في الخلفية.
  /// - غير ذلك (أو [forceRefresh]): ننتظر الشبكة. إن فشلت فشلاً عابراً
  ///   ([isTransientNetworkError]) و[staleOnError] مفعّل تُعرض آخر نسخة محفوظة؛
  ///   مع 404/410 تُحذف النسخة ويُعاد رمي الخطأ.
  Future<T> getOrFetch<T>({
    required String key,
    required Duration ttl,
    required Future<T> Function() fetch,
    required T Function(dynamic json) parse,
    required dynamic Function(T value) serialize,
    bool forceRefresh = false,
    int maxStaleFactor = 2,
    bool staleOnError = true,
  }) {
    return _read<T>(
      key: key,
      ttl: ttl,
      forceRefresh: forceRefresh,
      maxStaleFactor: maxStaleFactor,
      staleOnError: staleOnError,
      fromEntry: (e) async => parse(await _entryData(e)),
      fetchAndStore: () async {
        final value = await fetch();
        // الحفظ على القرص في الخلفية — لا نؤخّر عرض الصفحة بانتظاره.
        unawaited(_store(key, serialize(value)));
        return value;
      },
    );
  }

  /// مثل [getOrFetch] لكن [fetchRaw] يُرجع نص الرد كما وصل من الشبكة:
  /// - يُكتب على القرص كما هو (لا jsonEncode لخريطة كبيرة على خيط الواجهة).
  /// - الرد الكبير (> ~60KB) يُفكّ ويُبنى نموذجه بـ [parse] معاً في isolate، وكذلك عند
  ///   قراءته من القرص — لذلك [parse] دالة عامة/ثابتة لا تلتقط شيئاً (قابلة للإرسال).
  /// - [unwrapData]: ما يصل لـ [parse] هو `body['data']` إن وُجد (غلاف الخادم)، وإلا الجسم.
  ///
  /// النسخ المحفوظة بالصيغة القديمة لنفس المفتاح تُقرأ كما هي.
  Future<M> getOrFetchJson<M>({
    required String key,
    required Duration ttl,
    required Future<String> Function() fetchRaw,
    required M Function(dynamic data) parse,
    bool unwrapData = false,
    bool forceRefresh = false,
    int maxStaleFactor = 2,
    bool staleOnError = true,
  }) {
    return _read<M>(
      key: key,
      ttl: ttl,
      forceRefresh: forceRefresh,
      maxStaleFactor: maxStaleFactor,
      staleOnError: staleOnError,
      fromEntry: (e) => _parseEntry(e, parse),
      fetchAndStore: () async {
        final raw = await fetchRaw();
        final now = DateTime.now();
        final file = '{"ts":${now.millisecondsSinceEpoch},"unwrap":${unwrapData ? 1 : 0},"body":$raw}';
        M value;
        dynamic data;
        var decoded = false;
        try {
          if (raw.length > _parseIsolateThreshold) {
            value = await _parseFile(file, parse);
          } else {
            data = _fileData(jsonDecode(file));
            decoded = true;
            value = parse(data);
          }
        } on FormatException catch (e) {
          // صفحة غير JSON (بوابة واي فاي، خطأ وسيط): فشل نقل عابر لا محتوى جديد.
          throw DioException(
            requestOptions: RequestOptions(path: key),
            type: DioExceptionType.unknown,
            error: e,
            message: 'Invalid JSON response',
          );
        }
        final entry = decoded
            ? _Entry(data: data, storedAt: now, bytes: raw.length)
            : _Entry(file: file, storedAt: now, bytes: raw.length);
        unawaited(_storeFile(key, entry, file));
        return value;
      },
    );
  }

  /// هل خُزّن هذا المفتاح من الشبكة خلال [within]؟ (لتجنّب إعادة طلب ما وصل للتو)
  bool isFresh(String key, Duration within) {
    final at = _stamps[key];
    return at != null && DateTime.now().difference(at) < within;
  }

  /// مثل [isFresh] لكنه يقرأ وقت النسخة المحفوظة على القرص إن لم تُقرأ بعد في هذه الجلسة.
  Future<bool> isStoredWithin(String key, Duration within) async {
    var at = _stamps[key];
    if (at == null) {
      try {
        final f = await _file(key);
        if (await f.exists()) {
          final raf = await f.open();
          try {
            final head = utf8.decode(await raf.read(40), allowMalformed: true);
            final ts = _leadingTs(head);
            if (ts != null) at = DateTime.fromMillisecondsSinceEpoch(ts);
          } finally {
            await raf.close();
          }
        }
      } catch (_) {}
    }
    return at != null && DateTime.now().difference(at) < within;
  }

  /// هل عُرضت آخر قراءة لهذا المفتاح من النسخة المحفوظة لأن الشبكة فشلت؟
  /// (لعرض «آخر تحديث قبل …» أو «بلا اتصال — نعرض آخر نسخة محفوظة»)
  bool servedStale(String key) => _staleKeys.contains(key);

  /// وقت آخر جلب ناجح لهذا المفتاح (null إن لم يُقرأ بعد في هذه الجلسة).
  DateTime? fetchedAt(String key) => _stamps[key];

  /// يفرّغ البيانات المفكوكة من الذاكرة (ضغط ذاكرة من النظام). القرص والطلبات الجارية
  /// كما هي؛ القراءة التالية تأتي من القرص.
  void trimMemory() {
    _memory.clear();
    _memoryBytes = 0;
  }

  Future<void> remove(String key) async {
    _memoryRemove(key);
    _pendingWrites.remove(key);
    _stamps.remove(key);
    _revalidating.remove(key);
    _staleKeys.remove(key);
    try {
      final f = await _file(key);
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }

  /// يمسح كل مفاتيح الكاش التي تبدأ بالبادئة (مثل products_v2).
  Future<void> removePrefix(String prefix) async {
    for (final key in _memory.keys.where((k) => k.startsWith(prefix)).toList()) {
      _memoryRemove(key);
    }
    _pendingWrites.removeWhere((key, _) => key.startsWith(prefix));
    _stamps.removeWhere((key, _) => key.startsWith(prefix));
    _revalidating.removeWhere((key) => key.startsWith(prefix));
    _staleKeys.removeWhere((key) => key.startsWith(prefix));
    try {
      final dir = await _directory();
      final encoded = _fileName(prefix).replaceAll('.json', '');
      await for (final f in dir.list()) {
        final name = f.uri.pathSegments.last;
        if (f is File && name.startsWith(encoded)) await f.delete();
      }
    } catch (_) {}
  }

  Future<void> clearPublic() async {
    trimMemory();
    _pendingWrites.clear();
    _stamps.clear();
    _revalidating.clear();
    _staleKeys.clear();
    try {
      final dir = await _directory();
      if (await dir.exists()) await dir.delete(recursive: true);
    } catch (_) {}
    _dir = null;
  }

  // ---------------------------------------------------------------- داخلي

  Future<T> _read<T>({
    required String key,
    required Duration ttl,
    required bool forceRefresh,
    required int maxStaleFactor,
    required bool staleOnError,
    required Future<T> Function(_Entry entry) fromEntry,
    required Future<T> Function() fetchAndStore,
  }) async {
    final now = DateTime.now();
    final entry = _memoryGet(key) ?? await _loadDisk(key);

    // ملف تالف (انقطاع الكتابة، تحديث صيغة): لا نعرضه — نجلب من جديد.
    Future<T> serve(_Entry e) async {
      try {
        return await fromEntry(e);
      } on FormatException {
        await remove(key);
        return _fetchOnce<T>(key, fetchAndStore);
      }
    }

    if (!forceRefresh && entry != null) {
      final age = now.difference(entry.storedAt);
      if (age < ttl) return serve(entry);
      if (age < ttl * maxStaleFactor) {
        _revalidate<T>(key, fetchAndStore);
        return serve(entry);
      }
    }

    try {
      return await _fetchOnce<T>(key, fetchAndStore);
    } catch (e) {
      // حُذف من الخادم: لا نعرض نسخته القديمة (سعر ومخزون منتهيان) مرة أخرى.
      if (isGoneError(e)) {
        await remove(key);
        rethrow;
      }
      // بلا إنترنت: آخر نسخة محفوظة مهما كان عمرها أفضل من شاشة خطأ.
      if (entry != null && staleOnError && isTransientNetworkError(e)) {
        _staleKeys.add(key);
        return fromEntry(entry);
      }
      rethrow;
    }
  }

  _Entry? _memoryGet(String key) {
    final e = _memory.remove(key);
    if (e != null) {
      _memory[key] = e; // الأحدث استخداماً في النهاية
      return e;
    }
    return _pendingWrites[key];
  }

  void _memoryRemove(String key) {
    final old = _memory.remove(key);
    if (old != null) _memoryBytes -= old.bytes;
  }

  void _memoryPut(String key, _Entry e) {
    _memoryRemove(key);
    // الكبير لا يبقى مفكوكاً في الذاكرة — مزوّده يحمل نموذجه، والقرص يحمل نصه.
    if (e.file != null || e.bytes > _memoryEntryMaxBytes) return;
    _memory[key] = e;
    _memoryBytes += e.bytes;
    final budget = _memoryBudget;
    while (_memory.length > _memoryLimit || (_memoryBytes > budget && _memory.length > 1)) {
      _memoryRemove(_memory.keys.first);
    }
  }

  void _stamp(String key, DateTime at) {
    _stamps.remove(key);
    _stamps[key] = at;
    if (_stamps.length > _stampLimit) _stamps.remove(_stamps.keys.first);
  }

  /// جلب واحد لكل مفتاح: الطلبات المتزامنة (تحديث خلفي + سحب للتحديث + جلب مسبق)
  /// تنتظر نفس الاتصال بدل تنزيل نفس البيانات مرتين.
  Future<T> _fetchOnce<T>(String key, Future<T> Function() fetchAndStore) {
    final pending = _inflight[key];
    if (pending is Future<T>) return pending;
    final completer = Completer<T>();
    final future = completer.future;
    _inflight[key] = future;
    unawaited(() async {
      try {
        final value = await fetchAndStore();
        _staleKeys.remove(key);
        completer.complete(value);
      } catch (e, st) {
        completer.completeError(e, st);
      } finally {
        if (identical(_inflight[key], future)) _inflight.remove(key);
      }
    }());
    return future;
  }

  void _revalidate<T>(String key, Future<T> Function() fetchAndStore) {
    if (_revalidating.contains(key) || _inflight.containsKey(key)) return;
    _revalidating.add(key);
    unawaited(() async {
      try {
        await _fetchOnce<T>(key, fetchAndStore);
      } catch (e) {
        if (isGoneError(e)) {
          // حُذف من الخادم: القراءة التالية لا تعرض النسخة القديمة.
          await remove(key);
        } else if (isTransientNetworkError(e)) {
          _staleKeys.add(key);
        }
      } finally {
        _revalidating.remove(key);
      }
    }());
  }

  /// قيمة JSON لمدخل ([getOrFetch]): من الذاكرة، أو بفكّ نص الملف (الكبير في isolate).
  Future<dynamic> _entryData(_Entry e) async {
    final file = e.file;
    if (file == null) return e.data;
    return _fileData(await _decode(file));
  }

  /// نموذج لمدخل ([getOrFetchJson]).
  Future<M> _parseEntry<M>(_Entry e, M Function(dynamic data) parse) async {
    final file = e.file;
    if (file == null) return parse(e.data);
    return _parseFile(file, parse);
  }

  /// يحفظ قيمة [getOrFetch] (تُرمَّز هنا).
  Future<void> _store(String key, dynamic data) async {
    final now = DateTime.now();
    // تقدير أولي للحجم — يُصحَّح بعد الترميز.
    var entry = _Entry(data: data, storedAt: now, bytes: _isLarge(data) ? _memoryEntryMaxBytes + 1 : 4 * 1024);
    _stamp(key, now);
    _memoryPut(key, entry);
    _pendingWrites[key] = entry;
    try {
      final raw = await _encode({'ts': now.millisecondsSinceEpoch, 'data': data});
      if (identical(_pendingWrites[key], entry)) {
        final sized = _Entry(data: data, storedAt: now, bytes: raw.length);
        _memoryPut(key, sized);
        _pendingWrites[key] = sized;
        entry = sized;
      }
      await _writeFile(key, entry, raw);
    } catch (_) {
    } finally {
      if (identical(_pendingWrites[key], entry)) _pendingWrites.remove(key);
    }
  }

  /// يحفظ رد [getOrFetchJson] بنصه كما وصل.
  Future<void> _storeFile(String key, _Entry entry, String file) async {
    _stamp(key, entry.storedAt);
    _memoryPut(key, entry);
    _pendingWrites[key] = entry;
    try {
      await _writeFile(key, entry, file);
    } catch (_) {
    } finally {
      if (identical(_pendingWrites[key], entry)) _pendingWrites.remove(key);
    }
  }

  /// كتابة ذرّية: ملف مؤقت ثم إعادة تسمية — لا ملف نصف مكتوب عند إغلاق التطبيق.
  /// إن وصل رد أحدث أثناء الكتابة لا نكتب فوقه بالأقدم.
  Future<void> _writeFile(String key, _Entry entry, String raw) async {
    final f = await _file(key);
    final tmp = File('${f.path}.${_tmpSeq++}.tmp');
    await tmp.writeAsString(raw, flush: false);
    if (!identical(_pendingWrites[key], entry)) {
      await tmp.delete();
      return;
    }
    await tmp.rename(f.path);
  }

  Future<_Entry?> _loadDisk(String key) async {
    try {
      final f = await _file(key);
      if (!await f.exists()) return null;
      final raw = await f.readAsString();
      var ts = _leadingTs(raw);
      if (ts == null) {
        // ملف بلا الترتيب المعتاد: نفكّه كاملاً.
        final json = await _decode(raw);
        if (json is! Map || json['ts'] is! int) return null;
        ts = json['ts'] as int;
        final storedAt = DateTime.fromMillisecondsSinceEpoch(ts);
        _stamp(key, storedAt);
        final entry = _Entry(data: _fileData(json), storedAt: storedAt, bytes: raw.length);
        _memoryPut(key, entry);
        return entry;
      }
      final storedAt = DateTime.fromMillisecondsSinceEpoch(ts);
      _stamp(key, storedAt);
      // الكبير يبقى نصاً: يُفكّ (ويُبنى نموذجه) في isolate عند الحاجة فقط.
      if (raw.length > _memoryEntryMaxBytes) {
        return _Entry(file: raw, storedAt: storedAt, bytes: raw.length);
      }
      final entry = _Entry(data: _fileData(jsonDecode(raw)), storedAt: storedAt, bytes: raw.length);
      _memoryPut(key, entry);
      return entry;
    } catch (_) {
      return null;
    }
  }

  Future<String> _encode(Map<String, dynamic> payload) =>
      _isLarge(payload['data']) ? compute(_jsonEncode, payload) : Future.value(jsonEncode(payload));

  /// تقدير سريع للحجم دون ترميز: عدد العناصر حتى عمق محدود.
  static bool _isLarge(dynamic data) {
    var count = 0;
    bool walk(dynamic v, int depth) {
      if (++count > 400) return true;
      if (depth > 4) return false;
      if (v is Map) {
        for (final e in v.values) {
          if (walk(e, depth + 1)) return true;
        }
      } else if (v is List) {
        for (final e in v) {
          if (walk(e, depth + 1)) return true;
        }
      }
      return false;
    }

    return walk(data, 0);
  }

  Future<dynamic> _decode(String raw) =>
      raw.length > _isolateThreshold ? compute(_jsonDecode, raw) : Future.value(jsonDecode(raw));

  /// يفكّ نص ملف ويبني نموذجه — في isolate إن كان كبيراً. إن تعذّر إرسال [parse]
  /// إلى isolate نبنيه هنا بدل أن نفشل.
  static Future<M> _parseFile<M>(String file, M Function(dynamic data) parse) async {
    if (file.length <= _parseIsolateThreshold) return parse(_fileData(jsonDecode(file)));
    try {
      return await _parseFileInIsolate(file, parse);
    } on FormatException {
      rethrow;
    } catch (e) {
      debugPrint('[ApiCache] isolate parse failed, parsing inline: $e');
      return parse(_fileData(jsonDecode(file)));
    }
  }

  Future<Directory> _directory() => _dir ??= () async {
        final base = await getApplicationSupportDirectory();
        final d = Directory('${base.path}/$_dirName');
        if (!await d.exists()) await d.create(recursive: true);
        return d;
      }();

  Future<File> _file(String key) async => File('${(await _directory()).path}/${_fileName(key)}');

  static String _fileName(String key) {
    final safe = Uri.encodeComponent(key).replaceAll('%', '_');
    // أسماء الملفات محدودة الطول — نختصر الطويل مع بصمة تميّزه.
    if (safe.length <= 150) return '$safe.json';
    return '${safe.substring(0, 120)}_${key.hashCode.toUnsigned(32).toRadixString(16)}.json';
  }

  /// مرة واحدة: حذف كاش SharedPreferences القديم (كان يُحمَّل كاملاً عند كل تشغيل).
  Future<void> _migrateFromPrefs() async {
    try {
      final old = _prefs.getKeys().where((k) => k.startsWith(_legacyPrefix)).toList();
      for (final k in old) {
        await _prefs.remove(k);
      }
    } catch (_) {}
  }
}

/// دالة عامة (لا تلتقط شيئاً من الكاش) — ما يُرسل إلى isolate هو النص و[parse] فقط.
Future<M> _parseFileInIsolate<M>(String file, M Function(dynamic data) parse) =>
    Isolate.run(() => parse(_fileData(jsonDecode(file))));

final _leadingTsPattern = RegExp(r'^\{"ts":(\d+)[,}]');

/// وقت الحفظ من أول الملف (`{"ts":123,...`) بلا فكّ الملف كاملاً.
int? _leadingTs(String raw) {
  final m = _leadingTsPattern.firstMatch(raw.length > 40 ? raw.substring(0, 40) : raw);
  return m == null ? null : int.tryParse(m.group(1)!);
}

/// القيمة المحفوظة في ملف: `{ts, data}` (الصيغة الأولى) أو `{ts, unwrap, body}` (نص الرد).
dynamic _fileData(dynamic json) {
  if (json is! Map) throw const FormatException('Invalid cache entry');
  if (json.containsKey('body')) {
    final body = json['body'];
    if (json['unwrap'] == 1 && body is Map && body.containsKey('data')) return body['data'];
    return body;
  }
  return json['data'];
}

dynamic _jsonDecode(String raw) => jsonDecode(raw);
String _jsonEncode(Map<String, dynamic> payload) => jsonEncode(payload);

/// مدخل كاش: [data] مفكوكة (الصغير)، أو [file] نص الملف كما على القرص (الكبير).
class _Entry {
  final dynamic data;
  final String? file;
  final DateTime storedAt;

  /// حجم JSON الخام بالبايت (تقريباً) — لميزانية الذاكرة.
  final int bytes;

  const _Entry({this.data, this.file, required this.storedAt, required this.bytes});
}
