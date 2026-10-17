import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';
import '../scan/scan_screen.dart';
import 'orders_screen.dart';

/// الخطوة التالية لكل حالة (زر رئيسي واحد).
const _nextStep = {
  'PENDING': ('CONFIRMED', 'تأكيد الطلب', Icons.check_circle_rounded),
  'CONFIRMED': ('PROCESSING', 'بدء التحضير', Icons.inventory_2_rounded),
  'PROCESSING': ('SHIPPED', 'تم الشحن', Icons.local_shipping_rounded),
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

  /// وضع التجهيز: عدد القطع الممسوحة لكل سطر.
  bool _picking = false;
  final _picked = <String, int>{};

  @override
  void initState() {
    super.initState();
    _load();
    ScannerBus.instance.push(_onScan);
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onScan);
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final o = await ref.read(repoProvider).order(widget.orderId);
      if (mounted) setState(() => (_o = o, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  /// قارئ خارجي أثناء التجهيز: يشطب القطعة المطابقة.
  bool _onScan(ScanEvent e) {
    if (!_picking) return false;
    _pick(e.code);
    return true;
  }

  void _pick(String code) {
    final o = _o;
    if (o == null) return;
    final c = normalizeCode(code);
    OrderItemLine? hit;
    for (final it in o.items) {
      final b = normalizeCode(it.barcode ?? '');
      final match = b.isNotEmpty && (b == c || b.replaceFirst(RegExp(r'^0+'), '') == c.replaceFirst(RegExp(r'^0+'), ''));
      if (match && (_picked[it.id] ?? 0) < it.quantity) {
        hit = it;
        break;
      }
    }
    if (hit == null) {
      Prefs.instance.feedback(error: true);
      final already = o.items.any((it) => normalizeCode(it.barcode ?? '') == c);
      toast(context, already ? 'هذه القطعة مكتملة العدد' : 'الباركود $c ليس ضمن هذا الطلب', error: true);
      return;
    }
    Prefs.instance.feedback();
    setState(() => _picked[hit!.id] = (_picked[hit.id] ?? 0) + 1);
    if (_pickedAll) {
      toast(context, 'اكتمل تجهيز كل القطع ✓');
    }
  }

  bool get _pickedAll => _o != null && _o!.items.every((it) => (_picked[it.id] ?? 0) >= it.quantity);

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
    return Scaffold(
      appBar: AppBar(
        title: Text(o.orderNumber, textDirection: TextDirection.ltr),
        actions: [
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
      bottomNavigationBar: next == null || closed
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
              trailing: closed
                  ? null
                  : TextButton.icon(
                      onPressed: () => setState(() {
                        _picking = !_picking;
                        if (!_picking) _picked.clear();
                      }),
                      icon: Icon(_picking ? Icons.close_rounded : Icons.qr_code_scanner_rounded, size: 18),
                      label: Text(_picking ? 'إنهاء التجهيز' : 'تجهيز بالمسح'),
                    ),
            ),
            if (_picking) _pickingBar(o),
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
                  const SizedBox(height: 6),
                  _row(
                    'الدفع',
                    '${paymentMethodLabels[o.paymentMethod] ?? o.paymentMethod} · ${paymentStatusLabels[o.paymentStatus] ?? o.paymentStatus}',
                  ),
                  _row('التوصيل', deliveryLabels[o.deliveryOption] ?? o.deliveryOption),
                ],
              ),
            ),
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
                  onPressed: () => _openUrl(
                    'https://wa.me/${_intlPhone(phone)}?text=${Uri.encodeComponent('مرحباً ${o.customerName}، بخصوص طلبك ${o.orderNumber} من ديما الحياة')}',
                  ),
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

  Widget _pickingBar(OrderDetail o) {
    final done = o.items.fold<int>(0, (n, it) => n + ((_picked[it.id] ?? 0).clamp(0, it.quantity)));
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Panel(
        color: _pickedAll ? AppColors.successSoft : AppColors.infoSoft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _pickedAll ? 'كل القطع جاهزة ✓' : 'امسح باركود كل قطعة (بالكاميرا أو القارئ) — $done من ${o.units}',
              style: TextStyle(fontWeight: FontWeight.w800, color: _pickedAll ? AppColors.success : AppColors.info),
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: o.units == 0 ? 0 : done / o.units, minHeight: 6, borderRadius: BorderRadius.circular(4)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final code = await Navigator.of(
                        context,
                      ).push<String>(MaterialPageRoute(builder: (_) => const ScanScreen(pickOnly: true)));
                      if (code != null) _pick(code);
                    },
                    icon: const Icon(Icons.qr_code_scanner_rounded),
                    label: const Text('مسح قطعة'),
                  ),
                ),
                if (_pickedAll && _nextStep[o.status] != null) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        setState(() => _picking = false);
                        _setStatus(o.status == 'PENDING' || o.status == 'CONFIRMED' ? 'PROCESSING' : _nextStep[o.status]!.$1);
                      },
                      child: const Text('اعتماد التجهيز'),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _itemTile(OrderItemLine it) {
    final picked = (_picked[it.id] ?? 0).clamp(0, it.quantity);
    final complete = picked >= it.quantity;
    return InkWell(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: it.productId))),
      onLongPress: _picking ? () => setState(() => _picked[it.id] = complete ? 0 : it.quantity) : null,
      child: Container(
        color: _picking && complete ? AppColors.successSoft : null,
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
            _picking
                ? Column(
                    children: [
                      Icon(
                        complete ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                        color: complete ? AppColors.success : AppColors.muted,
                      ),
                      Text('$picked/${it.quantity}', style: const TextStyle(fontWeight: FontWeight.w800)),
                    ],
                  )
                : Container(
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
