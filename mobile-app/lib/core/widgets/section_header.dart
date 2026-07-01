import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum SectionHeaderStyle { standard, niceOne }

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final SectionHeaderStyle style;
  final bool compact;
  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.style = SectionHeaderStyle.standard,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (style == SectionHeaderStyle.niceOne) {
      return Padding(
        padding: EdgeInsets.fromLTRB(16, compact ? 2 : 10, 16, 10),
        child: Row(
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.2,
              ),
            ),
            const Spacer(),
            if (actionLabel != null && onAction != null)
              GestureDetector(
                onTap: onAction,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      actionLabel!,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Icon(Icons.chevron_left, size: 18, color: AppColors.textMuted),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              child: Row(
                children: [
                  Text(actionLabel!, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Icon(Icons.chevron_left, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
