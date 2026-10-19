import 'dart:async';

import 'package:flutter/material.dart';

import '../../data/models/home_feed.dart';
import 'image_cache.dart';

/// مهلة الدفعة الثانية — بعد أن تأخذ صور أول شاشة حقّها من الشبكة.
const _deferredDelay = Duration(milliseconds: 1500);

Timer? _deferred;

/// يسخّن كاش القرص لصور الرئيسية دون فكّها: أول 4 بنرات وأول صف منتجات فوراً،
/// والباقي بعد 1.5 ثانية — بطابور لا يتجاوز 4 تنزيلات متزامنة.
void precacheHomeFeedImages(BuildContext context, HomeFeed feed) {
  final bannerUrls = <String>[];
  final firstRail = <String>[];
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
    // أول صف منتجات بالترتيب هو ما يظهر أولاً تحت البنر.
    final rail = firstRail.isEmpty ? firstRail : productUrls;
    for (final product in section.products.take(8)) {
      addUnique(rail, product.coverUrl);
    }
    for (final brand in section.brands) {
      addUnique(otherUrls, brand.logoUrl);
    }
  }

  for (final banner in feed.banners) {
    addUnique(bannerUrls, banner.imageUrl);
  }
  for (final list in [
    feed.flashSale.products.take(6),
    feed.bestSellers.take(6),
    feed.featured.take(6),
  ]) {
    final rail = firstRail.isEmpty ? firstRail : productUrls;
    for (final product in list) {
      addUnique(rail, product.coverUrl);
    }
  }

  final banners = bannerUrls.take(8).toList();
  final products = productUrls.where((u) => !firstRail.contains(u)).take(24 - firstRail.length).toList();

  _deferred?.cancel();
  warmImageDiskCache([...banners.take(4), ...firstRail]);
  _deferred = Timer(_deferredDelay, () {
    _deferred = null;
    warmImageDiskCache([...banners.skip(4), ...products, ...otherUrls.take(12)]);
  });
}
