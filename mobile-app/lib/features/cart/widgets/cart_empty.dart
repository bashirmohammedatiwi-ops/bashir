import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/product.dart';
import '../../catalog/catalog_providers.dart';
import '../../shell/main_shell.dart';
import '../../worlds/world_theme.dart';
import '../cart_strings.dart';
import 'cart_header.dart';
import 'cart_recommendations.dart';
import 'cart_theme.dart';
import 'pill_buttons.dart';
import '../../worlds/worlds_provider.dart';

/// السلة الفارغة: رسم ناعم + دعوة للتسوّق + صف الأكثر مبيعاً.
class CartEmptyView extends ConsumerWidget {
  final double topPad;

  const CartEmptyView({super.key, required this.topPad});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final picks = ref
        .watch(activeHomeFeedProvider)
        .maybeWhen(
          data: (d) => (d.bestSellers.isNotEmpty
                  ? d.bestSellers
                  : d.flashSale.products.isNotEmpty
                  ? d.flashSale.products
                  : d.promoProducts)
              .take(10)
              .toList(),
          orElse: () => const <Product>[],
        );

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(child: CartHeader(count: 0, topPad: topPad)),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(28, 36, 28, 8),
            child: Column(
              children: [
                const _EmptyIllustration(),
                const SizedBox(height: 24),
                Text(
                  s.cartEmptyTitle,
                  textAlign: TextAlign.center,
                  style: AppText.title1.copyWith(color: t.ink),
                ),
                const SizedBox(height: 8),
                Text(
                  s.cartEmptySubtitle,
                  textAlign: TextAlign.center,
                  style: AppText.body.copyWith(color: t.inkSoft),
                ),
                const SizedBox(height: 4),
                Text(
                  s.emptyCartHint,
                  textAlign: TextAlign.center,
                  style: AppText.caption.copyWith(color: t.inkMuted),
                ),
                const SizedBox(height: 24),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 320),
                  child: PrimaryPillButton(
                    label: s.shopNow,
                    icon: Icons.auto_awesome_outlined,
                    onTap: () => ref.read(navIndexProvider.notifier).state = 0,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (picks.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: CartRecommendations(
                products: picks,
                title: s.emptyCartPicksTitle,
                subtitle: s.emptyCartPicksSubtitle,
              ),
            ),
          ),
        SliverToBoxAdapter(child: SizedBox(height: CartTheme.shellNavReserve(context))),
      ],
    );
  }
}

class _EmptyIllustration extends StatelessWidget {
  const _EmptyIllustration();

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.85, end: 1),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutBack,
      builder: (_, v, child) => Transform.scale(scale: v, child: child),
      child: SizedBox(
        width: 156,
        height: 156,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [t.accentSoft, t.accentLight.withValues(alpha: 0)]),
              ),
            ),
            Container(
              width: 104,
              height: 104,
              decoration: BoxDecoration(
                color: t.surface,
                shape: BoxShape.circle,
                border: Border.all(color: t.accentSoft, width: 1.5),
                boxShadow: CartTheme.softShadow(context),
              ),
              child: ShaderMask(
                shaderCallback: (r) => t.signatureGradient.createShader(r),
                child: const Icon(Icons.shopping_bag_outlined, size: 46, color: Colors.white),
              ),
            ),
            PositionedDirectional(
              top: 18,
              end: 20,
              child: Icon(Icons.auto_awesome_rounded, size: 20, color: t.accent.withValues(alpha: 0.7)),
            ),
            PositionedDirectional(
              bottom: 24,
              start: 16,
              child: Icon(Icons.favorite_rounded, size: 14, color: t.accent.withValues(alpha: 0.45)),
            ),
            PositionedDirectional(
              top: 40,
              start: 12,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: t.accent.withValues(alpha: 0.35), shape: BoxShape.circle),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
