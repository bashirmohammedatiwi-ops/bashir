import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/search_instant.dart';
import '../../advisor/widgets/advisor_search_prompt.dart';
import '../../worlds/world_theme.dart';
import '../search_strings.dart';
import '../../../core/config/app_config.dart';

/// ما يظهر أثناء الكتابة: إكمالات النص، براندات وأقسام، وأقرب المنتجات — بطلب واحد سريع.
class SearchInstantPanel extends StatelessWidget {
  final AppStrings s;
  final String query;
  final SearchInstant? data;
  final bool loading;

  /// فشل آخر طلب — صف «تعذّر جلب الاقتراحات» مع «إعادة».
  final bool failed;
  final VoidCallback onRetry;
  final ValueChanged<String> onSearch;
  final ValueChanged<String> onFill;
  final ValueChanged<InstantProduct> onProduct;
  final ValueChanged<SearchFacet> onBrand;
  final ValueChanged<SearchFacet> onCategory;

  const SearchInstantPanel({
    super.key,
    required this.s,
    required this.query,
    required this.data,
    required this.loading,
    required this.failed,
    required this.onRetry,
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
    // الرد يخص الكلمة المكتوبة الآن (لا حرفاً سابقاً منها).
    final current = d != null && d.query.trim() == q;

    if (failed && !current) return _Offline(s: s, onRetry: onRetry);
    if (d == null || (d.isEmpty && !current)) {
      return loading ? const _Skeleton() : const SizedBox.shrink();
    }
    if (d.isEmpty) {
      if (loading) return const _Skeleton();
      return ListView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.fromLTRB(16, 28, 16, 24),
        children: [
          Icon(Icons.search_off_rounded, size: 40, color: t.inkMuted),
          const SizedBox(height: 10),
          Text(s.searchNoResultsTitle(q), textAlign: TextAlign.center, style: AppText.title2.copyWith(color: t.ink)),
          const SizedBox(height: 4),
          Text(s.searchNoResultsBody, textAlign: TextAlign.center, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
          // «ديما» بالعربي فقط.
          if (AppConfig.advisorFor(s.isAr ? 'ar' : 'en')) ...[
            const SizedBox(height: 20),
            AdvisorSearchPrompt(query: q),
          ],
        ],
      );
    }

    return Stack(
      children: [
        ListView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            if (d.corrected != null) _Correction(s: s, text: d.corrected!, onTap: () => onSearch(d.corrected!)),
            for (final c in d.completions)
              _CompletionRow(s: s, query: q, completion: c, onTap: () => onSearch(c.text), onFill: () => onFill(c.text)),
            if (d.brands.isNotEmpty || d.categories.isNotEmpty)
              _FacetStrip(brands: d.brands, categories: d.categories, onBrand: onBrand, onCategory: onCategory),
            if (d.products.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 4),
                child: Text(s.searchSuggestProducts, style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w800)),
              ),
              for (final p in d.products) _ProductRow(s: s, query: q, product: p, onTap: () => onProduct(p)),
            ],
            if (d.total > d.products.length)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: _SeeAll(label: s.searchSeeAll(d.total), onTap: () => onSearch(q)),
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

/// انقطاع أثناء الكتابة: رسالة واضحة وزر «إعادة» بدل مساحة فارغة.
class _Offline extends StatelessWidget {
  final AppStrings s;
  final VoidCallback onRetry;
  const _Offline({required this.s, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final row = Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 18, 8, 8),
      child: Row(
        children: [
          Icon(Icons.cloud_off_rounded, size: 20, color: t.inkMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Text(s.searchSuggestOffline, style: AppText.bodySmall.copyWith(color: t.inkSoft, fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.selectionClick();
              onRetry();
            },
            style: TextButton.styleFrom(
              foregroundColor: t.accentDark,
              minimumSize: const Size(kMinTapTarget, kMinTapTarget),
              textStyle: AppText.label,
            ),
            child: Text(s.retry),
          ),
        ],
      ),
    );
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: EdgeInsets.zero,
      children: [row],
    );
  }
}

/// تصحيح إملائي: المنتجات المعروضة للكلمة المصحّحة أصلاً — فنقولها خبراً لا سؤالاً.
class _Correction extends StatelessWidget {
  final AppStrings s;
  final String text;
  final VoidCallback onTap;
  const _Correction({required this.s, required this.text, required this.onTap});

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
            Expanded(
              child: Text.rich(
                TextSpan(children: [
                  TextSpan(text: s.searchCorrectedPrefix, style: AppText.body.copyWith(color: t.inkSoft)),
                  TextSpan(text: s.searchQuoted(text), style: AppText.body.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
                ]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompletionRow extends StatelessWidget {
  final AppStrings s;
  final String query;
  final SearchCompletion completion;
  final VoidCallback onTap;
  final VoidCallback onFill;
  const _CompletionRow({required this.s, required this.query, required this.completion, required this.onTap, required this.onFill});

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
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 4, 0),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 50),
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
                  decoration: BoxDecoration(color: t.accentLight, borderRadius: BorderRadius.circular(AppCorners.xs)),
                  child: Text(s.searchBrandBadge, style: AppText.micro.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
                ),
              // يملأ الحقل دون بحث، لتكمل الكتابة — السهم يشير إلى بداية الحقل في الاتجاهين.
              IconButton(
                onPressed: onFill,
                icon: Icon(rtl ? Icons.north_east_rounded : Icons.north_west_rounded, size: 18, color: t.inkMuted),
                tooltip: s.searchFillTooltip,
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
            shape: StadiumBorder(side: BorderSide(color: t.hairline)),
            child: InkWell(
              customBorder: const StadiumBorder(),
              onTap: () {
                HapticFeedback.selectionClick();
                onTap();
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 15, color: t.accentDark),
                    const SizedBox(width: 6),
                    Text(label, style: AppText.label.copyWith(color: t.ink, fontSize: 13)),
                    if (count > 0) ...[
                      const SizedBox(width: 5),
                      Text(formatNumber(count), style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700)),
                    ],
                  ],
                ),
              ),
            ),
          ),
        );
    return SizedBox(
      height: 60,
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
  final AppStrings s;
  final String query;
  final InstantProduct product;
  final VoidCallback onTap;
  const _ProductRow({required this.s, required this.query, required this.product, required this.onTap});

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
              // العرض فقط: الارتفاع يُترك ليحفظ نسبة الصورة عند فك ترميزها.
              child: p.inStock
                  ? AppNetworkImage(url: p.image, width: 50, fit: BoxFit.contain, radius: BorderRadius.circular(10))
                  // النافد باهت بغطاء بلون الخلفية نصف شفاف — نفس مظهر Opacity(0.5)
                  // بلا طبقة saveLayer لكل صف.
                  : Stack(
                      fit: StackFit.expand,
                      children: [
                        AppNetworkImage(
                          url: p.image,
                          width: 50,
                          fit: BoxFit.contain,
                          radius: BorderRadius.circular(10),
                        ),
                        ColoredBox(color: t.surface.withValues(alpha: 0.5)),
                      ],
                    ),
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
                  _HighlightedText(
                    text: p.name,
                    query: query,
                    base: AppText.bodySmall.copyWith(color: t.ink, fontWeight: FontWeight.w600, height: 1.35),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(formatPrice(p.price, lang: s.lang),
                    style: AppText.label.copyWith(color: p.hasDiscount ? AppColors.sale : t.ink, fontWeight: FontWeight.w800, fontSize: 13)),
                if (p.hasDiscount)
                  Text(formatDiscount(p.discountPercent), style: AppText.micro.copyWith(color: AppColors.sale, fontWeight: FontWeight.w800)),
                if (!p.inStock) Text(s.searchSoldOut, style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// إبراز الكلمة المطابقة داخل الاسم — بلون العالم وسميك، ليعرف النظر لماذا ظهر المنتج.
class _HighlightedText extends StatelessWidget {
  final String text;
  final String query;
  final TextStyle base;
  const _HighlightedText({required this.text, required this.query, required this.base});

  /// تطبيع حرف بحرف (أرقام هندية + همزات + تاء مربوطة) — الطول ثابت فالفهارس تبقى صحيحة.
  static String _normalize(String raw) {
    var out = raw.toLowerCase();
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    for (var i = 0; i < 10; i++) {
      out = out.replaceAll(arabicDigits[i], '$i').replaceAll(persianDigits[i], '$i');
    }
    return out
        .replaceAll(RegExp('[أإآٱ]'), 'ا')
        .replaceAll('ؤ', 'و')
        .replaceAll('ئ', 'ي')
        .replaceAll('ى', 'ي')
        .replaceAll('ة', 'ه');
  }

  @override
  Widget build(BuildContext context) {
    final plain = Text(text, maxLines: 2, overflow: TextOverflow.ellipsis, style: base);
    final tokens = _normalize(query).split(RegExp(r'\s+')).where((w) => w.length >= 2);
    if (text.isEmpty || tokens.isEmpty) return plain;
    // toLowerCase قد يغيّر الطول في حروف نادرة — حينها لا نُبرز بدل فهارس خاطئة.
    final norm = _normalize(text);
    if (norm.length != text.length) return plain;
    int? start;
    var len = 0;
    for (final w in tokens) {
      final i = norm.indexOf(w);
      if (i >= 0 && (start == null || i < start)) {
        start = i;
        len = w.length;
      }
    }
    if (start == null) return plain;
    final end = start + len;
    return Text.rich(
      TextSpan(style: base, children: [
        TextSpan(text: text.substring(0, start)),
        TextSpan(text: text.substring(start, end), style: base.copyWith(color: context.worldTheme.accentDark, fontWeight: FontWeight.w800)),
        TextSpan(text: text.substring(end)),
      ]),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }
}

class _SeeAll extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _SeeAll({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: t.accentLight,
      borderRadius: BorderRadius.circular(AppCorners.md),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppCorners.md),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48),
          child: Center(
            child: Text(label, textAlign: TextAlign.center, style: AppText.label.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
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
    // وميض واحد يعبر الهيكل كله (بدل متحكّم حركة لكل كتلة).
    return Skeleton(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          for (var i = 0; i < 3; i++)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: SkeletonBlock(height: 14, width: 180, radius: 7),
            ),
          const SizedBox(height: 10),
          for (var i = 0; i < 4; i++)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  SkeletonBlock(width: 58, height: 58, radius: 14),
                  SizedBox(width: 12),
                  Expanded(child: SkeletonBlock(height: 14, radius: 7)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
