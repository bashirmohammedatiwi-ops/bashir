enum LoyaltyTier { normal, silver, gold, platinum }

extension LoyaltyTierX on LoyaltyTier {
  String get label => switch (this) {
        LoyaltyTier.normal => 'عادي',
        LoyaltyTier.silver => 'فضي',
        LoyaltyTier.gold => 'ذهبي',
        LoyaltyTier.platinum => 'بلاتيني',
      };

  int get minPoints => switch (this) {
        LoyaltyTier.normal => 0,
        LoyaltyTier.silver => 500,
        LoyaltyTier.gold => 1500,
        LoyaltyTier.platinum => 3000,
      };

  static LoyaltyTier fromPoints(int points) {
    if (points >= 3000) return LoyaltyTier.platinum;
    if (points >= 1500) return LoyaltyTier.gold;
    if (points >= 500) return LoyaltyTier.silver;
    return LoyaltyTier.normal;
  }
}

class LoyaltyHistoryEntry {
  const LoyaltyHistoryEntry({
    required this.id,
    required this.title,
    required this.points,
    required this.date,
    required this.isEarned,
  });

  final String id;
  final String title;
  final int points;
  final DateTime date;
  final bool isEarned;
}
