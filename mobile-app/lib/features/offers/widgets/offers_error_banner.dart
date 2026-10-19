import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_text.dart';
import 'offers_theme.dart';

/// شريط خطأ صغير بزر «إعادة المحاولة» — لفشل صفحة لاحقة دون إخفاء ما ظهر.
class OffersErrorBanner extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final brand = OffersTheme.brand(context);
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(OffersTheme.hPad, 0, OffersTheme.hPad, 10),
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(14, 6, 6, 6),
        decoration: OffersTheme.surfaceCard(context),
        child: Row(
          children: [
            Icon(Icons.wifi_off_rounded, size: 18, color: brand),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: OffersTheme.body(context, size: 12, color: OffersTheme.ink(context)),
              ),
            ),
            TextButton(
              onPressed: loading ? null : onRetry,
              style: TextButton.styleFrom(
                foregroundColor: brand,
                minimumSize: const Size(kMinTapTarget, kMinTapTarget),
              ),
              child: loading
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: brand),
                    )
                  : Text(ref.s.retryAction),
            ),
          ],
        ),
      ),
    );
  }
}
