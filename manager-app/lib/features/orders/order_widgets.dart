import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/order_flow.dart';
import '../../data/pick_models.dart';
import '../../widgets/common.dart';
import '../pick/pick_widgets.dart';

// قطع شاشة الطلب المبنية على مرحلة التجهيز — نفسها في تطبيق التجهيز وتطبيق المدير.

const _teal = Color(0xFF0E9AA7);
const _indigo = Color(0xFF4F56C8);
const _sky = Color(0xFF0B7FAB);

Color stageColor(String? stage) => switch (stage) {
  'NEW' => AppColors.warning,
  'CONFIRMED' => AppColors.info,
  'PICKING' => AppColors.primary,
  'PICKED' || 'READY_FOR_PICKUP' => _teal,
  'INVOICED' || 'HANDED_OVER' => _indigo,
  'OUT_FOR_DELIVERY' => _sky,
  'DELIVERED' => AppColors.success,
  'PARTIALLY_DELIVERED' => AppColors.warning,
  'DELIVERY_ISSUE' || 'RETURNING' || 'RETURNED' || 'CANCELLED' => AppColors.danger,
  _ => AppColors.muted,
};

IconData stageIcon(String? stage) => switch (stage) {
  'NEW' => Icons.fiber_new_rounded,
  'CONFIRMED' => Icons.check_circle_outline_rounded,
  'PICKING' => Icons.qr_code_scanner_rounded,
  'PICKED' => Icons.point_of_sale_rounded,
  'READY_FOR_PICKUP' => Icons.storefront_rounded,
  'INVOICED' => Icons.receipt_long_rounded,
  'HANDED_OVER' => Icons.inventory_rounded,
  'OUT_FOR_DELIVERY' => Icons.delivery_dining_rounded,
  'DELIVERY_ISSUE' => Icons.report_problem_rounded,
  'DELIVERED' => Icons.verified_rounded,
  'PARTIALLY_DELIVERED' => Icons.rule_rounded,
  'RETURNING' || 'RETURNED' => Icons.assignment_return_rounded,
  'CANCELLED' => Icons.cancel_rounded,
  _ => Icons.circle_outlined,
};

/// شارة المرحلة: لون + أيقونة + اسم.
class StagePill extends StatelessWidget {
  const StagePill(this.stage, {super.key, this.small = false});
  final String stage;
  final bool small;
  @override
  Widget build(BuildContext context) {
    final c = stageColor(stage);
    return Pill(stageLabels[stage] ?? stage, color: c, bg: c.withValues(alpha: .12), small: small, icon: stageIcon(stage));
  }
}

/// مسار المراحل في رأس شاشة الطلب، مع شريط ملوّن للمشاكل والمرتجعات والإلغاء.
class StageTrackPanel extends StatelessWidget {
  const StageTrackPanel({super.key, required this.stage, required this.pickup, this.createdAt});
  final String stage;
  final bool pickup;
  final DateTime? createdAt;

  @override
  Widget build(BuildContext context) {
    final t = stageTrack(stage, pickup: pickup);
    final alert = t.alert;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (alert != null) ...[StageAlertBanner(alert: alert), const SizedBox(height: 10)],
        if (t.current >= 0)
          Panel(
            padding: const EdgeInsets.fromLTRB(6, 14, 6, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (var i = 0; i < t.steps.length; i++) Expanded(child: _step(t, i)),
              ],
            ),
          ),
      ],
    );
  }

  Widget _step(StageTrack t, int i) {
    final done = t.isDone(i);
    final now = i == t.current;
    final reached = done || now;
    final c = now ? (t.alert != null ? stageColor(stage) : stageColor(t.steps[i].key)) : AppColors.success;
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Container(height: 2, color: i == 0 ? Colors.transparent : (reached ? AppColors.success : AppColors.line))),
            CircleAvatar(
              radius: 13,
              backgroundColor: reached ? c : AppColors.line,
              child: Icon(
                done ? Icons.check_rounded : (now ? stageIcon(t.alert != null ? stage : t.steps[i].key) : Icons.circle),
                size: done || now ? 15 : 7,
                color: Colors.white,
              ),
            ),
            Expanded(
              child: Container(height: 2, color: i == t.steps.length - 1 ? Colors.transparent : (done ? AppColors.success : AppColors.line)),
            ),
          ],
        ),
        const SizedBox(height: 5),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 1),
          child: Text(
            t.steps[i].label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 10.5,
              height: 1.25,
              fontWeight: now ? FontWeight.w900 : FontWeight.w600,
              color: now ? c : (reached ? AppColors.ink : AppColors.muted),
            ),
          ),
        ),
      ],
    );
  }
}

