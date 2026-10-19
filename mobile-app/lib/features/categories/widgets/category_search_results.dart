import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../search/smart_query.dart';
import '../../worlds/world_theme.dart';
import '../category_browse.dart';

/// نتائج البحث داخل شجرة الأقسام — مع المسار وعدد المنتجات وإبراز الكلمة.
class CategorySearchResults extends ConsumerWidget {
  final String query;
  final List<IndexedCategory> results;

  const CategorySearchResults({
    super.key,
    required this.query,
    required this.results,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final lang = ref.watch(languageCodeProvider);
    final pad = Responsive.horizontalPadding(context);

    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: EdgeInsets.fromLTRB(pad, 4, pad, 28),
      children: [
        _SearchProductsRow(
          label: s.catSearchInProducts(query),
          onTap: () {
            HapticFeedback.lightImpact();
            context.push('/search?q=${Uri.encodeComponent(query)}');
          },
        ),
        const SizedBox(height: 16),
        if (results.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 40),
            child: Column(
              children: [
                Icon(
                  Icons.manage_search_rounded,
                  size: 52,
                  color: t.accent.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 12),
                // حرف واحد لا يكفي للمطابقة — «اكتبي حرفاً آخر» بدل «لا نتائج».
                if (normalizeQuery(query).length < 2)
                  Text(
                    s.catTypeMore,
                    style: AppText.title3.copyWith(color: t.ink),
                  )
                else ...[
                  Text(
                    s.catNoMatch,
                    style: AppText.title3.copyWith(color: t.ink),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    s.catNoMatchHint,
                    textAlign: TextAlign.center,
                    style: AppText.bodySmall.copyWith(color: t.inkMuted),
                  ),
                ],
              ],
            ),
          )
        else ...[
          Padding(
            padding: const EdgeInsetsDirectional.only(start: 4, bottom: 8),
            child: Text(
              s.catResults(results.length),
              style: AppText.caption.copyWith(color: t.inkMuted),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: BorderRadius.circular(AppCorners.lg),
              border: Border.all(color: t.divider),
            ),
            child: Column(
              children: [
                for (var i = 0; i < results.length; i++) ...[
                  if (i > 0) Divider(height: 1, indent: 76, color: t.divider),
                  _ResultRow(
                    entry: results[i],
                    query: query,
                    lang: lang,
                    countLabel: results[i].category.displayCount > 0
                        ? s.catProducts(
                            formatNumber(results[i].category.displayCount),
                          )
                        : null,
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _SearchProductsRow extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _SearchProductsRow({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: t.accentLight,
      borderRadius: BorderRadius.circular(AppCorners.lg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppCorners.lg),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: t.accent,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.search_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: AppText.label.copyWith(
                    color: t.accentDark,
                    fontSize: 13.5,
                  ),
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: t.accentDark),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  final IndexedCategory entry;
  final String query;
  final String lang;
  final String? countLabel;

  const _ResultRow({
    required this.entry,
    required this.query,
    required this.lang,
    required this.countLabel,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final name = entry.category.localizedName(lang);
    final path = entry.path(lang);
    return InkWell(
      onTap: () => entry.target(lang).open(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppCorners.sm),
              child: SizedBox(
                width: 52,
                height: 52,
                child: AppNetworkImage(
                  url: entry.category.imageUrl,
                  fit: BoxFit.cover,
                  backgroundColor: t.accentLight,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Highlighted(
                    text: name,
                    query: query,
                    style: AppText.title3.copyWith(color: t.ink),
                    highlight: t.accentDark,
                  ),
                  if (path.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      path,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: t.inkMuted),
                    ),
                  ],
                ],
              ),
            ),
            if (countLabel != null) ...[
              const SizedBox(width: 8),
              Text(
                countLabel!,
                style: AppText.micro.copyWith(
                  color: t.inkSoft,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
            Icon(Icons.chevron_right_rounded, color: t.inkMuted, size: 20),
          ],
        ),
      ),
    );
  }
}

/// يبرز أول تطابق للكلمة داخل الاسم (مع تجاهل التشكيل والهمزات).
class _Highlighted extends StatelessWidget {
  final String text;
  final String query;
  final TextStyle style;
  final Color highlight;

  const _Highlighted({
    required this.text,
    required this.query,
    required this.style,
    required this.highlight,
  });

  @override
  Widget build(BuildContext context) {
    final q = normalizeQuery(query);
    if (q.isEmpty)
      return Text(
        text,
        style: style,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      );
    // نطابق حرفاً بحرف على النسخة المطبّعة مع الحفاظ على مواضع النص الأصلي.
    final normChars = <String>[];
    final map = <int>[];
    for (var i = 0; i < text.length; i++) {
      final n = normalizeQuery(text[i]);
      if (n.isEmpty && text[i] != ' ') continue;
      normChars.add(n.isEmpty ? ' ' : n);
      map.add(i);
    }
    final hay = normChars.join();
    final at = hay.indexOf(q);
    if (at < 0 || at + q.length > map.length) {
      return Text(
        text,
        style: style,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      );
    }
    final start = map[at];
    final end = map[at + q.length - 1] + 1;
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(text: text.substring(0, start)),
          TextSpan(
            text: text.substring(start, end),
            style: TextStyle(
              color: highlight,
              fontWeight: FontWeight.w900,
              backgroundColor: highlight.withValues(alpha: 0.08),
            ),
          ),
          TextSpan(text: text.substring(end)),
        ],
      ),
      style: style,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
