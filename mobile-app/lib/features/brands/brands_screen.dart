import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/widgets/ui/ui.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../catalog/catalog_providers.dart';
import '../home/home_category_filter.dart';
import '../worlds/world_theme.dart';
import '../search/smart_query.dart';

class BrandsScreen extends ConsumerStatefulWidget {
  /// داخل تبويب الشريط السفلي: بلا زر رجوع.
  final bool embedded;

  const BrandsScreen({super.key, this.embedded = false});

  @override
  ConsumerState<BrandsScreen> createState() => _BrandsScreenState();
}

/// مجموعة حرف في الفهرس الأبجدي.
class _LetterGroup {
  final String letter;
  final List<Brand> brands;
  const _LetterGroup(this.letter, this.brands);
}

class _BrandsScreenState extends ConsumerState<BrandsScreen> {
  String _query = '';
  String? _selectedCategoryId;
  final _scroll = ScrollController();

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3,
    childAspectRatio: 0.78,
    crossAxisSpacing: 10,
    mainAxisSpacing: 12,
  );

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  List<Brand> _filterBrands(List<Brand> list, String lang) {
    if (_query.trim().isEmpty) return list;
    final matched = list
        .where(
          (b) => textMatchesQuery(_query, [
            b.name,
            b.nameAr,
            b.nameEn,
            b.slug,
            b.localizedName(lang),
          ]),
        )
        .toList(growable: false);
    matched.sort((a, b) {
      final scoreA = matchScore(_query, [a.name, a.nameAr, a.nameEn, a.slug]);
      final scoreB = matchScore(_query, [b.name, b.nameAr, b.nameEn, b.slug]);
      return scoreB.compareTo(scoreA);
    });
    return matched;
  }

  /// الحرف الأول موحّداً: أ/إ/آ → ا، اللاتيني كبير، وغير ذلك "#".
  static String _letterOf(String name) {
    final n = name.trim();
    if (n.isEmpty) return '#';
    var c = n.characters.first.toUpperCase();
    const alef = {'أ', 'إ', 'آ', 'ٱ'};
    if (alef.contains(c)) c = 'ا';
    if (c == 'ة') c = 'ه';
    final code = c.codeUnitAt(0);
    final latin = code >= 65 && code <= 90;
    final arabic = code >= 0x0621 && code <= 0x064A;
    return latin || arabic ? c : '#';
  }

  List<_LetterGroup> _group(List<Brand> brands, String lang) {
    final map = <String, List<Brand>>{};
    for (final b in brands) {
      map.putIfAbsent(_letterOf(b.localizedName(lang)), () => []).add(b);
    }
    bool isArabic(String l) =>
        l.codeUnitAt(0) >= 0x0621 && l.codeUnitAt(0) <= 0x064A;
    final letters = map.keys.toList()
      ..sort((a, b) {
        if (a == '#') return 1;
        if (b == '#') return -1;
        final aa = isArabic(a), bb = isArabic(b);
        // لغة الواجهة أولاً.
        if (aa != bb) {
          return (lang == 'ar') == aa ? -1 : 1;
        }
        return a.compareTo(b);
      });
    return [
      for (final l in letters)
        _LetterGroup(
          l,
          map[l]!..sort(
            (a, b) => a.localizedName(lang).compareTo(b.localizedName(lang)),
          ),
        ),
    ];
  }

  void _selectCategory(String? id) {
    if (_selectedCategoryId == id) return;
    HapticFeedback.selectionClick();
    setState(() => _selectedCategoryId = id);
  }

  Future<void> _refresh() async {
    ref.invalidate(brandsProvider);
    ref.invalidate(categoriesProvider);
    if (_selectedCategoryId != null) {
      ref.invalidate(categoryBrandsProvider(_selectedCategoryId!));
    }
    await Future<void>.delayed(const Duration(milliseconds: 300));
  }

  void _openBrand(Brand brand, String name) {
    HapticFeedback.selectionClick();
    final q = StringBuffer(
      'brandId=${brand.id}&title=${Uri.encodeComponent(name)}',
    );
    if (_selectedCategoryId != null) {
      q.write('&categoryId=$_selectedCategoryId');
    }
    context.push('/products?${q.toString()}');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final cats = ref.watch(categoriesProvider).valueOrNull;
    final parents = cats == null
        ? const <Category>[]
        : storefrontParentCategories(cats);
    final allBrands = ref.watch(brandsProvider).valueOrNull;
    final brandsAsync = _selectedCategoryId == null
        ? ref.watch(brandsProvider)
        : ref.watch(categoryBrandsProvider(_selectedCategoryId!));

    // كل شيء يتمرر — والثابت في الأعلى شريط الأقسام وحده.
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
          child: ErrorView(message: friendlyError(e), onRetry: _refresh),
        ),
      ),
      data: (list) {
        final filtered = _filterBrands(list, lang);
        if (filtered.isEmpty) {
          content.add(
            SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(
                icon: Icons.storefront_outlined,
                title: _query.isEmpty ? s.noBrands : s.noSearchResults,
                subtitle: _query.isEmpty ? null : s.tryAnotherSearch,
              ),
            ),
          );
          return;
        }
        final featured = _query.isEmpty && _selectedCategoryId == null
            ? (filtered.where((b) => b.isFeatured).toList()
                ..sort((a, b) => b.productCount.compareTo(a.productCount)))
            : const <Brand>[];
        final groups = _query.isEmpty
            ? _group(filtered, lang)
            : const <_LetterGroup>[];
        if (featured.isNotEmpty) {
          content
            ..add(
              SliverToBoxAdapter(
                child: AppSectionTitle(
                  title: s.isAr ? 'براندات مميزة' : 'Featured brands',
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 18, 16, 12),
                ),
              ),
            )
            ..add(
              SliverToBoxAdapter(
                child: _FeaturedBrands(
                  brands: featured.take(10).toList(),
                  lang: lang,
                  productsLabel: s.productCount,
                  onTap: _openBrand,
                ),
              ),
            );
        }
        if (groups.isEmpty) {
          content.add(
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              sliver: _grid(filtered, lang, s),
            ),
          );
        } else {
          for (final g in groups) {
            content
              ..add(
                SliverToBoxAdapter(
                  child: _LetterHeader(
                    letter: g.letter,
                    count: g.brands.length,
                  ),
                ),
              )
              ..add(
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  sliver: _grid(g.brands, lang, s),
                ),
              );
          }
        }
      },
    );

    return Scaffold(
      backgroundColor: t.canvas,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: t.accent,
          onRefresh: _refresh,
          child: CustomScrollView(
            controller: _scroll,
            cacheExtent: 8000,
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              // الأقسام أولاً — ثابتة في أعلى الصفحة دائماً.
              if (_query.isEmpty && parents.isNotEmpty)
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _CategoryBarDelegate(
                    categories: parents,
                    selectedId: _selectedCategoryId,
                    allLabel: s.all,
                    lang: lang,
                    onSelect: _selectCategory,
                    theme: t,
                  ),
                ),
              // زر الرجوع فقط حين تُفتح الصفحة منفصلة (لا في التبويب).
              if (!widget.embedded)
                SliverToBoxAdapter(
                  child: _PageHeader(
                    title: s.brands,
                    subtitle: s.brandsPageSubtitle,
                    onBack: () => context.pop(),
                  ),
                ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                  child: _SearchField(
                    hint: allBrands == null
                        ? s.searchBrandsHint
                        : (s.isAr
                              ? 'ابحثي بين ${allBrands.length} براند…'
                              : 'Search ${allBrands.length} brands…'),
                    onChanged: (v) => setState(() => _query = v.trim()),
                  ),
                ),
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

  Widget _grid(List<Brand> brands, String lang, AppStrings s) => SliverGrid(
    gridDelegate: _gridDelegate,
    delegate: SliverChildBuilderDelegate((_, i) {
      final brand = brands[i];
      final name = brand.localizedName(lang);
      return _BrandTile(
        brand: brand,
        name: name,
        productsLabel: s.productCount,
        onTap: () => _openBrand(brand, name),
      );
    }, childCount: brands.length),
  );
}

