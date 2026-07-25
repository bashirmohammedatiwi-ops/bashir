import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/auth_gate.dart';
import '../../data/services/api_service.dart';
import '../auth/widgets/auth_shell.dart';
import '../cart/widgets/cart_theme.dart';
import 'widgets/profile_ui.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
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

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).changePassword(
            currentPassword: _current.text,
            newPassword: _next.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تغيير كلمة المرور بنجاح')),
      );
      context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
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
          padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 16, ProfileUi.hPad, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: CartTheme.brandSoft,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: CartTheme.brand.withValues(alpha: 0.12),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.lock_outline_rounded, size: 36, color: CartTheme.brand),
                  ),
                ),
                const SizedBox(height: 16),
                ProfileInfoBanner(
                  icon: Icons.info_outline_rounded,
                  text: s.isAr
                      ? 'أدخلي كلمة المرور الحالية ثم اختاري كلمة مرور جديدة (6 أحرف على الأقل).'
                      : 'Enter your current password, then choose a new one (at least 6 characters).',
                ),
                const SizedBox(height: 20),
                ProfileSurfaceCard(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      authLabeledField(
                        label: s.isAr ? 'كلمة المرور الحالية' : 'Current password',
                        field: TextFormField(
                          controller: _current,
                          obscureText: _obscureCurrent,
                          decoration: authFieldDecoration(
                            label: '',
                            suffix: IconButton(
                              icon: Icon(_obscureCurrent ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                              onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                            ),
                          ),
                          validator: (v) => (v == null || v.length < 6) ? s.passwordMin6 : null,
                        ),
                      ),
                      const SizedBox(height: 16),
                      authLabeledField(
                        label: s.isAr ? 'كلمة المرور الجديدة' : 'New password',
                        field: TextFormField(
                          controller: _next,
                          obscureText: _obscureNext,
                          decoration: authFieldDecoration(
                            label: '',
                            suffix: IconButton(
                              icon: Icon(_obscureNext ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                              onPressed: () => setState(() => _obscureNext = !_obscureNext),
                            ),
                          ),
                          validator: (v) => (v == null || v.length < 6) ? s.passwordMin6 : null,
                        ),
                      ),
                      const SizedBox(height: 16),
                      authLabeledField(
                        label: s.isAr ? 'تأكيد كلمة المرور' : 'Confirm password',
                        field: TextFormField(
                          controller: _confirm,
                          obscureText: _obscureConfirm,
                          decoration: authFieldDecoration(
                            label: '',
                            suffix: IconButton(
                              icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return s.isAr ? 'أكّدي كلمة المرور' : 'Confirm password';
                            if (v != _next.text) return s.isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
