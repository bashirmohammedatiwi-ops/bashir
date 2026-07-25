import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/friendly_error.dart';
import '../../../core/utils/phone_util.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/language_toggle_bar.dart';
import '../auth_provider.dart';
import '../widgets/auth_shell.dart';
import '../../../features/cart/widgets/cart_theme.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    HapticFeedback.lightImpact();
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).register(
            name: _name.text.trim(),
            phone: _phone.text.trim(),
            password: _password.text,
          );
      if (mounted) {
        HapticFeedback.mediumImpact();
        context.go('/');
      }
    } catch (e) {
      if (!mounted) return;
      final lang = ref.read(languageCodeProvider);
      final msg = friendlyError(e, lang: lang);
      if (isPhoneAlreadyRegisteredError(e)) {
        AppSnackbar.action(
          context,
          message: msg,
          actionLabel: ref.s.signIn,
          onAction: () => context.pop(),
        );
      } else {
        AppSnackbar.error(context, msg);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return Scaffold(
      backgroundColor: CartTheme.bg,
      body: Column(
        children: [
          const LanguageToggleBar(),
          Expanded(
            child: AuthShell(
              title: s.registerJoinTitle,
              subtitle: s.registerPhoneSubtitle,
              onBack: () => context.pop(),
              footer: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(s.haveAccountAlready, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                  TextButton(onPressed: () => context.pop(), child: Text(s.signIn)),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _name,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.name],
                      decoration: authFieldDecoration(label: s.fullName, icon: Icons.person_outline_rounded),
                      validator: (v) => (v == null || v.trim().length < 2) ? s.enterYourName : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.telephoneNumber],
                      decoration: authFieldDecoration(
                        label: s.phoneNumber,
                        hint: '07701234567',
                        icon: Icons.phone_outlined,
                      ),
                      validator: (v) => validateIraqiPhone(v),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.newPassword],
                      onFieldSubmitted: (_) => _submit(),
                      decoration: authFieldDecoration(
                        label: s.password,
                        icon: Icons.lock_outline_rounded,
                        suffix: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => (v == null || v.length < 6) ? s.passwordMin6 : null,
                    ),
                    const SizedBox(height: 22),
                    authPrimaryButton(
                      label: s.createAccount,
                      onPressed: _loading ? null : _submit,
                      loading: _loading,
                    ),
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
