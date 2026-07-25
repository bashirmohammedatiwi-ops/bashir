import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import 'offers_theme.dart';

/// تنبيه خفيف — لا يعطّل الصفحة بالكامل.
class OffersErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final bool loading;

  const OffersErrorBanner({
    super.key,
    required this.message,
    required this.onRetry,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF5F5),
          borderRadius: BorderRadius.circular(OffersTheme.cardRadius),
          border: Border.all(color: const Color(0xFFF5C2C7)),
        ),
        child: Row(
          children: [
            Icon(Icons.wifi_off_rounded, size: 18, color: OffersTheme.accent.withValues(alpha: 0.85)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: OffersTheme.body(size: 12, color: OffersTheme.ink),
              ),
            ),
            TextButton(
              onPressed: loading ? null : onRetry,
              child: loading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('إعادة'),
            ),
          ],
        ),
      ),
    );
  }
}
