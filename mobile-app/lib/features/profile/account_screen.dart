import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/support_links.dart';
import '../../core/widgets/states.dart';
import '../auth/auth_provider.dart';
import '../catalog/catalog_providers.dart';
import 'profile_providers.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(
        title: const Text('حسابي'),
        elevation: 0,
      ),
      body: !auth.isAuthenticated
          ? EmptyState(
              icon: Icons.person_outline_rounded,
              title: 'لم تسجّل الدخول بعد',
              subtitle: 'سجّل الدخول للوصول إلى طلباتك ونقاطك',
              action: ElevatedButton(
                onPressed: () => context.push('/login'),
                child: const Text('تسجيل الدخول'),
              ),
            )
          : ListView(
              padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
              children: [
                const _ProfileHeader(),
                const SizedBox(height: AppSpacing.sm),
                _MenuGroup(
                  children: [
                    _tile(context, Icons.receipt_long_outlined, 'طلباتي', () => context.push('/orders')),
                    _tile(context, Icons.favorite_border_rounded, 'المفضلة', () => context.push('/wishlist')),
                    _tile(context, Icons.storefront_outlined, 'العلامات التجارية', () => context.push('/brands')),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _MenuGroup(
                  children: [
                    _tile(context, Icons.location_on_outlined, 'عناويني', () => context.push('/addresses')),
                    _tile(context, Icons.stars_outlined, 'نقاط الولاء', () => context.push('/loyalty')),
                    _tile(
                      context,
                      Icons.notifications_none_rounded,
                      'الإشعارات',
                      () => context.push('/notifications'),
                      badge: ref.watch(unreadNotificationsCountProvider),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _SupportSection(),
                const SizedBox(height: AppSpacing.md),
                _MenuGroup(
                  children: [
                    _tile(context, Icons.edit_outlined, 'تعديل البيانات', () => context.push('/edit-profile')),
                    _tile(context, Icons.lock_outline_rounded, 'تغيير كلمة المرور', () => context.push('/change-password')),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _MenuGroup(
                  children: [
                    _tile(context, Icons.info_outline_rounded, 'عن التطبيق', () => _about(context)),
                    _tile(
                      context,
                      Icons.logout_rounded,
                      'تسجيل الخروج',
                      () => _logout(context, ref),
                      color: AppColors.sale,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                Center(
                  child: Text(
                    '${AppConfig.storeName} • الإصدار 1.0.0',
                    style: AppTypography.caption,
                  ),
                ),
              ],
            ),
    );
  }

  Widget _tile(BuildContext context, IconData icon, String title, VoidCallback onTap,
          {Color? color, int badge = 0}) =>
      ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 2),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: (color ?? AppColors.primary).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Icon(icon, color: color ?? AppColors.primary, size: 22),
        ),
        title: Text(
          title,
          style: AppTypography.body.copyWith(
            fontWeight: FontWeight.w600,
            color: color ?? AppColors.textPrimary,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (badge > 0)
              Container(
                margin: const EdgeInsets.only(left: AppSpacing.sm),
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.sale,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  badge > 9 ? '9+' : '$badge',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                ),
              ),
            const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
          ],
        ),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
      );

  void _about(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: AppConfig.storeName,
      applicationVersion: '1.0.0',
      children: const [
        Text('متجر الحياة لمستحضرات التجميل والعناية. الدفع عند الاستلام.'),
      ],
    );
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد تسجيل الخروج من حسابك؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('خروج', style: TextStyle(color: AppColors.sale)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

class _MenuGroup extends StatelessWidget {
  final List<Widget> children;
  const _MenuGroup({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(height: 1, indent: 68, endIndent: AppSpacing.lg),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _SupportSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(homeFeedProvider).maybeWhen(
          data: (d) => d.settings,
          orElse: () => null,
        );
    final whatsapp = settings?.whatsapp;
    final phone = settings?.supportPhone;
    if ((whatsapp == null || whatsapp.isEmpty) && (phone == null || phone.isEmpty)) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.sm),
          child: Text('الدعم', style: AppTypography.caption.copyWith(fontWeight: FontWeight.w800, fontSize: 13)),
        ),
        _MenuGroup(
          children: [
            if (whatsapp != null && whatsapp.isNotEmpty)
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 2),
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF25D366).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: const Icon(Icons.chat_outlined, color: Color(0xFF25D366)),
                ),
                title: const Text('تواصل عبر واتساب', style: TextStyle(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
                onTap: () => openWhatsApp(whatsapp, message: 'مرحباً، أحتاج مساعدة'),
              ),
            if (phone != null && phone.isNotEmpty)
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 2),
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: const Icon(Icons.phone_outlined, color: AppColors.primary),
                ),
                title: const Text('اتصل بنا', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(phone, style: AppTypography.caption),
                trailing: const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
                onTap: () => callPhone(phone),
              ),
          ],
        ),
      ],
    );
  }
}

class _ProfileHeader extends ConsumerWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.all(AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.lg + 2),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: Colors.white,
            child: Text(
              user.name.isNotEmpty ? user.name[0] : '؟',
              style: const TextStyle(color: AppColors.primary, fontSize: 26, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(width: AppSpacing.md + 2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 2),
                Text(user.email, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        '${user.points} نقطة',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
