import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../advisor_models.dart';
import '../advisor_strings.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

/// بطاقة سؤال الاختبار: تقدّم متحرك، خيارات بلمسة، واختيار متعدد عند الحاجة.
class AdvisorQuizCard extends ConsumerStatefulWidget {
  final AdvisorQuiz quiz;
  final bool active;
  final bool animate;
  final ValueChanged<List<AdvisorChip>> onAnswer;

  const AdvisorQuizCard({super.key, required this.quiz, required this.active, required this.onAnswer, this.animate = true});

  @override
  ConsumerState<AdvisorQuizCard> createState() => _AdvisorQuizCardState();
}

class _AdvisorQuizCardState extends ConsumerState<AdvisorQuizCard> {
  final _picked = <String>{};
  bool _sent = false;

  bool _isSkip(AdvisorChip c) => c.value.startsWith('skip:');

  void _tap(AdvisorChip c) {
    if (!widget.active || _sent) return;
    HapticFeedback.selectionClick();
    if (!widget.quiz.multi || _isSkip(c)) {
      setState(() {
        _picked
          ..clear()
          ..add(c.value);
        _sent = true;
      });
      // لحظة قصيرة ليُرى الاختيار قبل الانتقال.
      Future<void>.delayed(const Duration(milliseconds: 240), () => widget.onAnswer([c]));
      return;
    }
    setState(() => _picked.contains(c.value) ? _picked.remove(c.value) : _picked.add(c.value));
  }

