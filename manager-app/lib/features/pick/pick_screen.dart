import 'dart:async';
import 'dart:math';

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
import 'pick_scan_screen.dart';
import 'pick_sheets.dart';
import 'pick_widgets.dart';

/// مسحة تنتظر الإرسال — تبقى في الطابور حتى يؤكدها السيرفر (لا تضيع مع ضعف الشبكة).
class _PendingScan {
  _PendingScan(this.barcode, this.qty) : clientScanId = '${DateTime.now().microsecondsSinceEpoch}-${Random().nextInt(1 << 31)}';
  final String barcode;
  final int qty;
  final String clientScanId;
  final done = Completer<ScanFeedback?>();
}

/// تجهيز طلب بالمسح: المطلوب مقابل المُجهَّز بالألوان، محفوظ في السيرفر مسحةً مسحة.
/// أخضر = مطابق، أحمر = ناقص، أصفر = إضافي، رمادي = لم يُمسح بعد.
class PickScreen extends ConsumerStatefulWidget {
  const PickScreen({super.key, required this.orderId});
  final String orderId;
  @override
  ConsumerState<PickScreen> createState() => _PickScreenState();
}

class _PickScreenState extends ConsumerState<PickScreen> {
  PickView? _v;
  Object? _error;
  bool _busy = false;
  final _queue = <_PendingScan>[];
  bool _pumping = false;
  bool _offline = false;
  Timer? _retry;

  // عرض فقط (لا يغيّر منطق المسح): التصفية، البحث، وآخر مسحة.
  PickFilter _filter = PickFilter.all;
  final _search = TextEditingController();
  String _query = '';
  ScanFlash? _flash;
  Timer? _flashTimer;

  Repo get _repo => ref.read(repoProvider);
  bool get _isManager => ref.read(sessionProvider).me?.isAdmin == true;

