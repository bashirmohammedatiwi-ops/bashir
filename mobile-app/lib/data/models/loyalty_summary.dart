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
  final int redeemBlockSize;
  final int redeemBlockValue;
  final List<LoyaltyHistoryItem> history;

  const LoyaltySummary({
    this.points = 0,
    this.redeemBlockSize = 100,
    this.redeemBlockValue = 1000,
    this.history = const [],
  });

  factory LoyaltySummary.fromJson(Map<String, dynamic> json) => LoyaltySummary(
        points: asInt(json['points']),
        redeemBlockSize: asInt(json['redeemBlockSize'], 100),
        redeemBlockValue: asInt(json['redeemBlockValue'], 1000),
        history: asList(json['history']).map((e) => LoyaltyHistoryItem.fromJson(asMap(e))).toList(),
      );

  int get redeemableBlocks => points ~/ redeemBlockSize;

  int get maxDiscountFromPoints => redeemableBlocks * redeemBlockValue;
}
