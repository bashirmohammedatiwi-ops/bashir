import 'package:flutter/foundation.dart' show ValueListenable;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/widgets/ui/ui.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../home/home_category_filter.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import 'brand_avatar.dart';
import 'brand_search.dart';

/// طلب قسم جاهز لدليل البراندات — «كل البراندات» في لوحة قسم تضبطه قبل فتح
/// التبويب، والشاشة تختار شريحة القسم ثم تعيده null.
final brandsCategoryRequestProvider = StateProvider<String?>((_) => null);

class BrandsScreen extends ConsumerStatefulWidget {
  /// داخل تبويب الشريط السفلي: بلا زر رجوع.
  final bool embedded;
  /// بحث جاهز عند الفتح (/brands?q=…).
  final String? initialQuery;

  const BrandsScreen({super.key, this.embedded = false, this.initialQuery});

  @override
  ConsumerState<BrandsScreen> createState() => _BrandsScreenState();
}

/// مجموعة حرف في الفهرس الأبجدي.
class _LetterGroup {
  final String letter;
  final List<Brand> brands;
  const _LetterGroup(this.letter, this.brands);
}

/// يُظهر عنصراً داخل شريط أفقي بتحريك الشريط وحده — Scrollable.ensureVisible
/// كان سيحرّك الصفحة العمودية أيضاً لأن الشريط داخل رأس مثبّت.
void _revealInRow(BuildContext context, GlobalKey? key, ScrollController row) {
  final box = key?.currentContext?.findRenderObject();
  if (box is! RenderBox || !box.attached || !row.hasClients) return;
  final pos = row.position;
  final target = RenderAbstractViewport.of(box)
      .getOffsetToReveal(box, 0.5)
      .offset
      .clamp(pos.minScrollExtent, pos.maxScrollExtent);
  _scrollRowTo(context, row, target);
}

void _scrollRowTo(BuildContext context, ScrollController row, double target) {
  if ((target - row.offset).abs() < 1) return;
  if (MediaQuery.disableAnimationsOf(context)) {
    row.jumpTo(target);
  } else {
    row.animateTo(target, duration: const Duration(milliseconds: 220), curve: Curves.easeOutCubic);
  }
}

class _BrandsScreenState extends ConsumerState<BrandsScreen> {
  String _query = '';
  final _searchCtrl = TextEditingController();
  // الحقل يعيش داخل الرأس المثبّت ويملك المؤشر طوال الكتابة — لا يُعاد إنشاؤه.
  final _searchFocus = FocusNode();
  // فهرس البحث يُبنى مرة لكل قائمة براندات.
  BrandSearchIndex? _index;
  List<Brand>? _indexed;

  String? _selectedCategoryId;
  final _scroll = ScrollController();
  final _chipsScroll = ScrollController();
  final _lettersScroll = ScrollController();
  final _titleKey = GlobalKey();

  /// مفتاح لكل حبّة قسم ('' = الكل) — لإبقاء المختارة ظاهرة.
  final _chipKeys = <String, GlobalKey>{};

  /// مفاتيح عناوين الحروف (على الـ sliver نفسه) — موضع كل حرف يُقرأ من التخطيط مباشرة.
  final _letterKeys = <String, GlobalKey>{};

