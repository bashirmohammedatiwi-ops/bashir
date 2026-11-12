import 'package:flutter/foundation.dart';
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
  constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * .94),
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
      Text(t, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, height: 1.4)),
      if (sub != null) Text(sub, style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.5)),
    ],
  ),
);

Widget _label(String t) => Padding(
  padding: const EdgeInsets.only(top: 14, bottom: 8),
  child: Text(t, style: const TextStyle(fontWeight: FontWeight.w800)),
);

// ---------------------------------------------------------------- السبب

/// سبب الإزالة أو النقص: اختيار جاهز أو «سبب آخر…» يُكتب.
Future<String?> showReasonSheet(BuildContext context, {required String title, String? subtitle, String? initial, String ok = 'تأكيد'}) {
  String? picked = initial != null && removeReasons.contains(initial) ? initial : null;
  var other = initial != null && initial.isNotEmpty && !removeReasons.contains(initial);
  final text = TextEditingController(text: other ? initial : '');
  return _sheet<String>(
    context,
    (c) => StatefulBuilder(
      builder: (c, set) {
        final value = other ? text.text.trim() : picked;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _title(title, subtitle),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final r in removeReasons)
                  PickChip(
                    label: r,
                    selected: !other && picked == r,
                    color: AppColors.danger,
                    onTap: () => set(() {
                      other = false;
                      picked = r;
                    }),
                  ),
                PickChip(
                  label: 'سبب آخر…',
                  selected: other,
                  color: AppColors.danger,
                  icon: Icons.edit_outlined,
                  onTap: () => set(() => other = true),
                ),
              ],
            ),
            if (other) ...[
              const SizedBox(height: 12),
              TextField(
                controller: text,
                autofocus: true,
                maxLength: 200,
                onChanged: (_) => set(() {}),
                decoration: const InputDecoration(hintText: 'اكتب السبب'),
              ),
            ],
            const SizedBox(height: 14),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52), backgroundColor: AppColors.danger),
              onPressed: value == null || value.isEmpty ? null : () => Navigator.pop(c, value),
              child: Text(ok, style: const TextStyle(fontSize: 16)),
            ),
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('رجوع')),
          ],
        );
      },
    ),
  );
}

// ---------------------------------------------------------------- تفاصيل المنتج

/// ما تعرضه نافذة المنتج — يتحدّث مباشرة مع كل تعديل أو تحديث من السيرفر.
@immutable
class PickSheetData {
  const PickSheetData({required this.items, this.saving = const {}, this.editable = false});
  final List<PickItem> items;
  final Set<String> saving;
  final bool editable;
  PickItem? byId(String id) => items.where((i) => i.id == id).firstOrNull;
}

/// أفعال نافذة المنتج (تنفّذها شاشة الجمع).
class PickItemActions {
  const PickItemActions({required this.setTotal, required this.remove, required this.shortReason, required this.restore, required this.setCharge});

  /// العدد الكلي الجديد (المطلوب + الزيادة، أو عدد الإضافي).
  final void Function(PickItem item, int total) setTotal;
  final Future<void> Function(PickItem item) remove;
  final Future<void> Function(PickItem item) shortReason;
  final Future<void> Function(PickItem item) restore;
  final Future<void> Function(PickItem item, String charge) setCharge;
}

/// المنتج بحجم كبير: الصورة، الباركود، الكمية بأزرار كبيرة، «تم جمعه بالكامل»، والإزالة بسبب.
/// السابق/التالي للتنقل، وبعد «تم جمعه بالكامل» ينتقل تلقائياً للمنتج التالي غير المجموع.
Future<void> showItemSheet(
  BuildContext context, {
  required ValueListenable<PickSheetData> data,
  required String itemId,
  required List<String> order,
  required PickItemActions actions,
}) => showModalBottomSheet<void>(
  context: context,
  useRootNavigator: true,
  isScrollControlled: true,
  showDragHandle: true,
  backgroundColor: Colors.white,
  constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * .94),
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
  builder: (c) => PickItemSheet(data: data, itemId: itemId, order: order, actions: actions),
);

class PickItemSheet extends StatefulWidget {
  const PickItemSheet({super.key, required this.data, required this.itemId, required this.order, required this.actions});
  final ValueListenable<PickSheetData> data;
  final String itemId;
  final List<String> order;
  final PickItemActions actions;
  @override
  State<PickItemSheet> createState() => _PickItemSheetState();
}

class _PickItemSheetState extends State<PickItemSheet> {
  late String _id = widget.itemId;

  int get _pos => widget.order.indexOf(_id);

