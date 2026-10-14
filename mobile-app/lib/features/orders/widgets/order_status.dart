import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import '../order_strings.dart';

/// مسار حالات الطلب الطبيعي (بدون الإلغاء/الإرجاع).
const orderStatusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

bool isOrderClosedNegative(String status) => status == 'CANCELLED' || status == 'RETURNED';

/// لون دلالي لكل حالة: انتظار = تحذير، جارٍ = لون العالم، تم = نجاح، ملغي = تنبيه.
Color orderStatusColor(BuildContext context, String status) => switch (status) {
  'DELIVERED' => AppColors.success,
  'CANCELLED' || 'RETURNED' => AppColors.sale,
  'PENDING' => AppColors.warning,
  _ => context.worldTheme.accentDark,
};

IconData orderStatusIcon(String status) => switch (status) {
  'PENDING' => Icons.hourglass_top_rounded,
  'CONFIRMED' => Icons.thumb_up_alt_outlined,
  'PROCESSING' => Icons.inventory_2_outlined,
  'SHIPPED' => Icons.local_shipping_outlined,
  'DELIVERED' => Icons.check_circle_outline_rounded,
  'CANCELLED' => Icons.cancel_outlined,
  'RETURNED' => Icons.assignment_return_outlined,
  _ => Icons.receipt_long_outlined,
};

/// شريحة حالة الطلب الموحّدة للقائمة والتفاصيل.
class OrderStatusChip extends ConsumerWidget {
  final String status;
  const OrderStatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = orderStatusColor(context, status);
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 10, 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: Border.all(color: c.withValues(alpha: 0.22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(orderStatusIcon(status), size: 14, color: c),
          const SizedBox(width: 4),
          Text(ref.s.orderStatus(status), style: AppText.micro.copyWith(color: c)),
        ],
      ),
    );
  }
}

/// شريط تقدّم مقسّم صغير (5 مراحل) لبطاقات قائمة الطلبات.
class OrderProgressBar extends StatelessWidget {
  final String status;
  const OrderProgressBar({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final idx = orderStatusFlow.indexOf(status);
    final color = orderStatusColor(context, status);
    return Row(
      children: [
        for (var i = 0; i < orderStatusFlow.length; i++) ...[
          if (i > 0) const SizedBox(width: 4),
          Expanded(
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: i <= idx ? color : t.accentSoft,
                borderRadius: BorderRadius.circular(AppCorners.pill),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
