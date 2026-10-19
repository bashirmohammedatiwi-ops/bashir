import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import '../advisor_strings.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

/// بطاقة الروتين: خط زمني لخطوات العناية، كل خطوة بمنتجها، وإضافة الكل للسلة.
class AdvisorRoutineCard extends ConsumerStatefulWidget {
  final AdvisorRoutine routine;
  final bool animate;

  /// معرّف الرد في المحادثة — تُحفظ به حالة «أُضيف» فلا تعود بعد التمرير أو الاستعادة.
  /// بلا معرّف (مثل «روتيناتي») تبقى الحالة محلية.
  final int? entryId;

  /// أزرار «أوفر / الأرقى / منتجات مفردة» تخص آخر رد فقط — على روتين قديم تبني نسخة من طلب آخر.
  final bool showActions;
  const AdvisorRoutineCard({super.key, required this.routine, this.animate = true, this.entryId, this.showActions = true});

  @override
  ConsumerState<AdvisorRoutineCard> createState() => _AdvisorRoutineCardState();
}

class _AdvisorRoutineCardState extends ConsumerState<AdvisorRoutineCard> {
  bool _busy = false;
  bool _doneLocal = false;

  String _schedule(bool isAr) {
    final whens = widget.routine.steps.map((s) => s.when).toSet();
    if (whens.contains('both') || (whens.contains('am') && whens.contains('pm'))) return isAr ? 'صباحاً ومساءً' : 'Morning & night';
    if (whens.contains('pm')) return isAr ? 'مساءً' : 'Night';
    return isAr ? 'صباحاً' : 'Morning';
  }

  void _toggleSaved(bool saved) {
    HapticFeedback.selectionClick();
    final n = ref.read(savedRoutinesProvider.notifier);
    if (saved) {
      n.remove(widget.routine);
    } else {
      n.save(widget.routine);
      final s = ref.read(stringsProvider);
      AppSnackbar.success(
        context,
        s.isAr ? 'حُفظ في «${s.advisorMyRoutines}» — تجدينه في ملفكِ الجمالي' : 'Saved to “${s.advisorMyRoutines}” in your beauty profile',
      );
    }
  }

