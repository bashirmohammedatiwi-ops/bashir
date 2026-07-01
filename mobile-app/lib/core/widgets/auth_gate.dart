import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/auth_provider.dart';
import 'states.dart';

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

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: EmptyState(
        icon: Icons.lock_outline_rounded,
        title: emptyTitle,
        subtitle: emptySubtitle ?? 'سجّل الدخول للمتابعة',
        action: ElevatedButton(
          onPressed: () => context.push('/login'),
          child: const Text('تسجيل الدخول'),
        ),
      ),
    );
  }
}
