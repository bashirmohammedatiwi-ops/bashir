import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/pick_models.dart';
import '../../widgets/common.dart';

/// ألوان المطلوب مقابل المُجهَّز — نفسها في كل التطبيقات (السيرفر يرسل اسم اللون).
/// أخضر = مطابق، أحمر = ناقص، أصفر = إضافي، رمادي = لم يُمسح بعد.
({Color fg, Color bg, IconData icon}) pickColor(String color) => switch (color) {
  'green' => (fg: AppColors.success, bg: AppColors.successSoft, icon: Icons.check_circle_rounded),
  'red' => (fg: AppColors.danger, bg: AppColors.dangerSoft, icon: Icons.remove_circle_rounded),
  'yellow' => (fg: AppColors.warning, bg: AppColors.warningSoft, icon: Icons.add_circle_rounded),
  _ => (fg: AppColors.muted, bg: AppColors.scaffold, icon: Icons.radio_button_unchecked_rounded),
};

class PickLineTile extends StatelessWidget {
  const PickLineTile({super.key, required this.line, this.onTap, this.substituteFor});
  final PickLine line;
  final VoidCallback? onTap;
  final String? substituteFor;

  @override
  Widget build(BuildContext context) {
    final c = pickColor(line.color);
    final qty = line.isExtra ? '+${line.pickedQty}' : '${line.pickedQty}/${line.orderedQty}';
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: line.color == 'grey' ? null : c.bg.withValues(alpha: .55),
          border: BorderDirectional(start: BorderSide(color: c.fg, width: 5)),
        ),
        padding: const EdgeInsets.fromLTRB(10, 10, 12, 10),
        child: Row(
          children: [
            NetImg(line.thumb, size: 52, fit: BoxFit.contain),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(line.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, height: 1.35)),
                  if (line.shadeName != null)
                    Text('اللون: ${line.shadeName}', style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w700, fontSize: 12.5)),
                  const SizedBox(height: 3),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Pill(line.label, color: c.fg, bg: c.bg, small: true, icon: c.icon),
                      if (line.isExtra && line.isFree) const Pill('هدية', color: AppColors.rose, bg: AppColors.roseSoft, small: true),
                      if (line.isExtra && !line.isFree) Pill(money(line.unitPrice), color: AppColors.muted, bg: AppColors.scaffold, small: true),
                      if (line.manualConfirm) const Pill('تأكيد يدوي', color: AppColors.info, bg: AppColors.infoSoft, small: true),
                      if ((line.reason ?? '').isNotEmpty)
                        Text(line.reason!, style: TextStyle(color: c.fg, fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  if (substituteFor != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text('بديل عن: $substituteFor', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                    ),
                  if (line.barcode != null)
                    Text(line.barcode!, textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              children: [
                Icon(c.icon, color: c.fg, size: 26),
                Text(qty, textDirection: TextDirection.ltr, style: TextStyle(fontWeight: FontWeight.w900, color: c.fg, fontSize: 15)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// شريط التقدم: كم قطعة مُسحت من المطلوب، وعدّاد كل لون.
class PickProgressPanel extends StatelessWidget {
  const PickProgressPanel({super.key, required this.view});
  final PickView view;

  @override
  Widget build(BuildContext context) {
    final done = view.pickedUnits;
    final all = view.orderedUnits;
    final full = done >= all && all > 0;
    final matched = view.ordered.where((l) => l.color == 'green').length;
    final short = view.ordered.where((l) => l.color == 'red').length;
    final pending = view.ordered.where((l) => l.color == 'grey').length;
    return Panel(
      color: full ? AppColors.successSoft : Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  view.startable && !view.picking
                      ? 'لم يبدأ التجهيز — ${numFmt(all)} قطعة'
                      : full
                      ? 'كل القطع المطلوبة ممسوحة ✓'
                      : 'مُسح ${numFmt(done)} من ${numFmt(all)} قطعة',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: full ? AppColors.success : AppColors.ink),
                ),
              ),
              if (view.pickerName != null)
                Text(view.pickerName!, style: const TextStyle(color: AppColors.muted, fontSize: 12.5, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: all == 0 ? 0 : done / all,
            minHeight: 7,
            borderRadius: BorderRadius.circular(4),
            color: full ? AppColors.success : AppColors.primary,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _count('مطابق', matched, 'green'),
              if (short > 0) _count('ناقص', short, 'red'),
              if (pending > 0) _count('لم يُمسح', pending, 'grey'),
              if (view.extras.isNotEmpty) _count('إضافي', view.extras.length, 'yellow'),
              if (view.parcelCount != null && view.finished)
                Pill('${view.parcelCount} كيس', color: AppColors.primary, bg: AppColors.primarySoft, icon: Icons.shopping_bag_outlined),
            ],
          ),
        ],
      ),
    );
  }

  Widget _count(String label, int n, String color) {
    final c = pickColor(color);
    return Pill('$label: $n', color: c.fg, bg: c.bg, icon: c.icon);
  }
}

/// الهدية وملاحظة الزبونة — يراها الموظف قبل أن يغلق الكيس.
class PickNotesPanel extends StatelessWidget {
  const PickNotesPanel({super.key, required this.view});
  final PickView view;
  @override
  Widget build(BuildContext context) => Panel(
    color: AppColors.warningSoft,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (view.isGift) ...[
          const Row(
            children: [
              Icon(Icons.card_giftcard_rounded, color: AppColors.rose),
              SizedBox(width: 8),
              Expanded(child: Text('طلب هدية — لا تضع الفاتورة بالأسعار في الكيس', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.rose))),
            ],
          ),
          if ((view.giftMessage ?? '').isNotEmpty)
            Padding(padding: const EdgeInsets.only(top: 6), child: Text('رسالة البطاقة: ${view.giftMessage}', style: const TextStyle(height: 1.6))),
        ],
        if ((view.notes ?? '').isNotEmpty) ...[
          if (view.isGift) const SizedBox(height: 8),
          Text('ملاحظة الزبونة: ${view.notes}', style: const TextStyle(height: 1.6)),
        ],
      ],
    ),
  );
}

