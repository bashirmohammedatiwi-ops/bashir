import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

Widget buildPlatformNetworkImage({
  required String imageUrl,
  double? width,
  double? height,
  BoxFit fit = BoxFit.cover,
  int? memCacheWidth,
  int? memCacheHeight,
  required Widget Function() placeholder,
  required Widget Function() errorWidget,
}) {
  return CachedNetworkImage(
    imageUrl: imageUrl,
    width: width,
    height: height,
    fit: fit,
    memCacheWidth: memCacheWidth,
    memCacheHeight: memCacheHeight,
    fadeInDuration: const Duration(milliseconds: 200),
    fadeOutDuration: Duration.zero,
    filterQuality: FilterQuality.medium,
    placeholder: (_, __) => placeholder(),
    errorWidget: (_, __, ___) => errorWidget(),
  );
}