class StageAlertBanner extends StatelessWidget {
  const StageAlertBanner({super.key, required this.alert});
  final StageAlert alert;
  @override
  Widget build(BuildContext context) {
    final fg = alert.severe ? AppColors.danger : AppColors.warning;
    return Panel(
      color: alert.severe ? AppColors.dangerSoft : AppColors.warningSoft,
      child: Row(
        children: [
          Icon(stageIcon(alert.stage), color: fg, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(alert.title, style: TextStyle(color: fg, fontWeight: FontWeight.w900, fontSize: 16)),
                Text(alert.message, style: const TextStyle(height: 1.5, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// شارة عدّ ملوّنة: «ناقص 1» بالأحمر، «+2 إضافي» بالأصفر.
Widget pickChip(String text, String color, {bool small = true}) {
  final c = pickColor(color);
  return Pill(text, color: c.fg, bg: c.bg, small: small, icon: c.icon);
}

/// نتيجة التجهيز في شاشة الطلب: ما سيُسلَّم فعلاً بالألوان، النواقص بأسبابها، والإضافات.
class PickResultSection extends StatelessWidget {
  const PickResultSection({super.key, required this.view, this.onOpen});
  final PickView view;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    final v = view;
    final picking = v.picking;
    final head = picking
        ? 'مُسح ${numFmt(v.pickedUnits)} من ${piecesLabel(v.orderedUnits, genitive: true)}'
        : deliverLabel(units: v.deliverUnits, lines: v.deliverLines);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Panel(
          color: picking ? AppColors.primaryLight : (v.missingUnits == 0 && v.extraUnits == 0 ? AppColors.successSoft : Colors.white),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(head, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (!picking && v.missingUnits == 0 && v.extraUnits == 0) pickChip('مطابق للطلب', 'green', small: false),
                  if (!picking && v.missingUnits > 0) pickChip('ناقص ${numFmt(v.missingUnits)}', 'red', small: false),
                  if (picking && v.remainingLines.isNotEmpty) pickChip('متبقٍ ${linesLabel(v.remainingLines.length)}', 'grey', small: false),
                  if (picking && v.redLines.isNotEmpty) pickChip('ناقص ${linesLabel(v.redLines.length)}', 'red', small: false),
                  if (v.extraUnits > 0) pickChip('إضافي ${numFmt(v.extraUnits)}', 'yellow', small: false),
                  if (v.parcelCount != null && !picking)
                    Pill('${numFmt(v.parcelCount)} كيس', color: AppColors.primary, bg: AppColors.primarySoft, icon: Icons.shopping_bag_outlined),
                  if (v.pickerName != null)
                    Pill(v.pickerName!, color: AppColors.muted, bg: AppColors.scaffold, icon: Icons.badge_outlined),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'المطلوب: ${orderSizeLabel(lines: v.ordered.length, units: v.orderedUnits)}',
                  style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Panel(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < v.ordered.length; i++) ...[
                if (i > 0) const Divider(height: 1, indent: 76),
                PickLineTile(line: v.ordered[i], onTap: onOpen),
              ],
            ],
          ),
        ),
        if (v.extras.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 14, 4, 8),
            child: Row(
              children: [
                Icon(pickColor('yellow').icon, color: AppColors.warning, size: 18),
                const SizedBox(width: 6),
                const Expanded(
                  child: Text('أصناف إضافية', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                ),
              ],
            ),
          ),
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < v.extras.length; i++) ...[
                  if (i > 0) const Divider(height: 1, indent: 76),
                  PickLineTile(
                    line: v.extras[i],
                    substituteFor: v.ordered.where((l) => l.id == v.extras[i].substituteForLineId).firstOrNull?.name,
                    onTap: onOpen,
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

/// شحنة هاي إكسبريس: رقم التتبع (يُنسخ)، حالة شركة التوصيل، المندوب، المبلغ المطلوب تحصيله، وآخر خطأ.
class ShipmentCard extends StatelessWidget {
  const ShipmentCard({super.key, required this.shipment});
  final ShipmentInfo shipment;

  @override
  Widget build(BuildContext context) {
    final s = shipment;
    final stateColor = switch (s.state) {
      'CREATED' => AppColors.success,
      'FAILED' => AppColors.danger,
      'RETRYING' || 'PENDING' || 'CREATING' => AppColors.warning,
      _ => AppColors.muted,
    };
    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.local_shipping_rounded, color: _sky),
              const SizedBox(width: 8),
              const Expanded(
                child: Text('هاي إكسبريس', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              ),
              Pill(s.stateLabel, color: stateColor, bg: stateColor.withValues(alpha: .12), small: true),
            ],
          ),
          const SizedBox(height: 10),
          if (s.trackingNumber != null)
            Material(
              color: AppColors.scaffold,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: s.trackingNumber!));
                  toast(context, 'نُسخ رقم التتبع');
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    children: [
                      const Text('رقم التتبع', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          s.trackingNumber!,
                          textDirection: TextDirection.ltr,
                          textAlign: TextAlign.end,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: .5),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.copy_rounded, size: 18, color: AppColors.primary),
                    ],
                  ),
                ),
              ),
            ),
          if (s.statusName != null)
            _kv('حالة شركة التوصيل', [s.statusName!, if (s.statusAt != null) timeAgo(s.statusAt)].join(' · ')),
          if (s.driverName != null) _kv('المندوب', s.driverName!),
          if (s.codAmount != null) _kv('يحصّله المندوب', s.codAmount == 0 ? 'لا شيء (مدفوع)' : money(s.codAmount), bold: true),
          if ((s.collectedAmount ?? 0) > 0) _kv('حُصّل', money(s.collectedAmount), color: AppColors.success),
          if (s.deliveryAttempts > 1) _kv('محاولات التوصيل', numFmt(s.deliveryAttempts)),
          if (s.lastError != null || s.alert != null)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppColors.dangerSoft, borderRadius: BorderRadius.circular(12)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      [s.alert, s.lastError].whereType<String>().join('\n'),
                      style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700, height: 1.5, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          if (s.events.isNotEmpty) ...[
            const Divider(height: 20),
            for (final e in s.events.take(4))
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 6),
                      child: Icon(Icons.circle, size: 7, color: _sky),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        [e.label, e.note].whereType<String>().join(' — '),
                        style: const TextStyle(fontSize: 13, height: 1.5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(timeAgo(e.at), style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}

/// المبلغ: الإجمالي الأصلي ← الإجمالي بعد التجهيز وتعديلات الكاشير، ما تحصّله شركة التوصيل، والمسترجع.
class OrderMoneyCard extends StatelessWidget {
  const OrderMoneyCard({super.key, required this.order, this.pick});
  final OrderDetail order;
  final PickView? pick;

  @override
  Widget build(BuildContext context) {
    final o = order;
    final m = pick?.money;
    final finalTotal = o.finalTotal ?? (o.pickStarted ? m?.finalTotal : null);
    final changed = finalTotal != null && finalTotal != o.total;
    final cod = o.codAmount ?? (o.pickStarted ? m?.codAmount : null);
    final refund = m != null && m.prepaid && m.refundAmount > 0 ? m.refundAmount : 0;
    return Panel(
      child: Column(
        children: [
          _kv('المجموع', money(o.subtotal)),
          if (o.discountTotal > 0) _kv('الخصم${o.coupon != null ? ' (${o.coupon})' : ''}', '- ${money(o.discountTotal)}', color: AppColors.rose),
          if (o.loyaltySpent > 0) _kv('نقاط مستخدمة', numFmt(o.loyaltySpent)),
          _kv('التوصيل', o.shippingTotal == 0 ? 'مجاني' : money(o.shippingTotal)),
          const Divider(),
          _kv(changed ? 'الإجمالي الأصلي' : 'الإجمالي', money(o.total), bold: !changed, strike: changed),
          if (changed) ...[
            if (m != null && m.shortageValue > 0) _kv('النواقص', '- ${money(m.shortageValue)}', color: AppColors.danger),
            if (m != null && m.extrasValue > 0) _kv('الإضافات المدفوعة', '+ ${money(m.extrasValue)}', color: AppColors.warning),
            if (m != null && m.roundingDiscount > 0) _kv('تقريب لصالح الزبونة', '- ${money(m.roundingDiscount)}'),
            _kv('الإجمالي النهائي', money(finalTotal), bold: true, color: AppColors.warning),
          ],
          if (cod != null) _kv('تحصّله شركة التوصيل', cod == 0 ? 'لا شيء (مدفوع)' : money(cod), bold: true, color: AppColors.primary),
          if (refund > 0) _kv('يُسترجع للزبونة', money(refund), color: AppColors.danger),
          const SizedBox(height: 6),
          _kv('الدفع', '${paymentMethodLabels[o.paymentMethod] ?? o.paymentMethod} · ${paymentStatusLabels[o.paymentStatus] ?? o.paymentStatus}'),
          _kv('التوصيل', deliveryLabels[o.deliveryOption] ?? o.deliveryOption),
          if (o.posReceiptNumber != null)
            _kv(
              'إيصال الكاشير',
              [o.posReceiptNumber!, if (o.posCashierName != null) o.posCashierName!, if (o.posInvoicedAt != null) timeAgo(o.posInvoicedAt)].join(' · '),
            ),
        ],
      ),
    );
  }
}

/// الخط الزمني للطلب (بدل السجل القديم): من فعل ماذا ومتى.
class TimelineCard extends StatelessWidget {
  const TimelineCard({super.key, required this.entries});
  final List<TimelineEntry> entries;

  static (IconData, Color) _look(TimelineEntry e) => switch (e.type) {
    'PICK_STARTED' || 'PICK_TAKEOVER' => (Icons.qr_code_scanner_rounded, AppColors.primary),
    'PICK_FINISHED' => (Icons.task_alt_rounded, AppColors.success),
    'PICK_EXTRA_ADDED' => (Icons.add_circle_rounded, AppColors.warning),
    'PICK_LINE_EDITED' || 'POS_EDIT' => (Icons.edit_note_rounded, AppColors.warning),
    'PICK_REOPENED' => (Icons.lock_open_rounded, AppColors.warning),
    'INVOICED' || 'PICKUP_HANDED' => (Icons.point_of_sale_rounded, _indigo),
    'POS_RETURN' => (Icons.assignment_return_rounded, AppColors.danger),
    'SHIPMENT_CREATED' || 'COURIER_STATUS' => (Icons.local_shipping_rounded, _sky),
    'SHIPMENT_FAILED' || 'REFUND_FAILED' || 'COURIER_STATUS_UNKNOWN' => (Icons.error_outline_rounded, AppColors.danger),
    'SHIPMENT_RETRYING' || 'SHIPMENT_RETRY' => (Icons.refresh_rounded, AppColors.warning),
    'SHIPMENT_CANCELLED' => (Icons.cancel_outlined, AppColors.danger),
    'CUSTOMER_NOTIFIED' => (Icons.notifications_active_outlined, AppColors.info),
    'STATUS_CHANGED' => (Icons.swap_horiz_rounded, AppColors.info),
    _ => (Icons.circle_outlined, AppColors.muted),
  };

  @override
  Widget build(BuildContext context) => Panel(
    child: Column(
      children: [
        for (var i = 0; i < entries.length; i++) _row(entries[i], last: i == entries.length - 1),
      ],
    ),
  );

  Widget _row(TimelineEntry e, {required bool last}) {
    final (icon, color) = _look(e);
    final detail = timelineDetail(e);
    final actor = timelineActor(e);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              CircleAvatar(radius: 14, backgroundColor: color.withValues(alpha: .12), child: Icon(icon, size: 16, color: color)),
              if (!last) Expanded(child: Container(width: 2, color: AppColors.line)),
            ],
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: last ? 0 : 12, top: 3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(e.label, style: const TextStyle(fontWeight: FontWeight.w800, height: 1.35)),
                  if (detail != null) Text(detail, style: const TextStyle(fontSize: 12.5, height: 1.5)),
                  Text(
                    [actor, dateTimeFmt(e.at)].whereType<String>().join(' · '),
                    style: const TextStyle(color: AppColors.muted, fontSize: 11.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// مكان الأزرار بعد التجهيز: ما ينتظره الطلب الآن (بدل انتقالات يدوية تتجاوز الكاشير وشركة التوصيل).
class StageWaitingBar extends StatelessWidget {
  const StageWaitingBar({super.key, required this.stage, required this.title, this.hint, this.onOpenPick});
  final String stage, title;
  final String? hint;
  final VoidCallback? onOpenPick;

  @override
  Widget build(BuildContext context) {
    final c = stageColor(stage);
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
        decoration: BoxDecoration(
          color: c.withValues(alpha: .1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: c.withValues(alpha: .35)),
        ),
        child: Row(
          children: [
            Icon(stageIcon(stage), color: c, size: 26),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: c, fontWeight: FontWeight.w900, fontSize: 15)),
                  if (hint != null)
                    Text(hint!, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, height: 1.4)),
                ],
              ),
            ),
            if (onOpenPick != null)
              TextButton(onPressed: onOpenPick, child: const Text('عرض التجهيز')),
          ],
        ),
      ),
    );
  }
}

