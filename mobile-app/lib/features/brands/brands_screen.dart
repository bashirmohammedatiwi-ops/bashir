import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_fonts.dart';

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
  const BrandsScreen({super.key});

  @override
  ConsumerState<BrandsScreen> createState() => _BrandsScreenState();
}

class _BrandsScreenState extends ConsumerState<BrandsScreen> {
  String _query = '';
  String? _selectedCategoryId;

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.82,
    crossAxisSpacing: 12,
    mainAxisSpacing: 12,
  );

  List<Brand> _filterBrands(List<Brand> list, String lang) {
    if (_query.trim().isEmpty) return list;
    final matched = list
        .where((b) => textMatchesQuery(_query, [b.name, b.nameAr, b.nameEn, b.slug, b.localizedName(lang)]))
        .toList(growable: false);
    matched.sort((a, b) {
      final scoreA = matchScore(_query, [a.name, a.nameAr, a.nameEn, a.slug]);
      final scoreB = matchScore(_query, [b.name, b.nameAr, b.nameEn, b.slug]);
      return scoreB.compareTo(scoreA);
    });
    return matched;
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
    final q = StringBuffer('brandId=${brand.id}&title=${Uri.encodeComponent(name)}');
    if (_selectedCategoryId != null) {
      q.write('&categoryId=$_selectedCategoryId');
    }
    context.push('/products?${q.toString()}');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final lang = ref.watch(languageCodeProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final brandsAsync = _selectedCategoryId == null
        ? ref.watch(brandsProvider)
        : ref.watch(categoryBrandsProvider(_selectedCategoryId!));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _PageHeader(
              title: s.brands,
              subtitle: s.brandsPageSubtitle,
              onBack: () => context.pop(),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, 10),
              child: _SearchField(
                hint: s.searchBrandsHint,
                onChanged: (v) => setState(() => _query = v.trim()),
              ),
            ),
            categoriesAsync.when(
              loading: () => const _CategoryRailLoading(),
              error: (_, __) => const SizedBox.shrink(),
              data: (cats) {
                final parents = storefrontParentCategories(cats);
                if (parents.isEmpty) return const SizedBox.shrink();
                return _CategoryRail(
                  label: s.brandsByCategory,
                  allLabel: s.all,
                  categories: parents,
                  selectedId: _selectedCategoryId,
                  lang: lang,
                  onSelect: _selectCategory,
                );
              },
            ),
            const SizedBox(height: 8),
            Expanded(
              child: brandsAsync.when(
                loading: () => const _BrandsGridLoading(),
                error: (e, _) => ErrorView(
                  message: friendlyError(e),
                  onRetry: _refresh,
                ),
                data: (list) {
                  final filtered = _filterBrands(list, lang);
                  if (filtered.isEmpty) {
                    return EmptyState(
                      icon: Icons.storefront_outlined,
                      title: _query.isEmpty ? s.noBrands : s.noSearchResults,
                      subtitle: _query.isEmpty ? null : s.tryAnotherSearch,
                    );
                  }
                  return RefreshIndicator(
                    color: context.worldTheme.accent,
                    onRefresh: _refresh,
                    child: CustomScrollView(
                      slivers: [
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(
                            16,
                            0,
                            16,
                            12,
                          ),
                          sliver: SliverGrid(
                            gridDelegate: _gridDelegate,
                            delegate: SliverChildBuilderDelegate(
                              (_, i) {
                                final brand = filtered[i];
                                final name = brand.localizedName(lang);
                                return _BrandTile(
                                  brand: brand,
                                  name: name,
                                  productsLabel: s.productCount,
                                  onTap: () => _openBrand(brand, name),
                                );
                              },
                              childCount: filtered.length,
                            ),
                          ),
                        ),
                        const SliverToBoxAdapter(child: SizedBox(height: 24)),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PageHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onBack;

  const _PageHeader({
    required this.title,
    required this.subtitle,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 6, 16, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          IconButton(
            onPressed: onBack,
            icon: Icon(
              Directionality.of(context) == TextDirection.rtl
                  ? Icons.arrow_forward_ios_rounded
                  : Icons.arrow_back_ios_new_rounded,
              size: 18,
            ),
            style: IconButton.styleFrom(
              foregroundColor: t.ink,
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: appFont(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: t.ink,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: t.inkMuted,
                    height: 1.3,
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

class _SearchField extends StatelessWidget {
  final String hint;
  final ValueChanged<String> onChanged;

  const _SearchField({required this.hint, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return TextField(
      onChanged: onChanged,
      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: t.ink),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: t.inkMuted, fontSize: 14),
        prefixIcon: Icon(Icons.search_rounded, color: t.inkMuted, size: 22),
        filled: true,
        fillColor: t.surface,
        contentPadding: const EdgeInsets.symmetric(vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: t.hairline.withValues(alpha: 0.9)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: t.accent, width: 1.2),
        ),
      ),
    );
  }
}

class _CategoryRail extends StatelessWidget {
  final String label;
  final String allLabel;
  final List<Category> categories;
  final String? selectedId;
  final String lang;
  final ValueChanged<String?> onSelect;

  const _CategoryRail({
    required this.label,
    required this.allLabel,
    required this.categories,
    required this.selectedId,
    required this.lang,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
              color: t.inkSoft,
              letterSpacing: 0.2,
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            itemCount: categories.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              if (i == 0) {
                return _CategoryCircleTile(
                  label: allLabel,
                  isAll: true,
                  selected: selectedId == null,
                  onTap: () => onSelect(null),
                );
              }
              final cat = categories[i - 1];
              return _CategoryCircleTile(
                label: cat.localizedName(lang),
                imageUrl: cat.imageUrl,
                icon: cat.icon,
                selected: selectedId == cat.id,
                onTap: () => onSelect(cat.id),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _CategoryCircleTile extends StatelessWidget {
  static const _size = 58.0;

  final String label;
  final String? imageUrl;
  final String? icon;
  final bool isAll;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryCircleTile({
    required this.label,
    this.imageUrl,
    this.icon,
    this.isAll = false,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: 68,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: _size,
                height: _size,
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: selected ? t.accent : t.hairline,
                    width: selected ? 2 : 1,
                  ),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: t.accent.withValues(alpha: 0.18),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: ClipOval(
                  child: _buildCircleContent(context),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                  color: selected ? t.accentDark : t.inkSoft,
                  height: 1.15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCircleContent(BuildContext context) {
    final t = context.worldTheme;
    if (isAll) {
      return ColoredBox(
        color: selected ? t.accentLight : t.surface,
        child: Icon(
          Icons.apps_rounded,
          size: 24,
          color: selected ? t.accent : t.inkMuted,
        ),
      );
    }

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return AppNetworkImage(
        url: imageUrl!,
        width: _size,
        height: _size,
        fit: BoxFit.cover,
      );
    }

    return ColoredBox(
      color: selected ? t.accentLight : t.surface,
      child: Center(
        child: icon != null && icon!.isNotEmpty
            ? Text(icon!, style: const TextStyle(fontSize: 22))
            : Text(
                label.characters.first,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: selected ? t.accent : t.inkMuted,
                ),
              ),
      ),
    );
  }
}

class _CategoryRailLoading extends StatelessWidget {
  const _CategoryRailLoading();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: 6,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, __) => const SizedBox(
          width: 68,
          child: Column(
            children: [
              ShimmerBox(height: 58, width: 58, radius: 99),
              SizedBox(height: 6),
              ShimmerBox(height: 10, width: 52, radius: 4),
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
      padding: const EdgeInsets.all(AppSpacing.md),
      gridDelegate: _BrandsScreenState._gridDelegate,
      itemCount: 6,
      itemBuilder: (_, __) => const ShimmerBox(height: double.infinity, radius: 16),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: t.hairline.withValues(alpha: 0.8)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                  child: ColoredBox(
                    color: t.accentLight.withValues(alpha: 0.55),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                      child: _BrandLogo(
                        brand: brand,
                        name: name,
                        fallbackBg: _fallbackBg(context),
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 9, 10, 10),
                child: Column(
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: t.ink,
                        height: 1.15,
                      ),
                    ),
                    if (brand.productCount > 0) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: t.accentLight,
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          '${formatNumber(brand.productCount)} $productsLabel',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: t.inkMuted,
                            height: 1,
                          ),
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
        : (name.isNotEmpty ? name.characters.first : '؟');

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
