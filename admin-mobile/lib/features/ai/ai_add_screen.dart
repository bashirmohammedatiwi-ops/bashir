import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_draft_store.dart';
import '../../core/utils/ai_model_prefs.dart';
import '../../core/utils/helpers.dart';
import '../../models/ai_autofill.dart';
import '../../providers/auth_provider.dart';
import '../../repositories/ai_product_repository.dart';

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

/// Dedicated AI product-add: scan → duplicate check → autofill wizard.
class AiAddScreen extends ConsumerStatefulWidget {
  const AiAddScreen({super.key});

  @override
  ConsumerState<AiAddScreen> createState() => _AiAddScreenState();
}

class _AiAddScreenState extends ConsumerState<AiAddScreen> with WidgetsBindingObserver {
  final _manualController = TextEditingController();
  final _hintController = TextEditingController();
  final _scannerKey = GlobalKey<_AiLiveScannerState>();
  bool _handled = false;
  bool _showManual = false;
  bool _checking = false;
  List<AiDraftEntry> _recent = [];
  AiModelOption _model = AiModelOption.lunaLow;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadRecent();
    _loadModel();
  }

  Future<void> _loadRecent() async {
    final list = await AiDraftStore.list();
    if (mounted) setState(() => _recent = list.take(8).toList());
  }

  Future<void> _loadModel() async {
    final id = await AiModelPrefs.getSelectedId();
    if (mounted) setState(() => _model = AiModelOption.byId(id));
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

  Future<void> _handleBarcode(String raw) async {
    final digits = normalizeBarcode(raw);
    if (digits.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('باركود غير صالح')),
        );
      }
      setState(() => _handled = false);
      return;
    }

    await _scannerKey.currentState?.pause();
    if (!mounted) return;
    setState(() => _checking = true);

    try {
      final check = await ref.read(aiProductRepositoryProvider).checkBarcode(digits);
      if (!mounted) return;

      if (check.exists) {
        await _showExistingDialog(digits, check);
        return;
      }

      final mode = await _pickAddMode();
      if (mode == null || !mounted) return;

      final hint = _hintController.text.trim();
      final uri = Uri(
        path: '/gpt-autofill',
        queryParameters: {
          'barcode': digits,
          if (hint.isNotEmpty) 'hint': hint,
          if (mode == 'manual') 'manual': '1',
          if (mode == 'ai') 'model': _model.id,
        },
      );
      await context.push(uri.toString());
      await _loadRecent();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _checking = false;
          _handled = false;
        });
        await _scannerKey.currentState?.resume();
      }
    }
  }

  Future<String?> _pickAddMode() async {
    return showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.of(ctx).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('طريقة الإضافة', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.auto_awesome, color: AppTheme.primary),
                title: const Text('تعبئة ذكية (AI)'),
                subtitle: const Text('تسمية ووصف وتصنيف — استهلاك منخفض'),
                onTap: () => Navigator.pop(ctx, 'ai'),
              ),
              ListTile(
                leading: const Icon(Icons.edit_note),
                title: const Text('يدوي بدون AI'),
                subtitle: const Text('صور بالباركود فقط — تكتب التسمية بنفسك'),
                onTap: () => Navigator.pop(ctx, 'manual'),
              ),
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showExistingDialog(String barcode, BarcodeCheckResult check) async {
    final p = check.product;
    final name = p?.displayName ?? 'منتج بدون اسم';
    final brand = p?.brandName;
    final shade = check.matchedShadeName ?? p?.matchedShadeName;
    final productId = p?.id;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.of(ctx).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Icon(Icons.inventory_2_outlined, color: Colors.orange.shade800, size: 28),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'المنتج موجود مسبقاً',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5, height: 1.3)),
              if (brand != null && brand.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(brand, style: TextStyle(color: Colors.grey.shade700)),
              ],
              if (shade != null && shade.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text('درجة: $shade', style: TextStyle(color: Colors.grey.shade700)),
              ],
              const SizedBox(height: 6),
              Text(
                barcode,
                textDirection: TextDirection.ltr,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
              if (p != null) ...[
                const SizedBox(height: 8),
                Text(
                  [
                    if (p.price != null) '${p.price} د.ع',
                    if (p.stock != null) 'مخزون ${p.stock}',
                    if (p.imageCount > 0) '${p.imageCount} صورة',
                    if (p.categoryName != null) p.categoryName!,
                  ].join(' · '),
                  style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                ),
              ],
              const SizedBox(height: 16),
              if (productId != null && productId.isNotEmpty) ...[
                FilledButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    final uri = Uri(
                      path: '/product-review',
                      queryParameters: {
                        'id': productId,
                        'barcode': barcode,
                        'model': _model.id,
                        'auto': '1',
                      },
                    );
                    context.push(uri.toString());
                  },
                  icon: const Icon(Icons.auto_awesome),
                  label: const Text('مراجعة وتصحيح بالـ AI'),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    final uri = Uri(
                      path: '/product-review',
                      queryParameters: {
                        'id': productId,
                        'barcode': barcode,
                        'model': _model.id,
                      },
                    );
                    context.push(uri.toString());
                  },
                  icon: const Icon(Icons.info_outline),
                  label: const Text('عرض التفاصيل والتعديل'),
                ),
                const SizedBox(height: 8),
              ],
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('مسح منتج آخر')),
            ],
          ),
        );
      },
    );
  }

  void _onDetect(BarcodeCapture capture) {
    if (_handled || _checking || capture.barcodes.isEmpty) return;
    final barcode = capture.barcodes.firstWhere(
      (b) => b.format != BarcodeFormat.qrCode && (b.rawValue?.trim().isNotEmpty ?? false),
      orElse: () => capture.barcodes.first,
    );
    if (barcode.format == BarcodeFormat.qrCode) return;
    final raw = barcode.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    _handled = true;
    _handleBarcode(raw);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('إضافة ذكية'),
        actions: [
          IconButton(
            tooltip: _showManual ? 'الكاميرا' : 'إدخال يدوي',
            icon: Icon(_showManual ? Icons.camera_alt_outlined : Icons.keyboard_alt_outlined),
            onPressed: _checking ? null : () => setState(() => _showManual = !_showManual),
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
      body: Stack(
        children: [
          Column(
            children: [
              // Compact toolbar — model + optional hint
              Material(
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: InputDecorator(
                              decoration: const InputDecoration(
                                labelText: 'الموديل',
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
                                  onChanged: _checking
                                      ? null
                                      : (id) async {
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
                      if (_recent.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 36,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _recent.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 6),
                            itemBuilder: (_, i) {
                              final e = _recent[i];
                              return ActionChip(
                                visualDensity: VisualDensity.compact,
                                avatar: const Icon(Icons.history, size: 14),
                                label: Text(e.displayName, overflow: TextOverflow.ellipsis),
                                onPressed: _checking ? null : () => _handleBarcode(e.barcode),
                              );
                            },
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      TextField(
                        controller: _hintController,
                        enabled: !_checking,
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          labelText: 'تلميح (اختياري)',
                          hintText: 'اسم المنتج إن عرفته…',
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
                                enabled: !_checking,
                                keyboardType: TextInputType.number,
                                textInputAction: TextInputAction.go,
                                textDirection: TextDirection.ltr,
                                decoration: const InputDecoration(
                                  labelText: 'الباركود',
                                  prefixIcon: Icon(Icons.pin_outlined),
                                ),
                                onSubmitted: _handleBarcode,
                              ),
                            ),
                            const SizedBox(width: 8),
                            FilledButton(
                              onPressed: _checking ? null : () => _handleBarcode(_manualController.text),
                              style: FilledButton.styleFrom(
                                minimumSize: const Size(88, 48),
                              ),
                              child: const Text('متابعة'),
                            ),
                          ],
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
                                Icon(Icons.keyboard_alt_outlined, size: 56, color: Colors.white.withValues(alpha: 0.7)),
                                const SizedBox(height: 12),
                                const Text(
                                  'أدخل الباركود أعلاه ثم اضغط متابعة',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.white, fontSize: 15),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else ...[
                      _AiLiveScanner(key: _scannerKey, onDetect: _onDetect),
                      IgnorePointer(
                        child: Center(
                          child: Container(
                            width: 260,
                            height: 150,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white.withValues(alpha: 0.85), width: 2.5),
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
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Text(
                              'وجّه الكاميرا نحو الباركود',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
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
          if (_checking)
            ColoredBox(
              color: Colors.black45,
              child: Center(
                child: Card(
                  margin: const EdgeInsets.all(40),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 28, vertical: 28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('جاري الفحص…', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600)),
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

class _AiLiveScanner extends StatefulWidget {
  const _AiLiveScanner({super.key, required this.onDetect});

  final void Function(BarcodeCapture) onDetect;

  @override
  State<_AiLiveScanner> createState() => _AiLiveScannerState();
}

class _AiLiveScannerState extends State<_AiLiveScanner> {
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
