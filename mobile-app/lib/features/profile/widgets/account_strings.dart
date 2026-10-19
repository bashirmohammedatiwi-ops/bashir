import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/formatters.dart';

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
  String get acctRestockAlertsHint =>
      isAr ? 'منتجات تنتظرين عودتها' : "Products you're waiting for";
  String get acctHelpHint => isAr
      ? 'التوصيل والدفع والإلغاء والنقاط'
      : 'Delivery, payment, cancellation & points';
  String get acctCurrentOrder => isAr ? 'طلبكِ الحالي' : 'Current order';
  String acctOpenOrder(String number) =>
      isAr ? 'فتح تفاصيل الطلب $number' : 'Open order $number details';
  String get acctBuyAgain => isAr ? 'اطلبيها مرة ثانية' : 'Buy it again';
  String get acctAddYourName => isAr ? 'أضيفي اسمكِ ✨' : 'Add your name ✨';
  String get acctSkinGuide => isAr ? 'دليل البشرة' : 'Skin guide';
  String get acctSkinGuideHint =>
      isAr ? 'اختبار البشرة، المشاكل وحلولها' : 'Skin quiz, concerns and fixes';
  String get acctSkinProfile => isAr ? 'ملف بشرتي' : 'My skin profile';
  String get acctSkinProfileEmpty => isAr
      ? 'اختبار سريع يحدد نوع بشرتكِ وروتينها'
      : 'A quick quiz for your skin type';
  String get acctBundles => isAr ? 'الباقات والروتين' : 'Bundles & routines';
  String get acctBundlesHint =>
      isAr ? 'منتجات مختارة بسعر أوفر' : 'Curated sets, better price';
  String get acctDeletingAccount =>
      isAr ? 'نحذف حسابكِ…' : 'Deleting your account…';

  String get acctNewPasswordSame => isAr
      ? 'اختاري كلمة مرور مختلفة عن الحالية'
      : 'Choose a password different from your current one';

  // ── إذن الإشعارات ──
  String get acctTurnOnNotifications => isAr ? 'تفعيل الإشعارات' : 'Turn on notifications';
  String get acctTurnOnNotificationsHint => isAr
      ? 'لتصلكِ تحديثات طلباتكِ والعروض فور حدوثها'
      : 'Get order updates and offers the moment they happen';
  String get acctNotificationsTurnedOn => isAr ? 'تم تفعيل الإشعارات' : 'Notifications are on';

  // ── تنبيهات التوفّر ──
  String get alertsEmptyTitle => isAr ? 'لا تنبيهات بعد' : 'No alerts yet';
  String get alertsEmptySubtitle => isAr
      ? 'حين ينفد منتج تحبينه اضغطي «نبّهيني عند التوفر» في صفحته'
      : 'When a product you love sells out, tap “Notify me when available” on its page';
  String get alertsHint => isAr
      ? 'نرسل لكِ إشعاراً فور عودة أي منتج هنا للمخزون'
      : "We'll send you a notification as soon as any of these is back";
  String get loginToViewAlerts =>
      isAr ? 'سجّلي الدخول لعرض تنبيهاتك' : 'Sign in to see your alerts';

  String acctOrdersCount(int n) => ordersCount(n);
  String acctItemsCount(int n) =>
      isAr ? arProducts(n) : '$n ${n == 1 ? 'item' : 'items'}';
  String acctPointsCount(int n) =>
      isAr ? arPoints(n) : '${formatNumber(n)} ${n == 1 ? 'pt' : 'pts'}';
  /// شارة بطاقة الحساب: «120 نقطة ولاء» / «1,200 loyalty points».
  String acctLoyaltyBadge(int n) => isAr
      ? '${arPoints(n)} ولاء'
      : '${formatNumber(n)} ${n == 1 ? 'loyalty point' : 'loyalty points'}';
  String acctSkinProfileReady(String typeAr, String emoji, String typeEn) => isAr
      ? 'بشرة $typeAr $emoji — روتينكِ جاهز'
      : '$typeEn skin — your routine is ready';

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
  String get acctPhoneLockedHint => isAr
      ? 'رقم الهاتف هو اسم الدخول لحسابكِ — لتغييره تواصلي مع خدمة العملاء'
      : 'Your phone number is how you sign in — to change it, contact customer care';
  String get acctWhatsApp => isAr ? 'واتساب' : 'WhatsApp';
  String acctChangePhoneMessage(String phone) => isAr
      ? 'مرحباً، أريد تغيير رقم الهاتف لحسابي${phone.isEmpty ? '' : ' ($phone)'}'
      : 'Hello, I would like to change the phone number on my account${phone.isEmpty ? '' : ' ($phone)'}';

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
  String get acctAddressSaved => addressSaved;
  String get acctAddressDeleted => isAr ? 'حُذف العنوان' : 'Address deleted';
  String get acctZonesLoadFailed => isAr
      ? 'تعذّر تحميل المحافظات — أعيدي المحاولة أو اكتبيها يدوياً'
      : "Couldn't load governorates — try again or type it in";
  String get acctDiscardTitle => isAr ? 'تجاهل التعديلات؟' : 'Discard changes?';
  String get acctDiscardBody => isAr
      ? 'لم يُحفظ ما كتبتِه في هذا العنوان بعد.'
      : "What you typed in this address hasn't been saved yet.";
  String get acctDiscard => isAr ? 'تجاهل' : 'Discard';
  String get acctKeepEditing => isAr ? 'متابعة التعديل' : 'Keep editing';
  String get acctDraftRestored => isAr
      ? 'أعدنا ما كتبتِه في المرة السابقة'
      : 'We restored what you typed last time';

  // ── الإشعارات ──
  String acctNewNotifications(int n) => newNotificationsCount(n);
  String get acctNotifOffer => isAr ? 'عرض' : 'Offer';
  String get acctNotifNew => isAr ? 'جديد' : 'New';
  String get acctNotifReminder => isAr ? 'تذكير' : 'Reminder';
  String get acctNotifGeneral => isAr ? 'إشعار' : 'Notice';
  String get acctNotifProductAlert => isAr ? 'تنبيه منتج' : 'Product alert';
  String get acctShowMore => isAr ? 'عرض المزيد' : 'Show more';
  String get acctShowLess => isAr ? 'عرض أقل' : 'Show less';
  String get acctBrowseOffers => isAr ? 'تصفحي العروض' : 'Browse offers';
  String get acctUnread => isAr ? 'غير مقروء' : 'Unread';

  // ── الولاء ──
  String acctRedeemUpTo(String amount) => isAr
      ? 'يمكنكِ خصم $amount عند الدفع'
      : 'Redeem up to $amount at checkout';
  String get acctHowPointsWork => isAr ? 'كيف تعمل النقاط' : 'How points work';
  String get acctUsePoints => isAr
      ? 'استخدمي نقاطكِ في طلبكِ القادم'
      : 'Use your points on your next order';

  /// «باقي 120 نقطة لخصم 250 د.ع» — و«إضافي» فقط حين يكون لديها خصم متاح أصلاً.
  String acctPointsToReward(int remaining, String reward, {required bool another}) => isAr
      ? 'باقي ${arPoints(remaining)} لخصم $reward${another ? ' إضافي' : ''}'
      : '${enCount(remaining, 'point', 'points')} to ${another ? 'another ' : ''}$reward off';
  String acctSpendToReward(String spend) => isAr
      ? 'أي ما يعادل مشتريات بقيمة $spend تقريباً'
      : 'About $spend of shopping';
  String acctAvailableNow(String amount) =>
      isAr ? 'متاح لكِ الآن خصم $amount' : '$amount available now';
  String acctFirstOrderBonus(int points) => isAr
      ? 'مكافأة أول طلب: ${arPoints(points)} هدية'
      : 'First order bonus: ${enCount(points, 'point', 'points')}';
  String acctPointWorth(String value, int perThousand) => isAr
      ? 'كل نقطة = $value ✨ وتكسبين ${arPoints(perThousand)} عن كل 1,000 د.ع'
      : 'Each point = $value ✨ earn ${enCount(perThousand, 'point', 'points')} per 1,000 IQD';

  // ── مركز المساعدة ──
  String get helpTitle => isAr ? 'كيف نقدر نساعدكِ؟' : 'How can we help?';
  String get helpSubtitle => isAr
      ? 'أجوبة سريعة عن التوصيل والدفع والطلبات — وفريقنا جاهز للتواصل'
      : 'Quick answers on delivery, payment and orders — and our team is here for you';
  String get helpDelivery => isAr ? 'التوصيل' : 'Delivery';
  String get helpOrders => isAr ? 'الطلبات والإلغاء' : 'Orders & cancellation';
  String get helpPayment => isAr ? 'الدفع' : 'Payment';
  String get helpPoints => isAr ? 'نقاط الولاء' : 'Loyalty points';
  String get helpProducts => isAr ? 'المنتجات والإرجاع' : 'Products & returns';
  String get helpDeliveryTable =>
      isAr ? 'التوصيل حسب المحافظة' : 'Delivery by governorate';
  String get helpTrackOrder => isAr ? 'تتبّع طلبي' : 'Track my order';
  /// «ديما» تظهر بالعربي فقط — لا نسخة إنجليزية لهذا الصف.
  String get helpAskDeema => 'اسألي ديما عن المنتجات';
  String get helpSkinQuiz => isAr ? 'اختبار البشرة' : 'Skin quiz';

  String get helpQDeliveryFee => isAr
      ? 'كم سعر التوصيل وكم يستغرق؟'
      : 'How much is delivery and how long does it take?';
  String helpADeliveryFee(String? freeOver) => isAr
      ? 'يختلف حسب المحافظة (الجدول بالأسفل).${freeOver == null ? '' : ' التوصيل مجاني للطلبات فوق $freeOver.'} يوم الجمعة عطلة التوصيل.'
      : 'It depends on the governorate (see the table below).${freeOver == null ? '' : ' Delivery is free on orders over $freeOver.'} There are no deliveries on Fridays.';
  String get helpQPickup =>
      isAr ? 'هل أقدر أستلم من الفرع؟' : 'Can I pick up from the branch?';
  String helpAPickup(String address, String hours) => isAr
      ? 'نعم، اختاري «استلام من الفرع» عند إتمام الطلب — مجاناً. العنوان: $address${hours.isEmpty ? '' : ' • الدوام: $hours'}'
      : 'Yes — choose “Branch pickup” at checkout, free of charge. Address: $address${hours.isEmpty ? '' : ' • Hours: $hours'}';
  String get helpQCancel => isAr ? 'هل أقدر ألغي طلبي؟' : 'Can I cancel my order?';
  String get helpACancel => isAr
      ? 'نعم، من «طلباتي» ما دام الطلب بانتظار التأكيد أو مؤكداً ولم يُجهَّز بعد. وتُعاد نقاطكِ المستخدمة تلقائياً.'
      : "Yes — from “My orders”, as long as the order is pending or confirmed and hasn't been prepared yet. Any points you used are returned automatically.";
  String get helpQGift =>
      isAr ? 'أقدر أرسل الطلب هدية؟' : 'Can I send my order as a gift?';
  String get helpAGift => isAr
      ? 'أكيد — فعّلي «هذا الطلب هدية» عند الدفع، نغلّفه ونرفق بطاقة برسالتكِ، ونقدر نخفي الأسعار من الفاتورة.'
      : 'Of course — turn on “This order is a gift” at checkout. We wrap it, add a card with your message, and can hide the prices on the invoice.';
  String get helpQPay => isAr ? 'كيف أدفع؟' : 'How do I pay?';
  String get helpAPay => isAr
      ? 'نقداً عند الاستلام، أو بالبطاقة (كي كارد / ماستركارد) عند إتمام الطلب حين تكون متاحة لحسابكِ.'
      : 'Cash on delivery, or by card (Qi Card / Mastercard) at checkout when it is available for your account.';
  String get helpQPoints =>
      isAr ? 'كيف تعمل نقاط الولاء؟' : 'How do loyalty points work?';
  String helpAPoints({
    required String earnPercent,
    required String pointValue,
    required int redeemStep,
    required int firstOrderBonus,
  }) =>
      isAr
          ? 'تكسبين $earnPercent% من قيمة كل طلب نقاطاً بعد توصيله، وكل نقطة = $pointValue خصم. تستخدمينها عند الدفع بمضاعفات ${formatNumber(redeemStep)}${firstOrderBonus > 0 ? '، ومع أول طلب هدية ${arPoints(firstOrderBonus)}' : ''}.'
          : 'You earn $earnPercent% of every order in points once it is delivered, and each point = $pointValue off. Use them at checkout in steps of ${formatNumber(redeemStep)}${firstOrderBonus > 0 ? ', plus ${enCount(firstOrderBonus, 'point', 'points')} as a gift with your first order' : ''}.';
  String get helpQOriginal =>
      isAr ? 'هل المنتجات أصلية؟' : 'Are the products original?';
  String get helpAOriginal => isAr
      ? 'نعم، كل منتجاتنا أصلية 100% ومن الوكلاء والموزعين المعتمدين، ولا نبيع أي منتج مقلّد.'
      : 'Yes. All our products are 100% original, from authorised agents and distributors. We never sell imitations.';
  String get helpQDamaged => isAr
      ? 'وصلني منتج تالف أو غير الذي طلبته؟'
      : 'My item arrived damaged or is not what I ordered?';
  String get helpADamaged => isAr
      ? 'تواصلي معنا عبر واتساب برقم الطلب وصورة للمنتج، وفريقنا يتابع معكِ الحل مباشرة.'
      : 'Message us on WhatsApp with your order number and a photo of the item, and our team will sort it out with you.';
  String get helpQShade => isAr
      ? 'كيف أعرف اللون أو المنتج المناسب لبشرتي؟'
      : 'How do I find the right shade or product for my skin?';
  String get helpAShade => isAr
      ? 'اسألي ديما مستشارتنا الجمالية، أو جرّبي اختبار البشرة.'
      : 'Try our quick skin quiz — it finds your skin type and a routine that suits it.';
  String get helpQRestock => isAr
      ? 'منتج أحبه نفد، شلون أعرف إذا رجع؟'
      : 'A product I love sold out — how will I know when it is back?';
  String get helpARestock => isAr
      ? 'اضغطي «نبّهيني عند التوفر» في صفحة المنتج وسنرسل لكِ إشعاراً فور توفّره.'
      : 'Tap “Notify me when available” on the product page and we will send you a notification as soon as it is back.';

  /// «يوم واحد» / «يوم إلى يومين» / «2–4 أيام» / «1–3 days».
  String helpDays(int min, int max) {
    final lo = min < 1 ? 1 : min;
    final hi = max < lo ? lo : max;
    if (!isAr) return lo == hi ? enCount(lo, 'day', 'days') : '$lo–$hi days';
    if (lo == hi) return arDays(lo);
    if (lo == 1 && hi == 2) return 'يوم إلى يومين';
    final m = hi % 100;
    return '$lo–$hi ${m >= 3 && m <= 10 ? 'أيام' : 'يوماً'}';
  }

  // ── المصادقة ──
  String get acctIAgreeTo => isAr ? 'أوافق على ' : 'I agree to the ';
  String get acctAnd => isAr ? ' و' : ' and ';

  // ── الإعدادات ──
  String get acctLastUpdated =>
      isAr ? 'آخر تحديث: يوليو 2026' : 'Last updated: July 2026';
  String get acctSelected => isAr ? 'مُختارة' : 'Selected';
}
