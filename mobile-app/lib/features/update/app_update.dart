import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/providers/app_info_provider.dart';
import '../../core/theme/app_text.dart';
import '../../core/utils/json.dart';
import '../../data/services/api_service.dart';
import '../worlds/world_theme.dart';

/// نتيجة فحص التحديث من السيرفر.
class AppUpdateInfo {
  /// none | soft (يوجد أحدث — تنبيه يمكن تأجيله) | force (أقدم من المسموح — لا يعمل التطبيق).
  final String mode;
  final String latest;
  final String storeUrl;
  final String message;
  const AppUpdateInfo({this.mode = 'none', this.latest = '', this.storeUrl = '', this.message = ''});

  factory AppUpdateInfo.fromJson(Map<String, dynamic> j) => AppUpdateInfo(
        mode: asString(j['mode'], 'none'),
        latest: asString(j['latest']),
        storeUrl: asString(j['storeUrl']),
        message: asString(j['message']),
      );

  bool get force => mode == 'force' && storeUrl.isNotEmpty;
  bool get soft => mode == 'soft' && storeUrl.isNotEmpty;
}

final appUpdateProvider = FutureProvider<AppUpdateInfo>((ref) async {
  if (!(Platform.isAndroid || Platform.isIOS)) return const AppUpdateInfo();
  final info = await ref.watch(packageInfoProvider.future);
  try {
    final j = await ref.read(apiServiceProvider).checkAppUpdate(
          platform: Platform.isIOS ? 'ios' : 'android',
          version: info.version,
        );
    return AppUpdateInfo.fromJson(j);
  } catch (_) {
    // بلا إنترنت أو خطأ: لا نوقف التطبيق أبداً بسبب فحص التحديث.
    return const AppUpdateInfo();
  }
});

/// يفتح صفحة التطبيق في المتجر (Google Play عبر تطبيقه إن أمكن).
Future<void> openStore(String url) async {
  HapticFeedback.mediumImpact();
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  final id = uri.queryParameters['id'];
  if (Platform.isAndroid && id != null && uri.host.contains('play.google.com')) {
    final market = Uri.parse('market://details?id=$id');
    if (await launchUrl(market, mode: LaunchMode.externalApplication).catchError((_) => false)) return;
  }
  await launchUrl(uri, mode: LaunchMode.externalApplication).catchError((_) => false);
}

/// يغلّف التطبيق: شاشة «التحديث مطلوب» تحجب كل شيء عند force،
/// وبطاقة لطيفة أسفل الشاشة عند soft (تُؤجَّل حتى يصدر إصدار أحدث).
class AppUpdateGate extends ConsumerStatefulWidget {
  final Widget child;
  const AppUpdateGate({super.key, required this.child});

  @override
  ConsumerState<AppUpdateGate> createState() => _AppUpdateGateState();
}

class _AppUpdateGateState extends ConsumerState<AppUpdateGate> with WidgetsBindingObserver {
  static const _dismissKey = 'app_update_dismissed';
  DateTime _lastCheck = DateTime.now();
  bool _hideSoft = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // عند العودة للتطبيق (مثلاً بعد التحديث من المتجر) — نعيد الفحص كل 3 ساعات على الأكثر.
    if (state == AppLifecycleState.resumed && DateTime.now().difference(_lastCheck) > const Duration(hours: 3)) {
      _lastCheck = DateTime.now();
      ref.invalidate(appUpdateProvider);
    }
  }

  void _later(AppUpdateInfo info) {
    HapticFeedback.selectionClick();
    setState(() => _hideSoft = true);
    try {
      ref.read(sharedPreferencesProvider).setString(_dismissKey, info.latest);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final info = ref.watch(appUpdateProvider).valueOrNull ?? const AppUpdateInfo();
    String? dismissed;
    try {
      dismissed = ref.read(sharedPreferencesProvider).getString(_dismissKey);
    } catch (_) {}
    final showSoft = info.soft && !_hideSoft && dismissed != info.latest;
    return Stack(
      children: [
        widget.child,
        if (showSoft)
          Positioned(
            left: 12,
            right: 12,
            bottom: MediaQuery.paddingOf(context).bottom + 92,
            child: SoftUpdateCard(info: info, onLater: () => _later(info)),
          ),
        if (info.force) Positioned.fill(child: ForceUpdateScreen(info: info)),
      ],
    );
  }
}

