import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../../auth/providers/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).valueOrNull;
    _nameController = TextEditingController(text: user?.name);
    _emailController = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.editProfile)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            GestureDetector(
              onTap: () {},
              child: const CircleAvatar(
                radius: 50,
                backgroundColor: Color(0xFFF5F3FF),
                child: Icon(Icons.camera_alt, color: Color(0xFF7C3AED), size: 32),
              ),
            ),
            const SizedBox(height: 24),
            CustomTextField(
              controller: _nameController,
              label: AppStrings.fullName,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: TextEditingController(text: '+9647701234567'),
              label: AppStrings.phone,
              readOnly: true,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _emailController,
              label: 'البريد الإلكتروني',
            ),
            const Spacer(),
            CustomButton(
              label: AppStrings.save,
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
