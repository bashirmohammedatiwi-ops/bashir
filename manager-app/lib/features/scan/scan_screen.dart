import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/shade_activation.dart';
import '../drafts/group_picker.dart';
import '../drafts/save_draft_screen.dart';
import '../product/product_screen.dart';
import 'lookup_flow.dart';

/// نتيجة في وضع المسح المتتالي.
class _Hit {
  _Hit(this.code);
  final String code;
  LookupResult? result;
  Object? error;
  Draft? saved;
  bool saving = false;
  final at = DateTime.now();
}

/// مسح بالكاميرا. الوضع العادي يفتح النتيجة مباشرة؛
/// «المسح المتتالي» يجمع النتائج في قائمة دون مغادرة الكاميرا (مناسب للمرور على الرفوف).
class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key, this.targetGroupId, this.continuous, this.pickOnly = false});

  /// يرجع أول باركود يُقرأ للشاشة التي فتحته (تجهيز طلب، باركود تدرج جديد...).
  final bool pickOnly;

  /// عند الفتح من مجموعة: الباركودات الناقصة تُحفظ فيها مباشرة.
  final String? targetGroupId;
  final bool? continuous;

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> with WidgetsBindingObserver {
  final _ctrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    formats: const [
      BarcodeFormat.ean13,
      BarcodeFormat.ean8,
      BarcodeFormat.upcA,
      BarcodeFormat.upcE,
      BarcodeFormat.code128,
      BarcodeFormat.code39,
      BarcodeFormat.code93,
      BarcodeFormat.itf2of5,
      BarcodeFormat.codabar,
      BarcodeFormat.qrCode,
      BarcodeFormat.dataMatrix,
    ],
  );
  late bool _continuous = !widget.pickOnly && (widget.continuous ?? (widget.targetGroupId != null || Prefs.instance.continuous));
  late String? _groupId = widget.targetGroupId ?? Prefs.instance.lastGroupId;
  final _hits = <_Hit>[];
  String? _lastCode;
  DateTime _lastAt = DateTime.fromMillisecondsSinceEpoch(0);
  bool _handling = false;
  double _zoom = 0;
  MobileScannerException? _camError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ScannerBus.instance.push(_onHardware);
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onHardware);
    WidgetsBinding.instance.removeObserver(this);
    _ctrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _ctrl.start();
    } else if (state == AppLifecycleState.paused) {
      _ctrl.stop();
    }
  }

  bool _onHardware(ScanEvent e) {
    _handle(e.code, ScanSource.hardware);
    return true;
  }

  void _onDetect(BarcodeCapture cap) {
    for (final b in cap.barcodes) {
      final v = b.rawValue ?? b.displayValue;
      if (v != null && v.trim().isNotEmpty) {
        _handle(v, ScanSource.camera);
        return;
      }
    }
  }

  Future<void> _handle(String raw, ScanSource source) async {
    final code = normalizeCode(raw);
    if (code.length < 3) return;
    final now = DateTime.now();
    // نفس الباركود أمام الكاميرا يُقرأ عشرات المرات — نتجاهل التكرار القريب
    if (code == _lastCode && now.difference(_lastAt) < const Duration(seconds: 3)) return;
    _lastCode = code;
    _lastAt = now;

    if (widget.pickOnly) {
      if (_handling) return;
      _handling = true;
      Prefs.instance.feedback();
      Navigator.of(context).pop(code);
      return;
    }

    if (!_continuous) {
      if (_handling) {
        // القارئ الخارجي والنتيجة مفتوحة: نفتح الجديدة مكانها بدل تجاهل المسح.
        if (source == ScanSource.hardware && mounted) openCode(context, ref, code, source: source);
        return;
      }
      _handling = true;
      await _ctrl.stop();
      if (!mounted) return;
      await openCode(context, ref, code, source: source, waitForClose: true);
      _handling = false;
      if (mounted) {
        _lastAt = DateTime.now();
        await _ctrl.start();
      }
      return;
    }

    if (_hits.any((h) => h.code == code)) {
      Prefs.instance.feedback();
      final h = _hits.firstWhere((h) => h.code == code);
      setState(() {
        _hits.remove(h);
        _hits.insert(0, h);
      });
      return;
    }
    final hit = _Hit(code);
    setState(() => _hits.insert(0, hit));
    try {
      final r = await ref.read(repoProvider).lookup(code);
      hit.result = r;
      Prefs.instance.feedback(error: !r.found);
      Prefs.instance.addRecent(
        RecentScan(
          code: code,
          at: DateTime.now(),
          name: r.product?.name ?? r.pos?.name,
          productId: r.product?.id,
          found: r.found,
          thumb: r.product?.cover,
        ),
      );
      // مجموعة محددة من شاشة المجموعة → حفظ تلقائي للناقص
      if (!r.found && widget.targetGroupId != null && r.drafts.every((d) => d.groupId != widget.targetGroupId)) {
        await _quickSave(hit);
      }
    } catch (e) {
      hit.error = e;
      Prefs.instance.feedback(error: true);
    }
    if (mounted) setState(() {});
  }

  Future<void> _quickSave(_Hit h) async {
    setState(() => h.saving = true);
    try {
      _groupId = await ref.read(repoProvider).ensureGroup(_groupId);
      final d = await ref.read(repoProvider).saveDraft(groupId: _groupId!, barcode: h.code, name: h.result?.pos?.name);
      h.saved = d;
      Prefs.instance.lastGroupId = _groupId;
      ref.invalidate(groupsProvider);
      ref.invalidate(statsProvider);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => h.saving = false);
    }
  }

  Future<void> _manual() async {
    final v = await promptText(
      context,
      title: 'إدخال الباركود يدوياً',
      hint: '6281000000000',
      ok: 'بحث',
      keyboard: TextInputType.visiblePassword,
      direction: TextDirection.ltr,
    );
    if (v != null && v.trim().isNotEmpty) {
      _lastCode = null;
      _handle(v, ScanSource.typed);
    }
  }

  Future<void> _openHit(_Hit h) async {
    final r = h.result;
    if (r == null) return;
    await _ctrl.stop();
    if (!mounted) return;
    if (r.found && r.product != null) {
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ProductScreen(productId: r.product!.id, initial: r.product, highlightShadeId: r.matchedShadeId),
        ),
      );
    } else if (h.saved != null) {
      final d = await Navigator.of(context).push<Draft>(
        MaterialPageRoute(
          builder: (_) => SaveDraftScreen(barcode: h.code, draft: h.saved),
        ),
      );
      if (d != null && mounted) setState(() => h.saved = d);
    } else {
      final d = await Navigator.of(context).push<Draft>(
        MaterialPageRoute(
          builder: (_) => SaveDraftScreen(barcode: h.code, posName: r.pos?.name, groupId: _groupId),
        ),
      );
      if (d != null && mounted) setState(() => h.saved = d);
    }
    if (mounted) await _ctrl.start();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    // إطار واسع والمعاينة ظاهرة كاملة حوله (تعتيم خفيف فقط) — الكاميرا تملأ الشاشة.
    final window = Rect.fromCenter(
      center: Offset(size.width / 2, _continuous ? size.height * .3 : size.height * .42),
      width: size.width * .88,
      height: _continuous ? size.height * .26 : size.width * .7,
    );
    return Scaffold(
      backgroundColor: Colors.black,
      // SizedBox.expand: جسم Scaffold يأخذ قيود ارتفاع مرنة؛ بدونها يتقلص الـ Stack لارتفاع الشريط العلوي
      // فتظهر الكاميرا في شريط صغير أعلى الشاشة والباقي أسود (وضع المسح الواحد).
      body: SizedBox.expand(
        child: Stack(
          children: [
            Positioned.fill(
              child: MobileScanner(
                controller: _ctrl,
                onDetect: _onDetect,
                scanWindow: window,
                errorBuilder: (_, e) {
                  if (_camError == null) {
                    WidgetsBinding.instance.addPostFrameCallback((_) => mounted ? setState(() => _camError = e) : null);
                  }
                  return const ColoredBox(color: Color(0xFF15131A));
                },
              ),
            ),
            if (_camError == null)
              Positioned.fill(
                child: IgnorePointer(child: CustomPaint(painter: _WindowPainter(window))),
              )
            else
              Positioned.fromRect(
                rect: window.inflate(10),
                child: _CameraError(error: _camError!, onManual: _manual),
              ),
            // الشريط العلوي
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      _RoundBtn(icon: Icons.close_rounded, onTap: () => Navigator.maybePop(context)),
                      const Spacer(),
                      ValueListenableBuilder(
                        valueListenable: _ctrl,
                        builder: (_, state, _) => _RoundBtn(
                          icon: state.torchState == TorchState.on ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                          active: state.torchState == TorchState.on,
                          onTap: () => _ctrl.toggleTorch(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _RoundBtn(icon: Icons.cameraswitch_rounded, onTap: () => _ctrl.switchCamera()),
                      const SizedBox(width: 8),
                      _RoundBtn(icon: Icons.keyboard_rounded, onTap: _manual),
                    ],
                  ),
                ),
              ),
            ),
            // تبديل الوضع + التكبير
            Positioned(
              top: window.bottom + 14,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  if (!widget.pickOnly)
                    Container(
                      decoration: BoxDecoration(color: const Color(0x99000000), borderRadius: BorderRadius.circular(24)),
                      padding: const EdgeInsets.all(4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _ModeBtn(
                            label: 'مسح واحد',
                            selected: !_continuous,
                            onTap: () => setState(() => Prefs.instance.continuous = _continuous = false),
                          ),
                          _ModeBtn(
                            label: 'مسح متتالي',
                            selected: _continuous,
                            onTap: () => setState(() => Prefs.instance.continuous = _continuous = true),
                          ),
                        ],
                      ),
                    ),
                  if (_camError == null)
                    SizedBox(
                      width: size.width * .7,
                      child: Row(
                        children: [
                          const Icon(Icons.zoom_out_rounded, color: Colors.white70, size: 20),
                          Expanded(
                            child: Slider(
                              value: _zoom,
                              onChanged: (v) {
                                setState(() => _zoom = v);
                                _ctrl.setZoomScale(v);
                              },
                              activeColor: Colors.white,
                              inactiveColor: Colors.white30,
                            ),
                          ),
                          const Icon(Icons.zoom_in_rounded, color: Colors.white70, size: 20),
                        ],
                      ),
                    ),
                  if (!_continuous && _camError == null)
                    const Text(
                      'وجّه الكاميرا نحو الباركود',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                ],
              ),
            ),
            if (_continuous) _results(),
          ],
        ),
      ),
    );
  }

  Widget _results() {
    return DraggableScrollableSheet(
      initialChildSize: .34,
      minChildSize: .2,
      maxChildSize: .85,
      builder: (_, scroll) => Container(
        decoration: const BoxDecoration(
          color: AppColors.scaffold,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 30),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text('الممسوحة (${_hits.length})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const Spacer(),
                Text(
                  '${_hits.where((h) => h.result?.found == false).length} ناقص',
                  style: const TextStyle(color: AppColors.warning, fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text('الناقص يُحفظ في:', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
            const SizedBox(height: 6),
            GroupPicker(selected: _groupId, onChanged: (id) => setState(() => _groupId = id)),
            const SizedBox(height: 12),
            if (_hits.isEmpty)
              const Padding(
                padding: EdgeInsets.all(20),
                child: Text(
                  'امسح المنتجات واحداً تلو الآخر — تظهر النتائج هنا دون مغادرة الكاميرا.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted, height: 1.7),
                ),
              ),
            for (final h in _hits) Padding(padding: const EdgeInsets.only(bottom: 8), child: _hitCard(h)),
          ],
        ),
      ),
    );
  }

  Widget _hitCard(_Hit h) {
    final r = h.result;
    if (r == null && h.error == null) {
      return Panel(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4)),
            const SizedBox(width: 12),
            Text(
              h.code,
              textDirection: TextDirection.ltr,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      );
    }
    if (h.error != null) {
      return Panel(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: AppColors.danger),
            const SizedBox(width: 10),
            Expanded(
              child: Text('${h.code}: ${h.error}', style: const TextStyle(color: AppColors.danger)),
            ),
          ],
        ),
      );
    }
    if (r!.found && r.product != null) {
      final p = r.product!;
      final shade = r.matchedShadeId == null ? null : p.shades.where((s) => s.id == r.matchedShadeId).firstOrNull;
      final active = shade?.isActive ?? p.isActive;
      return Panel(
        padding: const EdgeInsets.all(10),
        onTap: () => _openHit(h),
        child: Row(
          children: [
            shade != null
                ? Swatch(hex: shade.colorHex, hexEnd: shade.colorHexEnd, size: 52, imageUrl: shade.image?.thumb, off: !shade.isActive)
                : NetImg(p.cover, size: 52, fit: BoxFit.contain),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (shade != null)
                    Text(
                      'التدرج: ${shade.name}',
                      style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w700, fontSize: 12.5),
                    ),
                  Text(
                    '${money(p.price)} · مخزون ${shade?.stock ?? p.stock}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                  ),
                ],
              ),
            ),
            AsyncSwitch(
              value: active,
              confirmOff: () => confirm(
                context,
                title: shade != null ? 'إيقاف التدرج ${shade.name}؟' : 'إيقاف المنتج؟',
                message: 'لن يظهر للزبائن حتى تعيد تشغيله.',
                ok: 'إيقاف',
                danger: true,
              ),
              onChanged: (v) async {
                final repo = ref.read(repoProvider);
                try {
                  // منتج له تدرجات ولم نقرأ تدرجاً بعينه: نسأل أي التدرجات تظهر.
                  List<String>? ids;
                  if (v && shade == null && p.shades.isNotEmpty) {
                    ids = await pickShadesToShow(context, p);
                    if (ids == null) return false;
                  }
                  final next = shade != null
                      ? await repo.patchShade(shade.id, {'isActive': v})
                      : await repo.patchProduct(p.id, {'isActive': v, 'shadeIds': ?ids});
                  if (!mounted) return true;
                  setState(() => h.result = r.withProduct(next));
                  ref.read(dataVersionProvider.notifier).state++;
                  toast(context, v ? 'تم التشغيل' : 'تم الإيقاف');
                  return true;
                } catch (e) {
                  if (mounted) toastError(context, e);
                  return false;
                }
              },
            ),
          ],
        ),
      );
    }
    // غير موجود
    final saved = h.saved != null || r.drafts.any((d) => d.groupId == _groupId);
    return Panel(
      padding: const EdgeInsets.all(10),
      color: saved ? AppColors.successSoft : AppColors.warningSoft,
      onTap: () => _openHit(h),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
            child: Icon(
              saved ? Icons.bookmark_added_rounded : Icons.search_off_rounded,
              color: saved ? AppColors.success : AppColors.warning,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  h.code,
                  textDirection: TextDirection.ltr,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                Text(
                  saved ? 'محفوظ — اضغط لإضافة صور' : (r.pos?.name ?? 'غير موجود في التطبيق'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: saved ? AppColors.success : AppColors.muted, fontSize: 12.5, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          if (!saved)
            FilledButton(
              onPressed: h.saving ? null : () => _quickSave(h),
              style: FilledButton.styleFrom(minimumSize: const Size(0, 40), padding: const EdgeInsets.symmetric(horizontal: 14)),
              child: h.saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('حفظ'),
            ),
        ],
      ),
    );
  }
}

