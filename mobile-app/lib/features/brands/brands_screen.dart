import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
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
    if (_query.isEmpty) return list;
    final q = _query.toLowerCase();
    return list
        .where(
          (b) =>
              b.name.toLowerCase().contains(q) ||
              (b.nameAr?.toLowerCase().contains(q) ?? false) ||
              (b.nameEn?.toLowerCase().contains(q) ?? false) ||
              b.localizedName(lang).toLowerCase().contains(q),
        )
        .toList(growable: false);
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
      backgroundColor: AppColors.scaffold,
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
                    color: AppColors.primary,
                    onRefresh: _refresh,
                    child: GridView.builder(
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.md,
                        0,
                        AppSpacing.md,
                        AppSpacing.md,
                      ),
                      gridDelegate: _gridDelegate,
                      itemCount: filtered.length,
                      itemBuilder: (_, i) {
                        final brand = filtered[i];
                        final name = brand.localizedName(lang);
                        return _BrandTile(
                          brand: brand,
                          name: name,
                          productsLabel: s.productCount,
                          onTap: () => _openBrand(brand, name),
                        );
                      },
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 6, AppSpacing.md, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            style: IconButton.styleFrom(
              foregroundColor: AppColors.textPrimary,
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.cairo(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textMuted,
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
    return TextField(
      onChanged: onChanged,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 22),
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppColors.hairline.withValues(alpha: 0.9)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.2),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
              color: AppColors.textSecondary,
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
                    color: selected ? AppColors.primary : AppColors.hairline,
                    width: selected ? 2 : 1,
                  ),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.18),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: ClipOval(
                  child: _buildCircleContent(),
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
                  color: selected ? AppColors.primaryDark : AppColors.textSecondary,
                  height: 1.15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCircleContent() {
    if (isAll) {
      return ColoredBox(
        color: selected ? AppColors.primaryLight : AppColors.surface,
        child: Icon(
          Icons.apps_rounded,
          size: 24,
          color: selected ? AppColors.primary : AppColors.textMuted,
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
      color: selected ? AppColors.primaryLight : AppColors.surface,
      child: Center(
        child: icon != null && icon!.isNotEmpty
            ? Text(icon!, style: const TextStyle(fontSize: 22))
            : Text(
                label.characters.first,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: selected ? AppColors.primary : AppColors.textMuted,
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

  Color _fallbackBg() {
    final hex = brand.bgColorHex?.replaceFirst('#', '').trim();
    if (hex == null || hex.length < 6) return AppColors.primaryLight;
    try {
      return Color(int.parse('FF${hex.substring(0, 6)}', radix: 16));
    } catch (_) {
      return AppColors.primaryLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.hairline.withValues(alpha: 0.8)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                  child: ColoredBox(
                    color: const Color(0xFFFAFAFA),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                      child: _BrandLogo(
                        brand: brand,
                        name: name,
                        fallbackBg: _fallbackBg(),
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
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        height: 1.15,
                      ),
                    ),
                    if (brand.productCount > 0) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F3F4),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          '${formatNumber(brand.productCount)} $productsLabel',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF7A757F),
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
    if (brand.logoUrl.isNotEmpty) {
      return Center(
        child: AppNetworkImage(
          url: brand.logoUrl,
          fit: BoxFit.contain,
          width: double.infinity,
          height: double.infinity,
          backgroundColor: const Color(0xFFFAFAFA),
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
          border: Border.all(color: AppColors.hairline.withValues(alpha: 0.7)),
        ),
        alignment: Alignment.center,
        child: Text(
          initial,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: AppColors.primary.withValues(alpha: 0.6),
            height: 1,
          ),
        ),
      ),
    );
  }
}
