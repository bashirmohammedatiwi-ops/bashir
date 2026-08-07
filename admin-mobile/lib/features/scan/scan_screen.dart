import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/utils/helpers.dart';
import '../../core/utils/daily_progress_store.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/barcode_live_scanner.dart';
import '../home/daily_progress_screen.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> with WidgetsBindingObserver {
  final _manualController = TextEditingController();
  final _scannerKey = GlobalKey<BarcodeLiveScannerState>();
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
      ref.read(dailyProgressProvider.notifier).refresh();
    } else if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      scanner.pause();
    }
  }

  Future<void> _openResults(String raw) async {
    final digits = normalizeBarcode(raw);
    if (digits.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('باركود غير صالح')),
        );
      }
      return;
    }
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
          const DailyProgressChip(),
          IconButton(
            tooltip: 'بحث نصي',
            icon: const Icon(Icons.text_fields),
            onPressed: () => context.push('/search'),
          ),
          IconButton(
            tooltip: 'إدخال يدوي',
            icon: Icon(_showManual ? Icons.camera_alt : Icons.keyboard),
            onPressed: () => setState(() => _showManual = !_showManual),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') ref.read(authProvider.notifier).logout();
              if (v == 'progress') context.push('/daily-progress');
            },
            itemBuilder: (_) => [
              PopupMenuItem(enabled: false, child: Text(user?.name ?? user?.email ?? '')),
              const PopupMenuItem(value: 'progress', child: Text('التقدم اليومي')),
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
                if (_showManual)
                  const ColoredBox(
                    color: Colors.black87,
                    child: Center(
                      child: Text(
                        'أدخل الباركود يدوياً أعلاه',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  )
                else ...[
                  BarcodeLiveScanner(key: _scannerKey, onDetect: _onDetect),
                  IgnorePointer(
                    child: Center(
                      child: Container(
                        width: 260,
                        height: 140,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white70, width: 2),
                          borderRadius: BorderRadius.circular(12),
                        ),
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
              ],
            ),
          ),
        ],
      ),
    );
  }
}
