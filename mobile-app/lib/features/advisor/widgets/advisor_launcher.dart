import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../advisor_strings.dart';
import 'advisor_orb.dart';
import 'advisor_style.dart';

/// زر «ديما» العائم: كرة حية، وعند أول ظهور تعرّف بنفسها ثم تنكمش.
/// «ديما» تتكلم العربية فقط — الزر لا يظهر في الواجهة الإنجليزية.
class AdvisorLauncher extends ConsumerStatefulWidget {
  final bool visible;
  const AdvisorLauncher({super.key, this.visible = true});

  @override
  ConsumerState<AdvisorLauncher> createState() => _AdvisorLauncherState();
}

class _AdvisorLauncherState extends ConsumerState<AdvisorLauncher> {
  bool _expanded = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(milliseconds: 1400), () {
      if (!mounted) return;
      setState(() => _expanded = true);
      _timer = Timer(const Duration(seconds: 5), () {
        if (mounted) setState(() => _expanded = false);
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _open() {
    HapticFeedback.mediumImpact();
    _timer?.cancel();
    if (_expanded) setState(() => _expanded = false);
    context.push('/advisor');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    if (!s.isAr) return const SizedBox.shrink();
    // «تقليل الحركة»: تظهر وتختفي وتتمدد بلا انزلاق.
    final still = MediaQuery.disableAnimationsOf(context);
    Duration d(int ms) => still ? Duration.zero : Duration(milliseconds: ms);
    return IgnorePointer(
      ignoring: !widget.visible,
      child: AnimatedSlide(
        duration: d(320),
        curve: Curves.easeOutCubic,
        offset: widget.visible ? Offset.zero : const Offset(0, 0.6),
        child: AnimatedOpacity(
          duration: d(220),
          opacity: widget.visible ? 1 : 0,
          child: Semantics(
            button: true,
            label: s.advisorLauncherSemantics,
            excludeSemantics: true,
            child: GestureDetector(
              onTap: _open,
              child: AnimatedContainer(
                duration: d(420),
                curve: Curves.easeOutCubic,
                padding: EdgeInsetsDirectional.fromSTEB(_expanded ? 16 : 3, 3, 3, 3),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: const Color(0xFFF0E2F3)),
                  boxShadow: [
                    BoxShadow(color: BrandColors.rose.withValues(alpha: 0.26), blurRadius: 22, offset: const Offset(0, 8)),
                    BoxShadow(color: BrandColors.ink.withValues(alpha: 0.06), blurRadius: 6, offset: const Offset(0, 2)),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedSize(
                      duration: d(420),
                      curve: Curves.easeOutCubic,
                      child: _expanded
                          ? Padding(
                              padding: const EdgeInsetsDirectional.only(end: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  AdvisorGradientText(s.advisorLauncherTitle, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.2)),
                                  Text(s.advisorLauncherSubtitle,
                                      style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3)),
                                ],
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                    const AdvisorOrb(size: 50),
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
