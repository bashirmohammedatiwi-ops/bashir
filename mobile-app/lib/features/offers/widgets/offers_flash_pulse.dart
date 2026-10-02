import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/product.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_feed.dart';
import '../../home/widgets/home_scroll_perf.dart';
import 'offers_theme.dart';

/// عرض سريع — بطاقة أنيقة بدون عدّاد.
class OffersFlashPulse extends ConsumerWidget {
  final FlashSale flashSale;

  const OffersFlashPulse({super.key, required this.flashSale});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final products = flashSale.products;
    if (products.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 0, OffersTheme.hPad, 14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: OffersTheme.surfaceCard(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: OffersTheme.brandSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.bolt_rounded, color: OffersTheme.brand, size: 18),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.flashSale, style: OffersTheme.title(size: 15, color: OffersTheme.ink)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 108,
              child: HomeHorizontalList(
                height: 108,
                padding: EdgeInsets.zero,
                itemCount: products.length.clamp(0, 10),
                itemBuilder: (_, i) {
                  final p = products[i];
                  return _ProductThumb(
                    product: p,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      context.push('/product/${p.slug.isNotEmpty ? p.slug : p.id}');
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductThumb extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;

  const _ProductThumb({
    required this.product,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            width: 118,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 118,
                    height: 76,
                    child: ColoredBox(
                      color: OffersTheme.canvas,
                      child: ProductCoverImage(url: product.coverUrl, fit: BoxFit.contain),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  product.nameAr ?? product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700),
                ),
                Row(
                  children: [
                    Text(
                      formatPrice(product.price),
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: OffersTheme.brand),
                    ),
                    if (product.hasDiscount) ...[
                      const SizedBox(width: 4),
                      Text(
                        formatPrice(product.originalPrice),
                        style: TextStyle(
                          fontSize: 9,
                          color: OffersTheme.inkMuted,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
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
