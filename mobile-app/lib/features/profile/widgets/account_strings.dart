import '../../../core/l10n/app_strings.dart';

/// نصوص إضافية لشاشات الحساب والمصادقة والإعدادات والمفضلة.
///
/// تبقى هنا (لا في app_strings.dart) حتى تظل الميزة مستقلة.
extension AccountStringsX on AppStrings {
  // ── مركز الحساب ──
  String get acctHello => isAr ? 'أهلاً بكِ،' : 'Hello,';
  String get acctShopping => isAr ? 'تسوّقي' : 'Shopping';
  String get acctDiscover => isAr ? 'اكتشفي' : 'Discover';
  String get acctAccount => isAr ? 'الحساب' : 'Account';
  String get acctPreferences => isAr ? 'التفضيلات' : 'Preferences';
  String get acctAboutSection => isAr ? 'عن التطبيق' : 'About';
  String get acctOrdersHint => isAr ? 'تتبّعي طلباتك' : 'Track your orders';
  String get acctWishlistHint => isAr ? 'منتجاتك المحفوظة' : 'Saved products';
  String get acctAddressesHint =>
      isAr ? 'عناوين التوصيل' : 'Delivery addresses';
  String get acctLoyaltyHint => isAr ? 'اجمعي واستبدلي' : 'Earn & redeem';
  String get acctEditProfileHint =>
      isAr ? 'الاسم ورقم الهاتف' : 'Name and phone';
  String get acctPasswordHint =>
      isAr ? 'حافظي على أمان حسابك' : 'Keep your account secure';
  String get acctNotificationsHint =>
      isAr ? 'العروض وتحديثات الطلبات' : 'Offers & order updates';
  String get acctBrandsHint => isAr ? 'تسوّقي حسب الماركة' : 'Shop by brand';
  String get acctLanguageHint => isAr ? 'لغة التطبيق' : 'App language';
  String get acctCurrentLanguage => isAr ? 'العربية' : 'English';
  String get acctViewPoints => isAr ? 'عرض النقاط' : 'View points';
  String get acctGuestPerkOrders => isAr ? 'تتبّعي طلباتك' : 'Track orders';
  String get acctGuestPerkPoints => isAr ? 'اجمعي النقاط' : 'Earn points';
  String get acctGuestPerkWishlist =>
      isAr ? 'احفظي المفضّلة' : 'Save favorites';
  String get acctSupportChatHint =>
      isAr ? 'تواصلي معنا مباشرة' : 'Chat with us';

  String acctOrdersCount(int n) =>
      isAr ? '$n طلب' : '$n ${n == 1 ? 'order' : 'orders'}';
  String acctItemsCount(int n) =>
      isAr ? '$n منتج' : '$n ${n == 1 ? 'item' : 'items'}';
  String acctPointsCount(int n) => isAr ? '$n نقطة' : '$n pts';

  // ── الحقول والنماذج ──
  String get acctOptional => isAr ? 'اختياري' : 'Optional';
  String get acctRequired =>
      isAr ? 'هذا الحقل مطلوب' : 'This field is required';
  String get acctInvalidPhone =>
      isAr ? 'رقم الهاتف غير صحيح' : 'Invalid phone number';
  String get acctEmail => isAr ? 'البريد الإلكتروني' : 'Email';
  String get acctChangesSaved => isAr ? 'تم حفظ التغييرات' : 'Changes saved';
  String get acctPersonalInfo => isAr ? 'معلوماتك الشخصية' : 'Personal info';
  String get acctSecurity => isAr ? 'الأمان' : 'Security';

  // ── العناوين ──
  String get acctEditAddress => isAr ? 'تعديل العنوان' : 'Edit address';
  String get acctSaveAddress => isAr ? 'حفظ العنوان' : 'Save address';
  String get acctRecipient => isAr ? 'المستلِمة' : 'Recipient';
  String get acctLocation => isAr ? 'الموقع' : 'Location';
  String get acctGovernorate => isAr ? 'المحافظة' : 'Governorate';
  String get acctGovernorateCity =>
      isAr ? 'المحافظة / المدينة' : 'Governorate / city';
  String get acctChooseGovernorate =>
      isAr ? 'اختاري المحافظة' : 'Choose a governorate';
  String get acctArea => isAr ? 'المنطقة' : 'Area';
  String get acctChooseArea => isAr ? 'اختاري المنطقة' : 'Choose an area';
  String get acctStreet =>
      isAr ? 'الشارع / أقرب نقطة دالة' : 'Street / nearest landmark';
  String get acctHouse => isAr ? 'رقم المنزل / الشقة' : 'House / apartment no.';
  String get acctNotes => isAr ? 'ملاحظات للمندوب' : 'Notes for the courier';
  String get acctDefaultHint => isAr
      ? 'سنستخدمه تلقائياً عند إتمام الطلب'
      : 'Used automatically at checkout';

  // ── الإشعارات ──
  String acctNewNotifications(int n) => isAr
      ? (n == 1 ? 'لديكِ إشعار جديد' : 'لديكِ $n إشعارات جديدة')
      : (n == 1
            ? 'You have 1 new notification'
            : 'You have $n new notifications');
  String get acctNotifOffer => isAr ? 'عرض' : 'Offer';
  String get acctNotifNew => isAr ? 'جديد' : 'New';
  String get acctNotifReminder => isAr ? 'تذكير' : 'Reminder';
  String get acctNotifGeneral => isAr ? 'إشعار' : 'Notice';
  String get acctUnread => isAr ? 'غير مقروء' : 'Unread';

  // ── الولاء ──
  String acctRedeemUpTo(String amount) => isAr
      ? 'يمكنكِ خصم $amount عند الدفع'
      : 'Redeem up to $amount at checkout';
  String get acctHowPointsWork => isAr ? 'كيف تعمل النقاط' : 'How points work';

  // ── المصادقة ──
  String get acctIAgreeTo => isAr ? 'أوافق على ' : 'I agree to the ';
  String get acctAnd => isAr ? ' و' : ' and ';

  // ── الإعدادات ──
  String get acctLastUpdated =>
      isAr ? 'آخر تحديث: يوليو 2026' : 'Last updated: July 2026';
  String get acctSelected => isAr ? 'مُختارة' : 'Selected';
}
