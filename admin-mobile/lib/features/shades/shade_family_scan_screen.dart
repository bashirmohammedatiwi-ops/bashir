import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_model_prefs.dart';
import '../../core/utils/helpers.dart';
import '../../features/home/daily_progress_screen.dart';
import '../../repositories/ai_product_repository.dart';
import '../../widgets/barcode_live_scanner.dart';
import '../../widgets/composer_naming_banner.dart';

/// Dedicated multi-scan entry for makeup shade families.
class ShadeFamilyScanScreen extends ConsumerStatefulWidget {
  const ShadeFamilyScanScreen({super.key});

  @override
  ConsumerState<ShadeFamilyScanScreen> createState() => _ShadeFamilyScanScreenState();
}

class _ScannedShade {
  _ScannedShade({required this.barcode, this.existsName});
  final String barcode;
  String? existsName;
}

class _ShadeFamilyScanScreenState extends ConsumerState<ShadeFamilyScanScreen>
    with WidgetsBindingObserver {
  final _scannerKey = GlobalKey<BarcodeLiveScannerState>();
  final _manualController = TextEditingController();
  final _hintController = TextEditingController();
  final _scanned = <_ScannedShade>[];
  final _seen = <String>{};
  final _lastSeenAt = <String, DateTime>{};

  bool _showManual = false;
  bool _cameraActive = true;
  String? _flash;
  AiModelOption _model = AiModelOption.composerLow;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadModel();
  }

  Future<void> _loadModel() async {
    final id = await AiModelPrefs.getSelectedId();
    if (mounted) setState(() => _model = AiModelOption.byId(id));
  }

  @override
  void deactivate() {
    _scannerKey.currentState?.pause();
    super.deactivate();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _manualController.dispose();
    _hintController.dispose();
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

  void _onDetect(BarcodeCapture capture) {
    if (capture.barcodes.isEmpty) return;
    final barcode = capture.barcodes.firstWhere(
      (b) => b.format != BarcodeFormat.qrCode && (b.rawValue?.trim().isNotEmpty ?? false),
      orElse: () => capture.barcodes.first,
    );
    if (barcode.format == BarcodeFormat.qrCode) return;
    final raw = barcode.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    _acceptBarcode(raw);
  }

  void _acceptBarcode(String raw) {
    final digits = normalizeBarcode(raw);
    if (digits.length < 6) return;

    final now = DateTime.now();
    final last = _lastSeenAt[digits];
    if (last != null && now.difference(last) < const Duration(milliseconds: 900)) {
      return;
    }
    _lastSeenAt[digits] = now;

    if (_seen.contains(digits)) {
      _pulse('مكرر — $digits');
      HapticFeedback.selectionClick();
      return;
    }

    _seen.add(digits);
    setState(() {
      _scanned.add(_ScannedShade(barcode: digits));
      _flash = digits;
    });
    HapticFeedback.mediumImpact();
    _pulse('تدرج ${_scanned.length}: $digits');
    _checkExists(digits);
    Future<void>.delayed(const Duration(milliseconds: 700), () {
      if (mounted && _flash == digits) setState(() => _flash = null);
    });
  }

  Future<void> _checkExists(String barcode) async {
    try {
      final check = await ref.read(aiProductRepositoryProvider).checkBarcode(barcode);
      if (!mounted || !check.exists) return;
      final idx = _scanned.indexWhere((s) => s.barcode == barcode);
      if (idx < 0) return;
      setState(() {
        _scanned[idx].existsName = check.matchedShadeName ?? check.product?.displayName;
      });
    } catch (_) {}
  }

  void _removeAt(int index) {
    final item = _scanned.removeAt(index);
    _seen.remove(item.barcode);
    setState(() {});
  }

  void _pulse(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), duration: const Duration(milliseconds: 700)),
    );
  }

  Future<void> _continue() async {
    if (_scanned.isEmpty) {
      _pulse('امسح تدرجاً واحداً على الأقل');
      return;
    }
    setState(() => _cameraActive = false);
    await _scannerKey.currentState?.pause();
    if (!mounted) return;
    final barcodes = _scanned.map((s) => s.barcode).toList();
    final hint = _hintController.text.trim();
    final existsNames = <String, String>{
      for (final s in _scanned)
        if (s.existsName != null && s.existsName!.trim().isNotEmpty) s.barcode: s.existsName!.trim(),
    };
    await context.pushReplacement(
      '/shade-family/wizard',
      extra: {
        'barcodes': barcodes,
        if (hint.isNotEmpty) 'hint': hint,
        'model': _model.id,
        if (existsNames.isNotEmpty) 'existsNames': existsNames,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تدرجات مكياج'),
        actions: [
          const DailyProgressChip(),
          IconButton(
            tooltip: _showManual ? 'الكاميرا' : 'إدخال يدوي',
            icon: Icon(_showManual ? Icons.camera_alt_outlined : Icons.keyboard_alt_outlined),
            onPressed: () => setState(() => _showManual = !_showManual),
          ),
        ],
      ),
      body: Column(
        children: [
          Material(
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ComposerNamingBanner(model: _model, compact: true),
                  Row(
                    children: [
                      Expanded(
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Composer',
                            prefixIcon: Icon(Icons.auto_awesome, size: 20),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _model.id,
                              isExpanded: true,
                              isDense: true,
                              items: [
                                for (final m in AiModelOption.all)
                                  DropdownMenuItem(
                                    value: m.id,
                                    child: Text(m.labelAr, overflow: TextOverflow.ellipsis),
                                  ),
                              ],
                              onChanged: (id) async {
                                if (id == null) return;
                                setState(() => _model = AiModelOption.byId(id));
                                await AiModelPrefs.setSelectedId(id);
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _hintController,
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'تلميح (اختياري)',
                      hintText: 'اسم الخط إن عرفته… Mat Passion / Nude Skin',
                      prefixIcon: Icon(Icons.tips_and_updates_outlined, size: 20),
                    ),
                  ),
                  if (_showManual) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _manualController,
                            keyboardType: TextInputType.number,
                            textInputAction: TextInputAction.go,
                            textDirection: TextDirection.ltr,
                            decoration: const InputDecoration(
                              labelText: 'باركود تدرج',
                              prefixIcon: Icon(Icons.pin_outlined),
                            ),
                            onSubmitted: (v) {
                              _acceptBarcode(v);
                              _manualController.clear();
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: () {
                            _acceptBarcode(_manualController.text);
                            _manualController.clear();
                          },
                          style: FilledButton.styleFrom(minimumSize: const Size(88, 48)),
                          child: const Text('إضافة'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    _scanned.isEmpty
                        ? 'امسح عبوات التدرجات بسرعة — نفس المنتج، درجات مختلفة'
                        : '${_scanned.length} تدرج ممسوح',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: _scanned.isEmpty ? AppTheme.muted : AppTheme.primaryDark,
                    ),
                  ),
                  if (_scanned.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 40,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _scanned.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 6),
                        itemBuilder: (_, i) {
                          final s = _scanned[i];
                          final exists = s.existsName != null && s.existsName!.isNotEmpty;
                          return InputChip(
                            avatar: CircleAvatar(
                              backgroundColor: exists ? Colors.orange.shade100 : AppTheme.primary.withValues(alpha: 0.12),
                              child: Text(
                                '${i + 1}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: exists ? Colors.orange.shade800 : AppTheme.primary,
                                ),
                              ),
                            ),
                            label: Text(s.barcode, textDirection: TextDirection.ltr),
                            onDeleted: () => _removeAt(i),
                            tooltip: exists ? 'موجود: ${s.existsName}' : null,
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (_showManual)
                  ColoredBox(
                    color: Colors.black87,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.palette_outlined, size: 56, color: Colors.white.withValues(alpha: 0.7)),
                            const SizedBox(height: 12),
                            const Text(
                              'أدخل باركود كل تدرج ثم اضغط إضافة',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white, fontSize: 15),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else if (_cameraActive) ...[
                  BarcodeLiveScanner(
                    key: _scannerKey,
                    onDetect: _onDetect,
                    detectionSpeed: DetectionSpeed.unrestricted,
                  ),
                  IgnorePointer(
                    child: Center(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        width: 280,
                        height: 140,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _flash != null ? Colors.greenAccent : Colors.white.withValues(alpha: 0.9),
                            width: _flash != null ? 3.5 : 2.5,
                          ),
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 20,
                    right: 20,
                    bottom: 28,
                    child: Material(
                      color: Colors.black.withValues(alpha: 0.55),
                      borderRadius: BorderRadius.circular(14),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Text(
                          _flash != null ? 'تم: $_flash' : 'امسح التدرجات واحداً تلو الآخر دون توقف',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),
                ] else
                  ColoredBox(
                    color: Colors.black87,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const CircularProgressIndicator(color: Colors.white),
                          const SizedBox(height: 14),
                          Text(
                            'جاري تحليل ${_scanned.length} تدرج…',
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFECE7F0))),
          ),
          child: FilledButton.icon(
            onPressed: _scanned.isEmpty ? null : _continue,
            icon: const Icon(Icons.auto_awesome),
            label: Text(
              _scanned.isEmpty
                  ? 'امسح التدرجات أولاً'
                  : 'تعرّف على ${_scanned.length} تدرج وأكمل',
            ),
          ),
        ),
      ),
    );
  }
}
