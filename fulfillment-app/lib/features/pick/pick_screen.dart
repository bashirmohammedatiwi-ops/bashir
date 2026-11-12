import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api.dart';
import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../scan/scan_screen.dart';
import 'pick_sheets.dart';
import 'pick_widgets.dart';

/// معرّف فريد لكل إضافة (يمنع تكرارها إن أُعيد إرسالها).
String newClientScanId() => '${DateTime.now().microsecondsSinceEpoch}-${math.Random().nextInt(1 << 31)}';

/// «منتج واحد»، «منتجان»، «3 منتجات»، «11 منتجاً».
String productsLabel(int n) => arCount(n, one: 'منتج واحد', two: 'منتجان', few: 'منتجات', many: 'منتجاً');

/// جمع الطلب منتجاً منتجاً: الضغط على المنتج يفتحه كبيراً، والدائرة تجمعه كاملاً بلمسة،
/// و−/+ للعدّ اليدوي. الكاميرا لإضافة منتج جديد فقط. يتحدّث تلقائياً كل 15 ثانية
/// (تعديلات كاشير الطلبات تظهر هنا والعكس).
class PickScreen extends ConsumerStatefulWidget {
  const PickScreen({super.key, required this.orderId});
  final String orderId;
  @override
  ConsumerState<PickScreen> createState() => _PickScreenState();
}

class _PickScreenState extends ConsumerState<PickScreen> with WidgetsBindingObserver {
  PickView? _v;
  Object? _error;
  bool _busy = false;
  bool _adding = false;
  bool _offline = false;
  final DateTime _openedAt = DateTime.now();

  // عرض فوري: العدد/السبب المطلوب لكل منتج قبل أن يؤكده السيرفر.
  final _targets = <String, int>{};
  final _reasons = <String, String?>{};
  final _timers = <String, Timer>{};
  final _jobs = <String, int>{};
  Future<void> _chain = Future.value();

  // ترتيب ثابت أثناء اللمس (لا تقفز البطاقات تحت الإصبع)، يُعاد بعد لحظة سكون.
  List<String> _order = const [];
  Timer? _resortTimer;
  Timer? _auto;

  final _sheet = ValueNotifier<PickSheetData>(const PickSheetData(items: []));

