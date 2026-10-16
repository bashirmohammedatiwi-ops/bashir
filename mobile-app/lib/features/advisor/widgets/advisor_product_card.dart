import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import 'advisor_product_sheet.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

const _cardWidth = 172.0;
const _cardHeight = 312.0;

/// شريط ترشيحات أفقي بعنوان صغير — البطاقات تظهر بتتابع.
class AdvisorProductRail extends StatelessWidget {
  final String? title;
  final List<AdvisorProduct> products;
  final bool animate;
  final bool highlightFirst;

  const AdvisorProductRail({
    super.key,
    this.title,
    required this.products,
    this.animate = true,
    this.highlightFirst = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 10),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome_rounded, size: 15, color: BrandColors.rose),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title ?? 'ترشيحاتي لكِ',
                  style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3),
                ),
              ),
              if (products.length > 2)
                Text(
                  '${products.length} منتجات',
                  style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3),
                ),
            ],
          ),
        ),
        SizedBox(
          height: _cardHeight + 18,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 2, 16, 16),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => StaggerIn(
              index: i,
              animate: animate && i < 4,
              step: const Duration(milliseconds: 90),
              from: const Offset(-26, 0),
              fromScale: 0.94,
              child: AdvisorProductCard(
                product: products[i],
                best: highlightFirst && i == 0,
                animate: animate,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class AdvisorProductCard extends ConsumerWidget {
  final AdvisorProduct product;
  final bool best;
  final bool animate;
  const AdvisorProductCard({super.key, required this.product, this.best = false, this.animate = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final selected = ref.watch(advisorProvider.select((s) => s.comparing.any((x) => x.id == p.id)));
    return SizedBox(
      width: _cardWidth,
      height: _cardHeight,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? BrandColors.rose : (best ? const Color(0xFFEBD3EE) : AdvisorStyle.glassBorder),
            width: selected ? 2 : (best ? 1.4 : 1),
          ),
          boxShadow: AdvisorStyle.shadow(best || selected ? 1.2 : 0.8),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              ref.read(advisorProvider.notifier).track('click', productId: p.id);
              openAdvisorProduct(context, p);
            },
            onLongPress: () => showAdvisorProductSheet(context, p),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ImageArea(product: p, best: best, animate: animate, selected: selected),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (p.brand.isNotEmpty)
                          Text(
                            p.brand,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2)
                                .copyWith(letterSpacing: 0.6),
                          ),
                        const SizedBox(height: 3),
                        Text(
                          p.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AdvisorStyle.text(size: 12.8, weight: FontWeight.w600, height: 1.38),
                        ),
                        const SizedBox(height: 7),
                        for (final r in p.reasons.take(2)) _Reason(text: r),
                        const Spacer(),
                        _PriceRow(product: p),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ImageArea extends StatelessWidget {
  final AdvisorProduct product;
  final bool best;
  final bool animate;
  final bool selected;
  const _ImageArea({required this.product, required this.best, required this.animate, required this.selected});

  @override
  Widget build(BuildContext context) {
    final p = product;
    return SizedBox(
      height: 152,
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: ColoredBox(
              color: const Color(0xFFFAF6FC),
              child: Opacity(
                opacity: p.inStock ? 1 : 0.45,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: AppNetworkImage(url: p.image, fit: BoxFit.contain, backgroundColor: const Color(0xFFFAF6FC)),
                ),
              ),
            ),
          ),
          if (p.match > 0 || p.similarity != null)
            PositionedDirectional(
              top: 8,
              start: 8,
              child: Column(
                children: [
                  MatchRing(match: p.similarity ?? p.match, animate: animate),
                  if (p.similarity != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text('شبه', style: AdvisorStyle.text(size: 9.5, weight: FontWeight.w800, color: AdvisorStyle.inkMuted, height: 1)),
                    ),
                ],
              ),
            ),
          PositionedDirectional(
            top: 6,
            end: 6,
            child: _MoreButton(product: p, selected: selected),
          ),
          if (p.saving >= 1000)
            PositionedDirectional(
              top: 44,
              end: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFFE9F7EF), borderRadius: BorderRadius.circular(10)),
                child: Text('أوفر ${_k(p.saving)}',
                    style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: const Color(0xFF137A48), height: 1.2)),
              ),
            ),
          if (best)
            PositionedDirectional(
              bottom: 8,
              start: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  gradient: AdvisorStyle.gradient,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.workspace_premium_rounded, size: 12, color: Colors.white),
                    const SizedBox(width: 3),
                    Text('الأنسب لكِ', style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                  ],
                ),
              ),
            ),
          if (p.shadeCount > 1)
            PositionedDirectional(
              bottom: 8,
              end: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AdvisorStyle.glassBorder),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.palette_outlined, size: 11, color: AdvisorStyle.inkSoft),
                    const SizedBox(width: 3),
                    Text('${p.shadeCount} درجة',
                        style: AdvisorStyle.text(size: 10, weight: FontWeight.w700, color: AdvisorStyle.inkSoft, height: 1.2)),
                  ],
                ),
              ),
            ),
          if (!p.inStock)
            Positioned.fill(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.75), borderRadius: BorderRadius.circular(20)),
                  child: Text('نفد حالياً', style: AdvisorStyle.text(size: 11, weight: FontWeight.w700, color: Colors.white, height: 1.2)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Reason extends StatelessWidget {
  final String text;
  const _Reason({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: const BoxDecoration(color: Color(0xFFFCE8F1), shape: BoxShape.circle),
            alignment: Alignment.center,
            child: const Icon(Icons.check_rounded, size: 10, color: BrandColors.rose),
          ),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AdvisorStyle.text(size: 11, weight: FontWeight.w600, color: AdvisorStyle.inkSoft, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final AdvisorProduct product;
  const _PriceRow({required this.product});

  @override
  Widget build(BuildContext context) {
    final p = product;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (p.hasDiscount)
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        formatPrice(p.originalPrice),
                        maxLines: 1,
                        overflow: TextOverflow.fade,
                        softWrap: false,
                        style: AdvisorStyle.text(size: 10.5, color: AdvisorStyle.inkMuted, height: 1.2).copyWith(
                          decoration: TextDecoration.lineThrough,
                          decorationColor: AdvisorStyle.inkMuted,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(formatDiscount(p.discountPercent),
                        style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: AppColors.sale, height: 1.2)),
                  ],
                ),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  formatPrice(p.price),
                  style: AdvisorStyle.text(
                    size: 14,
                    weight: FontWeight.w800,
                    color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (p.inStock) AdvisorAddButton(product: p),
      ],
    );
  }
}

