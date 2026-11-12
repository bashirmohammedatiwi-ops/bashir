import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/pick_models.dart';
import '../../widgets/common.dart';

/// أزرق «الزيادة» فوق المطلوب.
const overBlue = Color(0xFF2563EB);
const overBlueSoft = Color(0xFFE7EEFE);

/// ألوان المطلوب مقابل المُجمَّع كما يرسلها السيرفر (للملخصات والطابور).
/// أخضر = مطابق، أحمر = ناقص، أصفر = إضافي، رمادي = لم يُجمع بعد.
({Color fg, Color bg, IconData icon}) pickColor(String color) => switch (color) {
  'green' => (fg: AppColors.success, bg: AppColors.successSoft, icon: Icons.check_circle_rounded),
  'red' => (fg: AppColors.danger, bg: AppColors.dangerSoft, icon: Icons.remove_circle_rounded),
  'yellow' => (fg: AppColors.warning, bg: AppColors.warningSoft, icon: Icons.add_circle_rounded),
  'blue' => (fg: overBlue, bg: overBlueSoft, icon: Icons.add_circle_rounded),
  _ => (fg: AppColors.muted, bg: AppColors.scaffold, icon: Icons.radio_button_unchecked_rounded),
};

/// شكل المنتج حسب حالته في شاشة الجمع.
/// لم يُجمع = فاتح، مكتمل = أخضر، زيادة = أزرق، إضافي = أصفر، أُزيل/ناقص = أحمر.
typedef ItemLook = ({Color fg, Color bg, Color border, IconData icon, String label});

ItemLook itemLook(PickItemState s) => switch (s) {
  PickItemState.pending => (
    fg: AppColors.muted,
    bg: const Color(0xFFFBFAFD),
    border: AppColors.line,
    icon: Icons.radio_button_unchecked_rounded,
    label: 'لم يُجمع',
  ),
  PickItemState.partial => (
    fg: AppColors.ink,
    bg: const Color(0xFFFBFAFD),
    border: const Color(0xFFD9D3E4),
    icon: Icons.timelapse_rounded,
    label: 'جُمع بعضه',
  ),
  PickItemState.collected => (
    fg: AppColors.success,
    bg: AppColors.successSoft,
    border: AppColors.success.withValues(alpha: .45),
    icon: Icons.check_circle_rounded,
    label: 'جُمع',
  ),
  PickItemState.over => (
    fg: overBlue,
    bg: overBlueSoft,
    border: overBlue.withValues(alpha: .45),
    icon: Icons.add_circle_rounded,
    label: 'زيادة',
  ),
  PickItemState.short => (
    fg: AppColors.danger,
    bg: AppColors.dangerSoft,
    border: AppColors.danger.withValues(alpha: .4),
    icon: Icons.remove_circle_rounded,
    label: 'ناقص',
  ),
  PickItemState.removed => (
    fg: AppColors.danger,
    bg: AppColors.dangerSoft,
    border: AppColors.danger.withValues(alpha: .4),
    icon: Icons.remove_circle_rounded,
    label: 'أُزيل',
  ),
  PickItemState.extra => (
    fg: AppColors.warning,
    bg: AppColors.warningSoft,
    border: AppColors.warning.withValues(alpha: .45),
    icon: Icons.add_circle_rounded,
    label: 'إضافي',
  ),
};

/// شارة الحالة على البطاقة: «زيادة +1»، «ناقص 1»، «أُزيل»، «إضافي».
String itemBadge(PickItem i) => switch (i.state) {
  PickItemState.over => 'زيادة +${numFmt(i.overQty)}',
  PickItemState.short => 'ناقص ${numFmt(i.missingQty)}',
  _ => itemLook(i.state).label,
};

// ---------------------------------------------------------------- الرأس

/// «جُمع 5 من 8 قطع» بخط كبير، شريط التقدم، وعدد المنتجات بكل حالة.
class PickProgressHeader extends StatelessWidget {
  const PickProgressHeader({super.key, required this.items, this.notStarted = false, this.pickerName});
  final List<PickItem> items;
  final bool notStarted;
  final String? pickerName;

