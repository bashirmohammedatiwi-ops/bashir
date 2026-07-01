import 'package:flutter/material.dart';

import '../../data/models/home_feed.dart';
import 'image_cache.dart';

/// يحمّل مسبقاً صور البنرات وأغلفة المنتجات الظاهرة في الرئيسية.
void precacheHomeFeedImages(BuildContext context, HomeFeed feed) {
  final urls = <String>{};

  for (final section in feed.sections) {
    for (final banner in section.banners) {
      if (banner.imageUrl.isNotEmpty) urls.add(banner.imageUrl);
    }
    for (final cat in section.categories) {
      if (cat.imageUrl.isNotEmpty) urls.add(cat.imageUrl);
    }
    for (final product in section.products.take(10)) {
      if (product.coverUrl.isNotEmpty) urls.add(product.coverUrl);
    }
    for (final brand in section.brands) {
      if (brand.logoUrl.isNotEmpty) urls.add(brand.logoUrl);
    }
  }

  for (final banner in feed.banners) {
    if (banner.imageUrl.isNotEmpty) urls.add(banner.imageUrl);
  }
  for (final product in [
    ...feed.flashSale.products.take(6),
    ...feed.bestSellers.take(6),
    ...feed.featured.take(6),
  ]) {
    if (product.coverUrl.isNotEmpty) urls.add(product.coverUrl);
  }

  var count = 0;
  for (final url in urls) {
    if (count >= 24) break;
    precacheAppImage(context, url, layoutWidth: 148);
    count++;
  }
}