/// زر الإضافة: حالة انتظار ثم علامة صح تتحول رجوعاً للزر.
class AdvisorAddButton extends ConsumerStatefulWidget {
  final AdvisorProduct product;
  final double size;
  const AdvisorAddButton({super.key, required this.product, this.size = 36});

  @override
  ConsumerState<AdvisorAddButton> createState() => _AdvisorAddButtonState();
}

enum _AddState { idle, busy, done }

class _AdvisorAddButtonState extends ConsumerState<AdvisorAddButton> {
  _AddState _s = _AddState.idle;

  Future<void> _add() async {
    if (_s != _AddState.idle) return;
    HapticFeedback.selectionClick();
    setState(() => _s = _AddState.busy);
    final r = await advisorAddToCart(context, ref, widget.product);
    if (!mounted) return;
    if (r == AdvisorAddResult.added) ref.read(advisorProvider.notifier).track('cart', productId: widget.product.id);
    setState(() => _s = r == AdvisorAddResult.added ? _AddState.done : _AddState.idle);
    if (r == AdvisorAddResult.added) {
      await Future<void>.delayed(const Duration(milliseconds: 1600));
      if (mounted) setState(() => _s = _AddState.idle);
    }
  }

  @override
  Widget build(BuildContext context) {
    final multiShade = widget.product.shadeCount > 1;
    final done = _s == _AddState.done;
    return GestureDetector(
      onTap: _add,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: done ? null : AdvisorStyle.gradient,
          color: done ? AppColors.success : null,
          boxShadow: [
            BoxShadow(
              color: (done ? AppColors.success : BrandColors.rose).withValues(alpha: 0.30),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
          child: switch (_s) {
            _AddState.busy => const SizedBox(
                key: ValueKey('busy'),
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
            _AddState.done => const Icon(Icons.check_rounded, key: ValueKey('done'), size: 20, color: Colors.white),
            _AddState.idle => Icon(
                multiShade ? Icons.palette_outlined : Icons.add_shopping_cart_rounded,
                key: const ValueKey('idle'),
                size: 18,
                color: Colors.white,
              ),
          },
        ),
      ),
    );
  }
}

String _k(int v) => v >= 1000 ? '${(v / 1000).round()} ألف' : formatPrice(v);

/// «⋯»: يفتح خيارات المنتج (ليش رشحته، يناسبني؟، بديل أرخص، قارني…).
class _MoreButton extends StatelessWidget {
  final AdvisorProduct product;
  final bool selected;
  const _MoreButton({required this.product, required this.selected});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => showAdvisorProductSheet(context, product),
      child: Padding(
        padding: const EdgeInsets.all(2),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: selected ? null : Colors.white.withValues(alpha: 0.94),
            gradient: selected ? AdvisorStyle.gradient : null,
            border: Border.all(color: selected ? Colors.transparent : AdvisorStyle.glassBorder),
          ),
          child: Icon(selected ? Icons.balance_rounded : Icons.more_horiz_rounded, size: 17, color: selected ? Colors.white : AdvisorStyle.inkSoft),
        ),
      ),
    );
  }
}

/// حلقة نسبة الملاءمة — تمتلئ وتعدّ عند الظهور.
class MatchRing extends StatelessWidget {
  final int match;
  final bool animate;
  final double size;
  const MatchRing({super.key, required this.match, this.animate = true, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final target = match.clamp(0, 100) / 100;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: animate ? 0 : target, end: target),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (_, v, __) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: BrandColors.orchid.withValues(alpha: 0.18), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: CustomPaint(
          painter: _RingPainter(v),
          child: Center(
            child: Directionality(
              textDirection: TextDirection.ltr,
              child: Text(
                '${(v * 100).round()}%',
                style: AdvisorStyle.text(size: size * 0.25, weight: FontWeight.w800, color: const Color(0xFF7A3FB8), height: 1),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double v;
  _RingPainter(this.v);

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.085;
    final rect = Rect.fromLTWH(stroke, stroke, size.width - stroke * 2, size.height - stroke * 2);
    canvas.drawArc(
      rect,
      0,
      math.pi * 2,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..color = const Color(0xFFF1E6F7),
    );
    if (v <= 0) return;
    canvas.drawArc(
      rect,
      -math.pi / 2,
      math.pi * 2 * v,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
          colors: const [BrandColors.orchidLight, BrandColors.orchid, BrandColors.rose],
          stops: [0, v * 0.5, v],
          transform: const GradientRotation(-math.pi / 2),
        ).createShader(rect),
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.v != v;
}
