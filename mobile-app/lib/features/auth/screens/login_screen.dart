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
import '../../../features/cart/widgets/cart_theme.dart';
import '../auth_provider.dart';
import '../widgets/auth_shell.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    HapticFeedback.lightImpact();
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).login(_phone.text.trim(), _password.text);
      if (mounted) {
        HapticFeedback.mediumImpact();
        context.pop();
      }
    } catch (e) {
      if (mounted) AppSnackbar.error(context, friendlyError(e, lang: ref.read(languageCodeProvider)));
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
            title: s.welcomeBack,
            subtitle: s.loginPhoneSubtitle,
            onBack: () => context.pop(),
            footer: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(s.noAccountYet, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                TextButton(onPressed: () => context.push('/register'), child: Text(s.signUp)),
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
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
                    autofillHints: const [AutofillHints.password],
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
                  authPrimaryButton(label: s.login, onPressed: _loading ? null : _submit, loading: _loading),
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
