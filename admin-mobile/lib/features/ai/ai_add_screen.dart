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

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
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
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.inventory_2_outlined, color: Colors.orange.shade800, size: 36),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'المنتج موجود مسبقاً',
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'لا حاجة لإضافته مرة أخرى — ظهر في المتجر بهذا الباركود.',
                            style: TextStyle(fontSize: 13, height: 1.35),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              if (brand != null && brand.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(brand, style: TextStyle(color: Colors.grey.shade700)),
              ],
              if (shade != null && shade.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text('درجة: $shade', style: TextStyle(color: Colors.grey.shade700)),
              ],
              const SizedBox(height: 8),
              Text(
                'باركود: $barcode',
                textDirection: TextDirection.ltr,
                style: TextStyle(fontFamily: 'monospace', color: Colors.grey.shade600),
              ),
              if (p?.price != null) ...[
                const SizedBox(height: 4),
                Text('السعر: ${p!.price} د.ع · المخزون: ${p.stock ?? 0}'),
              ],
              const SizedBox(height: 18),
              FilledButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('حسناً — امسح منتجاً آخر'),
              ),
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
        title: const Text('إضافة بالـ AI'),
        actions: [
          IconButton(
            tooltip: _showManual ? 'الكاميرا' : 'إدخال يدوي',
            icon: Icon(_showManual ? Icons.camera_alt : Icons.keyboard),
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
              Container(
                width: double.infinity,
                margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primary.withValues(alpha: 0.12),
                      AppTheme.accent.withValues(alpha: 0.18),
                    ],
                    begin: Alignment.topRight,
                    end: Alignment.bottomLeft,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.auto_awesome, color: AppTheme.primary, size: 22),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'إضافة ذكية سريعة',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: AppTheme.primaryDark,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      '• إن كان الباركود موجوداً يظهر تنبيه فوري بدون AI\n'
                      '• اختر تعبئة ذكية أو إضافة يدوية بدون AI\n'
                      '• الصور بالباركود · تدرجات اختيارية · معاينة قبل الحفظ',
                      style: TextStyle(height: 1.45, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'موديل الذكاء الاصطناعي',
                    prefixIcon: Icon(Icons.memory),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _model.id,
                      items: [
                        for (final m in AiModelOption.all)
                          DropdownMenuItem(
                            value: m.id,
                            child: Text('${m.labelAr} — ${m.descriptionAr}', overflow: TextOverflow.ellipsis),
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
              if (_recent.isNotEmpty)
                SizedBox(
                  height: 52,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                    scrollDirection: Axis.horizontal,
                    itemCount: _recent.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) {
                      final e = _recent[i];
                      return ActionChip(
                        avatar: const Icon(Icons.history, size: 16),
                        label: Text(e.displayName, overflow: TextOverflow.ellipsis),
                        onPressed: _checking ? null : () => _handleBarcode(e.barcode),
                      );
                    },
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: TextField(
                  controller: _hintController,
                  enabled: !_checking,
                  textInputAction: TextInputAction.done,
                  decoration: const InputDecoration(
                    labelText: 'تلميح اختياري (يوفر استهلاك AI)',
                    hintText: 'مثال: Seventeen Ideal Cover Concealer',
                    prefixIcon: Icon(Icons.lightbulb_outline),
                  ),
                ),
              ),
              if (_showManual)
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _manualController,
                          enabled: !_checking,
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.go,
                          decoration: const InputDecoration(
                            labelText: 'أدخل الباركود',
                            prefixIcon: Icon(Icons.pin),
                          ),
                          onSubmitted: _handleBarcode,
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: _checking ? null : () => _handleBarcode(_manualController.text),
                        child: const Text('متابعة'),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _AiLiveScanner(key: _scannerKey, onDetect: _onDetect),
                    IgnorePointer(
                      child: Center(
                        child: Container(
                          width: 240,
                          height: 140,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white70, width: 2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 24,
                      child: Material(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(12),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          child: Text(
                            'امسح الباركود — نفحص الوجود أولاً ثم نفتح المعاينة',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                      ),
                    ),
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
                  margin: const EdgeInsets.all(32),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('جاري فحص الباركود في المتجر...', textAlign: TextAlign.center),
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
