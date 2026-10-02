import 'package:flutter/material.dart';

import '../../core/l10n/localized_text.dart';
import '../../core/utils/json.dart';
import 'category.dart';
import 'media.dart';

class StoreWorld {
  final String id;
  final String slug;
  final String nameAr;
  final String? nameEn;
  final String? taglineAr;
  final String? taglineEn;
  final String accentHex;
  final String canvasHex;
  final String inkHex;
  final String surfaceHex;
  final String coverUrl;
  final List<String> galleryUrls;
  final List<String> rootCategoryIds;
  final List<Category> categories;

  const StoreWorld({
    required this.id,
    required this.slug,
    required this.nameAr,
    this.nameEn,
    this.taglineAr,
    this.taglineEn,
    required this.accentHex,
    required this.canvasHex,
    required this.inkHex,
    required this.surfaceHex,
    this.coverUrl = '',
    this.galleryUrls = const [],
    this.rootCategoryIds = const [],
    this.categories = const [],
  });

  factory StoreWorld.fromJson(Map<String, dynamic> json) => StoreWorld(
        id: asString(json['id']),
        slug: asString(json['slug']),
        nameAr: asString(json['nameAr'], asString(json['name'])),
        nameEn: json['nameEn']?.toString(),
        taglineAr: json['taglineAr']?.toString(),
        taglineEn: json['taglineEn']?.toString(),
        accentHex: asString(json['accentColor'], '#9B6BD8'),
        canvasHex: asString(json['canvasColor'], '#FBF8FF'),
        inkHex: asString(json['inkColor'], '#1A1426'),
        surfaceHex: asString(json['surfaceColor'], '#FFFFFF'),
        coverUrl: _coverUrl(json['coverImage']),
        galleryUrls: _galleryUrls(json['gallery']),
        rootCategoryIds: json['rootCategoryIds'] is List
            ? (json['rootCategoryIds'] as List).map((e) => e.toString()).where((id) => id.isNotEmpty).toList()
            : const [],
        categories: asList(json['categories']).map(Category.fromJson).toList(),
      );

  String localizedName(String lang) => localizedText(
        languageCode: lang,
        ar: nameAr,
        en: nameEn,
        fallback: nameAr,
      );

  String localizedTagline(String lang) => localizedText(
        languageCode: lang,
        ar: taglineAr,
        en: taglineEn,
        fallback: '',
      );

  Color get accent => _hex(accentHex, const Color(0xFF9B6BD8));
  Color get canvas => _hex(canvasHex, const Color(0xFFFBF8FF));
  Color get ink => _hex(inkHex, const Color(0xFF1A1426));
  Color get surface => _hex(surfaceHex, Colors.white);

  bool get isGift =>
      slug == 'gift-moments' ||
      nameAr.contains('هدايا') ||
      nameAr.contains('تُهدى') ||
      nameAr.contains('تهدى');

  IconData get motif {
    switch (slug) {
      case 'beauty-spell':
        return Icons.brush_outlined;
      case 'care-rituals':
        return Icons.spa_outlined;
      case 'his-elegance':
        return Icons.face_outlined;
      case 'gift-moments':
        return Icons.card_giftcard_outlined;
      case 'scent-story':
        return Icons.air_outlined;
      default:
        return Icons.auto_awesome_outlined;
    }
  }
}

String _coverUrl(dynamic raw) {
  if (raw is! Map) return '';
  return AppMedia.fromJson(Map<String, dynamic>.from(raw)).hero;
}

List<String> _galleryUrls(dynamic raw) {
  if (raw is! List) return const [];
  final urls = <String>[];
  for (final item in raw) {
    if (item is! Map) continue;
    final map = Map<String, dynamic>.from(item);
    final media = map['media'] is Map ? map['media'] : map;
    if (media is! Map) continue;
    final url = AppMedia.fromJson(Map<String, dynamic>.from(media)).hero;
    if (url.isNotEmpty) urls.add(url);
  }
  return urls;
}

Color _hex(String raw, Color fallback) {
  var hex = raw.trim().replaceAll('#', '');
  if (hex.length == 6) hex = 'FF$hex';
  if (hex.length != 8) return fallback;
  final value = int.tryParse(hex, radix: 16);
  if (value == null) return fallback;
  return Color(value);
}
