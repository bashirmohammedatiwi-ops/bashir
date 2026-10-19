import '../../core/l10n/app_strings.dart';

/// نصوص تبويب العروض — بجانب الشاشة التي تستخدمها، بلغتي التطبيق وبصيغة المؤنث.
extension OffersStringsX on AppStrings {
  /// شريحة نسبة الخصم: «خصم 30%+» / «30%+ off».
  String offersTierLabel(int percent) => isAr ? 'خصم \u2066$percent%+\u2069' : '$percent%+ off';

  /// عدد العروض المطابقة لقارئ الشاشة: «128 عرضاً».
  String offersCount(int n) =>
      isAr ? arCount(n, one: 'عرض واحد', two: 'عرضان', few: 'عروض', many: 'عرضاً') : enCount(n, 'offer', 'offers');

  String offersTierEmptyTitle(int percent) => isAr
      ? 'لا عروض بخصم \u2066$percent%\u2069 أو أكثر الآن'
      : 'No offers at $percent% off or more right now';

  String get offersTierEmptySubtitle => isAr
      ? 'جرّبي نسبة أقل، أو تصفّحي كل العروض المتاحة.'
      : 'Try a smaller discount, or browse every offer we have.';

  String get offersShowAll => isAr ? 'عرض كل العروض' : 'Show all offers';

  /// فشل تحميل صفحة لاحقة أثناء التمرير.
  String get offersLoadMoreFailed => isAr ? 'تعذّر تحميل المزيد من العروض' : "Couldn't load more offers";

  String get offersFlashSubtitle => isAr ? 'أسعار لفترة محدودة — الكمية محدودة' : 'Limited time, limited stock';

  /// شارة العرض السريع في الرأس — تنقل إلى شريطه.
  String get offersJumpToFlash => isAr ? 'انتقلي إلى العرض السريع' : 'Jump to the flash sale';

  String get offersBundlesTitle => isAr ? 'باقات بسعر أوفر' : 'Bundles for less';
  String get offersBundlesSubtitle =>
      isAr ? 'وفّري أكثر حين تشترين المنتجات معاً' : 'Save more when you buy them together';

  // شرائح الرأس — تبقى داخل العروض.
  String get offersSortFilter => isAr ? 'فرز وتصفية' : 'Sort & filter';
  String get offersBestSellingDeals => isAr ? 'عروض الأكثر مبيعاً' : 'Best-selling deals';
  String get offersNewDeals => isAr ? 'عروض وصلت حديثاً' : 'New deals';

  /// سبب طلب إذن الإشعارات عند أول زيارة للعروض.
  String get offersPushReason => isAr
      ? 'فعّلي الإشعارات ليصلكِ العرض السريع والتخفيضات الجديدة قبل أن تنتهي.'
      : 'Turn on notifications to hear about flash sales and new price drops before they end.';
}
