import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/states.dart';
import '../../data/models/loyalty_summary.dart';
import '../auth/auth_provider.dart';
import '../cart/widgets/cart_theme.dart';
import '../catalog/catalog_providers.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return AuthGate(
      title: s.loyaltyPoints,
      emptyTitle: s.loginToSeePoints,
      child: const _LoyaltyBody(),
    );
  }
}

class _LoyaltyBody extends ConsumerWidget {
  const _LoyaltyBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final async = ref.watch(loyaltyProvider);
    final s = ref.s;

    return ProfileScaffold(
      title: s.loyaltyPoints,
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CartTheme.brand)),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(loyaltyProvider)),
        data: (summary) => ListView(
          padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 16, ProfileUi.hPad, 24),
          children: [
            _PointsCard(summary: summary, userName: user?.name ?? '', s: s),
            const SizedBox(height: 14),
            ProfileInfoBanner(
              icon: Icons.redeem_outlined,
              text: s.loyaltyRedeemAtCheckout(formatPrice(summary.redeemBlockValue)),
            ),
            const SizedBox(height: 10),
            ProfileInfoBanner(
              icon: Icons.add_shopping_cart_outlined,
              text: s.loyaltyEarnOnOrder,
            ),
            const SizedBox(height: 24),
            ProfileSectionTitle(s.pointsHistory, icon: Icons.history_rounded),
            if (summary.history.isEmpty)
              ProfileEmptyState(
                icon: Icons.history_rounded,
                title: s.noHistoryYet,
                subtitle: s.pointsWillAppearHere,
              )
            else
              for (final h in summary.history) _HistoryTile(item: h),
          ],
        ),
      ),
    );
  }
}

class _PointsCard extends StatelessWidget {
  final LoyaltySummary summary;
  final String userName;
  final AppStrings s;

  const _PointsCard({
    required this.summary,
    required this.userName,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final discount = summary.maxDiscountFromPoints;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 26, 24, 24),
      decoration: AccountTheme.heroDecoration(),
      child: Column(
        children: [
          Text(
            userName,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          const Icon(Icons.stars_rounded, color: Colors.white, size: 42),
          const SizedBox(height: 8),
          Text(
            '${summary.points}',
            style: const TextStyle(color: Colors.white, fontSize: 46, fontWeight: FontWeight.w900, letterSpacing: -1),
          ),
          Text(
            s.loyaltyAvailablePoints,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 14),
          ),
          if (discount > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                s.isAr
                    ? 'يمكنك خصم ${formatPrice(discount)} عند الدفع'
                    : 'Redeem up to ${formatPrice(discount)} at checkout',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final LoyaltyHistoryItem item;
  const _HistoryTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final positive = item.isEarned;
    final color = positive ? const Color(0xFF2E9E6A) : AccountTheme.danger;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AccountTheme.pageCard(),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              positive ? Icons.add_rounded : Icons.remove_rounded,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(item.title, style: ProfileUi.bodyStyle())),
          Text(
            '${positive ? '+' : ''}${item.points}',
            style: TextStyle(fontWeight: FontWeight.w800, color: color, fontSize: 15),
          ),
        ],
      ),
    );
  }
}
