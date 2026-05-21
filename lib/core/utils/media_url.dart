import '../config/app_config.dart';

String resolveMediaUrl(dynamic media) {
  if (media == null) return '';
  if (media is String) {
    if (media.startsWith('http')) return media;
    final base = AppConfig.mediaBaseUrl.replaceAll(RegExp(r'/$'), '');
    final path = media.startsWith('/') ? media : '/$media';
    return '$base$path';
  }
  if (media is Map<String, dynamic>) {
    final url = media['url'] as String?;
    if (url != null && url.isNotEmpty) {
      return url.startsWith('http') ? url : resolveMediaUrl(url);
    }
    final variants = media['variants'];
    if (variants is Map<String, dynamic>) {
      for (final size in const ['medium', 'large', 'small', 'thumb']) {
        final formats = (variants[size] as Map<String, dynamic>?)?['formats']
            as Map<String, dynamic>?;
        if (formats == null) continue;
        final best =
            (formats['webp'] ?? formats['jpg'] ?? formats['avif']) as String?;
        if (best != null && best.isNotEmpty) return best;
      }
    }
    final path = media['path'] as String?;
    if (path != null && path.isNotEmpty) return resolveMediaUrl(path);
  }
  return '';
}

String pickProductImage(Map<String, dynamic> json) {
  final images = json['images'];
  if (images is List) {
    for (final img in images) {
      if (img is Map<String, dynamic>) {
        final url = resolveMediaUrl(img['media']);
        if (url.isNotEmpty) return url;
      }
    }
  }
  return 'https://placehold.co/600x600/f5f5f7/4a2466/png?text=Alhayaa';
}
