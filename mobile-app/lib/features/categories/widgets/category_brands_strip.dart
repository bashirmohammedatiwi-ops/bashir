import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../data/models/brand.dart';
import '../../worlds/world_theme.dart';

/// شريط براندات بصفّين مع مؤشر تمرير يوضّح وجود المزيد.
class CategoryBrandsStrip extends StatefulWidget {
  final List<Brand> brands;
  final String? categoryId;
  final String? subcategoryId;

  const CategoryBrandsStrip({
    super.key,
    required this.brands,
    this.categoryId,
    this.subcategoryId,
  });

  static const _tileWidth = 82.0;
  static const _logoSize = 56.0;
  static const _rowGap = 10.0;
  static const _colGap = 10.0;
  static const _logoPadding = 8.0;

  @override
  State<CategoryBrandsStrip> createState() => _CategoryBrandsStripState();
}

class _CategoryBrandsStripState extends State<CategoryBrandsStrip>
    with SingleTickerProviderStateMixin {
  final _scroll = ScrollController();
  late final AnimationController _nudge;
  bool _canScroll = false;
  bool _atEnd = true;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _nudge = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _scroll.addListener(_syncScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncScroll());
  }

  @override
  void didUpdateWidget(covariant CategoryBrandsStrip oldWidget) {
    super.didUpdateWidget(oldWidget);
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncScroll());
  }

  void _syncScroll() {
    if (!mounted || !_scroll.hasClients) return;
    final max = _scroll.position.maxScrollExtent;
    final offset = _scroll.offset;
    final canScroll = max > 12;
    final atEnd = !canScroll || offset >= max - 8;
    final progress = !canScroll || max <= 0 ? 1.0 : (offset / max).clamp(0.0, 1.0);
    if (canScroll != _canScroll || atEnd != _atEnd || (progress - _progress).abs() > 0.01) {
      setState(() {
        _canScroll = canScroll;
        _atEnd = atEnd;
        _progress = progress;
      });
    }
  }

  @override
  void dispose() {
    _scroll.removeListener(_syncScroll);
    _scroll.dispose();
    _nudge.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.brands.isEmpty) return const SizedBox.shrink();

    final t = context.worldTheme;
    final columns = (widget.brands.length / 2).ceil();
    final listHeight =
        CategoryBrandsStrip._logoSize + 34 + CategoryBrandsStrip._rowGap + CategoryBrandsStrip._logoSize + 34;
    final showHint = _canScroll && !_atEnd;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: listHeight,
          child: Stack(
            children: [
              ListView.separated(
                controller: _scroll,
                scrollDirection: Axis.horizontal,
                physics: AppScrollPerf.physics,
                cacheExtent: AppScrollPerf.horizontalCacheExtent,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: columns,
                separatorBuilder: (_, __) => const SizedBox(width: CategoryBrandsStrip._colGap),
                itemBuilder: (_, col) {
                  final top = widget.brands[col * 2];
                  final bottomIndex = col * 2 + 1;
                  final bottom = bottomIndex < widget.brands.length ? widget.brands[bottomIndex] : null;
                  return SizedBox(
                    width: CategoryBrandsStrip._tileWidth,
                    child: Column(
                      children: [
                        _BrandTile(
                          brand: top,
                          categoryId: widget.categoryId,
                          subcategoryId: widget.subcategoryId,
                        ),
                        const SizedBox(height: CategoryBrandsStrip._rowGap),
                        bottom != null
                            ? _BrandTile(
                                brand: bottom,
                                categoryId: widget.categoryId,
                                subcategoryId: widget.subcategoryId,
                              )
                            : const SizedBox(
                                height: CategoryBrandsStrip._logoSize + 34,
                              ),
                      ],
                    ),
                  );
                },
              ),
              if (showHint)
                PositionedDirectional(
                  end: 0,
                  top: 0,
                  bottom: 0,
                  width: 46,
                  child: IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: AlignmentDirectional.centerStart,
                          end: AlignmentDirectional.centerEnd,
                          colors: [
                            t.surface.withValues(alpha: 0),
                            t.surface.withValues(alpha: 0.92),
                          ],
                        ),
                      ),
                      child: Align(
                        alignment: AlignmentDirectional.centerEnd,
                        child: Padding(
                          padding: const EdgeInsetsDirectional.only(end: 2),
                          child: AnimatedBuilder(
                            animation: _nudge,
                            builder: (context, child) {
                              final dx = 5 * Curves.easeInOut.transform(_nudge.value);
                              final isRtl = Directionality.of(context) == TextDirection.rtl;
                              return Transform.translate(
                                offset: Offset(isRtl ? -dx : dx, 0),
                                child: child,
                              );
                            },
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: t.surface,
                                shape: BoxShape.circle,
                                border: Border.all(color: t.accentSoft),
                                boxShadow: [
                                  BoxShadow(
                                    color: t.accent.withValues(alpha: 0.12),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                Directionality.of(context) == TextDirection.rtl
                                    ? Icons.chevron_left_rounded
                                    : Icons.chevron_right_rounded,
                                size: 18,
                                color: t.accent,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        if (_canScroll)
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 2, 18, 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: 0.16 + (_progress * 0.84),
                minHeight: 3,
                backgroundColor: t.accentSoft,
                color: t.accent,
              ),
            ),
          ),
      ],
    );
  }
}

