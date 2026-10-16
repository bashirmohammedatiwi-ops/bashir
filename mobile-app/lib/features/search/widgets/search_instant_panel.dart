import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/search_instant.dart';
import '../../advisor/widgets/advisor_search_prompt.dart';
import '../../worlds/world_theme.dart';

/// ما يظهر أثناء الكتابة: إكمالات النص، براندات وأقسام، وأقرب المنتجات — بطلب واحد سريع.
class SearchInstantPanel extends StatelessWidget {
  final String query;
  final SearchInstant? data;
  final bool loading;
  final ValueChanged<String> onSearch;
  final ValueChanged<String> onFill;
  final ValueChanged<InstantProduct> onProduct;
  final ValueChanged<SearchFacet> onBrand;
  final ValueChanged<SearchFacet> onCategory;

  const SearchInstantPanel({
    super.key,
    required this.query,
    required this.data,
    required this.loading,
    required this.onSearch,
    required this.onFill,
    required this.onProduct,
    required this.onBrand,
    required this.onCategory,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final d = data;
    final q = query.trim();

    if (d == null) {
      return loading ? const _Skeleton() : const SizedBox.shrink();
    }
    if (d.isEmpty && !loading) {
      return ListView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.fromLTRB(16, 28, 16, 24),
        children: [
          Icon(Icons.search_off_rounded, size: 40, color: t.inkMuted),
          const SizedBox(height: 10),
          Text('ما لقينا شي لـ«$q»', textAlign: TextAlign.center, style: AppText.title2.copyWith(color: t.ink)),
          const SizedBox(height: 4),
          Text('جربي كلمة ثانية أو اسم البراند', textAlign: TextAlign.center, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
          const SizedBox(height: 20),
          AdvisorSearchPrompt(query: q),
        ],
      );
    }

    return Stack(
      children: [
        ListView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            if (d.corrected != null)
              _Correction(text: d.corrected!, onTap: () => onSearch(d.corrected!)),
            for (final c in d.completions)
              _CompletionRow(query: q, completion: c, onTap: () => onSearch(c.text), onFill: () => onFill(c.text)),
            if (d.brands.isNotEmpty || d.categories.isNotEmpty)
              _FacetStrip(brands: d.brands, categories: d.categories, onBrand: onBrand, onCategory: onCategory),
            if (d.products.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 4),
                child: Text('منتجات', style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w800)),
              ),
              for (final p in d.products) _ProductRow(product: p, onTap: () => onProduct(p)),
            ],
            if (d.total > d.products.length)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: _SeeAll(total: d.total, onTap: () => onSearch(q)),
              ),
          ],
        ),
        // تحميل خفيف أعلى القائمة بدل إخفاء النتائج السابقة.
        if (loading)
          PositionedDirectional(
            top: 0,
            start: 0,
            end: 0,
            child: LinearProgressIndicator(minHeight: 2, backgroundColor: Colors.transparent, color: t.accent),
          ),
      ],
    );
  }
}

class _Correction extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  const _Correction({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Row(
          children: [
            Icon(Icons.auto_fix_high_rounded, size: 18, color: t.accent),
            const SizedBox(width: 10),
            Text('تقصدين ', style: AppText.body.copyWith(color: t.inkSoft)),
            Text(text, style: AppText.body.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
            Text('؟', style: AppText.body.copyWith(color: t.inkSoft)),
          ],
        ),
      ),
    );
  }
}

