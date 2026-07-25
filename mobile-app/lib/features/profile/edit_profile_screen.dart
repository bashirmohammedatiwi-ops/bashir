import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/phone_util.dart';
import '../../core/widgets/auth_gate.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../auth/widgets/auth_shell.dart';
import '../cart/widgets/cart_theme.dart';
import 'widgets/profile_ui.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});
  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _phone = TextEditingController(text: formatPhoneLocal(user?.phone));
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).updateProfile(
            name: _name.text.trim(),
            phone: _phone.text.trim(),
          );
      await ref.read(authProvider.notifier).refreshUser();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حفظ التغييرات')));
        context.pop();
      }
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
      title: s.editProfile,
      emptyTitle: s.loginToEditProfile,
      child: _buildForm(context, s),
    );
  }

  Widget _buildForm(BuildContext context, AppStrings s) {
    final user = ref.watch(authProvider).user;
    return ProfileScaffold(
      title: s.editProfile,
      floatingBottom: ProfilePrimaryButton(
        label: s.save,
        onPressed: _loading ? null : _save,
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
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: CartTheme.brandSoft,
                      child: Text(
                        (user?.name.isNotEmpty == true) ? user!.name[0] : '؟',
                        style: const TextStyle(
                          color: CartTheme.brand,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      user?.name ?? '',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: CartTheme.charcoal),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              ProfileSurfaceCard(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    authLabeledField(
                      label: s.fullName,
                      field: TextFormField(
                        controller: _name,
                        decoration: authFieldDecoration(label: s.fullName),
                        validator: (v) => (v == null || v.trim().length < 2) ? s.enterYourName : null,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (user?.email != null && user!.email!.isNotEmpty) ...[
                      ProfileFieldLabel(s.isAr ? 'البريد الإلكتروني' : 'Email', optional: true),
                      TextFormField(
                        initialValue: user.email,
                        enabled: false,
                        decoration: profileFieldDecoration(),
                      ),
                      const SizedBox(height: 16),
                    ],
                    authLabeledField(
                      label: s.phoneNumber,
                      field: TextFormField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        decoration: authFieldDecoration(label: s.phoneNumber, hint: '07701234567'),
                        validator: (v) => validateIraqiPhone(v),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              ProfileOutlineButton(
                label: s.changePassword,
                onPressed: () => context.push('/change-password'),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }
}
