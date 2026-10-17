import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/navigation/product_nav.dart';
import '../../../core/theme/app_text.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_feed.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import 'offers_theme.dart';

/// «عرض سريع»: شريط متدرّج بعدّاد حيّ (إن حُدد موعد) وبطاقات بالخصم والسعر.
class OffersFlashPulse extends ConsumerWidget {
  final FlashSale flashSale;

  const OffersFlashPulse({super.key, required this.flashSale});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final products = flashSale.products.take(12).toList();
    if (products.isEmpty) return const SizedBox.shrink();
    final ends = flashSale.endsAt;
    final live = ends != null && ends.isAfter(DateTime.now());

    return Padding(
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 0, OffersTheme.hPad, 14),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(
            begin: AlignmentDirectional.topStart,
            end: AlignmentDirectional.bottomEnd,
            colors: [const Color(0xFFE2457A), Color.lerp(t.accentDark, const Color(0xFFE2457A), 0.25)!],
          ),
          boxShadow: [
            BoxShadow(color: const Color(0xFFE2457A).withValues(alpha: 0.28), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -6),
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
                            Text(s.flashSale, style: AppText.title2.copyWith(color: Colors.white, height: 1.15)),
                            Text(
                              s.isAr ? 'أسعار لفترة محدودة — الكمية محدودة' : 'Limited time, limited stock',
                              style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.88)),
                            ),
                          ],
                        ),
                      ),
                      if (live) _Countdown(endsAt: ends),
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
                    itemBuilder: (_, i) => _FlashTile(product: products[i]),
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

/// بطاقة منتج صغيرة: الصورة، نسبة الخصم، السعر والقديم مشطوباً.
class _FlashTile extends StatelessWidget {
  final Product product;
  const _FlashTile({required this.product});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final p = product;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        openProduct(context, p);
      },
      child: Container(
        width: 124,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
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
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: const Color(0xFFE2457A), borderRadius: BorderRadius.circular(8)),
                        child: Text(
                          '-${p.discountPercent}%',
                          textDirection: TextDirection.ltr,
                          style: AppText.micro.copyWith(color: Colors.white),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.caption.copyWith(color: t.ink, fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(formatPrice(p.price), style: AppText.label.copyWith(color: const Color(0xFFC92E63), fontWeight: FontWeight.w800)),
            if (p.hasDiscount)
              Text(
                formatPrice(p.originalPrice),
                style: AppText.micro.copyWith(
                  color: t.inkMuted,
                  fontWeight: FontWeight.w500,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: t.inkMuted,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// عدّاد حيّ: س:د:ث (أو أيام).
class _Countdown extends StatefulWidget {
  final DateTime endsAt;
  const _Countdown({required this.endsAt});

  @override
  State<_Countdown> createState() => _CountdownState();
}

class _CountdownState extends State<_Countdown> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => mounted ? setState(() {}) : null);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final left = widget.endsAt.difference(DateTime.now());
    if (left.isNegative) return const SizedBox.shrink();
    String two(int n) => n.toString().padLeft(2, '0');
    Widget cell(String v) => Container(
          width: 30,
          padding: const EdgeInsets.symmetric(vertical: 4),
          alignment: Alignment.center,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
          child: Text(v, style: AppText.label.copyWith(color: const Color(0xFFC92E63), fontFeatures: const [FontFeature.tabularFigures()])),
        );
    final sep = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Text(':', style: AppText.label.copyWith(color: Colors.white)),
    );
    if (left.inDays >= 1) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
        child: Text(
          'باقي ${left.inDays} ${left.inDays == 1 ? 'يوم' : left.inDays == 2 ? 'يومين' : 'أيام'}',
          style: AppText.label.copyWith(color: const Color(0xFFC92E63)),
        ),
      );
    }
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [cell(two(left.inHours)), sep, cell(two(left.inMinutes % 60)), sep, cell(two(left.inSeconds % 60))],
      ),
    );
  }
}
