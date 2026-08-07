import '../../models/ai_autofill.dart';
import 'media_url.dart';

/// Temporary cache of media assets kept when deleting a product to re-add it.
class ReaddAssetsCache {
  ReaddAssetsCache._();

  static final Map<String, ReaddAssets> _byBarcode = {};

  static void save(String barcode, ReaddAssets assets) {
    final key = barcode.replaceAll(RegExp(r'\D'), '');
    if (key.isEmpty || assets.isEmpty) return;
    _byBarcode[key] = assets;
  }

  static ReaddAssets? take(String barcode) {
    final key = barcode.replaceAll(RegExp(r'\D'), '');
    if (key.isEmpty) return null;
    return _byBarcode.remove(key);
  }

  static ReaddAssets? peek(String barcode) {
    final key = barcode.replaceAll(RegExp(r'\D'), '');
    if (key.isEmpty) return null;
    return _byBarcode[key];
  }
}

class ReaddAssets {
  const ReaddAssets({
    required this.mediaIds,
    required this.images,
    this.urlToMediaId = const {},
  });

  final List<String> mediaIds;
  final List<AiAutofillImage> images;
  final Map<String, String> urlToMediaId;

  bool get isEmpty => mediaIds.isEmpty && images.isEmpty;
  bool get isNotEmpty => !isEmpty;

  /// Build from GET /products/:id payload.
  factory ReaddAssets.fromProductJson(Map<String, dynamic> product) {
    final mediaIds = <String>[];
    final images = <AiAutofillImage>[];
    final urlToMediaId = <String, String>{};

    final rawImages = product['images'];
    if (rawImages is! List) {
      return ReaddAssets(mediaIds: mediaIds, images: images, urlToMediaId: urlToMediaId);
    }

    for (final row in rawImages) {
      if (row is! Map) continue;
      final map = Map<String, dynamic>.from(row);
      final media = map['media'];
      String? mediaId = map['mediaId']?.toString();
      String? url;

      if (media is Map) {
        mediaId ??= media['id']?.toString();
        url = resolveMediaUrl(Map<String, dynamic>.from(media));
      }
      url ??= map['url']?.toString();
      url ??= map['thumbUrl']?.toString();

      if (mediaId != null && mediaId.isNotEmpty && !mediaIds.contains(mediaId)) {
        mediaIds.add(mediaId);
      }
      if (url != null && url.startsWith('http')) {
        images.add(
          AiAutofillImage(
            url: url,
            thumbUrl: url,
            title: 'صورة سابقة',
            source: 'previous-product',
          ),
        );
        if (mediaId != null && mediaId.isNotEmpty) {
          urlToMediaId[url] = mediaId;
        }
      }
    }

    return ReaddAssets(mediaIds: mediaIds, images: images, urlToMediaId: urlToMediaId);
  }
}
