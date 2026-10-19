import 'package:flutter/foundation.dart' show ValueListenable, listEquals;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../../brands/brand_avatar.dart';
import '../../brands/brands_screen.dart' show brandsCategoryRequestProvider;
import '../../catalog/catalog_providers.dart';
import '../../shell/nav_tabs.dart';
import '../../worlds/world_theme.dart';
import '../category_browse.dart';
import '../recent_categories.dart';
import 'category_line_art.dart';

/// يربط شاشة الأقسام باللوحة الظاهرة حالياً — «لمسة ثانية على التبويب» تصعد لأعلاها.
class CategoryPaneController {
  _CategoryPaneState? _pane;

  /// يصعد لأعلى اللوحة؛ false إن كانت في الأعلى أصلاً (أو لا لوحة).
  bool scrollToTop() => _pane?._scrollToTop() ?? false;
}

/// لوحة القسم المختار — كل شيء ظاهر دفعة واحدة:
/// غلاف + "تسوقي الكل" ← البراندات ← الأقسام الفرعية بصورها وأعدادها ← الأكثر طلباً.
class CategoryPane extends ConsumerStatefulWidget {
  final IndexedCategory entry;
  final Future<void> Function() onRefresh;
  final CategoryPaneController? controller;

  const CategoryPane({
    super.key,
    required this.entry,
    required this.onRefresh,
    this.controller,
  });

  @override
  ConsumerState<CategoryPane> createState() => _CategoryPaneState();
}

class _CategoryPaneState extends ConsumerState<CategoryPane> {
  final _scroll = ScrollController();
  final _jumpScroll = ScrollController();
  final _paneKey = GlobalKey();

  /// مفتاح لكل مجموعة (قسم فرعي) — للقفز إليها وتتبّع المجموعة الظاهرة.
  final Map<String, GlobalKey> _groupKeys = {};

  /// مفتاح لكل حبّة في شريط القفز — لإبقاء النشطة ظاهرة.
  final Map<String, GlobalKey> _pillKeys = {};

  /// المجموعة النشطة — تتغيّر مع التمرير دون إعادة بناء اللوحة كلها.
  final _active = ValueNotifier<String?>(null);
  List<String> _groupOrder = const [];

