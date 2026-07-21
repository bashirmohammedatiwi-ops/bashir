import 'package:flutter/material.dart';

import '../../data/models/home_feed.dart';
import 'image_cache.dart';

/// يحمّل مسبقاً صور البنرات وأغلفة المنتجات الظاهرة في الرئيسية.
void precacheHomeFeedImages(BuildContext context, HomeFeed feed) {
  final screenW = MediaQuery.sizeOf(context).width;
  final bannerUrls = <String>[];
  final productUrls = <String>[];
  final otherUrls = <String>[];

  void addUnique(List<String> bucket, String url) {
    if (url.isEmpty || bucket.contains(url)) return;
    bucket.add(url);
  }

  for (final section in feed.sections) {
    for (final banner in section.banners) {
      addUnique(bannerUrls, banner.imageUrl);
    }
    for (final cat in section.categories) {
      addUnique(otherUrls, cat.imageUrl);
    }
    for (final product in section.products.take(8)) {
      addUnique(productUrls, product.coverUrl);
    }
    for (final brand in section.brands) {
      addUnique(otherUrls, brand.logoUrl);
    }
  }

  for (final banner in feed.banners) {
    addUnique(bannerUrls, banner.imageUrl);
  }
  for (final product in [
    ...feed.flashSale.products.take(6),
    ...feed.bestSellers.take(6),
    ...feed.featured.take(6),
  ]) {
    addUnique(productUrls, product.coverUrl);
  }

  var count = 0;
  for (final url in bannerUrls) {
    if (count >= 8) break;
    precacheAppImage(context, url, layoutWidth: screenW);
    count++;
  }

  count = 0;
  for (final url in productUrls) {
    if (count >= 24) break;
    precacheAppImage(context, url, layoutWidth: 156);
    count++;
  }

  count = 0;
  for (final url in otherUrls) {
    if (count >= 12) break;
    precacheAppImage(context, url, layoutWidth: 96);
    count++;
  }
}
