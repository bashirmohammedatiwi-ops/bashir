import 'package:flutter/material.dart';

import '../../../core/config/app_config.dart';
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
            // لحظة العلامة التجارية — الفراشة بتوهج ناعم.
            Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          CartTheme.brandSoft,
                          Colors.white,
                          CartTheme.brandWash,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: CartTheme.brand.withValues(alpha: 0.16),
                          blurRadius: 26,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(14),
                    child: Image.asset('assets/images/alhayaa_butterfly.png'),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    Localizations.localeOf(context).languageCode == 'ar'
                        ? AppConfig.storeName
                        : 'Deema Alhayat',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: CartTheme.brandDark,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
            if (subtitle != null && subtitle!.isNotEmpty) ...[
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13.5,
                  height: 1.45,
                  color: CartTheme.charcoal.withValues(alpha: 0.55),
                ),
              ),
              const SizedBox(height: 22),
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
