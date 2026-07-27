import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';

/// شريط بحث موحّد مع زر مسح الباركود.
class AppSearchScanBar extends StatelessWidget {
  final String hint;
  final String scanLabel;
  final VoidCallback onSearchTap;
  final VoidCallback onScanTap;
  final double height;
  final Color? fillColor;
  final Color? borderColor;

  const AppSearchScanBar({
    super.key,
    required this.hint,
    required this.scanLabel,
    required this.onSearchTap,
    required this.onScanTap,
    this.height = 48,
    this.fillColor,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final fill = fillColor ?? Colors.white;
    final border = borderColor ?? AppColors.hairline.withValues(alpha: 0.85);

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border, width: 0.8),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  HapticFeedback.selectionClick();
                  onSearchTap();
                },
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
                child: Padding(
                  padding: const EdgeInsetsDirectional.only(start: 14, end: 8),
                  child: Row(
                    children: [
                      Icon(Icons.search_rounded, size: 20, color: AppColors.textMuted.withValues(alpha: 0.9)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          hint,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textMuted.withValues(alpha: 0.95),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 5),
            child: Material(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(10),
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onScanTap();
                },
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.barcode_reader, size: 16, color: Colors.white),
                      const SizedBox(width: 5),
                      Text(
                        scanLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