  Future<void> _addAll() async {
    if (_busy) return;
    setState(() => _busy = true);
    // ما عندها أصلاً من مشترياتها لا يُضاف مرة ثانية.
    final toBuy = widget.routine.steps.where((s) => !s.owned).toList();
    final added = await advisorAddRoutine(context, ref, toBuy.map((s) => s.product).toList());
    if (!mounted) return;
    if (added > 0) {
      final ctl = ref.read(advisorProvider.notifier);
      for (final st in toBuy) {
        ctl.track('cart', productId: st.product.id);
      }
      if (widget.entryId != null) ctl.markAdded(widget.entryId!);
    }
    setState(() {
      _busy = false;
      _doneLocal = added > 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.routine;
    final s = ref.s;
    final id = widget.entryId;
    final done = _doneLocal || (id != null && ref.watch(advisorProvider.select((x) => x.added.contains(id))));
    final saved = ref.watch(savedRoutinesProvider.select((l) => l.any((x) => x.key == SavedRoutine.keyOf(r))));
    final owned = r.steps.where((x) => x.owned).length;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AdvisorStyle.glassBorder),
          boxShadow: AdvisorStyle.shadow(1.1),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _Header(
                title: r.title,
                emoji: r.emoji,
                subtitle: [
                  r.isLook ? s.advisorMatchingPieces(r.steps.length) : '${s.stepsCount(r.steps.length)} • ${_schedule(s.isAr)}',
                  if (owned > 0) s.isAr ? '$owned عندكِ ✓' : '$owned owned ✓',
                  if (r.brand != null) '${s.isAr ? 'من' : 'by'} ${r.brand!.split(RegExp(r'\s+(?=[A-Za-z])')).last}',
                ].join(' • '),
                total: r.total,
                saved: saved,
                saveLabel: s.advisorSaveRoutine,
                onSave: r.raw.isEmpty ? null : () => _toggleSaved(saved),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 16, 14, 4),
                child: Column(
                  children: [
                    for (var i = 0; i < r.steps.length; i++)
                      StaggerIn(
                        index: i + 1,
                        animate: widget.animate,
                        step: const Duration(milliseconds: 130),
                        child: _StepTile(step: r.steps[i], number: i + 1, last: i == r.steps.length - 1),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 6, 14, 0),
                child: _AddAllButton(
                  isAr: s.isAr,
                  isLook: r.isLook,
                  partial: r.steps.any((s) => s.owned),
                  total: r.total,
                  busy: _busy,
                  done: done,
                  onTap: done ? () => openCartTab(context, ProviderScope.containerOf(context, listen: false)) : _addAll,
                ),
              ),
              // بدائل الروتين: أزرار واضحة داخل البطاقة بدل شرائح صغيرة في الأسفل (لآخر رد فقط).
              if (!widget.showActions)
                const SizedBox(height: 14)
              else
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                  child: Row(
                    children: [
                      Expanded(
                        child: _RoutineAction(
                          icon: Icons.savings_outlined,
                          label: r.isLook ? (s.isAr ? 'لوك أوفر' : 'Cheaper look') : (s.isAr ? 'أوفر' : 'Cheaper'),
                          chip: const AdvisorChip(label: 'نسخة أوفر', value: 'act:cheaper', emoji: '💸'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _RoutineAction(
                          icon: Icons.diamond_outlined,
                          label: s.isAr ? 'الأرقى' : 'Premium',
                          chip: const AdvisorChip(label: 'نسخة أرقى', value: 'unset:budget;set:sort=premium;act:routine', emoji: '💎'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _RoutineAction(
                          icon: Icons.grid_view_rounded,
                          label: s.isAr ? 'منتجات مفردة' : 'Single picks',
                          chip: const AdvisorChip(label: 'منتجات مفردة', value: 'act:recommend', emoji: '🛍️'),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String title;
  final String emoji;
  final String subtitle;
  final int total;
  final bool saved;
  final String saveLabel;
  final VoidCallback? onSave;
  const _Header({
    required this.title,
    required this.emoji,
    required this.subtitle,
    required this.total,
    required this.saved,
    required this.saveLabel,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: const BoxDecoration(gradient: AdvisorStyle.gradient),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          PositionedDirectional(
            end: -22,
            top: -30,
            child: Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.10)),
            ),
          ),
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                ),
                alignment: Alignment.center,
                child: Text(emoji, style: const TextStyle(fontSize: 22)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AdvisorStyle.text(size: 16, weight: FontWeight.w800, color: Colors.white, height: 1.3),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.85), height: 1.3),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                    child: Text(
                      formatPrice(total),
                      style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2),
                    ),
                  ),
                  if (onSave != null)
                    // «احفظي الروتين» — يبقى في «روتيناتي» بعد انتهاء المحادثة.
                    Semantics(
                      button: true,
                      toggled: saved,
                      label: saveLabel,
                      excludeSemantics: true,
                      child: Tooltip(
                        message: saveLabel,
                        child: InkResponse(
                          onTap: onSave,
                          radius: 22,
                          child: SizedBox.square(
                            dimension: 44,
                            child: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded, size: 22, color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StepTile extends StatelessWidget {
  final AdvisorRoutineStep step;
  final int number;
  final bool last;
  const _StepTile({required this.step, required this.number, required this.last});

  String _when(bool isAr) => switch (step.when) {
    'am' => isAr ? '☀️ صباحاً' : '☀️ Morning',
    'pm' => isAr ? '🌙 مساءً' : '🌙 Night',
    _ => isAr ? '☀️🌙 صباحاً ومساءً' : '☀️🌙 Morning & night',
  };

  @override
  Widget build(BuildContext context) {
    final p = step.product;
    final isAr = Directionality.of(context) == TextDirection.rtl;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFFBF5FD),
                    border: Border.all(color: const Color(0xFFEBD8F2), width: 1.4),
                  ),
                  alignment: Alignment.center,
                  child: Text(step.emoji, style: const TextStyle(fontSize: 17)),
                ),
                if (!last)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(2),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [BrandColors.orchidLight.withValues(alpha: 0.7), BrandColors.roseLight.withValues(alpha: 0.5)],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: last ? 8 : 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Wrap لا Row: مع خط أكبر أو شاشة ضيقة تنزل الشارات لسطر ثانٍ بدل أن تفيض.
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text('$number. ${step.label}', style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3)),
                      if (step.when != 'any')
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(color: AdvisorStyle.tint, borderRadius: BorderRadius.circular(10)),
                          child: Text(
                            _when(isAr),
                            style: AdvisorStyle.text(size: 10, weight: FontWeight.w700, color: AdvisorStyle.inkSoft, height: 1.4),
                          ),
                        ),
                      if (step.owned)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AdvisorStyle.successFg.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            isAr ? 'عندكِ ✓' : 'You have it ✓',
                            style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: AdvisorStyle.successFg, height: 1.4),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Material(
                    color: step.owned ? const Color(0xFFF4FBF6) : const Color(0xFFFCFAFD),
                    borderRadius: BorderRadius.circular(16),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => openAdvisorProduct(context, p),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AdvisorStyle.glassBorder),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                              child: AppNetworkImage(
                                url: p.image,
                                width: 48,
                                height: 48,
                                fit: BoxFit.contain,
                                radius: BorderRadius.circular(8),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (p.brand.isNotEmpty)
                                    Text(
                                      p.brand,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2),
                                    ),
                                  Text(
                                    p.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, height: 1.35),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    step.owned ? (isAr ? 'من مشترياتكِ' : 'From your orders') : formatPrice(p.price),
                                    style: AdvisorStyle.text(
                                      size: 12.5,
                                      weight: FontWeight.w800,
                                      color: step.owned
                                          ? AdvisorStyle.successFg
                                          : p.hasDiscount
                                          ? AppColors.sale
                                          : AdvisorStyle.ink,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // يتبع اتجاه النص: «افتحي» للأمام في العربي والإنجليزي.
                            const Icon(Icons.chevron_right_rounded, color: AdvisorStyle.inkMuted, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddAllButton extends StatelessWidget {
  final int total;
  final bool busy;
  final bool done;
  final bool isLook;
  final VoidCallback onTap;

  /// بعض الخطوات عندها: «أضيفي الناقص» بدل «الروتين كاملاً».
  final bool partial;
  final bool isAr;
  const _AddAllButton({
    required this.isAr,
    required this.total,
    required this.busy,
    required this.done,
    required this.onTap,
    this.isLook = false,
    this.partial = false,
  });

  @override
  Widget build(BuildContext context) {
    final idle = isLook
        ? (isAr ? 'أضيفي اللوك كاملاً' : 'Add the full look')
        : partial
        ? (isAr ? 'أضيفي الناقص فقط' : 'Add only what’s missing')
        : (isAr ? 'أضيفي الروتين كاملاً' : 'Add the full routine');
    final added = isLook
        ? (isAr ? 'أُضيف اللوك  •  عرض السلة' : 'Look added  •  View bag')
        : (isAr ? 'أُضيف الروتين  •  عرض السلة' : 'Routine added  •  View bag');
    return AnimatedContainer(
      duration: const Duration(milliseconds: 280),
      constraints: const BoxConstraints(minHeight: 52),
      decoration: BoxDecoration(
        gradient: done ? null : AdvisorStyle.gradient,
        color: done ? AdvisorStyle.successBg : null,
        borderRadius: BorderRadius.circular(18),
        boxShadow: done ? null : [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.32), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: busy ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: busy
                    ? const SizedBox(
                        key: ValueKey('b'),
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                      )
                    : done
                    ? Row(
                        key: const ValueKey('d'),
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle_rounded, color: AdvisorStyle.successFg, size: 20),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              added,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, color: AdvisorStyle.successFg, height: 1.2),
                            ),
                          ),
                        ],
                      )
                    : Row(
                        key: const ValueKey('i'),
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 19),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              idle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, color: Colors.white, height: 1.2),
                            ),
                          ),
                          Flexible(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                '  •  ${formatPrice(total)}',
                                style: AdvisorStyle.text(
                                  size: 12.5,
                                  weight: FontWeight.w700,
                                  color: Colors.white.withValues(alpha: 0.85),
                                  height: 1.2,
                                ),
                              ),
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

/// زر بديل للروتين (أوفر / الأرقى / منتجات مفردة): أيقونة فوق نص، بإطار ناعم.
class _RoutineAction extends ConsumerWidget {
  final IconData icon;
  final String label;
  final AdvisorChip chip;
  const _RoutineAction({required this.icon, required this.label, required this.chip});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final busy = ref.watch(advisorProvider.select((s) => s.thinking));
    return Opacity(
      opacity: busy ? 0.5 : 1,
      child: Material(
        color: AdvisorStyle.tint,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: busy
              ? null
              : () {
                  HapticFeedback.selectionClick();
                  ref.read(advisorProvider.notifier).tap(chip);
                },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AdvisorStyle.glassBorder),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 19, color: BrandColors.orchid),
                const SizedBox(height: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    label,
                    style: AdvisorStyle.text(size: 12, weight: FontWeight.w800, color: AdvisorStyle.ink, height: 1.2),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
