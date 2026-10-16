import 'package:flutter/material.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../advisor_cart.dart';
import '../advisor_models.dart';
import 'advisor_product_card.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

// ───────────────────────────────────────────── المقارنة

/// جدول مقارنة أنيق: صور المنتجات أعلاه، صفوف بقيم تُبرز الأفضل، وحكم «ديما».
class AdvisorCompareCard extends StatelessWidget {
  final AdvisorCompare compare;
  final bool animate;
  const AdvisorCompareCard({super.key, required this.compare, this.animate = true});

  @override
  Widget build(BuildContext context) {
    final c = compare;
    final n = c.products.length;
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
                    Expanded(child: _Head(product: c.products[i], winner: i == c.winner)),
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
                    Expanded(child: Text(c.verdict, style: AdvisorStyle.text(size: 13, weight: FontWeight.w700, height: 1.6))),
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

class _Head extends StatelessWidget {
  final AdvisorProduct product;
  final bool winner;
  const _Head({required this.product, required this.winner});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
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
                  color: const Color(0xFFFAF6FC),
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
                      child: Text('الأنسب', style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
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
      decoration: BoxDecoration(color: shaded ? const Color(0xFFFBF8FD) : null, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(row.label, style: AdvisorStyle.text(size: 11, weight: FontWeight.w800, color: AdvisorStyle.inkMuted, height: 1.2)),
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
                        const Icon(Icons.check_circle_rounded, size: 13, color: AppColors.success),
                        const SizedBox(width: 3),
                      ],
                      Flexible(
                        child: Text(
                          i < row.values.length ? row.values[i] : '—',
                          textAlign: TextAlign.center,
                          style: AdvisorStyle.text(
                            size: 12,
                            weight: row.best == i ? FontWeight.w800 : FontWeight.w600,
                            color: row.best == i ? AppColors.success : AdvisorStyle.ink,
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

class AdvisorFitCard extends StatelessWidget {
  final AdvisorFit fit;
  final bool animate;
  const AdvisorFitCard({super.key, required this.fit, this.animate = true});

  @override
  Widget build(BuildContext context) {
    final f = fit;
    final (bg, fg, icon) = switch (f.tone) {
      'good' => (const Color(0xFFE9F7EF), const Color(0xFF137A48), Icons.verified_rounded),
      'care' => (const Color(0xFFFFF5E3), const Color(0xFFA8650A), Icons.info_rounded),
      _ => (const Color(0xFFF3EEF8), const Color(0xFF6A3FA0), Icons.thumb_up_alt_rounded),
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
                    Expanded(child: Text(f.headline, style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w800, color: fg, height: 1.35))),
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
                              true => const Color(0xFFE9F7EF),
                              false => const Color(0xFFFFF1DD),
                              null => const Color(0xFFF3EEF8),
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
                              true => AppColors.success,
                              false => const Color(0xFFD48A12),
                              null => BrandColors.orchidLight,
                            },
                          ),
                        ),
                        const SizedBox(width: 9),
                        Expanded(child: Text(f.points[i].text, style: AdvisorStyle.text(size: 13, color: AdvisorStyle.inkSoft, height: 1.6))),
                      ],
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

// ───────────────────────────────────────────── المنتج المرجعي

/// «نتحدث عن…»: بطاقة أفقية للمنتج محور الحديث.
class AdvisorAnchorTile extends StatelessWidget {
  final AdvisorProduct product;
  final bool compact;
  const AdvisorAnchorTile({super.key, required this.product, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final p = product;
    final body = Material(
      color: compact ? const Color(0xFFFCFAFD) : Colors.white,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openAdvisorProduct(context, p),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: compact ? AdvisorStyle.glassBorder : const Color(0xFFEBD3EE)),
          ),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: const Color(0xFFFAF6FC), borderRadius: BorderRadius.circular(14)),
                child: AppNetworkImage(url: p.image, fit: BoxFit.contain),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!compact)
                      Text('نتحدث عن', style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.rose, height: 1.2)),
                    if (p.brand.isNotEmpty)
                      Text(p.brand,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.3)),
                    Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, height: 1.35)),
                    const SizedBox(height: 2),
                    Text(formatPrice(p.price),
                        style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w800, color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink, height: 1.3)),
                  ],
                ),
              ),
              if (p.inStock && !compact) AdvisorAddButton(product: p, size: 38),
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
