import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_search_scan_bar.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/home_feed.dart';
import '../../worlds/world_theme.dart';
import '../offers_strings.dart';
import 'offers_theme.dart';

/// رأس صفحة العروض: العنوان، البحث، شارة العرض السريع وشرائح تبقى داخل العروض.
class OffersHero extends ConsumerWidget {
  final double topPad;

  /// العرض السريع القائم فقط (null = لا شارة).
  final FlashSale? flashSale;

  /// لمس الشارة: ينقل إلى شريط العرض السريع في الصفحة.
  final VoidCallback? onFlashTap;

  const OffersHero({
    super.key,
    required this.topPad,
    this.flashSale,
    this.onFlashTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;

    return Padding(
      padding: EdgeInsets.fromLTRB(OffersTheme.hPad, topPad + 6, OffersTheme.hPad, 10),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
        decoration: OffersTheme.heroDecoration(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: AlignmentDirectional.topStart,
                      end: AlignmentDirectional.bottomEnd,
                      colors: [
                        OffersTheme.sale,
                        Color.lerp(OffersTheme.sale, t.accentDark, 0.35)!,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                    boxShadow: [
                      BoxShadow(
                        color: OffersTheme.sale.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.offersTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: OffersTheme.title(context, size: 21),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        s.discoverBestDeals,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: OffersTheme.body(context, size: 12.5),
                      ),
                    ],
                  ),
                ),
                // شارة العرض السريع — تظهر فقط والعرض قائم، وتنقل إلى شريطه.
                if (flashSale != null) ...[
                  const SizedBox(width: 8),
                  _FlashBadge(label: s.flashSale, semanticsLabel: s.offersJumpToFlash, onTap: onFlashTap),
                ],
              ],
            ),
            const SizedBox(height: 14),
            AppSearchScanBar(
              hint: s.searchHintHome,
              scanLabel: s.scan,
              fillColor: t.surface.withValues(alpha: 0.92),
              borderColor: t.accentSoft,
              onSearchTap: () => context.push('/search'),
              onScanTap: () => context.push('/scan'),
            ),
            const SizedBox(height: 14),
            // شرائح تُبقيها داخل العروض: الأولى تفتح القائمة الكاملة بالفرز والفلاتر.
            SizedBox(
              height: kMinTapTarget,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _Chip(
                    label: s.offersSortFilter,
                    icon: Icons.tune_rounded,
                    onTap: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(s.allOffers)}'),
                  ),
                  const SizedBox(width: 8),
                  _Chip(
                    label: s.offersBestSellingDeals,
                    onTap: () => context.push(
                      '/products?isPromo=1&isBestSeller=1&title=${Uri.encodeComponent(s.offersBestSellingDeals)}',
                    ),
                  ),
                  const SizedBox(width: 8),
                  _Chip(
                    label: s.offersNewDeals,
                    onTap: () => context.push('/products?isPromo=1&isNew=1&title=${Uri.encodeComponent(s.offersNewDeals)}'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.onTap, this.icon});

  static const _radius = BorderRadius.all(Radius.circular(AppCorners.pill));

  @override
  Widget build(BuildContext context) {
    final style = OffersTheme.chip(context);
    return AppTap(
      radius: _radius,
      onTap: onTap,
      child: Container(
        height: kMinTapTarget,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: OffersTheme.chipDecoration(context),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: style.color),
              const SizedBox(width: 6),
            ],
            Text(label, maxLines: 1, style: style),
          ],
        ),
      ),
    );
  }
}

/// «⚡ عرض سريع» بلون التخفيض — زر ينقل إلى شريط العرض.
class _FlashBadge extends StatelessWidget {
  final String label;
  final String semanticsLabel;
  final VoidCallback? onTap;

  const _FlashBadge({required this.label, required this.semanticsLabel, this.onTap});

  static const _radius = BorderRadius.all(Radius.circular(AppCorners.pill));

  @override
  Widget build(BuildContext context) {
    return AppTap(
      radius: _radius,
      semanticsLabel: semanticsLabel,
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: kMinTapTarget),
        child: Center(
          widthFactor: 1,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.sale.withValues(alpha: 0.1),
              borderRadius: _radius,
              border: Border.all(color: AppColors.sale.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.bolt_rounded, size: 13, color: AppColors.sale),
                const SizedBox(width: 3),
                Text(
                  label,
                  maxLines: 1,
                  style: AppText.micro.copyWith(color: AppColors.sale, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
