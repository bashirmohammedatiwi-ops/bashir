import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/mock/mock_brands.dart';
import '../../../data/models/brand_model.dart';

class BrandsScreen extends StatefulWidget {
  const BrandsScreen({super.key});

  @override
  State<BrandsScreen> createState() => _BrandsScreenState();
}

class _BrandsScreenState extends State<BrandsScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  final _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<BrandModel> get _filtered {
    if (_query.isEmpty) return MockBrands.all;
    return MockBrands.all
        .where((b) => b.name.toLowerCase().contains(_query.toLowerCase()))
        .toList();
  }

  Map<String, List<BrandModel>> get _grouped {
    final map = <String, List<BrandModel>>{};
    for (final b in _filtered) {
      final letter = b.name[0].toUpperCase();
      map.putIfAbsent(letter, () => []).add(b);
    }
    return Map.fromEntries(
      map.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final featured = MockBrands.all.where((b) => b.isFeatured).toList();
    final grouped = _grouped;
    final showFeatured = _query.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _Header(count: MockBrands.all.length),
            ),
            SliverToBoxAdapter(
              child: _SearchField(
                controller: _controller,
                onChanged: (v) => setState(() => _query = v),
                onClear: () {
                  _controller.clear();
                  setState(() => _query = '');
                },
              ),
            ),
            if (showFeatured) ...[
              SliverToBoxAdapter(
                child: Luxe.sectionTitle(
                  title: 'البراندات المميزة',
                  subtitle: '${featured.length} علامة فاخرة',
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 152,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: featured.length,
                    itemBuilder: (context, i) {
                      return _FeaturedBrandCard(
                        brand: featured[i],
                        index: i,
                        onTap: () => _goToBrand(context, featured[i]),
                      );
                    },
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 12)),
            ],
            SliverToBoxAdapter(
              child: Luxe.sectionTitle(
                title: _query.isEmpty ? 'كل البراندات' : 'نتائج البحث',
                subtitle: '${_filtered.length} براند',
              ),
            ),
            if (_filtered.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: _EmptyState(),
              )
            else
              ...grouped.entries.map(
                (e) => SliverMainAxisGroup(
                  slivers: [
                    SliverToBoxAdapter(
                      child: _LetterHeader(letter: e.key),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _BrandTile(
                              brand: e.value[i],
                              onTap: () => _goToBrand(context, e.value[i]),
                            ),
                          ),
                          childCount: e.value.length,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 140)),
          ],
        ),
      ),
    );
  }

  void _goToBrand(BuildContext context, BrandModel brand) {
    context.push(
      '/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.name)}',
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'البراندات',
                style: AppTextStyles.editorial(
                  size: 28,
                  weight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'علامات عالمية بأناقة لا تُضاهى',
                style: AppTextStyles.caption(
                  color: AppColors.textMuted,
                  size: 11.5,
                ).copyWith(letterSpacing: 0.5),
              ),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(AppSizes.pillRadius),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.diamond_outlined,
                  size: 13,
                  color: AppColors.gold,
                ),
                const SizedBox(width: 4),
                Text(
                  '+$count',
                  style: AppTextStyles.caption(
                    color: AppColors.primaryDark,
                    size: 11,
                  ).copyWith(fontWeight: FontWeight.w800),
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
  const _SearchField({
    required this.controller,
    required this.onChanged,
    required this.onClear,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 12),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.inputRadius),
          border: Border.all(color: AppColors.border),
          boxShadow: const [AppColors.softShadow],
        ),
        child: TextField(
          controller: controller,
          onChanged: onChanged,
          textAlignVertical: TextAlignVertical.center,
          style: AppTextStyles.body(size: 13),
          decoration: InputDecoration(
            isCollapsed: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 14,
            ),
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            filled: false,
            hintText: 'ابحثي عن براند…',
            hintStyle: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 12.5,
            ),
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: AppColors.textMuted,
              size: 19,
            ),
            suffixIcon: controller.text.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(
                      Icons.close_rounded,
                      size: 17,
                      color: AppColors.textMuted,
                    ),
                    onPressed: onClear,
                  ),
          ),
        ),
      ),
    );
  }
}

class _FeaturedBrandCard extends StatelessWidget {
  const _FeaturedBrandCard({
    required this.brand,
    required this.index,
    required this.onTap,
  });

  final BrandModel brand;
  final int index;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppMotion.fast,
        width: 130,
        margin: const EdgeInsets.symmetric(horizontal: 5),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.surface,
              AppColors.canvas.withValues(alpha: 0.5),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.divider),
          boxShadow: const [AppColors.softShadow],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.canvas, AppColors.goldSoft],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.4),
                ),
              ),
              child: Center(
                child: Text(
                  brand.initial,
                  style: AppTextStyles.serif(
                    color: AppColors.primaryDark,
                    size: 22,
                    weight: FontWeight.w400,
                    style: FontStyle.italic,
                  ),
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  brand.name,
                  style: AppTextStyles.title(size: 13).copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      '${brand.productCount} منتج',
                      style: AppTextStyles.caption(
                        color: AppColors.textMuted,
                        size: 10.5,
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.arrow_back_rounded,
                      size: 13,
                      color: AppColors.primaryDark,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LetterHeader extends StatelessWidget {
  const _LetterHeader({required this.letter});
  final String letter;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 8),
      child: Row(
        children: [
          Text(
            letter,
            style: AppTextStyles.serif(
              color: AppColors.gold,
              size: 20,
              weight: FontWeight.w400,
              style: FontStyle.italic,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Luxe.goldenRule(width: double.infinity)),
        ],
      ),
    );
  }
}

class _BrandTile extends StatefulWidget {
  const _BrandTile({required this.brand, required this.onTap});
  final BrandModel brand;
  final VoidCallback onTap;

  @override
  State<_BrandTile> createState() => _BrandTileState();
}

class _BrandTileState extends State<_BrandTile> {
  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: widget.onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.divider),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Text(
                  widget.brand.initial,
                  style: AppTextStyles.serif(
                    color: AppColors.textPrimary,
                    size: 18,
                    weight: FontWeight.w500,
                    style: FontStyle.italic,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.brand.name,
                    style: AppTextStyles.title(size: 14).copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${widget.brand.productCount} منتج متوفر',
                    style: AppTextStyles.caption(
                      color: AppColors.textMuted,
                      size: 11,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_back_rounded,
              size: 16,
              color: AppColors.primaryDark,
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: AppColors.canvas,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: const Icon(
                Icons.search_off_rounded,
                size: 30,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'لا توجد نتائج',
              style: AppTextStyles.title(size: 14).copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'جرّبي كلمة مختلفة',
              style: AppTextStyles.caption(
                color: AppColors.textMuted,
                size: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
