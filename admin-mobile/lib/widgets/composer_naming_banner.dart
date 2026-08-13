import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../core/utils/ai_model_prefs.dart';

class ComposerNamingBanner extends StatelessWidget {
  const ComposerNamingBanner({
    super.key,
    this.model,
    this.verified,
    this.compact = false,
  });

  final AiModelOption? model;
  final bool? verified;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final m = model ?? AiModelOption.composerLow;
    final status = verified == true
        ? 'تم تأكيد الاسم باللغتين'
        : verified == false
            ? 'راجع الاسم يدوياً — لم يُؤكَّد بعد'
            : 'Composer يؤكد الاسم بالعربي والإنجليزي فقط';
    return Card(
      color: verified == false ? const Color(0xFFFFF8E8) : AppTheme.primary.withValues(alpha: 0.07),
      margin: EdgeInsets.only(bottom: compact ? 8 : 12),
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, compact ? 10 : 12, 12, compact ? 10 : 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              verified == true
                  ? Icons.verified_outlined
                  : Icons.auto_awesome,
              color: verified == false ? Colors.amber.shade800 : AppTheme.primary,
              size: 22,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    m.labelAr,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    status,
                    style: const TextStyle(fontSize: 12.5, height: 1.35, color: AppTheme.muted),
                  ),
                  if (!compact) ...[
                    const SizedBox(height: 4),
                    const Text(
                      'التصنيف والوصف والصور من قواعد الباركود — بدون GPT كامل.',
                      style: TextStyle(fontSize: 12, height: 1.35, color: AppTheme.muted),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
