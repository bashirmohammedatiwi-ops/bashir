import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../../../data/models/product.dart';
import '../../shell/main_shell.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import '../widgets/home_product_card.dart';
import '../widgets/home_product_row.dart';
import '../widgets/home_scroll_perf.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class ProductCarouselSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;
  final bool nested;

  const ProductCarouselSection({
    super.key,
    required this.section,
    this.compactTop = false,
    this.nested = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.products.isEmpty) return const SizedBox.shrink();
    final s = ref.s;

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: nested ? false : null,
      actionLabel: !nested && section.showViewAll ? s.viewAll : null,
      onAction: !nested && section.showViewAll
          ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: 'isBestSeller=1',
              )
          : null,
      child: HomeProductRow(
        products: section.products,
        itemWidth: Responsive.scaledCarouselWidth(
          context,
          cardSizeSpec(section.productCardSize ?? section.cardSize).productWidth,
        ),
      ),
    );
  }
}

/// بطاقات منتجات تتحرك باستمرار مثل شريط سينمائي، وتتوقف عند اللمس.
class ProductFilmStripSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;

  const ProductFilmStripSection({
    super.key,
    required this.section,
    this.compactTop = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.products.isEmpty) return const SizedBox.shrink();
    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: section.showTitle,
      child: ProductFilmStrip(
        products: section.products,
        speed: section.marqueeSpeed ?? 4,
      ),
    );
  }
}

class ProductFilmStrip extends StatefulWidget {
  final List<Product> products;
  final double speed;

  const ProductFilmStrip({super.key, required this.products, this.speed = 4});

  @override
  State<ProductFilmStrip> createState() => _ProductFilmStripState();
}

