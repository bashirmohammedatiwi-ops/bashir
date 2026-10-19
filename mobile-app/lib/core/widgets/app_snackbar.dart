import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';
import '../theme/app_fonts.dart';
import '../theme/app_spacing.dart';
import '../theme/app_text.dart';
import '../utils/responsive.dart';

/// ارتفاع شريط التنقل العائم في الـ shell — يضعه MainShell فوق التبويبات ليظهر كل
/// إشعار فوق الشريط لا عليه.
class ShellDockInsets extends InheritedWidget {
  /// ارتفاع منطقة الشريط من أسفل الشاشة (يشمل منطقة النظام الآمنة).
  final double height;

  const ShellDockInsets({super.key, required this.height, required super.child});

  /// لا يُنشئ اعتماداً: يُقرأ لحظة إظهار الإشعار لا أثناء البناء.
  static ShellDockInsets? maybeOf(BuildContext context) =>
      context.getInheritedWidgetOfExactType<ShellDockInsets>();

  @override
  bool updateShouldNotify(ShellDockInsets oldWidget) => oldWidget.height != height;
}

/// Snackbar موحّد — نجاح، خطأ، معلومات.
abstract final class AppSnackbar {
  /// هامش الإشعار العائم — واحد لكل الأنواع.
  ///
  /// Scaffold يرفع الإشعار العائم فوق منطقة النظام الآمنة وفوق `bottomNavigationBar`
  /// بنفسه، فلا نضيف أيّاً منهما مرة ثانية؛ الهامش يغطي فقط ما يرسمه التطبيق فوق المحتوى.
  static EdgeInsets _margin(BuildContext context) =>
      EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, _bottomOffset(context));

  static double _bottomOffset(BuildContext context) {
    final safeBottom = _safeBottom(context);
    // شريط التنقل العائم في الـ shell (ليس bottomNavigationBar، فلا يحسبه Scaffold).
    final dock = ShellDockInsets.maybeOf(context)?.height;
    if (dock != null) return math.max(0.0, dock - safeBottom) + AppSpacing.sm;

    // صفحة شريطها السفلي في Scaffold.bottomNavigationBar: الإشعار يظهر فوقه تلقائياً.
    final scaffold = context.findRootAncestorStateOfType<ScaffoldState>();
    if (scaffold?.widget.bottomNavigationBar != null) return AppSpacing.lg;

    final path = GoRouter.maybeOf(context)?.state.uri.path ?? '';
    if (path == '/') {
      return math.max(0.0, Responsive.shellNavDockHeight(context) - safeBottom) + AppSpacing.sm;
    }
    // شريط الشراء مرسوم فوق المحتوى لا في bottomNavigationBar (~78 فوق المنطقة الآمنة).
    if (path.startsWith('/product/')) return 78;
    if (path.startsWith('/package/')) return 92;
    return AppSpacing.lg;
  }

  /// المنطقة الآمنة كما يراها Scaffold الجذري (لا كما بعد SafeArea داخلي).
  /// مع لوحة المفاتيح يتجاهلها Scaffold، فنتجاهلها نحن أيضاً.
  static double _safeBottom(BuildContext context) {
    final view = MediaQueryData.fromView(View.of(context));
    return view.viewInsets.bottom > 0 ? 0 : view.viewPadding.bottom;
  }

  static const ShapeBorder _shape =
      RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(AppCorners.md)));

  static void show(BuildContext context, String message, {Duration? duration}) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text(message, style: appFont(color: Colors.white, fontWeight: FontWeight.w600)),
          duration: duration ?? const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
          margin: _margin(context),
          shape: _shape,
        ),
      );
  }

  static void success(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: Text(message, style: appFont(color: Colors.white, fontWeight: FontWeight.w600))),
            ],
          ),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
          margin: _margin(context),
          shape: _shape,
        ),
      );
  }

  /// إشعار إضافة للسلة — يختفي تلقائياً فوق شريط التنقل/زر الإضافة.
  static void cartAdded(
    BuildContext context, {
    required String title,
    String? productName,
    String? viewCartLabel,
    VoidCallback? onViewCart,
  }) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          elevation: 0,
          backgroundColor: Colors.transparent,
          padding: EdgeInsets.zero,
          behavior: SnackBarBehavior.floating,
          dismissDirection: DismissDirection.down,
          margin: _margin(context),
          duration: const Duration(milliseconds: 2200),
          content: Container(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 10, 12),
            decoration: BoxDecoration(
              color: AppColors.ink,
              borderRadius: BorderRadius.circular(AppCorners.md),
              boxShadow: [
                BoxShadow(
                  color: AppColors.ink.withValues(alpha: 0.22),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(AppCorners.sm),
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Color(0xFF6EE7A8),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                      ),
                      if (productName != null && productName.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          productName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.72),
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (onViewCart != null && viewCartLabel != null)
                  TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).hideCurrentSnackBar();
                      onViewCart();
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.rose,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: const Size(kMinTapTarget, kMinTapTarget),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      viewCartLabel,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
  }

  static void error(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: Text(message, style: appFont(color: Colors.white, fontWeight: FontWeight.w600))),
            ],
          ),
          backgroundColor: AppColors.sale,
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
          margin: _margin(context),
          shape: _shape,
        ),
      );
  }

  static void action(
    BuildContext context, {
    required String message,
    required String actionLabel,
    required VoidCallback onAction,
  }) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          // زر الإجراء لا يُبقي الإشعار ظاهراً للأبد (افتراضي فلاتر الجديد).
          persist: false,
          content: Text(message, style: appFont(color: Colors.white, fontWeight: FontWeight.w600)),
          backgroundColor: AppColors.ink,
          duration: const Duration(seconds: 3),
          action: SnackBarAction(
            label: actionLabel,
            textColor: AppColors.rose,
            onPressed: onAction,
          ),
          behavior: SnackBarBehavior.floating,
          margin: _margin(context),
          shape: _shape,
        ),
      );
  }
}
