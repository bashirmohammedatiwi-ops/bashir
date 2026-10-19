import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../features/worlds/world_theme.dart';
import '../theme/app_shadows.dart';
import '../theme/app_text.dart';

/// شريط بحث موحّد مع زر مسح الباركود — بألوان العالم النشط.
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

  static const _radius = 14.0;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fill = fillColor ?? t.surface;
    final border = borderColor ?? t.hairline.withValues(alpha: 0.85);
    // الحافة الخارجية لمنطقة البحث في جهة البداية — يمين العربية ويسار الإنجليزية.
    final searchRadius = const BorderRadiusDirectional.horizontal(
      start: Radius.circular(_radius),
    ).resolve(Directionality.of(context));

    void scan() {
      HapticFeedback.lightImpact();
      onScanTap();
    }

    return Container(
      height: height,
      // القصّ يُبقي التموّج داخل الحواف المستديرة في الاتجاهين.
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(_radius),
        border: Border.all(color: border, width: 0.8),
        boxShadow: AppShadows.card(t),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  HapticFeedback.selectionClick();
                  onSearchTap();
                },
                borderRadius: searchRadius,
                child: Padding(
                  padding: const EdgeInsetsDirectional.only(start: 14, end: 8),
                  child: Row(
                    children: [
                      Icon(Icons.search_rounded, size: 20, color: t.inkMuted.withValues(alpha: 0.9)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          hint,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodySmall.copyWith(
                            height: 1.2,
                            color: t.inkMuted.withValues(alpha: 0.95),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // كامل ارتفاع الشريط يستجيب للمس (لا الحبة وحدها) — هدف لمس أوسع.
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            excludeFromSemantics: true,
            onTap: scan,
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(0, 5, 5, 5),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: t.signatureGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: scan,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 11),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.barcode_reader, size: 16, color: Colors.white),
                          const SizedBox(width: 5),
                          Text(
                            scanLabel,
                            style: AppText.micro.copyWith(
                              color: Colors.white,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ),
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