class _ProductFilmStripState extends State<ProductFilmStrip> with SingleTickerProviderStateMixin {
  final _scroll = ScrollController();
  late final Ticker _ticker;
  Duration _last = Duration.zero;
  bool _paused = false;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick)..start();
  }

  void _onTick(Duration elapsed) {
    if (!_scroll.hasClients || _paused || widget.products.length < 2) return;
    final dt = (elapsed - _last).inMicroseconds / 1000000;
    _last = elapsed;
    if (dt <= 0 || dt > 0.08) return;
    final max = _scroll.position.maxScrollExtent;
    if (max <= 0) return;
    final pace = (widget.speed.clamp(1, 10)) * 22 * dt;
    var next = _scroll.offset + pace;
    final loopAt = max / 2;
    if (next >= loopAt) next -= loopAt;
    _scroll.jumpTo(next);
  }

  @override
  void dispose() {
    _ticker.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final width = Responsive.scaledCarouselWidth(context, 150);
    final height = Responsive.productCardHeight(context);
    final items = [...widget.products, ...widget.products];
    return Listener(
      onPointerDown: (_) => _paused = true,
      onPointerUp: (_) => _paused = false,
      onPointerCancel: (_) => _paused = false,
      child: SizedBox(
        height: height + 8,
        child: Stack(
          children: [
            ListView.separated(
              controller: _scroll,
              scrollDirection: Axis.horizontal,
              physics: const ClampingScrollPhysics(),
              padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => HomeProductCard(
                key: ValueKey('${items[i].id}-$i'),
                product: items[i],
                width: width,
                height: height,
              ),
            ),
            PositionedDirectional(
              start: 0,
              top: 0,
              bottom: 0,
              width: 28,
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: AlignmentDirectional.centerStart,
                      end: AlignmentDirectional.centerEnd,
                      colors: [
                        context.worldTheme.canvas,
                        context.worldTheme.canvas.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            PositionedDirectional(
              end: 0,
              top: 0,
              bottom: 0,
              width: 28,
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: AlignmentDirectional.centerEnd,
                      end: AlignmentDirectional.centerStart,
                      colors: [
                        context.worldTheme.canvas,
                        context.worldTheme.canvas.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FlashSaleHomeSection extends ConsumerStatefulWidget {
  final HomeSection section;
  final bool compactTop;

  const FlashSaleHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  ConsumerState<FlashSaleHomeSection> createState() => _FlashSaleHomeSectionState();
}

class _FlashSaleHomeSectionState extends ConsumerState<FlashSaleHomeSection> {
  Timer? _timer;
  final _remaining = ValueNotifier<Duration>(Duration.zero);

  @override
  void initState() {
    super.initState();
    _tick();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _syncTimer(bool homeActive) {
    if (homeActive) {
      if (_timer == null || !(_timer?.isActive ?? false)) {
        _tick();
        _startTimer();
      }
    } else {
      _timer?.cancel();
      _timer = null;
    }
  }

  void _tick() {
    final end = widget.section.endsAt;
    if (end == null) return;
    final diff = end.difference(DateTime.now());
    _remaining.value = diff.isNegative ? Duration.zero : diff;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _remaining.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<int>(navIndexProvider, (_, next) => _syncTimer(next == 0));

    if (widget.section.products.isEmpty) return const SizedBox.shrink();

    Widget? countdown;
    if (widget.section.endsAt != null) {
      countdown = ValueListenableBuilder<Duration>(
        valueListenable: _remaining,
        builder: (_, remaining, __) {
          if (remaining <= Duration.zero) return const SizedBox.shrink();
          final h = remaining.inHours.toString().padLeft(2, '0');
          final m = (remaining.inMinutes % 60).toString().padLeft(2, '0');
          final s = (remaining.inSeconds % 60).toString().padLeft(2, '0');
          return HomeCountdownBoxes(hours: h, minutes: m, seconds: s);
        },
      );
    }

    final strings = ref.s;
    return HomeSectionShell(
      section: widget.section,
      compactTop: widget.compactTop,
      overline: strings.limitedOffers,
      headerTrailing: countdown,
      actionLabel: widget.section.showViewAll ? strings.viewAll : null,
      onAction: widget.section.showViewAll
          ? () => openViewAllLink(
                context,
                query: widget.section.viewAllQuery,
                fallbackQuery: 'isPromo=1',
              )
          : null,
      child: HomeProductRow(
        products: widget.section.products,
        showPromoBadge: true,
        itemWidth: Responsive.scaledCarouselWidth(
          context,
          cardSizeSpec(widget.section.productCardSize ?? widget.section.cardSize).productWidth,
        ),
      ),
    );
  }
}

class PackagesHomeSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;

  const PackagesHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.packages.isEmpty) return const SizedBox.shrink();
    final s = ref.s;

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      overline: s.collections,
      actionLabel: section.showViewAll ? s.viewAll : null,
      onAction: section.showViewAll
          ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: 'isPromo=1&title=الباقات',
              )
          : null,
      child: HomeHorizontalList(
        height: 220,
        padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 0, HomeTheme.paddingH, 4),
        itemCount: section.packages.length,
        itemGap: 14,
        itemBuilder: (_, i) {
          final p = section.packages[i];
          final hasDiscount = p.originalPrice != null && p.originalPrice! > p.price;
          final cardW = Responsive.scaledCarouselWidth(
            context,
            cardSizeSpec(p.cardSize ?? section.cardSize).width.toDouble(),
          );
          final t = context.worldTheme;
          return GestureDetector(
            onTap: () => openPackageLink(context, p),
            child: Container(
              width: cardW,
              decoration: BoxDecoration(
                color: t.surface,
                borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
                border: Border.all(color: t.divider),
                boxShadow: t.cardShadow,
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: p.coverUrl != null && p.coverUrl!.isNotEmpty
                        ? ProductCoverImage(
                            url: p.coverUrl!,
                            width: cardW,
                            fit: BoxFit.contain,
                            filterQuality: FilterQuality.medium,
                          )
                        : ColoredBox(
                            color: t.accentLight,
                            child: Center(
                              child: Icon(Icons.card_giftcard_rounded, color: t.accent, size: 36),
                            ),
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: HomeTheme.chipLabel.copyWith(color: t.ink),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(formatPrice(p.price), style: HomeTheme.price.copyWith(color: t.ink)),
                            if (hasDiscount) ...[
                              const SizedBox(width: 6),
                              Text(
                                formatPrice(p.originalPrice!),
                                style: HomeTheme.body(size: 11, color: t.inkMuted).copyWith(
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ],
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
