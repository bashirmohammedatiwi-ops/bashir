import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../navigation/app_navigation.dart';
import '../navigation/notification_navigation.dart';
import '../../features/cart/widgets/cart_theme.dart';

/// بانر إشعار أثناء فتح التطبيق (foreground).
class ForegroundNotificationBanner {
  ForegroundNotificationBanner._();

  static OverlayEntry? _entry;

  static void show({
    required String title,
    required String body,
    String? imageUrl,
    Map<String, dynamic>? payload,
  }) {
    dismiss();

    final context = rootNavigatorKey.currentContext;
    if (context == null || !context.mounted) return;

    final overlay = Overlay.maybeOf(context);
    if (overlay == null) return;

    _entry = OverlayEntry(
      builder: (ctx) => _Banner(
        title: title,
        body: body,
        imageUrl: imageUrl,
        onTap: () {
          dismiss();
          if (payload != null) openPushPayload(ctx, payload);
        },
        onDismiss: dismiss,
      ),
    );
    overlay.insert(_entry!);

    Future.delayed(const Duration(seconds: 6), dismiss);
  }

  static void dismiss() {
    _entry?.remove();
    _entry = null;
  }
}

class _Banner extends StatelessWidget {
  final String title;
  final String body;
  final String? imageUrl;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _Banner({
    required this.title,
    required this.body,
    this.imageUrl,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top + 8;

    return Positioned(
      top: top,
      left: 12,
      right: 12,
      child: Material(
        elevation: 12,
        shadowColor: Colors.black26,
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: CartTheme.brand.withValues(alpha: 0.2)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (imageUrl != null && imageUrl!.isNotEmpty)
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                    child: CachedNetworkImage(
                      imageUrl: imageUrl!,
                      height: 120,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(
                        height: 120,
                        color: CartTheme.brandWash,
                        child: const Icon(Icons.image_not_supported_outlined),
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: CartTheme.brandWash,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.notifications_active_rounded, color: CartTheme.brand, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              body,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.grey.shade700, fontSize: 13, height: 1.35),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        onPressed: onDismiss,
                        icon: const Icon(Icons.close_rounded, size: 20),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
