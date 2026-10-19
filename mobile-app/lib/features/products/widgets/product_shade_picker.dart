import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/perf/device_perf.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/ui/ui.dart';
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

  /// تقدّم التمرير — يقرؤه شريط التقدّم وحده، فلا يُعاد بناء كل البطاقات مع كل حركة.
  final _scrollProgress = ValueNotifier<double>(0);
  bool _showScrollHint = true;
  int? _selectedIndex;

  /// النبض يُعرض مرة واحدة لكل صفحة (دورتان ثم يسكن السهم).
  bool _pulsePlayed = false;

  @override
  void initState() {
    super.initState();
    // النبض يعمل فقط حين يُعرض سهم التلميح (انظري [_syncHintPulse]) — لا مؤقّت دائم.
    _hintPulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
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
    _scrollProgress.dispose();
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
    _scrollProgress.value = max <= 0 ? 1.0 : (offset / max).clamp(0.0, 1.0);
    final hideHint = offset > 24 && _showScrollHint;
    // إعادة البناء فقط حين تتغيّر الحالة الظاهرة (الحواف، التلميح) — لا مع كل بكسل.
    if (canForward != _canScrollForward || canBack != _canScrollBack || hideHint) {
      setState(() {
        _canScrollForward = canForward;
        _canScrollBack = canBack;
        if (hideHint) _showScrollHint = false;
      });
    }
    _syncHintPulse();
  }

  /// يشغّل نبض سهم التلميح فقط وهو ظاهر، دورتين ذهاباً وإياباً ثم يسكن — كان
  /// يتكرر بلا نهاية ويطلب إطاراً كل لحظة ما دام التلميح ظاهراً. على الأجهزة
  /// البسيطة يبقى السهم ثابتاً.
  void _syncHintPulse() {
    final want = _canScrollForward &&
        _showScrollHint &&
        widget.shades.length > 3 &&
        !DevicePerf.isLow &&
        !MediaQuery.disableAnimationsOf(context);
    if (want && !_pulsePlayed && !_hintPulse.isAnimating) {
      _pulsePlayed = true;
      // كل «فترة» اتجاه واحد: 4 = دورتان كاملتان، وتنتهي عند 0 (السهم في مكانه).
      _hintPulse.repeat(reverse: true, count: 4);
    } else if (!want && _hintPulse.isAnimating) {
      _hintPulse.stop();
      _hintPulse.value = 0;
    }
  }

  /// درجة نافدة: لا تُختار، لكن الضغط عليها يقول السبب بدل أن يبدو التطبيق متجمّداً.
  void _onSoldOutTap(ProductShade shade) {
    HapticFeedback.lightImpact();
    AppSnackbar.show(context, widget.strings.shadeSoldOut(shade.name));
  }

  void _scrollToSelected({bool animate = true}) {
    if (!mounted || !_scroll.hasClients || widget.selected == null) return;
    final index = widget.shades.indexWhere((s) => s.id == widget.selected!.id);
    if (index < 0) return;
    _selectedIndex = index;
    final viewport = _scroll.position.viewportDimension;
    final target = (index * (_tileWidth + _tileGap)) - (viewport - _tileWidth) / 2;
    final clamped = target.clamp(0.0, _scroll.position.maxScrollExtent);
    if (animate && !MediaQuery.disableAnimationsOf(context)) {
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
    // ترتيب الدرجة المختارة فعلاً — لا ما يقع في منتصف الشريط.
    final sel = widget.selected;
    if (sel != null) {
      final i = widget.shades.indexWhere((s) => s.id == sel.id);
      if (i >= 0) return i + 1;
    }
    if (_selectedIndex != null) return _selectedIndex! + 1;
    if (!_scroll.hasClients || widget.shades.isEmpty) return 1;
    final center = _scroll.offset + _scroll.position.viewportDimension / 2;
    final idx = ((center - _tileWidth / 2) / (_tileWidth + _tileGap)).round();
    return (idx + 1).clamp(1, widget.shades.length);
  }

  /// كل الدرجات بشبكة — اختيار سريع حين تكون كثيرة.
  Future<void> _openAll() async {
    HapticFeedback.selectionClick();
    final strings = widget.strings;
    final shades = widget.shades;
    // اسم الدرجة النافدة التي ضُغطت — يظهر داخل الورقة (الإشعار السفلي يختفي خلفها).
    // لا نتخلّص منه عند الإغلاق: الورقة تبقى تُبنى أثناء حركة خروجها وتستمع إليه.
    final soldOutNote = ValueNotifier<String?>(null);
    final picked = await showAppSheet<ProductShade>(
      context: context,
      title: strings.isAr ? 'اختاري درجتكِ' : 'Choose your shade',
      builder: (ctx) {
        final t = ctx.worldTheme;
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 10),
              child: ValueListenableBuilder<String?>(
                valueListenable: soldOutNote,
                builder: (_, note, __) => AnimatedSwitcher(
                  duration: MediaQuery.disableAnimationsOf(ctx) ? Duration.zero : const Duration(milliseconds: 180),
                  child: Text(
                    note != null
                        ? strings.shadeSoldOut(note)
                        : (strings.isAr
                            ? '${shades.where((x) => x.inStock).length} متوفرة من ${shades.length}'
                            : '${shades.where((x) => x.inStock).length} of ${shades.length} in stock'),
                    key: ValueKey(note),
                    style: AppText.caption.copyWith(
                      color: note != null ? AppColors.sale : t.inkMuted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
            Flexible(
              child: GridView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.62,
                ),
                itemCount: shades.length,
                itemBuilder: (_, i) {
                  final shade = shades[i];
                  return _ShadeGradientTile(
                    shade: shade,
                    active: widget.selected?.id == shade.id,
                    width: double.infinity,
                    strings: strings,
                    onTap: shade.inStock
                        ? () => Navigator.of(ctx).pop(shade)
                        : () {
                            HapticFeedback.lightImpact();
                            soldOutNote.value = shade.name;
                          },
                  );
                },
              ),
            ),
          ],
        );
      },
    );
    if (picked == null || !mounted) return;
    final i = widget.shades.indexWhere((x) => x.id == picked.id);
    setState(() => _selectedIndex = i >= 0 ? i : null);
    widget.onSelect(picked);
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
                    style: ProductDetailTheme.sectionTitleStyle(context),
                  ),
                  if (selected != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      selected.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(
                        fontWeight: FontWeight.w600,
                        color: t.inkSoft,
                        height: 1.2,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (shades.length > 5)
              // درجات كثيرة: كلها بشبكة واحدة بدل التمرير الطويل.
              Material(
                color: t.accentLight,
                shape: StadiumBorder(side: BorderSide(color: t.accentSoft)),
                child: InkWell(
                  customBorder: const StadiumBorder(),
                  onTap: _openAll,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.grid_view_rounded, size: 14, color: t.accentDark),
                        const SizedBox(width: 5),
                        Text(
                          widget.strings.isAr ? 'كل الدرجات (${shades.length})' : 'All shades (${shades.length})',
                          style: AppText.micro.copyWith(color: t.accentDark),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (shades.length > 1)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: t.accentLight,
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                  border: Border.all(color: t.accentSoft),
                ),
                child: Text(
                  widget.strings.shadePosition(_currentVisibleIndex, shades.length),
                  style: AppText.micro.copyWith(
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
              ListView.separated(
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
                    strings: widget.strings,
                    onTap: shade.inStock
                        ? () {
                            HapticFeedback.selectionClick();
                            setState(() => _selectedIndex = i);
                            widget.onSelect(shade);
                          }
                        : () => _onSoldOutTap(shade),
                  );
                },
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
                      // طبقة مستقلة: حركة السهم لا تعيد رسم شريط الدرجات ولا الصفحة.
                      child: RepaintBoundary(
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
                              Icons.chevron_right_rounded,
                              size: 20,
                              color: t.accent,
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
        if (needsScrollHint) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.swipe_rounded, size: 15, color: t.accent.withValues(alpha: 0.85)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  widget.strings.scrollAllShades,
                  style: AppText.caption.copyWith(
                    fontWeight: FontWeight.w700,
                    color: t.inkSoft,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ValueListenableBuilder<double>(
            valueListenable: _scrollProgress,
            builder: (_, progress, __) => _ShadeScrollTrack(progress: progress, accent: t.accent, track: t.accentSoft),
          ),
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
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                ),
                child: const SizedBox.expand(),
              ),
              AnimatedPositionedDirectional(
                duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 180),
                curve: Curves.easeOutCubic,
                start: maxLeft * progress,
                top: 0,
                bottom: 0,
                width: thumbWidth,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(AppCorners.pill),
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
  final AppStrings strings;
  final VoidCallback? onTap;
  /// عرض البطاقة (الشبكة تمرر عرض الخلية كاملاً).
  final double width;

  const _ShadeGradientTile({
    required this.shade,
    required this.active,
    required this.strings,
    this.onTap,
    this.width = 78,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final colors = shadeGradientColors(shade);
    final soldOut = !shade.inStock;
    final motion = MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 220);

    return Semantics(
      button: true,
      selected: active,
      enabled: !soldOut,
      label: soldOut ? '${shade.name}${strings.isAr ? '، ' : ', '}${strings.soldOut}' : shade.name,
      excludeSemantics: true,
      child: GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: active ? 1.03 : 1,
        duration: motion,
        curve: Curves.easeOutCubic,
        child: AnimatedContainer(
          duration: motion,
          curve: Curves.easeOutCubic,
          width: width,
          padding: const EdgeInsets.fromLTRB(6, 6, 6, 8),
          decoration: BoxDecoration(
            color: active ? t.accentLight.withValues(alpha: 0.65) : t.surface,
            borderRadius: BorderRadius.circular(AppCorners.lg),
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
                        borderRadius: BorderRadius.circular(AppCorners.sm),
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
                          borderRadius: BorderRadius.circular(AppCorners.sm),
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
                          borderRadius: BorderRadius.circular(AppCorners.sm),
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
                maxLines: soldOut ? 1 : 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: AppText.micro.copyWith(
                  fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                  height: 1.2,
                  color: soldOut ? t.inkMuted : (active ? t.accentDark : t.inkSoft),
                ),
              ),
              if (soldOut)
                Text(
                  strings.soldOutShort,
                  maxLines: 1,
                  style: AppText.micro.copyWith(color: AppColors.sale),
                ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
