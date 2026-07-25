import 'package:flutter/material.dart';

import '../../cart/widgets/cart_theme.dart';

/// إطار موحّد لشاشات تسجيل الدخول والتسجيل.
class AuthShell extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  final Widget? footer;
  final VoidCallback? onBack;

  const AuthShell({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
    this.footer,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(8, 8, 16, 24),
          decoration: CartTheme.headerDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (onBack != null)
                IconButton(
                  onPressed: onBack,
                  icon: const Icon(Icons.arrow_forward_rounded, color: CartTheme.charcoal),
                ),
              const SizedBox(height: 4),
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        'assets/images/app_icon_source.png',
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: CartTheme.charcoal,
                              letterSpacing: -0.4,
                              height: 1.15,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            subtitle,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: CartTheme.charcoal.withValues(alpha: 0.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: CartTheme.cardDecoration(),
                child: child,
              ),
            ),
          ),
          if (footer != null)
            Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.paddingOf(context).bottom + 16),
              child: footer!,
            ),
        ],
      );
  }
}

InputDecoration authFieldDecoration({
  required String label,
  String? hint,
  IconData? icon,
  Widget? suffix,
}) =>
    InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: icon != null ? Icon(icon, color: CartTheme.brand, size: 20) : null,
      suffixIcon: suffix,
      filled: true,
      fillColor: CartTheme.brandWash,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: CartTheme.brandSoft),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: CartTheme.brand, width: 1.5),
      ),
    );

Widget authPrimaryButton({
  required String label,
  required VoidCallback? onPressed,
  bool loading = false,
}) =>
    SizedBox(
      height: 52,
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: onPressed == null ? null : CartTheme.brandGradient,
          color: onPressed == null ? CartTheme.brandSoft : null,
          borderRadius: BorderRadius.circular(999),
          boxShadow: onPressed == null
              ? null
              : [
                  BoxShadow(
                    color: CartTheme.brand.withValues(alpha: 0.28),
                    blurRadius: 14,
                    offset: const Offset(0, 5),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(999),
            child: Center(
              child: loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4),
                    )
                  : Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
