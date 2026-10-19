import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_text.dart';
import 'advisor_style.dart';

/// «اسألي ديما عن هذا المنتج» لصفحة المنتج: لمسة على البطاقة تفتح «ديما» والمنتج محور
/// الحديث، وكل شريحة تفتحها بسؤال جاهز (`?product=…&ask=fit`).
///
/// كرة ثابتة بلا حركة — صفحة المنتج مزدحمة. «ديما» تتكلم العربية فقط، فلا تظهر البطاقة
/// بالواجهة الإنجليزية.
class AdvisorAskCard extends ConsumerWidget {
  final String productId;
  const AdvisorAskCard({super.key, required this.productId});

  void _open(BuildContext context, [String? ask]) {
    HapticFeedback.selectionClick();
    context.push(Uri(path: '/advisor', queryParameters: {'product': productId, if (ask != null) 'ask': ask}).toString());
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    if (!s.isAr || productId.isEmpty) return const SizedBox.shrink();
    final chips = [
      ('fit', '🎯', s.askDeemaFit),
      ('dupe', '💸', s.askDeemaDupe),
      ('complement', '🧩', s.askDeemaComplement),
      ('howto', '📖', s.askDeemaHowTo),
    ];
    return Material(
      color: Colors.transparent,
      child: Ink(
        decoration: BoxDecoration(
          gradient: AdvisorStyle.softGradient,
          borderRadius: BorderRadius.circular(AppCorners.lg),
          border: Border.all(color: AdvisorStyle.accentBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(
              button: true,
              label: s.askDeemaAbout,
              excludeSemantics: true,
              child: InkWell(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppCorners.lg)),
                onTap: () => _open(context),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 8, 8),
                  child: Row(
                    children: [
                      const AdvisorMiniOrb(size: 36),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          s.askDeemaAbout,
                          style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.35),
                        ),
                      ),
                      // يُعكس تلقائياً مع اتجاه النص — يشير للأمام في الاتجاهين.
                      const SizedBox.square(
                        dimension: kMinTapTarget,
                        child: Icon(Icons.chevron_right_rounded, color: BrandColors.orchid),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(12, 0, 12, 12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final (key, emoji, label) in chips)
                    _AskChip(emoji: emoji, label: label, onTap: () => _open(context, key)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AskChip extends StatelessWidget {
  final String emoji;
  final String label;
  final VoidCallback onTap;
  const _AskChip({required this.emoji, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            constraints: const BoxConstraints(minHeight: kMinTapTarget),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppCorners.pill),
              border: Border.all(color: AdvisorStyle.glassBorder),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, color: AdvisorStyle.accentText, height: 1.2),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
