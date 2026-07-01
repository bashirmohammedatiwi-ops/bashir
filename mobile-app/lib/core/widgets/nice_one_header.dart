import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/address.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/profile/profile_providers.dart';
import '../../features/shell/main_shell.dart';

/// هيدر Nice One — شفاف فوق البنر.
class NiceOneHeader extends ConsumerWidget {
  const NiceOneHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    String deliveryLabel = 'حدّد العنوان';

    if (auth.isAuthenticated) {
      final addresses = ref.watch(addressesProvider);
      deliveryLabel = addresses.maybeWhen(
        data: (list) {
          if (list.isEmpty) return 'أضف عنوان التوصيل';
          Address? def;
          for (final a in list) {
            if (a.isDefault) {
              def = a;
              break;
            }
          }
          final chosen = def ?? list.first;
          return chosen.summary.isNotEmpty ? chosen.summary : chosen.city;
        },
        orElse: () => deliveryLabel,
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              if (auth.isAuthenticated) {
                context.push('/addresses');
              } else {
                context.push('/login');
              }
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.location_on_outlined, color: Colors.white, size: 16),
                const SizedBox(width: 4),
                const Text(
                  'التوصيل إلى:',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    shadows: [Shadow(color: Colors.black38, blurRadius: 6)],
                  ),
                ),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    deliveryLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      shadows: [Shadow(color: Colors.black38, blurRadius: 6)],
                    ),
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 18),
              ],
            ),
          ),
          const SizedBox(height: 10),
          // RTL: البحث يمين، الأيقونات يسار
          Row(
            children: [
              Expanded(child: _SearchBar(onTap: () => context.push('/search'))),
              const SizedBox(width: 8),
              _CircleBtn(
                icon: Icons.grid_view_rounded,
                onTap: () => ref.read(navIndexProvider.notifier).state = 1,
              ),
              const SizedBox(width: 8),
              _CircleBtn(
                icon: Icons.notifications_none_rounded,
                onTap: () => context.push('/notifications'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  final VoidCallback onTap;
  const _SearchBar({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Icon(Icons.search, color: Colors.grey.shade500, size: 20),
            ),
            const Expanded(
              child: Text(
                'ابحث',
                style: TextStyle(color: Color(0xFFAAAAAA), fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
            Container(width: 1, height: 20, color: const Color(0xFFE8E8E8)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Icon(Icons.qr_code_scanner_rounded, color: Colors.grey.shade600, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}

class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CircleBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 2,
      shadowColor: Colors.black26,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 19, color: const Color(0xFF333333)),
        ),
      ),
    );
  }
}