  @override
  Widget build(BuildContext context) {
    final u = pickUnits(items);
    final t = pickTally(items);
    final ready = canFinishPick(items);
    final title = notStarted ? 'لم يبدأ الجمع بعد' : 'جُمع ${numFmt(u.done)} من ${piecesLabel(u.all, genitive: true)}';
    return Material(
      color: ready && !notStarted ? AppColors.successSoft : Colors.white,
      elevation: 1.5,
      shadowColor: Colors.black26,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: notStarted ? 18 : 24,
                      height: 1.2,
                      color: ready && !notStarted ? AppColors.success : AppColors.ink,
                    ),
                  ),
                ),
                if (ready && !notStarted)
                  const Padding(
                    padding: EdgeInsetsDirectional.only(start: 8),
                    child: Pill('جاهز', color: AppColors.success, bg: Colors.white, icon: Icons.check_circle_rounded),
                  )
                else if (pickerName != null)
                  Flexible(
                    child: Padding(
                      padding: const EdgeInsetsDirectional.only(start: 8),
                      child: Text(
                        pickerName!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.muted, fontSize: 12.5, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: u.all == 0 ? 0 : u.done / u.all,
              minHeight: 10,
              borderRadius: BorderRadius.circular(5),
              color: ready ? AppColors.success : AppColors.primary,
              backgroundColor: AppColors.line,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _count('جُمع', t.collected, PickItemState.collected),
                _count('متبقٍ', t.remaining, PickItemState.pending),
                if (t.removed > 0) _count('أُزيل', t.removed, PickItemState.removed),
                if (t.extra > 0) _count('إضافي', t.extra, PickItemState.extra),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _count(String label, int n, PickItemState s) {
    final c = itemLook(s);
    return Pill(
      '$label ${numFmt(n)}',
      color: s == PickItemState.pending ? AppColors.ink : c.fg,
      bg: s == PickItemState.pending ? AppColors.scaffold : c.bg,
      icon: c.icon,
    );
  }
}

// ---------------------------------------------------------------- بطاقة المنتج

/// بطاقة منتج في قائمة الجمع: صورة، الاسم واللون، آخر الباركود، الكمية، والحالة بلونها.
/// الدائرة جانب البطاقة زر «جمع الكل» بلمسة، و −/+ للمنتجات متعددة الكمية والزيادة والإضافي.
class PickItemCard extends StatelessWidget {
  const PickItemCard({super.key, required this.item, this.onOpen, this.onCollectAll, this.onStep, this.saving = false, this.editable = false});
  final PickItem item;
  final VoidCallback? onOpen;
  final VoidCallback? onCollectAll;

  /// +1 / −1 على الكمية الكلية.
  final ValueChanged<int>? onStep;
  final bool saving;
  final bool editable;

  bool get _stepper => editable && (item.orderedQty > 1 || item.state == PickItemState.over || item.isExtra);

  @override
  Widget build(BuildContext context) {
    final i = item;
    final l = i.line;
    final c = itemLook(i.state);
    final light = i.state == PickItemState.pending || i.state == PickItemState.partial;
    return Material(
      color: c.bg,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onOpen,
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 10, 6, 10),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border, width: light ? 1 : 1.4)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Opacity(
                    opacity: i.state == PickItemState.removed ? .55 : 1,
                    child: NetImg(l.thumb, size: 56, fit: BoxFit.contain),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            height: 1.35,
                            color: i.state == PickItemState.removed ? AppColors.muted : AppColors.ink,
                            decoration: i.state == PickItemState.removed ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        if (l.shadeName != null)
                          Text(
                            'اللون: ${l.shadeName}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w700, fontSize: 12.5),
                          ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            if (!_stepper && i.state != PickItemState.over)
                              Text(
                                i.isExtra ? '×${numFmt(i.picked)}' : '${numFmt(i.picked)}/${numFmt(i.orderedQty)}',
                                textDirection: TextDirection.ltr,
                                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: light ? AppColors.ink : c.fg),
                              ),
                            if (!light) Pill(itemBadge(i), color: c.fg, bg: Colors.white, small: true),
                            if (l.isExtra && l.posOnly) const Pill('من المحل', color: AppColors.info, bg: AppColors.infoSoft, small: true),
                            if (l.isExtra && l.isFree) const Pill('هدية', color: AppColors.rose, bg: AppColors.roseSoft, small: true),
                            if ((l.barcode ?? '').isNotEmpty)
                              Text(barcodeTail(l.barcode), textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                          ],
                        ),
                        if (i.state == PickItemState.over)
                          Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Text(
                              i.qtyText,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: overBlue, fontWeight: FontWeight.w800, fontSize: 12.5),
                            ),
                          ),
                        if (i.hasReason && (i.state == PickItemState.removed || i.state == PickItemState.short))
                          Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Text(
                              i.reason!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700, fontSize: 12.5),
                            ),
                          ),
                        if (l.isExtra && l.hasReason)
                          Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Text(l.reason!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.warning, fontSize: 12.5)),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 4),
                  _StateButton(item: i, saving: saving, onTap: editable && !i.settled ? onCollectAll : onOpen),
                ],
              ),
              if (_stepper)
                Padding(
                  padding: const EdgeInsetsDirectional.only(start: 66, top: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          i.isExtra ? 'العدد' : 'جُمع ${numFmt(i.total)} من ${numFmt(i.orderedQty)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppColors.muted, fontSize: 12.5, fontWeight: FontWeight.w700),
                        ),
                      ),
                      MiniStepper(
                        value: i.total,
                        color: light ? AppColors.primary : c.fg,
                        onMinus: i.total > 0 ? () => onStep?.call(-1) : null,
                        onPlus: canPlus(i) ? () => onStep?.call(1) : null,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// زيادة +1 ممكنة؟ (الإضافي حتى 50، والمطلوب حتى المطلوب ثم زيادة بالباركود).
bool canPlus(PickItem i) {
  if (i.isExtra) return i.total < maxAddQty;
  if (i.picked < i.orderedQty) return true;
  return i.canOver && i.overQty < maxAddQty;
}

/// الدائرة جانب البطاقة: فارغة = اضغط لجمع الكل، ✓ أخضر، زيادة زرقاء، أُزيل أحمر، إضافي أصفر.
class _StateButton extends StatelessWidget {
  const _StateButton({required this.item, required this.saving, this.onTap});
  final PickItem item;
  final bool saving;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final i = item;
    final c = itemLook(i.state);
    final pending = !i.settled;
    final Widget face;
    if (pending) {
      face = Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 38,
            height: 38,
            child: CircularProgressIndicator(
              value: i.orderedQty == 0 ? 0 : i.picked / i.orderedQty,
              strokeWidth: 3,
              color: AppColors.success,
              backgroundColor: const Color(0xFFD5CFDF),
            ),
          ),
          Icon(Icons.check_rounded, size: 20, color: AppColors.muted.withValues(alpha: .7)),
        ],
      );
    } else {
      face = Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(color: c.fg, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: switch (i.state) {
          PickItemState.over => Text('+${i.overQty}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
          PickItemState.extra => Text('+${i.picked}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
          PickItemState.collected => const Icon(Icons.check_rounded, color: Colors.white, size: 24),
          _ => const Icon(Icons.close_rounded, color: Colors.white, size: 22),
        },
      );
    }
    return Semantics(
      button: onTap != null,
      label: pending ? 'جمع الكل' : c.label,
      child: InkResponse(
        onTap: saving ? null : onTap,
        radius: 26,
        child: SizedBox(
          width: 48,
          height: 48,
          child: Center(
            child: saving
                ? const SizedBox(width: 30, height: 30, child: CircularProgressIndicator(strokeWidth: 3))
                : face,
          ),
        ),
      ),
    );
  }
}

