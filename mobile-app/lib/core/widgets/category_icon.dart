import 'package:flutter/material.dart';
import 'cached_image_widget.dart';

/// أيقونة فئة: صورة شبكة إن وُجدت، وإلا رمز/إيموجي.
class CategoryIcon extends StatelessWidget {
  const CategoryIcon({
    super.key,
    required this.icon,
    this.size = 56,
    this.fit = BoxFit.cover,
    this.fallbackStyle,
  });

  final String icon;
  final double size;
  final BoxFit fit;
  final TextStyle? fallbackStyle;

  static bool isNetworkUrl(String value) =>
      value.startsWith('http://') || value.startsWith('https://');

  @override
  Widget build(BuildContext context) {
    if (isNetworkUrl(icon)) {
      return ClipOval(
        child: CachedImageWidget(
          imageUrl: icon,
          width: size,
          height: size,
          fit: fit,
        ),
      );
    }
    return Center(
      child: Text(
        icon.isNotEmpty ? icon : '🛍️',
        style: fallbackStyle ?? TextStyle(fontSize: size * 0.46),
      ),
    );
  }
}