class CategoryBrandsStripLoading extends StatelessWidget {
  const CategoryBrandsStripLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56 + 34 + 10 + 56 + 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, __) => const SizedBox(
          width: 82,
          child: Column(
            children: [
              ShimmerBox(height: 56, width: 56, radius: 28),
              SizedBox(height: 8),
              ShimmerBox(height: 10, width: 64, radius: 4),
              SizedBox(height: 10),
              ShimmerBox(height: 56, width: 56, radius: 28),
              SizedBox(height: 8),
              ShimmerBox(height: 10, width: 64, radius: 4),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandTile extends ConsumerWidget {
  final Brand brand;
  final String? categoryId;
  final String? subcategoryId;

  const _BrandTile({
    required this.brand,
    this.categoryId,
    this.subcategoryId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final name = brand.localizedName(lang);
    final t = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          final q = StringBuffer('brandId=${brand.id}&title=${Uri.encodeComponent(name)}');
          if (subcategoryId != null) {
            q.write('&subcategoryId=$subcategoryId');
          } else if (categoryId != null) {
            q.write('&categoryId=$categoryId');
          }
          context.push('/products?${q.toString()}');
        },
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: [
            _BrandLogoCircle(
              brand: brand,
              size: CategoryBrandsStrip._logoSize,
              padding: CategoryBrandsStrip._logoPadding,
            ),
            const SizedBox(height: 6),
            Text(
              name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                height: 1.2,
                fontWeight: FontWeight.w600,
                color: t.inkSoft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BrandLogoCircle extends StatelessWidget {
  final Brand brand;
  final double size;
  final double padding;

  const _BrandLogoCircle({
    required this.brand,
    required this.size,
    required this.padding,
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
    final inner = size - (padding * 2);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: t.surface,
        border: Border.all(color: t.hairline.withValues(alpha: 0.85)),
        boxShadow: [
          BoxShadow(
            color: t.ink.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: Padding(
          padding: EdgeInsets.all(padding),
          child: brand.logoUrl.isNotEmpty
              ? AppNetworkImage(
                  url: brand.logoUrl,
                  width: inner,
                  height: inner,
                  fit: BoxFit.contain,
                  backgroundColor: t.surface,
                )
              : ColoredBox(
                  color: _fallbackBg(context),
                  child: Center(
                    child: Text(
                      brand.initial ?? brand.name.characters.first,
                      style: TextStyle(
                        fontSize: size * 0.34,
                        fontWeight: FontWeight.w800,
                        color: t.accent,
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}
