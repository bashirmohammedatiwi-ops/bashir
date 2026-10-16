import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/brand/brand_logo.dart';
import 'advisor_orb.dart';
import 'advisor_style.dart';

/// يبرز ما بين «» (أسماء المنتجات والأقسام) بلون الهوية.
List<InlineSpan> _rich(String text, TextStyle base) {
  final spans = <InlineSpan>[];
  final re = RegExp(r'«([^»]+)»');
  var at = 0;
  for (final m in re.allMatches(text)) {
    if (m.start > at) spans.add(TextSpan(text: text.substring(at, m.start)));
    spans.add(TextSpan(
      text: m.group(1),
      style: base.copyWith(fontWeight: FontWeight.w700, color: const Color(0xFF7A3FB8)),
    ));
    at = m.end;
  }
  if (at < text.length) spans.add(TextSpan(text: text.substring(at)));
  return spans;
}

/// مدة كتابة رسالة بحركة الآلة الكاتبة (سريعة ومحدودة حتى لا تُنتظر).
Duration typingDuration(String text) => Duration(milliseconds: (220 + text.characters.length * 9).clamp(260, 900));

/// نص يظهر حرفاً حرفاً. يحجز مساحته النهائية من البداية فلا يقفز ما تحته.
class TypewriterText extends StatefulWidget {
  final String text;
  final TextStyle style;
  final bool animate;
  final Duration delay;
  const TypewriterText({super.key, required this.text, required this.style, this.animate = true, this.delay = Duration.zero});

  @override
  State<TypewriterText> createState() => _TypewriterTextState();
}

class _TypewriterTextState extends State<TypewriterText> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: typingDuration(widget.text));
  late final bool _animate = widget.animate;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    if (!_animate) {
      _c.value = 1;
    } else {
      _t = Timer(widget.delay, () {
        if (mounted) _c.forward();
      });
    }
  }

  @override
  void dispose() {
    _t?.cancel();
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final full = Text.rich(TextSpan(style: widget.style, children: _rich(widget.text, widget.style)));
    if (!_animate) return full;
    final chars = widget.text.characters;
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) {
        if (_c.value >= 1) return full;
        final n = (chars.length * Curves.easeOut.transform(_c.value)).round();
        final shown = chars.take(n).toString();
        return Stack(
          children: [
            // المساحة النهائية محجوزة بنص شفاف.
            Opacity(opacity: 0, child: full),
            Text.rich(TextSpan(style: widget.style, children: _rich(shown, widget.style))),
          ],
        );
      },
    );
  }
}

/// فقاعة رسالة من «ديما» — الأولى في الرد تحمل الصورة الرمزية.
class BotBubble extends StatelessWidget {
  final String text;
  final bool showAvatar;
  final bool animate;
  final Duration typeDelay;
  const BotBubble({super.key, required this.text, this.showAvatar = true, this.animate = false, this.typeDelay = Duration.zero});

  @override
  Widget build(BuildContext context) {
    final base = AdvisorStyle.text(size: 14.5, height: 1.65);
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 16, end: 48),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          SizedBox(width: 28, child: showAvatar ? const AdvisorMiniOrb() : null),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 11),
              decoration: BoxDecoration(
                color: AdvisorStyle.glass,
                border: Border.all(color: AdvisorStyle.glassBorder),
                borderRadius: BorderRadiusDirectional.only(
                  topStart: const Radius.circular(20),
                  topEnd: const Radius.circular(20),
                  bottomEnd: const Radius.circular(20),
                  bottomStart: Radius.circular(showAvatar ? 6 : 20),
                ),
                boxShadow: AdvisorStyle.shadow(0.7),
              ),
              child: TypewriterText(text: text, style: base, animate: animate, delay: typeDelay),
            ),
          ),
        ],
      ),
    );
  }
}

/// «نصيحة ديما» — الرسائل التي تبدأ بـ 💡.
class TipCard extends StatelessWidget {
  final String text;
  const TipCard({super.key, required this.text});

