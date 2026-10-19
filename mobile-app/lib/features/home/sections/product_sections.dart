import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/price_view.dart';
import '../../../data/models/home_section.dart';
import '../../../data/models/product.dart';
import '../../catalog/catalog_providers.dart';
import '../../shell/main_shell.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';
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
        viewAllLabel: s.viewAll,
        onViewAll: section.showViewAll
            ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: 'isBestSeller=1',
              )
            : null,
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

  const ProductFilmStripSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.products.isEmpty) return const SizedBox.shrink();
    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: section.showTitle,
      child: ProductFilmStrip(products: section.products, speed: section.marqueeSpeed ?? 4),
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
  static const _gap = 12.0;

  /// مهلة الاستئناف بعد أن تترك العميلة الشريط.
  static const _resumeDelay = Duration(milliseconds: 1500);

  final _scroll = ScrollController();
  late final Ticker _ticker;
  Timer? _resumeTimer;
  Duration _last = Duration.zero;
  bool _userScrolling = false;
  bool _reduceMotion = false;

  // من آخر build — تُستخدم في حساب نقطة الالتفاف.
  double _cardWidth = 150;
  double _padStart = 0;

  /// طول دورة واحدة من المنتجات (بطاقة + فاصل لكل منتج) — المحتوى يتكرر كل period بالضبط.
  double get _period => widget.products.length * (_cardWidth + _gap);

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reduceMotion = MediaQuery.disableAnimationsOf(context);
    _syncTicker();
  }

  /// «تقليل الحركة»: شريط عادي يُمرَّر باليد فقط.
  void _syncTicker() {
    final shouldRun = !_reduceMotion && widget.products.length >= 2;
    if (shouldRun && !_ticker.isActive) {
      _last = Duration.zero;
      _ticker.start();
    } else if (!shouldRun && _ticker.isActive) {
      _ticker.stop();
    }
  }

  @override
  void didUpdateWidget(ProductFilmStrip old) {
    super.didUpdateWidget(old);
    if (old.products.length != widget.products.length) _syncTicker();
  }

  /// هل الشريط داخل الشاشة فعلاً؟ (يبقى مبنياً ضمن cacheExtent الرئيسية وهو خارجها.)
  bool _onScreen() {
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.hasSize || !box.attached) return false;
    final top = box.localToGlobal(Offset.zero).dy;
    final screenH = MediaQuery.sizeOf(context).height;
    return top < screenH && top + box.size.height > 0;
  }

  void _onTick(Duration elapsed) {
    final dt = (elapsed - _last).inMicroseconds / 1000000;
    _last = elapsed;
    if (!_scroll.hasClients || _userScrolling || widget.products.length < 2) return;
    // أول إطار بعد توقف (dt كبير) لا يقفز.
    if (dt <= 0 || dt > 0.08) return;
    if (!_onScreen()) return;
    final period = _period;
    final position = _scroll.position;
    if (period <= 0 || position.maxScrollExtent < _padStart + period) return;
    final pace = (widget.speed.clamp(1, 10)) * 22 * dt;
    var next = _scroll.offset + pace;
    // الالتفاف بطول دورة كاملة بعد الحشوة الأولى: المشهد قبله وبعده متطابق بالبكسل — لا قفزة.
    if (next >= _padStart + period) next -= period;
    _scroll.jumpTo(next);
  }

  bool _onScrollNotification(ScrollNotification n) {
    if (n.depth != 0) return false;
    if (n is ScrollStartNotification && n.dragDetails != null) {
      // سحب من العميلة: نتوقف ونترك القذف (fling) يكمل دون أن نقطعه.
      _resumeTimer?.cancel();
      _userScrolling = true;
    } else if (n is ScrollEndNotification && _userScrolling) {
      _resumeTimer?.cancel();
      _resumeTimer = Timer(_resumeDelay, () {
        if (!mounted) return;
        _userScrolling = false;
        _last = Duration.zero;
      });
    }
    return false;
  }

  @override
  void dispose() {
    _resumeTimer?.cancel();
    _ticker.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final width = Responsive.scaledCarouselWidth(context, 150);
    final height = Responsive.productCardHeight(context);
    final padH = Responsive.horizontalPadding(context);
    _cardWidth = width;
    _padStart = padH;

    final n = widget.products.length;
    final viewport = MediaQuery.sizeOf(context).width;
    final period = n * (width + _gap);
    // نُسخ كافية ليبقى مدى التمرير أطول من دورة كاملة + عرض الشاشة.
    final copies = n < 2 || period <= 0 ? 1 : math.max(2, ((viewport + width) / period).ceil() + 1);
    final itemCount = n * copies;

    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: SizedBox(
        height: height + 8,
        child: Stack(
          children: [
            ListView.separated(
              controller: _scroll,
              scrollDirection: Axis.horizontal,
              physics: const ClampingScrollPhysics(),
              padding: EdgeInsets.symmetric(horizontal: padH),
              itemCount: itemCount,
              separatorBuilder: (_, __) => const SizedBox(width: _gap),
              itemBuilder: (_, i) {
                final product = widget.products[i % n];
                return HomeProductCard(
                  key: ValueKey('${product.id}-$i'),
                  product: product,
                  width: width,
                  height: height,
                );
              },
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
  /// مواعيد انتهاء طلبنا تحديث الواجهة عندها — مرة واحدة لكل عرض، فلا حلقة تحديث
  /// إن بقي السيرفر يرسل العرض المنتهي.
  static final _refreshedEnds = <String>{};

  Timer? _timer;
  final _remaining = ValueNotifier<Duration>(Duration.zero);
  bool _ended = false;

  @override
  void initState() {
    super.initState();
    _ended = _isOver;
    _tick();
    if (!_ended) _startTimer();
  }

  bool get _isOver {
    final end = widget.section.endsAt;
    return end != null && !end.isAfter(DateTime.now());
  }

  @override
  void didUpdateWidget(FlashSaleHomeSection old) {
    super.didUpdateWidget(old);
    if (old.section.endsAt != widget.section.endsAt) {
      _ended = _isOver;
      _tick();
      if (_ended) {
        _timer?.cancel();
        _timer = null;
      } else {
        _startTimer();
      }
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _syncTimer(bool homeActive) {
    if (_ended) return;
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
    if (diff <= Duration.zero && !_ended && mounted) _onEnded(end);
  }

  /// انتهى العرض أمام العميلة: نخفي القسم (لا «عروض محدودة» منتهية) ونجلب الواجهة من جديد.
  void _onEnded(DateTime end) {
    _timer?.cancel();
    _timer = null;
    setState(() => _ended = true);
    final key = '${widget.section.id}@${end.toIso8601String()}';
    if (!_refreshedEnds.add(key)) return;
    final slug = HomeFeedScope.maybeOf(context)?.worldSlug;
    if (slug != null && slug.isNotEmpty) {
      ref.invalidate(worldFeedProvider(slug));
    } else {
      ref.invalidate(homeFeedProvider);
    }
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

    if (widget.section.products.isEmpty || _ended) return const SizedBox.shrink();

    final strings = ref.s;
    Widget? countdown;
    if (widget.section.endsAt != null) {
      countdown = ValueListenableBuilder<Duration>(
        valueListenable: _remaining,
        builder: (_, remaining, __) {
          if (remaining <= Duration.zero) return const SizedBox.shrink();
          // يوم فأكثر: «باقي 3 أيام» بدل «72:10:05».
          if (remaining.inHours >= 24) {
            return _DaysLeftPill(label: strings.daysLeft(remaining.inDays));
          }
          final h = remaining.inHours.toString().padLeft(2, '0');
          final m = (remaining.inMinutes % 60).toString().padLeft(2, '0');
          final s = (remaining.inSeconds % 60).toString().padLeft(2, '0');
          return HomeCountdownBoxes(hours: h, minutes: m, seconds: s);
        },
      );
    }

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

/// شارة «باقي يومين» للعروض الطويلة — بلون العالم.
class _DaysLeftPill extends StatelessWidget {
  final String label;

  const _DaysLeftPill({required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
        border: Border.all(color: t.accentSoft),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.schedule_rounded, size: 14, color: t.accentDark),
          const SizedBox(width: 5),
          Text(
            label,
            maxLines: 1,
            style: HomeTheme.chipLabel.copyWith(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: t.accentDark,
            ),
          ),
        ],
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
          ? () => openViewAllLink(context, query: section.viewAllQuery, fallbackQuery: '/packages')
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
                        PriceView.compact(
                          price: p.price,
                          oldPrice: hasDiscount ? p.originalPrice : null,
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
