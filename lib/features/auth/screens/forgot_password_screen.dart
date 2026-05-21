import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.forgotPassword)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            CustomTextField(
              controller: _phoneController,
              label: AppStrings.phone,
              hint: '7XX XXX XXXX',
            ),
            const SizedBox(height: 24),
            CustomButton(
              label: 'إرسال الرمز',
              onPressed: () => context.push(AppRoutes.otp),
            ),
          ],
        ),
      ),
    );
  }
}
