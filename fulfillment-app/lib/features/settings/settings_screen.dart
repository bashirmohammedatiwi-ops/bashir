import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/background.dart';
import '../../core/prefs.dart';
import '../../core/theme.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});
  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _p = Prefs.instance;
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((i) {
      if (mounted) setState(() => _version = '${i.version} (${i.buildNumber})');
    });
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(sessionProvider).me;
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
        children: [
          if (me != null)
            Panel(
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppColors.primarySoft,
                    child: Icon(Icons.person_rounded, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(me.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        if (me.email != null)
                          Text(me.email!, textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SectionTitle('التنبيهات'),
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile(
                  value: _p.sound,
                  onChanged: (v) => setState(() => _p.sound = v),
                  title: const Text('صوت التنبيه'),
                  secondary: const Icon(Icons.volume_up_rounded),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  value: _p.vibrate,
                  onChanged: (v) => setState(() => _p.vibrate = v),
                  title: const Text('الاهتزاز'),
                  secondary: const Icon(Icons.vibration_rounded),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  value: _p.backgroundOrders,
                  onChanged: (v) {
                    setState(() => _p.backgroundOrders = v);
                    v ? BackgroundOrders.enable() : BackgroundOrders.disable();
                  },
                  title: const Text('تنبيه الطلبات الجديدة بالخلفية'),
                  subtitle: const Text('إشعار عند وصول طلب والتطبيق مغلق'),
                  secondary: const Icon(Icons.notifications_active_outlined),
                ),
              ],
            ),
          ),
          const SectionTitle('أخرى'),
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.delete_sweep_outlined, color: AppColors.muted),
                  title: const Text('مسح إحصائيات أدائي'),
                  onTap: () async {
                    if (await confirm(context, title: 'مسح الإحصائيات؟', message: 'تُحذف بيانات الأداء المحفوظة على هذا الجهاز.', ok: 'مسح', danger: true)) {
                      _p.clearStats();
                      if (context.mounted) toast(context, 'تم مسح الإحصائيات');
                    }
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: AppColors.danger),
                  title: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700)),
                  onTap: () async {
                    if (await confirm(context, title: 'تسجيل الخروج؟', ok: 'خروج', danger: true)) {
                      await ref.read(sessionProvider.notifier).logout();
                    }
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'تجهيز الطلبات — ديما الحياة${_version.isEmpty ? '' : '  ·  $_version'}',
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
