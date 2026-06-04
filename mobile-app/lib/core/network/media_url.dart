import '../config/app_config.dart';

String resolveMediaUrl(dynamic mediaOrUrl) {
  if (mediaOrUrl == null) return '';
  if (mediaOrUrl is String) {
    if (mediaOrUrl.startsWith('http')) return mediaOrUrl;
    if (mediaOrUrl.startsWith('/')) {
      return '${AppConfig.mediaBaseUrl}$mediaOrUrl';
    }
    return mediaOrUrl;
  }
  if (mediaOrUrl is Map) {
    final map = Map<String, dynamic>.from(mediaOrUrl);

    final direct = map['publicUrl'] ?? map['url'];
    if (direct is String && direct.isNotEmpty) {
      return resolveMediaUrl(direct);
    }

    final variants = map['variants'];
    if (variants is Map) {
      final vMap = Map<String, dynamic>.from(variants);
      for (final size in ['medium', 'large', 'small', 'thumb']) {
        final sizeNode = vMap[size];
        if (sizeNode is! Map) continue;
        final formats = Map<String, dynamic>.from(sizeNode)['formats'];
        if (formats is! Map) continue;
        final fMap = Map<String, dynamic>.from(formats);
        for (final key in ['jpg', 'webp', 'avif', 'png']) {
          final picked = fMap[key];
          if (picked is String && picked.isNotEmpty) {
            return resolveMediaUrl(picked);
          }
        }
      }
    }

    final originalUrl = map['originalUrl'];
    if (originalUrl is String && originalUrl.isNotEmpty) {
      return resolveMediaUrl(originalUrl);
    }

    final base = map['publicUrlBase']?.toString();
    final filename = map['filename']?.toString();
    if (base != null &&
        base.isNotEmpty &&
        filename != null &&
        filename.isNotEmpty) {
      final root = base.startsWith('http')
          ? base.replaceAll(RegExp(r'/$'), '')
          : '${AppConfig.mediaBaseUrl}/${base.replaceAll(RegExp(r'^/'), '')}';
      for (final suffix in ['_medium.webp', '_thumb.webp', '.webp', '.jpg']) {
        return '$root/$filename$suffix';
      }
    }
  }
  return '';
}