class _RoundBtn extends StatelessWidget {
  const _RoundBtn({required this.icon, required this.onTap, this.active = false});
  final IconData icon;
  final VoidCallback onTap;
  final bool active;
  @override
  Widget build(BuildContext context) => Material(
    color: active ? Colors.white : const Color(0x88000000),
    shape: const CircleBorder(),
    child: InkWell(
      customBorder: const CircleBorder(),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(11),
        child: Icon(icon, color: active ? AppColors.ink : Colors.white, size: 24),
      ),
    ),
  );
}

class _ModeBtn extends StatelessWidget {
  const _ModeBtn({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(color: selected ? Colors.white : Colors.transparent, borderRadius: BorderRadius.circular(20)),
      child: Text(
        label,
        style: TextStyle(color: selected ? AppColors.ink : Colors.white, fontWeight: FontWeight.w700),
      ),
    ),
  );
}

class _CameraError extends StatelessWidget {
  const _CameraError({required this.error, required this.onManual});
  final MobileScannerException error;
  final VoidCallback onManual;
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: const Color(0xFF221F2A), borderRadius: BorderRadius.circular(22)),
    padding: const EdgeInsets.all(16),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.no_photography_outlined, color: Colors.white54, size: 34),
        const SizedBox(height: 6),
        Text(
          error.errorCode == MobileScannerErrorCode.permissionDenied
              ? 'لا يوجد إذن للكاميرا — فعّله من إعدادات الهاتف'
              : 'تعذر تشغيل الكاميرا',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w700),
        ),
        const Text(
          'اكتب الباركود أو استخدم قارئاً خارجياً',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white60, fontSize: 12.5),
        ),
        const SizedBox(height: 8),
        FilledButton.icon(
          onPressed: onManual,
          style: FilledButton.styleFrom(minimumSize: const Size(0, 38)),
          icon: const Icon(Icons.keyboard_rounded, size: 18),
          label: const Text('إدخال يدوي'),
        ),
      ],
    ),
  );
}

