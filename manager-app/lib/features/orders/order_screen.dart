import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api.dart';
import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../pick/pick_screen.dart';
import '../pick/pick_widgets.dart';
import '../product/product_screen.dart';
import 'order_widgets.dart';
import 'orders_screen.dart';

/// الخطوة التالية بالحالة القديمة — فقط لسيرفر أقدم لا يرسل مرحلة التجهيز.
const _legacyNextStep = {
  'PENDING': ('CONFIRMED', 'تأكيد الطلب', Icons.check_circle_rounded),
  'CONFIRMED': ('PROCESSING', 'بدء التحضير', Icons.inventory_2_rounded),
  'PROCESSING': ('SHIPPED', 'تم الشحن', Icons.local_shipping_rounded),
  'SHIPPED': ('DELIVERED', 'تم التسليم', Icons.verified_rounded),
};

/// شاشة الطلب مبنية على مرحلة التجهيز: بعد بدء التجهيز تعرض نتيجة المسح (لا الأصناف الأصلية)،
/// وبعد انتهائه تعرض ما ينتظره الطلب (الكاشير، هاي إكسبريس) بدل أزرار تتجاوزهما.
class OrderScreen extends ConsumerStatefulWidget {
  const OrderScreen({super.key, required this.orderId});
  final String orderId;
  @override
  ConsumerState<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends ConsumerState<OrderScreen> with WidgetsBindingObserver {
  OrderDetail? _o;
  PickView? _pick;
  ShipmentInfo? _ship;
  List<TimelineEntry>? _timeline;
  Object? _error;
  bool _busy = false;
  Timer? _auto;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _startAuto();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _auto?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startAuto();
      _load(quiet: true);
    } else if (state == AppLifecycleState.paused) {
      _auto?.cancel();
    }
  }

  /// تحديث تلقائي كل 15 ثانية والشاشة ظاهرة (تعديلات كاشير الطلبات تظهر هنا).
  void _startAuto() {
    _auto?.cancel();
    _auto = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted && !_busy && ModalRoute.of(context)?.isCurrent == true) _load(quiet: true);
    });
  }

  void _bump() => ref.read(ordersVersionProvider.notifier).state++;

  /// جمع الطلب في شاشته الخاصة — عند الرجوع نعيد تحميل الطلب ونحدّث الطابور.
  Future<void> _openPicking() async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => PickScreen(orderId: widget.orderId)));
    if (!mounted) return;
    _bump();
    await _load();
  }

  /// «تأكيد الطلب»: يبدأ الجمع باسم هذا الموظف ثم يفتح شاشة الجمع.
  Future<void> _confirmAndCollect() async {
    setState(() => _busy = true);
    try {
      await ref.read(repoProvider).pickStart(widget.orderId);
      if (!mounted) return;
      Prefs.instance.feedback();
      _bump();
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      // يجمعه موظف آخر: شاشة الجمع تعرض ذلك (وتتيح النقل للمدير).
      if (!(err.status == 409 && err.message.contains('يجهّزه'))) {
        toastError(context, e);
        return;
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
    if (mounted) await _openPicking();
  }

  static Future<T?> _soft<T>(Future<T> f) async {
    try {
      return await f;
    } catch (_) {
      return null;
    }
  }

  Future<void> _load({bool quiet = false}) async {
    final repo = ref.read(repoProvider);
    final id = widget.orderId;
    try {
      // الطلب أساسي؛ التجهيز والشحنة والخط الزمني إضافات لا تُفشل الشاشة.
      final pF = _soft(repo.pickView(id));
      final sF = _soft(repo.shipment(id));
      final tF = _soft(repo.timeline(id));
      final o = await repo.order(id);
      final (p, s, t) = (await pF, await sF, await tF);
      if (!mounted) return;
      final prev = _o;
      setState(() {
        _o = o;
        _pick = p;
        _ship = s;
        _timeline = t;
        _error = null;
      });
      if (prev != null && (prev.stage != o.stage || prev.status != o.status)) _bump();
    } catch (e) {
      if (!mounted) return;
      if (_o != null) {
        if (!quiet) toastError(context, e);
      } else {
        setState(() => _error = e);
      }
    }
  }

  Future<void> _setStatus(String status, {String? reason}) async {
    setState(() => _busy = true);
    try {
      final o = await ref.read(repoProvider).setOrderStatus(widget.orderId, status, reason: reason);
      if (!mounted) return;
      setState(() => _o = o);
      _bump();
      toast(context, status == 'CANCELLED' ? 'أُلغي الطلب' : 'الحالة الآن: ${orderStatusLabels[status]}');
      await _load();
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel(OrderDetail o) async {
    final paid = o.paymentMethod == 'CARD' && o.paymentStatus == 'PAID';
    final ok = await confirm(
      context,
      title: 'إلغاء الطلب ${o.orderNumber}؟',
      message: 'يعود المخزون والنقاط والكوبون تلقائياً.${paid ? '\nالمبلغ المدفوع بالبطاقة يُسترجع للزبونة تلقائياً.' : ''}',
      ok: 'نعم، إلغاء',
      danger: true,
    );
    if (ok && mounted) await _setStatus('CANCELLED');
  }

  /// تغيير الحالة يدوياً: يتجاوز الكاشير وهاي إكسبريس — تحذير، اختيار الحالة، وسبب إلزامي يُكتب في السجل.
  Future<void> _manualStatus(OrderDetail o) async {
    final reason = TextEditingController();
    String? picked;
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      builder: (c) => StatefulBuilder(
        builder: (c, set) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(c).bottom),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('تغيير الحالة يدوياً', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 10),
                  const Panel(
                    color: AppColors.dangerSoft,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.warning_amber_rounded, color: AppColors.danger),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'هذا يتجاوز كاشير الطلبات وهاي إكسبريس: لا تُصدر فاتورة ولا تُنشأ شحنة ولا تُحصَّل أموال. استخدمه للتصحيح فقط.',
                            style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700, height: 1.6, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('الحالة الحالية للزبونة: ${orderStatusLabels[o.status] ?? o.status}', style: const TextStyle(color: AppColors.muted)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final s in [...orderStatusFlow, 'CANCELLED'])
                        if (s != o.status)
                          ChoiceChip(
                            showCheckmark: false,
                            selected: picked == s,
                            selectedColor: s == 'CANCELLED' ? AppColors.dangerSoft : AppColors.primarySoft,
                            label: Text(orderStatusLabels[s] ?? s),
                            onSelected: (_) => set(() => picked = s),
                          ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: reason,
                    maxLines: 2,
                    maxLength: 300,
                    onChanged: (_) => set(() {}),
                    decoration: const InputDecoration(labelText: 'السبب (إلزامي)', hintText: 'مثلاً: سُلّم يدوياً بسبب عطل في الكاشير'),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: AppColors.danger, minimumSize: const Size.fromHeight(50)),
                    onPressed: picked == null || reason.text.trim().isEmpty ? null : () => Navigator.pop(c, true),
                    child: Text(picked == null ? 'اختر الحالة' : 'تأكيد: ${orderStatusLabels[picked] ?? picked}'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    final text = reason.text.trim();
    reason.dispose();
    if (ok != true || picked == null || text.isEmpty || !mounted) return;
    await _setStatus(picked!, reason: text);
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
    final stage = o.stage;
    final pick = o.pickStarted ? _pick : null;
    return Scaffold(
      appBar: AppBar(
        title: Text(o.orderNumber, textDirection: TextDirection.ltr),
        actions: [
          if (!_cancelled(o))
            IconButton(
              tooltip: 'رمز الطلب للكاشير',
              onPressed: () => showOrderQr(context, o.orderNumber),
              icon: const Icon(Icons.qr_code_2_rounded),
            ),
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
          if (!o.closed)
            PopupMenuButton<String>(
              onSelected: (v) => v == 'CANCELLED' ? _cancel(o) : _manualStatus(o),
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'MANUAL',
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.edit_note_rounded),
                    title: Text('تغيير الحالة يدوياً…'),
                    subtitle: Text('يتجاوز الكاشير وشركة التوصيل', style: TextStyle(fontSize: 12)),
                  ),
                ),
                if (o.cancellable)
                  const PopupMenuItem(
                    value: 'CANCELLED',
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.cancel_outlined, color: AppColors.danger),
                      title: Text('إلغاء الطلب', style: TextStyle(color: AppColors.danger)),
                    ),
                  ),
              ],
            ),
        ],
      ),
      bottomNavigationBar: _bottomBar(o),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
          children: [
            if (stage != null) StageTrackPanel(stage: stage, pickup: o.isPickup) else _legacyTrack(o),
            const SizedBox(height: 12),
            if (stage == 'PICKED' || stage == 'READY_FOR_PICKUP') ...[
              OrderQrCard(
                orderNumber: o.orderNumber,
                title: stage == 'READY_FOR_PICKUP' ? 'جاهز للاستلام — بانتظار الكاشير' : 'بانتظار الكاشير',
                onExpand: () => showOrderQr(context, o.orderNumber),
              ),
              const SizedBox(height: 12),
            ],
            _customer(o),
            SectionTitle(
              'المنتجات',
              subtitle: pick == null ? orderSizeLabel(lines: o.lines, units: o.units) : null,
            ),
            if (pick != null)
              PickResultSection(view: pick, onOpen: _openPicking)
            else ...[
              if (o.pickStarted && o.pick != null) ...[_tallyPanel(o.pick!), const SizedBox(height: 10)],
              Panel(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var i = 0; i < o.items.length; i++) ...[if (i > 0) const Divider(indent: 76), _itemTile(o.items[i])],
                  ],
                ),
              ),
            ],
            if (stage != null && o.pickStarted && stage != 'PICKING') ...[
              const SizedBox(height: 2),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                onPressed: _openPicking,
                icon: const Icon(Icons.fact_check_rounded),
                label: const Text('عرض تفاصيل الجمع'),
              ),
            ],
            if (_ship != null) ...[
              const SectionTitle('الشحنة'),
              ShipmentCard(shipment: _ship!),
            ] else if (stage == 'INVOICED' && !o.isPickup) ...[
              const SectionTitle('الشحنة'),
              const Panel(
                color: AppColors.warningSoft,
                child: Text('لم تُنشأ شحنة هاي إكسبريس بعد — تُنشأ تلقائياً بعد الفوترة.', style: TextStyle(height: 1.6)),
              ),
            ],
            const SectionTitle('المبلغ'),
            OrderMoneyCard(order: o, pick: pick),
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
            if ((_timeline ?? const []).isNotEmpty) ...[
              const SectionTitle('الخط الزمني'),
              TimelineCard(entries: _timeline!),
            ] else if (o.history.isNotEmpty) ...[
              const SectionTitle('السجل'),
              _legacyHistory(o),
            ],
          ],
        ),
      ),
    );
  }

  // ------------------------------------------------------------ bottom bar

  Widget? _bottomBar(OrderDetail o) {
    final stage = o.stage;
    if (o.closed) return null;
    Widget button(String label, IconData icon, VoidCallback onTap, {Color? color}) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: FilledButton.icon(
          style: FilledButton.styleFrom(backgroundColor: color ?? AppColors.primary, minimumSize: const Size.fromHeight(54)),
          onPressed: _busy ? null : onTap,
          icon: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
              : Icon(icon),
          label: Text(label, style: const TextStyle(fontSize: 16)),
        ),
      ),
    );
    if (stage == null) {
      // سيرفر أقدم بلا مراحل: الأزرار القديمة كما كانت.
      final next = _legacyNextStep[o.status];
      if (next == null || o.status == 'DELIVERED') return null;
      if (o.status != 'PENDING' && const {'CONFIRMED', 'PROCESSING'}.contains(o.status)) {
        return button('جمع الطلب', Icons.shopping_basket_rounded, _openPicking);
      }
      return button(next.$2, next.$3, () => _setStatus(next.$1), color: orderStatusColor(next.$1));
    }
    if (stagesBeforePicking.contains(stage)) return button('تأكيد الطلب', Icons.check_circle_rounded, _confirmAndCollect);
    if (stage == 'PICKING') return button('متابعة جمع الطلب', Icons.shopping_basket_rounded, _openPicking);
    if (stage == 'PICKED' || stage == 'READY_FOR_PICKUP') {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            onPressed: () => showOrderQr(context, o.orderNumber),
            icon: const Icon(Icons.qr_code_2_rounded),
            label: const Text('عرض الرمز بحجم كبير للكاشير', style: TextStyle(fontSize: 15.5)),
          ),
        ),
      );
    }
    final w = stageWaiting(stage, pickup: o.isPickup);
    if (w == null) return null;
    final driver = _ship?.driverName;
    return StageWaitingBar(
      stage: stage,
      title: stage == 'OUT_FOR_DELIVERY' && driver != null ? '${w.title} — $driver' : w.title,
      hint: w.hint,
    );
  }

  bool _cancelled(OrderDetail o) => o.stage == 'CANCELLED' || o.status == 'CANCELLED';

  // ------------------------------------------------------------ sections

  Widget _tallyPanel(PickTally t) => Panel(
    padding: const EdgeInsets.all(14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(deliverLabel(units: t.units, lines: t.lines), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            if (t.missingUnits > 0) pickChip('ناقص ${numFmt(t.missingUnits)}', 'red', small: false),
            if (t.extraUnits > 0) pickChip('إضافي ${numFmt(t.extraUnits)}', 'yellow', small: false),
            if (t.missingUnits == 0 && t.extraUnits == 0) pickChip('مطابق للطلب', 'green', small: false),
          ],
        ),
      ],
    ),
  );

  Widget _legacyTrack(OrderDetail o) {
    if (o.status == 'CANCELLED' || o.status == 'REFUNDED') {
      return Panel(
        color: AppColors.dangerSoft,
        child: Row(
          children: [
            const Icon(Icons.cancel_rounded, color: AppColors.danger),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'الطلب ${orderStatusLabels[o.status]}',
                style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
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
          for (var i = 0; i < orderStatusFlow.length; i++)
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
                    maxLines: 2,
                    style: TextStyle(fontSize: 10.5, fontWeight: i == idx ? FontWeight.w800 : FontWeight.w600, color: i <= idx ? AppColors.ink : AppColors.muted),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _legacyHistory(OrderDetail o) => Panel(
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
                  child: Text(orderStatusLabels['${h['status']}'] ?? '${h['status'] ?? h['action']}', style: const TextStyle(fontWeight: FontWeight.w700)),
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
  );

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
                    Text(o.customerName, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    Text(
                      o.customerOrders > 1 ? 'زبونة دائمة · ${o.customerOrders} طلبات' : 'أول طلب لها',
                      style: TextStyle(color: o.customerOrders > 1 ? AppColors.success : AppColors.muted, fontSize: 12.5, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
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
                    label: Text(phone, textDirection: TextDirection.ltr, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () => _whatsapp(o, phone),
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
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: it.productId))),
      child: Padding(
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
                Text(it.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, height: 1.4)),
                if (it.shadeName != null)
                  Text(
                    'اللون: ${it.shadeName}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w700, fontSize: 12.5),
                  ),
                Text(
                  [if (it.barcode != null) it.barcode!, money(it.unitPrice)].join(' · '),
                  textDirection: TextDirection.ltr,
                  textAlign: TextAlign.right,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
            child: Text('× ${it.quantity}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
          ),
        ],
      ),
      ),
    );
  }

  /// رسائل جاهزة للزبونة حسب مرحلة الطلب — تُفتح في واتساب ويمكن تعديلها قبل الإرسال.
  List<(String, IconData, String)> _templates(OrderDetail o) {
    final first = o.customerName.trim().split(' ').first;
    final hi = 'مرحباً $first 🌸';
    final p = o.pickStarted ? _pick : null;
    final items = p != null
        ? p.lines
              .where((l) => l.pickedQty > 0)
              .map((l) => '• ${l.name}${l.shadeName != null ? ' (${l.shadeName})' : ''} × ${l.pickedQty}')
              .join('\n')
        : o.items.map((it) => '• ${it.name}${it.shadeName != null ? ' (${it.shadeName})' : ''} × ${it.quantity}').join('\n');
    final due = o.codAmount ?? o.finalTotal ?? o.total;
    final tracking = _ship?.trackingNumber;
    return [
      (
        'تأكيد الطلب',
        Icons.check_circle_outline_rounded,
        '$hi\nوصلنا طلبك رقم ${o.orderNumber} من ديما الحياة:\n$items\nالإجمالي ${money(o.total)}${o.paymentMethod == 'COD' ? ' (الدفع عند الاستلام)' : ''}.\nنرجو تأكيد العنوان: ${o.addressLine}\nشكراً لثقتك 💜',
      ),
      ('قيد التجهيز', Icons.inventory_2_outlined, '$hi\nطلبك ${o.orderNumber} قيد التجهيز الآن وسيُسلَّم لشركة التوصيل قريباً 💜'),
      (
        'خرج للتوصيل',
        Icons.local_shipping_outlined,
        '$hi\nطلبك ${o.orderNumber} خرج مع مندوب هاي إكسبريس وسيتواصل معك قريباً.${tracking != null ? '\nرقم التتبع: $tracking' : ''}${due > 0 ? '\nالمبلغ المطلوب عند الاستلام: ${money(due)}' : ''}',
      ),
      (
        'شكر بعد الاستلام',
        Icons.favorite_outline_rounded,
        '$hi\nنتمنى أن يعجبك طلبك من ديما الحياة 💜\nيسعدنا تقييمك للمنتجات من التطبيق — رأيك يهمنا.',
      ),
      (
        'منتج غير متوفر',
        Icons.remove_shopping_cart_outlined,
        '$hi\nبخصوص طلبك ${o.orderNumber}: نعتذر، أحد المنتجات نفد من المخزون. هل تفضلين بديلاً مشابهاً أم نكمل الطلب بدونه؟',
      ),
      (
        'توضيح العنوان',
        Icons.place_outlined,
        '$hi\nبخصوص طلبك ${o.orderNumber}: نحتاج أقرب نقطة دالة للعنوان ليصل المندوب بسهولة. شكراً لك 🌸',
      ),
      ('رسالة فارغة', Icons.chat_bubble_outline_rounded, '$hi\nبخصوص طلبك ${o.orderNumber} من ديما الحياة'),
    ];
  }

  Future<void> _whatsapp(OrderDetail o, String phone) async {
    final suggested = switch (o.stage) {
      'NEW' || 'CONFIRMED' => 0,
      'PICKING' || 'PICKED' || 'READY_FOR_PICKUP' => 1,
      'INVOICED' || 'HANDED_OVER' || 'OUT_FOR_DELIVERY' => 2,
      'DELIVERED' => 3,
      'DELIVERY_ISSUE' => 5,
      null => switch (o.status) {
        'PENDING' || 'CONFIRMED' => 0,
        'PROCESSING' => 1,
        'SHIPPED' => 2,
        'DELIVERED' => 3,
        _ => -1,
      },
      _ => -1,
    };
    final t = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (c) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Text('رسالة واتساب', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            ),
            for (final (i, (title, icon, text)) in _templates(o).indexed)
              ListTile(
                leading: Icon(icon, color: i == suggested ? const Color(0xFF25D366) : AppColors.muted),
                title: Text(title, style: TextStyle(fontWeight: i == suggested ? FontWeight.w800 : FontWeight.w600)),
                subtitle: Text(text.replaceAll('\n', ' '), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                trailing: i == suggested ? const Pill('مقترحة', color: Color(0xFF128C4A), bg: Color(0xFFE2F7EA), small: true) : null,
                onTap: () => Navigator.pop(c, text),
              ),
          ],
        ),
      ),
    );
    if (t == null) return;
    await _openUrl('https://wa.me/${_intlPhone(phone)}?text=${Uri.encodeComponent(t)}');
  }

  /// ملخص للنسخ والمشاركة: بعد التجهيز يُرسل ما سيُسلَّم فعلاً.
  String _summary(OrderDetail o) {
    final b = StringBuffer()
      ..writeln('طلب ${o.orderNumber}')
      ..writeln('${o.customerName} — ${o.customerPhone ?? ''}')
      ..writeln(o.addressLine);
    final p = o.pickStarted ? _pick : null;
    if (p != null) {
      for (final l in p.lines.where((l) => l.pickedQty > 0)) {
        b.writeln('• ${l.name}${l.shadeName != null ? ' (${l.shadeName})' : ''} × ${l.pickedQty}${l.isExtra ? ' (إضافي)' : ''}');
      }
    } else {
      for (final it in o.items) {
        b.writeln('• ${it.name}${it.shadeName != null ? ' (${it.shadeName})' : ''} × ${it.quantity}');
      }
    }
    final total = o.finalTotal ?? o.total;
    b.writeln('الإجمالي: ${money(total)} — ${paymentMethodLabels[o.paymentMethod] ?? ''}');
    if (o.codAmount != null) b.writeln('يُحصَّل عند الاستلام: ${o.codAmount == 0 ? 'لا شيء (مدفوع)' : money(o.codAmount)}');
    if (_ship?.trackingNumber != null) b.writeln('رقم التتبع (هاي إكسبريس): ${_ship!.trackingNumber}');
    if ((o.notes ?? '').isNotEmpty) b.writeln('ملاحظة: ${o.notes}');
    return b.toString();
  }
}
