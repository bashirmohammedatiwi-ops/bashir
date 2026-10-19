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
  /// رقم يُملأ مسبقاً — مثلاً حين تأتي من التسجيل برقم مسجّل أصلاً.
  final String? initialPhone;

  const LoginScreen({super.key, this.initialPhone});
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
  void initState() {
    super.initState();
    final phone = widget.initialPhone?.trim();
    if (phone != null && phone.isNotEmpty) _phone.text = phone;
  }

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
        // يحفظ مدير كلمات المرور الرقم وكلمة المرور معاً.
        TextInput.finishAutofillContext();
        _close();
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

  /// نجاح الدخول: نرجع لمكانها بنتيجة `true` (فتكمل الصفحة السابقة ما بدأته:
  /// المفضلة، الدفع…). وإن فُتحت من رابط (/signin) بلا صفحة تحتها: للرئيسية.
  void _close() => context.canPop() ? context.pop(true) : context.go('/');

  /// التسجيل فوق الدخول: نجاحه يُغلق الاثنين معاً، و«سجّلي الدخول» منه
  /// يرجع إلى هنا ومعه الرقم الذي كتبته.
  Future<void> _openRegister() async {
    final result = await context.push<Object?>('/register?from=login');
    if (!mounted) return;
    if (result == true) {
      _close();
    } else if (result is String && result.isNotEmpty) {
      _phone.text = result;
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return AuthShell(
      title: s.login,
      subtitle: s.loginPhoneSubtitle,
      eyebrow: s.welcomeBack,
      footer: ProfileLinkRow(
        prefix: s.noAccountYet,
        action: s.signUp,
        onTap: _openRegister,
      ),
      child: Form(
        key: _formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              authLabeledField(
                label: s.phoneNumber,
                field: TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  textDirection: TextDirection.ltr,
                  inputFormatters: phoneInputFormatters,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [
                    AutofillHints.username,
                    AutofillHints.telephoneNumber,
                  ],
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
      ),
    );
  }
}
