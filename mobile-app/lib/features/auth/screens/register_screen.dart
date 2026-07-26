import 'package:flutter/gestures.dart';
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
import '../../../features/settings/legal_document_screen.dart';
import '../../cart/widgets/cart_theme.dart';
import '../auth_provider.dart';
import '../widgets/auth_shell.dart';
import '../../profile/widgets/profile_ui.dart';

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
  bool _acceptedTerms = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_acceptedTerms) {
      AppSnackbar.error(context, ref.s.mustAcceptTerms);
      return;
    }
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
    return AuthShell(
      title: s.register,
      subtitle: s.registerPhoneSubtitle,
      onBack: () => context.pop(),
      footer: ProfileLinkRow(
        prefix: s.haveAccountAlready,
        action: s.signIn,
        onTap: () => context.pop(),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            authLabeledField(
              label: s.fullName,
              field: TextFormField(
                controller: _name,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.name],
                decoration: authFieldDecoration(label: s.fullName),
                validator: (v) => (v == null || v.trim().length < 2) ? s.enterYourName : null,
              ),
            ),
            const SizedBox(height: 18),
            authLabeledField(
              label: s.phoneNumber,
              field: TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumber],
                decoration: authFieldDecoration(label: s.phoneNumber, hint: '07701234567'),
                validator: (v) => validateIraqiPhone(v),
              ),
            ),
            const SizedBox(height: 18),
            authLabeledField(
              label: s.password,
              field: TextFormField(
                controller: _password,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.newPassword],
                onFieldSubmitted: (_) => _submit(),
                decoration: authFieldDecoration(
                  label: s.password,
                  suffix: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => (v == null || v.length < 6) ? s.passwordMin6 : null,
              ),
            ),
            const SizedBox(height: 14),
            _TermsCheckbox(
              s: s,
              value: _acceptedTerms,
              onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
            ),
            const SizedBox(height: 20),
            authPrimaryButton(
              label: s.createAccount,
              onPressed: _loading ? null : _submit,
              loading: _loading,
            ),
            const SizedBox(height: 28),
            const LanguageToggleBar(embedded: true, showLabel: true),
          ],
        ),
      ),
    );
  }
}

class _TermsCheckbox extends StatelessWidget {
  final AppStrings s;
  final bool value;
  final ValueChanged<bool?> onChanged;

  const _TermsCheckbox({
    required this.s,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Checkbox(value: value, onChanged: onChanged, visualDensity: VisualDensity.compact),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 10),
            child: RichText(
              text: TextSpan(
                style: TextStyle(fontSize: 12.5, color: Colors.black.withValues(alpha: 0.72), height: 1.45),
                children: [
                  TextSpan(text: s.isAr ? 'أوافق على ' : 'I agree to '),
                  TextSpan(
                    text: s.termsOfService,
                    style: const TextStyle(color: CartTheme.brand, fontWeight: FontWeight.w700),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () => openLegalDocument(context, LegalDocumentType.terms),
                  ),
                  TextSpan(text: s.isAr ? ' و' : ' and '),
                  TextSpan(
                    text: s.privacyPolicy,
                    style: const TextStyle(color: CartTheme.brand, fontWeight: FontWeight.w700),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () => openLegalDocument(context, LegalDocumentType.privacy),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