/// −  رقم  + بأزرار 48dp.
class MiniStepper extends StatelessWidget {
  const MiniStepper({super.key, required this.value, this.onMinus, this.onPlus, this.color = AppColors.primary, this.big = false});
  final int value;
  final VoidCallback? onMinus, onPlus;
  final Color color;
  final bool big;

  @override
  Widget build(BuildContext context) {
    final s = big ? 64.0 : 48.0;
    Widget btn(IconData icon, VoidCallback? onTap) => SizedBox(
      width: s,
      height: s,
      child: IconButton.filledTonal(
        onPressed: onTap,
        padding: EdgeInsets.zero,
        style: IconButton.styleFrom(
          backgroundColor: color.withValues(alpha: .12),
          foregroundColor: color,
          minimumSize: Size(s, s),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(big ? 18 : 14)),
        ),
        icon: Icon(icon, size: big ? 32 : 24),
      ),
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        btn(Icons.remove_rounded, onMinus),
        SizedBox(
          width: big ? 96 : 44,
          child: Text(
            numFmt(value),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: big ? 40 : 18, fontWeight: FontWeight.w900, color: color, height: 1.1),
          ),
        ),
        btn(Icons.add_rounded, onPlus),
      ],
    );
  }
}

// ---------------------------------------------------------------- رمز الطلب للكاشير

/// QR رقم الطلب كما هو تماماً (مثل ORD-MWCP3XBEA982) — يقرؤه كاشير الطلبات بالقارئ من شاشة الهاتف.
class OrderQr extends StatelessWidget {
  const OrderQr({super.key, required this.orderNumber, this.size = 220});
  final String orderNumber;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.line)),
    child: QrImageView(
      data: orderNumber,
      size: size,
      padding: EdgeInsets.zero,
      backgroundColor: Colors.white,
      errorCorrectionLevel: QrErrorCorrectLevel.M,
      eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
      dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
    ),
  );
}

/// بطاقة «بانتظار الكاشير»: QR كبير + رقم الطلب + كيف يُستعمل.
class OrderQrCard extends StatelessWidget {
  const OrderQrCard({super.key, required this.orderNumber, this.title = 'بانتظار الكاشير', this.onExpand});
  final String orderNumber;
  final String title;
  final VoidCallback? onExpand;