  /// أثناء حركة القفز لا نتتبّع: كانت الحبّات تومض بالمجموعات التي تمرّ بها.
  bool _jumping = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_trackActive);
    _active.addListener(_revealActivePill);
    widget.controller?._pane = this;
  }

  @override
  void didUpdateWidget(covariant CategoryPane old) {
    super.didUpdateWidget(old);
    if (old.controller != widget.controller) {
      if (old.controller?._pane == this) old.controller!._pane = null;
      widget.controller?._pane = this;
    }
  }

  @override
  void dispose() {
    // اللوحة القديمة تُزال بعد ظهور الجديدة (AnimatedSwitcher) — لا نفصل الجديدة.
    if (widget.controller?._pane == this) widget.controller!._pane = null;
    _scroll.removeListener(_trackActive);
    _active.removeListener(_revealActivePill);
    _scroll.dispose();
    _jumpScroll.dispose();
    _active.dispose();
    super.dispose();
  }

  GlobalKey _keyFor(String id) => _groupKeys.putIfAbsent(id, GlobalKey.new);

  bool _scrollToTop() {
    if (!_scroll.hasClients || _scroll.offset <= 0) return false;
    if (MediaQuery.disableAnimationsOf(context)) {
      _scroll.jumpTo(0);
    } else {
      _scroll.animateTo(
        0,
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeOutCubic,
      );
    }
    return true;
  }

  /// المجموعة النشطة: آخر عنوان مرّ تحت شريط القفز — وفي نهاية التمرير آخر عنوان
  /// ظاهر، لأن المجموعات الأخيرة قد لا تبلغ أعلى اللوحة.
  void _trackActive() {
    if (_jumping || _groupOrder.isEmpty || !_scroll.hasClients) return;
    final pane = _paneKey.currentContext?.findRenderObject() as RenderBox?;
    if (pane == null || !pane.hasSize) return;
    final paneTop = pane.localToGlobal(Offset.zero).dy;
    final pos = _scroll.position;
    final atEnd =
        pos.maxScrollExtent > 0 && pos.pixels >= pos.maxScrollExtent - 1;
    String? current;
    for (final id in _groupOrder) {
      final box =
          _groupKeys[id]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.attached || !box.hasSize) continue;
      final y = box.localToGlobal(Offset.zero).dy - paneTop;
      if (atEnd
          ? y < pane.size.height - 24
          : y <= _JumpBarDelegate.height + 24) {
        current = id;
      }
    }
    _active.value = current ?? _groupOrder.first;
  }

  void _revealActivePill() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final box = _pillKeys[_active.value]?.currentContext?.findRenderObject();
      if (box is! RenderBox || !box.attached || !_jumpScroll.hasClients) return;
      final pos = _jumpScroll.position;
      // نحرّك الشريط الأفقي وحده — ensureVisible كان سيحرّك اللوحة أيضاً.
      final target = RenderAbstractViewport.of(box)
          .getOffsetToReveal(box, 0.5)
          .offset
          .clamp(pos.minScrollExtent, pos.maxScrollExtent);
      if ((target - _jumpScroll.offset).abs() < 1) return;
      if (MediaQuery.disableAnimationsOf(context)) {
        _jumpScroll.jumpTo(target);
      } else {
        _jumpScroll.animateTo(
          target,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  void _jumpTo(String id) {
    final ctx = _groupKeys[id]?.currentContext;
    if (ctx == null || !_scroll.hasClients) return;
    HapticFeedback.selectionClick();
    _active.value = id;
    final box = ctx.findRenderObject()! as RenderBox;
    final viewport = RenderAbstractViewport.of(box);
    final target =
        (viewport.getOffsetToReveal(box, 0).offset -
                _JumpBarDelegate.height -
                4)
            .clamp(0.0, _scroll.position.maxScrollExtent);
    _jumping = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _scroll.jumpTo(target);
      _jumping = false;
      return;
    }
    _scroll
        .animateTo(
          target,
          duration: const Duration(milliseconds: 520),
          curve: Curves.easeInOutCubic,
        )
        .whenComplete(() => _jumping = false);
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final t = context.worldTheme;
    final entry = widget.entry;
    final cat = entry.category;
    final target = entry.target(lang);

    final sections = _sectionSlivers(context, lang, s);
    final groups = _jumpGroups(lang);
    _groupOrder = [for (final g in groups) g.$1];

    final slivers = <Widget>[
      const SliverToBoxAdapter(child: RecentCategoriesStrip()),
      SliverToBoxAdapter(
        child: _CoverCard(
          category: cat,
          name: cat.localizedName(lang),
          count:
              ref.watch(categoryVisibleCountProvider(target)).valueOrNull ?? 0,
          shopAllLabel: s.catShopAll,
          countLabel: (n) => s.catProducts(formatNumber(n)),
          onTap: () => target.open(context),
        ),
      ),
      // شريط القفز السريع — يثبت أعلى اللوحة أثناء التمرير.
      if (groups.length >= 2)
        SliverPersistentHeader(
          pinned: true,
          delegate: _JumpBarDelegate(
            groups: groups,
            active: _active,
            onTap: _jumpTo,
            theme: t,
            controller: _jumpScroll,
            keyFor: (id) => _pillKeys.putIfAbsent(id, GlobalKey.new),
          ),
        ),
      // الترتيب: الأقسام أولاً (جوهر التصفّح)، ثم البراندات، ثم الأكثر طلباً.
      ...sections,
      SliverToBoxAdapter(child: _BrandsRow(entry: entry)),
      SliverToBoxAdapter(
        child: _TopProducts(target: target, title: s.catBestSellers),
      ),
      const SliverToBoxAdapter(child: SizedBox(height: 28)),
    ];

    return RefreshIndicator(
      key: _paneKey,
      color: t.accent,
      backgroundColor: t.surface,
      onRefresh: () async {
        // ما في اللوحة نفسها (المعاينة، العدد، البراندات) يُجلب من جديد مع الشجرة.
        ref.invalidate(categoryTopProductsProvider(target));
        ref.invalidate(categoryVisibleCountProvider(target));
        final id = entry.category.id;
        if (entry.level == CategoryLevel.root) {
          ref.invalidate(categoryBrandsProvider(id));
        } else {
          ref.invalidate(subcategoryBrandsProvider(id));
        }
        await widget.onRefresh();
      },
      child: CustomScrollView(
        controller: _scroll,
        // عناوين المجموعات slivers تُخطَّط دائماً فيعمل القفز دون بناء كل البلاطات؛
        // هامش معتدل يجهّز ما تحت الشاشة مباشرة.
        cacheExtent: 2000,
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: slivers,
      ),
    );
  }

  /// مجموعات القفز: الأقسام الفرعية التي لها أقسام دقيقة (في الأقسام العميقة فقط).
  List<(String, String)> _jumpGroups(String lang) {
    final entry = widget.entry;
    if (entry.level != CategoryLevel.root) return const [];
    final children = entry.category.children;
    if (!children.any((c) => c.children.isNotEmpty)) return const [];
    return [
      for (final sc in children)
        if (sc.children.isNotEmpty) (sc.id, sc.localizedName(lang)),
    ];
  }

  List<Widget> _sectionSlivers(
    BuildContext context,
    String lang,
    AppStrings s,
  ) {
    final entry = widget.entry;
    final cat = entry.category;
    final children = cat.children;
    if (children.isEmpty) return const [];

    // قسم فرعي (من عدسة العالم): شبكة أقسامه الثانوية مباشرة.
    if (entry.level != CategoryLevel.root) {
      return [
        SliverToBoxAdapter(
          child: _GroupHeader(title: s.catSections, count: children.length),
        ),
        _TileGrid(
          tiles: [
            for (final tc in children)
              _TileData(
                category: tc,
                target: CategoryTarget(
                  title: tc.localizedName(lang),
                  subcategoryId: cat.id,
                  tertiaryCategoryId: tc.id,
                ),
              ),
          ],
        ),
      ];
    }

    final anyDeep = children.any((c) => c.children.isNotEmpty);
    // قسم رئيسي بلا مستوى ثالث (مثل العطور): شبكة واحدة لأقسامه الفرعية.
    if (!anyDeep) {
      return [
        SliverToBoxAdapter(
          child: _GroupHeader(title: s.catSections, count: children.length),
        ),
        _TileGrid(
          tiles: [
            for (final sc in children)
              _TileData(
                category: sc,
                target: CategoryTarget(
                  title: sc.localizedName(lang),
                  subcategoryId: sc.id,
                ),
              ),
          ],
        ),
      ];
    }

    // قسم رئيسي عميق (مثل المكياج): كل قسم فرعي عنوان + شبكة أقسامه الدقيقة.
    final out = <Widget>[];
    for (final sc in children) {
      final subTarget = CategoryTarget(
        title: sc.localizedName(lang),
        subcategoryId: sc.id,
      );
      if (sc.children.isEmpty) {
        out.add(
          SliverToBoxAdapter(
            child: _SubRowTile(
              category: sc,
              name: sc.localizedName(lang),
              countLabel: null,
              onTap: () => subTarget.open(context),
            ),
          ),
        );
        continue;
      }
      out.add(
        SliverToBoxAdapter(
          child: _GroupHeader(
            key: _keyFor(sc.id),
            title: sc.localizedName(lang),
            count: sc.children.length,
            actionLabel: s.all,
            onAction: () => subTarget.open(context),
          ),
        ),
      );
      out.add(
        _TileGrid(
          tiles: [
            for (final tc in sc.children)
              _TileData(
                category: tc,
                target: CategoryTarget(
                  title: tc.localizedName(lang),
                  subcategoryId: sc.id,
                  tertiaryCategoryId: tc.id,
                ),
              ),
          ],
        ),
      );
    }
    return out;
  }
}

