import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _terms = false;
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_terms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يجب الموافقة على الشروط')),
      );
      return;
    }
    setState(() => _loading = true);
    await ref.read(authProvider.notifier).register(
          _nameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text,
          phone: _phoneController.text.trim().isEmpty
              ? null
              : _phoneController.text.trim(),
        );
    if (mounted) {
      setState(() => _loading = false);
      context.go(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.register)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              CustomTextField(
                controller: _nameController,
                label: AppStrings.fullName,
                validator: (v) => Validators.required(v, 'الاسم'),
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _emailController,
                label: 'البريد الإلكتروني',
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _phoneController,
                label: '${AppStrings.phone} (اختياري)',
                keyboardType: TextInputType.phone,
                prefix: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Text('+964'),
                ),
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _passwordController,
                label: AppStrings.password,
                obscureText: true,
                validator: Validators.password,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _confirmController,
                label: AppStrings.confirmPassword,
                obscureText: true,
                validator: (v) =>
                    Validators.confirmPassword(v, _passwordController.text),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                value: _terms,
                onChanged: (v) => setState(() => _terms = v ?? false),
                title: Text(AppStrings.termsAgree),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              const SizedBox(height: 24),
              CustomButton(
                label: AppStrings.register,
                onPressed: _register,
                isLoading: _loading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
