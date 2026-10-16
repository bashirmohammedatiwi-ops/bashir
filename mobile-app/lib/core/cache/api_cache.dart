import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// كاش بيانات API — ذاكرة + ملفات على القرص مع إعادة تحميل في الخلفية.
///
/// كل مفتاح في ملف مستقل (لا SharedPreferences): ملف التفضيلات يُحمَّل كاملاً عند
/// كل تشغيل ويُعاد كتابته كاملاً عند كل حفظ — مع واجهات بالميغابايت كان ذلك يبطئ
/// الإقلاع ويسبب تقطعاً. فكّ وترميز JSON الكبير يتم خارج خيط الواجهة.
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
  Future<Directory>? _dir;

  Future<T> getOrFetch<T>({
    required String key,
    required Duration ttl,
    required Future<T> Function() fetch,
    required T Function(dynamic json) parse,
    required dynamic Function(T value) serialize,
    bool forceRefresh = false,
    int maxStaleFactor = 2,
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
      final value = await fetch();
      // الحفظ على القرص في الخلفية — لا نؤخّر عرض الصفحة بانتظاره.
      unawaited(_store(key, serialize(value)));
      return value;
    } catch (e) {
      // بلا إنترنت: آخر نسخة محفوظة مهما كان عمرها أفضل من شاشة خطأ.
      if (entry != null) {
        _memoryPut(key, entry);
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

  Future<void> remove(String key) async {
    _memory.remove(key);
    _revalidating.remove(key);
    try {
      final f = await _file(key);
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }

  /// يمسح كل مفاتيح الكاش التي تبدأ بالبادئة (مثل products_v2).
  Future<void> removePrefix(String prefix) async {
    _memory.removeWhere((key, _) => key.startsWith(prefix));
    _revalidating.removeWhere((key) => key.startsWith(prefix));
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

  void _revalidate<T>(
    String key,
    Future<T> Function() fetch,
    dynamic Function(T value) serialize,
  ) {
    if (_revalidating.contains(key)) return;
    _revalidating.add(key);
    unawaited(() async {
      try {
        final value = await fetch();
        await _store(key, serialize(value));
      } catch (_) {
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
