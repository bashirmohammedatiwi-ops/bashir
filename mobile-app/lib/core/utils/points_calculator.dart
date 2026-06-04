import '../../data/models/loyalty_model.dart';

abstract final class PointsCalculator {
  static int earnFromPurchase(int totalIqd) => totalIqd ~/ 1000;

  static int redeemValue(int points) => (points ~/ 100) * 1000;

  static int pointsForDiscount(int discountIqd) => (discountIqd ~/ 1000) * 100;

  static LoyaltyTier tierFromPoints(int points) => LoyaltyTierX.fromPoints(points);

  static double tierDiscountPercent(LoyaltyTier tier) => switch (tier) {
        LoyaltyTier.platinum => 0.10,
        LoyaltyTier.gold => 0.05,
        _ => 0.0,
      };
}
