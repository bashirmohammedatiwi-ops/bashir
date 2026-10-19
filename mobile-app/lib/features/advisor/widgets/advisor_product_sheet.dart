import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import 'advisor_product_card.dart';
import 'advisor_style.dart';

/// خيارات منتج من ترشيحات «ديما»: لماذا رشّحته، وأسئلة سريعة عنه، والمقارنة.
Future<void> showAdvisorProductSheet(BuildContext context, AdvisorProduct p) {
  HapticFeedback.selectionClick();
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: false,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ProductSheet(product: p, parent: context),
  );
}

class _ProductSheet extends ConsumerWidget {
  final AdvisorProduct product;
  /// سياق الشاشة الأم — يبقى صالحاً بعد إغلاق الورقة.
  final BuildContext parent;
  const _ProductSheet({required this.product, required this.parent});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final ctl = ref.read(advisorProvider.notifier);
    final comparing = ref.watch(advisorProvider.select((s) => s.comparing));
    final inCompare = comparing.any((x) => x.id == p.id);
    final bottom = MediaQuery.paddingOf(context).bottom;

    void ask(String act, String label) {
      Navigator.of(context).pop();
      ctl.askOn(p, act, label);
    }

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.86),
      decoration: const BoxDecoration(
        color: Color(0xFFFFFBFD),
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(18, 10, 18, 18 + bottom),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFE6DCEC), borderRadius: BorderRadius.circular(4))),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 84,
                  height: 84,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: AdvisorStyle.glassBorder)),
                  child: AppNetworkImage(url: p.image, fit: BoxFit.contain),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (p.brand.isNotEmpty)
                        Text(p.brand, style: AdvisorStyle.text(size: 11, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.3)),
                      Text(p.name, maxLines: 3, overflow: TextOverflow.ellipsis, style: AdvisorStyle.text(size: 14, weight: FontWeight.w700, height: 1.4)),
                      const SizedBox(height: 4),
                      Text(formatPrice(p.price),
                          style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink, height: 1.3)),
                    ],
                  ),
                ),
                if (p.match > 0 || p.similarity != null) ...[
                  const SizedBox(width: 8),
                  MatchRing(match: p.similarity ?? p.match, size: 54),
                ],
              ],
            ),
            if (p.why.isNotEmpty || p.reasons.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text(p.similarity != null ? 'ليش يشبهه؟' : 'ليش رشحته لكِ؟', style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: AdvisorStyle.glassBorder)),
                child: Column(
                  children: [
                    for (final w in p.why.isNotEmpty ? p.why : p.reasons.map((r) => AdvisorWhy(ok: true, text: r)))
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            Icon(w.ok ? Icons.check_circle_rounded : Icons.remove_circle_outline_rounded,
                                size: 18, color: w.ok ? AppColors.success : AdvisorStyle.inkMuted),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                w.ok ? w.text : '${w.text} — غير مذكور',
                                style: AdvisorStyle.text(size: 13, weight: FontWeight.w600, color: w.ok ? AdvisorStyle.ink : AdvisorStyle.inkMuted, height: 1.45),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 18),
            Text('اسألي ديما عنه', style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _Action('🎯', 'هل يناسبني؟', () => ask('fit', '🎯 هل يناسبني؟')),
                _Action('💸', 'بديل أرخص', () => ask('dupe', '💸 بديل أرخص منه')),
                _Action('🔁', 'منتجات تشبهه', () => ask('similar', '🔁 شي يشبهه')),
                _Action('🧩', 'شنو يكمّله؟', () => ask('complement', '🧩 شنو يكمّله؟')),
                _Action('📖', 'طريقة الاستخدام', () => ask('howto', '📖 شلون أستخدمه؟')),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: _Wide(
                    icon: inCompare ? Icons.check_rounded : Icons.balance_rounded,
                    label: inCompare ? 'ضمن المقارنة' : 'أضيفي للمقارنة',
                    filled: false,
                    onTap: () {
                      final ok = ctl.toggleCompare(p);
                      if (!ok) {
                        AppSnackbar.show(parent, 'تكدرين تقارنين 3 منتجات بالمرة');
                        return;
                      }
                      HapticFeedback.selectionClick();
                      Navigator.of(context).pop();
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Wide(
                    icon: Icons.open_in_new_rounded,
                    label: 'صفحة المنتج',
                    filled: true,
                    onTap: () {
                      Navigator.of(context).pop();
                      ctl.track('click', productId: p.id);
                      if (parent.mounted) openAdvisorProduct(parent, p);
                    },
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

class _Action extends StatelessWidget {
  final String emoji;
  final String label;
  final VoidCallback onTap;
  const _Action(this.emoji, this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFEBDDF2))),
          child: Text('$emoji  $label', style: AdvisorStyle.text(size: 13, weight: FontWeight.w700, height: 1.2)),
        ),
      ),
    );
  }
}

class _Wide extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _Wide({required this.icon, required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: filled ? AdvisorStyle.gradient : null,
        color: filled ? null : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: filled ? null : Border.all(color: const Color(0xFFEBD3EE)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: SizedBox(
            height: 48,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: filled ? Colors.white : BrandColors.orchid),
                const SizedBox(width: 6),
                Text(label, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, color: filled ? Colors.white : const Color(0xFF6A3FA0), height: 1.2)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
