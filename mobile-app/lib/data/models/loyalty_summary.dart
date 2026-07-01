import '../../core/utils/json.dart';

class LoyaltyHistoryItem {
  final String id;
  final String title;
  final int points;
  final DateTime? date;
  final bool isEarned;

  const LoyaltyHistoryItem({
    required this.id,
    required this.title,
    required this.points,
    this.date,
    this.isEarned = true,
  });

  factory LoyaltyHistoryItem.fromJson(Map<String, dynamic> json) => LoyaltyHistoryItem(
        id: asString(json['id']),
        title: asString(json['title']),
        points: asInt(json['points']),
        date: DateTime.tryParse(asString(json['date'])),
        isEarned: json['isEarned'] != false,
      );
}

class LoyaltySummary {
  final int points;
  final String tier;
  final String tierLabel;
  final String? nextTier;
  final int nextThreshold;
  final int pointsToNext;
  final List<LoyaltyHistoryItem> history;

  const LoyaltySummary({
    this.points = 0,
    this.tier = 'normal',
    this.tierLabel = 'عضو',
    this.nextTier,
    this.nextThreshold = 500,
    this.pointsToNext = 0,
    this.history = const [],
  });

  factory LoyaltySummary.fromJson(Map<String, dynamic> json) => LoyaltySummary(
        points: asInt(json['points']),
        tier: asString(json['tier'], 'normal'),
        tierLabel: asString(json['tierLabel'], 'عضو'),
        nextTier: json['nextTier']?.toString(),
        nextThreshold: asInt(json['nextThreshold'], 500),
        pointsToNext: asInt(json['pointsToNext']),
        history: asList(json['history']).map((e) => LoyaltyHistoryItem.fromJson(asMap(e))).toList(),
      );

  /// كل 100 نقطة = 1,000 د.ع خصم (حسب الخادم).
  int get redeemableBlocks => points ~/ 100;
  int get maxDiscountFromPoints => redeemableBlocks * 1000;
}
