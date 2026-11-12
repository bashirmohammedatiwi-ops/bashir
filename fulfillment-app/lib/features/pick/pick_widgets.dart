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

/// «3 / 7 قطع» — المعدود يتبع العدد الكلي.
String progressLabel(int done, int all) {
  final r = all % 100;
  return '${numFmt(done)} / ${numFmt(all)} ${r >= 3 && r <= 10 ? 'قطع' : 'قطعة'}';
}

/// آخر مسحة: اسم الصنف ولونه (أخضر/أصفر/أحمر/رمادي) — يظهر ثانيتين.
typedef ScanFlash = ({String name, String color, String text});

/// الرأس الثابت أثناء التجهيز: التقدم بخط كبير، شريط التقدم، عدّاد كل لون، وآخر مسحة.
class PickStickyHeader extends StatelessWidget {
  const PickStickyHeader({super.key, required this.view, this.flash});
  final PickView view;
  final ScanFlash? flash;

  @override
  Widget build(BuildContext context) {
    final done = view.pickedUnits;
    final all = view.orderedUnits;
    final full = done >= all && all > 0;
    final notStarted = view.startable && !view.picking;
    final matched = view.ordered.where((l) => l.color == 'green').length;
    final short = view.ordered.where((l) => l.color == 'red').length;
    final pending = view.ordered.where((l) => l.color == 'grey').length;
    final barColor = full ? AppColors.success : AppColors.primary;
    return Material(
      color: full ? AppColors.successSoft : Colors.white,
      elevation: 1.5,
      shadowColor: Colors.black26,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Text(
                    notStarted ? 'لم يبدأ التجهيز' : progressLabel(done, all),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: notStarted ? 18 : 26, height: 1.1, color: full ? AppColors.success : AppColors.ink),
                  ),
                ),
                if (full)
                  const Padding(
                    padding: EdgeInsetsDirectional.only(start: 8),
                    child: Pill('اكتمل المطلوب', color: AppColors.success, bg: Colors.white, icon: Icons.check_circle_rounded),
                  )
                else if (view.pickerName != null)
                  Flexible(
                    child: Padding(
                      padding: const EdgeInsetsDirectional.only(start: 8),
                      child: Text(
                        view.pickerName!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.muted, fontSize: 12.5, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: all == 0 ? 0 : done / all, minHeight: 9, borderRadius: BorderRadius.circular(5), color: barColor),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _count('مطابق', matched, 'green'),
                if (short > 0) _count('ناقص', short, 'red'),
                if (pending > 0) _count('لم يُمسح', pending, 'grey'),
                if (view.extras.isNotEmpty) _count('إضافي', view.extras.length, 'yellow'),
              ],
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 180),
              child: flash == null ? const SizedBox(width: double.infinity) : _flash(flash!),
            ),
          ],
        ),
      ),
    );
  }

  Widget _flash(ScanFlash f) {
    final c = pickColor(f.color);
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.fg.withValues(alpha: .5))),
      child: Row(
        children: [
          Icon(c.icon, color: c.fg, size: 26),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(f.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800)),
                Text(f.text, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: c.fg, fontWeight: FontWeight.w800, fontSize: 12.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _count(String label, int n, String color) {
    final c = pickColor(color);
    return Pill('$label: $n', color: c.fg, bg: c.bg, icon: c.icon, small: true);
  }
}

/// تصفية الأسطر: الكل / المتبقي / الناقص / الإضافي.
enum PickFilter { all, remaining, short, extra }

class PickFilterBar extends StatelessWidget {
  const PickFilterBar({super.key, required this.view, required this.value, required this.onChanged});
  final PickView view;
  final PickFilter value;
  final ValueChanged<PickFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    final items = [
      (PickFilter.all, 'الكل', view.lines.length, null),
      (PickFilter.remaining, 'المتبقي', view.remainingLines.length, 'grey'),
      (PickFilter.short, 'الناقص', view.redLines.length, 'red'),
      (PickFilter.extra, 'الإضافي', view.extras.length, 'yellow'),
    ];
    return SizedBox(
      height: 40,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final (f, label, n, color) in items)
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: ChoiceChip(
                  showCheckmark: false,
                  selected: value == f,
                  selectedColor: color == null ? AppColors.primarySoft : pickColor(color).bg,
                  avatar: color == null ? null : Icon(pickColor(color).icon, size: 16, color: pickColor(color).fg),
                  label: Text('$label  ${numFmt(n)}'),
                  onSelected: (_) => onChanged(f),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// ملخص بعد إنهاء التجهيز: الإجمالي النهائي، ما يُحصَّل، الأكياس، النواقص والإضافات.
class PickFinishedSummary extends StatelessWidget {
  const PickFinishedSummary({super.key, required this.view});
  final PickView view;

  @override
  Widget build(BuildContext context) {
    final v = view;
    final m = v.money;
    final short = v.ordered.where((l) => l.missingQty > 0).toList();
    final extras = v.extras.where((l) => l.pickedQty > 0).toList();
    return Panel(
      color: AppColors.successSoft,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.task_alt_rounded, color: AppColors.success, size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      v.finished ? (v.stage == 'READY_FOR_PICKUP' ? 'تم التجهيز — جاهز للاستلام' : 'تم التجهيز') : 'تم التجهيز · ${stageLabels[v.stage] ?? v.stage}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.success),
                    ),
                    Text(
                      [
                        'سيُسلَّم ${piecesLabel(v.deliverUnits)}',
                        if (v.pickerName != null) v.pickerName!,
                      ].join(' · '),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _stat('الإجمالي النهائي', money(m.finalTotal), AppColors.ink),
              _stat('يُحصَّل', m.codAmount == 0 ? 'مدفوع' : money(m.codAmount), AppColors.primary),
              if (v.parcelCount != null) _stat('الأكياس', numFmt(v.parcelCount), AppColors.primary),
            ],
          ),
          if (short.isNotEmpty) ...[
            const SizedBox(height: 10),
            _list('ناقص ${piecesLabel(v.missingUnits)}', 'red', [
              for (final l in short) '${l.name} × ${l.missingQty}${(l.reason ?? '').isNotEmpty ? ' — ${l.reason}' : ''}',
            ]),
          ],
          if (extras.isNotEmpty) ...[
            const SizedBox(height: 8),
            _list('إضافي ${piecesLabel(v.extraUnits)}', 'yellow', [
              for (final l in extras) '${l.name} × ${l.pickedQty}${l.isFree ? ' (هدية)' : ''}',
            ]),
          ],
          if (m.prepaid && m.refundAmount > 0) ...[
            const SizedBox(height: 8),
            Text('يُسترجع للزبونة ${money(m.refundAmount)}', style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800)),
          ],
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) => Container(
    constraints: const BoxConstraints(minWidth: 96),
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: color)),
      ],
    ),
  );

  Widget _list(String title, String color, List<String> rows) {
    final c = pickColor(color);
    return Container(
      padding: const EdgeInsets.all(10),
      // حد جانبي ملوّن (بلا زوايا مدوّرة: الحد غير المتساوي لا يقبلها).
      decoration: BoxDecoration(color: Colors.white, border: BorderDirectional(start: BorderSide(color: c.fg, width: 4))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(c.icon, color: c.fg, size: 18),
              const SizedBox(width: 6),
              Expanded(child: Text(title, style: TextStyle(color: c.fg, fontWeight: FontWeight.w900))),
            ],
          ),
          for (final r in rows)
            Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(r, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, height: 1.4)),
            ),
        ],
      ),
    );
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