Widget _kv(String k, String v, {bool bold = false, Color? color, bool strike = false}) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 3),
  child: Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Flexible(
        flex: 4,
        child: Text(k, style: TextStyle(color: AppColors.muted, fontWeight: bold ? FontWeight.w800 : FontWeight.w500)),
      ),
      const SizedBox(width: 12),
      Expanded(
        flex: 5,
        child: Text(
          v,
          textAlign: TextAlign.end,
          style: TextStyle(
            fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
            fontSize: bold ? 16 : 14,
            color: strike ? AppColors.muted : color,
            decoration: strike ? TextDecoration.lineThrough : null,
          ),
        ),
      ),
    ],
  ),
);

// ---------------------------------------------------------------- الطابور

/// تبويبات الطابور حسب المرحلة، مع العدد (المشاكل بالأحمر).
class OrderTabsBar extends StatefulWidget {
  const OrderTabsBar({super.key, required this.tabs, required this.selected, required this.counts, required this.onSelect});
  final List<OrderTab> tabs;
  final String selected;
  final Map<String, int> counts;
  final ValueChanged<OrderTab> onSelect;

  @override
  State<OrderTabsBar> createState() => _OrderTabsBarState();
}

class _OrderTabsBarState extends State<OrderTabsBar> {
  final _keys = <String, GlobalKey>{};

