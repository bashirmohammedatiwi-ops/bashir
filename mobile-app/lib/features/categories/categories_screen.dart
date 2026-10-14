import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/store_world.dart';
import '../catalog/catalog_providers.dart';
import '../worlds/world_theme.dart';
import '../worlds/worlds_provider.dart';
import 'category_browse.dart';
import 'widgets/category_pane.dart';
import 'widgets/category_rail.dart';
import 'widgets/category_search_results.dart';
import 'widgets/world_lens_bar.dart';

/// صفحة الأقسام — مصممة لكتالوج ضخم:
/// - بحث فوري في الشجرة كاملة (3 مستويات) بالعربي والإنجليزي.
/// - عدسة العوالم: حصر الأقسام في عالم واحد وتلوين التطبيق بأجوائه.
/// - شريط جانبي + لوحة يظهر فيها كل شيء دفعة واحدة (بلا قوائم مطوية):
///   أي قسم دقيق على بُعد نقرتين.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  final _search = TextEditingController();
  final _searchFocus = FocusNode();
  String _query = '';

  /// null = كل الأقسام، وإلا slug العالم.
  String? _lens;
  String? _selectedId;

  @override
  void initState() {
    super.initState();
    _search.addListener(() {
      final q = _search.text;
      if (q != _query) setState(() => _query = q);
    });
    _searchFocus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    HapticFeedback.mediumImpact();
    try {
      await refreshCategories(ref);
    } catch (_) {
      ref.invalidate(categoriesProvider);
    }
    if (_lens != null) ref.invalidate(worldDetailProvider(_lens!));
  }

  void _setLens(String? slug) {
    if (_lens == slug) return;
    HapticFeedback.selectionClick();
    setState(() {
      _lens = slug;
      _selectedId = null;
    });
    // اختيار عالم يلوّن التطبيق كله بأجوائه — فكرة العوالم في قلب التصفح.
    if (slug != null) ref.read(selectedWorldSlugProvider.notifier).state = slug;
  }

  void _select(String id) {
    if (_selectedId == id) return;
    HapticFeedback.selectionClick();
    setState(() => _selectedId = id);
  }

  void _clearSearch() {
    _search.clear();
    _searchFocus.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final s = ref.s;
    final cats = ref.watch(categoriesProvider);
    final worlds =
        ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    final lensWorld = _lens == null
        ? null
        : ref.watch(worldDetailProvider(_lens!)).valueOrNull;
    // حجم الكتالوج للعنوان الفرعي: أقسام رئيسية وفرعية.
    final rootsList = cats.valueOrNull
        ?.where((c) => c.parentId == null || c.parentId!.isEmpty)
        .toList();
    final statIndex = rootsList == null ? null : CategoryIndex.build(rootsList);
    String? stats;
    if (statIndex != null) {
      final roots = statIndex.all
          .where((e) => e.level == CategoryLevel.root)
          .length;
      final subs = statIndex.all.length - roots;
      stats = s.isAr ? '$roots أقسام • $subs فرعياً' : '$roots • $subs sub';
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: t.canvas,
        body: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () => _searchFocus.unfocus(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _Header(
                controller: _search,
                focusNode: _searchFocus,
                query: _query,
                onClear: _clearSearch,
                title: s.catBrowseTitle,
                hint: s.catSearchHint,
              ),
              if (_query.trim().isEmpty && worlds.isNotEmpty)
                WorldLensBar(
                  worlds: worlds,
                  selected: _lens,
                  allLabel: s.catLensAll,
                  allStats: stats,
                  onSelect: _setLens,
                ),
              const SizedBox(height: 8),
              Expanded(
                child: cats.when(
                  skipLoadingOnRefresh: true,
                  loading: () => const _BrowseSkeleton(),
                  error: (e, _) =>
                      ErrorView(message: friendlyError(e), onRetry: _refresh),
                  data: (roots) {
                    final index =
                        statIndex ??
                        CategoryIndex.build(
                          roots
                              .where(
                                (c) =>
                                    c.parentId == null || c.parentId!.isEmpty,
                              )
                              .toList(),
                        );
                    if (_query.trim().isNotEmpty) {
                      return CategorySearchResults(
                        query: _query.trim(),
                        results: index.search(_query),
                      );
                    }
                    final entries = _railEntries(index, lensWorld);
                    if (entries.isEmpty) {
                      if (_lens != null && lensWorld == null)
                        return const _BrowseSkeleton();
                      return EmptyState(
                        icon: Icons.category_outlined,
                        title: s.noCategories,
                      );
                    }
                    final selected = entries.firstWhere(
                      (e) => e.category.id == _selectedId,
                      orElse: () => entries.first,
                    );
                    return _BrowseBody(
                      entries: entries,
                      selected: selected,
                      onSelect: _select,
                      onRefresh: _refresh,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// عناصر الشريط الجانبي: الأقسام الرئيسية، أو أقسام العالم المختار.
  /// أقسام العالم تُطابَق مع الشجرة الكاملة لتأخذ أعدادها وأبناءها الفعّالين.
  List<IndexedCategory> _railEntries(CategoryIndex index, StoreWorld? world) {
    if (_lens == null) {
      return [
        for (final e in index.all)
          if (e.level == CategoryLevel.root) e,
      ];
    }
    if (world == null) return const [];
    final out = <IndexedCategory>[];
    final seen = <String>{};
    for (final c in world.categories) {
      if (!seen.add(c.id)) continue;
      final hit = index.byId[c.id];
      if (hit != null) {
        out.add(hit);
      } else {
        out.add(
          IndexedCategory(
            category: c,
            level: c.listingKind == 'subcategory'
                ? CategoryLevel.sub
                : CategoryLevel.root,
          ),
        );
      }
    }
    if (out.isEmpty) {
      for (final id in world.rootCategoryIds) {
        final hit = index.byId[id];
        if (hit != null) out.add(hit);
      }
    }
    return out;
  }
}

class _Header extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String query;
  final VoidCallback onClear;
  final String title;
  final String hint;

  const _Header({
    required this.controller,
    required this.focusNode,
    required this.query,
    required this.onClear,
    required this.title,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final top = MediaQuery.paddingOf(context).top;
    final pad = Responsive.horizontalPadding(context);
    final active = focusNode.hasFocus || query.isNotEmpty;
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(pad, top + 10, pad, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppText.title1.copyWith(color: t.ink),
                ),
              ),
              Semantics(
                button: true,
                label: 'Scan',
                child: GestureDetector(
                  onTap: () => context.push('/scan'),
                  child: Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: t.accentLight,
                      shape: BoxShape.circle,
                      border: Border.all(color: t.accentSoft),
                    ),
                    child: Icon(
                      Icons.qr_code_scanner_rounded,
                      color: t.accentDark,
                      size: 22,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // نفس حبّة البحث في الرئيسية: رمادية ناعمة، وحدّ بلون العالم عند الكتابة.
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            height: 52,
            decoration: BoxDecoration(
              color: active
                  ? t.surface
                  : Color.alphaBlend(t.ink.withValues(alpha: 0.045), t.surface),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: active
                    ? t.accent.withValues(alpha: 0.55)
                    : Colors.transparent,
                width: 1.4,
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: t.accent.withValues(alpha: 0.12),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              children: [
                const SizedBox(width: 16),
                Icon(Icons.search_rounded, color: t.ink, size: 23),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: controller,
                    focusNode: focusNode,
                    textInputAction: TextInputAction.search,
                    style: AppText.body.copyWith(color: t.ink, height: 1.2),
                    cursorColor: t.accent,
                    decoration: InputDecoration(
                      isCollapsed: true,
                      filled: false,
                      hintText: hint,
                      hintStyle: AppText.bodySmall.copyWith(
                        color: t.inkMuted,
                        fontSize: 14,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                    onSubmitted: (q) {
                      if (q.trim().length >= 2) {
                        context.push(
                          '/search?q=${Uri.encodeComponent(q.trim())}',
                        );
                      }
                    },
                  ),
                ),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 160),
                  child: query.isEmpty
                      ? const SizedBox(width: 12)
                      : IconButton(
                          key: const ValueKey('clear'),
                          onPressed: onClear,
                          icon: Icon(
                            Icons.cancel_rounded,
                            color: t.inkMuted,
                            size: 20,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BrowseBody extends StatelessWidget {
  final List<IndexedCategory> entries;
  final IndexedCategory selected;
  final ValueChanged<String> onSelect;
  final Future<void> Function() onRefresh;

  const _BrowseBody({
    required this.entries,
    required this.selected,
    required this.onSelect,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final railWidth = Responsive.isNarrow(context) ? 86.0 : 96.0;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: railWidth,
          child: CategoryRail(
            entries: entries,
            selectedId: selected.category.id,
            onSelect: onSelect,
          ),
        ),
        Expanded(
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: const BorderRadiusDirectional.only(
                topStart: Radius.circular(AppCorners.xl),
              ).resolve(Directionality.of(context)),
              boxShadow: [
                BoxShadow(
                  color: t.ink.withValues(alpha: 0.05),
                  blurRadius: 18,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: const BorderRadiusDirectional.only(
                topStart: Radius.circular(AppCorners.xl),
              ).resolve(Directionality.of(context)),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 260),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween(
                      begin: const Offset(0, 0.025),
                      end: Offset.zero,
                    ).animate(anim),
                    child: child,
                  ),
                ),
                child: CategoryPane(
                  key: ValueKey(selected.category.id),
                  entry: selected,
                  onRefresh: onRefresh,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _BrowseSkeleton extends StatelessWidget {
  const _BrowseSkeleton();

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: 92,
          child: Column(
            children: [
              for (var i = 0; i < 6; i++)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Column(
                    children: [
                      ShimmerBox(width: 50, height: 50, radius: 25),
                      SizedBox(height: 8),
                      ShimmerBox(width: 54, height: 10),
                    ],
                  ),
                ),
            ],
          ),
        ),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: const BorderRadiusDirectional.only(
                topStart: Radius.circular(AppCorners.xl),
              ).resolve(Directionality.of(context)),
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const ShimmerBox(height: 118, radius: AppCorners.lg),
                const SizedBox(height: 22),
                const ShimmerBox(width: 120, height: 14),
                const SizedBox(height: 14),
                for (var r = 0; r < 2; r++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Row(
                      children: [
                        for (var c = 0; c < 3; c++) ...[
                          if (c > 0) const SizedBox(width: 10),
                          const Expanded(
                            child: ShimmerBox(
                              height: 86,
                              radius: AppCorners.md,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
