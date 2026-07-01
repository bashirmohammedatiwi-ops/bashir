import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/auth_gate.dart';
import '../../data/services/api_service.dart';

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.sale),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthGate(
      title: 'تغيير كلمة المرور',
      emptyTitle: 'سجّل الدخول لتغيير كلمة المرور',
      child: Scaffold(
        appBar: AppBar(title: const Text('تغيير كلمة المرور')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة (6 أحرف على الأقل).',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _current,
                  obscureText: _obscureCurrent,
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور الحالية',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureCurrent ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                    ),
                  ),
                  validator: (v) =>
                      (v == null || v.length < 6) ? 'أدخل كلمة المرور الحالية' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _next,
                  obscureText: _obscureNext,
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور الجديدة',
                    prefixIcon: const Icon(Icons.lock_reset_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureNext ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscureNext = !_obscureNext),
                    ),
                  ),
                  validator: (v) =>
                      (v == null || v.length < 6) ? '6 أحرف على الأقل' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _confirm,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'تأكيد كلمة المرور الجديدة',
                    prefixIcon: const Icon(Icons.lock_reset_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'أكّد كلمة المرور';
                    if (v != _next.text) return 'كلمتا المرور غير متطابقتين';
                    return null;
                  },
                ),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4),
                        )
                      : const Text('حفظ كلمة المرور'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
