// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

final _registeredViewTypes = <String>{};

/// صورة شبكة عبر عنصر HTML — تعمل على Chrome دون CORS (CanvasKit).
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
  final viewType = _viewTypeFor(imageUrl, fit);
  return SizedBox(
    width: width,
    height: height,
    child: HtmlElementView(viewType: viewType),
  );
}

String _viewTypeFor(String url, BoxFit fit) {
  final type = 'net-img-${url.hashCode.abs()}';
  if (_registeredViewTypes.contains(type)) return type;
  _registeredViewTypes.add(type);

  final objectFit = switch (fit) {
    BoxFit.contain => 'contain',
    BoxFit.cover => 'cover',
    BoxFit.fill => 'fill',
    BoxFit.fitWidth => 'scale-down',
    BoxFit.fitHeight => 'scale-down',
    BoxFit.none => 'none',
    BoxFit.scaleDown => 'scale-down',
  };

  ui_web.platformViewRegistry.registerViewFactory(type, (int _) {
    final img = html.ImageElement()
      ..src = url
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.objectFit = objectFit
      ..style.display = 'block';
    return img;
  });

  return type;
}
