import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// ثيم صفحة السلة — نظيف وفاخر.
abstract final class CartTheme {
  static const bg = Color(0xFFFAFAFA);
  static const card = Colors.white;
  static const radiusLg = 18.0;
  static const radiusMd = 14.0;
  static const radiusSm = 10.0;
  static const hPad = 16.0;
  static const itemGap = 10.0;
  static const imageSize = 92.0;

  static BoxDecoration cardDecoration({Color? borderColor}) => BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(radiusLg),
        border: Border.all(color: borderColor ?? AppColors.hairline),
      );

  static BoxDecoration heroDecoration() => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            AppColors.blush,
            AppColors.scaffold,
            CartTheme.bg,
          ],
        ),
      );
}
