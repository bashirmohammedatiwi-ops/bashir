import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/profile/widgets/profile_ui.dart';

/// يعرض محتوى الشاشة للمستخدم المسجّل، أو دعوة لتسجيل الدخول.
class AuthGate extends ConsumerWidget {
  final String title;
  final String emptyTitle;
  final String? emptySubtitle;
  final Widget child;

  const AuthGate({
    super.key,
    required this.title,
    required this.emptyTitle,
    this.emptySubtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.isAuthenticated) return child;

    final isAr = ref.watch(languageCodeProvider) == 'ar';
    return ProfileScaffold(
      title: title,
      body: ProfileEmptyState(
        icon: Icons.lock_outline_rounded,
        title: emptyTitle,
        subtitle: emptySubtitle ?? (isAr ? 'سجّلي الدخول للمتابعة' : 'Sign in to continue'),
        action: ProfilePrimaryButton(
          label: isAr ? 'تسجيل الدخول' : 'Sign in',
          onPressed: () => context.push('/login'),
        ),
      ),
    );
  }
}
