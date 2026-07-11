import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/utils/helpers.dart';
import '../../providers/auth_provider.dart';

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

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> with WidgetsBindingObserver {
  final _manualController = TextEditingController();
  final _scannerKey = GlobalKey<_LiveScannerState>();
  bool _handled = false;
  bool _showManual = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _manualController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final scanner = _scannerKey.currentState;
    if (scanner == null) return;
    if (state == AppLifecycleState.resumed) {
      scanner.resume();
    } else if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      scanner.pause();
    }
  }

  Future<void> _openResults(String raw) async {
    final digits = normalizeBarcode(raw);
    if (digits.isEmpty) return;
    await _scannerKey.currentState?.pause();
    if (!mounted) return;
    await context.push('/results?barcode=${Uri.encodeComponent(digits)}');
    if (!mounted) return;
    await _scannerKey.currentState?.resume();
    setState(() => _handled = false);
  }

  void _onDetect(BarcodeCapture capture) {
    if (_handled || capture.barcodes.isEmpty) return;
    final barcode = capture.barcodes.firstWhere(
      (b) => b.format != BarcodeFormat.qrCode && (b.rawValue?.trim().isNotEmpty ?? false),
      orElse: () => capture.barcodes.first,
    );
    if (barcode.format == BarcodeFormat.qrCode) return;
    final raw = barcode.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    _handled = true;
    _openResults(raw);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('مسح الباركود'),
        actions: [
          IconButton(
            tooltip: 'إدخال يدوي',
            icon: Icon(_showManual ? Icons.camera_alt : Icons.keyboard),
            onPressed: () => setState(() => _showManual = !_showManual),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') ref.read(authProvider.notifier).logout();
            },
            itemBuilder: (_) => [
              PopupMenuItem(enabled: false, child: Text(user?.name ?? user?.email ?? '')),
              const PopupMenuItem(value: 'logout', child: Text('تسجيل الخروج')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showManual)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _manualController,
                      keyboardType: TextInputType.number,
                      textDirection: TextDirection.ltr,
                      decoration: const InputDecoration(hintText: 'أدخل رقم الباركود'),
                      onSubmitted: _openResults,
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: () => _openResults(_manualController.text),
                    child: const Text('بحث'),
                  ),
                ],
              ),
            ),
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                _LiveScanner(key: _scannerKey, onDetect: _onDetect),
                Center(
                  child: Container(
                    width: 260,
                    height: 140,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white70, width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 24,
                  left: 24,
                  right: 24,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'وجّه الكاميرا نحو باركود المنتج للبحث في كتالوج المتاجر واستيراده',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveScanner extends StatefulWidget {
  const _LiveScanner({super.key, required this.onDetect});

  final void Function(BarcodeCapture) onDetect;

  @override
  State<_LiveScanner> createState() => _LiveScannerState();
}

class _LiveScannerState extends State<_LiveScanner> {
  late final MobileScannerController _controller;
  bool _starting = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      autoStart: false,
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      formats: _barcodeFormats,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => resume());
  }

  Future<void> pause() async {
    if (!_controller.value.isRunning) return;
    try {
      await _controller.stop();
    } catch (_) {}
  }

  Future<void> resume() async {
    if (!mounted || _starting || _controller.value.isRunning) return;
    _starting = true;
    try {
      await _controller.start();
    } catch (_) {
      try {
        await _controller.stop();
        await Future<void>.delayed(const Duration(milliseconds: 200));
        if (mounted) await _controller.start();
      } catch (_) {}
    } finally {
      _starting = false;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MobileScanner(
      controller: _controller,
      onDetect: widget.onDetect,
      errorBuilder: (context, error) {
        return ColoredBox(
          color: Colors.black,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, color: Colors.white, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    error.errorDetails?.message ?? error.errorCode.message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: resume,
                    child: const Text('إعادة تشغيل الكاميرا'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
