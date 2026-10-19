import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/ui/app_countdown.dart';
import '../../../data/models/home_feed.dart';
import '../home_link.dart';
import '../home_strings.dart';
import 'home_product_row.dart';
import 'home_section_shell.dart';

/// شريط «العرض السريع» التلقائي — من feed.flashSale حين لا يضيف المشرف قسم
/// FLASH_SALE (كما في الموقع). عدّاد حتى الانتهاء، ثم يختفي الشريط كله بدل أن يبقى
/// «عرضاً محدوداً» انتهى.
class FlashSaleSection extends ConsumerStatefulWidget {
  final FlashSale flashSale;
  final String? title;

  const FlashSaleSection({super.key, required this.flashSale, this.title});

  @override
  ConsumerState<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends ConsumerState<FlashSaleSection> {
  bool _ended = false;

  bool get _live {
    final end = widget.flashSale.endsAt;
    return !_ended && end != null && end.isAfter(DateTime.now());
  }

  @override
  void didUpdateWidget(covariant FlashSaleSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    // موعد جديد من لوحة التحكم (تمديد العرض): يعود الشريط.
    if (oldWidget.flashSale.endsAt != widget.flashSale.endsAt) _ended = false;
  }

  @override
  Widget build(BuildContext context) {
    final products = widget.flashSale.products;
    if (products.isEmpty || !_live) return const SizedBox.shrink();
    final s = ref.s;
    void viewAll() => openViewAllLink(
      context,
      query: '/products?isPromo=1&title=${Uri.encodeComponent(s.allOffers)}',
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // «عرض الكل» في نهاية الصف — رأس القسم للعنوان والعدّاد فقط.
        HomeSectionHeader(
          title: widget.title ?? s.homeFlashSaleTitle,
          overline: s.limitedOffers,
          trailing: AppCountdown(
            endsAt: widget.flashSale.endsAt!,
            style: AppCountdownStyle.cells,
            onExpired: () {
              if (mounted) setState(() => _ended = true);
            },
          ),
        ),
        HomeProductRow(
          products: products,
          showPromoBadge: true,
          onViewAll: viewAll,
          viewAllLabel: s.viewAll,
        ),
      ],
    );
  }
}
