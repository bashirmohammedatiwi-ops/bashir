import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../theme/app_spacing.dart';
import '../theme/app_text.dart';
import '../utils/connection_error.dart';
import '../utils/friendly_error.dart';
import 'ui/ui_strings.dart';
import '../../features/worlds/world_theme.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  /// سحب للتحديث على الحالة نفسها (قائمة فارغة بعد طلب جديد مثلاً).
  final Future<void> Function()? onRefresh;

  const EmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    this.subtitle,
    this.action,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return _StateFrame(
      onRefresh: onRefresh,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: AlignmentDirectional.topStart,
                end: AlignmentDirectional.bottomEnd,
                colors: [t.accentLight, t.canvasWarm],
              ),
              shape: BoxShape.circle,
              border: Border.all(color: t.accentSoft),
              boxShadow: t.cardShadow,
            ),
            child: Icon(icon, size: 44, color: t.accentDark),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            title,
            textAlign: TextAlign.center,
            style: AppText.title2.copyWith(color: t.ink),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: AppText.bodySmall.copyWith(color: t.inkMuted),
            ),
          ],
          if (action != null) ...[const SizedBox(height: AppSpacing.xl), action!],
        ],
      ),
    );
  }
}

/// أي حرف عربي — لمعرفة لغة رسالة جاهزة مُرّرت كنص.
final _arabicLetters = RegExp(r'[؀-ۿ]');

class ErrorView extends ConsumerWidget {
  /// نص جاهز للعرض. يُستعمل حين لا يُمرَّر [error].
  final String message;

  /// الخطأ الخام: يُصاغ عند البناء بلغة الواجهة، فتبديل اللغة يحدّث رسالة ظاهرة أصلاً.
  final Object? error;

  final VoidCallback? onRetry;

  /// إعادة المحاولة جارية: مؤشر انتظار مكان الزر حتى لا تُضغط مرتين بلا أثر.
  final bool loading;

  /// سحب للتحديث على الحالة نفسها.
  final Future<void> Function()? onRefresh;

  const ErrorView({
    super.key,
    required this.message,
    this.onRetry,
    this.error,
    this.loading = false,
    this.onRefresh,
  });

  /// من الخطأ الخام مباشرة — الطريقة المفضّلة.
  const ErrorView.from(
    this.error, {
    super.key,
    this.onRetry,
    this.loading = false,
    this.onRefresh,
  }) : message = '';

  /// نص الخطأ بلغة الواجهة. الرسالة الجاهزة تُعاد صياغتها فقط إن كانت تقنية أو بلغة
  /// أخرى (صيغت قبل تبديل اللغة) — وإلا تُعرض كما كتبها المستدعي.
  String _text(String lang) {
    if (error != null || message.isEmpty) return friendlyError(error, lang: lang);
    final technical = message.contains('Exception') || message.contains('Error:');
    final otherLanguage = _arabicLetters.hasMatch(message) != (lang == 'ar');
    return technical || otherLanguage ? friendlyError(message, lang: lang) : message;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final offline = isConnectionError(error ?? message);

    return _StateFrame(
      onRefresh: onRefresh,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: t.accentLight,
              shape: BoxShape.circle,
              border: Border.all(color: t.accentSoft),
            ),
            child: Icon(
              offline ? Icons.wifi_off_rounded : Icons.cloud_off_rounded,
              size: 48,
              color: t.accentDark.withValues(alpha: 0.75),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            offline ? s.uiNoConnection : s.loadFailed,
            textAlign: TextAlign.center,
            style: AppText.title3.copyWith(color: t.ink),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            offline ? s.uiNoConnectionBody : _text(s.lang),
            textAlign: TextAlign.center,
            style: AppText.bodySmall.copyWith(color: t.inkMuted),
          ),
          if (loading) ...[
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              height: 48,
              child: Center(
                child: SizedBox.square(
                  dimension: 26,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    color: t.accent,
                    semanticsLabel: s.loading,
                  ),
                ),
              ),
            ),
          ] else if (onRetry != null) ...[
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: Text(s.retryAction),
              style: FilledButton.styleFrom(
                minimumSize: const Size(180, 48),
                backgroundColor: t.accent,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// إطار حالتي الفراغ والخطأ: المحتوى في المنتصف داخل تمرير دائم بارتفاع لا يقل عن
/// المساحة المتاحة — فيعمل السحب للتحديث ولا يفيض مع لوحة المفاتيح أو تكبير الخط.
///
/// داخل تمرير عمودي أصلاً (sliver أو عنصر قائمة) يُعرض المحتوى كما هو: لا تمرير متداخل،
/// ويبقى صالحاً لـ `SliverFillRemaining(hasScrollBody: false)` الذي يقيس الأبعاد الذاتية.
class _StateFrame extends StatelessWidget {
  final Widget child;
  final Future<void> Function()? onRefresh;

  const _StateFrame({required this.child, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: child,
    );
    if (Scrollable.maybeOf(context, axis: Axis.vertical) != null) {
      return Center(child: content);
    }

    final body = LayoutBuilder(
      builder: (context, c) {
        // داخل Column بلا Expanded: لا ارتفاع نملؤه ولا تمرير ممكن.
        if (!c.hasBoundedHeight) return Center(child: content);
        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: c.maxHeight),
            child: Center(child: content),
          ),
        );
      },
    );
    if (onRefresh == null) return body;
    return RefreshIndicator(
      color: context.worldTheme.accent,
      onRefresh: onRefresh!,
      child: body,
    );
  }
}
