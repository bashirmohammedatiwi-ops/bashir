import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/friendly_error.dart';
import '../../features/worlds/world_theme.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  const EmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
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
              style: AppTypography.sectionTitle.copyWith(color: t.ink),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(color: t.inkMuted),
              ),
            ],
            if (action != null) ...[const SizedBox(height: AppSpacing.xl), action!],
          ],
        ),
      ),
    );
  }
}

class ErrorView extends ConsumerWidget {
  final String message;
  final VoidCallback? onRetry;
  const ErrorView({super.key, required this.message, this.onRetry});

  factory ErrorView.from(Object? error, {VoidCallback? onRetry}) {
    return ErrorView(message: friendlyError(error), onRetry: onRetry);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final text = message.contains('Exception') || message.contains('Error:')
        ? friendlyError(message, lang: s.lang)
        : message;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: t.accentLight,
                shape: BoxShape.circle,
                border: Border.all(color: t.accentSoft),
              ),
              child: Icon(Icons.cloud_off_rounded, size: 48, color: t.accentDark.withValues(alpha: 0.75)),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              s.loadFailed,
              style: AppTypography.sectionTitle.copyWith(fontSize: 16, color: t.ink),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              text,
              textAlign: TextAlign.center,
              style: AppTypography.caption.copyWith(color: t.inkMuted),
            ),
            if (onRetry != null) ...[
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
      ),
    );
  }
}
