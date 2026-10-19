import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _key = 'recent_searches_v1';
const _max = 8;

class RecentSearchesNotifier extends StateNotifier<List<String>> {
  RecentSearchesNotifier() : super(const []) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      final saved = (jsonDecode(raw) as List).map((e) => e.toString()).where((e) => e.trim().isNotEmpty);
      // ما أُضيف قبل اكتمال القراءة يبقى في المقدمة.
      final seen = {for (final e in state) e.toLowerCase()};
      state = [...state, ...saved.where((e) => seen.add(e.toLowerCase()))].take(_max).toList();
    } catch (_) {}
  }

  Future<void> add(String query) async {
    final q = query.trim();
    if (q.length < 2) return;
    final next = [q, ...state.where((e) => e.toLowerCase() != q.toLowerCase())].take(_max).toList();
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(next));
  }

  Future<void> remove(String query) async {
    final next = state.where((e) => e != query).toList();
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(next));
  }

  /// «تراجع» بعد «مسح الكل»: يعيد القائمة كما كانت.
  Future<void> restore(List<String> items) async {
    final next = items.where((e) => e.trim().isNotEmpty).take(_max).toList();
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(next));
  }

  Future<void> clear() async {
    state = const [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

final recentSearchesProvider =
    StateNotifierProvider<RecentSearchesNotifier, List<String>>((ref) => RecentSearchesNotifier());
