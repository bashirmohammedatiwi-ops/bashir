import '../../core/l10n/app_strings.dart';

/// نصوص الرئيسية الجديدة.
extension HomeStringsX on AppStrings {
  String get homeWorldEyebrow => isAr ? 'عالم' : 'The world of';
  String get homeShopWorld => isAr ? 'تسوّقي العالم' : 'Shop this world';
  String get homeOurWorlds => isAr ? 'عوالمنا' : 'Our worlds';
  String get homeContinue => isAr ? 'أكملي من حيث توقفتِ' : 'Pick up where you left off';
  String get homeContinueSub => isAr ? 'منتجات شاهدتِها مؤخراً' : 'Products you viewed recently';
  String get homeNeedsTitle => isAr ? 'تسوّقي حسب الحاجة' : 'Shop by need';
  String get homeNeedsSub => isAr ? 'اختاري ما تبحثين عنه وشاهدي الأكثر طلباً' : 'Pick a need and see what’s loved most';
  String get homeSpotlight => isAr ? 'اختيارنا لكِ' : 'Our pick for you';
  String get homeDiscover => isAr ? 'اكتشفي' : 'Discover';
  String get homeTrustDelivery => isAr ? 'توصيل سريع' : 'Fast delivery';
  String get homeTrustDeliverySub => isAr ? 'لكل المحافظات' : 'Nationwide';
  String get homeTrustAuthentic => isAr ? 'منتجات أصلية' : 'Authentic';
  String get homeTrustAuthenticSub => isAr ? '100% مضمونة' : '100% guaranteed';
  String get homeTrustCod => isAr ? 'ادفعي كما تحبين' : 'Pay your way';
  String get homeTrustCodSub => isAr ? 'نقداً أو بالبطاقة' : 'Cash or card';
  String get homeTrustSupport => isAr ? 'نساعدكِ' : 'We’re here';
  String get homeTrustSupportSub => isAr ? 'دعم مباشر' : 'Live support';
  String get homeFooterLine => isAr ? 'جمالكِ يستحق الأصلي' : 'Your beauty deserves the real thing';
  String get homeFooterHelp => isAr ? 'تحتاجين مساعدة في الاختيار؟' : 'Need help choosing?';
  String get homeFooterChat => isAr ? 'تحدّثي معنا' : 'Chat with us';
  String get homeFooterBrowse => isAr ? 'كل الأقسام' : 'All categories';
  String get homeSpotlightBadge => isAr ? 'الأكثر حباً' : 'Most loved';
  String get homeFeedLoadFailed => isAr ? 'تعذّر تحميل أقسام هذا العالم' : "Couldn't load this world's sections";
  String get homeFeedLoadFailedSub =>
      isAr ? 'تأكدي من الاتصال ثم أعيدي المحاولة، أو اختاري عالماً آخر' : 'Check your connection and try again, or pick another world';
  String get homeFlashSaleTitle => isAr ? 'عروض لوقت محدود' : 'Limited-time deals';
  String get careHubConcerns => isAr ? 'حسب مشكلة البشرة' : 'Shop by skin concern';
  String get careHubCategories => isAr ? 'أقسام العناية' : 'Care categories';
}