  void _go(int delta) {
    final i = _pos + delta;
    if (i < 0 || i >= widget.order.length) return;
    setState(() => _id = widget.order[i]);
  }

  /// بعد جمع منتج: التالي غير المجموع (حسب ترتيب الفتح)، أو الإغلاق إن انتهى كل شيء.
  void _advance() {
    final d = widget.data.value;
    final start = _pos;
    for (var k = 1; k <= widget.order.length; k++) {
      final id = widget.order[(start + k) % widget.order.length];
      if (id == _id) continue;
      final it = d.byId(id);
      if (it != null && !it.settled) {
        Future.delayed(const Duration(milliseconds: 280), () {
          if (mounted) setState(() => _id = id);
        });
        return;
      }
    }
    Future.delayed(const Duration(milliseconds: 280), () {
      if (mounted) Navigator.maybePop(context);
    });
  }

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<PickSheetData>(
    valueListenable: widget.data,
    builder: (context, d, _) {
      final item = d.byId(_id);
      return SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: item == null ? _gone() : _body(item, d.editable, d.saving.contains(item.id)),
        ),
      );
    },
  );

  Widget _gone() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SizedBox(height: 20),
      const Icon(Icons.info_outline_rounded, size: 40, color: AppColors.muted),
      const SizedBox(height: 8),
      const Text('هذا المنتج لم يعد في الطلب', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      const Text('ربما عدّله كاشير الطلبات.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
      const SizedBox(height: 16),
      FilledButton(onPressed: () => Navigator.pop(context), child: const Text('حسناً')),
    ],
  );

  Widget _body(PickItem i, bool editable, bool saving) {
    final l = i.line;
    final c = itemLook(i.state);
    final a = widget.actions;
    final partial = !i.isExtra && i.picked > 0 && i.picked < i.orderedQty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // التنقل بين المنتجات.
        if (widget.order.length > 1)
          Row(
            children: [
              IconButton(tooltip: 'السابق', onPressed: _pos > 0 ? () => _go(-1) : null, icon: const Icon(Icons.chevron_right_rounded, size: 30)),
              Expanded(
                child: Text(
                  '${numFmt(_pos + 1)} من ${numFmt(widget.order.length)}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700),
                ),
              ),
              IconButton(
                tooltip: 'التالي',
                onPressed: _pos < widget.order.length - 1 ? () => _go(1) : null,
                icon: const Icon(Icons.chevron_left_rounded, size: 30),
              ),
            ],
          ),
        Container(
          height: 220,
          decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(18)),
          child: NetImg(l.bigImage, width: double.infinity, height: 220, radius: 18, fit: BoxFit.contain),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            Pill(itemBadge(i), color: i.state == PickItemState.pending ? AppColors.ink : c.fg, bg: i.state == PickItemState.pending ? AppColors.scaffold : c.bg, icon: c.icon),
            if (l.isExtra && l.posOnly) const Pill('من المحل — غير موجود في التطبيق', color: AppColors.info, bg: AppColors.infoSoft),
            if (l.isExtra && l.isFree) const Pill('هدية', color: AppColors.rose, bg: AppColors.roseSoft, icon: Icons.card_giftcard_rounded),
          ],
        ),
        const SizedBox(height: 8),
        Text(l.name, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900, height: 1.45)),
        if (l.shadeName != null)
          Text('اللون: ${l.shadeName}', style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w800, fontSize: 15)),
        if ((l.barcode ?? '').isNotEmpty) ...[
          const SizedBox(height: 8),
          Material(
            color: AppColors.scaffold,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => copyBarcode(context, l.barcode!),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 6, 4, 6),
                child: Row(
                  children: [
                    Expanded(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: AlignmentDirectional.centerStart,
                        child: Text(
                          l.barcode!,
                          textDirection: TextDirection.ltr,
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.copy_rounded, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 8),
        Wrap(
          spacing: 16,
          runSpacing: 4,
          children: [
            if (l.unitPrice > 0) Text('السعر ${money(l.unitPrice)}', style: const TextStyle(fontWeight: FontWeight.w700)),
            if (!i.isExtra) Text('المطلوب ${numFmt(i.orderedQty)}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
          ],
        ),
        const SizedBox(height: 14),
        // العدد بأزرار كبيرة.
        Center(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              MiniStepper(
                big: true,
                value: i.total,
                color: switch (i.state) {
                  PickItemState.pending || PickItemState.partial => AppColors.primary,
                  _ => c.fg,
                },
                onMinus: editable && i.total > 0 ? () => _minus(i) : null,
                onPlus: editable && canPlus(i) ? () => a.setTotal(i, i.total + 1) : null,
              ),
              if (saving)
                const PositionedDirectional(
                  top: -6,
                  end: -6,
                  child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.4)),
                ),
            ],
          ),
        ),
        if (!i.isExtra)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              i.state == PickItemState.over
                  ? i.qtyText
                  : i.missingQty > 0
                  ? 'جُمع ${numFmt(i.picked)} من ${numFmt(i.orderedQty)} — ناقص ${numFmt(i.missingQty)}'
                  : 'جُمع كاملاً ✓',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: i.state == PickItemState.over ? overBlue : (i.missingQty > 0 ? AppColors.muted : AppColors.success),
              ),
            ),
          ),
        if (editable && !i.isExtra && i.picked >= i.orderedQty && !i.canOver)
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Text('منتج بلا باركود — الزيادة تُضاف من الكاميرا', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 12)),
          ),
        if (editable) ...[
          const SizedBox(height: 14),
          if (!i.isExtra && i.picked < i.orderedQty)
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56), backgroundColor: AppColors.success),
              onPressed: () {
                a.setTotal(i, i.orderedQty);
                _advance();
              },
              icon: const Icon(Icons.check_circle_rounded),
              label: const Text('تم جمعه بالكامل', style: TextStyle(fontSize: 17)),
            ),
          if (partial && !i.hasReason) ...[
            const SizedBox(height: 10),
            Panel(
              color: AppColors.dangerSoft,
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'ناقص ${numFmt(i.missingQty)} — اختر السبب',
                      style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800),
                    ),
                  ),
                  TextButton(onPressed: () => a.shortReason(i), child: const Text('سبب النقص')),
                ],
              ),
            ),
          ],
          if (i.hasReason && (i.state == PickItemState.short || i.state == PickItemState.removed)) ...[
            const SizedBox(height: 10),
            Panel(
              color: AppColors.dangerSoft,
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${i.state == PickItemState.removed ? 'أُزيل' : 'ناقص ${numFmt(i.missingQty)}'}: ${i.reason}',
                      style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800, height: 1.5),
                    ),
                  ),
                  if (i.state == PickItemState.removed)
                    TextButton(onPressed: () => a.restore(i), child: const Text('إرجاع المنتج'))
                  else
                    TextButton(onPressed: () => a.shortReason(i), child: const Text('تغيير')),
                ],
              ),
            ),
          ],
          if (i.isExtra) ...[
            _label('على حساب من؟'),
            SegmentedButton<String>(
              style: pickSegmentStyle,
              segments: const [
                ButtonSegment(value: 'PAID', label: Text('مدفوع'), icon: Icon(Icons.payments_outlined)),
                ButtonSegment(value: 'FREE', label: Text('هدية'), icon: Icon(Icons.card_giftcard_rounded)),
              ],
              selected: {l.charge},
              onSelectionChanged: (s) => a.setCharge(i, s.first),
            ),
          ],
          if (i.state != PickItemState.removed) ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
                foregroundColor: AppColors.danger,
                side: const BorderSide(color: AppColors.danger),
              ),
              onPressed: () async {
                await a.remove(i);
                if (i.isExtra && mounted) Navigator.maybePop(context);
              },
              icon: const Icon(Icons.remove_circle_outline_rounded),
              label: Text(i.isExtra ? 'إزالة الإضافي' : 'إزالة المنتج'),
            ),
          ],
        ],
        const SizedBox(height: 8),
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('إغلاق')),
      ],
    );
  }

  /// الإضافي إلى صفر = حذفه (بتأكيد). المطلوب ينقص عادياً — السبب يُطلب عند الإنهاء أو من هنا.
  Future<void> _minus(PickItem i) async {
    if (i.isExtra && i.total == 1) {
      await widget.actions.remove(i);
      if (mounted) Navigator.maybePop(context);
      return;
    }
    widget.actions.setTotal(i, i.total - 1);
  }
}

