import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_colors.dart';
import '../constants/app_routes.dart';
import '../constants/app_strings.dart';
import '../theme/text_styles.dart';
import '../../features/auth/providers/auth_provider.dart';

/// يطلب تسجيل الدخول قبل إجراء يحتاج حساباً (طلب، عناوين، …).
Future<bool> requireLogin(
  BuildContext context,
  WidgetRef ref, {
  String? message,
}) async {
  if (ref.read(isLoggedInProvider)) return true;

  final proceed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(
        AppStrings.loginRequiredTitle,
        style: AppTextStyles.title(),
      ),
      content: Text(
        message ?? AppStrings.loginRequiredMessage,
        style: AppTextStyles.body(size: 13),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: const Text('لاحقاً'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(
            AppStrings.login,
            style: AppTextStyles.body(color: AppColors.primary),
          ),
        ),
      ],
    ),
  );

  if (proceed == true && context.mounted) {
    context.push(AppRoutes.login);
  }
  return false;
}

bool isMemberOnlyRoute(String location) {
  const exact = {
    AppRoutes.checkout,
    AppRoutes.orders,
    AppRoutes.editProfile,
    AppRoutes.loyalty,
    AppRoutes.addresses,
    AppRoutes.notifications,
  };
  if (exact.contains(location)) return true;
  return location.startsWith('/orders/');
}
