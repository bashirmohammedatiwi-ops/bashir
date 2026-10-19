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
import '../auth_provider.dart';
import '../widgets/auth_shell.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../profile/widgets/account_strings.dart';
import '../../profile/widgets/profile_ui.dart';
import '../../../features/worlds/world_theme.dart';

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
      await ref
          .read(authProvider.notifier)
          .register(
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
          onAction: _openLogin,
        );
      } else {
        AppSnackbar.error(context, msg);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// صفحة الدخول تحتها عادةً؛ وإن فُتحت من رابط (/signup) وحدها نفتح الدخول.
  void _openLogin() {
    if (!mounted) return;
    context.canPop() ? context.pop() : context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return AuthShell(
      title: s.register,
      subtitle: s.registerPhoneSubtitle,
      eyebrow: s.registerJoinTitle,
      footer: ProfileLinkRow(
        prefix: s.haveAccountAlready,
        action: s.signIn,
        onTap: _openLogin,
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
                decoration: authFieldDecoration(
                  context,
                  label: s.fullName,
                  icon: Icons.person_outline_rounded,
                ),
                validator: (v) =>
                    (v == null || v.trim().length < 2) ? s.enterYourName : null,
              ),
            ),
            const SizedBox(height: 16),
            authLabeledField(
              label: s.phoneNumber,
              field: TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                textDirection: TextDirection.ltr,
                inputFormatters: phoneInputFormatters,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumber],
                decoration: authFieldDecoration(
                  context,
                  label: s.phoneNumber,
                  hint: '07701234567',
                  icon: Icons.phone_iphone_rounded,
                ),
                validator: (v) => validateIraqiPhone(v, lang: s.lang),
              ),
            ),
            const SizedBox(height: 16),
            authLabeledField(
              label: s.password,
              field: TextFormField(
                controller: _password,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.newPassword],
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
    final t = context.worldTheme;
    final linkStyle = AppText.bodySmall.copyWith(
      color: t.accentDark,
      fontWeight: FontWeight.w700,
    );
    return Semantics(
      checked: value,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppCorners.sm),
        onTap: () {
          HapticFeedback.selectionClick();
          onChanged(!value);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: kMinTapTarget,
                height: kMinTapTarget,
                child: Checkbox(value: value, onChanged: onChanged),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text.rich(
                    TextSpan(
                      style: AppText.bodySmall.copyWith(color: t.inkSoft),
                      children: [
                        TextSpan(text: s.acctIAgreeTo),
                        TextSpan(
                          text: s.termsOfService,
                          style: linkStyle,
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => openLegalDocument(
                              context,
                              LegalDocumentType.terms,
                            ),
                        ),
                        TextSpan(text: s.acctAnd),
                        TextSpan(
                          text: s.privacyPolicy,
                          style: linkStyle,
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => openLegalDocument(
                              context,
                              LegalDocumentType.privacy,
                            ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