// ---------------------------------------------------------------- إضافة منتج بالكاميرا

typedef AddChoice = ({int qty, String charge, String? reason});

/// منتج ممسوح لإضافته: صورته، سعره، مخزون المحل، وهل هو في الطلب؛ العدد، مدفوع/هدية، والسبب.
Future<AddChoice?> showAddProductSheet(BuildContext context, {required PickProductInfo info}) {
  final inOrder = info.inOrder;
  var qty = info.fillsMissing > 0 ? info.fillsMissing.clamp(1, maxAddQty) : 1;
  var charge = 'PAID';
  String? reason;
  return _sheet<AddChoice>(
    context,
    (c) => StatefulBuilder(
      builder: (c, set) {
        final fills = charge == 'PAID' ? info.fillsMissing : 0;
        final String? orderNote = inOrder == null
            ? null
            : inOrder.isExtra
            ? 'مضاف للطلب كإضافي (${numFmt(inOrder.pickedQty)}) — سيزيد العدد'
            : charge == 'FREE'
            ? 'موجود في الطلب — الهدية تُضاف كإضافي مجاني'
            : inOrder.missingQty > 0
            ? 'موجود في الطلب: ناقص ${numFmt(inOrder.missingQty)} — سيُكمل الناقص'
            : 'موجود في الطلب ومكتمل — ستظهر زيادة +${numFmt(qty)}';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              height: 180,
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(18)),
              child: NetImg(info.bigImage, width: double.infinity, height: 180, radius: 18, fit: BoxFit.contain),
            ),
            const SizedBox(height: 10),
            Text(info.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, height: 1.45)),
            if (info.shadeName != null) Text('اللون: ${info.shadeName}', style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (info.price > 0) Pill(money(info.price), color: AppColors.ink, bg: AppColors.scaffold),
                if (info.posOnly) const Pill('من المحل — غير موجود في التطبيق', color: AppColors.info, bg: AppColors.infoSoft),
                Pill(
                  info.stock == null ? 'مخزون المحل غير معروف' : 'في المحل: ${numFmt(info.stock)}',
                  color: (info.stock ?? 1) > 0 ? AppColors.success : AppColors.danger,
                  bg: (info.stock ?? 1) > 0 ? AppColors.successSoft : AppColors.dangerSoft,
                  icon: Icons.inventory_2_outlined,
                ),
                Text(info.barcode, textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
              ],
            ),
            if (orderNote != null) ...[
              const SizedBox(height: 10),
              Panel(
                color: inOrder != null && !inOrder.isExtra && inOrder.missingQty == 0 && charge == 'PAID' ? overBlueSoft : AppColors.successSoft,
                padding: const EdgeInsets.all(12),
                child: Text(orderNote, style: const TextStyle(fontWeight: FontWeight.w800, height: 1.5)),
              ),
            ],
            _label('العدد'),
            Center(
              child: MiniStepper(
                big: true,
                value: qty,
                onMinus: qty > 1 ? () => set(() => qty--) : null,
                onPlus: qty < maxAddQty ? () => set(() => qty++) : null,
              ),
            ),
            if (fills > 0 && qty > fills)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  'يُكمل ${numFmt(fills)} من الناقص، و${numFmt(qty - fills)} زيادة',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: overBlue, fontWeight: FontWeight.w700),
                ),
              ),
            _label('على حساب من؟'),
            SegmentedButton<String>(
              style: pickSegmentStyle,
              segments: const [
                ButtonSegment(value: 'PAID', label: Text('مدفوع'), icon: Icon(Icons.payments_outlined)),
                ButtonSegment(value: 'FREE', label: Text('هدية'), icon: Icon(Icons.card_giftcard_rounded)),
              ],
              selected: {charge},
              onSelectionChanged: (s) => set(() {
                charge = s.first;
                if (charge == 'FREE') reason ??= 'هدية';
                if (charge == 'PAID' && reason == 'هدية') reason = null;
              }),
            ),
            _label('السبب (اختياري)'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final r in addReasons)
                  PickChip(
                    label: r,
                    selected: reason == r,
                    color: AppColors.primary,
                    onTap: () => set(() {
                      final on = reason != r;
                      reason = on ? r : null;
                      if (r == 'هدية' && on) charge = 'FREE';
                    }),
                  ),
              ],
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
              onPressed: () => Navigator.pop(c, (qty: qty, charge: charge, reason: reason)),
              icon: const Icon(Icons.add_shopping_cart_rounded),
              label: Text('إضافة ${numFmt(qty)} للطلب', style: const TextStyle(fontSize: 16)),
            ),
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('إلغاء')),
          ],
        );
      },
    ),
  );
}

