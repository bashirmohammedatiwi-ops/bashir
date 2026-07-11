import 'package:flutter/material.dart';

import '../models/inventory.dart';

class InventoryMeta extends StatelessWidget {
  const InventoryMeta({super.key, required this.lookup, required this.formatIqd, this.compact = false});

  final BarcodeInventoryLookup? lookup;
  final String Function(num) formatIqd;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (lookup == null) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        if (lookup!.pos != null && (lookup!.pos!.price > 0 || lookup!.pos!.stock > 0)) ...[
          _tag('POS: ${formatIqd(lookup!.pos!.price)}', Colors.amber.shade800),
          _tag('مخزون: ${lookup!.pos!.stock}', Colors.cyan.shade800),
          if (lookup!.pos!.discountPercent > 0)
            _tag('خصم ${lookup!.pos!.discountPercent}%', Colors.orange.shade800),
        ] else
          _tag(compact ? 'لا POS' : 'غير موجود في POS', Colors.grey.shade700),
        if (lookup!.existsInApp)
          _tag(
            compact ? 'في التطبيق' : 'موجود في التطبيق${lookup!.inApp!.name != null ? ': ${lookup!.inApp!.name}' : ''}',
            Colors.green.shade800,
          )
        else
          _tag(compact ? 'جديد' : 'غير مضاف للتطبيق', Colors.grey.shade600),
      ],
    );
  }

  Widget _tag(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 10, vertical: compact ? 3 : 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: color, fontSize: compact ? 11 : 12, fontWeight: FontWeight.w600)),
    );
  }
}
