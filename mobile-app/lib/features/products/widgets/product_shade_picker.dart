import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import 'product_detail_theme.dart';

Color parseShadeHex(String hex, {Color fallback = const Color(0xFFCCCCCC)}) {
  final h = hex.replaceAll('#', '').trim();
  if (h.length < 6) return fallback;
  final v = h.length == 6 ? 'FF$h' : h;
  return Color(int.tryParse(v, radix: 16) ?? fallback.toARGB32());
}

List<Color> shadeGradientColors(ProductShade shade) {
  final start = parseShadeHex(shade.colorHex);
  final endRaw = shade.colorHexEnd?.trim();
  if (endRaw == null || endRaw.isEmpty || endRaw.toLowerCase() == shade.colorHex.toLowerCase()) {
    return [start, Color.lerp(start, Colors.white, 0.22)!];
  }
  return [start, parseShadeHex(endRaw, fallback: start)];
}

/// اختيار التدرج — شريط أفقي مع مؤشر تمرير واضح وتدرجات بارزة.
class ProductShadePicker extends StatefulWidget {
  final List<ProductShade> shades;
  final ProductShade? selected;
  final ValueChanged<ProductShade> onSelect;
  final AppStrings strings;

  const ProductShadePicker({
    super.key,
    required this.shades,
    required this.selected,
    required this.onSelect,
    required this.strings,
  });

  @override
  State<ProductShadePicker> createState() => _ProductShadePickerState();
}

class _ProductShadePickerState extends State<ProductShadePicker>
    with SingleTickerProviderStateMixin {
  static const _tileWidth = 78.0;
  static const _tileGap = 10.0;
  static const _railHeight = 118.0;

  final _scroll = ScrollController();
  late final AnimationController _hintPulse;

  bool _canScrollForward = false;
  bool _canScrollBack = false;
  double _scrollProgress = 0;
  bool _showScrollHint = true;
  int? _selectedIndex;

  @override
  void initState() {
    super.initState();
    _hintPulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _scroll.addListener(_syncScrollMetrics);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncScrollMetrics();
      _scrollToSelected(animate: false);
    });
  }

  @override
  void didUpdateWidget(covariant ProductShadePicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selected?.id != widget.selected?.id) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToSelected());
    }
    if (oldWidget.shades.length != widget.shades.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _syncScrollMetrics());
    }
  }

  @override
  void dispose() {
    _hintPulse.dispose();
    _scroll.removeListener(_syncScrollMetrics);
    _scroll.dispose();
    super.dispose();
  }

  void _syncScrollMetrics() {
    if (!mounted || !_scroll.hasClients) return;
    final max = _scroll.position.maxScrollExtent;
    final offset = _scroll.offset;
    final canForward = max > 12 && offset < max - 8;
    final canBack = offset > 8;
    final progress = max <= 0 ? 1.0 : (offset / max).clamp(0.0, 1.0);
    if (canForward != _canScrollForward ||
        canBack != _canScrollBack ||
        (progress - _scrollProgress).abs() > 0.01 ||
        (offset > 24 && _showScrollHint)) {
      setState(() {
        _canScrollForward = canForward;
        _canScrollBack = canBack;
        _scrollProgress = progress;
        if (offset > 24) _showScrollHint = false;
      });
    }
  }

  void _scrollToSelected({bool animate = true}) {
    if (!mounted || !_scroll.hasClients || widget.selected == null) return;
    final index = widget.shades.indexWhere((s) => s.id == widget.selected!.id);
    if (index < 0) return;
    _selectedIndex = index;
    final viewport = _scroll.position.viewportDimension;
    final target = (index * (_tileWidth + _tileGap)) - (viewport - _tileWidth) / 2;
    final clamped = target.clamp(0.0, _scroll.position.maxScrollExtent);
    if (animate) {
      _scroll.animateTo(
        clamped,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    } else {
      _scroll.jumpTo(clamped);
    }
    _syncScrollMetrics();
  }

  int get _currentVisibleIndex {
    if (_selectedIndex != null) return _selectedIndex! + 1;
    if (!_scroll.hasClients || widget.shades.isEmpty) return 1;
    final center = _scroll.offset + _scroll.position.viewportDimension / 2;
    final idx = ((center - _tileWidth / 2) / (_tileWidth + _tileGap)).round();
    return (idx + 1).clamp(1, widget.shades.length);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final shades = widget.shades;
    final selected = widget.selected;
    final needsScrollHint = shades.length > 3 && (_canScrollForward || _canScrollBack || _showScrollHint);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.strings.selectShade,
                    style: ProductDetailTheme.sectionTitleStyle(context).copyWith(fontSize: 15),
                  ),
                  if (selected != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      selected.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: t.inkSoft,
                        height: 1.2,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (shades.length > 1)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: t.accentLight,
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: t.accentSoft),
                ),
                child: Text(
                  widget.strings.shadePosition(_currentVisibleIndex, shades.length),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: t.accentDark,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: _railHeight,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              NotificationListener<ScrollNotification>(
                onNotification: (_) {
                  _syncScrollMetrics();
                  return false;
                },
                child: ListView.separated(
                  controller: _scroll,
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  itemCount: shades.length,
                  separatorBuilder: (_, __) => const SizedBox(width: _tileGap),
                  itemBuilder: (_, i) {
                    final shade = shades[i];
                    final active = selected?.id == shade.id;
                    return _ShadeGradientTile(
                      shade: shade,
                      active: active,
                      onTap: shade.inStock
                          ? () {
                              HapticFeedback.selectionClick();
                              setState(() => _selectedIndex = i);
                              widget.onSelect(shade);
                            }
                          : null,
                    );
                  },
                ),
              ),
              if (_canScrollBack) _ScrollFadeEdge(isStart: true, color: t.surface),
              if (_canScrollForward) _ScrollFadeEdge(isStart: false, color: t.surface),
              if (_canScrollForward && _showScrollHint)
                PositionedDirectional(
                  end: 0,
                  top: 0,
                  bottom: 0,
                  child: IgnorePointer(
                    child: Center(
                      child: AnimatedBuilder(
                        animation: _hintPulse,
                        builder: (context, child) {
                          final dx = 4 * math.sin(_hintPulse.value * math.pi);
                          final isRtl = Directionality.of(context) == TextDirection.rtl;
                          return Transform.translate(
                            offset: Offset(isRtl ? -dx : dx, 0),
                            child: child,
                          );
                        },
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: t.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: t.accentSoft),
                            boxShadow: t.cardShadow,
                          ),
                          child: Icon(
                            Directionality.of(context) == TextDirection.rtl
                                ? Icons.chevron_left_rounded
                                : Icons.chevron_right_rounded,
                            size: 20,
                            color: t.accent,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        if (needsScrollHint) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.swipe_rounded, size: 15, color: t.accent.withValues(alpha: 0.85)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  widget.strings.scrollAllShades,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: t.inkSoft,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _ShadeScrollTrack(progress: _scrollProgress, accent: t.accent, track: t.accentSoft),
        ],
      ],
    );
  }
}

