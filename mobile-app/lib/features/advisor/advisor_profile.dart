import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/utils/json.dart';

/// خيار في الملف الجمالي: المعرّف الذي تفهمه «ديما» + اسمه بالعربي والإنجليزي ورمزه.
class ProfileOption {
  final String id;
  final String ar;
  final String emoji;
  final String en;
  const ProfileOption(this.id, this.ar, this.emoji, this.en);

  String label(bool isAr) => isAr ? ar : en;
}

abstract final class ProfileOptions {
  static const skinTypes = [
    ProfileOption('oily', 'دهنية', '💦', 'Oily'),
    ProfileOption('dry', 'جافة', '🏜️', 'Dry'),
    ProfileOption('combination', 'مختلطة', '☯️', 'Combination'),
    ProfileOption('normal', 'عادية', '😊', 'Normal'),
    ProfileOption('sensitive', 'حساسة', '🌷', 'Sensitive'),
  ];
  static const skinConcerns = [
    ProfileOption('acne', 'حب الشباب', '🔴', 'Acne'),
    ProfileOption('pigment', 'التصبغات', '✨', 'Pigmentation'),
    ProfileOption('aging', 'التجاعيد', '⏳', 'Wrinkles'),
    ProfileOption('pores', 'المسام', '🔍', 'Pores'),
    ProfileOption('oily', 'الدهون واللمعان', '🫧', 'Oil & shine'),
    ProfileOption('dark_circles', 'الهالات', '👁️', 'Dark circles'),
    ProfileOption('dull', 'البهتان', '🌫️', 'Dullness'),
    ProfileOption('dryness', 'الجفاف', '💧', 'Dryness'),
    ProfileOption('sensitive', 'الاحمرار', '🌡️', 'Redness'),
  ];
  static const hairConcerns = [
    ProfileOption('hairloss', 'التساقط', '🍃', 'Hair loss'),
    ProfileOption('dandruff', 'القشرة', '❄️', 'Dandruff'),
    ProfileOption('frizz', 'الهيشان', '🌀', 'Frizz'),
    ProfileOption('damaged', 'التلف', '🩹', 'Damage'),
    ProfileOption('dry_hair', 'الجفاف', '🌾', 'Dryness'),
    ProfileOption('colored', 'مصبوغ', '🎨', 'Colour-treated'),
    ProfileOption('oily_scalp', 'فروة دهنية', '💧', 'Oily scalp'),
  ];
  static const families = [
    ProfileOption('woody', 'خشبي', '🪵', 'Woody'),
    ProfileOption('floral', 'زهري', '🌹', 'Floral'),
    ProfileOption('oriental', 'شرقي', '🕌', 'Oriental'),
    ProfileOption('oud', 'عود', '🏺', 'Oud'),
    ProfileOption('musk', 'مسك', '🤍', 'Musk'),
    ProfileOption('vanilla', 'فانيلا', '🍦', 'Vanilla'),
    ProfileOption('sweet', 'حلو', '🍬', 'Sweet'),
    ProfileOption('fresh', 'منعش', '🍋', 'Fresh'),
    ProfileOption('fruity', 'فواكه', '🍓', 'Fruity'),
    ProfileOption('coffee', 'قهوة', '☕', 'Coffee'),
  ];
  static const genders = [
    ProfileOption('women', 'نسائية', '👩', 'Feminine'),
    ProfileOption('unisex', 'للجنسين', '🤝', 'Unisex'),
  ];

  /// حدود ما تعتمده «ديما» من كل مجموعة (مطابقة لما يقصّه السيرفر).
  static const maxConcerns = 4;
  static const maxHairConcerns = 4;
  static const maxFamilies = 5;

  static String? label(List<ProfileOption> list, String? id, {bool isAr = true}) {
    for (final o in list) {
      if (o.id == id) return o.label(isAr);
    }
    return null;
  }
}

/// ملف «ديما» الجمالي — يُحفظ على جهازها فقط ويُرسل مع كل سؤال.
class AdvisorProfile {
  final String? skinType;
  final List<String> concerns;
  final List<String> hairConcerns;
  final List<String> families;
  final String? gender;

  const AdvisorProfile({
    this.skinType,
    this.concerns = const [],
    this.hairConcerns = const [],
    this.families = const [],
    this.gender,
  });

  bool get isEmpty => skinType == null && concerns.isEmpty && hairConcerns.isEmpty && families.isEmpty && gender == null;

  AdvisorProfile copyWith({
    String? skinType,
    List<String>? concerns,
    List<String>? hairConcerns,
    List<String>? families,
    String? gender,
    bool clearSkin = false,
    bool clearGender = false,
  }) =>
      AdvisorProfile(
        skinType: clearSkin ? null : (skinType ?? this.skinType),
        concerns: concerns ?? this.concerns,
        hairConcerns: hairConcerns ?? this.hairConcerns,
        families: families ?? this.families,
        gender: clearGender ? null : (gender ?? this.gender),
      );

