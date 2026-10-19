import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/l10n/app_strings.dart';
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
  const AppUpdateInfo({
    this.mode = 'none',
    this.latest = '',
    this.storeUrl = '',
    this.message = '',
  });

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
    final j = await ref
        .read(apiServiceProvider)
        .checkAppUpdate(
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
  if (Platform.isAndroid &&
      id != null &&
      uri.host.contains('play.google.com')) {
    final market = Uri.parse('market://details?id=$id');
    final opened = await launchUrl(
      market,
      mode: LaunchMode.externalApplication,
    ).catchError((_) => false);
    if (opened) return;
  }
  await launchUrl(
    uri,
    mode: LaunchMode.externalApplication,
  ).catchError((_) => false);
}

const _dismissKey = 'app_update_dismissed';

/// آخر إصدار أجّلت تنبيهه («لاحقاً») — لا يعود التنبيه حتى يصدر أحدث منه.
final softUpdateDismissedProvider = StateProvider<String?>((ref) {
  try {
    return ref.read(sharedPreferencesProvider).getString(_dismissKey);
  } catch (_) {
    return null;
  }
});

/// هل تظهر بطاقة «تحديث جديد متاح» الآن؟ الـ shell يرسمها فوق شريط التنقل
/// ويخفي زر «ديما» العائم ما دامت ظاهرة، فلا يتراكبان.
final softUpdateVisibleProvider = Provider<bool>((ref) {
  final info = ref.watch(appUpdateProvider).valueOrNull;
  if (info == null || !info.soft) return false;
  return ref.watch(softUpdateDismissedProvider) != info.latest;
});

/// «لاحقاً»: نخفي البطاقة فوراً ونحفظ الإصدار المؤجَّل.
void dismissSoftUpdate(WidgetRef ref) {
  final latest = ref.read(appUpdateProvider).valueOrNull?.latest ?? '';
  HapticFeedback.selectionClick();
  ref.read(softUpdateDismissedProvider.notifier).state = latest;
  try {
    ref.read(sharedPreferencesProvider).setString(_dismissKey, latest);
  } catch (_) {}
}

/// يغلّف التطبيق: شاشة «التحديث مطلوب» تحجب كل شيء عند force، ويعيد الفحص
/// عند العودة للتطبيق. أما soft فبطاقة لطيفة يرسمها الـ shell ([SoftUpdateCard])
/// — لا تغطي صفحات المنتج والدفع.
class AppUpdateGate extends ConsumerStatefulWidget {
  final Widget child;
  const AppUpdateGate({super.key, required this.child});

  @override
  ConsumerState<AppUpdateGate> createState() => _AppUpdateGateState();
}

