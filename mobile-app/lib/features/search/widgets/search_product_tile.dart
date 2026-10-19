import 'package:flutter/material.dart';

import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import '../../../core/navigation/product_nav.dart';

/// إبراز الكلمة المطابقة داخل نص — النص المطابق بلون العالم وسميك.
class HighlightedText extends StatelessWidget {
  final String text;
  final String query;
  final TextStyle base;
  final TextStyle? highlight;
  final int? maxLinesGuard;

  const HighlightedText({
    super.key,
    required this.text,
    required this.query,
    required this.base,
    this.highlight,
    this.maxLinesGuard,
  });

  /// تطبيع خفيف للمقارنة (أرقام عربية-هندية + همزات + تا مربوطة).
  static String _normalize(String raw) {
    var out = raw.toLowerCase();
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const latinDigits = '0123456789';
    for (var i = 0; i < 10; i++) {
      out = out.replaceAll(arabicDigits[i], latinDigits[i]);
      out = out.replaceAll(persianDigits[i], latinDigits[i]);
    }
    out = out
        .replaceAll('أ', 'ا')
        .replaceAll('إ', 'ا')
        .replaceAll('آ', 'ا')
        .replaceAll('ٱ', 'ا')
        .replaceAll('ؤ', 'و')
        .replaceAll('ئ', 'ي')
        .replaceAll('ى', 'ي')
        .replaceAll('ة', 'ه');
    return out;
  }

  @override
  Widget build(BuildContext context) {
    final tokens = _normalize(query).split(RegExp(r'\s+')).where((t) => t.length >= 2).toList();
    final maxLines = maxLinesGuard ?? 2;
    if (tokens.isEmpty || text.isEmpty) {
      return Text(text, maxLines: maxLines, overflow: TextOverflow.ellipsis, style: base);
    }

    final normText = _normalize(text);
    // أول تطابق فقط يُبرز — يكفي لتوجيه العين.
    int? start;
    String? hit;
    for (final token in tokens) {
      final idx = normText.indexOf(token);
      if (idx >= 0 && (start == null || idx < start)) {
        start = idx;
        hit = token;
      }
    }
    if (start == null || hit == null) {
      return Text(text, maxLines: maxLines, overflow: TextOverflow.ellipsis, style: base);
    }
    // الاستبدالات كلها 1:1 فالفهارس تتطابق مع النص الأصلي.
    final end = start + hit.length;
    return Text.rich(
      TextSpan(
        style: base,
        children: [
          TextSpan(text: text.substring(0, start)),
          TextSpan(
            text: text.substring(start, end),
            style:
                highlight ??
                base.copyWith(color: context.worldTheme.accentDark, fontWeight: FontWeight.w900),
          ),
          TextSpan(text: text.substring(end)),
        ],
      ),
      maxLines: maxLines,
      overflow: TextOverflow.ellipsis,
    );
  }
}

/// شارة سبب المطابقة — تشرح للزبونة لماذا ظهر هذا المنتج.
class MatchReasonBadge extends StatelessWidget {
  final String query;
  final Product product;

  const MatchReasonBadge({super.key, required this.query, required this.product});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final reason = _reason();
    if (reason == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(top: 3),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: t.accentLight.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        reason,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: t.accentDark,
          height: 1.2,
        ),
      ),
    );
  }

  String? _reason() {
    final q = HighlightedText._normalize(query.trim());
    if (q.length < 2) return null;
    // مطابقة باركود/رمز صنف؟
    final digits = q.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 6) {
      final sku = product.sku.toLowerCase();
      if (sku.contains(digits)) return 'SKU';
      for (final shade in product.shades) {
        final sb = shade.barcode?.toLowerCase() ?? '';
        if (sb.contains(digits)) return 'باركود · Barcode';
      }
    }
    return null;
  }
}

/// بطاقة منتج مدمجة في نتائج البحث.
class SearchProductTile extends StatelessWidget {
  final Product product;
  final String lang;
  final String? query;

  const SearchProductTile({super.key, required this.product, required this.lang, this.query});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final brand = product.brandLabel;
    final category = product.category?.localizedName(lang) ?? '';
    final q = query;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.hairline.withValues(alpha: 0.65)),
        boxShadow: t.cardShadow,
      ),
      child: Material(
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        color: Colors.transparent,
        child: InkWell(
          onTap: () =>
              openProduct(context, product),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 58,
                    height: 58,
                    child: AppNetworkImage(
                      url: product.coverUrl,
                      fit: BoxFit.contain,
                      backgroundColor: t.blush,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (brand.isNotEmpty)
                        q != null && q.length >= 2
                            ? HighlightedText(
                                text: brand.toUpperCase(),
                                query: q,
                                maxLinesGuard: 1,
                                base: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                  color: t.accentDark,
                                ),
                              )
                            : Text(
                                brand.toUpperCase(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                  color: t.accentDark,
                                ),
                              ),
                      if (brand.isNotEmpty) const SizedBox(height: 2),
                      if (q != null && q.length >= 2)
                        HighlightedText(
                          text: product.localizedName(lang),
                          query: q,
                          base: TextStyle(
                            fontSize: 13.5,
                            height: 1.25,
                            fontWeight: FontWeight.w800,
                            color: t.ink,
                          ),
                        )
                      else
                        Text(
                          product.localizedName(lang),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13.5,
                            height: 1.25,
                            fontWeight: FontWeight.w800,
                            color: t.ink,
                          ),
                        ),
                      if (q != null) MatchReasonBadge(query: q, product: product),
                      if (category.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(
                          category,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            color: t.inkMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      formatPrice(product.price),
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: product.hasDiscount ? AppColors.sale : t.ink,
                      ),
                    ),
                    if (product.hasDiscount)
                      Text(
                        formatPrice(product.originalPrice),
                        style: TextStyle(
                          fontSize: 10,
                          color: t.inkMuted,
                          decoration: TextDecoration.lineThrough,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
