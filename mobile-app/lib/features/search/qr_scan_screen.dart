import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/navigation/deep_link_redirect.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/barcode_util.dart';
import '../../data/services/api_service.dart';

/// تنسيقات الباركود الخطي للمنتجات (بدون QR).
const _barcodeFormats = <BarcodeFormat>[
  BarcodeFormat.ean13,
  BarcodeFormat.ean8,
  BarcodeFormat.upcA,
  BarcodeFormat.upcE,
  BarcodeFormat.code128,
  BarcodeFormat.code39,
  BarcodeFormat.code93,
  BarcodeFormat.itf14,
  BarcodeFormat.codabar,
];

/// مسح باركود المنتج بالكاميرا.
class QrScanScreen extends ConsumerStatefulWidget {
  const QrScanScreen({super.key});

  @override
  ConsumerState<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends ConsumerState<QrScanScreen> with WidgetsBindingObserver {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    formats: _barcodeFormats,
  );
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _busy = false;
      unawaited(_controller.start());
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (_busy) return;
    if (capture.barcodes.isEmpty) return;

    final barcode = capture.barcodes.firstWhere(
      (b) => b.format != BarcodeFormat.qrCode && (b.rawValue?.trim().isNotEmpty ?? false),
      orElse: () => capture.barcodes.first,
    );

    if (barcode.format == BarcodeFormat.qrCode) return;

    final raw = barcode.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;

    _busy = true;
    unawaited(_navigateForCode(raw));
  }

  Future<void> _navigateForCode(String raw) async {
    final route = resolveScannedLink(raw);
    if (route != null) {
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      context.pop();
      context.push(route);
      return;
    }

    final normalized = normalizeBarcode(raw);
    final lookupCode = normalized.isNotEmpty ? normalized : raw;

    try {
      final hit = await ref.read(apiServiceProvider).lookupProductByBarcode(lookupCode);
      if (!mounted) return;
      if (hit != null) {
        HapticFeedback.mediumImpact();
        context.pop();
        context.push('/product/${hit.productSlug}');
        return;
      }
    } catch (_) {
      if (!mounted) return;
    }

    if (!mounted) return;
    context.pop();
    context.push(
      '/products?search=${Uri.encodeComponent(lookupCode)}&title=${Uri.encodeComponent(ref.read(stringsProvider).scanResults)}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return Scaffold(
      appBar: AppBar(
        title: Text(s.scanBarcode),
        actions: [
          IconButton(
            tooltip: s.flash,
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
          // مؤشر المسح: أقواس زوايا + خط مسح متحرك.
          const IgnorePointer(child: Center(child: _ScanReticle())),
          // تعتيم سفلي متدرج لقراءة النص.
          const Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black54],
                    stops: [0.0, 1.0],
                  ),
                ),
                child: SizedBox(height: 110),
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 32,
            child: Text(
              s.scanHint,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          AnimatedOpacity(
            opacity: _busy ? 1 : 0,
            duration: AppMotion.base,
            child: IgnorePointer(
              child: ColoredBox(
                color: const Color(0x66000000),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: Colors.white),
                      const SizedBox(height: 14),
                      Text(
                        s.lookingUpProduct,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


/// إطار المسح: أقواس زوايا تركواز + خط مسح يتحرك عمودياً.
class _ScanReticle extends StatefulWidget {
  const _ScanReticle();

  @override
  State<_ScanReticle> createState() => _ScanReticleState();
}

class _ScanReticleState extends State<_ScanReticle>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const size = Size(300, 150);
    return SizedBox.fromSize(
      size: size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) => CustomPaint(
          size: size,
          painter: _ReticlePainter(scanProgress: _controller.value),
        ),
      ),
    );
  }
}

class _ReticlePainter extends CustomPainter {
  final double scanProgress;
  _ReticlePainter({required this.scanProgress});

  @override
  void paint(Canvas canvas, Size size) {
    const corner = 26.0;
    const stroke = 3.5;
    final paint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = stroke
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    // أقواس الزوايا الأربع.
    final path = Path()
      ..moveTo(0, corner)
      ..lineTo(0, stroke)
      ..lineTo(corner, stroke)
      ..moveTo(size.width - corner, stroke)
      ..lineTo(size.width - stroke, stroke)
      ..lineTo(size.width - stroke, corner)
      ..moveTo(size.width - stroke, size.height - corner)
      ..lineTo(size.width - stroke, size.height - stroke)
      ..lineTo(size.width - corner, size.height - stroke)
      ..moveTo(corner, size.height - stroke)
      ..lineTo(stroke, size.height - stroke)
      ..lineTo(stroke, size.height - corner);
    canvas.drawPath(path, paint);

    // خط المسح المتحرك بتوهج.
    final y = 8 + (size.height - 16) * Curves.easeInOut.transform(scanProgress);
    final linePaint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.9)
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    canvas.drawLine(Offset(18, y), Offset(size.width - 18, y), linePaint);
    linePaint.maskFilter = const MaskFilter.blur(BlurStyle.normal, 0);
    canvas.drawLine(Offset(18, y), Offset(size.width - 18, y), linePaint);
  }

  @override
  bool shouldRepaint(covariant _ReticlePainter oldDelegate) =>
      oldDelegate.scanProgress != scanProgress;
}