  @override
  void initState() {
    super.initState();
    // فُتح على تبويب بعيد (من اللوحة الرئيسية مثلاً)؟ نُظهره.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final c = _keys[widget.selected]?.currentContext;
      if (c != null && c.mounted) Scrollable.ensureVisible(c, alignment: .5, duration: const Duration(milliseconds: 200));
    });
  }

  @override
  Widget build(BuildContext context) {
    final tabs = widget.tabs, selected = widget.selected, counts = widget.counts;
    // كل التبويبات مبنية (لا ListView كسول) ليصل ensureVisible لأبعدها.
    return SizedBox(
      height: 40,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final t in tabs)
              Padding(
                key: _keys.putIfAbsent(t.key, GlobalKey.new),
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: ChoiceChip(
                  showCheckmark: false,
                  selectedColor: AppColors.primarySoft,
                  selected: selected == t.key,
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(t.label),
                      if (t.countIn(counts) case final n?) ...[
                        const SizedBox(width: 6),
                        _CountBadge(n: n, alert: t.key == tabIssues.key && n > 0, selected: selected == t.key),
                      ],
                    ],
                  ),
                  onSelected: (_) => widget.onSelect(t),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.n, required this.alert, required this.selected});
  final int n;
  final bool alert, selected;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
    decoration: BoxDecoration(
      color: alert ? AppColors.danger : (selected ? AppColors.primary : AppColors.line),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Text(
      numFmt(n),
      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: alert || selected ? Colors.white : AppColors.ink),
    ),
  );
}

