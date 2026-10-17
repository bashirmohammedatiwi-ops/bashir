import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/background.dart';
import '../../core/config.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});
  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _test = TextEditingController();
  String? _lastRead;
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform()
        .then((i) {
          if (mounted) setState(() => _version = '${i.version} (${i.buildNumber})');
        })
        .catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final p = Prefs.instance;
    final me = ref.watch(sessionProvider).me;
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
        children: [
          Panel(
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.primarySoft,
                  child: Icon(Icons.person_rounded, color: AppColors.primary, size: 30),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(me?.name ?? '—', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      if (me?.email != null) Text(me!.email!, style: const TextStyle(color: AppColors.muted)),
                      if (me != null)
                        Text(
                          me.role == 'STAFF' ? 'موظف' : 'مدير',
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12.5),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SectionTitle('المسح'),
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile(
                  value: p.vibrate,
                  onChanged: (v) => setState(() => p.vibrate = v),
                  title: const Text('اهتزاز عند القراءة', style: TextStyle(fontWeight: FontWeight.w700)),
                  secondary: const Icon(Icons.vibration_rounded),
                ),
                const Divider(),
                SwitchListTile(
                  value: p.sound,
                  onChanged: (v) => setState(() => p.sound = v),
                  title: const Text('صوت عند القراءة', style: TextStyle(fontWeight: FontWeight.w700)),
                  secondary: const Icon(Icons.volume_up_rounded),
                ),
                const Divider(),
                SwitchListTile(
                  value: p.backgroundOrders,
                  onChanged: (v) {
                    setState(() => p.backgroundOrders = v);
                    v ? BackgroundOrders.enable() : BackgroundOrders.disable();
                  },
                  title: const Text('تنبيه الطلبات والتطبيق مغلق', style: TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: const Text('إشعار على الهاتف عند وصول طلب جديد (فحص كل ~15 دقيقة)'),
                  secondary: const Icon(Icons.notifications_active_outlined),
                ),
                const Divider(),
                SwitchListTile(
                  value: p.continuous,
                  onChanged: (v) => setState(() => p.continuous = v),
                  title: const Text('المسح المتتالي افتراضياً', style: TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: const Text('تبقى الكاميرا مفتوحة وتتجمع النتائج في قائمة'),
                  secondary: const Icon(Icons.playlist_add_check_rounded),
                ),
              ],
            ),
          ),
          const SectionTitle('قارئ باركود خارجي', subtitle: 'بلوتوث أو USB (OTG) بوضع لوحة المفاتيح HID'),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  '١. اربط القارئ بالهاتف من إعدادات البلوتوث (كأنه لوحة مفاتيح).\n'
                  '٢. اضبط القارئ ليرسل Enter بعد الباركود (الإعداد الافتراضي لأغلب القارئات).\n'
                  '٣. امسح من أي شاشة في التطبيق — يفتح المنتج مباشرة.',
                  style: TextStyle(height: 1.9),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _test,
                  textDirection: TextDirection.ltr,
                  onSubmitted: (v) {
                    setState(() => _lastRead = v.trim());
                    _test.clear();
                    Prefs.instance.feedback();
                  },
                  decoration: const InputDecoration(labelText: 'جرّب القارئ هنا', prefixIcon: Icon(Icons.keyboard_alt_outlined)),
                ),
                if (_lastRead != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'قُرئ: $_lastRead',
                    textDirection: TextDirection.ltr,
                    style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w800),
                  ),
                ],
                if (ScannerBus.instance.lastHardwareAt != null)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text('✓ تم استقبال قراءات من القارئ في هذه الجلسة', style: TextStyle(color: AppColors.success)),
                  ),
              ],
            ),
          ),
          const SectionTitle('التطبيق'),
          Panel(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.history_rounded),
                  title: const Text('مسح سجل آخر عمليات المسح'),
                  onTap: () {
                    Prefs.instance.clearRecent();
                    toast(context, 'تم مسح السجل');
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.dns_outlined),
                  title: const Text('السيرفر'),
                  subtitle: Text(AppConfig.apiBase, textDirection: TextDirection.ltr, textAlign: TextAlign.right),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.info_outline_rounded),
                  title: const Text('الإصدار'),
                  trailing: Text(_version, textDirection: TextDirection.ltr),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              side: const BorderSide(color: AppColors.dangerSoft),
            ),
            onPressed: () async {
              if (await confirm(context, title: 'تسجيل الخروج؟', ok: 'خروج', danger: true)) {
                await ref.read(sessionProvider.notifier).logout();
              }
            },
            icon: const Icon(Icons.logout_rounded),
            label: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    );
  }
}
