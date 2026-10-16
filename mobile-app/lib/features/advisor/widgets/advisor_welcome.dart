import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/brand/brand_logo.dart';
import '../advisor_models.dart';
import 'advisor_orb.dart';
import 'advisor_personal_card.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

/// واجهة الترحيب — هادئة وقليلة الكلام: الكرة، تحية قصيرة، بطاقات بدء، وأمثلة بسطر واحد.
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

  /// التحية وحدها من رسالة الخادم («مساء الخير بشير 🌙») بلا التعريف الطويل بعدها.
  String get _greeting {
    final m = reply.messages.isEmpty ? '' : reply.messages.first;
    final g = m.split(RegExp(r'\s*(أنا ديما|—)')).first.trim();
    if (g.isEmpty || g.length > 34) return 'أهلاً بكِ 🌸';
    return g;
  }

  @override
  Widget build(BuildContext context) {
    var i = 0;
    Widget item(Widget child) => StaggerIn(index: i++, animate: animate, step: const Duration(milliseconds: 80), child: child);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
      child: Column(
        children: [
          item(const AdvisorOrb(size: 88)),
          const SizedBox(height: 14),
          item(Text(
            _greeting,
            textAlign: TextAlign.center,
            style: AdvisorStyle.text(size: 21, weight: FontWeight.w800, height: 1.35),
          )),
          const SizedBox(height: 4),
          item(Text(
            'شنو تحتاجين اليوم؟',
            style: AdvisorStyle.text(size: 14, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.4),
          )),
          const SizedBox(height: 24),
          // للمسجلات: «قارب يخلص؟» و«أكملي روتينكِ» من مشترياتها — أهم من البطاقات العامة.
          // بطاقة واحدة مختصرة (التجديد أولاً) — لا نزحم أعلى الشاشة.
          if (reply.personal.isNotEmpty) ...[
            item(AdvisorPersonalCard(personal: reply.personal.first, animate: animate, margin: EdgeInsets.zero, compact: true)),
            const SizedBox(height: 16),
          ],
          if (reply.chips.isNotEmpty)
            item(LayoutBuilder(
              builder: (_, c) {
                const gap = 10.0;
                final w = (c.maxWidth - gap * 2) / 3;
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
            item(Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text('أو اسأليني بأسلوبكِ', style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.3)),
            )),
            const SizedBox(height: 8),
            item(SizedBox(
              height: 42,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                clipBehavior: Clip.none,
                itemCount: prompts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, k) => _PromptChip(text: prompts[k], onTap: () => onPrompt(prompts[k])),
              ),
            )),
          ],
        ],
      ),
    );
  }
}

class _StarterTile extends StatelessWidget {
  final AdvisorChip chip;
  final List<Color> tint;
  final VoidCallback onTap;
  const _StarterTile({required this.chip, required this.tint, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: AdvisorStyle.shadow(0.5),
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
            child: SizedBox(
              height: 98,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: BrandColors.orchid.withValues(alpha: 0.10), blurRadius: 8, offset: const Offset(0, 3))],
                    ),
                    alignment: Alignment.center,
                    child: Text(chip.emoji ?? '✨', style: const TextStyle(fontSize: 21)),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Text(
                      chip.label,
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: AdvisorStyle.text(size: 12, weight: FontWeight.w800, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PromptChip extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  const _PromptChip({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.88),
      borderRadius: BorderRadius.circular(21),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(21),
            border: Border.all(color: AdvisorStyle.glassBorder),
          ),
          child: Text('«$text»', style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w600, color: AdvisorStyle.inkSoft, height: 1.2)),
        ),
      ),
    );
  }
}
