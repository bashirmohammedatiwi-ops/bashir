import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../advisor_cart.dart';
import '../advisor_models.dart';
import 'advisor_product_card.dart';
import 'advisor_style.dart';

/// اقتراح من مشترياتها: «قارب يخلص؟» أو «أكملي روتينكِ» — عنوان، سطر توضيح، وشريط منتجات.
class AdvisorPersonalCard extends ConsumerWidget {
  final AdvisorPersonal personal;
  final bool animate;
  final EdgeInsetsGeometry margin;

  /// مختصرة (للترحيب): صفّان صغيران بدل شريط البطاقات — أعلى الشاشة يبقى هادئاً.
  final bool compact;

  const AdvisorPersonalCard({
    super.key,
    required this.personal,
    this.animate = true,
    this.margin = const EdgeInsets.symmetric(horizontal: 12),
    this.compact = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final refill = personal.isRefill;
    final tint = refill ? const [Color(0xFFFFF3E8), Color(0xFFFDEEF4)] : const [Color(0xFFEDF3FD), Color(0xFFF3EAFD)];
    final accent = refill ? const Color(0xFFE08A3C) : const Color(0xFF6C7BD9);
    return Container(
      margin: margin,
      padding: const EdgeInsets.only(top: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: tint, begin: AlignmentDirectional.topStart, end: AlignmentDirectional.bottomEnd),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.9)),
        boxShadow: AdvisorStyle.shadow(0.6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(14, 0, 14, 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(11)),
                  child: Icon(refill ? Icons.autorenew_rounded : Icons.extension_rounded, size: 19, color: accent),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(personal.title, style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w800, height: 1.3)),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: BrandColors.rose.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              s.isAr ? 'لكِ' : 'For you',
                              style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.rose, height: 1.3),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        personal.note,
                        style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w600, color: AdvisorStyle.inkSoft, height: 1.45),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          if (compact)
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 2, 10, 10),
              child: Column(
                children: [
                  for (final p in personal.products.take(2))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: _MiniRow(product: p),
                    ),
                ],
              ),
            )
          else
            AdvisorProductRail(
              title: refill ? (s.isAr ? 'جدديه بلمسة' : 'Restock in one tap') : (s.isAr ? 'الأنسب لروتينكِ' : 'Best for your routine'),
              products: personal.products,
              animate: animate,
              highlightFirst: !refill,
            ),
        ],
      ),
    );
  }
}

/// صف منتج صغير: صورة، اسم، سعر، وزر إضافة.
class _MiniRow extends ConsumerWidget {
  final AdvisorProduct product;
  const _MiniRow({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final s = ref.s;
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openAdvisorProduct(context, p),
        child: Padding(
          padding: const EdgeInsets.all(7),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                child: AppNetworkImage(url: p.image, width: 46, fit: BoxFit.contain, radius: BorderRadius.circular(9)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, height: 1.35),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          formatPrice(p.price, lang: s.lang),
                          style: AdvisorStyle.text(
                            size: 12.5,
                            weight: FontWeight.w800,
                            color: p.hasDiscount ? AppColors.sale : BrandColors.orchid,
                            height: 1.3,
                          ),
                        ),
                        if (p.reasons.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              p.reasons.first,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AdvisorStyle.text(size: 11, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              if (p.inStock) AdvisorAddButton(product: p, size: 34) else AdvisorRestockButton(productId: p.id, size: 34),
            ],
          ),
        ),
      ),
    );
  }
}
