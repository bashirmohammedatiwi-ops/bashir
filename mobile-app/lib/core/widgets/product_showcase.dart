import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../../data/models/product_model.dart';
import '../theme/product_visual_style.dart';
import '../utils/product_visuals.dart';
import 'cached_image_widget.dart';

/// Transparent PNG centered on a single solid color.
class ProductShowcase extends StatelessWidget {
  const ProductShowcase({
    super.key,
    required this.imageUrl,
    required this.style,
    this.width,
    this.height = 140,
    this.heroTag,
    this.borderRadius,
    this.fit = BoxFit.contain,
    this.showBackground = true,
  });

  final String imageUrl;
  final ProductVisualStyle style;
  final double? width;
  final double height;
  final String? heroTag;
  final BorderRadius? borderRadius;
  final BoxFit fit;

  /// When false, only the image is drawn (parent already paints the color).
  final bool showBackground;

  factory ProductShowcase.forProduct({
    Key? key,
    required String imageUrl,
    required ProductShowcaseLayout layout,
    required ProductModel product,
    double? width,
    double height = 140,
    String? heroTag,
    BorderRadius? borderRadius,
    bool showBackground = true,
  }) {
    return ProductShowcase(
      key: key,
      imageUrl: imageUrl,
      style: ProductVisuals.resolve(product, layout: layout),
      width: width,
      height: height,
      heroTag: heroTag,
      borderRadius: borderRadius,
      showBackground: showBackground,
    );
  }

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.zero;

    Widget content = SizedBox(
      width: width,
      height: height,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth.isFinite
              ? constraints.maxWidth
              : (width ?? 200);
          final h = constraints.maxHeight.isFinite
              ? constraints.maxHeight
              : height;
          final pad = math.min(w, h) * style.imagePaddingFactor;

          final image = CachedImageWidget(
            imageUrl: imageUrl,
            width: w - pad * 2,
            height: h - pad * 2,
            fit: fit,
            transparentPlaceholder: true,
          );

          return Stack(
            fit: StackFit.expand,
            children: [
              if (showBackground)
                ColoredBox(color: style.backgroundColor),
              Center(
                child: Padding(
                  padding: EdgeInsets.all(pad),
                  child: heroTag != null
                      ? Hero(tag: heroTag!, child: image)
                      : image,
                ),
              ),
            ],
          );
        },
      ),
    );

    if (borderRadius != null) {
      content = ClipRRect(borderRadius: radius, child: content);
    }

    return content;
  }
}
