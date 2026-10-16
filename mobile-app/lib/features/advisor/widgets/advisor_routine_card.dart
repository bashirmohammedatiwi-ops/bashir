import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

/// بطاقة الروتين: خط زمني لخطوات العناية، كل خطوة بمنتجها، وإضافة الكل للسلة.
class AdvisorRoutineCard extends ConsumerStatefulWidget {
  final AdvisorRoutine routine;
  final bool animate;
  const AdvisorRoutineCard({super.key, required this.routine, this.animate = true});

  @override
  ConsumerState<AdvisorRoutineCard> createState() => _AdvisorRoutineCardState();
}

class _AdvisorRoutineCardState extends ConsumerState<AdvisorRoutineCard> {
  bool _busy = false;
  bool _done = false;

  String get _schedule {
    final whens = widget.routine.steps.map((s) => s.when).toSet();
    if (whens.contains('both') || (whens.contains('am') && whens.contains('pm'))) return 'صباحاً ومساءً';
    if (whens.contains('pm')) return 'مساءً';
    return 'صباحاً';
  }

  Future<void> _addAll() async {
    if (_busy) return;
    setState(() => _busy = true);
    final added = await advisorAddRoutine(context, ref, widget.routine.steps.map((s) => s.product).toList());
    if (!mounted) return;
    if (added > 0) {
      for (final st in widget.routine.steps) {
        ref.read(advisorProvider.notifier).track('cart', productId: st.product.id);
      }
    }
    setState(() {
      _busy = false;
      _done = added > 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.routine;
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
                  r.isLook ? '${r.steps.length} قطع متناسقة' : '${r.steps.length} خطوات • $_schedule',
                  if (r.brand != null) 'من ${r.brand!.split(RegExp(r'\s+(?=[A-Za-z])')).last}',
                ].join(' • '),
                total: r.total,
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
                padding: const EdgeInsets.fromLTRB(14, 6, 14, 14),
                child: _AddAllButton(
                  isLook: r.isLook,
                  total: r.total,
                  busy: _busy,
                  done: _done,
                  onTap: _done ? () => openCartTab(context, ProviderScope.containerOf(context, listen: false)) : _addAll,
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
  const _Header({required this.title, required this.emoji, required this.subtitle, required this.total});

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
                    Text(title, style: AdvisorStyle.text(size: 16, weight: FontWeight.w800, color: Colors.white, height: 1.3)),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.85), height: 1.3),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                child: Text(formatPrice(total), style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2)),
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

  String get _when => switch (step.when) {
        'am' => '☀️ صباحاً',
        'pm' => '🌙 مساءً',
        _ => '☀️🌙 صباحاً ومساءً',
      };

  @override
  Widget build(BuildContext context) {
    final p = step.product;
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
                  Row(
                    children: [
                      Text('$number. ${step.label}', style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3)),
                      if (step.when != 'any') ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(color: AdvisorStyle.tint, borderRadius: BorderRadius.circular(10)),
                          child: Text(_when, style: AdvisorStyle.text(size: 10, weight: FontWeight.w700, color: AdvisorStyle.inkSoft, height: 1.4)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Material(
                    color: const Color(0xFFFCFAFD),
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
                              child: AppNetworkImage(url: p.image, fit: BoxFit.contain, radius: BorderRadius.circular(8)),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (p.brand.isNotEmpty)
                                    Text(p.brand,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2)),
                                  Text(p.name,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, height: 1.35)),
                                  const SizedBox(height: 2),
                                  Text(formatPrice(p.price),
                                      style: AdvisorStyle.text(
                                        size: 12.5,
                                        weight: FontWeight.w800,
                                        color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink,
                                        height: 1.3,
                                      )),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_left_rounded, color: AdvisorStyle.inkMuted, size: 20),
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
  const _AddAllButton({required this.total, required this.busy, required this.done, required this.onTap, this.isLook = false});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 280),
      height: 52,
      decoration: BoxDecoration(
        gradient: done ? null : AdvisorStyle.gradient,
        color: done ? const Color(0xFFE9F7EF) : null,
        borderRadius: BorderRadius.circular(18),
        boxShadow: done
            ? null
            : [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.32), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: busy ? null : onTap,
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
                            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20),
                            const SizedBox(width: 6),
                            Text(isLook ? 'أُضيف اللوك  •  عرض السلة' : 'أُضيف الروتين  •  عرض السلة',
                                style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, color: AppColors.success, height: 1.2)),
                          ],
                        )
                      : Row(
                          key: const ValueKey('i'),
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 19),
                            const SizedBox(width: 8),
                            Text(isLook ? 'أضيفي اللوك كاملاً' : 'أضيفي الروتين كاملاً',
                                style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                            Text('  •  ${formatPrice(total)}',
                                style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.85), height: 1.2)),
                          ],
                        ),
            ),
          ),
        ),
      ),
    );
  }
}