  @override
  void initState() {
    super.initState();
    ScannerBus.instance.push(_onHardware);
    _load();
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onHardware);
    _retry?.cancel();
    _flashTimer?.cancel();
    _search.dispose();
    super.dispose();
  }

  /// شريط آخر مسحة لثانيتين: اسم الصنف + لونه.
  void _showFlash(String name, String color, String text) {
    if (!mounted) return;
    _flashTimer?.cancel();
    setState(() => _flash = (name: name, color: color, text: text));
    _flashTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) setState(() => _flash = null);
    });
  }

  PickLine? _lineFor(PickView? v, String code) => v?.lines.where((l) => _sameCode(l.barcode, code)).firstOrNull;

  Future<void> _load() async {
    try {
      final v = await _repo.pickView(widget.orderId);
      if (mounted) setState(() => (_v = v, _error = null));
    } catch (e) {
      if (!mounted) return;
      _v == null ? setState(() => _error = e) : toastError(context, e);
    }
  }

  void _changed() => ref.read(ordersVersionProvider.notifier).state++;

  // ------------------------------------------------------------ start

  Future<void> _start({bool takeover = false}) async {
    setState(() => _busy = true);
    try {
      final v = await _repo.pickStart(widget.orderId, takeover: takeover);
      if (!mounted) return;
      setState(() => _v = v);
      _changed();
      Prefs.instance.feedback();
      toast(context, 'بدأ التجهيز — امسح كل قطعة تضعها في الكيس');
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      if (err.status == 409 && err.message.contains('يجهّزه') && _isManager) {
        final ok = await confirm(context, title: 'نقل التجهيز إليك؟', message: '${err.message}.\nسيتوقف الموظف الآخر عن التجهيز.', ok: 'نقل');
        if (ok && mounted) return _start(takeover: true);
      } else {
        toastError(context, e);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ------------------------------------------------------------ scanning

  bool _onHardware(ScanEvent e) {
    if (ModalRoute.of(context)?.isCurrent != true) return false;
    _scan(e.code);
    return true;
  }

  /// كل قراءة (قارئ خارجي، كاميرا، يدوي) تمر من هنا.
  Future<ScanFeedback?> _scan(String raw, {int qty = 1}) async {
    final code = normalizeCode(raw);
    final v = _v;
    if (v == null || code.isEmpty) return null;
    if (isOrderCode(code)) {
      final same = code.toUpperCase().replaceAll('-', '') == v.orderNumber.toUpperCase().replaceAll('-', '');
      final msg = same ? 'هذا رمز الطلب نفسه — امسح باركود القطع' : 'رمز طلب آخر — أنهِ هذا الطلب أولاً';
      Prefs.instance.feedback(error: !same);
      if (mounted) toast(context, msg, error: !same);
      return (message: msg, error: !same);
    }
    if (!v.picking) {
      const msg = 'ابدأ التجهيز أولاً';
      Prefs.instance.feedback(error: true);
      if (mounted) toast(context, msg, error: true);
      return (message: msg, error: true);
    }
    // عرض فوري: القطعة المطابقة تُحسب على الشاشة قبل رد السيرفر.
    if (qty > 0) {
      final hit = v.ordered.where((l) => _sameCode(l.barcode, code) && l.pickedQty < l.orderedQty).firstOrNull;
      if (hit != null) {
        setState(() => _v = v.replaceLine(hit.withPicked(hit.pickedQty + 1)));
        _showFlash(hit.name, 'green', 'مطابق ${hit.pickedQty + 1}/${hit.orderedQty}');
      }
    }
    final p = _PendingScan(code, qty);
    _queue.add(p);
    _pump();
    return p.done.future;
  }

  bool _sameCode(String? a, String b) {
    if (a == null || a.isEmpty) return false;
    final x = normalizeCode(a).toUpperCase();
    final y = b.toUpperCase();
    return x == y || x.replaceFirst(RegExp(r'^0+'), '') == y.replaceFirst(RegExp(r'^0+'), '');
  }

  /// يرسل المسحات بالترتيب، واحدة تلو الأخرى. انقطاع الشبكة يبقيها في الطابور ويعيد المحاولة.
  Future<void> _pump() async {
    if (_pumping) return;
    _pumping = true;
    try {
      while (_queue.isNotEmpty && mounted) {
        final p = _queue.first;
        try {
          final r = await _repo.pickScan(widget.orderId, barcode: p.barcode, qty: p.qty, clientScanId: p.clientScanId, device: 'manager-app');
          _queue.removeAt(0);
          if (!mounted) return;
          setState(() => (_v = r.view, _offline = false));
          p.done.complete(await _afterScan(r, p));
        } on ApiError catch (e) {
          if (e.isNetwork) {
            if (mounted) setState(() => _offline = true);
            if (!p.done.isCompleted) p.done.complete((message: 'محفوظة — تُرسل عند عودة الاتصال', error: false));
            _retry?.cancel();
            _retry = Timer(const Duration(seconds: 3), _pump);
            return;
          }
          _queue.removeAt(0);
          Prefs.instance.feedback(error: true);
          if (mounted) toast(context, e.message, error: true);
          _showFlash(_lineFor(_v, p.barcode)?.name ?? p.barcode, 'red', e.message);
          if (!p.done.isCompleted) p.done.complete((message: e.message, error: true));
          await _load();
        } catch (e) {
          _queue.removeAt(0);
          final err = Api.toError(e);
          if (!p.done.isCompleted) p.done.complete((message: err.message, error: true));
          await _load();
        }
      }
    } finally {
      _pumping = false;
    }
  }

  Future<ScanFeedback?> _afterScan(ScanOutcome r, _PendingScan p) async {
    final line = _lineFor(r.view, p.barcode);
    final name = line?.name ?? r.proposal?.name ?? p.barcode;
    switch (r.result) {
      case 'MATCHED':
        _showFlash(name, 'green', line != null && !line.isExtra ? 'مطابق ${line.pickedQty}/${line.orderedQty}' : 'مطابق');
      case 'EXTRA':
        _showFlash(name, 'yellow', r.message.isEmpty ? 'إضافي' : r.message);
      case 'REMOVED':
        _showFlash(name, 'grey', r.message.isEmpty ? 'أُزيلت قطعة' : r.message);
      case 'OVER':
        _showFlash(name, 'yellow', 'العدد المطلوب مكتمل');
      case 'EXTRA_PROPOSED':
        _showFlash(name, 'yellow', 'ليس ضمن الطلب');
      default:
        _showFlash(name, 'red', r.message.isEmpty ? 'باركود غير معروف' : r.message);
    }
    switch (r.result) {
      case 'MATCHED':
      case 'EXTRA':
      case 'REMOVED':
        Prefs.instance.feedback();
        return (message: r.message, error: false);
      case 'OVER':
        Prefs.instance.feedback(error: true);
        if (!mounted) return (message: r.message, error: true);
        final add = await confirm(
          context,
          title: 'العدد المطلوب مكتمل',
          message: 'هذه القطعة زائدة عن الطلب. هل تضيفها كصنف إضافي؟',
          ok: 'إضافة كإضافي',
        );
        if (add && mounted) {
          final line = _v?.lines.where((l) => _sameCode(l.barcode, p.barcode)).firstOrNull;
          return _addExtra(ExtraProposal.unknownPrice(p.barcode, line?.name ?? p.barcode));
        }
        return (message: 'لم تُضف', error: true);
      case 'EXTRA_PROPOSED':
        Prefs.instance.feedback(error: true);
        final proposal = r.proposal;
        if (proposal == null || !mounted) return (message: r.message, error: true);
        return _addExtra(proposal);
      default:
        Prefs.instance.feedback(error: true);
        if (mounted) toast(context, r.message.isEmpty ? 'باركود غير معروف' : r.message, error: true);
        return (message: r.message.isEmpty ? 'باركود غير معروف' : r.message, error: true);
    }
  }

  Future<ScanFeedback?> _addExtra(ExtraProposal proposal) async {
    final v = _v;
    if (v == null) return null;
    final choice = await showExtraSheet(context, proposal: proposal, shortLines: v.shortLines);
    if (choice == null || !mounted) return (message: 'لم تُضف', error: true);
    try {
      final nv = await _repo.pickExtra(
        widget.orderId,
        barcode: proposal.barcode,
        charge: choice.charge,
        reason: choice.reason,
        substituteForLineId: choice.substituteForLineId,
        clientScanId: '${DateTime.now().microsecondsSinceEpoch}-x',
      );
      if (!mounted) return null;
      setState(() => _v = nv);
      Prefs.instance.feedback();
      _showFlash(proposal.name, 'yellow', choice.charge == 'FREE' ? '+1 إضافي (هدية)' : '+1 إضافي');
      final msg = '+1 إضافي: ${proposal.name}${choice.charge == 'FREE' ? ' (هدية)' : ''}';
      toast(context, msg);
      return (message: msg, error: false);
    } catch (e) {
      if (mounted) toastError(context, e);
      return (message: Api.toError(e).message, error: true);
    }
  }

  Future<void> _camera() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PickScanScreen(onCode: _scan, hint: 'امسح القطع واحدة تلو الأخرى — الكاميرا تبقى مفتوحة'),
      ),
    );
  }

  Future<void> _typed() async {
    final code = await promptText(
      context,
      title: 'إدخال باركود يدوياً',
      hint: '6281000000000',
      ok: 'مسح',
      keyboard: TextInputType.visiblePassword,
      direction: TextDirection.ltr,
    );
    if (code != null && code.trim().isNotEmpty) await _scan(code);
  }

  // ------------------------------------------------------------ lines & finish

  Future<void> _editLine(PickLine line) async {
    final v = _v;
    if (v == null || !v.picking) return;
    final patch = await showLineSheet(context, line: line, shortLines: v.shortLines);
    if (patch == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final nv = await _repo.pickLine(widget.orderId, line.id, patch);
      if (mounted) setState(() => _v = nv);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _finish() async {
    final v = _v;
    if (v == null) return;
    if (_queue.isNotEmpty) {
      toast(context, 'بانتظار إرسال ${_queue.length} مسحة — تحقق من الاتصال', error: true);
      return;
    }
    if (v.money.allMissing) {
      await showDialog<void>(
        context: context,
        builder: (c) => AlertDialog(
          title: const Text('كل الأصناف ناقصة'),
          content: const Text('لا يُنهى تجهيز طلب لم يُجهَّز منه شيء. ألغِ الطلب من شاشة الطلب وأبلغ الزبونة.', style: TextStyle(height: 1.6)),
          actions: [FilledButton(onPressed: () => Navigator.pop(c), child: const Text('حسناً'))],
        ),
      );
      return;
    }
    final result = await showFinishSheet(context, view: v);
    if (result == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final nv = await _repo.pickFinish(widget.orderId, parcelCount: result.parcelCount, reasons: result.reasons);
      if (!mounted) return;
      setState(() => _v = nv);
      _changed();
      Prefs.instance.feedback();
      toast(context, nv.stage == 'READY_FOR_PICKUP' ? 'تم التجهيز — جاهز للاستلام من المحل ✓' : 'تم التجهيز — ضع قائمة التجهيز مع الكيس للكاشير ✓');
    } catch (e) {
      if (!mounted) return;
      final err = Api.toError(e);
      if (err.code == 'APPROVAL_REQUIRED') {
        await showDialog<void>(
          context: context,
          builder: (c) => AlertDialog(
            title: const Text('يحتاج موافقة المدير'),
            content: Text(
              '${err.message}\n\nاطلب من المدير فتح الطلب في تطبيق المدير وإنهاء التجهيز، أو راجع النواقص والإضافات.',
              style: const TextStyle(height: 1.6),
            ),
            actions: [FilledButton(onPressed: () => Navigator.pop(c), child: const Text('حسناً'))],
          ),
        );
      } else {
        toastError(context, e);
      }
      await _load();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reopen() async {
    final reason = await promptText(context, title: 'سبب إعادة فتح التجهيز', hint: 'مثلاً: الزبونة غيّرت طلبها', ok: 'إعادة الفتح');
    if (reason == null || reason.trim().isEmpty || !mounted) return;
    setState(() => _busy = true);
    try {
      final nv = await _repo.pickReopen(widget.orderId, reason.trim());
      if (!mounted) return;
      setState(() => _v = nv);
      _changed();
      toast(context, 'أُعيد فتح التجهيز');
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ------------------------------------------------------------ UI

  @override
  Widget build(BuildContext context) {
    final v = _v;
    if (v == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()),
      );
    }
    final me = ref.watch(sessionProvider).me;
    final mine = v.pickerId == null || v.pickerId == me?.id;
    return PopScope(
      canPop: _queue.isEmpty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) toast(context, 'بانتظار إرسال ${_queue.length} مسحة — لحظة', error: true);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(v.orderNumber, textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 17)),
              Text(stageLabels[v.stage] ?? v.stage, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
            ],
          ),
          actions: [
            if (v.picking)
              IconButton(tooltip: 'إدخال باركود يدوياً', onPressed: _typed, icon: const Icon(Icons.keyboard_rounded)),
            if (v.finished && !v.invoiced && _isManager)
              IconButton(tooltip: 'إعادة فتح التجهيز', onPressed: _busy ? null : _reopen, icon: const Icon(Icons.lock_open_rounded)),
            IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
          ],
        ),
        bottomNavigationBar: _bottomBar(v, mine),
        body: Column(
          children: [
            // الرأس الثابت أثناء التجهيز (وقبل بدئه): التقدم وآخر مسحة لا يختفيان مع التمرير.
            if (!_done(v)) PickStickyHeader(view: v, flash: _flash),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 30),
                  children: [
                    if (_offline || _queue.isNotEmpty) _offlineBanner(),
                    if (_done(v)) ...[PickFinishedSummary(view: v), const SizedBox(height: 10)],
                    if (v.isGift || (v.notes ?? '').isNotEmpty) ...[PickNotesPanel(view: v), const SizedBox(height: 10)],
                    if (!mine && v.picking) ...[
                      Panel(
                        color: AppColors.warningSoft,
                        child: Text(
                          'يجهّزه ${v.pickerName ?? 'موظف آخر'} الآن',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.warning),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    ..._linesSection(v),
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

  /// انتهى التجهيز (بانتظار الكاشير أو بعده): ملخص في الأعلى بدل رأس التقدم.
  bool _done(PickView v) => !v.startable && !v.picking && v.stage != 'CANCELLED';

  bool _matches(PickLine l) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return l.name.toLowerCase().contains(q) || (l.shadeName ?? '').toLowerCase().contains(q) || (l.barcode ?? '').contains(normalizeCode(q));
  }

  /// الأسطر مع التصفية (الكل/المتبقي/الناقص/الإضافي) والبحث للطلبات الكبيرة.
  List<Widget> _linesSection(PickView v) {
    final ordered = switch (_filter) {
      PickFilter.all => v.ordered,
      PickFilter.remaining => v.remainingLines,
      PickFilter.short => v.redLines,
      PickFilter.extra => const <PickLine>[],
    }.where(_matches).toList();
    final extras = _filter == PickFilter.all || _filter == PickFilter.extra ? v.extras.where(_matches).toList() : const <PickLine>[];
    return [
      PickFilterBar(view: v, value: _filter, onChanged: (f) => setState(() => _filter = f)),
      if (v.lines.length > 8) ...[
        const SizedBox(height: 8),
        TextField(
          controller: _search,
          onChanged: (s) => setState(() => _query = s),
          decoration: InputDecoration(
            hintText: 'ابحث بالاسم أو اللون أو الباركود',
            prefixIcon: const Icon(Icons.search_rounded),
            isDense: true,
            suffixIcon: _query.isEmpty
                ? null
                : IconButton(
                    onPressed: () => setState(() {
                      _search.clear();
                      _query = '';
                    }),
                    icon: const Icon(Icons.close_rounded),
                  ),
          ),
        ),
      ],
      if (_filter != PickFilter.extra)
        SectionTitle('أصناف الطلب', subtitle: v.picking ? 'اضغط على الصنف لتعديله يدوياً أو لتسجيل سبب النقص' : null),
      if (_filter != PickFilter.extra && ordered.isNotEmpty)
        Panel(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < ordered.length; i++) ...[
                if (i > 0) const Divider(height: 1, indent: 76),
                PickLineTile(line: ordered[i], onTap: v.picking ? () => _editLine(ordered[i]) : null),
              ],
            ],
          ),
        ),
      if (_filter != PickFilter.extra && ordered.isEmpty) _emptyFilter(),
      if (extras.isNotEmpty || _filter == PickFilter.extra) ...[
        const SectionTitle('أصناف إضافية'),
        if (extras.isEmpty)
          _emptyFilter()
        else
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < extras.length; i++) ...[
                  if (i > 0) const Divider(height: 1, indent: 76),
                  PickLineTile(
                    line: extras[i],
                    substituteFor: v.ordered.where((l) => l.id == extras[i].substituteForLineId).firstOrNull?.name,
                    onTap: v.picking ? () => _editLine(extras[i]) : null,
                  ),
                ],
              ],
            ),
          ),
      ],
    ];
  }

  Widget _emptyFilter() => const Panel(
    child: Text('لا أصناف هنا', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
  );

  Widget _offlineBanner() => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Panel(
      color: AppColors.warningSoft,
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, color: AppColors.warning),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _queue.isEmpty ? 'عاد الاتصال' : 'لا اتصال — ${_queue.length} مسحة محفوظة وتُرسل تلقائياً',
              style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.warning),
            ),
          ),
        ],
      ),
    ),
  );

  Widget? _bottomBar(PickView v, bool mine) {
    Widget bar(List<Widget> children) => SafeArea(
      child: Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 12), child: Row(children: children)),
    );
    if (v.stage == 'CANCELLED' || v.status == 'CANCELLED') return null;
    if (v.startable && !v.picking) {
      return bar([
        Expanded(
          child: FilledButton.icon(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            onPressed: _busy ? null : _start,
            icon: _busy ? const _Spinner() : const Icon(Icons.qr_code_scanner_rounded),
            label: const Text('بدء التجهيز بالمسح', style: TextStyle(fontSize: 16)),
          ),
        ),
      ]);
    }
    if (v.picking && !mine) {
      return bar([
        Expanded(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            onPressed: _busy || !_isManager ? null : () => _start(takeover: true),
            icon: const Icon(Icons.swap_horiz_rounded),
            label: Text(_isManager ? 'نقل التجهيز إليّ' : 'يجهّزه ${v.pickerName ?? 'موظف آخر'}'),
          ),
        ),
      ]);
    }
    if (v.picking) {
      return bar([
        Expanded(
          flex: 5,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            onPressed: _camera,
            icon: const Icon(Icons.photo_camera_rounded),
            label: const Text('مسح بالكاميرا'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 6,
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
              backgroundColor: v.shortLines.isEmpty ? AppColors.success : AppColors.primary,
            ),
            onPressed: _busy ? null : _finish,
            icon: _busy ? const _Spinner() : const Icon(Icons.task_alt_rounded),
            label: const Text('إنهاء التجهيز', style: TextStyle(fontSize: 16)),
          ),
        ),
      ]);
    }
    return null;
  }
}

class _Spinner extends StatelessWidget {
  const _Spinner();
  @override
  Widget build(BuildContext context) =>
      const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white));
}
