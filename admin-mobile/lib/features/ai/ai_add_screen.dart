import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_draft_store.dart';
import '../../core/utils/ai_model_prefs.dart';
import '../../core/utils/daily_progress_store.dart';
import '../../core/utils/helpers.dart';
import '../../core/utils/readd_assets_cache.dart';
import '../../models/ai_autofill.dart';
import '../../providers/auth_provider.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/barcode_live_scanner.dart';
import '../../widgets/composer_naming_banner.dart';
import '../home/daily_progress_screen.dart';

/// Single-product AI add: scan → model → autofill wizard.
class AiAddScreen extends ConsumerStatefulWidget {
  const AiAddScreen({super.key});

  @override
  ConsumerState<AiAddScreen> createState() => _AiAddScreenState();
}

class _AiAddScreenState extends ConsumerState<AiAddScreen> with WidgetsBindingObserver {
  final _manualController = TextEditingController();
  final _hintController = TextEditingController();
  final _scannerKey = GlobalKey<BarcodeLiveScannerState>();
  bool _handled = false;
  bool _showManual = false;
  bool _checking = false;
  List<AiDraftEntry> _recent = [];
  List<AiModelOption> _models = AiModelOption.all;
  AiModelOption _model = AiModelOption.terra;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await Future.wait([_loadRecent(), _loadModels()]);
  }

  Future<void> _loadRecent() async {
    final list = await AiDraftStore.list();
    if (mounted) setState(() => _recent = list.take(10).toList());
  }

  Future<void> _loadModels() async {
    final prefsId = await AiModelPrefs.getSelectedId();
    List<AiModelOption> models = AiModelOption.all;
    try {
      models = await ref.read(aiProductRepositoryProvider).listModels();
    } catch (_) {/* keep fallback */}
    if (!mounted) return;
    setState(() {
      _models = models;
      _model = AiModelOption.byId(prefsId, catalog: models);
    });
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
      ref.read(dailyProgressProvider.notifier).refresh();
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
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + MediaQuery.of(ctx).padding.bottom),
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
              const Text('طريقة الإضافة', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19)),
              const SizedBox(height: 4),
              Text(
                'الموديل الحالي: ${_model.labelAr}',
                style: const TextStyle(color: AppTheme.muted, fontSize: 13),
              ),
              const SizedBox(height: 14),
              _ModeTile(
                icon: Icons.auto_awesome,
                color: AppTheme.primary,
                title: 'تعبئة ذكية',
                subtitle: 'تسمية بالـ AI · صور · تصنيف · حفظ',
                onTap: () => Navigator.pop(ctx, 'ai'),
              ),
              const SizedBox(height: 8),
              _ModeTile(
                icon: Icons.edit_note_rounded,
                color: AppTheme.primaryDark,
                title: 'يدوي بدون AI',
                subtitle: 'صور بالباركود فقط — تكتب التسمية بنفسك',
                onTap: () => Navigator.pop(ctx, 'manual'),
              ),
              const SizedBox(height: 8),
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
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + MediaQuery.of(ctx).padding.bottom),
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
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.inventory_2_outlined, color: Colors.orange.shade800),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'المنتج موجود مسبقاً',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
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
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'يمكنك حذف المنتج وإضافته من جديد بالـ AI. الصور القديمة تبقى متاحة لتعيد اختيارها.',
                  style: TextStyle(fontSize: 13, height: 1.35),
                ),
              ),
              const SizedBox(height: 16),
              if (productId != null && productId.isNotEmpty) ...[
                FilledButton.icon(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    await _deleteAndReadd(barcode: barcode, productId: productId);
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('حذف وإعادة إضافة بالـ AI'),
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
                  label: const Text('عرض التفاصيل فقط'),
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

  Future<void> _deleteAndReadd({required String barcode, required String productId}) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('حذف وإعادة إضافة؟'),
        content: const Text(
          'سيُحذف المنتج الحالي من المتجر، ثم تُفتح الإضافة الذكية من جديد.\n\n'
          'صور المنتج القديمة ستظهر لك في خطوة الصور لتعيد استخدامها إن أردت.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('حذف ومتابعة'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _checking = true);
    await _scannerKey.currentState?.pause();
    try {
      final products = ref.read(productRepositoryProvider);
      final raw = await products.getProduct(productId);
      final assets = ReaddAssets.fromProductJson(raw);
      ReaddAssetsCache.save(barcode, assets);

      await products.deleteProduct(productId);
      if (!mounted) return;

      final hint = _hintController.text.trim();
      final uri = Uri(
        path: '/gpt-autofill',
        queryParameters: {
          'barcode': barcode,
          if (hint.isNotEmpty) 'hint': hint,
          'model': _model.id,
          if (assets.isNotEmpty) 'keptImages': '1',
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
        title: const Text('إضافة منتج ذكية'),
        actions: [
          const DailyProgressChip(),
          IconButton(
            tooltip: _showManual ? 'الكاميرا' : 'إدخال يدوي',
            icon: Icon(_showManual ? Icons.camera_alt_outlined : Icons.keyboard_alt_outlined),
            onPressed: _checking ? null : () => setState(() => _showManual = !_showManual),
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
      body: Stack(
        children: [
          Column(
            children: [
              Material(
                color: Colors.white,
                elevation: 0,
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: Color(0xFFECE7F0))),
                  ),
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ComposerNamingBanner(model: _model, compact: true),
                      const SizedBox(height: 4),
                      Text(
                        'موديل التسمية',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 40,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _models.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final m = _models[i];
                            final selected = m.id == _model.id;
                            return ChoiceChip(
                              selected: selected,
                              label: Text(m.labelAr.replaceFirst('GPT-5.6 ', '')),
                              avatar: Icon(
                                selected ? Icons.check_circle : Icons.memory,
                                size: 16,
                                color: selected ? Colors.white : AppTheme.primary,
                              ),
                              labelStyle: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12.5,
                                color: selected ? Colors.white : AppTheme.primaryDark,
                              ),
                              selectedColor: AppTheme.primary,
                              backgroundColor: AppTheme.primary.withValues(alpha: 0.06),
                              showCheckmark: false,
                              onSelected: _checking
                                  ? null
                                  : (_) async {
                                      setState(() => _model = m);
                                      await AiModelPrefs.setSelectedId(m.id);
                                    },
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _model.descriptionAr,
                        style: const TextStyle(fontSize: 12, color: AppTheme.muted, height: 1.3),
                      ),
                      if (_recent.isNotEmpty) ...[
                        const SizedBox(height: 10),
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
                      const SizedBox(height: 10),
                      TextField(
                        controller: _hintController,
                        enabled: !_checking,
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          labelText: 'تلميح (اختياري)',
                          hintText: 'اسم المنتج أو البراند على العبوة…',
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
                                minimumSize: const Size(96, 48),
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
                        color: const Color(0xFF1A1028),
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.keyboard_alt_outlined, size: 64, color: Colors.white.withValues(alpha: 0.75)),
                                const SizedBox(height: 14),
                                const Text(
                                  'أدخل الباركود أعلاه ثم اضغط متابعة',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.white, fontSize: 15.5, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else ...[
                      BarcodeLiveScanner(key: _scannerKey, onDetect: _onDetect),
                      IgnorePointer(
                        child: Center(
                          child: Container(
                            width: 280,
                            height: 160,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white.withValues(alpha: 0.9), width: 2.5),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(alpha: 0.35),
                                  blurRadius: 24,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        right: 20,
                        bottom: 28,
                        child: Material(
                          color: Colors.black.withValues(alpha: 0.58),
                          borderRadius: BorderRadius.circular(16),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            child: Text(
                              'وجّه الكاميرا نحو الباركود — منتج مفرد فقط',
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
                  margin: const EdgeInsets.all(36),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(),
                        const SizedBox(height: 16),
                        const Text(
                          'جاري الفحص…',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'ثم التسمية بـ ${_model.labelAr}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
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

class _ModeTile extends StatelessWidget {
  const _ModeTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(fontSize: 12.5, color: AppTheme.muted, height: 1.3)),
                  ],
                ),
              ),
              Icon(Icons.chevron_left, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
