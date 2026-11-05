import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../widgets/common.dart';

/// مسح قطعة بالكاميرا أثناء التجهيز — يرجع أول باركود يُقرأ للشاشة التي فتحته.
/// يدعم القارئ الخارجي (بلوتوث/USB) والإدخال اليدوي أيضاً.
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});
  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> with WidgetsBindingObserver {
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
    _handle(e.code);
    return true;
  }

  void _onDetect(BarcodeCapture cap) {
    for (final b in cap.barcodes) {
      final v = b.rawValue ?? b.displayValue;
      if (v != null && v.trim().isNotEmpty) {
        _handle(v);
        return;
      }
    }
  }

  void _handle(String raw) {
    final code = normalizeCode(raw);
    if (code.length < 3) return;
    final now = DateTime.now();
    if (code == _lastCode && now.difference(_lastAt) < const Duration(seconds: 3)) return;
    _lastCode = code;
    _lastAt = now;
    if (_handling) return;
    _handling = true;
    Prefs.instance.feedback();
    Navigator.of(context).pop(code);
  }

  Future<void> _manual() async {
    final v = await promptText(
      context,
      title: 'إدخال الباركود يدوياً',
      hint: '6281000000000',
      ok: 'تأكيد',
      keyboard: TextInputType.visiblePassword,
      direction: TextDirection.ltr,
    );
    if (v != null && v.trim().isNotEmpty) _handle(v);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final window = Rect.fromCenter(
      center: Offset(size.width / 2, size.height * .42),
      width: size.width * .88,
      height: size.width * .7,
    );
    return Scaffold(
      backgroundColor: Colors.black,
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
            // التكبير + تلميح
            Positioned(
              top: window.bottom + 14,
              left: 0,
              right: 0,
              child: Column(
                children: [
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
                  if (_camError == null)
                    const Text(
                      'وجّه الكاميرا نحو باركود القطعة',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                ],
              ),
            ),
          ],
        ),
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
