import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/utils/friendly_error.dart';
import '../../../core/utils/phone_util.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/language_toggle_bar.dart';
import '../auth_provider.dart';
import '../widgets/auth_shell.dart';
import '../../profile/widgets/profile_ui.dart';
import '../../worlds/world_theme.dart';

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
      await ref
          .read(authProvider.notifier)
          .login(_phone.text.trim(), _password.text);
      if (mounted) {
        HapticFeedback.mediumImpact();
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        AppSnackbar.error(
          context,
          friendlyError(e, lang: ref.read(languageCodeProvider)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return AuthShell(
      title: s.login,
      subtitle: s.loginPhoneSubtitle,
      eyebrow: s.welcomeBack,
      onBack: () => context.pop(),
      footer: ProfileLinkRow(
        prefix: s.noAccountYet,
        action: s.signUp,
        onTap: () => context.push('/register'),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            authLabeledField(
              label: s.phoneNumber,
              field: TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumber],
                decoration: authFieldDecoration(
                  context,
                  label: s.phoneNumber,
                  hint: '07701234567',
                  icon: Icons.phone_iphone_rounded,
                ),
                validator: (v) => validateIraqiPhone(v),
              ),
            ),
            const SizedBox(height: 16),
            authLabeledField(
              label: s.password,
              field: TextFormField(
                controller: _password,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.password],
                onFieldSubmitted: (_) => _submit(),
                decoration: authFieldDecoration(
                  context,
                  label: s.password,
                  icon: Icons.lock_outline_rounded,
                  suffix: AuthPasswordToggle(
                    obscured: _obscure,
                    onToggle: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) =>
                    (v == null || v.length < 6) ? s.passwordMin6 : null,
              ),
            ),
            const SizedBox(height: 24),
            authPrimaryButton(
              label: s.login,
              onPressed: _loading ? null : _submit,
              loading: _loading,
            ),
            const SizedBox(height: 22),
            Divider(height: 1, color: context.worldTheme.divider),
            const SizedBox(height: 18),
            const LanguageToggleBar(embedded: true, showLabel: true),
          ],
        ),
      ),
    );
  }
}
