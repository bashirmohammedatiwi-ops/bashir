import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/phone_util.dart';
import '../../core/widgets/auth_gate.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../auth/widgets/auth_shell.dart';
import '../../core/widgets/ui/ui.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

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

  /// عيد الميلاد (يوم فقط) — يُرسل فقط إن غيّرته الزبونة.
  DateTime? _birthday;
  bool _birthdayChanged = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _name = TextEditingController(text: user?.name ?? '');
    _phone = TextEditingController(text: formatPhoneLocal(user?.phone));
    _birthday = _dayOf(user?.birthday);
  }

  /// التاريخ المخزّن منتصف ليل UTC — نأخذ اليوم كما هو بلا تحويل للتوقيت المحلي.
  static DateTime? _dayOf(DateTime? d) => d == null ? null : DateTime(d.year, d.month, d.day);

  Future<void> _pickBirthday() async {
    final now = DateTime.now();
    final last = DateTime(now.year - 10, now.month, now.day);
    final initial = _birthday ?? DateTime(now.year - 25, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isAfter(last) ? last : initial,
      firstDate: DateTime(1930),
      lastDate: last,
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      helpText: ref.read(stringsProvider).yourBirthday,
    );
    if (picked == null || !mounted) return;
    HapticFeedback.selectionClick();
    setState(() {
      _birthday = picked;
      _birthdayChanged = true;
    });
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
      await ref
          .read(apiServiceProvider)
          .updateProfile(
            name: _name.text.trim(),
            phone: _phone.text.trim(),
            birthday: _birthdayChanged ? _birthday?.toIso8601String().substring(0, 10) : null,
          );
      await ref.read(authProvider.notifier).refreshUser();
      if (mounted) {
        HapticFeedback.mediumImpact();
        AppSnackbar.success(context, ref.read(stringsProvider).acctChangesSaved);
        context.canPop() ? context.pop() : context.go('/');
      }
    } catch (e) {
      // رسالة مفهومة بدل نص الخطأ التقني.
      if (mounted) AppSnackbar.error(context, ref.friendly(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    // الحساب وصل بعد فتح الصفحة (تحميل الجلسة): نملأ الحقول الفارغة فقط.
    ref.listen(authProvider.select((a) => a.user), (_, user) {
      if (user == null) return;
      if (_name.text.isEmpty) _name.text = user.name;
      if (_phone.text.isEmpty) _phone.text = formatPhoneLocal(user.phone);
      if (!_birthdayChanged && _birthday == null && user.birthday != null) {
        setState(() => _birthday = _dayOf(user.birthday));
      }
    });
    return AuthGate(
      title: s.editProfile,
      emptyTitle: s.loginToEditProfile,
      child: _buildForm(context, s),
    );
  }

  Widget _buildForm(BuildContext context, AppStrings s) {
    final user = ref.watch(authProvider).user;
    final t = context.worldTheme;
    final name = user?.name.trim() ?? '';
    final hasEmail = user?.email != null && user!.email!.isNotEmpty;
    return ProfileScaffold(
      title: s.editProfile,
      floatingBottom: ProfilePrimaryButton(
        label: s.save,
        onPressed: _loading ? null : _save,
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
                child: ProfileAvatar(
                  initial: name.isNotEmpty ? name[0] : '🌸',
                  size: 76,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                name,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.title2.copyWith(color: t.ink),
              ),
              const SizedBox(height: 24),
              ProfileSectionTitle(s.acctPersonalInfo),
              ProfileSurfaceCard(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
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
                        validator: (v) => (v == null || v.trim().length < 2)
                            ? s.enterYourName
                            : null,
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
                        textInputAction: TextInputAction.done,
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
                    ProfileFieldLabel(s.yourBirthday, optional: true),
                    _BirthdayField(
                      value: _birthday == null ? null : formatDate(_birthday, lang: s.lang),
                      onTap: _pickBirthday,
                    ),
                    if (hasEmail) ...[
                      const SizedBox(height: 16),
                      ProfileFieldLabel(s.acctEmail, optional: true),
                      TextFormField(
                        initialValue: user.email,
                        enabled: false,
                        style: AppText.body.copyWith(color: t.inkMuted),
                        decoration: profileFieldDecoration(
                          context,
                          prefix: Icon(
                            Icons.alternate_email_rounded,
                            size: 20,
                            color: t.inkMuted,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AccountTheme.sectionGap),
              ProfileSectionTitle(s.acctSecurity),
              ProfileMenuCard(
                children: [
                  ProfileMenuTile(
                    icon: Icons.lock_outline_rounded,
                    title: s.changePassword,
                    subtitle: s.acctPasswordHint,
                    onTap: () => context.push('/change-password'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// حقل عيد الميلاد: يفتح منتقي التاريخ (لا كتابة يدوية).
class _BirthdayField extends StatelessWidget {
  final String? value;
  final VoidCallback onTap;
  const _BirthdayField({required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InputDecorator(
          decoration: profileFieldDecoration(
            context,
            prefix: Icon(Icons.cake_outlined, size: 20, color: t.inkMuted),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 24),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(
                value ?? '—',
                style: AppText.body.copyWith(color: value == null ? t.inkMuted : t.ink),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
