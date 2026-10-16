import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import 'advisor_orb.dart';
import 'advisor_style.dart';

/// «اسألي ديما عن هذا المنتج» — في صفحة المنتج: أسئلة سريعة تفتح المستشارة عليه مباشرة.
class AskDeemaCard extends StatelessWidget {
  final String productId;
  final EdgeInsetsGeometry margin;
  const AskDeemaCard({super.key, required this.productId, this.margin = const EdgeInsets.fromLTRB(16, 14, 16, 0)});

  void _open(BuildContext context, [String? ask]) {
    HapticFeedback.selectionClick();
    final q = {'product': productId, if (ask != null) 'ask': ask};
    context.push(Uri(path: '/advisor', queryParameters: q).toString());
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: AdvisorStyle.shadow(0.6),
        ),
        child: Material(
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: Ink(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: AlignmentDirectional.topStart,
                end: AlignmentDirectional.bottomEnd,
                colors: [Color(0xFFF7EEFD), Color(0xFFFDEFF5)],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Colors.white),
            ),
            child: InkWell(
              onTap: () => _open(context),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const AdvisorOrb(size: 40),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('اسألي ديما عن هذا المنتج', style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3)),
                              Text('مستشارتكِ تجاوبكِ فوراً — بدون انتظار',
                                  style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.4)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_left_rounded, color: BrandColors.orchid),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          _Chip('🎯 هل يناسبني؟', () => _open(context, 'fit')),
                          _Chip('💸 بديل أرخص', () => _open(context, 'dupe')),
                          _Chip('🧩 شنو يكمّله؟', () => _open(context, 'complement')),
                          _Chip('📖 طريقة الاستخدام', () => _open(context, 'howto')),
                        ],
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

class _Chip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _Chip(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Material(
        color: Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Text(label, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, color: const Color(0xFF6A3FA0), height: 1.2)),
          ),
        ),
      ),
    );
  }
}
