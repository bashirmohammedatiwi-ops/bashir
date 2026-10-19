import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/push/push_service.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../worlds/world_theme.dart';
import 'account_strings.dart';
import 'profile_ui.dart';

/// صفّ «تفعيل الإشعارات» — يظهر فقط حين يكون الإذن مرفوضاً أو معطّلاً.
///
/// يعيد الفحص عند العودة للتطبيق (من إعدادات النظام غالباً) فيختفي الصف وحده.
class NotificationPermissionTile extends ConsumerStatefulWidget {
  /// داخل [ProfileMenuCard] مع صفوف أخرى، أو بطاقة مستقلة.
  final bool standalone;

  const NotificationPermissionTile({super.key, this.standalone = false});

  @override
  ConsumerState<NotificationPermissionTile> createState() => _NotificationPermissionTileState();
}

class _NotificationPermissionTileState extends ConsumerState<NotificationPermissionTile>
    with WidgetsBindingObserver {
  bool _denied = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _check();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _check();
  }

  Future<void> _check() async {
    final denied = await PushService.isPermissionDenied();
    if (mounted && denied != _denied) setState(() => _denied = denied);
  }

  Future<void> _enable() async {
    final granted = await PushService.requestOrOpenSettings();
    if (!mounted) return;
    if (granted) {
      setState(() => _denied = false);
      AppSnackbar.success(context, ref.s.acctNotificationsTurnedOn);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_denied) return const SizedBox.shrink();
    final s = ref.s;
    final tile = ProfileMenuTile(
      icon: Icons.notifications_off_outlined,
      iconColor: context.worldTheme.accentDark,
      title: s.acctTurnOnNotifications,
      subtitle: s.acctTurnOnNotificationsHint,
      onTap: _enable,
    );
    if (!widget.standalone) return tile;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ProfileMenuCard(children: [tile]),
    );
  }
}
