import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/navigation/deep_link_redirect.dart';
import '../../core/l10n/app_strings.dart';
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
          IgnorePointer(
            child: Center(
              child: Container(
                width: 300,
                height: 120,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primary, width: 3),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          if (_busy)
            const ColoredBox(
              color: Color(0x66000000),
              child: Center(child: CircularProgressIndicator(color: Colors.white)),
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
                shadows: [Shadow(color: Colors.black54, blurRadius: 8)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
