import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/brand/brand_logo.dart';
import '../advisor_models.dart';
import 'advisor_orb.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

/// واجهة الترحيب: كرة «ديما» الكبيرة، تعريف قصير، بطاقات بدء، وأمثلة أسئلة.
class AdvisorWelcome extends StatelessWidget {
  final AdvisorReply reply;
  final List<String> prompts;
  final bool animate;
  final ValueChanged<AdvisorChip> onChip;
  final ValueChanged<String> onPrompt;

  const AdvisorWelcome({
    super.key,
    required this.reply,
    required this.prompts,
    required this.onChip,
    required this.onPrompt,
    this.animate = true,
  });

  static const _tints = [
    [Color(0xFFF3EAFD), Color(0xFFFBEFF7)],
    [Color(0xFFFDEEF4), Color(0xFFFFF5EE)],
    [Color(0xFFEDF3FD), Color(0xFFF3EEFD)],
    [Color(0xFFFFF3E8), Color(0xFFFDEEF4)],
    [Color(0xFFFBEAF3), Color(0xFFF3EAFD)],
    [Color(0xFFFFEEEA), Color(0xFFFFF6E6)],
  ];

  @override
  Widget build(BuildContext context) {
    var i = 0;
    Widget item(Widget child) => StaggerIn(index: i++, animate: animate, step: const Duration(milliseconds: 90), child: child);
    final msgs = reply.messages;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
      child: Column(
        children: [
          item(const AdvisorOrb(size: 108)),
          const SizedBox(height: 12),
          item(AdvisorGradientText('ديما', style: AdvisorStyle.text(size: 30, weight: FontWeight.w800, height: 1.15))),
          item(Text(
            'تفهمكِ، تقارن، وتختار لكِ الأنسب',
            style: AdvisorStyle.text(size: 13, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.5),
          )),
          const SizedBox(height: 14),
          if (msgs.isNotEmpty)
            item(Text(
              msgs.first,
              textAlign: TextAlign.center,
              style: AdvisorStyle.text(size: 15.5, weight: FontWeight.w700, height: 1.6),
            )),
          if (msgs.length > 1) ...[
            const SizedBox(height: 6),
            item(Text(
              msgs[1],
              textAlign: TextAlign.center,
              style: AdvisorStyle.text(size: 13, color: AdvisorStyle.inkSoft, height: 1.7),
            )),
          ],
          const SizedBox(height: 14),
          item(const Wrap(
            alignment: WrapAlignment.center,
            spacing: 6,
            runSpacing: 6,
            children: [
              _Trait('🗣️', 'تفهم لهجتكِ'),
              _Trait('🧪', 'تقرأ المكونات'),
              _Trait('💸', 'تراعي ميزانيتكِ'),
            ],
          )),
          const SizedBox(height: 20),
          if (reply.chips.isNotEmpty)
            item(LayoutBuilder(
              builder: (_, c) {
                const gap = 10.0;
                final w = (c.maxWidth - gap) / 2;
                return Wrap(
                  spacing: gap,
                  runSpacing: gap,
                  children: [
                    for (var k = 0; k < reply.chips.length; k++)
                      SizedBox(
                        width: w,
                        child: _StarterTile(chip: reply.chips[k], tint: _tints[k % _tints.length], onTap: () => onChip(reply.chips[k])),
                      ),
                  ],
                );
              },
            )),
          if (prompts.isNotEmpty) ...[
            const SizedBox(height: 22),
            item(Row(
              children: [
                const Icon(Icons.chat_bubble_outline_rounded, size: 15, color: BrandColors.orchid),
                const SizedBox(width: 6),
                Text('أو اسأليني بأسلوبكِ، مثلاً:', style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, height: 1.3)),
              ],
            )),
            const SizedBox(height: 10),
            for (final p in prompts) item(_PromptPill(text: p, onTap: () => onPrompt(p))),
          ],
        ],
      ),
    );
  }
}

class _Trait extends StatelessWidget {
  final String emoji;
  final String label;
  const _Trait(this.emoji, this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AdvisorStyle.glassBorder),
      ),
      child: Text('$emoji  $label', style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w700, color: AdvisorStyle.inkSoft, height: 1.3)),
    );
  }
}

class _StarterTile extends StatelessWidget {
  final AdvisorChip chip;
  final List<Color> tint;
  final VoidCallback onTap;
  const _StarterTile({required this.chip, required this.tint, required this.onTap});

  String get _hint => switch (chip.value) {
        'quiz:start=perfume' => '5 أسئلة سريعة',
        'quiz:start=skin' => 'روتين مخصّص لكِ',
        'quiz:start=hair' => 'حسب نوع شعركِ',
        'quiz:start=gift' => 'لأي شخص وبأي ميزانية',
        'quiz:start=makeup' => 'حسب ذوقكِ',
        'act:deals' => 'أقوى الخصومات الآن',
        _ => 'ابدئي من هنا',
      };

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: AdvisorStyle.shadow(0.6),
      ),
      child: Material(
        borderRadius: BorderRadius.circular(22),
        clipBehavior: Clip.antiAlias,
        child: Ink(
          decoration: BoxDecoration(
            gradient: LinearGradient(begin: AlignmentDirectional.topStart, end: AlignmentDirectional.bottomEnd, colors: tint),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white),
          ),
          child: InkWell(
            onTap: () {
              HapticFeedback.selectionClick();
              onTap();
            },
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [BoxShadow(color: BrandColors.orchid.withValues(alpha: 0.10), blurRadius: 8, offset: const Offset(0, 3))],
                    ),
                    alignment: Alignment.center,
                    child: Text(chip.emoji ?? '✨', style: const TextStyle(fontSize: 20)),
                  ),
                  const SizedBox(height: 10),
                  Text(chip.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3)),
                  const SizedBox(height: 2),
                  Text(_hint,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AdvisorStyle.text(size: 11, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PromptPill extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  const _PromptPill({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white.withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AdvisorStyle.glassBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.format_quote_rounded, size: 18, color: BrandColors.roseLight),
                const SizedBox(width: 8),
                Expanded(child: Text(text, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w600, height: 1.4))),
                const Icon(Icons.north_west_rounded, size: 16, color: AdvisorStyle.inkMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
