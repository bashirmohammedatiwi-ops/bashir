import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import '../advisor_strings.dart';
import 'advisor_product_card.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

// ───────────────────────────────────────────── المقارنة

/// جدول مقارنة أنيق: صور المنتجات أعلاه، صفوف بقيم تُبرز الأفضل، وحكم «ديما».
class AdvisorCompareCard extends ConsumerWidget {
  final AdvisorCompare compare;
  final bool animate;
  const AdvisorCompareCard({super.key, required this.compare, this.animate = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = compare;
    final s = ref.s;
    final n = c.products.length;
    final winner = c.winner >= 0 && c.winner < n ? c.products[c.winner] : null;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AdvisorStyle.glassBorder),
          boxShadow: AdvisorStyle.shadow(1.1),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 14, 12, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  for (var i = 0; i < n; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    Expanded(
                      child: _Head(product: c.products[i], winner: i == c.winner, s: s),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              for (var r = 0; r < c.rows.length; r++)
                StaggerIn(
                  index: r,
                  animate: animate,
                  step: const Duration(milliseconds: 60),
                  child: _Row(row: c.rows[r], n: n, shaded: r.isEven),
                ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                decoration: BoxDecoration(gradient: AdvisorStyle.softGradient, borderRadius: BorderRadius.circular(16)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.workspace_premium_rounded, size: 19, color: BrandColors.rose),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(c.verdict, style: AdvisorStyle.text(size: 13, weight: FontWeight.w700, height: 1.6)),
                    ),
                  ],
                ),
              ),
              // الحكم صدر — زر واحد يضيف الأنسب دون مغادرة المحادثة.
              if (winner != null && winner.inStock) ...[
                const SizedBox(height: 12),
                _AddToBagCta(
                  product: winner,
                  label: '${s.isAr ? 'أضيفي الأنسب للسلة' : 'Add the best pick to bag'}  •  ${formatPrice(winner.price, lang: s.lang)}',
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Head extends StatelessWidget {
  final AdvisorProduct product;
  final bool winner;
  final AppStrings s;
  const _Head({required this.product, required this.winner, required this.s});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: winner,
      label: winner ? '${product.name} — ${s.isAr ? 'الأنسب' : 'Best pick'}' : product.name,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => openAdvisorProduct(context, product),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 92,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AdvisorStyle.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: winner ? BrandColors.rose : Colors.transparent, width: 1.6),
                  ),
                  child: AppNetworkImage(url: product.image, fit: BoxFit.contain),
                ),
                if (winner)
                  PositionedDirectional(
                    top: -8,
                    start: 0,
                    end: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(gradient: AdvisorStyle.gradient, borderRadius: BorderRadius.circular(12)),
                        child: Text(
                          s.isAr ? 'الأنسب' : 'Best',
                          style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: Colors.white, height: 1.2),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              product.name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w700, height: 1.35),
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final AdvisorCompareRow row;
  final int n;
  final bool shaded;
  const _Row({required this.row, required this.n, required this.shaded});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 9),
      decoration: BoxDecoration(color: shaded ? AdvisorStyle.surface : null, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            row.label,
            style: AdvisorStyle.text(size: 11, weight: FontWeight.w800, color: AdvisorStyle.inkMuted, height: 1.2),
          ),
          const SizedBox(height: 5),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < n; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (row.best == i) ...[
                        const Icon(Icons.check_circle_rounded, size: 13, color: AdvisorStyle.successFg),
                        const SizedBox(width: 3),
                      ],
                      Flexible(
                        child: Text(
                          i < row.values.length ? row.values[i] : '—',
                          textAlign: TextAlign.center,
                          style: AdvisorStyle.text(
                            size: 12,
                            weight: row.best == i ? FontWeight.w800 : FontWeight.w600,
                            color: row.best == i ? AdvisorStyle.successFg : AdvisorStyle.ink,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────────────────────── هل يناسبني؟

/// «هل يناسبني؟»: الحكم ونقاطه، ثم الخطوة التالية — إضافة للسلة أو بديل أرخص،
/// وللنافد تنبيه التوفر وبديل متوفر.
class AdvisorFitCard extends ConsumerWidget {
  final AdvisorFit fit;
  final bool animate;
  const AdvisorFitCard({super.key, required this.fit, this.animate = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final f = fit;
    final p = f.product;
    final s = ref.s;
    final ctl = ref.read(advisorProvider.notifier);
    final (bg, fg, icon) = switch (f.tone) {
      'good' => (AdvisorStyle.successBg, AdvisorStyle.successFg, Icons.verified_rounded),
      'care' => (AdvisorStyle.warnBg, AdvisorStyle.warnFg, Icons.info_rounded),
      _ => (AdvisorStyle.tint, AdvisorStyle.accentText, Icons.thumb_up_alt_rounded),
    };
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AdvisorStyle.glassBorder),
          boxShadow: AdvisorStyle.shadow(1.1),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AdvisorAnchorTile(product: f.product, compact: true),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
                child: Row(
                  children: [
                    Icon(icon, color: fg, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        f.headline,
                        style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w800, color: fg, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              for (var i = 0; i < f.points.length; i++)
                StaggerIn(
                  index: i,
                  animate: animate,
                  step: const Duration(milliseconds: 90),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          margin: const EdgeInsets.only(top: 1),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: switch (f.points[i].ok) {
                              true => AdvisorStyle.successBg,
                              false => AdvisorStyle.warnBg,
                              null => AdvisorStyle.tint,
                            },
                          ),
                          child: Icon(
                            switch (f.points[i].ok) {
                              true => Icons.check_rounded,
                              false => Icons.priority_high_rounded,
                              null => Icons.circle,
                            },
                            size: f.points[i].ok == null ? 7 : 14,
                            color: switch (f.points[i].ok) {
                              true => AdvisorStyle.successFg,
                              false => AdvisorStyle.warnFg,
                              null => BrandColors.orchidLight,
                            },
                          ),
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(f.points[i].text, style: AdvisorStyle.text(size: 13, color: AdvisorStyle.inkSoft, height: 1.6)),
                        ),
                      ],
                    ),
                  ),
                ),
              // الحكم صدر — الخطوة التالية هنا بلا مغادرة المحادثة («تحتاج حذر» تبقى بلا دفع للشراء).
              // نص السؤال يُرسل لـ«ديما» كما هو — ردودها عربية.
              if (p.inStock && f.tone != 'care') ...[
                const SizedBox(height: 12),
                _AddToBagCta(
                  product: p,
                  label: '${s.isAr ? 'أضيفيه للسلة' : 'Add it to bag'}  •  ${formatPrice(p.price, lang: s.lang)}',
                ),
                const SizedBox(height: 8),
                _OutlineAction(
                  icon: Icons.savings_outlined,
                  label: s.advisorCheaperAlt,
                  onTap: () => ctl.askOn(p, 'dupe', '💸 بديل أرخص منه'),
                ),
              ] else if (!p.inStock) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    AdvisorRestockButton(productId: p.id, size: 44),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _OutlineAction(
                        icon: Icons.autorenew_rounded,
                        label: s.advisorAvailableAlt,
                        onTap: () => ctl.askOn(p, 'similar', '🔁 شي يشبهه'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// زر الإضافة العريض (48) بتدرّج الهوية — ينتظر نتيجة السلة الفعلية قبل علامة الصح.
class _AddToBagCta extends ConsumerStatefulWidget {
  final AdvisorProduct product;
  final String label;
  const _AddToBagCta({required this.product, required this.label});

  @override
  ConsumerState<_AddToBagCta> createState() => _AddToBagCtaState();
}

class _AddToBagCtaState extends ConsumerState<_AddToBagCta> {
  bool _busy = false;
  bool _done = false;

  Future<void> _add() async {
    if (_busy) return;
    HapticFeedback.selectionClick();
    setState(() => _busy = true);
    final r = await advisorAddToCart(context, ref, widget.product);
    if (!mounted) return;
    final added = r == AdvisorAddResult.added;
    if (added) ref.read(advisorProvider.notifier).track('cart', productId: widget.product.id);
    setState(() {
      _busy = false;
      _done = added;
    });
    if (added) {
      await Future<void>.delayed(const Duration(milliseconds: 1800));
      if (mounted) setState(() => _done = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final still = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      enabled: !_busy,
      label: _done ? s.advisorAdded : widget.label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _add,
        child: AnimatedContainer(
          duration: still ? Duration.zero : const Duration(milliseconds: 250),
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            gradient: _done ? null : AdvisorStyle.gradient,
            color: _done ? AdvisorStyle.successBg : null,
            borderRadius: BorderRadius.circular(16),
            boxShadow: _done
                ? null
                : [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.28), blurRadius: 14, offset: const Offset(0, 5))],
          ),
          alignment: Alignment.center,
          child: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _done ? Icons.check_rounded : Icons.add_shopping_cart_rounded,
                      size: 18,
                      color: _done ? AdvisorStyle.successFg : Colors.white,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        _done ? s.advisorAdded : widget.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AdvisorStyle.text(
                          size: 13.5,
                          weight: FontWeight.w800,
                          color: _done ? AdvisorStyle.successFg : Colors.white,
                          height: 1.2,
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

/// زر ثانوي بحدّ رفيع (44) — «بديل أرخص» / «بديل متوفر».
class _OutlineAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _OutlineAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AdvisorStyle.accentBorder),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 17, color: BrandColors.orchid),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, color: AdvisorStyle.accentText, height: 1.2),
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

// ───────────────────────────────────────────── المنتج المرجعي

/// «نتحدث عن…»: بطاقة أفقية للمنتج محور الحديث.
class AdvisorAnchorTile extends ConsumerWidget {
  final AdvisorProduct product;
  final bool compact;
  const AdvisorAnchorTile({super.key, required this.product, this.compact = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final s = ref.s;
    final body = Material(
      color: compact ? AdvisorStyle.surface : Colors.white,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openAdvisorProduct(context, p),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: compact ? AdvisorStyle.glassBorder : AdvisorStyle.accentBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: AdvisorStyle.surface, borderRadius: BorderRadius.circular(14)),
                child: AppNetworkImage(url: p.image, width: 64, fit: BoxFit.contain),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!compact)
                      Text(
                        s.isAr ? 'نتحدث عن' : 'We’re talking about',
                        style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.rose, height: 1.2),
                      ),
                    if (p.brand.isNotEmpty)
                      Text(
                        p.brand,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.3),
                      ),
                    Text(
                      p.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, height: 1.35),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      formatPrice(p.price, lang: s.lang),
                      style: AdvisorStyle.text(
                        size: 12.5,
                        weight: FontWeight.w800,
                        color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              // المختصرة (داخل «هل يناسبني؟») أزرارها في البطاقة نفسها.
              if (!compact) ...[
                const SizedBox(width: 8),
                if (p.inStock) AdvisorAddButton(product: p, size: 38) else AdvisorRestockButton(productId: p.id, size: 38),
              ],
            ],
          ),
        ),
      ),
    );
    if (compact) return body;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: DecoratedBox(
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), boxShadow: AdvisorStyle.shadow(0.9)),
        child: body,
      ),
    );
  }
}