  @override
  Widget build(BuildContext context) => Panel(
    color: const Color(0xFFE2F5F6),
    onTap: onExpand,
    child: LayoutBuilder(
      builder: (context, box) {
        final size = math.min(240.0, box.maxWidth - 40);
        return Column(
          children: [
            Row(
              children: [
                const Icon(Icons.point_of_sale_rounded, color: Color(0xFF0E9AA7), size: 26),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0E7C86))),
                ),
                if (onExpand != null) const Icon(Icons.open_in_full_rounded, color: Color(0xFF0E7C86), size: 20),
              ],
            ),
            const SizedBox(height: 12),
            OrderQr(orderNumber: orderNumber, size: size),
            const SizedBox(height: 10),
            OrderNumberText(orderNumber),
            const SizedBox(height: 4),
            const Text(
              'اعرض هذا الرمز على قارئ كاشير الطلبات',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w700, height: 1.5),
            ),
          ],
        );
      },
    ),
  );
}

class OrderNumberText extends StatelessWidget {
  const OrderNumberText(this.orderNumber, {super.key, this.size = 18});
  final String orderNumber;
  final double size;
  @override
  Widget build(BuildContext context) => FittedBox(
    fit: BoxFit.scaleDown,
    child: Text(
      orderNumber,
      textDirection: TextDirection.ltr,
      style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w900, fontSize: size, letterSpacing: 1),
    ),
  );
}

/// QR الطلب بملء الشاشة تقريباً (من زر شريط العنوان أو بعد إنهاء الجمع).
Future<void> showOrderQr(BuildContext context, String orderNumber, {String? title, String? message, String ok = 'إغلاق'}) => showDialog<void>(
  context: context,
  useRootNavigator: true,
  builder: (c) {
    final w = MediaQuery.sizeOf(c).width;
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (title != null) ...[
              const Icon(Icons.task_alt_rounded, color: AppColors.success, size: 44),
              const SizedBox(height: 4),
              Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.success)),
              const SizedBox(height: 10),
            ],
            OrderQr(orderNumber: orderNumber, size: math.min(300, w - 88)),
            const SizedBox(height: 10),
            OrderNumberText(orderNumber, size: 20),
            const SizedBox(height: 6),
            Text(
              message ?? 'اعرض هذا الرمز على قارئ كاشير الطلبات',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w700, height: 1.5),
            ),
            const SizedBox(height: 14),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              onPressed: () => Navigator.pop(c),
              child: Text(ok, style: const TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  },
);

// ---------------------------------------------------------------- لافتات

/// انقطاع الاتصال: آخر تعديل لم يُحفظ — زر إعادة المحاولة.
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.warningSoft,
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 8, 4),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, color: AppColors.warning),
          const SizedBox(width: 10),
          const Expanded(
            child: Text('لا اتصال — لم يُحفظ آخر تعديل', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.warning)),
          ),
          TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
        ],
      ),
    ),
  );
}

/// نسخ الباركود.
void copyBarcode(BuildContext context, String code) {
  Clipboard.setData(ClipboardData(text: code));
  toast(context, 'نُسخ الباركود');
}

// ---------------------------------------------------------------- بعد الإنهاء

/// ملخص بعد «تم جمع الطلب»: الإجمالي النهائي، ما يُحصَّل، الأكياس، النواقص والإضافات.
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
                      v.finished ? (v.stage == 'READY_FOR_PICKUP' ? 'تم جمع الطلب — جاهز للاستلام' : 'تم جمع الطلب') : 'تم جمع الطلب · ${stageLabels[v.stage] ?? v.stage}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.success),
                    ),
                    Text(
                      ['سيُسلَّم ${piecesLabel(v.deliverUnits)}', if (v.pickerName != null) v.pickerName!].join(' · '),
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
              child: Text('حسب الجمع حتى الآن — يُثبّت عند «تم جمع الطلب»', style: TextStyle(color: AppColors.muted, fontSize: 12)),
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
          _row('تحصّله شركة التوصيل', m.codAmount == 0 ? 'لا شيء (مدفوع)' : money(m.codAmount), bold: true, color: AppColors.primary),
        ],
      ),
    );
  }

  Widget _row(String k, String v, {bool bold = false, Color? color}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Flexible(
          child: Text(k, style: TextStyle(color: AppColors.muted, fontWeight: bold ? FontWeight.w800 : FontWeight.w500)),
        ),
        const SizedBox(width: 10),
        Text(
          v,
          textAlign: TextAlign.end,
          style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, fontSize: bold ? 16.5 : 14, color: color),
        ),
      ],
    ),
  );
}