  /// الحرف الحالي في شريط الفهرس — يتغيّر مع التمرير دون إعادة بناء الصفحة.
  final _activeLetter = ValueNotifier<String?>(null);
  List<String> _letters = const [];
  double _pinnedExtent = 0;
  bool _jumping = false;

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3,
    childAspectRatio: 0.72,
    crossAxisSpacing: 10,
    mainAxisSpacing: 12,
  );

  @override
  void initState() {
    super.initState();
    final q = widget.initialQuery?.trim() ?? '';
    if (q.isNotEmpty) {
      _searchCtrl.text = q;
      _query = q;
    }
    _scroll.addListener(_trackLetter);
    // التبويب يُبنى أول مرة عند فتحه: طلب «/brands?q=…» أو قسم من لوحة الأقسام يكون
    // قد ضُبط قبل ظهوره فلا يصله ref.listen — نطبّقه هنا مرة.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _applySearchRequest(ref.read(brandsSearchRequestProvider));
      _applyCategoryRequest(ref.read(brandsCategoryRequestProvider));
    });
  }

  @override
  void dispose() {
    _scroll.removeListener(_trackLetter);
    _scroll.dispose();
    _chipsScroll.dispose();
    _lettersScroll.dispose();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    _activeLetter.dispose();
    super.dispose();
  }

  /// يطبّق بحثاً جاهزاً (من رابط) ثم يعيده null حتى لا يتكرر.
  void _applySearchRequest(String? q) {
    if (q == null) return;
    ref.read(brandsSearchRequestProvider.notifier).state = null;
    _setQuery(q);
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  /// «كل البراندات» من لوحة قسم: نختار شريحته ونبدأ من أعلى الدليل.
  void _applyCategoryRequest(String? id) {
    if (id == null) return;
    ref.read(brandsCategoryRequestProvider.notifier).state = null;
    _selectCategory(id, haptic: false);
  }

  /// لمسة ثانية على تبويب البراندات: تمسح البحث وتصعد لأعلى الدليل.
  void _onReselect() {
    if (_query.isNotEmpty) _setQuery('');
    _searchFocus.unfocus();
    if (!_scroll.hasClients) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _scroll.jumpTo(0);
    } else {
      _scroll.animateTo(0, duration: const Duration(milliseconds: 380), curve: Curves.easeOutCubic);
    }
  }

  BrandSearchIndex _indexFor(List<Brand> list) {
    if (!identical(list, _indexed)) {
      _indexed = list;
      _index = BrandSearchIndex(list);
    }
    return _index!;
  }

  void _setQuery(String v) {
    _searchCtrl.value = TextEditingValue(text: v, selection: TextSelection.collapsed(offset: v.length));
    _onQueryChanged(v);
  }

  void _onQueryChanged(String raw) {
    final q = raw.trim();
    if (q == _query) return;
    setState(() => _query = q);
    _activeLetter.value = null;
    // النتائج تبدأ تحت الشريط المثبّت مباشرة — بلا قفز للحقل تحت الإصبع.
    final top = _titleExtent;
    if (_scroll.hasClients && _scroll.offset > top) _scroll.jumpTo(top);
  }

  /// ارتفاع سطر العنوان فوق الشريط المثبّت.
  double get _titleExtent {
    final ro = _titleKey.currentContext?.findRenderObject();
    return ro is RenderSliver ? ro.geometry?.scrollExtent ?? 0 : 0;
  }

  /// بداية عنوان الحرف في إحداثيات التمرير. كل الـ slivers تُخطَّط دائماً، وأطوال
  /// الشبكات محسوبة بدقة من عدد الأعمدة — فلا حاجة لبناء الدليل كله مسبقاً.
  double? _letterOffset(String letter) {
    final ro = _letterKeys[letter]?.currentContext?.findRenderObject();
    if (ro is! RenderSliver || ro.geometry == null) return null;
    return ro.constraints.precedingScrollExtent;
  }

  /// الحرف النشط: آخر عنوان بلغ أسفل الشريط المثبّت.
  void _trackLetter() {
    if (_jumping || _letters.isEmpty || !_scroll.hasClients) return;
    final pos = _scroll.position;
    String? current;
    if (pos.pixels >= pos.maxScrollExtent - 1 && pos.maxScrollExtent > 0) {
      // آخر الحروف قد لا تبلغ أعلى الشاشة: الأخير الظاهر هو النشط.
      final bottom = pos.pixels + pos.viewportDimension - 48;
      for (final l in _letters) {
        final o = _letterOffset(l);
        if (o != null && o <= bottom) current = l;
      }
    } else {
      final line = pos.pixels + _pinnedExtent + 1;
      for (final l in _letters) {
        final o = _letterOffset(l);
        if (o == null) continue;
        if (o > line) break;
        current = l;
      }
    }
    _setActiveLetter(current);
  }

  void _setActiveLetter(String? letter) {
    if (_activeLetter.value == letter) return;
    _activeLetter.value = letter;
    if (letter != null) _revealLetterPill(letter);
  }

  /// حبّات الحروف بعرض ثابت — موضع الحبّة النشطة يُحسب مباشرة.
  void _revealLetterPill(String letter) {
    final i = _letters.indexOf(letter);
    if (i < 0 || !_lettersScroll.hasClients) return;
    final pos = _lettersScroll.position;
    final center = _LetterBar.padding + i * (_LetterBar.pill + _LetterBar.gap) + _LetterBar.pill / 2;
    _scrollRowTo(context, _lettersScroll, (center - pos.viewportDimension / 2).clamp(0.0, pos.maxScrollExtent));
  }

  void _jumpTo(String letter) {
    final o = _letterOffset(letter);
    if (o == null || !_scroll.hasClients) return;
    HapticFeedback.selectionClick();
    _setActiveLetter(letter);
    // عنوان الحرف يستقر تحت الشريط المثبّت تماماً لا تحته.
    final target = (o - _pinnedExtent).clamp(0.0, _scroll.position.maxScrollExtent);
    _jumping = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _scroll.jumpTo(target);
      _jumping = false;
      return;
    }
    _scroll
        .animateTo(target, duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic)
        .whenComplete(() => _jumping = false);
  }

  /// الحرف الأول موحّداً: بلا علامات (É → E)، أ/إ/آ → ا، اللاتيني كبير، وغير ذلك "#".
  static String _letterOf(String name) {
    final n = foldText(name);
    if (n.isEmpty) return '#';
    final c = n.characters.first.toUpperCase();
    final code = c.codeUnitAt(0);
    final latin = code >= 65 && code <= 90;
    final arabic = code >= 0x0621 && code <= 0x064A;
    return latin || arabic ? c : '#';
  }

  /// مفتاح ترتيب عربي: الهمزات تُعامل كألف حتى لا تنفصل «أ/إ/آ» عن «ا».
  static String _sortKey(String s) => s
      .trim()
      .toLowerCase()
      .replaceAll(RegExp('[أإآٱ]'), 'ا')
      .replaceAll('ة', 'ه')
      .replaceAll('ى', 'ي');

  /// فهرس واحد A–Z بالاسم اللاتيني للبراند (هويته المكتوبة على الشعار) —
  /// أغلب البراندات أسماؤها لاتينية فقط، فالفهرس المزدوج كان يقسم القائمة نصفين.
  /// البراند العربي فقط يُجمع تحت حرفه العربي بعد اللاتيني.
  List<_LetterGroup> _group(List<Brand> brands) {
    final map = <String, List<Brand>>{};
    for (final b in brands) {
      map.putIfAbsent(_letterOf(b.label), () => []).add(b);
    }
    bool isArabic(String l) =>
        l.codeUnitAt(0) >= 0x0621 && l.codeUnitAt(0) <= 0x064A;
    final letters = map.keys.toList()
      ..sort((a, b) {
        if (a == '#') return 1;
        if (b == '#') return -1;
        final aa = isArabic(a), bb = isArabic(b);
        if (aa != bb) return aa ? 1 : -1;
        return _sortKey(a).compareTo(_sortKey(b));
      });
    return [
      for (final l in letters)
        _LetterGroup(
          l,
          map[l]!..sort(
            (a, b) => _sortKey(a.label).compareTo(_sortKey(b.label)),
          ),
        ),
    ];
  }

  void _selectCategory(String? id, {bool haptic = true}) {
    final searching = _query.isNotEmpty;
    if (_selectedCategoryId == id && !searching) return;
    if (haptic) HapticFeedback.selectionClick();
    // لمس قسم أثناء البحث يعني «تصفّحي هذا القسم»: نمسح البحث أولاً.
    if (searching) {
      _searchCtrl.clear();
      _searchFocus.unfocus();
    }
    setState(() {
      _query = '';
      _selectedCategoryId = id;
    });
    // قائمة جديدة تبدأ من أولها (والبراندات المميزة) لا من موضع القائمة السابقة.
    _activeLetter.value = null;
    if (_scroll.hasClients && _scroll.offset > 0) _scroll.jumpTo(0);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _revealInRow(context, _chipKeys[id ?? ''], _chipsScroll);
    });
  }

  /// سحب للتحديث: تنزيل فعلي من الشبكة (لا نسخة الدقائق الخمس المحفوظة) ثم انتظار النتيجة.
  Future<void> _refresh() async {
    final api = ref.read(apiServiceProvider);
    final cat = _selectedCategoryId;
    try {
      await Future.wait([
        api.getBrands(all: true, forceRefresh: true),
        if (cat != null) api.getBrands(categoryId: cat, forceRefresh: true),
      ]);
    } catch (_) {}
    ref.invalidate(brandsProvider);
    if (cat != null) ref.invalidate(categoryBrandsProvider(cat));
    try {
      await ref.read(brandsProvider.future);
      if (cat != null) await ref.read(categoryBrandsProvider(cat).future);
    } catch (_) {}
  }

  /// صفحة البراند (/brand/:slug) — الـ id بديلاً حين لا slug له.
  void _openBrand(Brand brand) {
    HapticFeedback.selectionClick();
    final key = brand.slug.isNotEmpty ? brand.slug : brand.id;
    // القسم يقيّد البراند فقط حين تتصفّح الدليل — نتائج البحث من كل البراندات.
    final scope = _query.isEmpty ? _selectedCategoryId : null;
    final query = scope == null ? '' : '?categoryId=${Uri.encodeQueryComponent(scope)}';
    context.push('/brand/${Uri.encodeComponent(key)}$query');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    ref.listen<String?>(brandsSearchRequestProvider, (_, q) => _applySearchRequest(q));
    ref.listen<String?>(brandsCategoryRequestProvider, (_, id) => _applyCategoryRequest(id));
    if (widget.embedded) {
      ref.listen<({int tab, int tick})>(tabReselectProvider, (_, r) {
        if (r.tab == NavTabs.brands) _onReselect();
      });
    }
    final cats = ref.watch(categoriesProvider).valueOrNull;
    final parents = cats == null
        ? const <Category>[]
        : storefrontParentCategories(cats);
    final allBrands = ref.watch(brandsProvider).valueOrNull;
    // البحث في كل البراندات دائماً — فلا يبقى القسم المختار يقيّد النتائج بصمت.
    final searching = _query.isNotEmpty;
    final scope = searching ? null : _selectedCategoryId;
    final brandsAsync = scope == null
        ? ref.watch(brandsProvider)
        : ref.watch(categoryBrandsProvider(scope));

    var letters = const <String>[];
    final content = <Widget>[];
    brandsAsync.when(
      loading: () => content.add(
        const SliverToBoxAdapter(
          child: SizedBox(height: 520, child: _BrandsGridLoading()),
        ),
      ),
      error: (e, _) => content.add(
        SliverFillRemaining(
          hasScrollBody: false,
          child: ErrorView.from(e, onRetry: _refresh, loading: brandsAsync.isLoading),
        ),
      ),
      data: (list) {
        if (searching) {
          _addSearchResults(content, list, s, t);
          return;
        }
        if (list.isEmpty) {
          content.add(
            SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(icon: Icons.storefront_outlined, title: s.noBrands),
            ),
          );
          return;
        }
        final featured = _selectedCategoryId == null
            ? (list.where((b) => b.isFeatured).toList()
                ..sort((a, b) => b.productCount.compareTo(a.productCount)))
            : const <Brand>[];
        final groups = _group(list);
        if (groups.length > 3) letters = [for (final g in groups) g.letter];
        if (featured.isNotEmpty) {
          content
            ..add(
              SliverToBoxAdapter(
                child: AppSectionTitle(
                  title: s.featuredBrands,
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 18, 16, 12),
                ),
              ),
            )
            ..add(
              SliverToBoxAdapter(
                child: _FeaturedBrands(
                  brands: featured.take(10).toList(),
                  productsLabel: s.productsN,
                  onTap: _openBrand,
                ),
              ),
            );
        }
        for (final g in groups) {
          content
            ..add(
              SliverToBoxAdapter(
                key: _letterKeys.putIfAbsent(g.letter, GlobalKey.new),
                child: _LetterHeader(letter: g.letter, count: g.brands.length),
              ),
            )
            ..add(
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                sliver: _grid(g.brands, s),
              ),
            );
        }
      },
    );
    _letters = letters;

    final bar = _BrandsBarDelegate(
      theme: t,
      chips: parents.isEmpty
          ? null
          : _CategoryChips(
              key: const ValueKey('brands-cats'),
              categories: parents,
              selectedId: _selectedCategoryId,
              allLabel: s.all,
              lang: lang,
              dimmed: searching,
              controller: _chipsScroll,
              keyFor: (id) => _chipKeys.putIfAbsent(id ?? '', GlobalKey.new),
              onSelect: _selectCategory,
            ),
      search: _SearchField(
        key: const ValueKey('brands-search'),
        hint: allBrands == null
            ? s.searchBrandsHint
            : s.searchAmongBrands(allBrands.length),
        controller: _searchCtrl,
        focusNode: _searchFocus,
        onChanged: _onQueryChanged,
        onClear: () => _setQuery(''),
      ),
      letters: letters.isEmpty
          ? null
          : _LetterBar(
              key: const ValueKey('brands-letters'),
              letters: letters,
              active: _activeLetter,
              controller: _lettersScroll,
              onTap: _jumpTo,
            ),
    );
    _pinnedExtent = bar.maxExtent;

    return Scaffold(
      backgroundColor: t.canvas,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: t.accent,
          onRefresh: _refresh,
          child: CustomScrollView(
            controller: _scroll,
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                key: _titleKey,
                child: _TitleRow(
                  title: s.brands,
                  subtitle: allBrands == null || allBrands.isEmpty
                      ? s.brandsPageSubtitle
                      : s.brandsCount(allBrands.length),
                  showBack: !widget.embedded,
                ),
              ),
              // شريط واحد ثابت: الأقسام + البحث + الحروف — في متناول اليد من أي موضع.
              SliverPersistentHeader(
                key: const ValueKey('brands-bar'),
                pinned: true,
                delegate: bar,
              ),
              ...content,
              SliverToBoxAdapter(
                child: SizedBox(height: widget.embedded ? 24 : 32),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _addSearchResults(List<Widget> content, List<Brand> list, AppStrings s, WorldThemePalette t) {
    final index = _indexFor(list);
    final results = index.search(_query);
    if (results.isEmpty) {
      final suggestions = index.suggest(_query);
      content.add(
        SliverFillRemaining(
          hasScrollBody: false,
          child: Column(
            children: [
              EmptyState(
                icon: Icons.storefront_outlined,
                title: s.brandNoMatch,
                subtitle: s.brandTryLatin,
              ),
              // ربما كتبت اسم منتج لا براند («سيروم»): بحث المنتجات بلمسة.
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 18),
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/search?q=${Uri.encodeComponent(_query)}'),
                  icon: const Icon(Icons.search_rounded, size: 18),
                  label: Text(s.searchProductsFor(_query)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: t.accentDark,
                    minimumSize: const Size(0, kMinTapTarget),
                    side: BorderSide(color: t.accent.withValues(alpha: 0.5)),
                    shape: const StadiumBorder(),
                  ),
                ),
              ),
              if (suggestions.isNotEmpty) ...[
                Text(s.didYouMean, style: AppText.label.copyWith(color: t.inkSoft)),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      for (final b in suggestions)
                        ActionChip(
                          label: Text(b.label, textDirection: TextDirection.ltr),
                          onPressed: () => _openBrand(b),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ],
          ),
        ),
      );
      return;
    }
    content
      ..add(
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(20, 10, 20, 0),
            child: Text(
              s.brandsCount(results.length),
              style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      )
      ..add(
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          sliver: _grid(results, s),
        ),
      );
  }

  Widget _grid(List<Brand> brands, AppStrings s) => SliverGrid(
    gridDelegate: _gridDelegate,
    delegate: SliverChildBuilderDelegate((_, i) {
      final brand = brands[i];
      return _BrandTile(
        brand: brand,
        alias: _aliasOf(brand),
        productsLabel: s.productsN,
        onTap: () => _openBrand(brand),
      );
    }, childCount: brands.length),
  );
}

