import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/navigation/product_nav.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/home_feed.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import '../offers_strings.dart';
import 'offers_theme.dart';

/// هل العرض السريع قائم الآن: فيه منتجات ولم ينتهِ موعده (بلا موعد = قائم).
bool isFlashLive(DateTime? endsAt, List<Product> products) =>
    products.isNotEmpty && (endsAt?.isAfter(DateTime.now()) ?? true);

/// «عرض سريع»: شريط متدرّج بعدّاد حيّ (إن حُدد موعد) وبطاقات بالخصم والسعر.
///
/// يختفي وحده لحظة انتهاء الموعد ويبلّغ [onExpired] — فلا يبقى سعر عرض منتهٍ على الشاشة.
class OffersFlashPulse extends ConsumerStatefulWidget {
  final FlashSale flashSale;
  final VoidCallback? onExpired;

  const OffersFlashPulse({super.key, required this.flashSale, this.onExpired});

  @override
  ConsumerState<OffersFlashPulse> createState() => _OffersFlashPulseState();
}

class _OffersFlashPulseState extends ConsumerState<OffersFlashPulse> {
  bool _expired = false;

  @override
  void didUpdateWidget(covariant OffersFlashPulse oldWidget) {
    super.didUpdateWidget(oldWidget);
    // عرض جديد (موعد آخر بعد التحديث): يُقيَّم من جديد.
    if (oldWidget.flashSale.endsAt != widget.flashSale.endsAt) _expired = false;
  }

  void _onExpired() {
    if (!mounted) return;
    setState(() => _expired = true);
    widget.onExpired?.call();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final ends = widget.flashSale.endsAt;
    final products = widget.flashSale.products.take(12).toList();
    if (_expired || !isFlashLive(ends, products)) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(OffersTheme.hPad, 0, OffersTheme.hPad, 14),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(
            begin: AlignmentDirectional.topStart,
            end: AlignmentDirectional.bottomEnd,
            colors: [AppColors.sale, Color.lerp(t.accentDark, AppColors.sale, 0.25)!],
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.sale.withValues(alpha: 0.28),
              blurRadius: 18,
              offset: const Offset(0, 8),
              spreadRadius: -6,
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            PositionedDirectional(
              end: -20,
              top: -26,
              child: Icon(Icons.bolt_rounded, size: 130, color: Colors.white.withValues(alpha: 0.12)),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                  child: Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), shape: BoxShape.circle),
                        child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              s.flashSale,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.title2.copyWith(color: Colors.white, height: 1.15),
                            ),
                            Text(
                              s.offersFlashSubtitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.88)),
                            ),
                          ],
                        ),
                      ),
                      if (ends != null) ...[
                        const SizedBox(width: 8),
                        AppCountdown(
                          endsAt: ends,
                          style: AppCountdownStyle.cells,
                          color: AppColors.sale,
                          background: Colors.white,
                          onExpired: _onExpired,
                        ),
                      ],
                    ],
                  ),
                ),
                SizedBox(
                  height: 196,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                    itemCount: products.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (_, i) => _FlashTile(product: products[i], lang: s.lang),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// بطاقة منتج صغيرة: الصورة، نسبة الخصم، والسعر مع القديم مشطوباً.
class _FlashTile extends StatelessWidget {
  final Product product;
  final String lang;
  const _FlashTile({required this.product, required this.lang});

  static const _radius = BorderRadius.all(Radius.circular(18));

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final p = product;
    final name = p.localizedName(lang);
    return AppTap(
      radius: _radius,
      semanticsLabel: name,
      onTap: () => openProduct(context, p),
      child: Container(
        width: 124,
        padding: const EdgeInsets.all(8),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: _radius),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(child: ProductCoverImage(url: p.coverUrl, fit: BoxFit.contain)),
                  if (p.hasDiscount)
                    PositionedDirectional(
                      top: 0,
                      start: 0,
                      child: DiscountBadge(percent: p.discountPercent, small: true),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.caption.copyWith(color: t.ink, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            PriceView.compact(
              price: p.price,
              oldPrice: p.hasDiscount ? p.originalPrice : null,
            ),
          ],
        ),
      ),
    );
  }
}