class _CompletionRow extends StatelessWidget {
  final String query;
  final SearchCompletion completion;
  final VoidCallback onTap;
  final VoidCallback onFill;
  const _CompletionRow({required this.query, required this.completion, required this.onTap, required this.onFill});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final text = completion.text;
    // الكلمات المكتملة المكتوبة عادية، والباقي غامق — مثل محركات البحث.
    // نقسم عند حدود الكلمات فقط حتى لا تنكسر الحروف العربية المتصلة.
    final lower = text.toLowerCase();
    final typed = query.toLowerCase();
    var split = 0;
    if (lower.startsWith(typed)) {
      final cut = typed.lastIndexOf(' ');
      split = cut > 0 && cut < text.length ? cut + 1 : 0;
    }
    final base = AppText.body.copyWith(color: t.ink, fontSize: 15);
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 4, 0),
        child: SizedBox(
          height: 50,
          child: Row(
            children: [
              Icon(completion.type == 'brand' ? Icons.sell_outlined : Icons.search_rounded, size: 20, color: t.inkMuted),
              const SizedBox(width: 14),
              Expanded(
                child: Text.rich(
                  TextSpan(children: [
                    if (split > 0) TextSpan(text: text.substring(0, split), style: base.copyWith(fontWeight: FontWeight.w500)),
                    TextSpan(text: text.substring(split), style: base.copyWith(fontWeight: FontWeight.w800)),
                  ]),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (completion.type == 'brand')
                Container(
                  margin: const EdgeInsetsDirectional.only(end: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(color: t.accentLight, borderRadius: BorderRadius.circular(8)),
                  child: Text('براند', style: AppText.micro.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
                ),
              // يملأ الحقل دون بحث، لتكمل الكتابة.
              IconButton(
                onPressed: onFill,
                visualDensity: VisualDensity.compact,
                icon: Icon(Icons.north_west_rounded, size: 18, color: t.inkMuted),
                tooltip: 'أكملي من هنا',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FacetStrip extends StatelessWidget {
  final List<SearchFacet> brands;
  final List<SearchFacet> categories;
  final ValueChanged<SearchFacet> onBrand;
  final ValueChanged<SearchFacet> onCategory;
  const _FacetStrip({required this.brands, required this.categories, required this.onBrand, required this.onCategory});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    Widget chip(String label, IconData icon, int count, VoidCallback onTap) => Padding(
          padding: const EdgeInsetsDirectional.only(end: 8),
          child: Material(
            color: t.surface,
            borderRadius: BorderRadius.circular(18),
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {
                HapticFeedback.selectionClick();
                onTap();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: t.hairline)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 15, color: t.accentDark),
                    const SizedBox(width: 6),
                    Text(label, style: AppText.label.copyWith(color: t.ink, fontSize: 13)),
                    const SizedBox(width: 5),
                    Text('$count', style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),
        );
    return SizedBox(
      height: 54,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        children: [
          for (final b in brands) chip(b.name, Icons.sell_outlined, b.count, () => onBrand(b)),
          for (final c in categories) chip(c.name, Icons.category_outlined, c.count, () => onCategory(c)),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final InstantProduct product;
  final VoidCallback onTap;
  const _ProductRow({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final p = product;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Row(
          children: [
            Container(
              width: 58,
              height: 58,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: t.divider)),
              child: Opacity(opacity: p.inStock ? 1 : 0.5, child: AppNetworkImage(url: p.image, fit: BoxFit.contain, radius: BorderRadius.circular(10))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (p.brand.isNotEmpty)
                    Text(p.brand,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.micro.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
                  Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppText.bodySmall.copyWith(color: t.ink, fontWeight: FontWeight.w600, height: 1.35)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(formatPrice(p.price),
                    style: AppText.label.copyWith(color: p.hasDiscount ? AppColors.sale : t.ink, fontWeight: FontWeight.w800, fontSize: 13)),
                if (p.hasDiscount)
                  Text(formatDiscount(p.discountPercent), style: AppText.micro.copyWith(color: AppColors.sale, fontWeight: FontWeight.w800)),
                if (!p.inStock) Text('نفد', style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SeeAll extends StatelessWidget {
  final int total;
  final VoidCallback onTap;
  const _SeeAll({required this.total, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: t.accentLight,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: SizedBox(
          height: 48,
          child: Center(
            child: Text('عرض كل النتائج ($total)', style: AppText.label.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
          ),
        ),
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      physics: const NeverScrollableScrollPhysics(),
      children: [
        for (var i = 0; i < 3; i++)
          const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: ShimmerBox(height: 14, width: 180, radius: 7)),
        const SizedBox(height: 10),
        for (var i = 0; i < 4; i++)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                ShimmerBox(width: 58, height: 58, radius: 14),
                SizedBox(width: 12),
                Expanded(child: ShimmerBox(height: 14, radius: 7)),
              ],
            ),
          ),
      ],
    );
  }
}