class _AppUpdateGateState extends ConsumerState<AppUpdateGate>
    with WidgetsBindingObserver {
  DateTime _lastCheck = DateTime.now();

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
    if (state == AppLifecycleState.resumed &&
        DateTime.now().difference(_lastCheck) > const Duration(hours: 3)) {
      _lastCheck = DateTime.now();
      ref.invalidate(appUpdateProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final force = ref.watch(
      appUpdateProvider.select((a) => a.valueOrNull?.force ?? false),
    );
    return Stack(
      children: [
        widget.child,
        if (force) const Positioned.fill(child: ForceUpdateScreen()),
      ],
    );
  }
}

/// رسالة لوحة التحكم مكتوبة بالعربية — نعرضها للعربية فقط، وللإنجليزية نصّنا.
String _serverMessage(AppUpdateInfo info, AppStrings s, String fallback) =>
    s.isAr && info.message.trim().isNotEmpty ? info.message.trim() : fallback;

/// بطاقة «تحديث جديد متاح» — تظهر فوق شريط التنقل حين [softUpdateVisibleProvider].
class SoftUpdateCard extends ConsumerWidget {
  const SoftUpdateCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final info =
        ref.watch(appUpdateProvider).valueOrNull ?? const AppUpdateInfo();
    final s = ref.s;
    final t = context.worldTheme;
    final still = MediaQuery.disableAnimationsOf(context);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: still ? 1 : 0, end: 1),
      duration: still ? Duration.zero : const Duration(milliseconds: 520),
      curve: Curves.easeOutBack,
      builder: (_, v, child) => Opacity(
        opacity: v.clamp(0, 1),
        child: Transform.translate(
          offset: Offset(0, (1 - v) * 40),
          child: child,
        ),
      ),
      child: Semantics(
        container: true,
        liveRegion: true,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsetsDirectional.fromSTEB(14, 10, 8, 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppCorners.lg),
              gradient: LinearGradient(
                begin: AlignmentDirectional.centerStart,
                end: AlignmentDirectional.centerEnd,
                colors: [
                  t.accentDark,
                  Color.lerp(t.accent, Colors.white, 0.08)!,
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: t.accentDark.withValues(alpha: 0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                  spreadRadius: -6,
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.system_update_alt_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.updateAvailableTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.title3.copyWith(color: Colors.white),
                      ),
                      Text(
                        _serverMessage(info, s, s.updateAvailableBody),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
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
                        minimumSize: const Size(0, 40),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        shape: const StadiumBorder(),
                      ),
                      child: Text(
                        s.updateNow,
                        style: AppText.label.copyWith(color: t.accentDark),
                      ),
                    ),
                    TextButton(
                      onPressed: () => dismissSoftUpdate(ref),
                      style: TextButton.styleFrom(
                        minimumSize: const Size(0, kMinTapTarget),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        foregroundColor: Colors.white,
                      ),
                      child: Text(
                        s.later,
                        style: AppText.caption.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// «التحديث مطلوب» — تحجب التطبيق حين يصبح الإصدار أقدم من المسموح.
/// قابلة للتمرير: الخط الكبير والوضع الأفقي لا يكسران التخطيط.
class ForceUpdateScreen extends ConsumerWidget {
  const ForceUpdateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final info =
        ref.watch(appUpdateProvider).valueOrNull ?? const AppUpdateInfo();
    final s = ref.s;
    final t = context.worldTheme;
    final isIos = Platform.isIOS;
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
          child: LayoutBuilder(
            builder: (context, c) => SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
              child: ConstrainedBox(
                // ارتفاع الشاشة ناقص الحشوة — فتعمل الفواصل المرنة كما كانت.
                constraints: BoxConstraints(
                  minHeight: (c.maxHeight - 48).clamp(0, double.infinity),
                ),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      const Spacer(),
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: t.accent.withValues(alpha: 0.25),
                              blurRadius: 30,
                              offset: const Offset(0, 12),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(12),
                        child: Image.asset(
                          'assets/images/alhayat_butterfly_logo.png',
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.system_update_rounded,
                            size: 56,
                            color: t.accent,
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text(
                        s.updateRequiredTitle,
                        textAlign: TextAlign.center,
                        style: AppText.display.copyWith(color: t.ink),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _serverMessage(info, s, s.updateRequiredBody),
                        textAlign: TextAlign.center,
                        style: AppText.body.copyWith(color: t.inkSoft),
                      ),
                      if (info.latest.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: t.accentLight,
                            borderRadius: BorderRadius.circular(99),
                          ),
                          child: Text(
                            s.versionLabel(info.latest),
                            style: AppText.label.copyWith(color: t.accentDark),
                          ),
                        ),
                      ],
                      const SizedBox(height: 28),
                      const Spacer(flex: 2),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: () => openStore(info.storeUrl),
                          icon: Icon(
                            isIos ? Icons.apple_rounded : Icons.shop_rounded,
                          ),
                          label: Text(
                            s.updateFromStore(isIos),
                            textAlign: TextAlign.center,
                            style: AppText.title3.copyWith(color: Colors.white),
                          ),
                          style: FilledButton.styleFrom(
                            backgroundColor: t.accentDark,
                            minimumSize: const Size.fromHeight(56),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            shape: const StadiumBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        s.updateReassure,
                        textAlign: TextAlign.center,
                        style: AppText.caption.copyWith(color: t.inkMuted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
