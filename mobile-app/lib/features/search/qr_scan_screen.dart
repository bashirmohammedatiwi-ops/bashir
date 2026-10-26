import 'dart:async';

import 'package:app_settings/app_settings.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/navigation/deep_link_redirect.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/phone_util.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/camera_corner_frame.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/barcode_lookup.dart';
import '../../data/services/api_service.dart';
import 'search_strings.dart';
import '../../core/config/app_config.dart';

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

/// صفحة المنتج من نتيجة الباركود — مع الدرجة المطابقة إن كان باركود درجة بعينها.
String scannedProductLocation(BarcodeLookupResult hit) {
  final shade = hit.matchedShadeId;
  return '/product/${hit.productSlug}${shade != null && shade.isNotEmpty ? '?shade=${Uri.encodeComponent(shade)}' : ''}';
}

/// مسح باركود المنتج بالكاميرا.
class QrScanScreen extends ConsumerStatefulWidget {
  /// وضع الالتقاط: يعيد الرمز لمن فتحه (البحث، «ديما») بدل فتح المنتج.
  final bool pickOnly;
  const QrScanScreen({super.key, this.pickOnly = false});

  @override
  ConsumerState<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends ConsumerState<QrScanScreen> with WidgetsBindingObserver {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    formats: _barcodeFormats,
  );

  /// بحث جارٍ عن رمز — الكاميرا متوقفة وطبقة «نبحث عن المنتج…» ظاهرة.
  bool _busy = false;
  String? _code;

  /// نافذة الإدخال اليدوي مفتوحة — نتجاهل ما تلتقطه الكاميرا خلفها.
  bool _typing = false;

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

  /// الكاميرا تُشغَّل وتُوقف كثيراً (خلفية، نافذة إذن) — والأخطاء العابرة هنا لا تهم.
  void _start() => unawaited(_controller.start().then((_) {}, onError: (Object _) {}));
  void _stop() => unawaited(_controller.stop().then((_) {}, onError: (Object _) {}));

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // الماسح لا يراقب دورة التطبيق حين نمرّر له المتحكم — نتولاها نحن.
    switch (state) {
      case AppLifecycleState.inactive:
        _stop();
      case AppLifecycleState.resumed:
        if (!_busy) _start();
      default:
        break;
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (_busy || _typing || capture.barcodes.isEmpty) return;

    final barcode = capture.barcodes.firstWhere(
      (b) => b.format != BarcodeFormat.qrCode && (b.rawValue?.trim().isNotEmpty ?? false),
      orElse: () => capture.barcodes.first,
    );
    if (barcode.format == BarcodeFormat.qrCode) return;

    final raw = barcode.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    _accept(raw);
  }

  void _accept(String raw) {
    if (widget.pickOnly) {
      _busy = true;
      HapticFeedback.mediumImpact();
      context.pop(raw);
      return;
    }
    unawaited(_navigateForCode(raw));
  }

  Future<void> _navigateForCode(String raw) async {
    setState(() {
      _busy = true;
      _code = raw;
    });
    _stop();

    var route = resolveScannedLink(raw);
    // «ديما» بالعربي فقط — رابطها لا يُفتح بلغة أخرى.
    if (route != null && route.startsWith('/advisor') && !AppConfig.advisorFor(ref.read(languageCodeProvider))) route = null;
    if (route != null) {
      HapticFeedback.mediumImpact();
      // مسار تبويب (الرئيسية بعالم، البراندات ببحث…): يبدّل التبويب ويغلق الماسح معاً.
      if (openTabPath(context, route)) return;
      context.pushReplacement(route);
      return;
    }

    final normalized = normalizeBarcode(raw);
    final lookupCode = normalized.isNotEmpty ? normalized : raw;

    final BarcodeLookupResult? hit;
    try {
      hit = await ref.read(apiServiceProvider).lookupProductByBarcode(lookupCode);
    } catch (e) {
      // انقطاع أو خطأ: نبقى هنا ونعيد تشغيل الكاميرا لتجرّب مجدداً.
      if (mounted) _resume(ref.friendly(e));
      return;
    }
    if (!mounted) return;
    HapticFeedback.mediumImpact();
    if (hit != null) {
      context.pushReplacement(scannedProductLocation(hit));
      return;
    }
    // لا منتج بهذا الرمز: البحث النصي قد يجده — دون إعادة البحث بالباركود هناك.
    context.pushReplacement('/search?q=${Uri.encodeComponent(lookupCode)}&scanned=1');
  }

  void _resume(String? message) {
    setState(() {
      _busy = false;
      _code = null;
    });
    _start();
    if (message != null) AppSnackbar.error(context, message);
  }

  Future<void> _typeCode() async {
    if (_busy) return;
    _typing = true;
    final code = await showDialog<String>(
      context: context,
      builder: (_) => _ManualCodeDialog(s: ref.read(stringsProvider)),
    );
    _typing = false;
    if (code == null || code.isEmpty || !mounted) return;
    _accept(code);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return Scaffold(
      appBar: AppBar(
        title: Text(s.scanBarcode),
        actions: [
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (_, state, __) => state.error != null
                ? const SizedBox.shrink()
                : IconButton(
                    tooltip: s.flash,
                    onPressed: () => unawaited(_controller.toggleTorch().then((_) {}, onError: (Object _) {})),
                    icon: Icon(state.torchState == TorchState.on ? Icons.flash_on_rounded : Icons.flash_off_rounded),
                  ),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) => _ScannerError(
              s: s,
              permissionDenied: error.errorCode == MobileScannerErrorCode.permissionDenied,
              onTypeCode: _typeCode,
            ),
          ),
          // الإطار والتلميح فوق صورة الكاميرا فقط — لا فوق رسالة الخطأ.
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, state, _) => state.error != null ? const SizedBox.shrink() : _Overlay(s: s, onTypeCode: _typeCode),
          ),
          if (_busy && _code != null) _BusyLayer(s: s, code: _code!),
        ],
      ),
    );
  }
}

