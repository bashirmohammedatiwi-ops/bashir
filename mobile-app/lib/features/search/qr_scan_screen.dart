import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/theme/app_colors.dart';

/// مسح QR / باركود — يفتح المنتج أو البحث حسب المحتوى.
class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );
  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_handled) return;
    if (capture.barcodes.isEmpty) return;
    final raw = capture.barcodes.first.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    _handled = true;
    _navigateForCode(context, raw);
  }

  void _navigateForCode(BuildContext context, String raw) {
    final uri = Uri.tryParse(raw);
    if (uri != null && uri.pathSegments.contains('product')) {
      final idx = uri.pathSegments.indexOf('product');
      if (idx >= 0 && idx + 1 < uri.pathSegments.length) {
        final slug = uri.pathSegments[idx + 1];
        context.pop();
        context.push('/product/$slug');
        return;
      }
    }
    if (RegExp(r'^[0-9a-f-]{36}$', caseSensitive: false).hasMatch(raw)) {
      context.pop();
      context.push('/product/$raw');
      return;
    }
    context.pop();
    context.push('/products?search=${Uri.encodeComponent(raw)}&title=نتائج المسح');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('مسح QR'),
        actions: [
          IconButton(
            tooltip: 'تبديل الكاميرا',
            onPressed: () => _controller.switchCamera(),
            icon: const Icon(Icons.cameraswitch_rounded),
          ),
          IconButton(
            tooltip: 'الفلاش',
            onPressed: () => _controller.toggleTorch(),
            icon: ValueListenableBuilder(
              valueListenable: _controller,
              builder: (_, state, __) {
                return Icon(state.torchState == TorchState.on
                    ? Icons.flash_on_rounded
                    : Icons.flash_off_rounded);
              },
            ),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          IgnorePointer(
            child: Center(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primary, width: 3),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
          const Positioned(
            left: 0,
            right: 0,
            bottom: 32,
            child: Text(
              'وجّه الكاميرا نحو رمز QR أو الباركود',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                shadows: [Shadow(color: Colors.black54, blurRadius: 8)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
