import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import 'advisor_orb.dart';
import 'advisor_style.dart';

/// اقتراح «اسألي ديما» حين لا يجد البحث نتائج — تُرسل كلمات البحث كما هي.
class AdvisorSearchPrompt extends StatelessWidget {
  final String query;
  const AdvisorSearchPrompt({super.key, required this.query});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () {
          HapticFeedback.selectionClick();
          context.push(Uri(path: '/advisor', queryParameters: {'q': query}).toString());
        },
        child: Ink(
          padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFFF7EEFD), Color(0xFFFDEFF5)]),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFEFE0F3)),
          ),
          child: Row(
            children: [
              const AdvisorOrb(size: 42),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('اسألي ديما بأسلوبكِ', style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, height: 1.3)),
                    Text('تفهم «$query» وتختار لكِ الأقرب',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.4)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left_rounded, color: BrandColors.orchid),
            ],
          ),
        ),
      ),
    );
  }
}
