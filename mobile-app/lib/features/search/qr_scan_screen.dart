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
import '../../core/widgets/camera_corner_frame.dart';
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
    context.push('/search?q=${Uri.encodeComponent(lookupCode)}');
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
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppColors.ink.withValues(alpha: 0.45),
                  Colors.transparent,
                  Colors.transparent,
                  AppColors.ink.withValues(alpha: 0.55),
                ],
                stops: const [0.0, 0.22, 0.72, 1.0],
              ),
            ),
          ),
          IgnorePointer(
            child: Center(
              child: SizedBox(
                width: 300,
                height: 120,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.55), width: 1.5),
                      ),
                    ),
                    const CameraCornerFrame(inset: 0, arm: 18, opacity: 0.95),
                  ],
                ),
              ),
            ),
          ),
          if (_busy)
            ColoredBox(
              color: AppColors.ink.withValues(alpha: 0.45),
              child: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
            ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 32,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primarySoft),
                boxShadow: AppColors.cardShadow,
              ),
              child: Text(
                s.scanHint,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
