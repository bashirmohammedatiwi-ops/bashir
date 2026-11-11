import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/pick_models.dart';
import '../../widgets/common.dart';
import 'pick_widgets.dart';

Future<T?> _sheet<T>(BuildContext context, Widget Function(BuildContext) builder) => showModalBottomSheet<T>(
  context: context,
  useRootNavigator: true,
  isScrollControlled: true,
  showDragHandle: true,
  backgroundColor: Colors.white,
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
  builder: (c) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(c).bottom),
    child: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 16), child: builder(c))),
  ),
);

Widget _title(String t, [String? sub]) => Padding(
  padding: const EdgeInsets.only(bottom: 12),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(t, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
      if (sub != null) Text(sub, style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.5)),
    ],
  ),
);

Widget _label(String t) => Padding(
  padding: const EdgeInsets.only(top: 14, bottom: 8),
  child: Text(t, style: const TextStyle(fontWeight: FontWeight.w800)),
);

// ---------------------------------------------------------------- extra

typedef ExtraChoice = ({String charge, String? reason, String? substituteForLineId});

/// صنف ليس في الطلب: مدفوع أو هدية، والسبب، وهل هو بديل عن صنف ناقص.
Future<ExtraChoice?> showExtraSheet(BuildContext context, {required ExtraProposal proposal, required List<PickLine> shortLines}) {
  var charge = 'PAID';
  String? reason = shortLines.isNotEmpty ? extraReasons.first : null;
  String? substitute = shortLines.length == 1 ? shortLines.first.id : null;
  return _sheet<ExtraChoice>(
    context,
    (c) => StatefulBuilder(
      builder: (c, set) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _title('صنف ليس ضمن الطلب', 'يُضاف كصنف إضافي ويظهر بالأصفر للكاشير والإدارة'),
          Panel(
            color: AppColors.warningSoft,
            child: Row(
              children: [
                NetImg(proposal.thumb, size: 56, fit: BoxFit.contain),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(proposal.name, style: const TextStyle(fontWeight: FontWeight.w800, height: 1.4)),
                      if (proposal.shadeName != null) Text('اللون: ${proposal.shadeName}', style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w700)),
                      if (proposal.price > 0) Text(money(proposal.price), style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.warning)),
                      Text(proposal.barcode, textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          _label('على حساب من؟'),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'PAID', label: Text('مدفوع'), icon: Icon(Icons.payments_outlined)),
              ButtonSegment(value: 'FREE', label: Text('هدية / عينة'), icon: Icon(Icons.card_giftcard_rounded)),
            ],
            selected: {charge},
            onSelectionChanged: (s) => set(() {
              charge = s.first;
              if (charge == 'FREE' && (reason == null || reason == extraReasons.first || reason == extraReasons[1])) reason = 'هدية';
            }),
          ),
          if (charge == 'PAID')
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text('يُضاف سعره إلى ما تدفعه الزبونة عند الاستلام، ويصلها إشعار بالتعديل.', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
            ),
          _label('السبب'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final r in extraReasons)
                ChoiceChip(label: Text(r), selected: reason == r, onSelected: (_) => set(() => reason = r)),
            ],
          ),
          if (shortLines.isNotEmpty) ...[
            _label('بديل عن صنف ناقص؟'),
            Text(
              'إن كان أغلى من الناقص تُحسب على الزبونة بسعر الناقص.',
              style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(label: const Text('ليس بديلاً'), selected: substitute == null, onSelected: (_) => set(() => substitute = null)),
                for (final l in shortLines)
                  ChoiceChip(
                    label: Text('${l.name}${l.shadeName != null ? ' — ${l.shadeName}' : ''}', overflow: TextOverflow.ellipsis),
                    selected: substitute == l.id,
                    onSelected: (_) => set(() => substitute = l.id),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 18),
          FilledButton.icon(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52), backgroundColor: AppColors.warning),
            onPressed: () => Navigator.pop(c, (charge: charge, reason: reason, substituteForLineId: substitute)),
            icon: const Icon(Icons.add_circle_rounded),
            label: const Text('إضافة كصنف إضافي', style: TextStyle(fontSize: 16)),
          ),
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('لا تضف — أعده للرف')),
        ],
      ),
    ),
  );
}

// ---------------------------------------------------------------- line

