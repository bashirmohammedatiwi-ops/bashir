import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/states.dart';
import '../../data/models/loyalty_summary.dart';
import '../auth/auth_provider.dart';
import '../catalog/catalog_providers.dart';
import '../../core/widgets/ui/ui.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

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
        loading: () => Center(
          child: CircularProgressIndicator(color: context.worldTheme.accent),
        ),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(loyaltyProvider),
        ),
        data: (summary) => RefreshIndicator(
          color: context.worldTheme.accent,
          onRefresh: () async => ref.invalidate(loyaltyProvider),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(
              ProfileUi.hPad,
              16,
              ProfileUi.hPad,
              28,
            ),
            children: [
              _PointsCard(summary: summary, userName: user?.name ?? '', s: s),
              const SizedBox(height: AccountTheme.sectionGap),
              ProfileSectionTitle(s.acctHowPointsWork),
              ProfileMenuCard(
                children: [
                  _InfoRow(
                    icon: Icons.add_shopping_cart_outlined,
                    text: s.loyaltyEarnOnOrder,
                  ),
                  _InfoRow(
                    icon: Icons.redeem_outlined,
                    text: s.loyaltyRedeemAtCheckout(
                      formatPrice(summary.redeemBlockValue),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AccountTheme.sectionGap),
              ProfileSectionTitle(s.pointsHistory),
              if (summary.history.isEmpty)
                ProfileSurfaceCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 28,
                  ),
                  child: Column(
                    children: [
                      AccountTheme.iconTile(
                        context,
                        Icons.history_rounded,
                        size: 52,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        s.noHistoryYet,
                        textAlign: TextAlign.center,
                        style: AppText.title3.copyWith(
                          color: context.worldTheme.ink,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        s.pointsWillAppearHere,
                        textAlign: TextAlign.center,
                        style: AppText.bodySmall.copyWith(
                          color: context.worldTheme.inkSoft,
                        ),
                      ),
                    ],
                  ),
                )
              else
                ProfileMenuCard(
                  children: [
                    for (final h in summary.history) _HistoryTile(item: h),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: ProfileUi.rowMinHeight),
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 12),
        child: Row(
          children: [
            AccountTheme.iconTile(context, icon),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                text,
                style: AppText.bodySmall.copyWith(
                  color: context.worldTheme.ink,
                ),
              ),
            ),
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
    final soft = Colors.white.withValues(alpha: 0.82);

    return Container(
      padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
      decoration: AccountTheme.heroDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.stars_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  userName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.label.copyWith(color: soft),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: AlignmentDirectional.centerStart,
            child: Text(
              '${summary.points}',
              style: AppText.display.copyWith(
                color: Colors.white,
                fontSize: 44,
                height: 1.05,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            s.loyaltyAvailablePoints,
            style: AppText.body.copyWith(color: soft),
          ),
          if (discount > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsetsDirectional.fromSTEB(10, 7, 14, 7),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(AppCorners.pill),
                border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.local_offer_outlined,
                    size: 16,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      s.acctRedeemUpTo(formatPrice(discount)),
                      style: AppText.label.copyWith(color: Colors.white),
                    ),
                  ),
                ],
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
    final t = context.worldTheme;
    final positive = item.isEarned;
    final color = positive ? AppColors.success : t.inkSoft;
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: ProfileUi.rowMinHeight),
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 16, 10),
        child: Row(
          children: [
            AccountTheme.iconTile(
              context,
              positive ? Icons.add_rounded : Icons.remove_rounded,
              color: positive ? AppColors.success : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                item.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: ProfileUi.bodyStyle(context),
              ),
            ),
            const SizedBox(width: 8),
            Directionality(
              textDirection: TextDirection.ltr,
              child: Text(
                '${positive ? '+' : ''}${item.points}',
                style: AppText.price.copyWith(color: color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
