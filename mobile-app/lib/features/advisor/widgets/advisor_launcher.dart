import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import 'advisor_orb.dart';
import 'advisor_style.dart';

/// زر «ديما» العائم: كرة حية، وعند أول ظهور تعرّف بنفسها ثم تنكمش.
class AdvisorLauncher extends StatefulWidget {
  final bool visible;
  const AdvisorLauncher({super.key, this.visible = true});

  @override
  State<AdvisorLauncher> createState() => _AdvisorLauncherState();
}

class _AdvisorLauncherState extends State<AdvisorLauncher> {
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
    return IgnorePointer(
      ignoring: !widget.visible,
      child: AnimatedSlide(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        offset: widget.visible ? Offset.zero : const Offset(0, 0.6),
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 220),
          opacity: widget.visible ? 1 : 0,
          child: Semantics(
            button: true,
            label: 'افتحي ديما، مستشارتكِ للجمال',
            child: GestureDetector(
              onTap: _open,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 420),
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
                      duration: const Duration(milliseconds: 420),
                      curve: Curves.easeOutCubic,
                      child: _expanded
                          ? Padding(
                              padding: const EdgeInsetsDirectional.only(end: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  AdvisorGradientText('اسألي ديما', style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.2)),
                                  Text('مستشارتكِ للجمال',
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