/// الاسم العربي للبراند إن اختلف عن اسمه اللاتيني — سطر ثانٍ تحت الهوية.
String? _aliasOf(Brand b) {
  final ar = b.localizedName('ar').trim();
  return ar.isEmpty || ar == b.label.trim() ? null : ar;
}

/// سطر العنوان فوق الشريط المثبّت: «العلامات التجارية» + عدد البراندات.
class _TitleRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool showBack;

  const _TitleRow({
    required this.title,
    required this.subtitle,
    required this.showBack,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(showBack ? 6 : 16, 10, 16, 2),
      child: Row(
        children: [
          if (showBack) ...[
            const AppBackButton(),
            const SizedBox(width: 4),
          ],
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.title1.copyWith(color: t.ink, height: 1.15),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            subtitle,
            maxLines: 1,
            style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

/// الشريط المثبّت: حبّات الأقسام، ثم حقل البحث، ثم فهرس الحروف (يختفي أثناء البحث).
/// ارتفاعات ثابتة مع حدّ لتكبير الخط — حتى يُحسب موضع القفز بدقة.
class _BrandsBarDelegate extends SliverPersistentHeaderDelegate {
  final WorldThemePalette theme;
  final Widget? chips;
  final Widget search;
  final Widget? letters;

  _BrandsBarDelegate({
    required this.theme,
    required this.chips,
    required this.search,
    required this.letters,
  });

  static const chipsHeight = 60.0;
  static const searchHeight = 60.0;

  double get _extent =>
      (chips == null ? 0 : chipsHeight) + searchHeight + (letters == null ? 0 : _LetterBar.height);

  @override
  double get minExtent => _extent;
  @override
  double get maxExtent => _extent;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlaps) {
    final t = theme;
    return MediaQuery.withClampedTextScaling(
      maxScaleFactor: 1.3,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: t.canvas,
          boxShadow: overlaps
              ? [
                  BoxShadow(
                    color: t.accentDark.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          children: [
            if (chips != null) SizedBox(height: chipsHeight, child: chips),
            SizedBox(height: searchHeight, child: search),
            if (letters != null) SizedBox(height: _LetterBar.height, child: letters),
          ],
        ),
      ),
    );
  }

  // المحتوى يتبع حالة الشاشة (الاختيار، البحث، الحرف) — البناء رخيص.
  @override
  bool shouldRebuild(covariant _BrandsBarDelegate old) => true;
}

/// حقل البحث بنفس حبّة الرئيسية.
class _SearchField extends StatelessWidget {
  final String hint;
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  const _SearchField({
    super.key,
    required this.hint,
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final r = BorderRadius.circular(20);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
      child: Center(
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          onChanged: onChanged,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => focusNode.unfocus(),
          style: AppText.body.copyWith(color: t.ink, height: 1.2),
          cursorColor: t.accent,
          decoration: InputDecoration(
            hintText: hint,
            hintMaxLines: 1,
            hintStyle: AppText.bodySmall.copyWith(color: t.inkMuted, fontSize: 14),
            prefixIcon: Icon(Icons.search_rounded, color: t.ink, size: 23),
            suffixIcon: ValueListenableBuilder<TextEditingValue>(
              valueListenable: controller,
              builder: (_, v, __) => v.text.isEmpty
                  ? const SizedBox.shrink()
                  : IconButton(
                      tooltip: MaterialLocalizations.of(context).deleteButtonTooltip,
                      icon: Icon(Icons.close_rounded, color: t.inkMuted, size: 20),
                      onPressed: onClear,
                    ),
            ),
            isDense: true,
            filled: true,
            fillColor: Color.alphaBlend(t.ink.withValues(alpha: 0.045), t.surface),
            contentPadding: const EdgeInsets.symmetric(vertical: 13),
            border: OutlineInputBorder(
              borderRadius: r,
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: r,
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: r,
              borderSide: BorderSide(
                color: t.accent.withValues(alpha: 0.6),
                width: 1.4,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// حبّات الأقسام: صورة دائرية + اسم — المختارة متدرّجة بلون العالم.
/// تبقى ظاهرة (باهتة) أثناء البحث حتى لا يقفز الحقل تحت الإصبع.
class _CategoryChips extends StatelessWidget {
  final List<Category> categories;
  final String? selectedId;
  final String allLabel;
  final String lang;
  final bool dimmed;
  final ScrollController controller;
  final GlobalKey Function(String? id) keyFor;
  final void Function(String? id) onSelect;

  const _CategoryChips({
    super.key,
    required this.categories,
    required this.selectedId,
    required this.allLabel,
    required this.lang,
    required this.dimmed,
    required this.controller,
    required this.keyFor,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final motion = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 240);
    return AnimatedOpacity(
      duration: motion,
      opacity: dimmed ? 0.45 : 1,
      child: ListView.separated(
        controller: controller,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        itemCount: categories.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final isAll = i == 0;
          final cat = isAll ? null : categories[i - 1];
          final id = cat?.id;
          // أثناء البحث لا قسم «مختار» — البحث في كل البراندات.
          final on = !dimmed && id == selectedId;
          final name = isAll ? allLabel : cat!.localizedName(lang);
          return Semantics(
            key: keyFor(id),
            button: true,
            selected: on,
            label: name,
            excludeSemantics: true,
            child: GestureDetector(
              onTap: () => onSelect(id),
              child: AnimatedContainer(
                duration: motion,
                curve: Curves.easeOutCubic,
                padding: const EdgeInsetsDirectional.fromSTEB(4, 4, 14, 4),
                decoration: BoxDecoration(
                  color: on ? null : t.surface,
                  gradient: on
                      ? LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color.lerp(t.accent, Colors.white, 0.12)!,
                            Color.lerp(t.accent, Colors.black, 0.1)!,
                          ],
                        )
                      : null,
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                  border: Border.all(color: on ? Colors.transparent : t.hairline),
                  boxShadow: on
                      ? [
                          BoxShadow(
                            color: t.accent.withValues(alpha: 0.28),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: on
                            ? Colors.white.withValues(alpha: 0.22)
                            : t.accentLight,
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: isAll
                          ? Icon(
                              Icons.grid_view_rounded,
                              size: 16,
                              color: on ? Colors.white : t.accentDark,
                            )
                          : AppNetworkImage(
                              url: cat!.imageUrl,
                              width: 32,
                              height: 32,
                              fit: BoxFit.cover,
                              backgroundColor: Colors.white,
                            ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      name,
                      style: AppText.label.copyWith(
                        color: on ? Colors.white : t.ink,
                        fontWeight: on ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// فهرس الحروف: حبّات بعرض ثابت، والحرف الحالي متدرّج بلون العالم.
class _LetterBar extends StatelessWidget {
  final List<String> letters;
  final ValueListenable<String?> active;
  final ScrollController controller;
  final ValueChanged<String> onTap;

  const _LetterBar({
    super.key,
    required this.letters,
    required this.active,
    required this.controller,
    required this.onTap,
  });

  static const height = 52.0;
  static const pill = 40.0;
  static const gap = 6.0;
  static const padding = 16.0;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Directionality(
      // الفهرس اللاتيني يُقرأ من اليسار لليمين.
      textDirection: TextDirection.ltr,
      child: ValueListenableBuilder<String?>(
        valueListenable: active,
        builder: (context, current, _) => ListView.separated(
          controller: controller,
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(padding, 2, padding, 10),
          itemCount: letters.length,
          separatorBuilder: (_, __) => const SizedBox(width: gap),
          itemBuilder: (_, i) {
            final l = letters[i];
            final on = l == current;
            final shown = l == 'ا' ? 'أ' : l;
            return Semantics(
              button: true,
              selected: on,
              label: shown,
              excludeSemantics: true,
              child: GestureDetector(
                onTap: () => onTap(l),
                child: Container(
                  width: pill,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: on ? null : t.surface,
                    gradient: on
                        ? LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Color.lerp(t.accent, Colors.white, 0.12)!,
                              t.accentDark,
                            ],
                          )
                        : null,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: on ? Colors.transparent : t.hairline),
                  ),
                  child: Text(
                    shown,
                    style: AppText.label.copyWith(
                      color: on ? Colors.white : t.accentDark,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// البراندات المميزة: بطاقات أفقية كبيرة — الشعار على لوح أبيض فوق تدرّج العالم.
class _FeaturedBrands extends StatelessWidget {
  final List<Brand> brands;
  final String Function(int) productsLabel;
  final ValueChanged<Brand> onTap;

  const _FeaturedBrands({
    required this.brands,
    required this.productsLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final dir = Directionality.of(context);
    final radius = BorderRadius.circular(22);
    return SizedBox(
      height: 150,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final b = brands[i];
          final alias = _aliasOf(b);
          return Semantics(
            button: true,
            label: '${b.label}, ${productsLabel(b.productCount)}',
            excludeSemantics: true,
            child: Container(
              width: 230,
              decoration: BoxDecoration(
                borderRadius: radius,
                boxShadow: [
                  BoxShadow(
                    color: t.accent.withValues(alpha: 0.26),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                    spreadRadius: -4,
                  ),
                ],
              ),
              child: Material(
                type: MaterialType.transparency,
                borderRadius: radius,
                clipBehavior: Clip.antiAlias,
                child: Ink(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: AlignmentDirectional.topStart.resolve(dir),
                      end: AlignmentDirectional.bottomEnd.resolve(dir),
                      colors: [
                        Color.lerp(t.accent, Colors.white, 0.12)!,
                        Color.lerp(t.accent, Colors.black, 0.16)!,
                      ],
                    ),
                  ),
                  child: InkWell(
                    onTap: () => onTap(b),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Container(
                            width: 104,
                            height: double.infinity,
                            padding: const EdgeInsets.all(12),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: BrandAvatar(brand: b, size: 80, framed: false),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  b.label,
                                  maxLines: alias == null ? 2 : 1,
                                  overflow: TextOverflow.ellipsis,
                                  textDirection: TextDirection.ltr,
                                  style: AppText.title3.copyWith(color: Colors.white),
                                ),
                                if (alias != null)
                                  Text(
                                    alias,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.caption.copyWith(
                                      color: Colors.white.withValues(alpha: 0.9),
                                    ),
                                  ),
                                const SizedBox(height: 4),
                                Text(
                                  productsLabel(b.productCount),
                                  maxLines: 1,
                                  style: AppText.caption.copyWith(
                                    color: Colors.white.withValues(alpha: 0.85),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  width: 30,
                                  height: 30,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 16,
                                    color: t.accentDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// عنوان الحرف — ارتفاع ثابت مع حدّ لتكبير الخط.
class _LetterHeader extends StatelessWidget {
  final String letter;
  final int count;
  const _LetterHeader({required this.letter, required this.count});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return MediaQuery.withClampedTextScaling(
      maxScaleFactor: 1.3,
      child: SizedBox(
        height: 54,
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 8),
          child: Row(
            children: [
              ShaderMask(
                blendMode: BlendMode.srcIn,
                shaderCallback: (r) => LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color.lerp(t.accent, Colors.white, 0.2)!, t.accentDark],
                ).createShader(r),
                child: Text(
                  letter == 'ا' ? 'أ' : letter,
                  style: AppText.display.copyWith(
                    fontSize: 26,
                    height: 1,
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  height: 1,
                  color: t.hairline.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '$count',
                style: AppText.caption.copyWith(
                  color: t.inkMuted,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandsGridLoading extends StatelessWidget {
  const _BrandsGridLoading();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.md),
      gridDelegate: _BrandsScreenState._gridDelegate,
      itemCount: 6,
      itemBuilder: (_, __) =>
          const ShimmerBox(height: double.infinity, radius: 16),
    );
  }
}

/// بطاقة براند: الشعار في دائرة، الاسم اللاتيني (هوية البراند وحرف الفهرس)
/// ثم الاسم العربي إن وُجد، ثم عدد المنتجات.
class _BrandTile extends StatelessWidget {
  final Brand brand;
  final String? alias;
  final String Function(int) productsLabel;
  final VoidCallback onTap;

  const _BrandTile({
    required this.brand,
    required this.alias,
    required this.productsLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final radius = BorderRadius.circular(20);
    final count = productsLabel(brand.productCount);
    return Semantics(
      button: true,
      label: [brand.label, if (alias != null) alias!, count].join(', '),
      excludeSemantics: true,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: radius,
          boxShadow: [
            BoxShadow(
              color: t.accentDark.withValues(alpha: 0.07),
              blurRadius: 16,
              offset: const Offset(0, 6),
              spreadRadius: -4,
            ),
          ],
        ),
        child: Material(
          color: t.surface,
          borderRadius: radius,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
              child: Column(
                children: [
                  Expanded(
                    child: LayoutBuilder(
                      builder: (_, c) => Center(
                        child: BrandAvatar(
                          brand: brand,
                          size: c.maxWidth < c.maxHeight ? c.maxWidth : c.maxHeight,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    brand.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    textDirection: TextDirection.ltr,
                    style: AppText.label.copyWith(color: t.ink, fontSize: 12.5),
                  ),
                  if (alias != null)
                    Text(
                      alias!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: AppText.micro.copyWith(
                        color: t.inkMuted,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: t.accentLight,
                      borderRadius: BorderRadius.circular(AppCorners.pill),
                    ),
                    child: Text(
                      count,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.micro.copyWith(
                        color: t.accentDark,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
