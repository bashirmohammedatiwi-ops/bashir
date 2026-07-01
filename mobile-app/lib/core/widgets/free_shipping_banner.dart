import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

/// شريط تقدّم الشحن المجاني — مثل Nice One.
class FreeShippingBanner extends StatelessWidget {
  final int subtotal;
  final int threshold;
  final VoidCallback? onAddMore;
  const FreeShippingBanner({
    super.key,
    required this.subtotal,
    required this.threshold,
    this.onAddMore,
  });

  @override
  Widget build(BuildContext context) {
    if (threshold <= 0) return const SizedBox.shrink();
    final remaining = (threshold - subtotal).clamp(0, threshold);
    final progress = (subtotal / threshold).clamp(0.0, 1.0);
    final achieved = remaining == 0;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFECB3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  achieved
                      ? '🎉 مبروك! حصلت على توصيل مجاني'
                      : 'أضف ${formatPrice(remaining)} للحصول على توصيل مجاني!',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: achieved ? AppColors.success : AppColors.textPrimary,
                  ),
                ),
              ),
              if (!achieved && onAddMore != null)
                TextButton(
                  onPressed: onAddMore,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('أضف المزيد', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: AppColors.border,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}
