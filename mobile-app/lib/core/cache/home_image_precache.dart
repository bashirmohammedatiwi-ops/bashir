import 'package:flutter/material.dart';

import '../../data/models/home_feed.dart';
import '../perf/device_perf.dart';
import 'image_cache.dart';

/// عروض منطقية تقريبية لصور الرئيسية — تحدّد المقاس المسخَّن (thumb/small/…) حتى يطابق
/// ما ستنزّله الصور عند ظهورها، لا نسخة بمقاس آخر.
const _bannerInset = 32.0;
const _railImageWidth = 126.0;
const _tileImageWidth = 88.0;

/// رقم الدفعة الحالية: دفعة أحدث (تحديث الرئيسية/تبديل العالم) تُلغي ما تبقّى من سابقتها.
var _generation = 0;

/// يسخّن كاش القرص لصور الرئيسية دون فكّها: أول البنرات وأول صف منتجات فوراً،
/// والباقي بعد انتهاء الدفعة الأولى — بطابور لا يتجاوز 4 تنزيلات متزامنة.
///
/// الكمية حسب الجهاز: البسيط يسخّن أول ما يظهر فقط (4 بنرات + 4 منتجات) بلا دفعة ثانية؛
/// المتوسط أول منتجين من كل صف لاحق؛ القوي كل الصفوف.
void precacheHomeFeedImages(BuildContext context, HomeFeed feed) {
  final generation = ++_generation;
  clearWarmQueue();

  final screenW = MediaQuery.sizeOf(context).width;
  String banner(String url) => displayedImageUrl(context, url, screenW - _bannerInset);
  String product(String url) => displayedImageUrl(context, url, _railImageWidth);
  String tile(String url) => displayedImageUrl(context, url, _tileImageWidth);

  final low = DevicePerf.isLow;
  final perLaterRail = DevicePerf.pick(low: 0, mid: 2, high: 8);

  final bannerUrls = <String>[];
  final firstRail = <String>[];
  final productUrls = <String>[];
  final otherUrls = <String>[];

  void addUnique(List<String> bucket, String url) {
    if (url.isEmpty || bucket.contains(url)) return;
    bucket.add(url);
  }

  void addRail(Iterable<String> covers, int laterLimit) {
    // أول صف منتجات بالترتيب هو ما يظهر أولاً تحت البنر.
    if (firstRail.isEmpty) {
      for (final url in covers.take(low ? 4 : 8)) {
        addUnique(firstRail, product(url));
      }
      return;
    }
    for (final url in covers.take(laterLimit)) {
      addUnique(productUrls, product(url));
    }
  }

  for (final section in feed.sections) {
    for (final b in section.banners) {
      addUnique(bannerUrls, banner(b.imageUrl));
    }
    for (final cat in section.categories) {
      addUnique(otherUrls, tile(cat.imageUrl));
    }
    addRail(section.products.map((p) => p.coverUrl), perLaterRail);
    for (final brand in section.brands) {
      addUnique(otherUrls, tile(brand.logoUrl));
    }
  }

  for (final b in feed.banners) {
    addUnique(bannerUrls, banner(b.imageUrl));
  }
  for (final list in [feed.flashSale.products, feed.bestSellers, feed.featured]) {
    addRail(list.map((p) => p.coverUrl), DevicePerf.pick(low: 0, mid: 2, high: 6));
  }

  final firstBatch = [...bannerUrls.take(4), ...firstRail];
  final first = warmImageDiskCache(firstBatch);
  if (low) return;

  final products = productUrls.where((u) => !firstRail.contains(u)).take(24 - firstRail.length).toList();
  final rest = [...bannerUrls.skip(4).take(4), ...products, ...otherUrls.take(12)];
  if (rest.isEmpty) return;
  // الدفعة الثانية بعد أن تأخذ صور أول شاشة حقّها من الشبكة — لا بعد مهلة ثابتة.
  first.then((_) {
    if (generation == _generation) warmImageDiskCache(rest);
  });
}
