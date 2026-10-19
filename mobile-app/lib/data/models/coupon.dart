import '../../core/l10n/app_strings.dart';
import '../../core/utils/json.dart';

class Coupon {
  final String id;
  final String code;
  final String type; // PERCENT | AMOUNT | FREE_SHIPPING | FIRST_ORDER
  final int value;
  final String description;
  final int minOrder;
  final bool isActive;
  /// عرض البطاقة: عنوان وسطر ثانٍ ولون (من لوحة التحكم).
  final String? title;
  final String? subtitle;
  final String theme;
  /// سقف الخصم بالدينار للنسبة المئوية (null = بلا سقف).
  final int? maxDiscount;
  final DateTime? endsAt;
  /// كم بقي من الاستخدامات (null = بلا حد).
  final int? remaining;

  const Coupon({
    required this.id,
    required this.code,
    required this.type,
    this.value = 0,
    this.description = '',
    this.minOrder = 0,
    this.isActive = true,
    this.title,
    this.subtitle,
    this.theme = 'rose',
    this.maxDiscount,
    this.endsAt,
    this.remaining,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) => Coupon(
        id: asString(json['id']),
        code: asString(json['code']),
        type: asString(json['type']),
        value: asInt(json['value']),
        description: asString(json['description']),
        minOrder: asInt(json['minOrder']),
        isActive: asBool(json['isActive'], true),
        title: (json['title']?.toString().trim().isNotEmpty ?? false) ? json['title'].toString() : null,
        subtitle: (json['subtitle']?.toString().trim().isNotEmpty ?? false) ? json['subtitle'].toString() : null,
        theme: asString(json['theme'], 'rose'),
        maxDiscount: json['maxDiscount'] == null ? null : asInt(json['maxDiscount']),
        endsAt: DateTime.tryParse(json['endsAt']?.toString() ?? ''),
        remaining: json['remaining'] == null ? null : asInt(json['remaining']),
      );

  /// هل يكفي المجموع لتفعيل الخصم؟
  bool eligibleFor(int subtotal) => minOrder <= 0 || subtotal >= minOrder;

  /// كم ينقص المجموع حتى يتفعل الخصم (0 = مفعّل).
  int missingFor(int subtotal) => eligibleFor(subtotal) ? 0 : minOrder - subtotal;

  /// قيمة الخصم على مجموع فرعي معيّن (صفر إن لم يبلغ الحد الأدنى) — بنفس قواعد السيرفر.
  int discountFor(int subtotal) {
    if (!eligibleFor(subtotal)) return 0;
    var d = 0;
    switch (type) {
      case 'PERCENT':
      case 'FIRST_ORDER':
        d = (subtotal * value / 100).round();
        break;
      case 'FIXED':
      case 'AMOUNT':
        d = value;
        break;
      default:
        d = 0; // FREE_SHIPPING يُعالج في الشحن
    }
    if (maxDiscount != null && maxDiscount! > 0 && d > maxDiscount!) d = maxDiscount!;
    return d.clamp(0, subtotal);
  }

  bool get isPercent => type == 'PERCENT' || type == 'FIRST_ORDER';
  bool get isFixedAmount => type == 'FIXED' || type == 'AMOUNT';

  /// فائدة الكوبون بلغة الواجهة: «خصم 20%» / «20% off» / «Free delivery».
  String benefitLabelFor(AppStrings s) => s.couponBenefit(this);

  /// النسخة العربية القديمة — للواجهة استخدمي [benefitLabelFor].
  String benefitLabel({String Function(int)? formatPrice}) {
    switch (type) {
      case 'PERCENT':
      case 'FIRST_ORDER':
        return 'خصم $value%';
      case 'FIXED':
      case 'AMOUNT':
        return formatPrice != null ? 'خصم ${formatPrice(value)}' : 'خصم ثابت';
      case 'FREE_SHIPPING':
        return 'شحن مجاني';
      default:
        return description.isNotEmpty ? description : code;
    }
  }

  bool get freeShipping => type == 'FREE_SHIPPING';
}
