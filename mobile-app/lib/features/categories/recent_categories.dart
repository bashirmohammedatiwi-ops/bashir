import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/ui/ui.dart';
import '../worlds/world_theme.dart';

/// قسم فُتح مؤخراً — يكفي العنوان والمسار للعودة إليه بلمسة.
class RecentCategory {
  final String title;
  final String location;
  const RecentCategory({required this.title, required this.location});

  Map<String, String> toJson() => {'t': title, 'l': location};

  static RecentCategory? fromJson(Object? raw) {
    if (raw is! Map) return null;
    final t = raw['t'], l = raw['l'];
    if (t is! String || l is! String || t.isEmpty || l.isEmpty) return null;
    return RecentCategory(title: t, location: l);
  }
}

/// آخر الأقسام التي فتحتها المستخدمة — الأحدث أولاً، بلا تكرار، محفوظة على الجهاز.
class RecentCategoriesNotifier extends StateNotifier<List<RecentCategory>> {
  RecentCategoriesNotifier() : super(const []) {
    unawaited(_ready);
  }

  static const _key = 'recent_categories_v1';
  static const _max = 8;

  /// كل تعديل ينتظر انتهاء القراءة الأولى — فتح قسم قبل اكتمالها لا يمسح القائمة المحفوظة.
  late final Future<void> _ready = _load();

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || !mounted) return;
      final saved = (jsonDecode(raw) as List)
          .map(RecentCategory.fromJson)
          .whereType<RecentCategory>()
          .toList();
      // دمج لا استبدال: ما أُضيف أثناء القراءة يبقى في المقدمة.
      final seen = {for (final e in state) e.location};
      state = [...state, ...saved.where((e) => seen.add(e.location))].take(_max).toList();
    } catch (_) {}
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _key,
        jsonEncode(state.map((e) => e.toJson()).toList()),
      );
    } catch (_) {}
  }

  Future<void> add(RecentCategory item) async {
    await _ready;
    if (!mounted) return;
    state = [
      item,
      ...state.where((e) => e.location != item.location),
    ].take(_max).toList();
    await _persist();
  }

  Future<void> clear() async {
    await _ready;
    if (!mounted) return;
    state = const [];
    await _persist();
  }
}

final recentCategoriesProvider =
    StateNotifierProvider<RecentCategoriesNotifier, List<RecentCategory>>(
      (ref) => RecentCategoriesNotifier(),
    );

/// "زرتِها مؤخراً": آخر الأقسام المفتوحة كحبّات صغيرة في أعلى لوحة الأقسام.
/// لا يظهر شيئاً إن لم تكن هناك أقسام مزارة.
class RecentCategoriesStrip extends ConsumerWidget {
  const RecentCategoriesStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(recentCategoriesProvider);
    if (items.isEmpty) return const SizedBox.shrink();
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              children: [
                Icon(Icons.history_rounded, size: 16, color: t.inkMuted),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    ar ? 'زرتِها مؤخراً' : 'Recently visited',
                    style: AppText.caption.copyWith(
                      color: t.inkSoft,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    ref.read(recentCategoriesProvider.notifier).clear();
                  },
                  child: Text(
                    ar ? 'مسح' : 'Clear',
                    style: AppText.caption.copyWith(
                      color: t.accentDark,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 34,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final it = items[i];
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    context.push(it.location);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 13),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: t.accentLight,
                      borderRadius: BorderRadius.circular(AppCorners.pill),
                      border: Border.all(color: t.accentSoft),
                    ),
                    child: Text(
                      it.title,
                      maxLines: 1,
                      style: AppText.label.copyWith(
                        fontSize: 12.5,
                        color: t.accentDark,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
