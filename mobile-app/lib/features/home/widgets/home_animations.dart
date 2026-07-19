import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// خلفية ambient ناعمة خلف الصفحة الرئيسية.
class HomeAmbientBackground extends StatelessWidget {
  const HomeAmbientBackground({super.key});

  @override
  Widget build(BuildContext context) {
    return const Stack(
      children: [
        Positioned(
          top: -80,
          right: -60,
          child: _AmbientOrb(color: Color(0xFFFFE4EC), size: 220),
        ),
        Positioned(
          top: 180,
          left: -90,
          child: _AmbientOrb(color: Color(0xFFF7F0E4), size: 180),
        ),
        Positioned(
          bottom: 120,
          right: -40,
          child: _AmbientOrb(color: Color(0xFFFFF0F4), size: 140),
        ),
      ],
    );
  }
}

class _AmbientOrb extends StatelessWidget {
  final Color color;
  final double size;

  const _AmbientOrb({required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color.withValues(alpha: 0.55), color.withValues(alpha: 0)],
        ),
      ),
    );
  }
}

/// ظهور تدريجي لأقسام الصفحة الرئيسية.
class HomeSectionEntrance extends StatefulWidget {
  final int index;
  final Widget child;

  const HomeSectionEntrance({super.key, required this.index, required this.child});

  @override
  State<HomeSectionEntrance> createState() => _HomeSectionEntranceState();
}

class _HomeSectionEntranceState extends State<HomeSectionEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 520),
    );
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _slide = Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic),
    );
    final delay = Duration(milliseconds: (widget.index.clamp(0, 10) * 45));
    Future<void>.delayed(delay, () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// نص متحرك أفقياً — للنشرات والعروض.
class MarqueeText extends StatefulWidget {
  final String text;
  final TextStyle style;
  final double gap;

  const MarqueeText({
    super.key,
    required this.text,
    required this.style,
    this.gap = 48,
  });

  @override
  State<MarqueeText> createState() => _MarqueeTextState();
}

class _MarqueeTextState extends State<MarqueeText> {
  final _scroll = ScrollController();
  Timer? _timer;
  double _offset = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  void _start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 32), (_) {
      if (!_scroll.hasClients) return;
      final max = _scroll.position.maxScrollExtent;
      if (max <= 0) return;
      _offset += 0.6;
      if (_offset >= max) _offset = 0;
      _scroll.jumpTo(_offset);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        return SingleChildScrollView(
          controller: _scroll,
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          child: Row(
            children: [
              Text(widget.text, style: widget.style),
              SizedBox(width: widget.gap),
              Text(widget.text, style: widget.style),
              SizedBox(width: widget.gap),
              Text(widget.text, style: widget.style),
            ],
          ),
        );
      },
    );
  }
}

/// شريط نشرات علوي يجمع كل العروض النصية.
class HomePromoTicker extends StatelessWidget {
  final List<String> messages;
  final VoidCallback? onTap;

  const HomePromoTicker({super.key, required this.messages, this.onTap});

  @override
  Widget build(BuildContext context) {
    if (messages.isEmpty) return const SizedBox.shrink();
    final text = messages.join('   •   ');

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          height: 34,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withValues(alpha: 0.92),
                const Color(0xFFE83A72),
              ],
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.campaign_rounded, size: 13, color: Colors.white),
                    SizedBox(width: 4),
                    Text(
                      'عروض',
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: MarqueeText(
                  text: text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// تأثير Ken Burns خفيف على صور البنر.
class KenBurnsImage extends StatefulWidget {
  final Widget child;

  const KenBurnsImage({super.key, required this.child});

  @override
  State<KenBurnsImage> createState() => _KenBurnsImageState();
}

class _KenBurnsImageState extends State<KenBurnsImage> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 9))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.07).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _scale, child: widget.child);
  }
}

/// نبض خفيف للشارات والأيقونات.
class PulseBadge extends StatefulWidget {
  final Widget child;

  const PulseBadge({super.key, required this.child});

  @override
  State<PulseBadge> createState() => _PulseBadgeState();
}

class _PulseBadgeState extends State<PulseBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _scale, child: widget.child);
  }
}

/// حافة متدرجة لامعة أعلى البطاقات.
class HomeShimmerBorder extends StatelessWidget {
  final Widget child;
  final BorderRadius borderRadius;

  const HomeShimmerBorder({
    super.key,
    required this.child,
    this.borderRadius = const BorderRadius.all(Radius.circular(22)),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withValues(alpha: 0.35),
            AppColors.accent.withValues(alpha: 0.25),
            AppColors.primary.withValues(alpha: 0.15),
          ],
        ),
      ),
      padding: const EdgeInsets.all(1),
      child: ClipRRect(borderRadius: borderRadius, child: child),
    );
  }
}
