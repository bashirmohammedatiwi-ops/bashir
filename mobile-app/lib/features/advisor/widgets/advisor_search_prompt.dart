import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import 'advisor_style.dart';

/// اقتراح «اسألي ديما» حين لا يجد البحث نتائج — تُرسل كلمات البحث كما هي.
/// «ديما» تتكلم العربية فقط، فلا يظهر الاقتراح بالواجهة الإنجليزية.
class AdvisorSearchPrompt extends ConsumerWidget {
  final String query;
  const AdvisorSearchPrompt({super.key, required this.query});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    if (!s.isAr) return const SizedBox.shrink();
    final title = s.isAr ? 'اسألي ديما بأسلوبكِ' : 'Ask Deema in your own words';
    final subtitle = s.isAr ? 'تفهم «$query» وتختار لكِ الأقرب' : 'She understands “$query” and picks the closest match';
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      excludeSemantics: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: () {
            HapticFeedback.selectionClick();
            context.push(Uri(path: '/advisor', queryParameters: {'q': query}).toString());
          },
          child: Ink(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 14, 12),
            decoration: BoxDecoration(
              gradient: AdvisorStyle.softGradient,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AdvisorStyle.accentBorder),
            ),
            child: Row(
              children: [
                // كرة ثابتة — شاشة البحث مزدحمة بالصور ولا تحتاج حركة دائمة.
                const AdvisorMiniOrb(size: 42),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3)),
                      Text(subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.4)),
                    ],
                  ),
                ),
                // يُعكس تلقائياً مع اتجاه النص — يشير للأمام في الاتجاهين.
                const Icon(Icons.chevron_right_rounded, color: BrandColors.orchid),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