  Map<String, dynamic> toJson() => {
        if (skinType != null) 'skinType': skinType,
        if (concerns.isNotEmpty) 'concerns': concerns,
        if (hairConcerns.isNotEmpty) 'hairConcerns': hairConcerns,
        if (families.isNotEmpty) 'families': families,
        if (gender != null) 'gender': gender,
      };

  factory AdvisorProfile.fromJson(Map<String, dynamic> j) => AdvisorProfile(
        skinType: j['skinType']?.toString(),
        concerns: asStringList(j['concerns']),
        hairConcerns: asStringList(j['hairConcerns']),
        families: asStringList(j['families']),
        gender: j['gender']?.toString(),
      );

  /// يدمج ما تعلّمته «ديما» من المحادثة ويعيد وصفاً قصيراً لما حُفظ.
  (AdvisorProfile, String?) merge(Map<String, dynamic> u) {
    final notes = <String>[];
    var next = this;
    final st = u['skinType']?.toString();
    if (st != null && st != skinType) {
      next = next.copyWith(skinType: st);
      final l = ProfileOptions.label(ProfileOptions.skinTypes, st);
      if (l != null) notes.add('بشرتكِ $l');
    }
    List<String>? list(String k) => u[k] is List ? asStringList(u[k]) : null;
    // ما تعلّمته يُضاف لما اختارته بنفسها — لا يحلّ محله (السيرفر يرسل قائمة مقصوصة).
    List<String> union(List<String> learned, List<String> mine) => [...learned, ...mine.where((x) => !learned.contains(x))];
    final c = list('concerns');
    if (c != null) {
      next = next.copyWith(concerns: union(c, concerns));
      final added = c.where((x) => !concerns.contains(x)).map((x) => ProfileOptions.label(ProfileOptions.skinConcerns, x)).whereType<String>();
      if (added.isNotEmpty) notes.add('تهتمين بـ${added.join(' و')}');
    }
    final h = list('hairConcerns');
    if (h != null) {
      next = next.copyWith(hairConcerns: union(h, hairConcerns));
      final added = h.where((x) => !hairConcerns.contains(x)).map((x) => ProfileOptions.label(ProfileOptions.hairConcerns, x)).whereType<String>();
      if (added.isNotEmpty) notes.add('شعركِ: ${added.join(' و')}');
    }
    final f = list('families');
    if (f != null) {
      next = next.copyWith(families: union(f, families));
      final added = f.where((x) => !families.contains(x)).map((x) => ProfileOptions.label(ProfileOptions.families, x)).whereType<String>();
      if (added.isNotEmpty) notes.add('تحبين ${added.join(' و')}');
    }
    final g = u['gender']?.toString();
    if (g != null && g != gender) next = next.copyWith(gender: g);
    return (next, notes.isEmpty ? null : notes.join('، '));
  }

  /// سطر يلخص ما تتذكره «ديما» (للترحيب).
  String summary() {
    final skin = ProfileOptions.label(ProfileOptions.skinTypes, skinType);
    final loved = families.map((f) => ProfileOptions.label(ProfileOptions.families, f)).whereType<String>().take(2);
    final parts = <String>[
      if (skin != null) 'بشرة $skin',
      ...concerns.map((c) => ProfileOptions.label(ProfileOptions.skinConcerns, c)).whereType<String>().take(2),
      if (loved.isNotEmpty) 'تحبين ${loved.join(' و')}',
    ];
    return parts.join(' • ');
  }
}

class AdvisorProfileNotifier extends StateNotifier<AdvisorProfile> {
  AdvisorProfileNotifier() : super(const AdvisorProfile()) {
    _load();
  }

  static const _key = 'advisor_profile_v1';

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw != null) state = AdvisorProfile.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
    } catch (_) {}
  }

  Future<void> _save() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (state.isEmpty) {
        await prefs.remove(_key);
      } else {
        await prefs.setString(_key, jsonEncode(state.toJson()));
      }
    } catch (_) {}
  }

  void set(AdvisorProfile p) {
    state = p;
    _save();
  }

  /// يعيد وصف ما حُفظ (لإشعار «حفظت في ملفكِ…») أو null.
  String? learn(Map<String, dynamic> update) {
    final (next, note) = state.merge(update);
    state = next;
    _save();
    return note;
  }

  void clear() => set(const AdvisorProfile());
}

final advisorProfileProvider = StateNotifierProvider<AdvisorProfileNotifier, AdvisorProfile>(
  (ref) => AdvisorProfileNotifier(),
);