class _WindowPainter extends CustomPainter {
  _WindowPainter(this.window);
  final Rect window;
  @override
  void paint(Canvas canvas, Size size) {
    final rr = RRect.fromRectAndRadius(window, const Radius.circular(20));
    canvas.drawPath(
      Path()
        ..fillType = PathFillType.evenOdd
        ..addRect(Offset.zero & size)
        ..addRRect(rr),
      Paint()..color = const Color(0x40000000),
    );
    final corner = Paint()
      ..color = Colors.white
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    const k = 34.0;
    final r = window;
    canvas.drawPath(
      Path()
        ..moveTo(r.left, r.top + k)
        ..lineTo(r.left, r.top + 12)
        ..quadraticBezierTo(r.left, r.top, r.left + 12, r.top)
        ..lineTo(r.left + k, r.top),
      corner,
    );
    canvas.drawPath(
      Path()
        ..moveTo(r.right - k, r.top)
        ..lineTo(r.right - 12, r.top)
        ..quadraticBezierTo(r.right, r.top, r.right, r.top + 12)
        ..lineTo(r.right, r.top + k),
      corner,
    );
    canvas.drawPath(
      Path()
        ..moveTo(r.left, r.bottom - k)
        ..lineTo(r.left, r.bottom - 12)
        ..quadraticBezierTo(r.left, r.bottom, r.left + 12, r.bottom)
        ..lineTo(r.left + k, r.bottom),
      corner,
    );
    canvas.drawPath(
      Path()
        ..moveTo(r.right - k, r.bottom)
        ..lineTo(r.right - 12, r.bottom)
        ..quadraticBezierTo(r.right, r.bottom, r.right, r.bottom - 12)
        ..lineTo(r.right, r.bottom - k),
      corner,
    );
    // خط المسح
    canvas.drawLine(
      Offset(r.left + 18, r.center.dy),
      Offset(r.right - 18, r.center.dy),
      Paint()
        ..color = const Color(0xCCE57A9A)
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(_WindowPainter old) => old.window != window;
}
