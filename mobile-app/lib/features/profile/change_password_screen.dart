import '../../core/widgets/app_snackbar.dart';
import '../../core/utils/friendly_error.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/auth_gate.dart';
import '../../data/services/api_service.dart';
import '../auth/widgets/auth_shell.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  bool _obscureCurrent = true;
  bool _obscureNext = true;
  bool _obscureConfirm = true;

  /// رفض السيرفر كلمة المرور الحالية — يظهر تحت حقلها ويُمسح عند تعديله.
  String? _currentError;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _currentError = null;
    });
    try {
      await ref
          .read(apiServiceProvider)
          .changePassword(
            currentPassword: _current.text,
            newPassword: _next.text,
          );
      if (!mounted) return;
      // الرموز الجديدة لهذه الجلسة يحفظها dioProvider من الرد نفسه.
      AppSnackbar.success(context, ref.s.passwordChangedSuccess);
      context.canPop() ? context.pop() : context.go('/');
    } catch (e) {
      if (!mounted) return;
      final message = friendlyError(e, lang: ref.s.lang);
      if (e is ApiException && e.status == 400 && e.code == 'WRONG_CURRENT_PASSWORD') {
        setState(() => _currentError = message);
      } else {
        AppSnackbar.error(context, message);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return AuthGate(
      title: s.changePassword,
      emptyTitle: s.loginToChangePassword,
      child: ProfileScaffold(
        title: s.changePassword,
        floatingBottom: ProfilePrimaryButton(
          label: s.save,
          onPressed: _loading ? null : _submit,
          loading: _loading,
        ),
        body: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.fromLTRB(
            ProfileUi.hPad,
            20,
            ProfileUi.hPad,
            24,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: AccountTheme.iconTile(
                    context,
                    Icons.lock_outline_rounded,
                    size: 64,
                  ),
                ),
                const SizedBox(height: 16),
                ProfileInfoBanner(
                  icon: Icons.info_outline_rounded,
                  text: s.changePasswordInstructions,
                ),
                const SizedBox(height: 20),
                ProfileSurfaceCard(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      authLabeledField(
                        label: s.currentPassword,
                        field: TextFormField(
                          controller: _current,
                          obscureText: _obscureCurrent,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.password],
                          onChanged: (_) {
                            if (_currentError != null) setState(() => _currentError = null);
                          },
                          decoration: authFieldDecoration(
                            context,
                            label: s.currentPassword,
                            icon: Icons.lock_outline_rounded,
                            suffix: AuthPasswordToggle(
                              obscured: _obscureCurrent,
                              onToggle: () => setState(
                                () => _obscureCurrent = !_obscureCurrent,
                              ),
                            ),
                          ).copyWith(errorText: _currentError),
                          validator: (v) => (v == null || v.length < 6)
                              ? s.passwordMin6
                              : null,
                        ),
                      ),
                      const SizedBox(height: 16),
                      authLabeledField(
                        label: s.newPassword,
                        field: TextFormField(
                          controller: _next,
                          obscureText: _obscureNext,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.newPassword],
                          decoration: authFieldDecoration(
                            context,
                            label: s.newPassword,
                            icon: Icons.key_rounded,
                            suffix: AuthPasswordToggle(
                              obscured: _obscureNext,
                              onToggle: () =>
                                  setState(() => _obscureNext = !_obscureNext),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.length < 6) return s.passwordMin6;
                            if (v == _current.text) return s.acctNewPasswordSame;
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      authLabeledField(
                        label: s.confirmPassword,
                        field: TextFormField(
                          controller: _confirm,
                          obscureText: _obscureConfirm,
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.newPassword],
                          onFieldSubmitted: (_) => _loading ? null : _submit(),
                          decoration: authFieldDecoration(
                            context,
                            label: s.confirmPassword,
                            icon: Icons.key_rounded,
                            suffix: AuthPasswordToggle(
                              obscured: _obscureConfirm,
                              onToggle: () => setState(
                                () => _obscureConfirm = !_obscureConfirm,
                              ),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return s.confirmPasswordRequired;
                            }
                            if (v != _next.text) return s.passwordsDoNotMatch;
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