class SoftUpdateCard extends StatelessWidget {
  final AppUpdateInfo info;
  final VoidCallback onLater;
  const SoftUpdateCard({required this.info, required this.onLater});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 520),
      curve: Curves.easeOutBack,
      builder: (_, v, child) => Opacity(
        opacity: v.clamp(0, 1),
        child: Transform.translate(offset: Offset(0, (1 - v) * 40), child: child),
      ),
      child: Material(
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 10, 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: LinearGradient(
              begin: AlignmentDirectional.centerStart,
              end: AlignmentDirectional.centerEnd,
              colors: [t.accentDark, Color.lerp(t.accent, Colors.white, 0.08)!],
            ),
            boxShadow: [BoxShadow(color: t.accentDark.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10), spreadRadius: -6)],
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                child: const Icon(Icons.system_update_alt_rounded, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('تحديث جديد متاح ✨', style: AppText.title3.copyWith(color: Colors.white)),
                    Text(
                      info.message.isNotEmpty ? info.message : 'حدّثي التطبيق للحصول على أحدث المزايا',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FilledButton(
                    onPressed: () => openStore(info.storeUrl),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: t.accentDark,
                      minimumSize: const Size(0, 36),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      shape: const StadiumBorder(),
                    ),
                    child: Text('حدّثي', style: AppText.label.copyWith(color: t.accentDark)),
                  ),
                  TextButton(
                    onPressed: onLater,
                    style: TextButton.styleFrom(minimumSize: const Size(0, 28), padding: const EdgeInsets.symmetric(horizontal: 8)),
                    child: Text('لاحقاً', style: AppText.micro.copyWith(color: Colors.white.withValues(alpha: 0.85))),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ForceUpdateScreen extends StatelessWidget {
  final AppUpdateInfo info;
  const ForceUpdateScreen({required this.info});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: t.canvas,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [t.accentSoft, t.canvas],
            stops: const [0, 0.5],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: t.accent.withValues(alpha: 0.25), blurRadius: 30, offset: const Offset(0, 12))],
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Image.asset('assets/images/alhayat_butterfly_logo.png', errorBuilder: (_, __, ___) => Icon(Icons.system_update_rounded, size: 56, color: t.accent)),
                ),
                const SizedBox(height: 28),
                Text('التحديث مطلوب', style: AppText.display.copyWith(color: t.ink)),
                const SizedBox(height: 10),
                Text(
                  info.message.isNotEmpty
                      ? info.message
                      : 'أصدرنا نسخة جديدة من التطبيق — حدّثيها لتكملي التسوق.',
                  textAlign: TextAlign.center,
                  style: AppText.body.copyWith(color: t.inkSoft),
                ),
                if (info.latest.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(color: t.accentLight, borderRadius: BorderRadius.circular(99)),
                    child: Text('الإصدار ${info.latest}', textDirection: TextDirection.rtl, style: AppText.label.copyWith(color: t.accentDark)),
                  ),
                ],
                const Spacer(flex: 2),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: FilledButton.icon(
                    onPressed: () => openStore(info.storeUrl),
                    icon: Icon(Platform.isIOS ? Icons.apple_rounded : Icons.shop_rounded),
                    label: Text(
                      Platform.isIOS ? 'التحديث من App Store' : 'التحديث من Google Play',
                      style: AppText.title3.copyWith(color: Colors.white),
                    ),
                    style: FilledButton.styleFrom(backgroundColor: t.accentDark, shape: const StadiumBorder()),
                  ),
                ),
                const SizedBox(height: 10),
                Text('يستغرق دقيقة واحدة — سلتكِ ومفضلتكِ محفوظة 💜',
                    textAlign: TextAlign.center, style: AppText.caption.copyWith(color: t.inkMuted)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