class _ShadeScrollTrack extends StatelessWidget {
  final double progress;
  final Color accent;
  final Color track;

  const _ShadeScrollTrack({
    required this.progress,
    required this.accent,
    required this.track,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const thumbWidth = 42.0;
        final maxLeft = math.max(0.0, constraints.maxWidth - thumbWidth);
        return SizedBox(
          height: 4,
          child: Stack(
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: track,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: const SizedBox.expand(),
              ),
              AnimatedPositionedDirectional(
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeOutCubic,
                start: maxLeft * progress,
                top: 0,
                bottom: 0,
                width: thumbWidth,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(99),
                    boxShadow: [
                      BoxShadow(
                        color: accent.withValues(alpha: 0.35),
                        blurRadius: 6,
                        offset: const Offset(0, 1),
                      ),
                    ],
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

class _ScrollFadeEdge extends StatelessWidget {
  final bool isStart;
  final Color color;

  const _ScrollFadeEdge({required this.isStart, required this.color});

  @override
  Widget build(BuildContext context) {
    return PositionedDirectional(
      start: isStart ? 0 : null,
      end: isStart ? null : 0,
      top: 0,
      bottom: 0,
      width: 28,
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: isStart ? AlignmentDirectional.centerStart : AlignmentDirectional.centerEnd,
              end: isStart ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
              colors: [color, color.withValues(alpha: 0)],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShadeGradientTile extends StatelessWidget {
  final ProductShade shade;
  final bool active;
  final VoidCallback? onTap;

  const _ShadeGradientTile({
    required this.shade,
    required this.active,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final colors = shadeGradientColors(shade);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: active ? 1.03 : 1,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          width: 78,
          padding: const EdgeInsets.fromLTRB(6, 6, 6, 8),
          decoration: BoxDecoration(
            color: active ? t.accentLight.withValues(alpha: 0.65) : t.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: active ? t.accent : t.hairline.withValues(alpha: 0.85),
              width: active ? 2 : 1,
            ),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: t.accent.withValues(alpha: 0.18),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: colors,
                        ),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.65), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: colors.first.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                    ),
                    if (active)
                      DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.55), width: 1),
                        ),
                        child: Center(
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.28),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check_rounded, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    if (!shade.inStock)
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: t.ink.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Icon(Icons.block_rounded, color: t.surface, size: 18),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 7),
              Text(
                shade.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  height: 1.2,
                  color: active ? t.accentDark : t.inkSoft,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