  void _next() {
    if (_picked.isEmpty || _sent) return;
    HapticFeedback.lightImpact();
    setState(() => _sent = true);
    widget.onAnswer(widget.quiz.options.where((o) => _picked.contains(o.value)).toList());
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.quiz;
    final s = ref.s;
    final still = MediaQuery.disableAnimationsOf(context);
    final from = (q.step - 1) / q.total;
    final to = q.step / q.total;
    // «أي روائح…؟ (اختاري واحدة أو اثنتين)» ← السؤال، والتلميح سطر تحته.
    final hintMatch = RegExp(r'\s*\(([^)]+)\)\s*$').firstMatch(q.question);
    final question = hintMatch == null ? q.question : q.question.substring(0, hintMatch.start).trim();
    final hint = hintMatch?.group(1) ?? (q.multi ? (s.isAr ? 'اختاري كل ما يناسبكِ' : 'Pick all that apply') : null);

    if (!widget.active) {
      return Padding(
        padding: const EdgeInsetsDirectional.only(start: 52, end: 48),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(16)),
          child: Row(
            children: [
              Text(
                '${q.step}/${q.total}',
                style: AdvisorStyle.text(size: 11, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w600, color: AdvisorStyle.inkSoft, height: 1.3),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AdvisorStyle.glassBorder),
          boxShadow: AdvisorStyle.shadow(1.1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome_rounded, size: 15, color: BrandColors.rose),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    q.title,
                    style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.3),
                  ),
                ),
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Text(
                    '${q.step} / ${q.total}',
                    style: AdvisorStyle.text(size: 12, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: widget.animate && !still ? from : to, end: to),
              duration: const Duration(milliseconds: 700),
              curve: Curves.easeOutCubic,
              builder: (_, v, __) => ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: SizedBox(
                  height: 6,
                  child: Stack(
                    children: [
                      const Positioned.fill(child: ColoredBox(color: AdvisorStyle.tint)),
                      FractionallySizedBox(
                        alignment: AlignmentDirectional.centerStart,
                        heightFactor: 1,
                        widthFactor: v.clamp(0.0, 1.0),
                        child: const DecoratedBox(decoration: BoxDecoration(gradient: AdvisorStyle.gradient)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(question, style: AdvisorStyle.text(size: 18, weight: FontWeight.w800, height: 1.35)),
            if (hint != null) ...[
              const SizedBox(height: 4),
              Text(
                hint,
                style: AdvisorStyle.text(size: 12, color: AdvisorStyle.inkMuted, weight: FontWeight.w600, height: 1.3),
              ),
            ],
            const SizedBox(height: 14),
            LayoutBuilder(
              builder: (_, c) {
                const gap = 10.0;
                final w = (c.maxWidth - gap) / 2;
                return Wrap(
                  spacing: gap,
                  runSpacing: gap,
                  children: [
                    for (var i = 0; i < q.options.length; i++)
                      StaggerIn(
                        index: i,
                        animate: widget.animate,
                        step: const Duration(milliseconds: 60),
                        from: const Offset(0, 10),
                        fromScale: 0.96,
                        child: SizedBox(
                          width: q.options.length.isOdd && i == q.options.length - 1 ? c.maxWidth : w,
                          child: _OptionTile(
                            chip: q.options[i],
                            selected: _picked.contains(q.options[i].value),
                            multi: q.multi && !_isSkip(q.options[i]),
                            enabled: widget.active && !_sent,
                            onTap: () => _tap(q.options[i]),
                            s: s,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
            if (q.multi) ...[
              const SizedBox(height: 14),
              AnimatedOpacity(
                duration: still ? Duration.zero : const Duration(milliseconds: 200),
                opacity: _picked.isEmpty ? 0.45 : 1,
                child: Semantics(
                  button: true,
                  enabled: _picked.isNotEmpty && !_sent,
                  label: s.advisorNextCount(_picked.length),
                  excludeSemantics: true,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: _next,
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: AdvisorStyle.gradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: _picked.isEmpty
                            ? null
                            : [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.3), blurRadius: 14, offset: const Offset(0, 5))],
                      ),
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            s.advisorNextCount(_picked.length),
                            style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w800, color: Colors.white, height: 1.2),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final AdvisorChip chip;
  final bool selected;
  final bool multi;
  final bool enabled;
  final VoidCallback onTap;
  final AppStrings s;

  const _OptionTile({
    required this.chip,
    required this.selected,
    required this.multi,
    required this.enabled,
    required this.onTap,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      enabled: enabled,
      selected: selected,
      // الاختيار المتعدد مربع اختيار لقارئ الشاشة.
      checked: multi ? selected : null,
      inMutuallyExclusiveGroup: !multi,
      label: chip.label,
      hint: multi ? (s.isAr ? 'اختيار متعدد' : 'Multiple choice') : null,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: enabled ? onTap : null,
        child: AnimatedScale(
          duration: still ? Duration.zero : const Duration(milliseconds: 160),
          scale: selected && !still ? 0.97 : 1,
          child: AnimatedContainer(
            duration: still ? Duration.zero : const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            constraints: const BoxConstraints(minHeight: 54),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            decoration: BoxDecoration(
              color: selected ? BrandColors.rose.withValues(alpha: 0.05) : AdvisorStyle.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: selected ? BrandColors.rose : AdvisorStyle.glassBorder, width: selected ? 1.6 : 1),
              boxShadow: selected
                  ? [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.18), blurRadius: 12, offset: const Offset(0, 4))]
                  : null,
            ),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: BrandColors.orchid.withValues(alpha: 0.12), blurRadius: 6)],
                  ),
                  alignment: Alignment.center,
                  child: Text(chip.emoji ?? '✨', style: const TextStyle(fontSize: 17)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    chip.label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AdvisorStyle.text(
                      size: 13,
                      weight: selected ? FontWeight.w800 : FontWeight.w600,
                      color: selected ? AdvisorStyle.accentText : AdvisorStyle.ink,
                      height: 1.3,
                    ),
                  ),
                ),
                if (multi || selected)
                  AnimatedContainer(
                    duration: still ? Duration.zero : const Duration(milliseconds: 200),
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: multi ? BoxShape.rectangle : BoxShape.circle,
                      borderRadius: multi ? BorderRadius.circular(6) : null,
                      gradient: selected ? AdvisorStyle.gradient : null,
                      border: selected ? null : Border.all(color: AdvisorStyle.accentBorder, width: 1.4),
                    ),
                    child: selected ? const Icon(Icons.check_rounded, size: 14, color: Colors.white) : null,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
