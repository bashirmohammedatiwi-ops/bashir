import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../data/models/beauty.dart';
import '../../data/services/api_service.dart';
import '../worlds/worlds_provider.dart';

/// العالم الظاهر الآن — الباقات ودليل البشرة تُفلتر به.
final beautyWorldProvider = Provider<String?>((ref) => resolveWorldSlug(
      selected: ref.watch(selectedWorldSlugProvider),
      worlds: ref.watch(worldsProvider).valueOrNull,
    ));

final skinConcernsListProvider = FutureProvider<List<SkinConcern>>((ref) {
  return ref.read(apiServiceProvider).getSkinConcerns(world: ref.watch(beautyWorldProvider));
});

final skinGuideProvider = FutureProvider.family.autoDispose<SkinGuide, String>((ref, slug) {
  return ref.read(apiServiceProvider).getSkinGuide(slug, world: ref.watch(beautyWorldProvider));
});

/// kind: routines | bundles | ROUTINE_MORNING | ROUTINE_EVENING | BRIDAL_KIT | '' (الكل)
final beautyPackagesProvider = FutureProvider.family<List<BeautyPackage>, String>((ref, kind) {
  final profile = ref.watch(skinProfileProvider);
  return ref.read(apiServiceProvider).getPackages(
        world: ref.watch(beautyWorldProvider),
        kind: kind.isEmpty ? null : kind,
        // الروتينات: الأنسب لنوع بشرتها أولاً إن أجرت الاختبار.
        skinType: kind.contains('ROUTINE') || kind == 'routines' ? profile?.skinType.key : null,
      );
});

final beautyPackageProvider = FutureProvider.family.autoDispose<BeautyPackage, String>((ref, idOrSlug) {
  return ref.read(apiServiceProvider).getPackage(idOrSlug);
});

final skinMatchProvider = FutureProvider.autoDispose<SkinMatch?>((ref) {
  final p = ref.watch(skinProfileProvider);
  if (p == null) return Future.value(null);
  return ref.read(apiServiceProvider).matchSkin(
        skinType: p.skinType.key,
        concerns: p.concerns,
        world: ref.watch(beautyWorldProvider),
      );
});

/// نتيجة اختبار البشرة المحفوظة على الجهاز.
class SkinProfile {
  final SkinType skinType;
  final List<String> concerns;
  final DateTime takenAt;
  const SkinProfile({required this.skinType, this.concerns = const [], required this.takenAt});

  Map<String, dynamic> toJson() => {
        'skinType': skinType.key,
        'concerns': concerns,
        'takenAt': takenAt.toIso8601String(),
      };

  static SkinProfile? fromJson(Map<String, dynamic> j) {
    final t = skinTypeFromKey(j['skinType']?.toString());
    if (t == null) return null;
    return SkinProfile(
      skinType: t,
      concerns: (j['concerns'] as List? ?? const []).map((e) => e.toString()).toList(),
      takenAt: DateTime.tryParse(j['takenAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class SkinProfileNotifier extends StateNotifier<SkinProfile?> {
  SkinProfileNotifier(this._ref) : super(null) {
    try {
      final raw = _ref.read(sharedPreferencesProvider).getString(_key);
      if (raw != null) state = SkinProfile.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
    } catch (_) {}
  }

  final Ref _ref;
  static const _key = 'skin_profile_v1';

  void save(SkinProfile p) {
    state = p;
    _ref.read(sharedPreferencesProvider).setString(_key, jsonEncode(p.toJson()));
  }

  void clear() {
    state = null;
    _ref.read(sharedPreferencesProvider).remove(_key);
  }
}

final skinProfileProvider =
    StateNotifierProvider<SkinProfileNotifier, SkinProfile?>((ref) => SkinProfileNotifier(ref));
