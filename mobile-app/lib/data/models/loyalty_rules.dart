import '../../core/utils/json.dart';

/// قواعد نقاط الولاء — من السيرفر (إعدادات لوحة التحكم)، والقيم هنا احتياط فقط.
/// الافتراضي: كل نقطة = 1 د.ع، الكسب 1% من الطلب، الاستخدام بمضاعفات 250.
class LoyaltyRules {
  final double pointValue;
  final double earnPercent;
  final int redeemStep;
  final int firstOrderBonus;

  const LoyaltyRules({
    this.pointValue = 1,
    this.earnPercent = 1,
    this.redeemStep = 250,
    this.firstOrderBonus = 500,
  });

  factory LoyaltyRules.fromJson(Map<String, dynamic> j) {
    const d = LoyaltyRules();
    double dbl(dynamic v, double f) => v is num ? v.toDouble() : double.tryParse('${v ?? ''}') ?? f;
    return LoyaltyRules(
      pointValue: dbl(j['pointValue'], d.pointValue).clamp(0.01, 1e9),
      earnPercent: dbl(j['earnPercent'], d.earnPercent).clamp(0, 100),
      redeemStep: asInt(j['redeemStep'], d.redeemStep).clamp(1, 1 << 30),
      firstOrderBonus: asInt(j['firstOrderBonus'], d.firstOrderBonus),
    );
  }

  /// النقاط المكتسبة من مبلغ (بنفس تقريب السيرفر).
  int pointsFor(int amount) => (amount * earnPercent / 100).floor().clamp(0, 1 << 31);

  /// قيمة عدد من النقاط بالدينار.
  int valueOf(int points) => (points * pointValue).floor();

  /// أكبر عدد نقاط يمكن استخدامه في طلب: لا يتجاوز الرصيد ولا قيمة الطلب، بمضاعفات الخطوة.
  int redeemable(int balance, int orderAmount) {
    final cap = balance < (orderAmount / pointValue).floor() ? balance : (orderAmount / pointValue).floor();
    return (cap ~/ redeemStep) * redeemStep;
  }

  /// كم نقطة تنقص للوصول لأول خطوة استخدام.
  int missingForRedeem(int balance) => balance >= redeemStep ? 0 : redeemStep - balance;
}