/// الباركود غير موجود في التطبيق ولا في كتالوج المحل. يرجع true لمسح منتج آخر.
Future<bool> showNotFoundDialog(BuildContext context, String barcode) async =>
    await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        icon: const Icon(Icons.search_off_rounded, color: AppColors.danger, size: 40),
        title: const Text('غير موجود في المحل'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(barcode, textDirection: TextDirection.ltr, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 6),
            const Text('هذا الباركود ليس في التطبيق ولا في كتالوج المحل.', textAlign: TextAlign.center, style: TextStyle(height: 1.6)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إغلاق')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('مسح منتج آخر')),
        ],
      ),
    ) ==
    true;

// ---------------------------------------------------------------- الإنهاء

/// قبل «تم جمع الطلب»: ملخص سريع، عدد الأكياس، والمبلغ الجديد. يرجع عدد الأكياس.
Future<int?> showFinishSheet(BuildContext context, {required PickView view, required List<PickItem> items}) {
  var parcels = view.parcelCount ?? 1;
  final m = view.money;
  final t = pickTally(items);
  final u = pickUnits(items);
  return _sheet<int>(
    context,
    (c) => StatefulBuilder(
      builder: (c, set) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _title('تم جمع الطلب؟', 'ينتقل الطلب إلى «بانتظار الكاشير» ويُثبّت مبلغه'),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _pill('جُمع ${numFmt(u.done)} من ${numFmt(u.all)}', PickItemState.collected),
              if (t.removed > 0) _pill('أُزيل ${numFmt(t.removed)}', PickItemState.removed),
              if (t.extra > 0) _pill('إضافي ${numFmt(t.extra)}', PickItemState.extra),
            ],
          ),
          _label('عدد الأكياس'),
          Center(
            child: MiniStepper(
              big: true,
              value: parcels,
              onMinus: parcels > 1 ? () => set(() => parcels--) : null,
              onPlus: parcels < 20 ? () => set(() => parcels++) : null,
            ),
          ),
          _label('المبلغ'),
          Panel(
            child: Column(
              children: [
                _row('الأصلي', money(view.total)),
                if (m.changed) _row('الجديد', money(m.finalTotal), bold: true),
                _row('تحصّله شركة التوصيل', m.codAmount == 0 ? 'لا شيء (مدفوع)' : money(m.codAmount), bold: true, color: AppColors.primary),
                if (m.refundAmount > 0) _row('يُسترجع للزبونة', money(m.refundAmount), color: AppColors.danger),
              ],
            ),
          ),
          if (m.needsApproval)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text('التعديل كبير: قد يحتاج موافقة المدير.', style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w800)),
            ),
          const SizedBox(height: 18),
          FilledButton.icon(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56), backgroundColor: AppColors.success),
            onPressed: () => Navigator.pop(c, parcels),
            icon: const Icon(Icons.task_alt_rounded),
            label: const Text('تم جمع الطلب', style: TextStyle(fontSize: 17)),
          ),
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('رجوع')),
        ],
      ),
    ),
  );
}

