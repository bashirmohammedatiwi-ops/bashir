import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/ui/app_sheet.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import '../advisor_strings.dart';
import 'advisor_product_card.dart';
import 'advisor_style.dart';

/// خيارات منتج من ترشيحات «ديما»: لماذا رشّحته، وأسئلة سريعة عنه، والمقارنة والإضافة.
///
/// [ref] مرجع الشاشة الأم (صاحبة [context]) — به تتم الإضافة للسلة بعد إغلاق الورقة.
/// بدونه تتم الإضافة والورقة مفتوحة ثم تُغلق.
Future<void> showAdvisorProductSheet(BuildContext context, AdvisorProduct p, {WidgetRef? ref}) {
  HapticFeedback.selectionClick();
  final s = ProviderScope.containerOf(context, listen: false).read(stringsProvider);
  return showAppSheet<void>(
    context: context,
    title: s.advisorProductOptions,
    builder: (_) => _ProductSheetBody(product: p),
    footer: _ProductSheetActions(product: p, parent: context, parentRef: ref),
  );
}

/// «ليش رشحته؟» وأسئلة «اسألي ديما عنه».
class _ProductSheetBody extends ConsumerWidget {
  final AdvisorProduct product;
  const _ProductSheetBody({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final s = ref.s;
    final ctl = ref.read(advisorProvider.notifier);

    // نص السؤال يُرسل لـ«ديما» كما هو — ردودها عربية.
    void ask(String act, String label) {
      Navigator.of(context).pop();
      ctl.askOn(p, act, label);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 6, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 84,
                height: 84,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: AdvisorStyle.glassBorder)),
                child: AppNetworkImage(url: p.image, width: 84, fit: BoxFit.contain),
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
                    Text(formatPrice(p.price, lang: s.lang),
                        style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink, height: 1.3)),
                    if (!p.inStock)
                      Text(s.advisorSoldOutShort, style: AdvisorStyle.text(size: 12, weight: FontWeight.w700, color: AdvisorStyle.warnFg, height: 1.4)),
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
            Text(
              p.similarity != null
                  ? (s.isAr ? 'ليش يشبهه؟' : 'Why is it similar?')
                  : (s.isAr ? 'ليش رشحته لكِ؟' : 'Why I picked it for you'),
              style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3),
            ),
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
                              size: 18, color: w.ok ? AdvisorStyle.successFg : AdvisorStyle.inkMuted),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              w.ok ? w.text : (s.isAr ? '${w.text} — غير مذكور' : '${w.text} — not listed'),
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
          Text(s.advisorAskAboutIt, style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _Action('🎯', s.askDeemaFit, () => ask('fit', '🎯 هل يناسبني؟')),
              _Action('💸', s.advisorCheaperAlt, () => ask('dupe', '💸 بديل أرخص منه')),
              _Action('🔁', s.isAr ? 'منتجات تشبهه' : 'Similar products', () => ask('similar', '🔁 شي يشبهه')),
              _Action('🧩', s.askDeemaComplement, () => ask('complement', '🧩 شنو يكمّله؟')),
              _Action('📖', s.askDeemaHowTo, () => ask('howto', '📖 شلون أستخدمه؟')),
            ],
          ),
        ],
      ),
    );
  }
}

/// أزرار مثبّتة أسفل الورقة: المقارنة وصفحة المنتج، والإضافة للسلة إن كان متوفراً.
class _ProductSheetActions extends ConsumerWidget {
  final AdvisorProduct product;
  /// سياق الشاشة الأم — يبقى صالحاً بعد إغلاق الورقة.
  final BuildContext parent;
  final WidgetRef? parentRef;
  const _ProductSheetActions({required this.product, required this.parent, this.parentRef});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final s = ref.s;
    final ctl = ref.read(advisorProvider.notifier);
    final inCompare = ref.watch(advisorProvider.select((st) => st.comparing.any((x) => x.id == p.id)));

    Future<void> addToCart() async {
      final pr = parentRef;
      if (pr == null) {
        // بلا مرجع للشاشة الأم: نضيف والورقة مفتوحة ثم نغلقها.
        final r = await advisorAddToCart(context, ref, p);
        if (r == AdvisorAddResult.added) ctl.track('cart', productId: p.id);
        if (context.mounted) Navigator.of(context).pop();
        return;
      }
      Navigator.of(context).pop();
      if (!parent.mounted) return;
      final r = await advisorAddToCart(parent, pr, p);
      if (r == AdvisorAddResult.added) ctl.track('cart', productId: p.id);
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: _Wide(
                icon: inCompare ? Icons.check_rounded : Icons.balance_rounded,
                label: inCompare ? s.advisorInCompare : s.advisorAddToCompare,
                selected: inCompare,
                filled: false,
                onTap: () {
                  final ok = ctl.toggleCompare(p);
                  if (!ok) {
                    AppSnackbar.show(parent, s.advisorCompareLimit);
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
                label: s.advisorProductPage,
                // مع زر الإضافة يصير هذا ثانوياً — زر واحد بارز فقط.
                filled: !p.inStock,
                onTap: () {
                  Navigator.of(context).pop();
                  ctl.track('click', productId: p.id);
                  if (parent.mounted) openAdvisorProduct(parent, p);
                },
              ),
            ),
          ],
        ),
        if (p.inStock) ...[
          const SizedBox(height: 10),
          _Wide(
            icon: Icons.add_shopping_cart_rounded,
            label: '${s.advisorAddToCart}  •  ${formatPrice(p.price, lang: s.lang)}',
            filled: true,
            onTap: addToCart,
          ),
        ],
      ],
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
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: AdvisorStyle.accentBorder)),
            child: Text('$emoji  $label', style: AdvisorStyle.text(size: 13, weight: FontWeight.w700, height: 1.2)),
          ),
        ),
      ),
    );
  }
}

class _Wide extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool filled;
  final bool selected;
  final VoidCallback onTap;
  const _Wide({required this.icon, required this.label, required this.filled, required this.onTap, this.selected = false});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: filled ? AdvisorStyle.gradient : null,
          color: filled ? null : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: filled ? null : Border.all(color: AdvisorStyle.accentBorder),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: SizedBox(
              height: 48,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 18, color: filled ? Colors.white : BrandColors.orchid),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, color: filled ? Colors.white : AdvisorStyle.accentText, height: 1.2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
