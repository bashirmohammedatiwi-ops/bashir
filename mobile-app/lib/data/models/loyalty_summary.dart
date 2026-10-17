import '../../core/utils/json.dart';
import 'loyalty_rules.dart';

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
  final LoyaltyRules rules;
  final List<LoyaltyHistoryItem> history;

  const LoyaltySummary({
    this.points = 0,
    this.rules = const LoyaltyRules(),
    this.history = const [],
  });

  factory LoyaltySummary.fromJson(Map<String, dynamic> json) => LoyaltySummary(
        points: asInt(json['points']),
        // القواعد من السيرفر؛ الإصدارات القديمة من السيرفر بلا pointValue → الافتراضي.
        rules: json['pointValue'] != null ? LoyaltyRules.fromJson(json) : const LoyaltyRules(),
        history: asList(json['history']).map((e) => LoyaltyHistoryItem.fromJson(asMap(e))).toList(),
      );

  /// النقاط القابلة للاستخدام الآن (بمضاعفات الخطوة).
  int get redeemablePoints => (points ~/ rules.redeemStep) * rules.redeemStep;

  int get maxDiscountFromPoints => rules.valueOf(redeemablePoints);
}