  static bool isTip(String m) => m.trimLeft().startsWith('💡');

  @override
  Widget build(BuildContext context) {
    final body = text.trimLeft().replaceFirst('💡', '').trim();
    final base = AdvisorStyle.text(size: 13.5, height: 1.65, color: AdvisorStyle.inkSoft);
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 52, end: 32),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 11, 14, 12),
        decoration: BoxDecoration(
          gradient: AdvisorStyle.softGradient,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFF3E1EE)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.16), blurRadius: 8)],
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.lightbulb_rounded, size: 17, color: Color(0xFFE0A23A)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('نصيحة ديما', style: AdvisorStyle.text(size: 12, weight: FontWeight.w800, color: BrandColors.rose, height: 1.3)),
                  const SizedBox(height: 3),
                  Text.rich(TextSpan(style: base, children: _rich(body, base))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// فقاعة الزبونة — بتدرّج الهوية على الطرف الآخر.
class UserBubble extends StatelessWidget {
  final String text;
  const UserBubble({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 64, end: 16),
      child: Align(
        alignment: AlignmentDirectional.centerEnd,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 11),
          decoration: BoxDecoration(
            gradient: AdvisorStyle.gradient,
            borderRadius: const BorderRadiusDirectional.only(
              topStart: Radius.circular(20),
              topEnd: Radius.circular(20),
              bottomStart: Radius.circular(20),
              bottomEnd: Radius.circular(6),
            ),
            boxShadow: [
              BoxShadow(color: BrandColors.rose.withValues(alpha: 0.26), blurRadius: 16, offset: const Offset(0, 6)),
            ],
          ),
          child: Text(text, style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w600, color: Colors.white, height: 1.55)),
        ),
      ),
    );
  }
}

/// مؤشر «ديما تفكر»: كرة حية، نقاط تتموّج، وعبارات تتبدل تشرح ما تفعله.
class ThinkingIndicator extends StatefulWidget {
  const ThinkingIndicator({super.key});

  @override
  State<ThinkingIndicator> createState() => _ThinkingIndicatorState();
}

class _ThinkingIndicatorState extends State<ThinkingIndicator> with SingleTickerProviderStateMixin {
  static const _phrases = ['أقرأ طلبكِ…', 'أبحث بين المنتجات…', 'أقارن المكونات والأسعار…', 'أرتّب الأنسب لكِ…'];
  late final AnimationController _dots = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat();
  Timer? _timer;
  int _i = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 1300), (_) {
      if (mounted) setState(() => _i = (_i + 1) % _phrases.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _dots.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 12, end: 48),
      child: Row(
        children: [
          const AdvisorOrb(size: 36, thinking: true),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
            decoration: BoxDecoration(
              color: AdvisorStyle.glass,
              border: Border.all(color: AdvisorStyle.glassBorder),
              borderRadius: BorderRadius.circular(20),
              boxShadow: AdvisorStyle.shadow(0.6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedBuilder(
                  animation: _dots,
                  builder: (_, __) => Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(3, (i) {
                      final phase = (_dots.value - i * 0.16) % 1.0;
                      final lift = math.sin(phase * math.pi * 2).clamp(0.0, 1.0);
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2),
                        child: Transform.translate(
                          offset: Offset(0, -4 * lift),
                          child: Container(
                            width: 6.5,
                            height: 6.5,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color.lerp(BrandColors.orchidLight, BrandColors.rose, lift),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(width: 10),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 320),
                  transitionBuilder: (child, a) => FadeTransition(
                    opacity: a,
                    child: SlideTransition(
                      position: Tween(begin: const Offset(0, 0.4), end: Offset.zero).animate(a),
                      child: child,
                    ),
                  ),
                  child: Text(
                    _phrases[_i],
                    key: ValueKey(_i),
                    style: AdvisorStyle.text(size: 12.5, color: AdvisorStyle.inkMuted, weight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
