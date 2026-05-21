import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/reveal.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    await ref.read(authProvider.notifier).login(
          _phoneController.text,
          _passwordController.text,
        );
    if (mounted) {
      setState(() => _loading = false);
      context.go(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Decorative top circle
          Positioned(
            top: -160,
            right: -120,
            child: Container(
              width: 360,
              height: 360,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.goldSoft.withValues(alpha: 0.7),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -180,
            left: -120,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primarySoft.withValues(alpha: 0.8),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSizes.xxl,
                vertical: AppSizes.lg,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 32),
                    // Logo medallion
                    Reveal(
                      offset: const Offset(0, 20),
                      child: Center(
                        child: Container(
                          width: 84,
                          height: 84,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                AppColors.primaryDark,
                                AppColors.primary,
                              ],
                              begin: Alignment.topRight,
                              end: Alignment.bottomLeft,
                            ),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.gold.withValues(alpha: 0.5),
                              width: 1.5,
                            ),
                            boxShadow: const [AppColors.plumShadow],
                          ),
                          child: Center(
                            child: Text(
                              'A',
                              style: AppTextStyles.serif(
                                color: AppColors.gold,
                                size: 38,
                                weight: FontWeight.w400,
                                style: FontStyle.italic,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Reveal(
                      delay: const Duration(milliseconds: 150),
                      child: Text(
                        AppStrings.appName,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.editorial(size: 32),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Reveal(
                      delay: const Duration(milliseconds: 240),
                      child: Center(child: Luxe.goldenRule(width: 60)),
                    ),
                    const SizedBox(height: 10),
                    Reveal(
                      delay: const Duration(milliseconds: 320),
                      child: Text(
                        AppStrings.tagline,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.caption(
                          color: AppColors.textMuted,
                          size: 11,
                        ).copyWith(letterSpacing: 2),
                      ),
                    ),
                    const SizedBox(height: 38),

                    // Welcome editorial line
                    Reveal(
                      delay: const Duration(milliseconds: 380),
                      child: Text(
                        'مرحباً بكِ من جديد',
                        style: AppTextStyles.title(size: 18).copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Reveal(
                      delay: const Duration(milliseconds: 440),
                      child: Text(
                        'سجّلي الدخول لاستكمال تجربتكِ الفاخرة.',
                        style: AppTextStyles.caption(
                          color: AppColors.textSecondary,
                          size: 12,
                        ),
                      ),
                    ),
                    const SizedBox(height: 26),

                    // Phone field
                    Reveal(
                      delay: const Duration(milliseconds: 500),
                      child: _LuxeField(
                        controller: _phoneController,
                        label: AppStrings.phone,
                        hint: '7XX XXX XXXX',
                        leadingIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        prefixLabel: '+964',
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(10),
                        ],
                        validator: Validators.phone,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Password field
                    Reveal(
                      delay: const Duration(milliseconds: 560),
                      child: _LuxeField(
                        controller: _passwordController,
                        label: AppStrings.password,
                        leadingIcon: Icons.lock_outline_rounded,
                        obscureText: _obscure,
                        validator: Validators.password,
                        suffix: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.textMuted,
                            size: 19,
                          ),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Reveal(
                      delay: const Duration(milliseconds: 620),
                      child: Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: TextButton(
                          onPressed: () => context.push(AppRoutes.forgotPassword),
                          child: Text(
                            AppStrings.forgotPassword,
                            style: AppTextStyles.caption(
                              color: AppColors.primaryDark,
                              size: 12,
                            ).copyWith(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Reveal(
                      delay: const Duration(milliseconds: 680),
                      child: Luxe.primaryButton(
                        label: AppStrings.login,
                        icon: Icons.arrow_back_rounded,
                        loading: _loading,
                        onTap: _login,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Reveal(
                      delay: const Duration(milliseconds: 740),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'ليس لديكِ حساب؟ ',
                            style: AppTextStyles.caption(
                              color: AppColors.textSecondary,
                              size: 12,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.push(AppRoutes.register),
                            child: Text(
                              AppStrings.createAccount,
                              style: AppTextStyles.caption(
                                color: AppColors.primaryDark,
                                size: 12,
                              ).copyWith(
                                fontWeight: FontWeight.w800,
                                decoration: TextDecoration.underline,
                                decorationColor: AppColors.gold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Divider with text
                    Reveal(
                      delay: const Duration(milliseconds: 800),
                      child: Row(
                        children: [
                          Expanded(child: Luxe.goldenRule(width: double.infinity)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            child: Text(
                              'تابعي عبر',
                              style: AppTextStyles.caption(
                                color: AppColors.textMuted,
                                size: 10.5,
                              ).copyWith(letterSpacing: 1.5),
                            ),
                          ),
                          Expanded(child: Luxe.goldenRule(width: double.infinity)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Reveal(
                      delay: const Duration(milliseconds: 860),
                      child: Row(
                        children: [
                          Expanded(
                            child: Luxe.outlinedButton(
                              label: 'Google',
                              icon: Icons.g_mobiledata_rounded,
                              onTap: () {},
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Luxe.outlinedButton(
                              label: 'Apple',
                              icon: Icons.apple_rounded,
                              onTap: () {},
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LuxeField extends StatelessWidget {
  const _LuxeField({
    required this.controller,
    required this.label,
    this.hint,
    this.leadingIcon,
    this.suffix,
    this.prefixLabel,
    this.obscureText = false,
    this.keyboardType,
    this.inputFormatters,
    this.validator,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? leadingIcon;
  final Widget? suffix;
  final String? prefixLabel;
  final bool obscureText;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.inputRadius),
        border: Border.all(color: AppColors.border),
        boxShadow: const [AppColors.softShadow],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          validator: validator,
          style: AppTextStyles.body(size: 13.5),
          decoration: InputDecoration(
            labelText: label,
            hintText: hint,
            labelStyle: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 12,
            ),
            hintStyle: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 12,
            ),
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            errorBorder: InputBorder.none,
            disabledBorder: InputBorder.none,
            filled: false,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 16,
            ),
            prefixIcon: leadingIcon == null
                ? null
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(leadingIcon, size: 18, color: AppColors.primaryDark),
                        if (prefixLabel != null) ...[
                          const SizedBox(width: 6),
                          Text(
                            prefixLabel!,
                            style: AppTextStyles.body(
                              color: AppColors.textPrimary,
                              size: 12.5,
                            ).copyWith(fontWeight: FontWeight.w800),
                          ),
                          Container(
                            margin: const EdgeInsets.symmetric(horizontal: 8),
                            width: 1,
                            height: 22,
                            color: AppColors.divider,
                          ),
                        ],
                      ],
                    ),
                  ),
            suffixIcon: suffix,
          ),
        ),
      ),
    );
  }
}
