import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One product addition logged for daily progress.
class DailyAddEntry {
  const DailyAddEntry({
    required this.barcode,
    required this.at,
    required this.source,
    this.name,
  });

  final String barcode;
  final DateTime at;
  final String source; // ai | catalog
  final String? name;

  String get displayName {
    final n = name?.trim();
    if (n != null && n.isNotEmpty) return n;
    return barcode;
  }

  String get sourceLabelAr => source == 'catalog' ? 'كتالوج' : 'إضافة ذكية';

  Map<String, dynamic> toJson() => {
        'barcode': barcode,
        'at': at.toIso8601String(),
        'source': source,
        'name': name,
      };

  factory DailyAddEntry.fromJson(Map<String, dynamic> json) {
    return DailyAddEntry(
      barcode: json['barcode']?.toString() ?? '',
      at: DateTime.tryParse(json['at']?.toString() ?? '') ?? DateTime.now(),
      source: json['source']?.toString() ?? 'ai',
      name: json['name']?.toString(),
    );
  }
}

class DailyProgressSnapshot {
  const DailyProgressSnapshot({
    required this.todayKey,
    required this.todayCount,
    required this.byDay,
    required this.todayEntries,
  });

  final String todayKey;
  final int todayCount;
  final Map<String, int> byDay;
  final List<DailyAddEntry> todayEntries;

  /// Last [days] calendar days ending today (oldest → newest).
  List<({String day, int count})> recentDays({int days = 14}) {
    final today = DateTime.tryParse(todayKey) ?? DateTime.now();
    final out = <({String day, int count})>[];
    for (var i = days - 1; i >= 0; i--) {
      final d = DateTime(today.year, today.month, today.day).subtract(Duration(days: i));
      final key = DailyProgressStore.dayKey(d);
      out.add((day: key, count: byDay[key] ?? 0));
    }
    return out;
  }

  int get weekTotal => recentDays(days: 7).fold<int>(0, (s, e) => s + e.count);

  int get bestDayInPeriod {
    final days = recentDays(days: 30);
    if (days.isEmpty) return 0;
    return days.map((e) => e.count).reduce((a, b) => a > b ? a : b);
  }
}

/// Local daily product-add counter. Each calendar day starts at 0;
/// historical day totals stay on device.
class DailyProgressStore {
  DailyProgressStore._();

  static const _countsKey = 'daily_product_counts_v1';
  static const _entriesKey = 'daily_product_entries_v1';
  static const _maxHistoryDays = 120;
  static const _maxEntries = 400;

  static String dayKey([DateTime? date]) {
    final d = date ?? DateTime.now();
    final mm = d.month.toString().padLeft(2, '0');
    final dd = d.day.toString().padLeft(2, '0');
    return '${d.year}-$mm-$dd';
  }

  static Future<DailyProgressSnapshot> snapshot() async {
    final prefs = await SharedPreferences.getInstance();
    final today = dayKey();
    final byDay = _readCounts(prefs);
    final entries = _readEntries(prefs).where((e) => dayKey(e.at) == today).toList()
      ..sort((a, b) => b.at.compareTo(a.at));
    return DailyProgressSnapshot(
      todayKey: today,
      todayCount: byDay[today] ?? 0,
      byDay: byDay,
      todayEntries: entries,
    );
  }

  static Future<DailyProgressSnapshot> recordAdd({
    required String barcode,
    String? name,
    String source = 'ai',
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final today = dayKey();
    final byDay = _readCounts(prefs);
    byDay[today] = (byDay[today] ?? 0) + 1;
    _pruneCounts(byDay, today);
    await prefs.setString(_countsKey, jsonEncode(byDay));

    final entries = _readEntries(prefs);
    entries.insert(
      0,
      DailyAddEntry(
        barcode: barcode,
        at: DateTime.now(),
        source: source,
        name: name,
      ),
    );
    final trimmed = entries.take(_maxEntries).toList();
    await prefs.setStringList(
      _entriesKey,
      trimmed.map((e) => jsonEncode(e.toJson())).toList(),
    );

    return DailyProgressSnapshot(
      todayKey: today,
      todayCount: byDay[today] ?? 0,
      byDay: byDay,
      todayEntries: trimmed.where((e) => dayKey(e.at) == today).toList(),
    );
  }

  static Map<String, int> _readCounts(SharedPreferences prefs) {
    final raw = prefs.getString(_countsKey);
    if (raw == null || raw.isEmpty) return {};
    try {
      final map = jsonDecode(raw);
      if (map is! Map) return {};
      final out = <String, int>{};
      for (final e in map.entries) {
        final n = e.value;
        final count = n is int ? n : int.tryParse(n?.toString() ?? '') ?? 0;
        if (count > 0) out[e.key.toString()] = count;
      }
      return out;
    } catch (_) {
      return {};
    }
  }

  static List<DailyAddEntry> _readEntries(SharedPreferences prefs) {
    final raw = prefs.getStringList(_entriesKey) ?? [];
    return raw
        .map((e) {
          try {
            return DailyAddEntry.fromJson(Map<String, dynamic>.from(jsonDecode(e) as Map));
          } catch (_) {
            return null;
          }
        })
        .whereType<DailyAddEntry>()
        .where((e) => e.barcode.isNotEmpty)
        .toList();
  }

  static void _pruneCounts(Map<String, int> byDay, String todayKey) {
    final today = DateTime.tryParse(todayKey);
    if (today == null) return;
    final cutoff = today.subtract(const Duration(days: _maxHistoryDays));
    byDay.removeWhere((key, _) {
      final d = DateTime.tryParse(key);
      return d == null || d.isBefore(cutoff);
    });
  }
}

class DailyProgressNotifier extends StateNotifier<DailyProgressSnapshot> {
  DailyProgressNotifier()
      : super(
          DailyProgressSnapshot(
            todayKey: DailyProgressStore.dayKey(),
            todayCount: 0,
            byDay: const {},
            todayEntries: const [],
          ),
        ) {
    refresh();
  }

  Future<void> refresh() async {
    state = await DailyProgressStore.snapshot();
  }

  Future<void> recordAdd({
    required String barcode,
    String? name,
    String source = 'ai',
  }) async {
    state = await DailyProgressStore.recordAdd(
      barcode: barcode,
      name: name,
      source: source,
    );
  }
}

final dailyProgressProvider =
    StateNotifierProvider<DailyProgressNotifier, DailyProgressSnapshot>((ref) {
  return DailyProgressNotifier();
});

/// Arabic label for a `YYYY-MM-DD` key.
String formatDayKeyAr(String dayKey, {bool includeWeekday = true}) {
  final d = DateTime.tryParse(dayKey);
  if (d == null) return dayKey;
  const weekdays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
  final date = '${d.day}/${d.month}';
  if (!includeWeekday) return date;
  return '${weekdays[d.weekday - 1]} $date';
}
