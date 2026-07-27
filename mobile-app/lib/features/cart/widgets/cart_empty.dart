import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
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
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(CartTheme.hPad, topPad + 16, CartTheme.hPad, 28),
              decoration: CartTheme.headerDecoration(),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset(
                      'assets/images/app_icon_source.png',
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    s.cartTitle,
                    style: AppTypography.sectionTitle.copyWith(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: CartTheme.charcoal,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverFillRemaining(
            hasScrollBody: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 36),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      color: CartTheme.brandWash,
                      shape: BoxShape.circle,
                      border: Border.all(color: CartTheme.brandSoft, width: 2),
                    ),
                    child: Icon(
                      Icons.shopping_bag_outlined,
                      size: 44,
                      color: CartTheme.brand.withValues(alpha: 0.8),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    s.cartEmptyTitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                      color: CartTheme.charcoal,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    s.cartEmptySubtitle,
                    textAlign: TextAlign.center,
                    style: AppTypography.caption.copyWith(fontSize: 14, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: CartTheme.brandGradient,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: FilledButton(
                        onPressed: () => ref.read(navIndexProvider.notifier).state = 0,
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        ),
                        child: Text(
                          s.shopNow,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
    );
  }
}