/// الإطار، التدرّج، وبطاقة التلميح مع «إدخال الرقم يدوياً».
class _Overlay extends StatelessWidget {
  final AppStrings s;
  final VoidCallback onTypeCode;
  const _Overlay({required this.s, required this.onTypeCode});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        IgnorePointer(
          child: DecoratedBox(
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
        PositionedDirectional(
          start: 24,
          end: 24,
          bottom: 32,
          child: SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.94),
                borderRadius: BorderRadius.circular(AppCorners.md),
                border: Border.all(color: AppColors.primarySoft),
                boxShadow: AppColors.cardShadow,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    s.scanHint,
                    textAlign: TextAlign.center,
                    style: AppText.bodySmall.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w700, height: 1.4),
                  ),
                  TextButton.icon(
                    onPressed: onTypeCode,
                    icon: const Icon(Icons.keyboard_alt_outlined, size: 18),
                    label: Text(s.typeCodeManually),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryDark,
                      minimumSize: const Size(kMinTapTarget, kMinTapTarget),
                      textStyle: AppText.label,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// «نبحث عن المنتج…» مع الرمز الملتقط — يطمئنها أن الكاميرا قرأته.
class _BusyLayer extends StatelessWidget {
  final AppStrings s;
  final String code;
  const _BusyLayer({required this.s, required this.code});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.ink.withValues(alpha: 0.55),
      child: Center(
        child: Semantics(
          liveRegion: true,
          label: s.lookingUpCode,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: 16),
              Text(s.lookingUpCode, style: AppText.title3.copyWith(color: Colors.white)),
              const SizedBox(height: 6),
              Text(
                code,
                textDirection: TextDirection.ltr,
                style: AppText.bodySmall.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontWeight: FontWeight.w600,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// الكاميرا غير مسموحة أو تعذّر تشغيلها: رسالة واضحة، فتح الإعدادات، وإدخال الرقم يدوياً.
class _ScannerError extends StatelessWidget {
  final AppStrings s;
  final bool permissionDenied;
  final VoidCallback onTypeCode;
  const _ScannerError({required this.s, required this.permissionDenied, required this.onTypeCode});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.surface,
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(permissionDenied ? Icons.no_photography_outlined : Icons.videocam_off_outlined, size: 48, color: AppColors.textSecondary),
                const SizedBox(height: 14),
                Text(
                  permissionDenied ? s.cameraPermissionDenied : s.searchScannerUnavailable,
                  textAlign: TextAlign.center,
                  style: AppText.title2.copyWith(color: AppColors.ink),
                ),
                const SizedBox(height: 6),
                Text(
                  permissionDenied ? s.cameraPermissionBody : s.searchScannerUnavailableBody,
                  textAlign: TextAlign.center,
                  style: AppText.bodySmall.copyWith(color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 20),
                if (permissionDenied) ...[
                  FilledButton.icon(
                    onPressed: () => unawaited(AppSettings.openAppSettings().then((_) {}, onError: (Object _) {})),
                    icon: const Icon(Icons.settings_outlined, size: 18),
                    label: Text(s.openSettings),
                    style: FilledButton.styleFrom(minimumSize: const Size(200, kMinTapTarget)),
                  ),
                  const SizedBox(height: 8),
                ],
                OutlinedButton.icon(
                  onPressed: onTypeCode,
                  icon: const Icon(Icons.keyboard_alt_outlined, size: 18),
                  label: Text(s.typeCodeManually),
                  style: OutlinedButton.styleFrom(minimumSize: const Size(200, kMinTapTarget)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// إدخال أرقام الباركود يدوياً (باركود تالف أو منحنٍ) — أرقام عربية تتحول للاتينية.
class _ManualCodeDialog extends StatefulWidget {
  final AppStrings s;
  const _ManualCodeDialog({required this.s});

  @override
  State<_ManualCodeDialog> createState() => _ManualCodeDialogState();
}

class _ManualCodeDialogState extends State<_ManualCodeDialog> {
  final _field = TextEditingController();

  @override
  void dispose() {
    _field.dispose();
    super.dispose();
  }

  void _submit() {
    final code = _field.text.trim();
    if (code.length < 6) return;
    Navigator.of(context).pop(code);
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    return AlertDialog(
      title: Text(s.typeCodeManually),
      content: TextField(
        controller: _field,
        autofocus: true,
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.search,
        textDirection: TextDirection.ltr,
        inputFormatters: [const LatinDigitsFormatter(), FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(20)],
        decoration: InputDecoration(hintText: s.enterBarcodeHint),
        onSubmitted: (_) => _submit(),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(s.cancel)),
        ValueListenableBuilder<TextEditingValue>(
          valueListenable: _field,
          builder: (_, v, __) => FilledButton(
            onPressed: v.text.trim().length >= 6 ? _submit : null,
            child: Text(s.searchCodeAction),
          ),
        ),
      ],
    );
  }
}
