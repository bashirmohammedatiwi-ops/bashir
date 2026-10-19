import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/phone_util.dart';
import '../../core/utils/support_links.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/services/api_service.dart';
import '../../features/worlds/world_theme.dart';
import '../auth/auth_provider.dart';
import '../auth/widgets/auth_shell.dart';
import '../worlds/worlds_provider.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';
import 'widgets/support_contact_section.dart';

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
    // زر الحفظ يتبع الاسم: معطّل ما دام لم يتغيّر شيء.
    _name.addListener(_onNameChanged);
  }

  @override
  void dispose() {
    _name.removeListener(_onNameChanged);
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  bool _lastDirty = false;

  void _onNameChanged() {
    final dirty = _isDirty;
    if (dirty != _lastDirty && mounted) setState(() => _lastDirty = dirty);
  }

  bool get _isDirty {
    final current = ref.read(authProvider).user?.name.trim() ?? '';
    return _name.text.trim() != current;
  }

  /// رقم الهاتف هو اسم الدخول: تغييره عبر خدمة العملاء فقط (كالموقع) — خطأ حرف
  /// واحد كان يقفل الحساب على صاحبته.
  void _contactToChangePhone() {
    final s = ref.read(stringsProvider);
    final whatsapp = ref.read(storeSettingsProvider)?.whatsapp?.trim() ?? '';
    final message = s.acctChangePhoneMessage(_phone.text.trim());
    if (whatsapp.isEmpty) {
      launchSupportLink(context, () => openEmail(AppConfig.supportEmail, body: message), AppConfig.supportEmail);
      return;
    }
    launchSupportLink(context, () => openWhatsApp(whatsapp, message: message), formatPhoneLocal(whatsapp));
  }

  Future<void> _save() async {
    if (_loading || !_isDirty) return;
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).updateProfile(name: _name.text.trim());
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
      // الهاتف للعرض فقط — يتبع الحساب دائماً.
      _phone.text = formatPhoneLocal(user.phone);
      _onNameChanged();
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
    final hasWhatsApp =
        (ref.watch(storeSettingsProvider)?.whatsapp?.trim() ?? '').isNotEmpty;
    return ProfileScaffold(
      title: s.editProfile,
      floatingBottom: ProfilePrimaryButton(
        label: s.save,
        onPressed: _loading || !_isDirty ? null : _save,
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
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _save(),
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
                        enabled: false,
                        textDirection: TextDirection.ltr,
                        style: AppText.body.copyWith(color: t.inkMuted),
                        decoration: authFieldDecoration(
                          context,
                          label: s.phoneNumber,
                          icon: Icons.phone_iphone_rounded,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    _PhoneLockedHint(
                      text: s.acctPhoneLockedHint,
                      // بلا واتساب في إعدادات المتجر: الزر يفتح البريد.
                      actionLabel: hasWhatsApp ? s.acctWhatsApp : s.acctEmail,
                      actionIcon: hasWhatsApp ? Icons.chat_outlined : Icons.email_outlined,
                      onAction: _contactToChangePhone,
                    ),
                    if (hasEmail) ...[
                      const SizedBox(height: 16),
                      ProfileFieldLabel(s.acctEmail),
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

/// تحت حقل الهاتف المقفل: لماذا لا يُعدَّل، وزر مباشر لخدمة العملاء.
class _PhoneLockedHint extends StatelessWidget {
  final String text;
  final String actionLabel;
  final IconData actionIcon;
  final VoidCallback onAction;

  const _PhoneLockedHint({
    required this.text,
    required this.actionLabel,
    required this.actionIcon,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 4, end: 8),
          child: Icon(Icons.lock_outline_rounded, size: 16, color: t.inkMuted),
        ),
        Expanded(
          child: Text(text, style: AppText.caption.copyWith(color: t.inkMuted)),
        ),
        const SizedBox(width: 6),
        TextButton.icon(
          onPressed: () {
            HapticFeedback.selectionClick();
            onAction();
          },
          style: TextButton.styleFrom(
            minimumSize: const Size(0, kMinTapTarget),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            foregroundColor: t.accentDark,
            shape: const StadiumBorder(),
          ),
          icon: Icon(actionIcon, size: 18),
          label: Text(actionLabel, style: AppText.label.copyWith(color: t.accentDark)),
        ),
      ],
    );
  }
}