/// المبلغ الأصلي مقابل الجديد بعد النقص والإضافة، وما تحصّله شركة التوصيل.
class PickMoneyPanel extends StatelessWidget {
  const PickMoneyPanel({super.key, required this.view});
  final PickView view;

  @override
  Widget build(BuildContext context) {
    final m = view.money;
    final before = view.startable && !view.picking;
    if (before) {
      return Panel(
        child: Column(
          children: [
            _row('إجمالي الطلب', money(view.total), bold: true),
            _row('الدفع', '${paymentMethodLabels[view.paymentMethod] ?? view.paymentMethod} · ${paymentStatusLabels[view.paymentStatus] ?? view.paymentStatus}'),
          ],
        ),
      );
    }
    return Panel(
      child: Column(
        children: [
          if (view.picking)
            const Padding(
              padding: EdgeInsets.only(bottom: 6),
              child: Text('حسب المسح حتى الآن — يُثبّت عند «إنهاء التجهيز»', style: TextStyle(color: AppColors.muted, fontSize: 12)),
            ),
          _row('إجمالي الطلب الأصلي', money(view.total)),
          if (m.shortageValue > 0) _row('النواقص', '- ${money(m.shortageValue)}', color: AppColors.danger),
          if (m.extrasValue > 0) _row('الإضافات المدفوعة', '+ ${money(m.extrasValue)}', color: AppColors.warning),
          if (m.freeExtrasValue > 0) _row('هدايا وعينات', money(0)),
          if (m.roundingDiscount > 0) _row('تقريب لصالح الزبونة', '- ${money(m.roundingDiscount)}'),
          const Divider(),
          _row('الإجمالي الجديد', money(m.finalTotal), bold: true),
          if (m.prepaid) ...[
            _row('مدفوع مسبقاً', money(view.total), color: AppColors.info),
            if (m.refundAmount > 0) _row('يُسترجع للزبونة', money(m.refundAmount), color: AppColors.danger),
          ],
          _row(
            'تحصّله شركة التوصيل',
            m.codAmount == 0 ? 'لا شيء (مدفوع)' : money(m.codAmount),
            bold: true,
            color: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _row(String k, String v, {bool bold = false, Color? color}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Text(k, style: TextStyle(color: AppColors.muted, fontWeight: bold ? FontWeight.w800 : FontWeight.w500)),
        const Spacer(),
        Flexible(
          child: Text(
            v,
            textAlign: TextAlign.end,
            style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, fontSize: bold ? 16.5 : 14, color: color),
          ),
        ),
      ],
    ),
  );
}