class _PageHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onBack;

  const _PageHeader({
    required this.title,
    required this.subtitle,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(
        onBack == null ? 16 : 6,
        8,
        16,
        12,
      ),
      child: Row(
        children: [
          if (onBack != null) ...[
            AppBackButton(onTap: onBack!),
            const SizedBox(width: 4),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppText.title1.copyWith(color: t.ink, height: 1.15),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(color: t.inkMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// حقل البحث بنفس حبّة الرئيسية.
class _SearchField extends StatelessWidget {
  final String hint;
  final ValueChanged<String> onChanged;

  const _SearchField({required this.hint, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final r = BorderRadius.circular(20);
    return TextField(
      onChanged: onChanged,
      style: AppText.body.copyWith(color: t.ink, height: 1.2),
      cursorColor: t.accent,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: AppText.bodySmall.copyWith(color: t.inkMuted, fontSize: 14),
        prefixIcon: Icon(Icons.search_rounded, color: t.ink, size: 23),
        filled: true,
        fillColor: Color.alphaBlend(t.ink.withValues(alpha: 0.045), t.surface),
        contentPadding: const EdgeInsets.symmetric(vertical: 15),
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
    );
  }
}

/// البراندات المميزة: بطاقات أفقية كبيرة — الشعار على لوح أبيض فوق تدرّج العالم.
class _FeaturedBrands extends StatelessWidget {
  final List<Brand> brands;
  final String lang;
  final String productsLabel;
  final void Function(Brand, String) onTap;

  const _FeaturedBrands({
    required this.brands,
    required this.lang,
    required this.productsLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      height: 150,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final b = brands[i];
          final name = b.localizedName(lang);
          return GestureDetector(
            onTap: () => onTap(b, name),
            child: Container(
              width: 230,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                gradient: LinearGradient(
                  begin: AlignmentDirectional.topStart.resolve(
                    Directionality.of(context),
                  ),
                  end: AlignmentDirectional.bottomEnd.resolve(
                    Directionality.of(context),
                  ),
                  colors: [
                    Color.lerp(t.accent, Colors.white, 0.12)!,
                    Color.lerp(t.accent, Colors.black, 0.16)!,
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: t.accent.withValues(alpha: 0.26),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                    spreadRadius: -4,
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 104,
                    height: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: _BrandLogo(
                      brand: b,
                      name: name,
                      fallbackBg: t.accentLight,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title3.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${formatNumber(b.productCount)} $productsLabel',
                          style: AppText.caption.copyWith(
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                        ),
                        const SizedBox(height: 10),
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
          );
        },
      ),
    );
  }
}

/// شريط الأقسام الثابت: حبّات مدمجة (صورة دائرية + اسم) — المختار متدرّج بلون العالم.
class _CategoryBarDelegate extends SliverPersistentHeaderDelegate {
  final List<Category> categories;
  final String? selectedId;
  final String allLabel;
  final String lang;
  final ValueChanged<String?> onSelect;
  final WorldThemePalette theme;

  _CategoryBarDelegate({
    required this.categories,
    required this.selectedId,
    required this.allLabel,
    required this.lang,
    required this.onSelect,
    required this.theme,
  });

  static const height = 60.0;

  @override
  double get minExtent => height;
  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlaps) {
    final t = theme;
    return Container(
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
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        itemCount: categories.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final isAll = i == 0;
          final cat = isAll ? null : categories[i - 1];
          final id = cat?.id;
          final on = id == selectedId;
          return GestureDetector(
            onTap: () => onSelect(id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 240),
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
                            fit: BoxFit.cover,
                            backgroundColor: Colors.white,
                          ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isAll ? allLabel : cat!.localizedName(lang),
                    style: AppText.label.copyWith(
                      color: on ? Colors.white : t.ink,
                      fontWeight: on ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _CategoryBarDelegate old) =>
      old.selectedId != selectedId ||
      old.categories.length != categories.length ||
      old.lang != lang ||
      old.theme != theme;
}

class _LetterHeader extends StatelessWidget {
  final String letter;
  final int count;
  const _LetterHeader({required this.letter, required this.count});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 18, 16, 10),
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
              letter,
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

class _BrandTile extends StatelessWidget {
  final Brand brand;
  final String name;
  final String productsLabel;
  final VoidCallback onTap;

  const _BrandTile({
    required this.brand,
    required this.name,
    required this.productsLabel,
    required this.onTap,
  });

  Color _fallbackBg(BuildContext context) {
    final hex = brand.bgColorHex?.replaceFirst('#', '').trim();
    if (hex == null || hex.length < 6) return context.worldTheme.accentLight;
    try {
      return Color(int.parse('FF${hex.substring(0, 6)}', radix: 16));
    } catch (_) {
      return context.worldTheme.accentLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: t.accentDark.withValues(alpha: 0.07),
              blurRadius: 16,
              offset: const Offset(0, 6),
              spreadRadius: -4,
            ),
          ],
        ),
        child: Column(
          children: [
            // الشعار في دائرة بيضاء بحلقة ناعمة.
            Expanded(
              child: AspectRatio(
                aspectRatio: 1,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(
                      color: t.accentSoft.withValues(alpha: 0.8),
                    ),
                  ),
                  child: ClipOval(
                    child: _BrandLogo(
                      brand: brand,
                      name: name,
                      fallbackBg: _fallbackBg(context),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: AppText.label.copyWith(color: t.ink, fontSize: 12.5),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: t.accentLight,
                borderRadius: BorderRadius.circular(AppCorners.pill),
              ),
              child: Text(
                '${formatNumber(brand.productCount)} $productsLabel',
                maxLines: 1,
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
    );
  }
}

class _BrandLogo extends StatelessWidget {
  final Brand brand;
  final String name;
  final Color fallbackBg;

  const _BrandLogo({
    required this.brand,
    required this.name,
    required this.fallbackBg,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    if (brand.logoUrl.isNotEmpty) {
      return Center(
        child: AppNetworkImage(
          url: brand.logoUrl,
          fit: BoxFit.contain,
          width: double.infinity,
          height: double.infinity,
          backgroundColor: t.accentLight.withValues(alpha: 0.55),
        ),
      );
    }

    final initial = brand.initial?.isNotEmpty == true
        ? brand.initial!
        : (name.isNotEmpty ? name.characters.first : '·');

    return Center(
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: fallbackBg,
          shape: BoxShape.circle,
          border: Border.all(color: t.hairline.withValues(alpha: 0.7)),
        ),
        alignment: Alignment.center,
        child: Text(
          initial,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: t.accent.withValues(alpha: 0.6),
            height: 1,
          ),
        ),
      ),
    );
  }
}