/// تعديل سطر يدوياً: العدد، تأكيد بلا مسح، سبب النقص؛ وللإضافي: مدفوع/هدية أو إزالته.
Future<Map<String, dynamic>?> showLineSheet(BuildContext context, {required PickLine line, required List<PickLine> shortLines}) {
  var qty = line.pickedQty;
  String? reason = line.reason;
  var charge = line.charge;
  return _sheet<Map<String, dynamic>>(
    context,
    (c) => StatefulBuilder(
      builder: (c, set) {
        final max = line.isExtra ? 50 : line.orderedQty;
        final short = !line.isExtra && qty < line.orderedQty;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _title(line.name, line.shadeName != null ? 'اللون: ${line.shadeName}' : null),
            PickLineTile(line: line),
            _label(line.isExtra ? 'العدد' : 'العدد المُجهَّز من ${line.orderedQty}'),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(onPressed: qty > 0 ? () => set(() => qty--) : null, icon: const Icon(Icons.remove_rounded)),
                SizedBox(
                  width: 90,
                  child: Text('$qty', textAlign: TextAlign.center, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900)),
                ),
                IconButton.filledTonal(onPressed: qty < max ? () => set(() => qty++) : null, icon: const Icon(Icons.add_rounded)),
              ],
            ),
            if (!line.isExtra && line.barcode == null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.pop(c, {'manualConfirm': true}),
                  icon: const Icon(Icons.fact_check_outlined),
                  label: const Text('منتج بلا باركود — تأكيد يدوي للعدد كاملاً'),
                ),
              ),
            if (short) ...[
              _label('سبب النقص'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final r in shortageReasons)
                    ChoiceChip(
                      label: Text(r),
                      selected: reason == r,
                      selectedColor: AppColors.dangerSoft,
                      onSelected: (_) => set(() => reason = r),
                    ),
                ],
              ),
            ],
            if (line.isExtra) ...[
              _label('على حساب من؟'),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'PAID', label: Text('مدفوع')),
                  ButtonSegment(value: 'FREE', label: Text('هدية / عينة')),
                ],
                selected: {charge},
                onSelectionChanged: (s) => set(() => charge = s.first),
              ),
            ],
            const SizedBox(height: 18),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              onPressed: () => Navigator.pop(c, {
                if (qty != line.pickedQty) 'pickedQty': qty,
                if (short && reason != null && reason != line.reason) 'reason': reason,
                if (line.isExtra && charge != line.charge) 'charge': charge,
              }),
              child: Text(line.isExtra && qty == 0 ? 'إزالة الصنف الإضافي' : 'حفظ'),
            ),
            if (line.isExtra && qty > 0)
              TextButton(
                style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                onPressed: () => Navigator.pop(c, {'pickedQty': 0}),
                child: const Text('إزالة هذا الإضافي'),
              ),
          ],
        );
      },
    ),
  ).then((p) => p == null || p.isEmpty ? null : p);
}

// ---------------------------------------------------------------- finish

typedef FinishChoice = ({int parcelCount, Map<String, String> reasons});

/// ملخص قبل الإنهاء: سبب لكل نقص، عدد الأكياس، والمبلغ الجديد.
Future<FinishChoice?> showFinishSheet(BuildContext context, {required PickView view}) {
  final reasons = <String, String>{for (final l in view.shortLines) if ((l.reason ?? '').isNotEmpty) l.id: l.reason!};
  var parcels = view.parcelCount ?? 1;
  final m = view.money;
  return _sheet<FinishChoice>(
    context,
    (c) => StatefulBuilder(
      builder: (c, set) {
        final missing = view.shortLines.where((l) => !reasons.containsKey(l.id)).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _title('إنهاء التجهيز', 'بعد الإنهاء ينتقل الطلب إلى «بانتظار الكاشير» ويُثبّت مبلغه'),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                _pill('مطابق', view.ordered.where((l) => l.complete).length, 'green'),
                if (view.shortLines.isNotEmpty) _pill('ناقص', view.shortLines.length, 'red'),
                if (view.extras.isNotEmpty) _pill('إضافي', view.extras.length, 'yellow'),
              ],
            ),
            if (view.shortLines.isNotEmpty) ...[
              _label('سبب كل نقص (إلزامي)'),
              for (final l in view.shortLines)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.dangerSoft.withValues(alpha: .6),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: reasons.containsKey(l.id) ? AppColors.line : AppColors.danger),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${l.name}${l.shadeName != null ? ' — ${l.shadeName}' : ''}  (ناقص ${l.missingQty} من ${l.orderedQty})',
                        style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.danger),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          for (final r in shortageReasons)
                            ChoiceChip(
                              label: Text(r),
                              selected: reasons[l.id] == r,
                              onSelected: (_) => set(() => reasons[l.id] = r),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
            _label('عدد الأكياس / الطرود'),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(onPressed: parcels > 1 ? () => set(() => parcels--) : null, icon: const Icon(Icons.remove_rounded)),
                SizedBox(width: 80, child: Text('$parcels', textAlign: TextAlign.center, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900))),
                IconButton.filledTonal(onPressed: parcels < 20 ? () => set(() => parcels++) : null, icon: const Icon(Icons.add_rounded)),
              ],
            ),
            _label('المبلغ'),
            Panel(
              child: Column(
                children: [
                  _row('الأصلي', money(view.total)),
                  if (m.changed) _row('الجديد', money(m.finalTotal), bold: true),
                  _row('تحصّله شركة التوصيل', m.codAmount == 0 ? 'لا شيء (مدفوع)' : money(m.codAmount), bold: true, color: AppColors.primary),
                  if (m.refundAmount > 0) _row('يُسترجع للزبونة بالبطاقة', money(m.refundAmount), color: AppColors.danger),
                ],
              ),
            ),
            if (m.needsApproval)
              const Padding(
                padding: EdgeInsets.only(top: 10),
                child: Text(
                  'التعديل كبير: إنهاء التجهيز يحتاج حساب مدير.',
                  style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w800),
                ),
              ),
            const SizedBox(height: 18),
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), backgroundColor: AppColors.success),
              onPressed: missing.isEmpty ? () => Navigator.pop(c, (parcelCount: parcels, reasons: reasons)) : null,
              icon: const Icon(Icons.task_alt_rounded),
              label: Text(missing.isEmpty ? 'تأكيد إنهاء التجهيز' : 'اختر سبب ${missing.length} نقص', style: const TextStyle(fontSize: 16)),
            ),
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('رجوع للمسح')),
          ],
        );
      },
    ),
  );
}

Widget _pill(String label, int n, String color) {
  final c = pickColor(color);
  return Pill('$label: $n', color: c.fg, bg: c.bg, icon: c.icon);
}

Widget _row(String k, String v, {bool bold = false, Color? color}) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 3),
  child: Row(
    children: [
      Text(k, style: const TextStyle(color: AppColors.muted)),
      const Spacer(),
      Text(v, style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, color: color, fontSize: bold ? 16 : 14)),
    ],
  ),
);
