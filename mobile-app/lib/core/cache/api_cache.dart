import 'dart:async';
import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// كاش بيانات API — ذاكرة + قرص مع إعادة تحميل في الخلفية.
class ApiCache {
  ApiCache(this._prefs);

  final SharedPreferences _prefs;
  static const _diskPrefix = 'api_cache_v1_';

  final Map<String, _Entry> _memory = {};
  final Set<String> _revalidating = {};

  Future<T> getOrFetch<T>({
    required String key,
    required Duration ttl,
    required Future<T> Function() fetch,
    required T Function(dynamic json) parse,
    required dynamic Function(T value) serialize,
    bool forceRefresh = false,
  }) async {
    final now = DateTime.now();
    _Entry? entry = _memory[key] ?? _loadDisk(key);

    if (!forceRefresh && entry != null) {
      final age = now.difference(entry.storedAt);
      if (age < ttl) {
        _memory[key] = entry;
        return parse(entry.data);
      }
      if (age < ttl * 4) {
        _memory[key] = entry;
        _revalidate(key, fetch, serialize);
        return parse(entry.data);
      }
    }

    final value = await fetch();
    await _store(key, serialize(value));
    return value;
  }

  Future<void> remove(String key) async {
    _memory.remove(key);
    await _prefs.remove('$_diskPrefix$key');
    await _prefs.remove('$_diskPrefix${key}_ts');
  }

  Future<void> clearPublic() async {
    _memory.clear();
    final keys = _prefs.getKeys().where((k) => k.startsWith(_diskPrefix)).toList();
    for (final k in keys) {
      await _prefs.remove(k);
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
    _memory[key] = entry;
    await _prefs.setString('$_diskPrefix$key', jsonEncode(data));
    await _prefs.setInt('$_diskPrefix${key}_ts', entry.storedAt.millisecondsSinceEpoch);
  }

  _Entry? _loadDisk(String key) {
    final raw = _prefs.getString('$_diskPrefix$key');
    final ts = _prefs.getInt('$_diskPrefix${key}_ts');
    if (raw == null || ts == null) return null;
    try {
      return _Entry(jsonDecode(raw), DateTime.fromMillisecondsSinceEpoch(ts));
    } catch (_) {
      return null;
    }
  }
}

class _Entry {
  final dynamic data;
  final DateTime storedAt;
  const _Entry(this.data, this.storedAt);
}