Widget _pill(String label, PickItemState s) {
  final c = itemLook(s);
  return Pill(label, color: c.fg, bg: c.bg, icon: c.icon);
}

Widget _row(String k, String v, {bool bold = false, Color? color}) => Padding(
  padding: const EdgeInsets.symmetric(vertical: 3),
  child: Row(
    children: [
      Flexible(child: Text(k, style: const TextStyle(color: AppColors.muted))),
      const SizedBox(width: 10),
      Text(v, style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, color: color, fontSize: bold ? 16 : 14)),
    ],
  ),
);

/// زر اختيار واضح بألوان صريحة (لا يعتمد على ثيم النظام): غير المختار أبيض بحدّ رمادي ونص داكن،
/// والمختار ممتلئ بلونه ونصه أبيض عريض مع ✓ — مقروء في أي إضاءة وأي جهاز.
class PickChip extends StatelessWidget {
  const PickChip({super.key, required this.label, required this.selected, required this.onTap, this.color = AppColors.primary, this.icon});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? color : Colors.white,
      shape: StadiumBorder(side: BorderSide(color: selected ? color : const Color(0xFFB9B0C8), width: 1.4)),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (selected) ...[const Icon(Icons.check_rounded, size: 18, color: Colors.white), const SizedBox(width: 6)]
                else if (icon != null) ...[Icon(icon, size: 17, color: AppColors.ink), const SizedBox(width: 6)],
                Flexible(
                  child: Text(
                    label,
                    style: TextStyle(fontSize: 14.5, fontWeight: selected ? FontWeight.w900 : FontWeight.w700, color: selected ? Colors.white : AppColors.ink),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
/// ألوان صريحة لأزرار «مدفوع/هدية»: المختار بنفسجي ونصه أبيض، والآخر أبيض بنص داكن.
final pickSegmentStyle = ButtonStyle(
  backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : Colors.white),
  foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : AppColors.ink),
  iconColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : AppColors.ink),
  side: WidgetStateProperty.all(const BorderSide(color: Color(0xFFB9B0C8), width: 1.2)),
  textStyle: WidgetStateProperty.all(const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800, fontSize: 14)),
  minimumSize: WidgetStateProperty.all(const Size(0, 46)),
);
