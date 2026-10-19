import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../data/models/beauty.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
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
  return _packages(
    ref.read(apiServiceProvider),
    kind,
    world: ref.watch(beautyWorldProvider),
    profile: ref.watch(skinProfileProvider),
  );
});

Future<List<BeautyPackage>> _packages(
  ApiService api,
  String kind, {
  String? world,
  SkinProfile? profile,
  bool forceRefresh = false,
}) =>
    api.getPackages(
      world: world,
      kind: kind.isEmpty ? null : kind,
      // الروتينات: الأنسب لنوع بشرتها أولاً إن أجرت الاختبار.
      skinType: kind.contains('ROUTINE') || kind == 'routines' ? profile?.skinType.key : null,
      forceRefresh: forceRefresh,
    );

/// سحب للتحديث في الباقات ودليل البشرة: نسخ جديدة من الشبكة (لا المحفوظة) لما
/// يُعرض — [kinds] أنواع الباقات الظاهرة — ثم إعادة بناء المزوّدات. الفشل يُبقي المعروض.
Future<void> refreshBeautyCatalog(WidgetRef ref, {List<String> kinds = const [], bool concerns = false}) async {
  final api = ref.read(apiServiceProvider);
  final world = ref.read(beautyWorldProvider);
  final profile = ref.read(skinProfileProvider);
  await Future.wait<void>([
    if (concerns) api.getSkinConcerns(world: world, forceRefresh: true).then((_) {}, onError: (_) {}),
    for (final kind in kinds)
      _packages(api, kind, world: world, profile: profile, forceRefresh: true).then((_) {}, onError: (_) {}),
  ]);
  if (concerns) ref.invalidate(skinConcernsListProvider);
  ref.invalidate(beautyPackagesProvider);
}

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

  bool get _signedIn => _ref.read(authProvider).isAuthenticated;

  void save(SkinProfile p) {
    _store(p);
    // نوع البشرة يُحفظ في حسابها أيضاً: يتبعها لجهاز آخر وللموقع وترشيحات «ديما».
    if (_signedIn) _pushSkinType(p.skinType.key);
  }

  void clear() {
    state = null;
    _ref.read(sharedPreferencesProvider).remove(_key);
    if (_signedIn) _pushSkinType('');
  }

  void _store(SkinProfile p) {
    state = p;
    _ref.read(sharedPreferencesProvider).setString(_key, jsonEncode(p.toJson()));
  }

  /// '' يمسح النوع على السيرفر. الفشل صامت: النسخة على الجهاز تكفي الآن، وتُرسل مع
  /// الحفظ التالي.
  void _pushSkinType(String key) {
    unawaited(
      _ref.read(apiServiceProvider).updateAssistantProfile(skinType: key).then((_) {}, onError: (_) {}),
    );
  }

  /// دخلت حسابها: إن لم يكن على الجهاز اختبار نأخذ نوع بشرتها المحفوظ في الحساب،
  /// وإن كان على الجهاز ولم يُحفظ في الحساب بعد نرسله.
  Future<void> syncWithAccount() async {
    try {
      final remote = await _ref.read(apiServiceProvider).getAssistantProfile();
      if (!mounted || !_signedIn) return;
      final local = state;
      final remoteType = skinTypeFromKey(remote.skinType);
      if (local == null && remoteType != null) {
        _store(SkinProfile(skinType: remoteType, takenAt: DateTime.now()));
      } else if (local != null && remoteType == null) {
        _pushSkinType(local.skinType.key);
      }
    } catch (_) {}
  }
}

final skinProfileProvider = StateNotifierProvider<SkinProfileNotifier, SkinProfile?>((ref) {
  final notifier = SkinProfileNotifier(ref);
  ref.listen<String?>(authProvider.select((a) => a.isAuthenticated ? a.user?.id : null), (prev, next) {
    if (next != null && next != prev) notifier.syncWithAccount();
  }, fireImmediately: true);
  return notifier;
});
