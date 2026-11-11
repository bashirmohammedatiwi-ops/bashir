import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../pick/pick_screen.dart';
import 'orders_screen.dart';

/// الخطوة التالية لكل حالة (زر رئيسي واحد).
const _nextStep = {
  'PENDING': ('CONFIRMED', 'تأكيد الطلب', Icons.check_circle_rounded),
  'CONFIRMED': ('PROCESSING', 'بدء التحضير', Icons.inventory_2_rounded),
  'PROCESSING': ('SHIPPED', 'جاهز للتوصيل', Icons.local_shipping_rounded),
  'SHIPPED': ('DELIVERED', 'تم التسليم', Icons.verified_rounded),
};

class OrderScreen extends ConsumerStatefulWidget {
  const OrderScreen({super.key, required this.orderId});
  final String orderId;
  @override
  ConsumerState<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends ConsumerState<OrderScreen> {
  OrderDetail? _o;
  Object? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// التجهيز بالمسح في شاشته الخاصة (محفوظ في السيرفر) — ثم نعيد تحميل الطلب.
  Future<void> _openPicking() async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => PickScreen(orderId: widget.orderId)));
    if (mounted) await _load();
  }

  bool get _canPick => _o != null && (_o!.stage == null || pickableStages.contains(_o!.stage)) && _o!.status != 'CANCELLED';

  Future<void> _load() async {
    try {
      final o = await ref.read(repoProvider).order(widget.orderId);
      if (mounted) setState(() => (_o = o, _error = null));
    } catch (e) {
      if (!mounted) return;
      if (_o != null) {
        toastError(context, e);
      } else {
        setState(() => _error = e);
      }
    }
  }

  Future<void> _setStatus(String status, {String? confirmText}) async {
    if (confirmText != null &&
        !await confirm(context, title: confirmText, message: _cancelMessage(status), ok: 'نعم', danger: status == 'CANCELLED')) {
      return;
    }
    setState(() => _busy = true);
    try {
      final o = await ref.read(repoProvider).setOrderStatus(widget.orderId, status);
      if (!mounted) return;
      setState(() => _o = o);
      ref.read(ordersVersionProvider.notifier).state++;
      toast(context, 'الحالة الآن: ${orderStatusLabels[status]}');
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _cancelMessage(String status) {
    if (status != 'CANCELLED') return null;
    final paid = _o?.paymentMethod == 'CARD' && _o?.paymentStatus == 'PAID';
    return 'يعود المخزون والنقاط والكوبون تلقائياً.${paid ? '\nالمبلغ المدفوع بالبطاقة يُسترجع للزبونة تلقائياً.' : ''}';
  }

  String _intlPhone(String raw) {
    var d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.startsWith('00')) d = d.substring(2);
    if (d.startsWith('0')) d = '964${d.substring(1)}';
    if (!d.startsWith('964')) d = '964$d';
    return d;
  }

  Future<void> _openUrl(String url) async {
    if (!await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication) && mounted) {
      toast(context, 'تعذر فتح التطبيق', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = _o;
    if (o == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()),
      );
    }
    final next = _nextStep[o.status];
    final closed = o.status == 'CANCELLED' || o.status == 'REFUNDED' || o.status == 'DELIVERED';
    // «بدء التحضير» صار التجهيز بالمسح: يفتح شاشة التجهيز بدل تغيير الحالة مباشرة.
    final pickStep = _canPick && o.status != 'PENDING';
    return Scaffold(
      appBar: AppBar(
        title: Text(o.orderNumber, textDirection: TextDirection.ltr),
        actions: [
          IconButton(
            tooltip: 'مشاركة الطلب (للمندوب مثلاً)',
            onPressed: () => SharePlus.instance.share(ShareParams(text: _summary(o), subject: 'طلب ${o.orderNumber}')),
            icon: const Icon(Icons.ios_share_rounded),
          ),
          IconButton(
            tooltip: 'نسخ ملخص الطلب',
            onPressed: () {
              Clipboard.setData(ClipboardData(text: _summary(o)));
              toast(context, 'نُسخ ملخص الطلب');
            },
            icon: const Icon(Icons.copy_all_rounded),
          ),
          if (!closed)
            PopupMenuButton<String>(
              onSelected: (s) => _setStatus(
                s,
                confirmText: s == 'CANCELLED' ? 'إلغاء الطلب ${o.orderNumber}؟' : 'تغيير الحالة إلى «${orderStatusLabels[s]}»؟',
              ),
              itemBuilder: (_) => [
                for (final s in orderStatusFlow)
                  if (s != o.status) PopupMenuItem(value: s, child: Text('نقل إلى: ${orderStatusLabels[s]}')),
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'CANCELLED',
                  child: Text('إلغاء الطلب', style: TextStyle(color: AppColors.danger)),
                ),
              ],
            ),
        ],
      ),
      bottomNavigationBar: closed
          ? null
          : pickStep
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary, minimumSize: const Size.fromHeight(54)),
                  onPressed: _busy ? null : _openPicking,
                  icon: const Icon(Icons.qr_code_scanner_rounded),
                  label: Text(o.stage == 'PICKING' ? 'متابعة التجهيز بالمسح' : 'بدء التجهيز بالمسح', style: const TextStyle(fontSize: 16)),
                ),
              ),
            )
          : next == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: orderStatusColor(next.$1), minimumSize: const Size.fromHeight(54)),
                  onPressed: _busy ? null : () => _setStatus(next.$1),
                  icon: _busy
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                      : Icon(next.$3),
                  label: Text(next.$2, style: const TextStyle(fontSize: 16)),
                ),
              ),
            ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
          children: [
            _statusTrack(o),
            const SizedBox(height: 12),
            _customer(o),
            SectionTitle(
              'المنتجات (${o.units} قطعة)',
              trailing: o.stage == null || o.status == 'CANCELLED'
                  ? null
                  : TextButton.icon(
                      onPressed: _openPicking,
                      icon: const Icon(Icons.fact_check_rounded, size: 18),
                      label: Text(_canPick ? 'تجهيز بالمسح' : 'عرض التجهيز'),
                    ),
            ),
            Panel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (var i = 0; i < o.items.length; i++) ...[if (i > 0) const Divider(indent: 76), _itemTile(o.items[i])],
                ],
              ),
            ),
            const SectionTitle('الحساب'),
            Panel(
              child: Column(
                children: [
                  _row('المجموع', money(o.subtotal)),
                  if (o.discountTotal > 0)
                    _row('الخصم${o.coupon != null ? ' (${o.coupon})' : ''}', '- ${money(o.discountTotal)}', color: AppColors.rose),
                  if (o.loyaltySpent > 0) _row('نقاط مستخدمة', numFmt(o.loyaltySpent)),
                  _row('التوصيل', o.shippingTotal == 0 ? 'مجاني' : money(o.shippingTotal)),
                  const Divider(),
                  _row('الإجمالي', money(o.total), bold: true),
                  if (o.finalTotal != null && o.finalTotal != o.total)
                    _row('بعد التجهيز (نقص/إضافة)', money(o.finalTotal), bold: true, color: AppColors.warning),
                  if (o.codAmount != null)
                    _row('تحصّله شركة التوصيل', o.codAmount == 0 ? 'لا شيء (مدفوع)' : money(o.codAmount), color: AppColors.primary),
                  const SizedBox(height: 6),
                  _row(
                    'الدفع',
                    '${paymentMethodLabels[o.paymentMethod] ?? o.paymentMethod} · ${paymentStatusLabels[o.paymentStatus] ?? o.paymentStatus}',
                  ),
                  _row('التوصيل', deliveryLabels[o.deliveryOption] ?? o.deliveryOption),
                ],
              ),
            ),
            if (o.isGift) ...[
              const SectionTitle('هدية'),
              Panel(
                color: AppColors.roseSoft,
                child: Text(
                  [
                    'طلب هدية — لا تضع الفاتورة بالأسعار في الكيس.',
                    if ((o.giftMessage ?? '').isNotEmpty) 'رسالة البطاقة: ${o.giftMessage}',
                  ].join('\n'),
                  style: const TextStyle(height: 1.7, fontWeight: FontWeight.w600),
                ),
              ),
            ],
            if ((o.notes ?? '').isNotEmpty) ...[
              const SectionTitle('ملاحظة الزبونة'),
              Panel(
                color: AppColors.warningSoft,
                child: Text(o.notes!, style: const TextStyle(height: 1.7)),
              ),
            ],
            if (o.history.isNotEmpty) ...[
              const SectionTitle('السجل'),
              Panel(
                child: Column(
                  children: [
                    for (final h in o.history)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            Icon(Icons.circle, size: 9, color: orderStatusColor('${h['status']}')),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                orderStatusLabels['${h['status']}'] ?? '${h['status'] ?? h['action']}',
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                            ),
                            Text(
                              [h['actor'], timeAgo(parseDate(h['at']))].whereType<String>().where((e) => e.isNotEmpty).join(' · '),
                              style: const TextStyle(color: AppColors.muted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusTrack(OrderDetail o) {
    if (o.status == 'CANCELLED' || o.status == 'REFUNDED') {
      return Panel(
        color: AppColors.dangerSoft,
        child: Row(
          children: [
            const Icon(Icons.cancel_rounded, color: AppColors.danger),
            const SizedBox(width: 10),
            Text(
              'الطلب ${orderStatusLabels[o.status]}',
              style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const Spacer(),
            Text(timeAgo(o.createdAt), style: const TextStyle(color: AppColors.muted)),
          ],
        ),
      );
    }
    final idx = orderStatusFlow.indexOf(o.status);
    return Panel(
      padding: const EdgeInsets.fromLTRB(10, 14, 10, 12),
      child: Row(
        children: [
          for (var i = 0; i < orderStatusFlow.length; i++) ...[
            Expanded(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 13,
                    backgroundColor: i <= idx ? orderStatusColor(orderStatusFlow[idx]) : AppColors.line,
                    child: Icon(i < idx ? Icons.check_rounded : Icons.circle, size: i < idx ? 16 : 8, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    orderStatusLabels[orderStatusFlow[i]]!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: i == idx ? FontWeight.w800 : FontWeight.w600,
                      color: i <= idx ? AppColors.ink : AppColors.muted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _customer(OrderDetail o) {
    final phone = o.customerPhone;
    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: AppColors.roseSoft,
                child: Icon(Icons.person_rounded, color: AppColors.rose),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(o.customerName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    Text(
                      o.customerOrders > 1 ? 'زبونة دائمة · ${o.customerOrders} طلبات' : 'أول طلب لها',
                      style: TextStyle(
                        color: o.customerOrders > 1 ? AppColors.success : AppColors.muted,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Text(timeAgo(o.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ],
          ),
          if (o.addressLine.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.place_outlined, size: 18, color: AppColors.muted),
                const SizedBox(width: 6),
                Expanded(child: Text(o.addressLine, style: const TextStyle(height: 1.6))),
              ],
            ),
            if ((o.address?['notes'] ?? '').toString().isNotEmpty)
              Padding(
                padding: const EdgeInsetsDirectional.only(start: 24),
                child: Text('${o.address!['notes']}', style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
              ),
          ],
          if (phone != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _openUrl('tel:$phone'),
                    icon: const Icon(Icons.call_rounded, color: AppColors.success),
                    label: Text(phone, textDirection: TextDirection.ltr),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () => _openUrl('https://wa.me/${_intlPhone(phone)}'),
                  icon: const Icon(Icons.chat_rounded, color: Color(0xFF25D366)),
                  label: const Text('واتساب'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _itemTile(OrderItemLine it) {
    return InkWell(
      child: Container(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            Stack(
              children: [
                NetImg(it.thumb, size: 56, fit: BoxFit.contain),
                if (it.shadeHex != null)
                  PositionedDirectional(
                    bottom: 0,
                    end: 0,
                    child: Swatch(hex: it.shadeHex, hexEnd: it.shadeHexEnd, size: 20, off: !it.shadeActive),
                  ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    it.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700, height: 1.4),
                  ),
                  if (it.shadeName != null)
                    Text(
                      'اللون: ${it.shadeName}',
                      style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w700, fontSize: 12.5),
                    ),
                  Text(
                    [if (it.barcode != null) it.barcode!, money(it.unitPrice)].join(' · '),
                    textDirection: TextDirection.ltr,
                    textAlign: TextAlign.right,
                    style: const TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
              child: Text(
                '× ${it.quantity}',
                style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String k, String v, {bool bold = false, Color? color}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Text(
          k,
          style: TextStyle(color: AppColors.muted, fontWeight: bold ? FontWeight.w800 : FontWeight.w500),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            v,
            textAlign: TextAlign.end,
            style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, fontSize: bold ? 17 : 14, color: color),
          ),
        ),
      ],
    ),
  );

  String _summary(OrderDetail o) {
    final b = StringBuffer()
      ..writeln('طلب ${o.orderNumber}')
      ..writeln('${o.customerName} — ${o.customerPhone ?? ''}')
      ..writeln(o.addressLine);
    for (final it in o.items) {
      b.writeln('• ${it.name}${it.shadeName != null ? ' (${it.shadeName})' : ''} × ${it.quantity}');
    }
    b.writeln('الإجمالي: ${money(o.total)} — ${paymentMethodLabels[o.paymentMethod] ?? ''}');
    if ((o.notes ?? '').isNotEmpty) b.writeln('ملاحظة: ${o.notes}');
    return b.toString();
  }
}
