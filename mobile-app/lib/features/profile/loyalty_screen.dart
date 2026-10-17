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
              const SizedBox(height: 12),
              _NextRewardCard(summary: summary),
              const SizedBox(height: AccountTheme.sectionGap),
              ProfileSectionTitle(s.acctHowPointsWork),
              ProfileMenuCard(
                children: [
                  _InfoRow(
                    icon: Icons.add_shopping_cart_outlined,
                    text: s.loyaltyEarnOnOrder(summary.rules.pointsFor(1000)),
                  ),
                  _InfoRow(
                    icon: Icons.redeem_outlined,
                    text: s.loyaltyRedeemAtCheckout(
                      formatPrice(summary.rules.pointValue),
                      summary.rules.redeemStep,
                    ),
                  ),
                  if (summary.rules.firstOrderBonus > 0)
                    _InfoRow(
                      icon: Icons.celebration_outlined,
                      text: s.isAr
                          ? 'مكافأة أول طلب: ${arPoints(summary.rules.firstOrderBonus)} هدية'
                          : 'First order bonus: ${summary.rules.firstOrderBonus} points',
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
          // بلا نقاط بعد: تشجيع بدل فراغ.
          if (discount <= 0) ...[
            const SizedBox(height: 14),
            Text(
              s.isAr
                  ? 'كل نقطة = ${formatPrice(summary.rules.pointValue)} ✨ وتكسبين ${arPoints(summary.rules.pointsFor(1000))} عن كل 1,000 د.ع'
                  : 'Each point = ${formatPrice(summary.rules.pointValue)} ✨ earn ${summary.rules.pointsFor(1000)} per 1,000 IQD',
              style: AppText.caption.copyWith(color: soft, fontWeight: FontWeight.w600),
            ),
          ],
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

/// المكافأة القادمة: كم نقطة تبقّت لخصم إضافي، بشريط تقدّم.
class _NextRewardCard extends ConsumerWidget {
  final LoyaltySummary summary;
  const _NextRewardCard({required this.summary});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final r = summary.rules;
    final block = r.redeemStep;
    final into = summary.points % block;
    final remaining = block - into;
    final progress = into / block;
    final reward = formatPrice(r.valueOf(block));
    // كم تحتاج من مشتريات لتكسب النقاط الباقية (بنسبة الكسب).
    final spend = formatPrice(r.earnPercent <= 0 ? 0 : (remaining * 100 / r.earnPercent).ceil());

    return ProfileSurfaceCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(gradient: t.signatureGradient, shape: BoxShape.circle),
                child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 19),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ar ? 'باقي ${arPoints(remaining)} لخصم $reward إضافي' : '$remaining points to another $reward off',
                      style: AppText.label.copyWith(color: t.ink, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      ar ? 'أي ما يعادل مشتريات بقيمة $spend تقريباً' : 'About $spend of shopping',
                      style: AppText.caption.copyWith(color: t.inkMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: SizedBox(
              height: 8,
              child: Stack(
                children: [
                  Positioned.fill(child: ColoredBox(color: t.accentLight)),
                  FractionallySizedBox(
                    widthFactor: progress.clamp(0.03, 1.0),
                    alignment: AlignmentDirectional.centerStart,
                    child: DecoratedBox(decoration: BoxDecoration(gradient: t.signatureGradient)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Text('$into / $block', style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700)),
              const Spacer(),
              if (summary.redeemablePoints > 0)
                Text(
                  ar
                      ? 'متاح لك الآن خصم ${formatPrice(summary.maxDiscountFromPoints)}'
                      : '${formatPrice(summary.maxDiscountFromPoints)} available now',
                  style: AppText.micro.copyWith(color: AppColors.success, fontWeight: FontWeight.w800),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
