import 'package:flutter/material.dart';

import '../../cart/widgets/cart_theme.dart';
import '../../profile/widgets/profile_ui.dart';

export '../../profile/widgets/profile_ui.dart' show ProfileFieldLabel, ProfilePrimaryButton, profileFieldDecoration;

/// شاشة مصادقة بسيطة — بدون أجزاء ثابتة، كل المحتوى قابل للتمرير.
class AuthShell extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? footer;
  final VoidCallback? onBack;

  const AuthShell({
    super.key,
    required this.title,
    this.subtitle,
    required this.child,
    this.footer,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return ProfileScaffold(
      title: title,
      onBack: onBack,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          ProfileUi.hPad,
          12,
          ProfileUi.hPad,
          MediaQuery.paddingOf(context).bottom + 24,
        ),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (subtitle != null && subtitle!.isNotEmpty) ...[
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  color: CartTheme.charcoal.withValues(alpha: 0.55),
                ),
              ),
              const SizedBox(height: 28),
            ] else
              const SizedBox(height: 8),
            child,
            if (footer != null) ...[
              const SizedBox(height: 20),
              footer!,
            ],
          ],
        ),
      ),
    );
  }
}

InputDecoration authFieldDecoration({
  required String label,
  String? hint,
  IconData? icon,
  Widget? suffix,
}) =>
    profileFieldDecoration(
      hint: hint,
      suffix: suffix,
      prefix: icon != null ? Icon(icon, color: CartTheme.brand, size: 20) : null,
    );

Widget authLabeledField({
  required String label,
  required Widget field,
}) =>
    Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileFieldLabel(label),
        field,
      ],
    );

Widget authPrimaryButton({
  required String label,
  required VoidCallback? onPressed,
  bool loading = false,
}) =>
    ProfilePrimaryButton(label: label, onPressed: onPressed, loading: loading);
