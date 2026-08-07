import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class AiDraftEntry {
  const AiDraftEntry({
    required this.barcode,
    required this.savedAt,
    this.nameAr,
    this.nameEn,
  });

  final String barcode;
  final DateTime savedAt;
  final String? nameAr;
  final String? nameEn;

  String get displayName {
    if (nameAr?.trim().isNotEmpty == true) return nameAr!.trim();
    if (nameEn?.trim().isNotEmpty == true) return nameEn!.trim();
    return barcode;
  }

  Map<String, dynamic> toJson() => {
        'barcode': barcode,
        'savedAt': savedAt.toIso8601String(),
        'nameAr': nameAr,
        'nameEn': nameEn,
      };

  factory AiDraftEntry.fromJson(Map<String, dynamic> json) {
    return AiDraftEntry(
      barcode: json['barcode']?.toString() ?? '',
      savedAt: DateTime.tryParse(json['savedAt']?.toString() ?? '') ?? DateTime.now(),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
    );
  }
}

class AiDraftStore {
  static const _key = 'ai_add_recent_v1';

  static Future<List<AiDraftEntry>> list() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    return raw
        .map((e) {
          try {
            return AiDraftEntry.fromJson(Map<String, dynamic>.from(jsonDecode(e) as Map));
          } catch (_) {
            return null;
          }
        })
        .whereType<AiDraftEntry>()
        .where((e) => e.barcode.isNotEmpty)
        .toList();
  }

  static Future<void> push({
    required String barcode,
    String? nameAr,
    String? nameEn,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final current = await list();
    final next = [
      AiDraftEntry(
        barcode: barcode,
        savedAt: DateTime.now(),
        nameAr: nameAr,
        nameEn: nameEn,
      ),
      ...current.where((e) => e.barcode != barcode),
    ].take(30).toList();
    await prefs.setStringList(_key, next.map((e) => jsonEncode(e.toJson())).toList());
  }
}