  Repo get _repo => ref.read(repoProvider);
  bool get _isManager => ref.read(sessionProvider).me?.isManager == true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ScannerBus.instance.push(_onHardware);
    _load();
    _startAuto();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ScannerBus.instance.pop(_onHardware);
    _auto?.cancel();
    _resortTimer?.cancel();
    for (final t in _timers.values) {
      t.cancel();
    }
    _sheet.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startAuto();
      _load(silent: true);
    } else if (state == AppLifecycleState.paused) {
      _auto?.cancel();
    }
  }

  void _startAuto() {
    _auto?.cancel();
    _auto = Timer.periodic(const Duration(seconds: 15), (_) {
      if (!_dirty && !_busy && !_adding) _load(silent: true);
    });
  }

  // ------------------------------------------------------------ الحالة المعروضة

  bool get _dirty => _timers.isNotEmpty || _jobs.values.any((n) => n > 0);
  Set<String> get _savingIds => {..._timers.keys, for (final e in _jobs.entries) if (e.value > 0) e.key};

  bool get _mine {
    final v = _v;
    final me = ref.read(sessionProvider).me;
    return v != null && (v.pickerId == null || v.pickerId == me?.id);
  }

  bool get _canEdit => _v?.picking == true && _mine;

  PickItem _overlay(PickItem i) {
    var x = i;
    final t = _targets[i.id];
    if (t != null) x = x.withTotal(t);
    if (_reasons.containsKey(i.id)) x = x.withReason(_reasons[i.id]);
    return x;
  }

  /// المنتجات بالعرض الفوري وبالترتيب الثابت.
  List<PickItem> get _items {
    final v = _v;
    if (v == null) return const [];
    final all = [for (final i in v.items) _overlay(i)];
    final byId = {for (final i in all) i.id: i};
    final known = [for (final id in _order) ?byId[id]];
    final fresh = sortPickItems(all.where((i) => !_order.contains(i.id)).toList());
    return [...known, ...fresh];
  }

  void _resort() {
    final v = _v;
    _order = v == null ? const [] : sortPickItems([for (final i in v.items) _overlay(i)]).map((i) => i.id).toList();
  }

  void _resortSoon() {
    _resortTimer?.cancel();
    _resortTimer = Timer(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      _set(_resort);
    });
  }

  /// setState + تحديث نافذة المنتج المفتوحة.
  void _set(VoidCallback fn) {
    if (!mounted) return;
    setState(fn);
    _publish();
  }

  void _publish() {
    _sheet.value = PickSheetData(items: _items, saving: _savingIds, editable: _canEdit);
  }

  // ------------------------------------------------------------ التحميل

  Future<void> _load({bool silent = false}) async {
    try {
      final v = await _repo.pickView(widget.orderId);
      if (!mounted || (_dirty && _v != null)) return;
      final first = _v == null;
      _set(() {
        _v = v;
        _error = null;
        _offline = false;
        if (first || _resortTimer?.isActive != true) _resort();
      });
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      if (_v == null) {
        _set(() => _error = e);
      } else if (err.isNetwork) {
        _set(() => _offline = true);
      } else if (!silent) {
        toastError(context, e);
      }
    }
  }

  void _changed() => ref.read(ordersVersionProvider.notifier).state++;

  // ------------------------------------------------------------ تأكيد الطلب (بدء الجمع)

  Future<void> _start({bool takeover = false}) async {
    _set(() => _busy = true);
    try {
      final v = await _repo.pickStart(widget.orderId, takeover: takeover);
      if (!mounted) return;
      _set(() {
        _v = v;
        _resort();
      });
      _changed();
      Prefs.instance.feedback();
      toast(context, takeover ? 'انتقل الجمع إليك' : 'تم تأكيد الطلب — ابدأ الجمع');
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      if (err.status == 409 && err.message.contains('يجهّزه') && _isManager) {
        final ok = await confirm(context, title: 'نقل الجمع إليك؟', message: '${err.message}.\nسيتوقف الموظف الآخر عن الجمع.', ok: 'نقل');
        if (ok && mounted) return _start(takeover: true);
      } else {
        toastError(context, e);
      }
    } finally {
      _set(() => _busy = false);
    }
  }

  // ------------------------------------------------------------ العدّ اليدوي (مؤجل 400ms)

  /// العدد الكلي الجديد لمنتج: يظهر فوراً ويُرسل بعد توقف الضغط.
  void _setTotal(PickItem item, int total) {
    if (!_canEdit) return;
    final t = math.max(0, total);
    Prefs.instance.feedback();
    _set(() {
      _targets[item.id] = t;
      // اكتمل المطلوب: لا معنى لسبب النقص القديم.
      if (!item.isExtra && t >= item.orderedQty && (item.line.hasReason || _reasons[item.id] != null)) _reasons[item.id] = null;
    });
    _timers[item.id]?.cancel();
    _timers[item.id] = Timer(const Duration(milliseconds: 400), () => _flush(item.id));
    _resortSoon();
  }

  void _flush(String id) {
    _timers.remove(id)?.cancel();
    _enqueue(id, () => _save(id));
  }

  /// كل الإرسالات بالترتيب، واحداً تلو الآخر.
  Future<void> _enqueue(String id, Future<void> Function() job) {
    _set(() => _jobs[id] = (_jobs[id] ?? 0) + 1);
    final done = _chain.then((_) => job()).catchError((_) {});
    _chain = done.whenComplete(() {
      _set(() {
        final n = (_jobs[id] ?? 1) - 1;
        if (n <= 0) {
          _jobs.remove(id);
        } else {
          _jobs[id] = n;
        }
      });
    });
    return _chain;
  }

  Future<void> _flushAll() async {
    for (final id in _timers.keys.toList()) {
      _flush(id);
    }
    await _chain;
  }

  /// يرسل الفرق بين المعروض والسيرفر: إنقاص الزيادة ← المطلوب ← زيادة جديدة (بالباركود).
  Future<void> _save(String id) async {
    final base = _v?.items.where((i) => i.id == id).firstOrNull;
    if (base == null) {
      _set(() => (_targets.remove(id), _reasons.remove(id)));
      return;
    }
    final target = _targets[id] ?? base.total;
    final hasReason = _reasons.containsKey(id);
    final reason = _reasons[id];
    final sendReason = hasReason && (reason ?? '').trim() != (base.reason ?? '').trim();
    final o = widget.orderId;
    try {
      PickView? nv;
      if (base.isExtra) {
        if (target != base.picked) nv = await _repo.pickLine(o, id, {'pickedQty': target});
      } else {
        final ordered = math.min(target, base.orderedQty);
        final over = math.max(0, target - base.orderedQty);
        final overLine = base.overLine;
        if (overLine != null && over < base.overQty) nv = await _repo.pickLine(o, overLine.id, {'pickedQty': over});
        if (ordered != base.picked || sendReason) {
          nv = await _repo.pickLine(o, id, {if (ordered != base.picked) 'pickedQty': ordered, if (sendReason) 'reason': reason ?? ''});
        }
        if (over > base.overQty) {
          nv = overLine != null
              ? await _repo.pickLine(o, overLine.id, {'pickedQty': over})
              : await _repo.pickAdd(o, barcode: base.line.barcode!, qty: over - base.overQty, clientScanId: newClientScanId());
        }
      }
      if (!mounted) return;
      _set(() {
        if (nv != null) _v = nv;
        if (_targets[id] == target && !_timers.containsKey(id)) _targets.remove(id);
        if (hasReason && _reasons[id] == reason) _reasons.remove(id);
        _offline = false;
      });
    } catch (e) {
      // رجوع للقيمة المحفوظة في السيرفر.
      if (!mounted) return;
      final err = Api.toError(e);
      _set(() {
        _targets.remove(id);
        _reasons.remove(id);
        _timers.remove(id)?.cancel();
        if (err.isNetwork) _offline = true;
      });
      Prefs.instance.feedback(error: true);
      if (!err.isNetwork) toast(context, err.message, error: true);
      await _reloadAfterError();
    }
  }

  Future<void> _reloadAfterError() async {
    try {
      final v = await _repo.pickView(widget.orderId);
      if (mounted) _set(() => _v = v);
    } catch (_) {}
  }

  // ------------------------------------------------------------ الإزالة والسبب

  Future<void> _remove(PickItem item) async {
    if (!_canEdit) return;
    if (item.isExtra) {
      final ok = await confirm(context, title: 'إزالة الإضافي؟', message: item.line.name, ok: 'إزالة', danger: true);
      if (!ok || !mounted) return;
      _timers.remove(item.id)?.cancel();
      _set(() => _targets[item.id] = 0);
      Prefs.instance.feedback();
      await _enqueue(item.id, () => _save(item.id));
      return;
    }
    final reason = await showReasonSheet(
      context,
      title: 'لماذا يُزال المنتج؟',
      subtitle: [item.line.name, ?item.line.shadeName].join(' — '),
      ok: 'إزالة المنتج',
    );
    if (reason == null || !mounted) return;
    _timers.remove(item.id)?.cancel();
    Prefs.instance.feedback();
    _set(() {
      _targets[item.id] = 0;
      _reasons[item.id] = reason;
    });
    _resortSoon();
    await _enqueue(item.id, () => _save(item.id));
  }

  Future<void> _shortReason(PickItem item) async {
    if (!_canEdit) return;
    final reason = await showReasonSheet(
      context,
      title: 'سبب النقص',
      subtitle: '${item.line.name} — ناقص ${item.missingQty} من ${item.orderedQty}',
      initial: item.reason,
    );
    if (reason == null || !mounted) return;
    _set(() => _reasons[item.id] = reason);
    _flushNow(item.id);
  }

  Future<void> _restore(PickItem item) async {
    if (!_canEdit) return;
    _set(() => _reasons[item.id] = null);
    _resortSoon();
    _flushNow(item.id);
  }

  void _flushNow(String id) {
    _timers.remove(id)?.cancel();
    _enqueue(id, () => _save(id));
  }

  Future<void> _setCharge(PickItem item, String charge) async {
    if (!_canEdit || item.line.charge == charge) return;
    await _enqueue(item.id, () async {
      try {
        final nv = await _repo.pickLine(widget.orderId, item.id, {'charge': charge});
        if (mounted) _set(() => _v = nv);
      } catch (e) {
        if (mounted) toastError(context, e);
      }
    });
  }

  PickItemActions get _actions =>
      PickItemActions(setTotal: _setTotal, remove: _remove, shortReason: _shortReason, restore: _restore, setCharge: _setCharge);

  Future<void> _open(PickItem item) async {
    _publish();
    await showItemSheet(context, data: _sheet, itemId: item.id, order: _items.map((i) => i.id).toList(), actions: _actions);
    if (!mounted) return;
    _resortSoon();
    if (_canEdit && canFinishPick(_items) && _items.isNotEmpty) toast(context, 'جُمع كل شيء ✓ — اضغط «تم جمع الطلب»');
  }

  void _openNextPending() {
    final next = pendingItems(_items).firstOrNull;
    if (next != null) _open(next);
  }

  // ------------------------------------------------------------ إضافة منتج (الكاميرا أو القارئ)

  bool _onHardware(ScanEvent e) {
    if (ModalRoute.of(context)?.isCurrent != true) return false;
    _addByBarcode(e.code);
    return true;
  }

  Future<void> _camera() async {
    final code = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const ScanScreen(title: 'إضافة منتج', hint: 'امسح باركود المنتج لإضافته للطلب')),
    );
    if (code != null && mounted) await _addByBarcode(code);
  }

  Future<void> _addByBarcode(String code) async {
    if (_adding) return;
    if (!_canEdit) {
      Prefs.instance.feedback(error: true);
      toast(context, _v?.picking == true ? 'يجمعه موظف آخر' : 'أكّد الطلب أولاً', error: true);
      return;
    }
    if (isOrderCode(code)) {
      Prefs.instance.feedback(error: true);
      toast(context, 'هذا رمز طلب — امسح باركود المنتج', error: true);
      return;
    }
    _set(() => _adding = true);
    PickProductInfo info;
    try {
      info = await _repo.pickProduct(widget.orderId, code);
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      _set(() {
        _adding = false;
        if (err.isNetwork) _offline = true;
      });
      toastError(context, e);
      return;
    }
    if (!mounted) return;
    _set(() => _adding = false);
    if (!info.found) {
      Prefs.instance.feedback(error: true);
      if (await showNotFoundDialog(context, info.barcode.isEmpty ? code : info.barcode) && mounted) await _camera();
      return;
    }
    Prefs.instance.feedback();
    final choice = await showAddProductSheet(context, info: info);
    if (choice == null || !mounted) return;
    await _flushAll();
    if (!mounted) return;
    _set(() => _adding = true);
    try {
      final nv = await _repo.pickAdd(
        widget.orderId,
        barcode: info.barcode,
        qty: choice.qty,
        charge: choice.charge,
        reason: choice.reason,
        clientScanId: newClientScanId(),
      );
      if (!mounted) return;
      _set(() {
        _v = nv;
        _offline = false;
        _resort();
      });
      Prefs.instance.feedback();
      toast(context, 'أُضيف ${choice.qty} × ${info.name}${choice.charge == 'FREE' ? ' (هدية)' : ''}');
    } catch (e) {
      if (!mounted) return;
      if (Api.toError(e).isNetwork) _set(() => _offline = true);
      toastError(context, e);
    } finally {
      _set(() => _adding = false);
    }
  }

  // ------------------------------------------------------------ تم جمع الطلب

  Future<void> _finish() async {
    await _flushAll();
    final v = _v;
    if (v == null || !mounted) return;
    var items = _items;
    if (!canFinishPick(items)) {
      toast(context, 'بقي ${productsLabel(pendingItems(items).length)} — اجمعه أو أزله مع السبب', error: true);
      _openNextPending();
      return;
    }
    if (items.every((i) => i.total == 0)) return _allMissingDialog();
    // احتياط: كل نقص بلا سبب يُسأل عنه قبل الإرسال.
    for (final i in shortWithoutReason(items)) {
      final r = await showReasonSheet(context, title: 'سبب النقص', subtitle: '${i.line.name} — ناقص ${i.missingQty} من ${i.orderedQty}');
      if (r == null || !mounted) return;
      _set(() => _reasons[i.id] = r);
    }
    items = _items;
    final parcels = await showFinishSheet(context, view: v, items: items);
    if (parcels == null || !mounted) return;
    final reasons = {
      for (final i in items)
        if (!i.isExtra && i.picked < i.orderedQty && i.hasReason) i.id: i.reason!.trim(),
    };
    _set(() => _busy = true);
    try {
      final nv = await _repo.pickFinish(widget.orderId, parcelCount: parcels, reasons: reasons);
      if (!mounted) return;
      _set(() {
        _v = nv;
        _reasons.clear();
        _targets.clear();
        _resort();
      });
      Prefs.instance.recordPrepared(seconds: DateTime.now().difference(_openedAt).inSeconds, orderNumber: nv.orderNumber);
      _changed();
      Prefs.instance.feedback();
      await showOrderQr(
        context,
        nv.orderNumber,
        title: nv.stage == 'READY_FOR_PICKUP' ? 'تم جمع الطلب — جاهز للاستلام' : 'تم جمع الطلب ✓',
        message: 'سلّمه للكاشير — اعرض هذا الرمز على قارئ كاشير الطلبات',
        ok: 'تم',
      );
      if (mounted) Navigator.of(context).maybePop();
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      switch (err.code) {
        case 'APPROVAL_REQUIRED':
          await _info(
            'يحتاج موافقة المدير',
            '${err.message}\n\nاطلب من المدير فتح الطلب في تطبيق المدير وإنهاء الجمع، أو راجع الإزالات والإضافات.',
          );
        case 'ALL_MISSING':
          await _allMissingDialog();
        case 'SHORTAGE_REASON_REQUIRED':
          toast(context, err.message, error: true);
        default:
          if (err.isNetwork) _set(() => _offline = true);
          toastError(context, e);
      }
      await _load(silent: true);
    } finally {
      _set(() => _busy = false);
    }
  }

  Future<void> _allMissingDialog() => _info('كل المنتجات أُزيلت', 'لا يُنهى جمع طلب لم يُجمع منه شيء. ألغِ الطلب من شاشة الطلب وأبلغ الزبونة.');

  Future<void> _info(String title, String message) => showDialog<void>(
    context: context,
    builder: (c) => AlertDialog(
      title: Text(title),
      content: Text(message, style: const TextStyle(height: 1.6)),
      actions: [FilledButton(onPressed: () => Navigator.pop(c), child: const Text('حسناً'))],
    ),
  );

  Future<void> _reopen() async {
    final reason = await promptText(context, title: 'سبب إعادة فتح الجمع', hint: 'مثلاً: الزبونة غيّرت طلبها', ok: 'إعادة الفتح');
    if (reason == null || reason.trim().isEmpty || !mounted) return;
    _set(() => _busy = true);
    try {
      final nv = await _repo.pickReopen(widget.orderId, reason.trim());
      if (!mounted) return;
      _set(() {
        _v = nv;
        _resort();
      });
      _changed();
      toast(context, 'أُعيد فتح الجمع');
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      _set(() => _busy = false);
    }
  }

  // ------------------------------------------------------------ الواجهة

  @override
  Widget build(BuildContext context) {
    final v = _v;
    if (v == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()),
      );
    }
    ref.watch(sessionProvider);
    final items = _items;
    final saving = _savingIds;
    final editable = _canEdit;
    final notStarted = v.startable && !v.picking;
    final done = !v.startable && !v.picking && !v.cancelled;
    return PopScope(
      canPop: !_dirty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _popAfterSave();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(v.orderNumber, textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 17)),
              Text(
                notStarted ? 'تأكيد الطلب' : (v.picking ? 'جمع الطلب' : (stageLabels[v.stage] ?? v.stage)),
                style: const TextStyle(fontSize: 12, color: AppColors.muted),
              ),
            ],
          ),
          actions: [
            if (!v.cancelled)
              IconButton(tooltip: 'رمز الطلب للكاشير', onPressed: () => showOrderQr(context, v.orderNumber), icon: const Icon(Icons.qr_code_2_rounded)),
            if (v.finished && !v.invoiced && _isManager)
              IconButton(tooltip: 'إعادة فتح الجمع', onPressed: _busy ? null : _reopen, icon: const Icon(Icons.lock_open_rounded)),
            IconButton(tooltip: 'تحديث', onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
          ],
        ),
        floatingActionButton: editable
            ? FloatingActionButton.extended(
                onPressed: _adding ? null : _camera,
                icon: _adding
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : const Icon(Icons.add_a_photo_rounded),
                label: const Text('إضافة منتج'),
              )
            : null,
        bottomNavigationBar: _bottomBar(v, items),
        body: Column(
          children: [
            if (_offline) OfflineBanner(onRetry: _load),
            if (_adding) const LinearProgressIndicator(minHeight: 3),
            if (!done) PickProgressHeader(items: items, notStarted: notStarted, pickerName: v.pickerName),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
                  children: [
                    if (v.finished) ...[
                      OrderQrCard(
                        orderNumber: v.orderNumber,
                        title: v.stage == 'READY_FOR_PICKUP' ? 'جاهز للاستلام — بانتظار الكاشير' : 'بانتظار الكاشير',
                        onExpand: () => showOrderQr(context, v.orderNumber),
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (done) ...[PickFinishedSummary(view: v), const SizedBox(height: 10)],
                    if (v.isGift || (v.notes ?? '').isNotEmpty) ...[PickNotesPanel(view: v), const SizedBox(height: 10)],
                    if (!_mine && v.picking) ...[
                      Panel(
                        color: AppColors.warningSoft,
                        child: Text(
                          'يجمعه ${v.pickerName ?? 'موظف آخر'} الآن',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.warning),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (notStarted)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 4),
                        child: Text('راجع المنتجات ثم اضغط «تأكيد الطلب» لتبدأ الجمع.', style: TextStyle(color: AppColors.muted, height: 1.5)),
                      ),
                    SectionTitle('المنتجات', subtitle: editable ? 'اضغط المنتج لعرضه كبيراً، أو الدائرة لجمعه كاملاً' : null),
                    if (items.isEmpty)
                      const Panel(
                        child: Text('تظهر المنتجات بعد تأكيد الطلب', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
                      ),
                    for (final i in items) ...[
                      PickItemCard(
                        key: ValueKey(i.id),
                        item: i,
                        editable: editable,
                        saving: saving.contains(i.id),
                        onOpen: () => _open(i),
                        onCollectAll: () => _setTotal(i, i.orderedQty),
                        onStep: (d) => _step(i, d),
                      ),
                      const SizedBox(height: 8),
                    ],
                    const SectionTitle('المبلغ'),
                    PickMoneyPanel(view: v),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// الرجوع ينتظر حفظ آخر تعديل.
  Future<void> _popAfterSave() async {
    await _flushAll();
    if (mounted) Navigator.of(context).pop();
  }

  void _step(PickItem i, int d) {
    if (i.isExtra && i.total + d <= 0) {
      _remove(i);
      return;
    }
    _setTotal(i, i.total + d);
  }

  Widget? _bottomBar(PickView v, List<PickItem> items) {
    Widget bar(Widget child) => SafeArea(
      child: Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 12), child: child),
    );
    if (v.cancelled) return null;
    if (v.startable && !v.picking) {
      return bar(
        FilledButton.icon(
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
          onPressed: _busy ? null : _start,
          icon: _busy ? const _Spinner() : const Icon(Icons.check_circle_rounded),
          label: const Text('تأكيد الطلب', style: TextStyle(fontSize: 17)),
        ),
      );
    }
    if (v.picking && !_mine) {
      return bar(
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(54)),
          onPressed: _busy || !_isManager ? null : () => _start(takeover: true),
          icon: const Icon(Icons.swap_horiz_rounded),
          label: Text(_isManager ? 'نقل الجمع إليّ' : 'يجمعه ${v.pickerName ?? 'موظف آخر'}'),
        ),
      );
    }
    if (!v.picking) return null;
    final pending = pendingItems(items);
    final ready = canFinishPick(items);
    return Material(
      color: Colors.white,
      elevation: 8,
      child: bar(
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (pending.isNotEmpty)
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'بقي ${productsLabel(pending.length)} — اجمعه أو أزله مع السبب',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                  TextButton.icon(
                    style: TextButton.styleFrom(minimumSize: const Size(48, 44)),
                    onPressed: _openNextPending,
                    icon: const Icon(Icons.skip_next_rounded),
                    label: const Text('التالي'),
                  ),
                ],
              ),
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56), backgroundColor: AppColors.success),
              onPressed: ready && !_busy && items.isNotEmpty ? _finish : null,
              icon: _busy ? const _Spinner() : const Icon(Icons.task_alt_rounded),
              label: const Text('تم جمع الطلب', style: TextStyle(fontSize: 17)),
            ),
          ],
        ),
      ),
    );
  }
}

class _Spinner extends StatelessWidget {
  const _Spinner();
  @override
  Widget build(BuildContext context) =>
      const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white));
}
