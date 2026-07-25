import 'package:flutter/material.dart';

import 'offers_theme.dart';

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
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 0, OffersTheme.hPad, 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: OffersTheme.surfaceCard(),
        child: Row(
          children: [
            const Icon(Icons.wifi_off_rounded, size: 18, color: OffersTheme.brand),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: OffersTheme.body(size: 12, color: OffersTheme.ink))),
            TextButton(
              onPressed: loading ? null : onRetry,
              style: TextButton.styleFrom(foregroundColor: OffersTheme.brand),
              child: loading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: OffersTheme.brand),
                    )
                  : const Text('إعادة'),
            ),
          ],
        ),
      ),
    );
  }
}