/// بطاقة طلب في الطابور: المرحلة بلونها، والبنود والقطع الصحيحة — وبعد التجهيز ما سيُسلَّم مع النقص والإضافة.
class OrderTile extends StatelessWidget {
  const OrderTile({super.key, required this.order, required this.onTap});
  final OrderSummary order;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final o = order;
    final stage = o.stage;
    final isNew = stage == 'NEW' || (stage == null && o.status == 'PENDING');
    final issue = stagesIssues.contains(stage);
    final p = o.pick;
    final picking = stage == 'PICKING';
    final started = pickStartedFor(stage) || (stage == 'CANCELLED' && p != null);
    const strong = TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary);
    return Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(12),
      color: issue ? const Color(0xFFFFF6F6) : (isNew ? const Color(0xFFFFFBF2) : Colors.white),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(o.orderNumber, textDirection: TextDirection.ltr, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15.5)),
                    if (stage != null)
                      StagePill(stage, small: true)
                    else
                      Pill(orderStatusLabels[o.status] ?? o.status, color: AppColors.muted, bg: AppColors.scaffold, small: true),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(timeAgo(o.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(o.customer, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (o.place != null)
                      Text(o.place!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        // قبل التجهيز: البنود والقطع المطلوبة. أثناءه: ما مُسح. بعده: ما سيُسلَّم.
                        if (p != null && started && !picking) ...[
                          Text(deliverLabel(units: p.units), style: strong),
                          if (p.missingUnits > 0) pickChip('ناقص ${numFmt(p.missingUnits)}', 'red'),
                          if (p.extraUnits > 0) pickChip('+${numFmt(p.extraUnits)} إضافي', 'yellow'),
                        ] else if (p != null && picking) ...[
                          Text('مُسح ${numFmt(p.matchedUnits)} من ${piecesLabel(o.quantity, genitive: true)}', style: strong),
                          if (p.extraUnits > 0) pickChip('+${numFmt(p.extraUnits)} إضافي', 'yellow'),
                        ] else
                          Text(orderSizeLabel(lines: o.itemsCount, units: o.quantity), style: strong),
                        Text(money(o.total), style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                        if (picking && o.pickerName != null)
                          Pill('يجهّزه ${o.pickerName}', color: AppColors.primary, bg: AppColors.primarySoft, small: true, icon: Icons.person_outline_rounded),
                        if (o.adjusted)
                          const Pill('نقص/إضافة', color: AppColors.warning, bg: AppColors.warningSoft, small: true, icon: Icons.rule_rounded),
                        if (o.paymentMethod == 'CARD')
                          Pill(
                            o.paymentStatus == 'PAID' ? 'مدفوع بالبطاقة' : 'بطاقة',
                            color: AppColors.info,
                            bg: AppColors.infoSoft,
                            small: true,
                            icon: Icons.credit_card_rounded,
                          ),
                        if (o.isPickup)
                          const Pill('استلام من المحل', color: _teal, bg: Color(0xFFE2F5F6), small: true, icon: Icons.storefront_rounded),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              SizedBox(
                width: 88,
                height: 44,
                child: Stack(
                  children: [
                    for (var k = o.thumbs.length.clamp(0, 3) - 1; k >= 0; k--)
                      PositionedDirectional(
                        start: k * 23.0,
                        child: Container(
                          decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white, width: 2)),
                          child: NetImg(o.thumbs[k], size: 40, radius: 9, fit: BoxFit.contain),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
