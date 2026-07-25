import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../shell/main_shell.dart';
import 'cart_theme.dart';

class CartEmptyView extends ConsumerWidget {
  final double topPad;

  const CartEmptyView({super.key, required this.topPad});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(CartTheme.hPad, topPad + 24, CartTheme.hPad, 0),
            child: Text(
              s.cartTitle,
              style: AppTypography.sectionTitle.copyWith(fontSize: 26, fontWeight: FontWeight.w900),
            ),
          ),
        ),
        SliverFillRemaining(
          hasScrollBody: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.surface,
                    border: Border.all(color: AppColors.hairline),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.06),
                        blurRadius: 32,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.shopping_bag_outlined,
                    size: 56,
                    color: AppColors.primary.withValues(alpha: 0.65),
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  s.cartEmptyTitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                Text(
                  s.cartEmptySubtitle,
                  textAlign: TextAlign.center,
                  style: AppTypography.caption.copyWith(fontSize: 14, height: 1.5),
                ),
                const SizedBox(height: 36),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: FilledButton(
                    onPressed: () => ref.read(navIndexProvider.notifier).state = 0,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(CartTheme.radiusLg),
                      ),
                    ),
                    child: Text(
                      s.shopNow,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => ref.read(navIndexProvider.notifier).state = 1,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CartTheme.radiusLg),
                    ),
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: const Text('تصفّح الأقسام', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
