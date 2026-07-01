import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/states.dart';
import '../auth/auth_provider.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('حسابي')),
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
              children: [
                _ProfileHeader(),
                const SizedBox(height: 8),
                _tile(context, Icons.receipt_long_outlined, 'طلباتي', () => context.push('/orders')),
                _tile(context, Icons.favorite_border_rounded, 'المفضلة',
                    () => context.push('/wishlist')),
                _tile(context, Icons.location_on_outlined, 'عناويني',
                    () => context.push('/addresses')),
                _tile(context, Icons.stars_outlined, 'نقاط الولاء', () => context.push('/loyalty')),
                _tile(context, Icons.notifications_none_rounded, 'الإشعارات',
                    () => context.push('/notifications')),
                _tile(context, Icons.edit_outlined, 'تعديل البيانات',
                    () => context.push('/edit-profile')),
                const Divider(height: 24),
                _tile(context, Icons.info_outline, 'عن التطبيق', () => _about(context)),
                _tile(
                  context,
                  Icons.logout_rounded,
                  'تسجيل الخروج',
                  () => _logout(context, ref),
                  color: AppColors.sale,
                ),
                const SizedBox(height: 24),
                Center(
                  child: Text('${AppConfig.storeName} • الإصدار 1.0.0',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  Widget _tile(BuildContext context, IconData icon, String title, VoidCallback onTap,
          {Color? color}) =>
      ListTile(
        leading: Icon(icon, color: color ?? AppColors.textPrimary),
        title: Text(title,
            style: TextStyle(fontWeight: FontWeight.w600, color: color ?? AppColors.textPrimary)),
        trailing: const Icon(Icons.chevron_left, color: AppColors.textMuted),
        onTap: onTap,
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
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد تسجيل الخروج من حسابك؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('خروج', style: TextStyle(color: AppColors.sale))),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

class _ProfileHeader extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: Colors.white,
            child: Text(
              user.name.isNotEmpty ? user.name[0] : '؟',
              style: const TextStyle(
                  color: AppColors.primary, fontSize: 24, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.name,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text(user.email,
                    style: const TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                      Text('${user.points} نقطة',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
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
