import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ui/ui.dart';
import '../worlds/world_theme.dart';
import 'category_browse.dart';

/// قسم فُتح مؤخراً — يُحفظ بمعرّفه ومستواه، والعنوان والمسار يُقرآن من الشجرة
/// عند العرض فيتبعان لغة الواجهة. [title] و[location] لقطة احتياطية فقط
/// (قبل وصول الشجرة، أو سجلات النسخة القديمة {t, l}).
class RecentCategory {
  final String id;
  final CategoryLevel level;
  final String title;
  final String location;

  const RecentCategory({
    required this.id,
    required this.level,
    required this.title,
    required this.location,
  });

  static RecentCategory? fromTarget(CategoryTarget target) {
    final id = target.leafId;
    if (id == null || id.isEmpty) return null;
    return RecentCategory(
      id: id,
      level: target.level,
      title: target.title,
      location: target.location,
    );
  }

  Map<String, String> toJson() => {
    'id': id,
    'lv': level.name,
    't': title,
    'l': location,
  };

  static RecentCategory? fromJson(Object? raw) {
    if (raw is! Map) return null;
    final t = raw['t'], l = raw['l'];
    final title = t is String ? t : '';
    final location = l is String ? l : '';
    var id = raw['id'] is String ? raw['id'] as String : '';
    var level = CategoryLevel.values.asNameMap()[raw['lv']];
    // سجل قديم {t, l}: المعرّف والمستوى من معاملات المسار نفسه.
    if (id.isEmpty && location.isNotEmpty) {
      final q = Uri.tryParse(location)?.queryParameters ?? const {};
      if (q['tertiaryCategoryId']?.isNotEmpty ?? false) {
        id = q['tertiaryCategoryId']!;
        level = CategoryLevel.tertiary;
      } else if (q['subcategoryId']?.isNotEmpty ?? false) {
        id = q['subcategoryId']!;
        level = CategoryLevel.sub;
      } else if (q['categoryId']?.isNotEmpty ?? false) {
        id = q['categoryId']!;
        level = CategoryLevel.root;
      }
    }
    if (id.isEmpty) return null;
    return RecentCategory(
      id: id,
      level: level ?? CategoryLevel.root,
      title: title,
      location: location,
    );
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
      // دمج لا استبدال (وبلا تكرار بالمعرّف): ما أُضيف أثناء القراءة يبقى في المقدمة.
      final seen = {for (final e in state) e.id};
      state = [...state, ...saved.where((e) => seen.add(e.id))].take(_max).toList();
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
      ...state.where((e) => e.id != item.id),
    ].take(_max).toList();
    await _persist();
  }

  Future<void> clear() async {
    await _ready;
    if (!mounted) return;
    state = const [];
    await _persist();
  }

  /// «تراجع» بعد المسح: تعود القائمة كما كانت (مع ما فُتح بعد المسح في المقدمة).
  Future<void> restore(List<RecentCategory> items) async {
    await _ready;
    if (!mounted) return;
    final seen = {for (final e in state) e.id};
    state = [...state, ...items.where((e) => seen.add(e.id))].take(_max).toList();
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
    final saved = ref.watch(recentCategoriesProvider);
    if (saved.isEmpty) return const SizedBox.shrink();
    final index = ref.watch(categoryIndexProvider);
    final lang = ref.watch(languageCodeProvider);
    // العنوان والمسار من الشجرة الحالية بلغة الواجهة؛ قسم حُذف من المتجر لا يظهر.
    final items = <(RecentCategory, CategoryTarget?)>[
      for (final e in saved)
        if (index == null)
          (e, null)
        else if (index.byId[e.id] case final hit?)
          (e, hit.target(lang)),
    ];
    if (items.isEmpty) return const SizedBox.shrink();
    final t = context.worldTheme;
    final s = ref.s;
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(14, 0, 4, 0),
            child: Row(
              children: [
                Icon(Icons.history_rounded, size: 16, color: t.inkMuted),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    s.recentlyVisited,
                    style: AppText.caption.copyWith(
                      color: t.inkSoft,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => _clear(context, ref, saved),
                  style: TextButton.styleFrom(
                    foregroundColor: t.accentDark,
                    minimumSize: const Size(kMinTapTarget, kMinTapTarget),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                  ),
                  child: Text(
                    s.clearAction,
                    style: AppText.caption.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final (item, target) = items[i];
                final title = target?.title ?? item.title;
                return Semantics(
                  button: true,
                  label: title,
                  excludeSemantics: true,
                  child: Material(
                    color: t.accentLight,
                    shape: StadiumBorder(side: BorderSide(color: t.accentSoft)),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        if (target != null) {
                          // يفتح عبر الوجهة نفسها: يُسجَّل في المقدمة ثم يُدفع.
                          target.open(context);
                        } else {
                          HapticFeedback.selectionClick();
                          ref.read(recentCategoriesProvider.notifier).add(item);
                          context.push(item.location);
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 13),
                        child: Center(
                          widthFactor: 1,
                          child: Text(
                            title,
                            maxLines: 1,
                            style: AppText.label.copyWith(
                              fontSize: 12.5,
                              color: t.accentDark,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
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

  /// المسح بلا رجعة كان سهل الوقوع خطأً — الآن مع «تراجع».
  void _clear(BuildContext context, WidgetRef ref, List<RecentCategory> previous) {
    HapticFeedback.selectionClick();
    final notifier = ref.read(recentCategoriesProvider.notifier);
    final s = ref.read(stringsProvider);
    unawaited(notifier.clear());
    AppSnackbar.action(
      context,
      message: s.itemRemoved(s.recentlyVisited),
      actionLabel: s.undo,
      onAction: () => unawaited(notifier.restore(previous)),
    );
  }
}
