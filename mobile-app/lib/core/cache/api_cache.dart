import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
/// النسخة المحفوظة تُعرض بعد فشل الشبكة فقط ([isTransientNetworkError])؛ 404/410
/// يحذفها. الطلبات المتزامنة لنفس المفتاح تشترك في اتصال واحد.
class ApiCache {
  ApiCache(this._prefs) {
    unawaited(_migrateFromPrefs());
  }

  final SharedPreferences _prefs;
  static const _legacyPrefix = 'api_cache_v1_';
  static const _dirName = 'api_cache_v2';

  /// حد الذاكرة: آخر المفاتيح استخداماً فقط (الواجهة الرئيسية، القوائم، المنتجات).
  static const _memoryLimit = 80;

  /// فوق هذا الحجم يُفكّ/يُرمَّز JSON في isolate منفصل.
  static const _isolateThreshold = 48 * 1024;

  final LinkedHashMap<String, _Entry> _memory = LinkedHashMap();
  final Set<String> _revalidating = {};

  /// طلب شبكة جارٍ لكل مفتاح — من يطلب نفس المفتاح أثناءه ينتظر نفس الرد.
  final Map<String, Future<dynamic>> _inflight = {};

  /// مفاتيح عُرضت آخر مرة من النسخة المحفوظة لأن الشبكة فشلت.
  final Set<String> _staleKeys = {};
  Future<Directory>? _dir;

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
  }) async {
    final now = DateTime.now();
    final entry = _memoryGet(key) ?? await _loadDisk(key);

    if (!forceRefresh && entry != null) {
      final age = now.difference(entry.storedAt);
      if (age < ttl) {
        _memoryPut(key, entry);
        return parse(entry.data);
      }
      final maxStale = ttl * maxStaleFactor;
      if (age < maxStale) {
        _memoryPut(key, entry);
        _revalidate(key, fetch, serialize);
        return parse(entry.data);
      }
    }

    try {
      return await _fetchOnce(key, fetch, serialize);
    } catch (e) {
      // حُذف من الخادم: لا نعرض نسخته القديمة (سعر ومخزون منتهيان) مرة أخرى.
      if (isGoneError(e)) {
        await remove(key);
        rethrow;
      }
      // بلا إنترنت: آخر نسخة محفوظة مهما كان عمرها أفضل من شاشة خطأ.
      if (entry != null && staleOnError && isTransientNetworkError(e)) {
        _memoryPut(key, entry);
        _staleKeys.add(key);
        return parse(entry.data);
      }
      rethrow;
    }
  }

  /// هل خُزّن هذا المفتاح من الشبكة خلال [within]؟ (لتجنّب إعادة طلب ما وصل للتو)
  bool isFresh(String key, Duration within) {
    final e = _memory[key];
    return e != null && DateTime.now().difference(e.storedAt) < within;
  }

  /// هل عُرضت آخر قراءة لهذا المفتاح من النسخة المحفوظة لأن الشبكة فشلت؟
  /// (لعرض «آخر تحديث قبل …» أو «بلا اتصال — نعرض آخر نسخة محفوظة»)
  bool servedStale(String key) => _staleKeys.contains(key);

  /// وقت آخر جلب ناجح لهذا المفتاح — من الذاكرة فقط (null إن لم يُقرأ بعد في هذه الجلسة).
  DateTime? fetchedAt(String key) => _memory[key]?.storedAt;

  Future<void> remove(String key) async {
    _memory.remove(key);
    _revalidating.remove(key);
    _staleKeys.remove(key);
    try {
      final f = await _file(key);
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }

  /// يمسح كل مفاتيح الكاش التي تبدأ بالبادئة (مثل products_v2).
  Future<void> removePrefix(String prefix) async {
    _memory.removeWhere((key, _) => key.startsWith(prefix));
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
    _memory.clear();
    _revalidating.clear();
    _staleKeys.clear();
    try {
      final dir = await _directory();
      if (await dir.exists()) await dir.delete(recursive: true);
    } catch (_) {}
    _dir = null;
  }

  // ---------------------------------------------------------------- داخلي

  _Entry? _memoryGet(String key) {
    final e = _memory.remove(key);
    if (e != null) _memory[key] = e; // الأحدث استخداماً في النهاية
    return e;
  }

  void _memoryPut(String key, _Entry e) {
    _memory.remove(key);
    _memory[key] = e;
    while (_memory.length > _memoryLimit) {
      _memory.remove(_memory.keys.first);
    }
  }

  /// جلب واحد لكل مفتاح: الطلبات المتزامنة (تحديث خلفي + سحب للتحديث + جلب مسبق)
  /// تنتظر نفس الاتصال بدل تنزيل نفس البيانات مرتين.
  Future<T> _fetchOnce<T>(
    String key,
    Future<T> Function() fetch,
    dynamic Function(T value) serialize,
  ) {
    final pending = _inflight[key];
    if (pending is Future<T>) return pending;
    final completer = Completer<T>();
    final future = completer.future;
    _inflight[key] = future;
    unawaited(() async {
      try {
        final value = await fetch();
        _staleKeys.remove(key);
        // الحفظ على القرص في الخلفية — لا نؤخّر عرض الصفحة بانتظاره.
        unawaited(_store(key, serialize(value)));
        completer.complete(value);
      } catch (e, st) {
        completer.completeError(e, st);
      } finally {
        if (identical(_inflight[key], future)) _inflight.remove(key);
      }
    }());
    return future;
  }

  void _revalidate<T>(
    String key,
    Future<T> Function() fetch,
    dynamic Function(T value) serialize,
  ) {
    if (_revalidating.contains(key) || _inflight.containsKey(key)) return;
    _revalidating.add(key);
    unawaited(() async {
      try {
        await _fetchOnce(key, fetch, serialize);
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

  Future<void> _store(String key, dynamic data) async {
    final entry = _Entry(data, DateTime.now());
    _memoryPut(key, entry);
    try {
      final payload = {'ts': entry.storedAt.millisecondsSinceEpoch, 'data': data};
      final raw = await _encode(payload);
      final f = await _file(key);
      // كتابة ذرّية: ملف مؤقت ثم إعادة تسمية — لا ملف نصف مكتوب عند إغلاق التطبيق.
      final tmp = File('${f.path}.tmp');
      await tmp.writeAsString(raw, flush: false);
      await tmp.rename(f.path);
    } catch (_) {}
  }

  Future<_Entry?> _loadDisk(String key) async {
    try {
      final f = await _file(key);
      if (!await f.exists()) return null;
      final raw = await f.readAsString();
      final json = await _decode(raw);
      if (json is! Map) return null;
      final ts = json['ts'];
      if (ts is! int) return null;
      final entry = _Entry(json['data'], DateTime.fromMillisecondsSinceEpoch(ts));
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

dynamic _jsonDecode(String raw) => jsonDecode(raw);
String _jsonEncode(Map<String, dynamic> payload) => jsonEncode(payload);

class _Entry {
  final dynamic data;
  final DateTime storedAt;
  const _Entry(this.data, this.storedAt);
}