/// شريط القفز: حبّات بأسماء المجموعات، النشطة متدرّجة بلون العالم.
class _JumpBarDelegate extends SliverPersistentHeaderDelegate {
  final List<(String, String)> groups;
  final ValueListenable<String?> active;
  final ValueChanged<String> onTap;
  final WorldThemePalette theme;
  final ScrollController controller;
  final GlobalKey Function(String id) keyFor;

  _JumpBarDelegate({
    required this.groups,
    required this.active,
    required this.onTap,
    required this.theme,
    required this.controller,
    required this.keyFor,
  });

  static const height = 54.0;

  @override
  double get minExtent => height;
  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlaps) {
    final t = theme;
    final motion = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 240);
    return MediaQuery.withClampedTextScaling(
      maxScaleFactor: 1.3,
      child: Container(
        decoration: BoxDecoration(
          color: t.surface.withValues(alpha: 0.96),
          border: overlaps
              ? Border(
                  bottom: BorderSide(color: t.hairline.withValues(alpha: 0.6)),
                )
              : null,
        ),
        child: ValueListenableBuilder<String?>(
          valueListenable: active,
          builder: (context, current, _) => ListView.separated(
            controller: controller,
            scrollDirection: Axis.horizontal,
            // المجموعات قليلة: كل الحبّات مبنية فتُظهر النشطة أينما كانت.
            cacheExtent: 2000,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            itemCount: groups.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final (id, name) = groups[i];
              // قبل أي تمرير: الأولى نشطة.
              final on = id == (current ?? groups.first.$1);
              return Semantics(
                key: keyFor(id),
                button: true,
                selected: on,
                label: name,
                excludeSemantics: true,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onTap(id),
                  // منطقة اللمس بارتفاع الشريط كله، والحبّة المرسومة أنحف.
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: AnimatedContainer(
                      duration: motion,
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: on ? null : t.accentLight,
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
                        boxShadow: on
                            ? [
                                BoxShadow(
                                  color: t.accent.withValues(alpha: 0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : null,
                      ),
                      child: Text(
                        name,
                        maxLines: 1,
                        style: AppText.label.copyWith(
                          fontSize: 12.5,
                          color: on ? Colors.white : t.accentDark,
                          fontWeight: on ? FontWeight.w800 : FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  // الحبّة النشطة تتبدّل عبر ValueListenableBuilder — لا حاجة لإعادة بناء الشريط.
  @override
  bool shouldRebuild(covariant _JumpBarDelegate old) =>
      !listEquals(old.groups, groups) || old.theme != theme;
}

// ─── الغلاف ───────────────────────────────────────────────────────────────────

class _CoverCard extends StatelessWidget {
  final Category category;
  final String name;
  final int count;
  final String shopAllLabel;
  final String Function(int) countLabel;
  final VoidCallback onTap;

  const _CoverCard({
    required this.category,
    required this.name,
    required this.count,
    required this.shopAllLabel,
    required this.countLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final deep = Color.lerp(t.accent, Colors.black, 0.14)!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Semantics(
        button: true,
        label: [
          name,
          if (count > 0) countLabel(count),
          shopAllLabel,
        ].join(', '),
        excludeSemantics: true,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            height: 132,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              // بطاقة غلاف بلون العالم العميق — بطل اللوحة.
              gradient: LinearGradient(
                begin: AlignmentDirectional.topStart.resolve(
                  Directionality.of(context),
                ),
                end: AlignmentDirectional.bottomEnd.resolve(
                  Directionality.of(context),
                ),
                colors: [Color.lerp(t.accent, Colors.white, 0.1)!, deep],
              ),
              boxShadow: [
                BoxShadow(
                  color: t.accent.withValues(alpha: 0.28),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                  spreadRadius: -4,
                ),
              ],
            ),
            child: Stack(
              children: [
                // دوائر ضوء ناعمة للعمق.
                const PositionedDirectional(
                  top: -40,
                  start: -30,
                  child: _SoftOrb(size: 130, alpha: 0.16),
                ),
                const PositionedDirectional(
                  bottom: -50,
                  end: 60,
                  child: _SoftOrb(size: 110, alpha: 0.10),
                ),
                Row(
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsetsDirectional.fromSTEB(
                          16,
                          14,
                          6,
                          14,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.title2.copyWith(
                                color: Colors.white,
                              ),
                            ),
                            if (count > 0) ...[
                              const SizedBox(height: 2),
                              Text(
                                countLabel(count),
                                style: AppText.caption.copyWith(
                                  color: Colors.white.withValues(alpha: 0.82),
                                ),
                              ),
                            ],
                            const Spacer(),
                            Container(
                              height: 34,
                              padding: const EdgeInsetsDirectional.fromSTEB(
                                14,
                                0,
                                4,
                                0,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(
                                  AppCorners.pill,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.12),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Flexible(
                                    child: Text(
                                      shopAllLabel,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppText.label.copyWith(
                                        color: deep,
                                        fontSize: 12.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    width: 26,
                                    height: 26,
                                    decoration: BoxDecoration(
                                      color: t.accent,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.arrow_forward_rounded,
                                      size: 15,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // صورة القسم على لوح أبيض بظل ناعم.
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        0,
                        12,
                        12,
                        12,
                      ),
                      child: AspectRatio(
                        aspectRatio: 1,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.14),
                                blurRadius: 14,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(13),
                            child: CategoryThumb(
                              category: category,
                              size: 96,
                              background: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SoftOrb extends StatelessWidget {
  final double size;
  final double alpha;
  const _SoftOrb({required this.size, required this.alpha});

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            Colors.white.withValues(alpha: alpha),
            Colors.white.withValues(alpha: 0),
          ],
        ),
      ),
    ),
  );
}

// ─── البراندات ────────────────────────────────────────────────────────────────

class _BrandsRow extends ConsumerWidget {
  final IndexedCategory entry;
  const _BrandsRow({required this.entry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = entry.category.id;
    final async = entry.level == CategoryLevel.root
        ? ref.watch(categoryBrandsProvider(id))
        : ref.watch(subcategoryBrandsProvider(id));
    final s = ref.s;
    return async.when(
      loading: () => Padding(
        padding: const EdgeInsets.fromLTRB(12, 18, 12, 0),
        child: Row(
          children: [
            for (var i = 0; i < 4; i++) ...const [
              ShimmerBox(width: 52, height: 52, radius: 26),
              SizedBox(width: 12),
            ],
          ],
        ),
      ),
      error: (_, __) => _RetryRow(
        onRetry: () => ref.invalidate(
          entry.level == CategoryLevel.root
              ? categoryBrandsProvider(id)
              : subcategoryBrandsProvider(id),
        ),
      ),
      data: (brands) {
        // «أبرز» فعلاً: المميزة أولاً ثم الأكثر منتجات في هذا القسم (ترتيب الخادم أبجدي).
        final list = [...brands.where((b) => b.name.isNotEmpty)]
          ..sort((a, b) {
            final f = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
            return f != 0 ? f : b.productCount.compareTo(a.productCount);
          });
        final top = list.take(12).toList();
        if (top.isEmpty) return const SizedBox.shrink();
        // «كل البراندات» يفتح الدليل على شريحة القسم الرئيسي.
        final rootId = entry.level == CategoryLevel.root ? id : entry.root?.id;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _GroupHeader(title: s.catTopBrands),
            SizedBox(
              height: 92,
              child: MediaQuery.withClampedTextScaling(
                maxScaleFactor: 1.2,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: top.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, i) {
                    if (i == top.length) {
                      return _AllBrandsBubble(
                        label: s.all,
                        semanticLabel: s.viewAllBrands,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          final container = ProviderScope.containerOf(
                            context,
                            listen: false,
                          );
                          if (rootId != null) {
                            container
                                    .read(
                                      brandsCategoryRequestProvider.notifier,
                                    )
                                    .state =
                                rootId;
                          }
                          openMainTab(context, container, NavTabs.brands);
                        },
                      );
                    }
                    final b = top[i];
                    return _BrandBubble(
                      brand: b,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        final scope = entry.level == CategoryLevel.root
                            ? 'categoryId'
                            : 'subcategoryId';
                        // صفحة البراند مقيّدة بهذا القسم: منتجاته هنا أولاً ثم الباقي.
                        final key = b.slug.isNotEmpty ? b.slug : b.id;
                        context.push(
                          '/brand/${Uri.encodeComponent(key)}?$scope=${Uri.encodeQueryComponent(id)}',
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _BrandBubble extends StatelessWidget {
  final Brand brand;
  final VoidCallback onTap;

  const _BrandBubble({required this.brand, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return _BubbleFrame(
      label: brand.label,
      semanticLabel: brand.label,
      onTap: onTap,
      ltr: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: t.hairline),
        ),
        child: BrandAvatar(brand: brand, size: 56),
      ),
    );
  }
}

/// آخر الصف: «الكل» — دليل البراندات على شريحة هذا القسم.
class _AllBrandsBubble extends StatelessWidget {
  final String label;
  final String semanticLabel;
  final VoidCallback onTap;

  const _AllBrandsBubble({
    required this.label,
    required this.semanticLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return _BubbleFrame(
      label: label,
      semanticLabel: semanticLabel,
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: t.accentLight,
          shape: BoxShape.circle,
          border: Border.all(color: t.accentSoft),
        ),
        child: Icon(Icons.grid_view_rounded, size: 22, color: t.accentDark),
      ),
    );
  }
}

/// فقاعة الصف: دائرة + اسم، بلمسة حبرية ووصف لقارئ الشاشة.
class _BubbleFrame extends StatelessWidget {
  final String label;
  final String semanticLabel;
  final VoidCallback onTap;
  final Widget child;
  final bool ltr;

  const _BubbleFrame({
    required this.label,
    required this.semanticLabel,
    required this.onTap,
    required this.child,
    this.ltr = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      label: semanticLabel,
      excludeSemantics: true,
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppCorners.md),
          child: SizedBox(
            width: 66,
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Column(
                children: [
                  child,
                  const SizedBox(height: 6),
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    textDirection: ltr ? TextDirection.ltr : null,
                    style: AppText.micro.copyWith(
                      color: t.inkSoft,
                      fontWeight: FontWeight.w600,
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

// ─── الأقسام ──────────────────────────────────────────────────────────────────

/// تعذّر تحميل جزء من اللوحة: سطر هادئ بزر «إعادة» بدل فراغ صامت.
class _RetryRow extends ConsumerWidget {
  final VoidCallback onRetry;
  const _RetryRow({required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(14, 14, 6, 0),
      child: Row(
        children: [
          Icon(Icons.cloud_off_rounded, size: 18, color: t.inkMuted),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              s.errorOccurred,
              style: AppText.bodySmall.copyWith(color: t.inkMuted),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: t.accentDark,
              minimumSize: const Size(0, kMinTapTarget),
            ),
            child: Text(s.retry, style: AppText.label),
          ),
        ],
      ),
    );
  }
}

class _GroupHeader extends StatelessWidget {
  final String title;
  final int? count;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _GroupHeader({
    super.key,
    required this.title,
    this.count,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(14, 16, 4, 6),
      child: Row(
        children: [
          // خط لوني صغير قبل العنوان — نفس لغة عناوين الرئيسية.
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [t.accent, t.accent.withValues(alpha: 0.35)],
              ),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.title3.copyWith(
                color: t.ink,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          if (count != null && count! > 0) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: t.accentLight,
                borderRadius: BorderRadius.circular(AppCorners.pill),
              ),
              child: Text(
                '$count',
                style: AppText.micro.copyWith(
                  color: t.accentDark,
                  fontSize: 10.5,
                ),
              ),
            ),
          ],
          const Spacer(),
          if (actionLabel != null && onAction != null)
            Semantics(
              button: true,
              label: '$actionLabel — $title',
              excludeSemantics: true,
              child: GestureDetector(
                onTap: onAction,
                behavior: HitTestBehavior.opaque,
                // منطقة لمس 44 على الأقل — النص والدائرة الصغيرة وحدهما كانا ~32.
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    minHeight: kMinTapTarget,
                    minWidth: kMinTapTarget,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          actionLabel!,
                          style: AppText.label.copyWith(
                            fontSize: 12.5,
                            color: t.accentDark,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: t.accent,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 12,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _TileData {
  final Category category;
  final CategoryTarget target;
  const _TileData({required this.category, required this.target});
}

class _TileGrid extends StatelessWidget {
  final List<_TileData> tiles;
  const _TileGrid({required this.tiles});

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 14,
          crossAxisSpacing: 10,
          childAspectRatio: 0.66,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, i) => _CategoryTile(data: tiles[i]),
          childCount: tiles.length,
        ),
      ),
    );
  }
}

class _CategoryTile extends ConsumerWidget {
  final _TileData data;
  const _CategoryTile({required this.data});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final c = data.category;
    return Semantics(
      button: true,
      label: c.localizedName(lang),
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => data.target.open(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 1,
              // تدرّج ناعم وحافة بيضاء وظل خفيف — نفس بلاطات الرئيسية.
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color.lerp(t.accentLight, Colors.white, 0.5)!,
                      t.accentLight,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white, width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: t.accentDark.withValues(alpha: 0.07),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: CategoryThumb(category: c),
              ),
            ),
            const SizedBox(height: 6),
            // مرن: مع تكبير خط الهاتف يُختصر الاسم بدل أن يفيض خارج البلاطة.
            Flexible(
              child: Text(
                c.localizedName(lang),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: AppText.micro.copyWith(
                  fontSize: 12,
                  height: 1.25,
                  color: t.ink,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// قسم فرعي بلا أقسام دقيقة داخل قسم رئيسي عميق — صف واحد أنيق.
class _SubRowTile extends StatelessWidget {
  final Category category;
  final String name;
  final String? countLabel;
  final VoidCallback onTap;

  const _SubRowTile({
    required this.category,
    required this.name,
    required this.countLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
      child: Material(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppCorners.md),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppCorners.sm),
                  child: SizedBox(
                    width: 52,
                    height: 52,
                    child: CategoryThumb(
                      category: category,
                      size: 52,
                      background: t.surface,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.title3.copyWith(color: t.ink),
                      ),
                      if (countLabel != null)
                        Text(
                          countLabel!,
                          style: AppText.caption.copyWith(color: t.inkMuted),
                        ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: t.accent),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── الأكثر طلباً ─────────────────────────────────────────────────────────────

class _TopProducts extends ConsumerWidget {
  final CategoryTarget target;
  final String title;
  const _TopProducts({required this.target, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(categoryTopProductsProvider(target));
    final s = ref.s;
    const cardW = 150.0;
    const rowH = 262.0;
    return async.when(
      loading: () => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _GroupHeader(title: title),
            SizedBox(
              height: rowH,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: 3,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, __) => const ShimmerBox(
                  width: cardW,
                  height: rowH,
                  radius: AppCorners.md,
                ),
              ),
            ),
          ],
        ),
      ),
      error: (_, __) => _RetryRow(
        onRetry: () => ref.invalidate(categoryTopProductsProvider(target)),
      ),
      data: (products) {
        if (products.length < 2) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _GroupHeader(
                title: title,
                actionLabel: s.all,
                onAction: () => target.open(context),
              ),
              SizedBox(
                height: rowH,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: products.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => ProductCard(
                    key: ValueKey(products[i].id),
                    product: products[i],
                    width: cardW,
                    lite: true,
                    showPromoBadge: true,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
