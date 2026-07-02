import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../../data/models/order.dart';

/// بطاقة قسم موحّدة — عنوان + محتوى بظل خفيف.
class SectionCard extends StatelessWidget {
  final String? title;
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Widget? trailing;

  const SectionCard({
    super.key,
    this.title,
    required this.child,
    this.padding,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(AppSpacing.md + 2),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm + 2),
              child: Row(
                children: [
                  Expanded(
                    child: Text(title!, style: AppTypography.sectionTitle.copyWith(fontSize: 15)),
                  ),
                  if (trailing != null) trailing!,
                ],
              ),
            ),
          child,
        ],
      ),
    );
  }
}

/// عنوان قسم داخل الصفحة.
class SectionTitle extends StatelessWidget {
  final String title;
  final Widget? action;

  const SectionTitle(this.title, {super.key, this.action});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm + 2),
      child: Row(
        children: [
          Expanded(child: Text(title, style: AppTypography.sectionTitle.copyWith(fontSize: 16))),
          if (action != null) action!,
        ],
      ),
    );
  }
}

/// صف ملخّص (تسمية + قيمة).
class SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  final Color? valueColor;

  const SummaryRow({
    super.key,
    required this.label,
    required this.value,
    this.bold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Text(
            label,
            style: AppTypography.caption.copyWith(
              fontSize: bold ? 15 : 13,
              color: AppColors.textSecondary,
              fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
              color: valueColor ?? (bold ? AppColors.primary : AppColors.textPrimary),
              fontSize: bold ? 17 : 14,
            ),
          ),
        ],
      ),
    );
  }
}

/// شريحة حالة الطلب.
class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip({super.key, required this.status});

  Color get _color => switch (status) {
        'DELIVERED' => AppColors.success,
        'CANCELLED' || 'RETURNED' => AppColors.sale,
        'SHIPPED' || 'PROCESSING' => AppColors.warning,
        _ => AppColors.primary,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        orderStatusLabel(status),
        style: TextStyle(color: _color, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}
