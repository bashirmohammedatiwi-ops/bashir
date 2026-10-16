import 'package:flutter/material.dart';

import '../../../core/brand/brand_logo.dart';
import '../advisor_models.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

/// بطاقة معرفة: مكوّن (فوائد، لمن، طريقة، تنبيهات)، مزج مكونين بحكم واضح، أو موضوع بنقاط.
class AdvisorKnowledgeCard extends StatelessWidget {
  final AdvisorKnowledge knowledge;
  final bool animate;
  const AdvisorKnowledgeCard({super.key, required this.knowledge, this.animate = true});

  String get _kindLabel => switch (knowledge.kind) {
        'ingredient' => 'دليل المكوّن',
        'combo' => 'مزج المكونات',
        _ => 'معلومة من ديما',
      };

  String get _kindEmoji => switch (knowledge.kind) {
        'ingredient' => '🧪',
        'combo' => '⚗️',
        _ => '💡',
      };

  @override
  Widget build(BuildContext context) {
    final k = knowledge;
    // العنوان قد يبدأ برمز («⏳ ثبات العطر») — نفصله ليكون أيقونة.
    final m = RegExp(r'^(\p{Extended_Pictographic}[\u{FE0F}\u{200D}\p{Extended_Pictographic}]*)\s*', unicode: true).firstMatch(k.title);
    final icon = m?.group(1) ?? _kindEmoji;
    final title = m == null ? k.title : k.title.substring(m.end);
    final single = k.sections.length == 1 && k.sections.first.label.isEmpty;

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
              Container(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                decoration: const BoxDecoration(gradient: AdvisorStyle.softGradient),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: [BoxShadow(color: BrandColors.orchid.withValues(alpha: 0.14), blurRadius: 10, offset: const Offset(0, 3))],
                      ),
                      alignment: Alignment.center,
                      child: Text(icon, style: const TextStyle(fontSize: 22)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_kindLabel, style: AdvisorStyle.text(size: 11, weight: FontWeight.w800, color: BrandColors.rose, height: 1.3)),
                          const SizedBox(height: 2),
                          Text(title, style: AdvisorStyle.text(size: 16.5, weight: FontWeight.w800, height: 1.35)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (k.intro != null && k.intro!.isNotEmpty) ...[
                      Text(k.intro!, style: AdvisorStyle.text(size: 13.5, color: AdvisorStyle.inkSoft, height: 1.7)),
                      const SizedBox(height: 12),
                    ],
                    if (k.verdictText != null) ...[
                      _Verdict(tone: k.verdictTone ?? 'good', text: k.verdictText!),
                      const SizedBox(height: 14),
                    ],
                    if (single)
                      for (var i = 0; i < k.sections.first.bullets.length; i++)
                        StaggerIn(
                          index: i,
                          animate: animate,
                          step: const Duration(milliseconds: 80),
                          child: _NumberedPoint(n: i + 1, text: k.sections.first.bullets[i], last: i == k.sections.first.bullets.length - 1),
                        )
                    else
                      for (var i = 0; i < k.sections.length; i++)
                        StaggerIn(
                          index: i,
                          animate: animate,
                          step: const Duration(milliseconds: 90),
                          child: _Section(section: k.sections[i], last: i == k.sections.length - 1),
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

class _Verdict extends StatelessWidget {
  final String tone;
  final String text;
  const _Verdict({required this.tone, required this.text});

  @override
  Widget build(BuildContext context) {
    final (bg, fg, icon) = switch (tone) {
      'avoid' => (const Color(0xFFFDECEF), const Color(0xFFC0304A), Icons.block_rounded),
      'care' => (const Color(0xFFFFF5E3), const Color(0xFFA8650A), Icons.schedule_rounded),
      _ => (const Color(0xFFE9F7EF), const Color(0xFF137A48), Icons.check_circle_rounded),
    };
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 11),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 19, color: fg),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: AdvisorStyle.text(size: 13, weight: FontWeight.w700, color: fg, height: 1.6))),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final AdvisorKnowledgeSection section;
  final bool last;
  const _Section({required this.section, required this.last});

  @override
  Widget build(BuildContext context) {
    final warn = section.icon == '⚠️' || section.icon == '🚫';
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(section.icon, style: const TextStyle(fontSize: 15)),
              const SizedBox(width: 6),
              Text(section.label,
                  style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, color: warn ? const Color(0xFFA8650A) : AdvisorStyle.ink, height: 1.3)),
            ],
          ),
          const SizedBox(height: 6),
          for (final b in section.bullets)
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 4, bottom: 5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: warn ? null : AdvisorStyle.gradient,
                      color: warn ? const Color(0xFFE2A43B) : null,
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(child: Text(b, style: AdvisorStyle.text(size: 13, color: AdvisorStyle.inkSoft, height: 1.65))),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _NumberedPoint extends StatelessWidget {
  final int n;
  final String text;
  final bool last;
  const _NumberedPoint({required this.n, required this.text, required this.last});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AdvisorStyle.gradient),
            alignment: Alignment.center,
            child: Text('$n', style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w800, color: Colors.white, height: 1)),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: AdvisorStyle.text(size: 13.5, color: AdvisorStyle.ink, height: 1.65))),
        ],
      ),
    );
  }
}
