import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/coupon.dart';
import '../../data/models/notification.dart';
import '../config/app_config.dart';
import '../utils/formatters.dart';
import 'locale_provider.dart';

final stringsProvider = Provider<AppStrings>((ref) {
  final code = ref.watch(appLocaleProvider).languageCode;
  return AppStrings(code);
});

extension AppStringsX on WidgetRef {
  AppStrings get s => watch(stringsProvider);
}

/// «1,250» — فواصل الآلاف كبقية أرقام التطبيق.
String _grouped(int n) => n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');

/// تنوين النصب في آخر الكلمة («قسماً» → «قسم») — لتمييز المئات والألوف المجرور.
/// يقبل الترتيبين الشائعين في الكتابة: ألف ثم تنوين («اً») وتنوين ثم ألف («ًا»).
final _tanweenFath = RegExp('(?:\u0627\u064B|\u064B\u0627)(?=\\s|\$)');

/// تمييز العدد بالعربي بصيغه الأربع: 1 → [one]، 2 → [two]، 3–10 → «n [few]»، 11–99 → «n [many]».
/// المئات والألوف (100، 101، 1000…) تمييزها مفرد مجرور: «100 قسم» لا «100 قسماً».
String arCount(int n, {required String one, required String two, required String few, required String many}) {
  if (n == 1) return one;
  if (n == 2) return two;
  final m = n % 100;
  final num = _grouped(n);
  if (m >= 3 && m <= 10) return '$num $few';
  if (m >= 11) return '$num $many';
  return '$num ${many.replaceAll(_tanweenFath, '')}';
}

/// English count: «1 item» / «12 items».
String enCount(int n, String one, String many) => n == 1 ? '1 $one' : '${_grouped(n)} $many';

/// نصوص واجهة التطبيق — عربي / إنجليزي.
/// «5 نقاط» لا «5 نقطة»: تمييز العدد بالعربي (1 نقطة، 2 نقطتين، 3–10 نقاط، 11+ نقطة).
String arPoints(int n) {
  final m = n % 100;
  if (n == 1) return 'نقطة واحدة';
  if (n == 2) return 'نقطتين';
  if (m >= 3 && m <= 10) return '$n نقاط';
  return '$n نقطة';
}

/// «منتج واحد» / «منتجان» / «3 منتجات» / «15 منتجاً» / «100 منتج».
String arProducts(int n) => arCount(n, one: 'منتج واحد', two: 'منتجان', few: 'منتجات', many: 'منتجاً');

/// «خطوة واحدة» / «خطوتان» / «4 خطوات» / «12 خطوة».
String arSteps(int n) => arCount(n, one: 'خطوة واحدة', two: 'خطوتان', few: 'خطوات', many: 'خطوة');

/// «قطعة واحدة» / «قطعتان» / «3 قطع» / «12 قطعة».
String arPieces(int n) => arCount(n, one: 'قطعة واحدة', two: 'قطعتان', few: 'قطع', many: 'قطعة');

/// «قسم واحد» / «قسمان» / «5 أقسام» / «12 قسماً».
String arSections(int n) => arCount(n, one: 'قسم واحد', two: 'قسمان', few: 'أقسام', many: 'قسماً');

/// «طلب واحد» / «طلبان» / «3 طلبات» / «15 طلباً».
String arOrders(int n) => arCount(n, one: 'طلب واحد', two: 'طلبان', few: 'طلبات', many: 'طلباً');

/// «إشعار واحد» / «إشعاران» / «4 إشعارات» / «20 إشعاراً».
String arNotifications(int n) =>
    arCount(n, one: 'إشعار واحد', two: 'إشعاران', few: 'إشعارات', many: 'إشعاراً');

/// «يوم واحد» / «يومين» / «3 أيام» / «14 يوماً» — بصيغة ما بعد «خلال/بعد/باقي».
String arDays(int n) => arCount(n, one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يوماً');

/// «ساعة واحدة» / «ساعتين» / «5 ساعات» / «12 ساعة».
String arHours(int n) => arCount(n, one: 'ساعة واحدة', two: 'ساعتين', few: 'ساعات', many: 'ساعة');

/// «ألف» / «ألفين» / «3 آلاف» / «25 ألف» — للمبالغ المختصرة بالآلاف.
String arThousands(int k) => arCount(k, one: 'ألف', two: 'ألفين', few: 'آلاف', many: 'ألف');

int _countOf(String n) => int.tryParse(n.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

/// «قسم فرعي واحد» / «قسمان فرعيان» / «4 أقسام فرعية» / «12 قسماً فرعياً».
String _arSubSections(int n) =>
    arCount(n, one: 'قسم فرعي واحد', two: 'قسمان فرعيان', few: 'أقسام فرعية', many: 'قسماً فرعياً');

/// تطبيع بسيط لأسماء المحافظات («البصره» = «البصرة»، «اربيل» = «أربيل»).
String _normGov(String s) => s.replaceAll(RegExp('[أإآ]'), 'ا').replaceAll('ة', 'ه').trim();

/// أسماء المحافظات بالإنجليزي — تُدخل بالعربي من لوحة التحكم.
const _governoratesEn = <(String, String)>[
  ('بغداد', 'Baghdad'),
  ('البصره', 'Basra'),
  ('نينوى', 'Nineveh'),
  ('الموصل', 'Mosul'),
  ('اربيل', 'Erbil'),
  ('السليمانيه', 'Sulaymaniyah'),
  ('دهوك', 'Duhok'),
  ('حلبجه', 'Halabja'),
  ('كركوك', 'Kirkuk'),
  ('النجف', 'Najaf'),
  ('كربلاء', 'Karbala'),
  ('بابل', 'Babylon'),
  ('الحله', 'Hillah'),
  ('الانبار', 'Anbar'),
  ('ديالى', 'Diyala'),
  ('صلاح الدين', 'Saladin'),
  ('واسط', 'Wasit'),
  ('الكوت', 'Kut'),
  ('ذي قار', 'Dhi Qar'),
  ('الناصريه', 'Nasiriyah'),
  ('ميسان', 'Maysan'),
  ('العماره', 'Amarah'),
  ('المثنى', 'Muthanna'),
  ('السماوه', 'Samawah'),
  ('القادسيه', 'Al-Qadisiyyah'),
  ('الديوانيه', 'Diwaniyah'),
];

final _arabicLetters = RegExp(r'[\u0600-\u06FF]');

class AppStrings {
  final String lang;
  const AppStrings(this.lang);

  bool get isAr => lang == 'ar';

  // ─── Navigation ───────────────────────────────────────────────────────────
  String get navHome => isAr ? 'الرئيسية' : 'Home';
  String get navCategories => isAr ? 'الفئات' : 'Categories';
  String get navAssistant => isAr ? 'المساعد' : 'AI';
  String get navOffers => isAr ? 'عروضنا' : 'Offers';
  String get navBrands => isAr ? 'البراندات' : 'Brands';
  String get navCart => isAr ? 'السلة' : 'Cart';
  String get navAccount => isAr ? 'حسابي' : 'Account';

  // ─── Language ─────────────────────────────────────────────────────────────
  String get chooseLanguage => isAr ? 'اختاري اللغة' : 'Choose Language';
  String get chooseLanguageSubtitle =>
      isAr ? 'يمكنك تغييرها لاحقاً من حسابي' : 'You can change it later from Account';
  String get arabic => 'العربية';
  String get english => 'English';
  String get language => isAr ? 'اللغة' : 'Language';
  String get languageChanged => isAr ? 'تم تغيير اللغة' : 'Language changed';
  String get continueBtn => isAr ? 'متابعة' : 'Continue';

  // ─── Home ─────────────────────────────────────────────────────────────────
  String get storeTagline => isAr ? 'متجرك للعناية والجمال' : 'Your beauty & care store';
  String get goodMorning => isAr ? 'صباح الخير' : 'Good morning';
  String get goodAfternoon => isAr ? 'مساء الخير' : 'Good afternoon';
  String get goodEvening => isAr ? 'مساء النور' : 'Good evening';
  String get whatAreYouLookingFor => isAr ? 'ماذا تبحثين اليوم؟' : 'What are you looking for today?';
  String get searchHintHome =>
      isAr ? 'ابحثي عن منتج، براند، أو باركود…' : 'Search products, brands, or barcodes…';
  String get searchHint =>
      isAr ? 'ابحثي بالعربي أو الإنجليزي…' : 'Search in Arabic or English…';
  String get scan => isAr ? 'مسح' : 'Scan';
  String get scanBarcode => isAr ? 'مسح الباركود' : 'Scan Barcode';
  String get authentic => isAr ? 'أصلية' : 'Authentic';
  String get fastDelivery => isAr ? 'توصيل سريع' : 'Fast delivery';
  String get supportShort => isAr ? 'دعم' : 'Support';
  String freeShippingPlus(String amount) =>
      isAr ? 'شحن مجاني +$amount' : 'Free shipping +$amount';
  String get shopByCategory => isAr ? 'تسوقي حسب القسم' : 'Shop by Category';
  String get shopBySkinConcern => isAr ? 'تسوقي حسب مشكلتك' : 'Shop by Skin Concern';
  String get careTabConcerns => isAr ? 'مشاكل' : 'Concerns';
  String get careTabRoutine => isAr ? 'روتين' : 'Routine';
  String get careTabCategories => isAr ? 'أقسام' : 'Categories';
  String get careTabProducts => isAr ? 'منتجات' : 'Products';
  String get skinRoutineTitle => isAr ? 'روتين البشرة' : 'Skincare Routine';
  String get careProductsTitle => isAr ? 'منتجات العناية' : 'Care Products';
  String get topOffers => isAr ? 'أقوى العروض' : 'Top Offers';
  String get viewAll => isAr ? 'عرض الكل' : 'View All';
  String get categoriesTitle => isAr ? 'الفئات' : 'Categories';
  String get quickOffers => isAr ? 'العروض' : 'Offers';
  String get quickBrands => isAr ? 'براندات' : 'Brands';
  String get viewAllBrands => isAr ? 'استكشفي كل البراندات' : 'Explore All Brands';
  String get brandsPageSubtitle =>
      isAr ? 'علاماتك المفضلة في مكان واحد' : 'Your favorite brands in one place';
  String get brandsByCategory => isAr ? 'حسب القسم' : 'By Category';
  String get quickWishlist => isAr ? 'المفضلة' : 'Wishlist';
  String get whatsappHelpMessage => isAr ? 'مرحباً، أحتاج مساعدة' : 'Hello, I need help';

  // ─── Account ──────────────────────────────────────────────────────────────
  String get myPurchases => isAr ? 'مشترياتي' : 'My Purchases';
  String get myOrders => isAr ? 'طلباتي' : 'My Orders';
  String get wishlist => isAr ? 'المفضلة' : 'Wishlist';
  String get brands => isAr ? 'العلامات التجارية' : 'Brands';
  String get myAccount => isAr ? 'حسابي' : 'My Account';
  String get addresses => isAr ? 'عناويني' : 'Addresses';
  String get loyaltyPoints => isAr ? 'نقاط الولاء' : 'Loyalty Points';
  String get notifications => isAr ? 'الإشعارات' : 'Notifications';
  String get support => isAr ? 'الدعم' : 'Support';
  String get whatsappSupport => isAr ? 'تواصلي عبر واتساب' : 'Contact via WhatsApp';
  String get callUs => isAr ? 'اتصل بنا' : 'Call Us';
  String get emailSupport => isAr ? 'راسلينا بالبريد' : 'Email us';
  String get settings => isAr ? 'الإعدادات' : 'Settings';
  String get editProfile => isAr ? 'تعديل البيانات' : 'Edit Profile';
  String get changePassword => isAr ? 'تغيير كلمة المرور' : 'Change Password';
  String get aboutApp => isAr ? 'عن التطبيق' : 'About';
  String get openSourceLicenses => isAr ? 'تراخيص مفتوحة المصدر' : 'Open Source Licenses';
  String get licensesSubtitle => isAr
      ? 'المكتبات المستخدمة في التطبيق وتراخيصها'
      : 'Libraries used in this app and their licenses';
  String get searchPackages => isAr ? 'ابحثي عن مكتبة...' : 'Search packages...';
  String get noPackagesFound => isAr ? 'لا توجد نتائج' : 'No packages found';
  String packageCount(int n) => isAr
      ? arCount(n, one: 'مكتبة واحدة', two: 'مكتبتان', few: 'مكتبات', many: 'مكتبة')
      : enCount(n, 'package', 'packages');
  String get website => isAr ? 'الموقع' : 'Website';
  String get visitWebsite => isAr ? 'زيارة الموقع' : 'Visit website';
  String get shareProduct => isAr ? 'مشاركة المنتج' : 'Share product';
  String get linkCopied => isAr ? 'تم نسخ الرابط' : 'Link copied';
  String get logout => isAr ? 'تسجيل الخروج' : 'Log Out';
  String get logoutConfirmTitle => isAr ? 'تسجيل الخروج' : 'Log Out';
  String get logoutConfirmBody =>
      isAr ? 'هل تريد تسجيل الخروج من حسابك؟' : 'Do you want to log out of your account?';
  String get deleteAccount => isAr ? 'حذف الحساب' : 'Delete Account';
  String get deleteAccountTitle => isAr ? 'حذف الحساب' : 'Delete Account';
  String get deleteAccountBody => isAr
      ? 'سيتم حذف بياناتك الشخصية (الاسم، البريد، الهاتف، العناوين، المفضلة) وإلغاء جلساتك. تبقى الطلبات السابقة في سجلات المتجر فقط لأغراض قانونية ولا يمكن التراجع عن هذا الإجراء.'
      : 'Your personal data (name, email, phone, addresses, wishlist) and sessions will be removed. Past orders remain in store records for legal purposes only. This cannot be undone.';
  String get deleteAccountConfirm => isAr ? 'حذف نهائياً' : 'Delete Permanently';
  String get deleteAccountSuccess =>
      isAr ? 'تم حذف حسابك بنجاح' : 'Your account has been deleted';
  String get cancel => isAr ? 'إلغاء' : 'Cancel';
  String get explore => isAr ? 'استكشاف' : 'Explore';
  String get login => isAr ? 'تسجيل الدخول' : 'Log In';
  String get register => isAr ? 'إنشاء حساب جديد' : 'Create Account';
  String get createAccount => isAr ? 'إنشاء حساب' : 'Create Account';
  String get guestWelcome => isAr ? 'مرحباً بك في ديما الحياة' : 'Welcome to Deema Alhayat';
  String get guestSubtitle => isAr
      ? 'سجّلي الدخول لحفظ مفضلاتك ومتابعة طلباتك ونقاط الولاء.'
      : 'Sign in to save favorites, track orders, and earn loyalty points.';
  String get loyaltyPointsCount => isAr ? 'نقطة ولاء' : 'loyalty points';
  String get version => isAr ? 'الإصدار' : 'Version';
  String get aboutDescription => isAr
      ? 'متجر ديما الحياة لمستحضرات التجميل والعناية. الدفع عند الاستلام أو بالبطاقة.'
      : 'Deema Alhayat beauty and care store. Cash on delivery.';

  // ─── Categories ───────────────────────────────────────────────────────────
  String get catBrowseTitle => isAr ? 'الأقسام' : 'Categories';
  String get catSearchHint =>
      isAr ? 'ابحثي بين الأقسام… ماسكرا، شامبو، عطور' : 'Search categories… mascara, shampoo';
  String get catLensAll => isAr ? 'كل الأقسام' : 'All';
  String get catShopAll => isAr ? 'تسوقي الكل' : 'Shop all';
  String catProducts(String n) =>
      isAr ? arProducts(_countOf(n)) : '$n ${_countOf(n) == 1 ? 'product' : 'products'}';
  String get catTopBrands => isAr ? 'أبرز البراندات' : 'Top brands';
  String get catBestSellers => isAr ? 'الأكثر طلباً هنا' : 'Most loved here';
  String get catSections => isAr ? 'الأقسام' : 'Sections';
  String catResults(int n) => isAr
      ? arCount(n, one: 'قسم واحد مطابق', two: 'قسمان مطابقان', few: 'أقسام مطابقة', many: 'قسماً مطابقاً')
      : enCount(n, 'matching category', 'matching categories');
  String catSearchInProducts(String q) =>
      isAr ? 'ابحثي عن «$q» في كل المنتجات' : 'Search all products for “$q”';
  String get catNoMatch => isAr ? 'لا يوجد قسم بهذا الاسم' : 'No category matches';
  String get catNoMatchHint =>
      isAr ? 'جرّبي كلمة أخرى، أو ابحثي في المنتجات مباشرة' : 'Try another word, or search products directly';
  String get catWorldHint => isAr ? 'اختاري عالمك' : 'Pick your world';
  String get noCategories => isAr ? 'لا توجد أقسام' : 'No categories';
  String get categoriesHeader => isAr ? 'الأقسام' : 'Categories';
  String get categoriesBrowseHint =>
      isAr ? 'اكتشفي ما يناسبك بصرياً وسهولة' : 'Discover what suits you — visually and easily';
  String get categoriesSearchPlaceholder =>
      isAr ? 'ابحثي عن قسم أو منتج...' : 'Search for a category or product...';
  String get categoriesAndBrands => isAr ? 'أقسام وبراندات' : 'Categories & brands';
  String get brandsAzIndex => isAr ? 'حسب الحرف' : 'A–Z';
  String get searchShort => isAr ? 'بحث' : 'Search';
  String get browseInDetail => isAr ? 'تصفّح بالتفصيل' : 'Browse in detail';
  String groupCount(int n) => isAr
      ? arCount(n, one: 'مجموعة واحدة', two: 'مجموعتان', few: 'مجموعات', many: 'مجموعة')
      : enCount(n, 'group', 'groups');
  String get sectionBrands => isAr ? 'براندات القسم' : 'Category Brands';
  String brandCountLabel(int n) => brandsCount(n);
  String get swipeForMore => isAr ? 'مرّري للمزيد' : 'Swipe for more';
  String subcategoryCount(int n) => isAr ? _arSubSections(n) : enCount(n, 'subcategory', 'subcategories');
  String get allSectionProducts => isAr ? 'كل منتجات القسم' : 'All category products';
  String get subcategories => isAr ? 'الأقسام الفرعية' : 'Subcategories';
  String get tapNameToOpenProducts =>
      isAr ? 'اضغطي على الدائرة لفتح القسم' : 'Tap a circle to open the category';
  String childGroupCount(int n) => isAr ? _arSubSections(n) : enCount(n, 'sub-item', 'sub-items');
  String tertiaryCountLabel(int n) => isAr
      ? arCount(n, one: 'قسم ثانوي واحد', two: 'قسمان ثانويان', few: 'أقسام ثانوية', many: 'قسماً ثانوياً')
      : enCount(n, 'sub-section', 'sub-sections');
  String tertiarySectionsBarCount(int n) =>
      isAr ? 'الأقسام الثانوية · $n' : 'Sub-sections · $n';
  String get browseTertiarySections =>
      isAr ? 'تصفّحي الأقسام الثانوية' : 'Browse sub-sections';
  String get selectTertiarySection =>
      isAr ? 'اختاري قسمًا ثانويًا' : 'Choose a sub-section';
  String get tertiarySectionsHint => isAr
      ? 'اضغطي على القسم الفرعي لعرض الأقسام الثانوية، أو على أيقونة الحقيبة لفتح كل منتجاته'
      : 'Tap a subcategory to expand secondary sections, or the bag icon for all its products';
  String get viewAllProducts => isAr ? 'عرض الكل' : 'View all';
  String get noSubcategories => isAr ? 'لا أقسام فرعية' : 'No subcategories';
  String get browseAllProductsDirect =>
      isAr ? 'تصفّحي كل المنتجات مباشرة' : 'Browse all products directly';
  String get viewProducts => isAr ? 'عرض المنتجات' : 'View Products';
  String get allProducts => isAr ? 'الكل' : 'All';
  String get productsTab => isAr ? 'منتجات' : 'Products';

  // ─── Products ─────────────────────────────────────────────────────────────
  String get products => isAr ? 'المنتجات' : 'Products';
  String get noProducts => isAr ? 'لا توجد منتجات مطابقة' : 'No matching products';
  String get noProductsHint =>
      isAr ? 'جرّبي تغيير الفلاتر أو اختيار قسم آخر' : 'Try changing filters or another category';
  String get sortBy => isAr ? 'ترتيب حسب' : 'Sort by';
  String get lfPrice => isAr ? 'السعر' : 'Price';
  String get lfInStock => isAr ? 'متوفر' : 'In stock';
  String get lfOffers => isAr ? 'عروض' : 'On sale';
  String get lfRating => isAr ? 'التقييم' : 'Rating';
  String get lfClearAll => isAr ? 'مسح الكل' : 'Clear all';
  String get lfAnyPrice => isAr ? 'أي سعر' : 'Any price';
  String get lfCustomPrice => isAr ? 'أو حدّدي نطاقاً' : 'Or set a range';
  String get lfOffersOnly => isAr ? 'العروض والتخفيضات فقط' : 'Discounted items only';
  String get lfShowResults => isAr ? 'عرض النتائج' : 'Show results';
  String lfPriceUnder(String v) => isAr ? 'أقل من $v' : 'Under $v';
  String lfPriceOver(String v) => isAr ? 'أكثر من $v' : 'Over $v';
  String lfPriceBetween(String a, String b) => '$a – $b';
  String lfRatingAtLeast(String r) => isAr ? '$r★ فأكثر' : '$r★ & up';
  String lfResults(String n) =>
      isAr ? arProducts(_countOf(n)) : '$n ${_countOf(n) == 1 ? 'product' : 'products'}';
  String get sort => isAr ? 'ترتيب' : 'Sort';
  String get filter => isAr ? 'تصفية' : 'Filter';
  String get filterProducts => isAr ? 'تصفية المنتجات' : 'Filter Products';
  String get priceRange => isAr ? 'نطاق السعر' : 'Price Range';
  String get minPrice => isAr ? 'الأدنى' : 'Min';
  String get maxPrice => isAr ? 'الأعلى' : 'Max';
  String get inStockOnly => isAr ? 'المتوفر فقط' : 'In stock only';
  String get minRating => isAr ? 'الحد الأدنى للتقييم' : 'Minimum rating';
  String get all => isAr ? 'الكل' : 'All';
  String get reset => isAr ? 'إعادة تعيين' : 'Reset';
  String get apply => isAr ? 'تطبيق' : 'Apply';
  String get productCount => isAr ? 'منتج' : 'products';
  /// العدد مع التمييز الصحيح («4 منتجات»).
  String productsN(int n) => isAr ? arProducts(n) : enCount(n, 'product', 'products');
  String get browseProducts => isAr ? 'تصفّحي واختاري الأنسب' : 'Browse and find your match';
  String get availableProducts => isAr ? 'منتج متاح' : 'products available';
  String get subcategory => isAr ? 'القسم الفرعي' : 'Subcategory';
  String get tertiaryCategory => isAr ? 'القسم الثانوي' : 'Secondary';
  String get selectToFilter => isAr ? 'اخترِ للتصفية' : 'Tap to filter';
  String get brandCount => isAr ? 'براند' : 'brands';

  // Sort labels
  String get sortByBrand => isAr ? 'المقترح' : 'Recommended';
  String get sortLatest => isAr ? 'الأحدث' : 'Latest';
  String get sortPriceAsc => isAr ? 'السعر: من الأقل' : 'Price: Low to High';
  String get sortPriceDesc => isAr ? 'السعر: من الأعلى' : 'Price: High to Low';
  String get sortRating => isAr ? 'الأعلى تقييماً' : 'Top Rated';
  String get sortPopular => isAr ? 'الأكثر مبيعاً' : 'Best Sellers';
  String get sortPriceUp => isAr ? 'السعر ↑' : 'Price ↑';
  String get sortPriceDown => isAr ? 'السعر ↓' : 'Price ↓';
  String get sortRatingShort => isAr ? 'التقييم' : 'Rating';
  String get newArrivals => isAr ? 'وصل حديثاً' : 'New Arrivals';
  String get flashSale => isAr ? 'عرض سريع' : 'Flash Sale';
  String get allOffers => isAr ? 'كل العروض' : 'All Offers';

  // ─── Product detail ───────────────────────────────────────────────────────
  String get description => isAr ? 'الوصف' : 'Description';
  String get ingredients => isAr ? 'المكوّنات' : 'Ingredients';
  String get howToUse => isAr ? 'طريقة الاستخدام' : 'How to Use';
  String get reviews => isAr ? 'تقييم' : 'reviews';
  String get sales => isAr ? 'عملية بيع' : 'sold';
  String get addToCart => isAr ? 'أضيفي للسلة' : 'Add to Cart';
  String get outOfStock => isAr ? 'غير متوفر' : 'Out of Stock';
  String get newBadge => isAr ? 'جديد' : 'New';
  String get offerBadge => isAr ? 'عرض' : 'Sale';
  String get selectShadeFirst => isAr ? 'يرجى اختيار الدرجة أولاً' : 'Please select a shade first';
  String get maxStockReached => isAr ? 'وصلت للحد الأقصى للمخزون' : 'Maximum stock reached';
  String get addedToCart => isAr ? 'أُضيف إلى السلة' : 'Added to cart';
  String get viewCart => isAr ? 'عرض السلة' : 'View Cart';
  String get quantity => isAr ? 'الكمية' : 'Quantity';
  String earnPoints(int points) =>
      isAr ? 'اكسبي ${arPoints(points)} عند شراء هذا المنتج' : 'Earn ${enCount(points, 'point', 'points')} when you buy this';
  String get bestSeller => isAr ? 'الأكثر مبيعاً' : 'Best Seller';
  String reviewCount(int n) => isAr
      ? '(${arCount(n, one: 'تقييم واحد', two: 'تقييمان', few: 'تقييمات', many: 'تقييماً')})'
      : '(${enCount(n, 'review', 'reviews')})';
  String savePercent(int p) => isAr ? 'وفّري \u2066$p%\u2069' : 'Save $p%';
  String get outOfStockNow => isAr ? 'غير متوفر حالياً' : 'Currently out of stock';
  String lowStock(int stock) {
    if (stock <= 0) return outOfStockNow;
    return isAr
        ? (stock == 1 ? 'آخر قطعة' : 'بقيت ${arPieces(stock)}')
        : (stock == 1 ? 'Last one' : 'Only $stock left');
  }
  String get inStock => isAr ? 'متوفر في المخزون' : 'In stock';
  String get selectShade => isAr ? 'اختاري التدرج' : 'Select shade';
  String get scrollAllShades => isAr ? 'مرّري لعرض كل التدرجات' : 'Swipe to see all shades';
  String shadePosition(int current, int total) =>
      isAr ? '$current من $total' : '$current of $total';
  String get authentic100 => isAr ? 'منتجات\nأصلية 100%' : '100%\nAuthentic';
  String get securePayment => isAr ? 'نقداً\nأو بالبطاقة' : 'Cash\nor card';
  String get thanksForReview => isAr ? 'شكراً على تقييمك!' : 'Thanks for your review!';
  String get ratingsTitle => isAr ? 'التقييمات' : 'Ratings';
  String get addReview => isAr ? 'أضيفي تقييماً' : 'Add a review';
  String fromReviews(int n) => isAr
      ? 'من ${arCount(n, one: 'تقييم واحد', two: 'تقييمين', few: 'تقييمات', many: 'تقييماً')}'
      : 'from ${enCount(n, 'review', 'reviews')}';
  String get reviewHint => isAr ? 'اكتبي تجربتك مع المنتج...' : 'Share your experience...';
  String get submitReview => isAr ? 'إرسال التقييم' : 'Submit review';
  String get beFirstToReview => isAr ? 'كوني أول من يقيّم هذا المنتج' : 'Be the first to review';
  String get loginToReview => isAr ? 'سجّلي الدخول لإضافة تقييم' : 'Sign in to add a review';
  String get youMayAlsoLike => isAr ? 'قد يعجبكِ أيضاً' : 'You may also like';
  String get total => isAr ? 'الإجمالي' : 'Total';
  String totalWithQty(int qty) =>
      isAr ? 'الإجمالي (${arPieces(qty)})' : 'Total (${enCount(qty, 'item', 'items')})';
  String get addToCartBtn => isAr ? 'إضافة إلى السلة' : 'Add to Cart';
  String get soldOut => isAr ? 'نفد' : 'Sold out';

  // ─── Cart ─────────────────────────────────────────────────────────────────
  String get cartTitle => isAr ? 'سلة التسوّق' : 'Shopping Cart';
  String get clearCartTitle => isAr ? 'تفريغ السلة؟' : 'Clear cart?';
  String get clearCartBody =>
      isAr ? 'سيتم حذف جميع المنتجات من سلتك.' : 'All items will be removed from your cart.';
  String get clearCart => isAr ? 'تفريغ' : 'Clear';
  String get clearCartTooltip => isAr ? 'تفريغ السلة' : 'Clear cart';
  String get enterCouponCode => isAr ? 'أدخلي كود الخصم' : 'Enter discount code';
  String get invalidCoupon => isAr ? 'كود الخصم غير صالح أو منتهي' : 'Invalid or expired coupon';
  String minOrderAmount(String amount) =>
      isAr ? 'الحد الأدنى للطلب $amount' : 'Minimum order $amount';
  String couponApplied(String code) =>
      isAr ? 'تم تطبيق الكوبون $code' : 'Coupon $code applied';

  // ─── Offers ───────────────────────────────────────────────────────────────
  String get offersTitle => isAr ? 'العروض' : 'Offers';
  String get noOffersNow => isAr ? 'لا توجد عروض حالياً' : 'No offers right now';
  String get checkBackSoon =>
      isAr ? 'عودي قريباً لاكتشاف تخفيضات جديدة' : 'Check back soon for new deals';
  String get browseProductsBtn => isAr ? 'تصفّح المنتجات' : 'Browse Products';
  String get offerProducts => isAr ? 'منتجات العروض' : 'Offer Products';
  String get loading => isAr ? 'جاري التحميل…' : 'Loading…';
  String productsAvailableNow(int n) =>
      isAr ? '$n+ منتج متاح الآن' : '$n+ products available now';
  String get endsSoon => isAr ? 'ينتهي قريباً' : 'Ends soon';
  String promoProductsCount(int n) =>
      isAr ? '$n+ منتج بأسعار مخفّضة' : '$n+ products on sale';
  String get discoverBestDeals =>
      isAr ? 'اكتشفي أقوى التخفيضات على منتجاتنا' : 'Discover our best deals';
  String get authentic100Short => isAr ? 'أصلية 100%' : '100% Authentic';
  String get easyReturns => isAr ? 'استبدال سهل' : 'Easy returns';
  String get retry => isAr ? 'إعادة' : 'Retry';

  // ─── Search ───────────────────────────────────────────────────────────────
  String get recentlyViewed => isAr ? 'شاهدت مؤخراً' : 'Recently Viewed';
  String get noSearchResults => isAr ? 'لا توجد منتجات مطابقة' : 'No matching products';
  String get searchProductsSection => isAr ? 'المنتجات' : 'Products';
  String searchProductsFound(int count) =>
      isAr ? arProducts(count) : enCount(count, 'product', 'products');
  String get searchBrowseAlso => isAr ? 'تصفّحي أيضاً' : 'Browse also';
  String get searchInStore => isAr ? 'ابحثي في ديما الحياة' : 'Search Deema Alhayat';
  String get searchInStoreHint => isAr
      ? 'ابحثي بالعربي أو الإنجليزي — الاسم، البراند، القسم، أو الباركود'
      : 'Search in Arabic or English — name, brand, category, or barcode';
  String get recentSearches => isAr ? 'بحثتِ عنها' : 'Recent searches';
  String get alsoMatches => isAr ? 'يطابق أيضاً' : 'Also matches';
  String get quickIdeas => isAr ? 'اقتراحات سريعة' : 'Quick ideas';
  String get clear => isAr ? 'مسح' : 'Clear';
  String get scanResults => isAr ? 'نتائج المسح' : 'Scan Results';
  String get scanHint => isAr ? 'وجّهي الكاميرا نحو باركود المنتج' : 'Point the camera at the product barcode';
  String get switchCamera => isAr ? 'تبديل الكاميرا' : 'Switch camera';
  String get flash => isAr ? 'الفلاش' : 'Flash';

  // ─── Wishlist ─────────────────────────────────────────────────────────────
  String get wishlistIsEmpty => isAr ? 'قائمة المفضلة فارغة' : 'Your wishlist is empty';
  String get wishlistAddHint => isAr
      ? 'احفظي ما يعجبكِ بلمسة القلب — ونُنبّهكِ فور انخفاض سعره'
      : 'Tap the heart to save what you love — we\'ll alert you when the price drops';

  // ─── Brands ───────────────────────────────────────────────────────────────
  String get noBrands => isAr ? 'لا توجد علامات' : 'No brands';
  String get tryAnotherSearch =>
      isAr ? 'جرّبي كلمة بحث أخرى' : 'Try a different search term';

  // ─── Cart (extended) ──────────────────────────────────────────────────────
  String get cartEmptyTitle => isAr ? 'سلتك فارغة' : 'Your cart is empty';
  String get cartEmptySubtitle => isAr
      ? 'اكتشفي أجمل منتجات التجميل وأضيفيها لسلتك'
      : 'Discover beauty products and add them to your cart';
  String get shopNow => isAr ? 'تسوّقي الآن' : 'Shop Now';
  String get discountCodeLabel => isAr ? 'كود الخصم' : 'Discount code';
  String get enterDiscountHint => isAr ? 'أدخلي كود الخصم' : 'Enter discount code';
  String get applyCode => isAr ? 'تطبيق الكود' : 'Apply code';
  String get orderSummary => isAr ? 'ملخص الطلب' : 'Order summary';
  String subtotalItems(int count) =>
      isAr ? 'المجموع (${arProducts(count)})' : 'Subtotal (${enCount(count, 'item', 'items')})';
  String get couponDiscount => isAr ? 'خصم الكوبون' : 'Coupon discount';
  String get shippingAtCheckout => isAr ? 'يُحسب عند الدفع' : 'Calculated at checkout';
  String get shippingByDeliveryArea =>
      isAr ? 'يُحدَّد بعد اختيار المنطقة' : 'Set after delivery area';
  String get freeDelivery => isAr ? 'توصيل مجاني' : 'Free delivery';
  String get checkoutBtn => isAr ? 'إتمام الشراء' : 'Checkout';
  String savedAmount(String amount) => isAr ? 'وفّرت $amount' : 'You saved $amount';
  String get freeShippingActivated => isAr ? 'شحن مجاني مُفعّل' : 'Free shipping applied';
  String get freeShippingWithCoupon =>
      isAr ? 'شحن مجاني مع الكوبون!' : 'Free shipping with coupon!';
  String get freeShippingCongrats =>
      isAr ? 'مبروك! توصيل مجاني' : 'Congrats! Free delivery';
  String remainingForFreeShipping(String amount) =>
      isAr ? 'باقي $amount للتوصيل المجاني' : '$amount left for free shipping';
  String get removeCoupon => isAr ? 'إزالة الكوبون' : 'Remove coupon';

  // ─── Home sections ────────────────────────────────────────────────────────
  String get limitedOffers => isAr ? 'عروض محدودة' : 'Limited offers';
  String get collections => isAr ? 'مجموعات' : 'Collections';
  String get strongestOffers => isAr ? 'أقوى العروض' : 'Top deals';

  // ─── Orders ───────────────────────────────────────────────────────────────
  String get orderDetails => isAr ? 'تفاصيل الطلب' : 'Order Details';
  String get cancelOrder => isAr ? 'إلغاء الطلب' : 'Cancel Order';
  String get cancelOrderConfirm =>
      isAr ? 'هل أنتِ متأكدة من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?';
  String get goBack => isAr ? 'تراجع' : 'Go Back';
  String get reorder => isAr ? 'إعادة الطلب' : 'Reorder';
  String get continueShopping => isAr ? 'متابعة التسوق' : 'Continue Shopping';
  String get subtotal => isAr ? 'المجموع الفرعي' : 'Subtotal';
  String get discount => isAr ? 'الخصم' : 'Discount';
  String get shipping => isAr ? 'الشحن' : 'Shipping';
  String get free => isAr ? 'مجاني' : 'Free';
  String get cashOnDelivery => isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery';

  // ─── Checkout ─────────────────────────────────────────────────────────────
  String get checkout => isAr ? 'إتمام الطلب' : 'Checkout';
  String usePoints(int points) =>
      isAr ? 'استخدمي ${arPoints(points)}' : 'Use ${enCount(points, 'point', 'points')}';

  // ─── Package ──────────────────────────────────────────────────────────────
  String get packageTitle => isAr ? 'الباقة' : 'Package';

  // ─── Addresses ────────────────────────────────────────────────────────────
  String get deleteAddress => isAr ? 'حذف العنوان' : 'Delete Address';
  String get setDefaultAddress => isAr ? 'تعيين كعنوان افتراضي' : 'Set as default address';

  // ─── Loyalty ──────────────────────────────────────────────────────────────
  String get loginToSeePoints => isAr ? 'سجّلي الدخول لعرض نقاطك' : 'Sign in to view your points';
  String get pointsHistory => isAr ? 'سجل النقاط' : 'Points History';
  String get loyaltyAvailablePoints => isAr ? 'نقطة متاحة' : 'points available';
  /// «كل نقطة = 1 د.ع خصم — تُستخدم بمضاعفات 250 عند الدفع».
  String loyaltyRedeemAtCheckout(String perPoint, int step) => isAr
      ? 'كل نقطة = $perPoint خصم — تُستخدم بمضاعفات $step عند إتمام الطلب'
      : 'Each point = $perPoint off — redeem in steps of $step at checkout';
  /// «اكسبي 10 نقاط عن كل 1,000 د.ع من طلبكِ».
  String loyaltyEarnOnOrder(int perThousand) => isAr
      ? 'اكسبي ${arPoints(perThousand)} عن كل 1,000 د.ع من طلبكِ'
      : 'Earn ${enCount(perThousand, 'point', 'points')} for every 1,000 IQD you spend';
  String get noHistoryYet => isAr ? 'لا يوجد سجل بعد' : 'No history yet';
  String get pointsWillAppearHere =>
      isAr ? 'ستظهر معاملات النقاط هنا' : 'Point transactions will appear here';

  String get loginToViewOrders =>
      isAr ? 'سجّلي الدخول لعرض طلباتك' : 'Sign in to view your orders';
  String get loginToViewWishlist =>
      isAr ? 'سجّلي الدخول لعرض المفضلة' : 'Sign in to view your wishlist';
  String get wishlistEmptySubtitle => isAr
      ? 'احفظي منتجاتك المفضلة وتابعها بسهولة'
      : 'Save your favorite products and track them easily';
  String get deliveryAddress => isAr ? 'عنوان التوصيل' : 'Delivery Address';
  String get paymentSummary => isAr ? 'ملخّص الدفع' : 'Payment Summary';
  String get save => isAr ? 'حفظ' : 'Save';
  String get searchBrandsHint => isAr ? 'ابحثي عن علامة...' : 'Search brands...';
  String get loginToEditProfile =>
      isAr ? 'سجّلي الدخول لتعديل بياناتك' : 'Sign in to edit your profile';
  String get loginToManageAddresses =>
      isAr ? 'سجّلي الدخول لإدارة عناوينك' : 'Sign in to manage your addresses';
  String get loginToCheckout =>
      isAr ? 'سجّلي الدخول لإتمام الطلب' : 'Sign in to complete checkout';
  String get loginToViewNotifications =>
      isAr ? 'سجّلي الدخول لعرض الإشعارات' : 'Sign in to view notifications';
  String get emptyCartTitle => isAr ? 'السلة فارغة' : 'Your cart is empty';
  String get emptyCartSubtitle =>
      isAr ? 'أضيفي منتجات قبل إتمام الطلب' : 'Add products before checkout';
  String get goToCart => isAr ? 'الذهاب للسلة' : 'Go to Cart';
  String itemCountLabel(int count) => itemsCount(count);
  String get confirmOrder => isAr ? 'تأكيد الطلب' : 'Place Order';
  String get delete => isAr ? 'حذف' : 'Delete';
  String get deleteAddressConfirm =>
      isAr ? 'هل تريد حذف هذا العنوان؟' : 'Delete this address?';
  String get newAddress => isAr ? 'عنوان جديد' : 'New Address';
  String get addAddress => isAr ? 'إضافة عنوان' : 'Add Address';
  String get addressSaved => isAr ? 'تم حفظ العنوان' : 'Address saved';
  String get loginToChangePassword =>
      isAr ? 'سجّلي الدخول لتغيير كلمة المرور' : 'Sign in to change your password';
  String get defaultLabel => isAr ? 'افتراضي' : 'Default';

  String sortLabelFor(String key) => switch (key) {
        'default' => sortByBrand,
        'latest' => sortLatest,
        'price_asc' => sortPriceAsc,
        'price_desc' => sortPriceDesc,
        'rating' => sortRating,
        'popular' => sortPopular,
        _ => sort,
      };

  String sortShortFor(String key) => switch (key) {
        'default' => sortByBrand,
        'latest' => sortLatest,
        'price_asc' => sortPriceUp,
        'price_desc' => sortPriceDown,
        'rating' => sortRatingShort,
        'popular' => sortPopular,
        _ => sort,
      };

  String greetingForHour(int hour) {
    if (hour < 12) return goodMorning;
    if (hour < 17) return goodAfternoon;
    return goodEvening;
  }

  // ─── Auth screens ─────────────────────────────────────────────────────────
  String get welcomeBack => isAr ? 'مرحباً بعودتك' : 'Welcome back';
  String get loginPhoneSubtitle =>
      isAr ? 'سجّلي دخولك برقم هاتفك لمتابعة التسوّق' : 'Sign in with your phone to continue shopping';
  String get registerJoinTitle => isAr ? 'انضمّي إلى ديما الحياة' : 'Join Deema Alhayat';
  String get registerPhoneSubtitle => isAr
      ? 'أنشئي حسابكِ برقم هاتفكِ وابدئي التسوّق واكسبي نقاط الولاء'
      : 'Create your account with your phone and start earning loyalty points';
  String get fullName => isAr ? 'الاسم الكامل' : 'Full name';
  String get phoneNumber => isAr ? 'رقم الهاتف' : 'Phone number';
  String get password => isAr ? 'كلمة المرور' : 'Password';
  String get passwordMin6 =>
      isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters';
  String get enterYourName => isAr ? 'أدخلي اسمك' : 'Enter your name';
  String get enterYourNameShort => isAr ? 'أدخلي الاسم' : 'Enter your name';
  String get noAccountYet => isAr ? 'ليس لديك حساب؟' : "Don't have an account?";
  String get haveAccountAlready => isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?';
  String get signUp => isAr ? 'أنشئي حساباً' : 'Sign up';
  String get signIn => isAr ? 'سجّلي الدخول' : 'Sign in';
  String get totalLabel => isAr ? 'الإجمالي' : 'Total';
  String get yourProducts => isAr ? 'منتجاتك' : 'Your items';
  String get haveCouponCode => isAr ? 'لديك كود خصم؟' : 'Have a discount code?';
  String get enterCode => isAr ? 'أدخلي الكود' : 'Enter code';
  String get applyBtn => isAr ? 'تطبيق' : 'Apply';
  String itemRemoved(String name) => isAr ? 'حُذف «$name»' : 'Removed "$name"';
  String get maxQtyReached =>
      isAr ? 'وصلتِ للحد الأقصى المتاح' : 'Maximum available quantity reached';
  String get enterCouponPrompt => isAr ? 'أدخلي كود الخصم' : 'Enter a discount code';
  String get invalidCouponShort => isAr ? 'الكوبون غير صالح' : 'Invalid coupon';
  String get cardPaymentDisabled => isAr
      ? 'الدفع بالبطاقة قيد التفعيل — اختاري الدفع عند الاستلام حالياً'
      : 'Card payment is not available yet — please use cash on delivery';

  // ─── Checkout (extended) ──────────────────────────────────────────────────
  String get recipientInfo => isAr ? 'بيانات المستلم' : 'Recipient details';
  String get recipientAutoFill =>
      isAr ? 'تُملأ تلقائياً من حسابك — يمكنك تعديلها' : 'Auto-filled from your account — you can edit';
  String get deliveryLocation => isAr ? 'عنوان التوصيل' : 'Delivery address';
  String get deliveryLocationHint => isAr
      ? 'اختاري محافظتك واكتبي العنوان بالتفصيل'
      : 'Select your governorate and enter your address';
  String get streetLabel => isAr ? 'الشارع / أقرب نقطة دالة' : 'Street / landmark';
  String get enterStreet => isAr ? 'أدخلي الشارع أو نقطة دالة' : 'Enter street or landmark';
  String get houseOptional => isAr ? 'رقم المنزل / الشقة (اختياري)' : 'House / apt (optional)';
  String get governorate => isAr ? 'المحافظة' : 'Governorate';
  String get selectGovernorate => isAr ? 'اختاري المحافظة' : 'Select governorate';
  String get areaLabel => isAr ? 'المنطقة' : 'Area';
  String get selectArea => isAr ? 'اختاري المنطقة' : 'Select area';
  String get governorateCity => isAr ? 'المحافظة / المدينة' : 'Governorate / city';
  String get requiredField => isAr ? 'مطلوب' : 'Required';
  String get paymentMethod => isAr ? 'طريقة الدفع' : 'Payment method';
  String get cardComingSoon => isAr ? 'قريباً' : 'Soon';
  String get cardPayment => isAr ? 'بطاقة ائتمان / مدى' : 'Credit / debit card';
  String get cardPaymentSoon => isAr
      ? 'قريباً — سيتم تفعيل الدفع الإلكتروني'
      : 'Coming soon — online payment will be enabled';
  String get orderNotes => isAr ? 'ملاحظات الطلب' : 'Order notes';
  String get orderNotesHint =>
      isAr ? 'تعليمات إضافية للتوصيل (اختياري)' : 'Extra delivery instructions (optional)';
  String get notes => isAr ? 'ملاحظات' : 'Notes';
  String get deliveryStep => isAr ? 'التوصيل' : 'Delivery';
  String get paymentStep => isAr ? 'الدفع' : 'Payment';
  String get confirmStep => isAr ? 'تأكيد' : 'Confirm';
  String get useLoyaltyPoints => isAr ? 'نقاط الولاء' : 'Loyalty points';
  String loyaltyUseTitle(int points) =>
      isAr ? 'استخدمي ${arPoints(points)} ولاء' : 'Use ${enCount(points, 'loyalty point', 'loyalty points')}';
  String loyaltyDiscountHint(String discount) => isAr
      ? 'خصم $discount من فاتورتكِ'
      : '$discount off your order';
  String loyaltyPointsRule(String perPoint) => isAr
      ? 'كل نقطة = $perPoint خصم من الفاتورة'
      : 'Each point = $perPoint off your order';
  String loyaltyPointsNeedMore(int step) => isAr
      ? 'تحتاجين ${arPoints(step)} على الأقل للاستخدام'
      : 'You need at least ${enCount(step, 'point', 'points')} to redeem';
  String loyaltyPointsUsed(int points) =>
      isAr ? 'نقاط مستخدمة ($points)' : 'Points used ($points)';
  String loyaltyPointsEarned(int points) =>
      isAr ? 'نقاط مكتسبة (+$points)' : 'Points earned (+$points)';
  String get orderPlacedSuccess => isAr ? 'تم استلام طلبك بنجاح!' : 'Your order was placed successfully!';
  String orderNumberLabel(String num) => isAr ? 'رقم الطلب: $num' : 'Order #$num';
  String get orderPlacedCodNote => isAr
      ? 'سيتواصل معك فريقنا لتأكيد الطلب.\nالدفع عند الاستلام نقداً.'
      : 'Our team will contact you to confirm.\nCash on delivery.';
  String get trackOrder => isAr ? 'تتبّع الطلب' : 'Track order';
  String get codPaymentSubtitle =>
      isAr ? 'ادفعي نقداً عند استلام الطلب' : 'Pay in cash when you receive your order';
  String couponAppliedShort(String code) =>
      isAr ? 'تم تطبيق $code' : 'Applied $code';

  // ─── Errors & legal (store review) ────────────────────────────────────────
  String get loadFailed => isAr ? 'تعذّر التحميل' : 'Could not load';
  String get retryAction => isAr ? 'إعادة المحاولة' : 'Try again';
  String get pageNotFound => isAr ? 'الصفحة غير موجودة' : 'Page not found';
  String get goHome => isAr ? 'الرئيسية' : 'Home';
  String get privacyPolicy => isAr ? 'سياسة الخصوصية' : 'Privacy Policy';
  String get termsOfService => isAr ? 'شروط الاستخدام' : 'Terms of Service';
  String get legalSection => isAr ? 'القانونية' : 'Legal';
  String get legalInAppNotice => isAr
      ? 'النص أدناه معروض داخل التطبيق. يمكنك أيضاً فتح النسخة الرسمية على موقعنا.'
      : 'The text below is shown in the app. You can also open the official version on our website.';
  String get viewOnWebsite => isAr ? 'فتح على الموقع' : 'Open on website';
  String get linkOpenFailed =>
      isAr ? 'تعذّر فتح الرابط — تحققي من الاتصال بالإنترنت' : 'Could not open the link — check your internet connection';
  String get agreeToTermsLabel => isAr
      ? 'أوافق على شروط الاستخدام وسياسة الخصوصية'
      : 'I agree to the Terms of Service and Privacy Policy';
  String get mustAcceptTerms =>
      isAr ? 'يجب الموافقة على الشروط للمتابعة' : 'You must accept the terms to continue';
  String get andWord => isAr ? 'و' : 'and';
  String get noNotifications => isAr ? 'لا توجد إشعارات' : 'No notifications';
  String get notificationsEmptySubtitle =>
      isAr ? 'ستصلك الإشعارات هنا' : 'Notifications will appear here';
  String get markAllRead => isAr ? 'تعليم الكل كمقروء' : 'Mark all as read';
  String get errorOccurred => isAr ? 'حدث خطأ' : 'Something went wrong';
  String get passwordChangedSuccess => isAr
      ? 'تم تغيير كلمة المرور وتسجيل الخروج من الأجهزة الأخرى'
      : 'Password changed. Other devices were signed out.';
  String get changePasswordInstructions => isAr
      ? 'أدخلي كلمة المرور الحالية ثم اختاري كلمة مرور جديدة (6 أحرف على الأقل).'
      : 'Enter your current password, then choose a new one (at least 6 characters).';
  String get currentPassword => isAr ? 'كلمة المرور الحالية' : 'Current password';
  String get newPassword => isAr ? 'كلمة المرور الجديدة' : 'New password';
  String get confirmPassword => isAr ? 'تأكيد كلمة المرور' : 'Confirm password';
  String get confirmPasswordRequired =>
      isAr ? 'أكّدي كلمة المرور' : 'Confirm your password';
  String get passwordsDoNotMatch =>
      isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
  String get noAddresses => isAr ? 'لا توجد عناوين' : 'No addresses';
  String get noAddressesHint => isAr
      ? 'أضيفي عنواناً لتسهيل عملية الشراء'
      : 'Add an address for faster checkout';
  String get edit => isAr ? 'تعديل' : 'Edit';
  String get quantityLabel => isAr ? 'الكمية' : 'Quantity';
  String get addMoreForFreeShipping => isAr ? 'أضيفي المزيد' : 'Add more';
  String get profileUpdated => isAr ? 'تم تحديث البيانات' : 'Profile updated';
  String get noAddressesSaved => isAr ? 'لا توجد عناوين محفوظة' : 'No saved addresses';
  String get setAsDefault => isAr ? 'تعيين كافتراضي' : 'Set as default';
  String get defaultAddress => isAr ? 'العنوان الافتراضي' : 'Default address';

  // ─── Counts (تمييز العدد) ─────────────────────────────────────────────────
  /// «3 منتجات» / «1 item».
  String itemsCount(int n) => isAr ? arProducts(n) : enCount(n, 'item', 'items');
  /// «قسمان» / «12 sections».
  String sectionCount(int n) => isAr ? arSections(n) : enCount(n, 'section', 'sections');
  /// «5 طلبات» / «1 order».
  String ordersCount(int n) => isAr ? arOrders(n) : enCount(n, 'order', 'orders');
  /// «خطوتان» / «3 steps».
  String stepsCount(int n) => isAr ? arSteps(n) : enCount(n, 'step', 'steps');
  /// «3 قطع» / «1 piece».
  String piecesCount(int n) => isAr ? arPieces(n) : enCount(n, 'piece', 'pieces');
  /// «12 برانداً» / «1 brand».
  String brandsCount(int n) => isAr
      ? arCount(n, one: 'براند واحد', two: 'براندان', few: 'براندات', many: 'برانداً')
      : enCount(n, 'brand', 'brands');
  /// «لديكِ إشعاران جديدان» / «You have 2 new notifications».
  String newNotificationsCount(int n) {
    if (n <= 0) return isAr ? 'لا إشعارات جديدة' : 'No new notifications';
    return isAr
        ? 'لديكِ ${arCount(n, one: 'إشعار جديد', two: 'إشعاران جديدان', few: 'إشعارات جديدة', many: 'إشعاراً جديداً')}'
        : 'You have ${enCount(n, 'new notification', 'new notifications')}';
  }
  /// «باقي يومين» / «3 days left» — وصفر يعني اليوم الأخير.
  String daysLeft(int n) {
    if (n <= 0) return isAr ? 'آخر يوم' : 'Last day';
    if (isAr) return n == 1 ? 'باقي يوم' : 'باقي ${arDays(n)}';
    return '${enCount(n, 'day', 'days')} left';
  }

  /// سعر مختصر بالآلاف: «25 ألف د.ع» / «25K IQD».
  String priceThousands(int k) => isAr ? '${arThousands(k)} ${AppConfig.currency}' : '${_grouped(k)}K IQD';
  /// «في سلتكِ 3 منتجات» / «3 items in your bag».
  String cartItemsCount(int n) {
    if (n <= 0) return isAr ? 'سلتكِ فارغة' : 'Your bag is empty';
    return isAr ? 'في سلتكِ ${arProducts(n)}' : '${enCount(n, 'item', 'items')} in your bag';
  }

  // ─── Order status ─────────────────────────────────────────────────────────
  /// تسمية حالة الطلب — REFUNDED (من السيرفر) وRETURNED (قديم) كلاهما «مُسترجع».
  String orderStatus(String status) => switch (status.toUpperCase()) {
        'PENDING' => isAr ? 'قيد المراجعة' : 'Under review',
        'CONFIRMED' => isAr ? 'مؤكد' : 'Confirmed',
        'PROCESSING' => isAr ? 'قيد التجهيز' : 'Preparing',
        'SHIPPED' => isAr ? 'تم الشحن' : 'Shipped',
        'DELIVERED' => isAr ? 'تم التسليم' : 'Delivered',
        'CANCELLED' => isAr ? 'ملغي' : 'Cancelled',
        'REFUNDED' || 'RETURNED' => isAr ? 'مُسترجع' : 'Refunded',
        _ => status,
      };

  // ─── Model labels ─────────────────────────────────────────────────────────
  /// فائدة الكوبون بلغة الواجهة: «خصم 20%» / «5,000 IQD off» / «Free delivery».
  String couponBenefit(Coupon c) => switch (c.type) {
        'PERCENT' || 'FIRST_ORDER' => couponOff(c.value),
        'FIXED' || 'AMOUNT' => couponOffIqd(formatPrice(c.value, lang: lang)),
        'FREE_SHIPPING' => freeDelivery,
        _ => c.description.isNotEmpty && (isAr || !_arabicLetters.hasMatch(c.description)) ? c.description : c.code,
      };

  /// شارة رابط الإشعار: تسمية لوحة التحكم إن وُجدت (وبالإنجليزي فقط إن لم تكن عربية)، وإلا نوع الرابط.
  String? notificationLinkHint(AppNotification n) {
    final type = (n.linkType ?? '').toUpperCase();
    if (type.isEmpty || type == 'NONE') return null;
    final generic = switch (type) {
      'OFFERS' => isAr ? 'العروض' : 'Offers',
      'PRODUCT' => isAr ? 'منتج' : 'Product',
      'CATEGORY' => isAr ? 'فئة' : 'Category',
      'BRAND' => isAr ? 'براند' : 'Brand',
      'PACKAGE' => isAr ? 'باقة' : 'Bundle',
      'ORDER' => isAr ? 'طلب' : 'Order',
      'EXTERNAL_URL' => isAr ? 'رابط خارجي' : 'External link',
      _ => null,
    };
    final label = n.linkLabel?.trim() ?? '';
    if (label.isNotEmpty && (isAr || generic == null || !_arabicLetters.hasMatch(label))) return label;
    return generic;
  }

  // ─── Delivery ETA ─────────────────────────────────────────────────────────
  String get today => isAr ? 'اليوم' : 'Today';
  String get tomorrow => isAr ? 'غداً' : 'Tomorrow';
  String get yesterday => isAr ? 'أمس' : 'Yesterday';

  /// اسم المحافظة بلغة الواجهة — يبقى كما أُدخل إن لم يُعرف.
  String governorateName(String name) {
    if (isAr) return name;
    final norm = _normGov(name);
    for (final (ar, en) in _governoratesEn) {
      if (norm.contains(ar)) return en;
    }
    return name;
  }

  /// «يوم واحد» / «يومين» / «يوم إلى يومين» / «2–4 أيام» / «1–3 days».
  String _dayRange(int min, int max) {
    final lo = min < 1 ? 1 : min;
    final hi = max < lo ? lo : max;
    if (!isAr) return lo == hi ? enCount(lo, 'day', 'days') : '$lo–$hi days';
    if (lo == hi) return arDays(lo);
    if (lo == 1 && hi == 2) return 'يوم إلى يومين';
    final m = hi % 100;
    return '$lo–$hi ${m >= 3 && m <= 10 ? 'أيام' : 'يوماً'}';
  }

  /// «التوصيل خلال يومين» / «Delivery in 2 days».
  String deliveryWithinDays(int n) => isAr ? 'التوصيل خلال ${_dayRange(n, n)}' : 'Delivery in ${_dayRange(n, n)}';
  /// «التوصيل لكل المحافظات خلال 1–3 أيام» / «Delivery to all governorates in 1–3 days».
  String deliveryAllIn(int min, int max) => isAr
      ? 'التوصيل لكل المحافظات خلال ${_dayRange(min, max)}'
      : 'Delivery to all governorates in ${_dayRange(min, max)}';
  /// «يصلكِ إلى البصرة غداً» / «يصلكِ بين السبت والاثنين» / «Arrives in Basra on Saturday».
  /// [from] و[to] أسماء أيام جاهزة ([today] و[tomorrow] أو أسماء الأسبوع)، و[to] = null ليوم واحد.
  String deliveryArrives(String? place, String from, String? to) {
    final hasPlace = place != null && place.trim().isNotEmpty;
    if (isAr) {
      final where = hasPlace ? ' إلى ${place.trim()}' : '';
      return to == null ? 'يصلكِ$where $from' : 'يصلكِ$where بين $from و$to';
    }
    final where = hasPlace ? ' in ${governorateName(place.trim())}' : '';
    if (to != null) return 'Arrives$where between $from and $to';
    final relative = from == today || from == tomorrow;
    return 'Arrives$where ${relative ? from.toLowerCase() : 'on $from'}';
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────
  /// «خصم 20%» / «20% off» — النسبة معزولة LTR حتى لا تنقلب داخل النص العربي.
  String couponOff(int pct) => isAr ? 'خصم \u2066$pct%\u2069' : '$pct% off';
  /// «خصم 5,000 د.ع» / «5,000 IQD off».
  String couponOffIqd(String price) => isAr ? 'خصم $price' : '$price off';
  /// تحت القيمة الكبيرة في كعب التذكرة: «20%» ثم «خصم».
  String get couponOffCaption => isAr ? 'خصم' : 'OFF';
  /// «5K» ثم «د.ع خصم».
  String get couponIqdOffCaption => isAr ? 'د.ع خصم' : 'IQD OFF';
  String get couponFree => isAr ? 'مجاني' : 'Free';
  String get couponDelivery => isAr ? 'التوصيل' : 'Delivery';
  String get couponFreeDelivery => isAr ? 'توصيل مجاني لطلبكِ' : 'Free delivery on your order';
  String couponFirstOrder(int pct) => isAr ? 'خصم \u2066$pct%\u2069 لأول طلب' : '$pct% off your first order';
  /// شرط الحد الأدنى: «فوق 25,000 د.ع».
  String couponMinOrder(String price) => isAr ? 'فوق $price' : 'Over $price';
  String get couponEndsWithinHour => isAr ? 'ينتهي خلال ساعة' : 'Ends within an hour';
  String couponEndsInHours(int n) =>
      n <= 1 ? couponEndsWithinHour : (isAr ? 'ينتهي بعد ${arHours(n)}' : 'Ends in $n hours');
  String get couponEndsTomorrow => isAr ? 'ينتهي غداً' : 'Ends tomorrow';
  String couponEndsInDays(int n) =>
      n <= 1 ? couponEndsTomorrow : (isAr ? 'ينتهي بعد ${arDays(n)}' : 'Ends in $n days');
  String couponUntil(String date) => isAr ? 'حتى $date' : 'Until $date';
  String couponRemaining(int n) => isAr ? 'باقي $n فقط' : 'Only $n left';
  /// سقف خصم النسبة: «خصم حتى 10,000 د.ع».
  String couponUpTo(String price) => isAr ? 'خصم حتى $price' : 'Up to $price off';
  String get couponUse => isAr ? 'استخدمي الكود' : 'Use code';
  String get couponUseShort => isAr ? 'استخدمي' : 'Use';
  /// شارة الكوبون المفعّل على التذكرة (`couponApplied(code)` لرسالة التطبيق).
  String get couponActive => isAr ? 'مُفعّل' : 'Applied';
  String couponCopied(String code) => isAr ? 'نُسخ الكود $code' : 'Code $code copied';
  /// أُزيل الكوبون تلقائياً — مع السبب من السيرفر.
  String couponRemoved(String reason) => isAr ? 'أزلنا الكوبون — $reason' : 'Coupon removed — $reason';

  // ─── Session & connectivity ───────────────────────────────────────────────
  String get sessionExpired => isAr ? 'انتهت الجلسة — سجّلي الدخول مجدداً' : 'Session expired — please sign in';
  String get signInAgain => isAr ? 'سجّلي الدخول مجدداً' : 'Sign in again';
  String get loggedOut => isAr ? 'تم تسجيل الخروج' : "You've been signed out";
  String get noConnection => isAr ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection';
  String get offlineShowingSaved => isAr
      ? 'أنتِ غير متصلة — نعرض آخر ما حُفظ على جهازكِ'
      : "You're offline — showing what's saved on your device";
  String get loadMoreFailed => isAr ? 'تعذّر تحميل المزيد' : "Couldn't load more";
  String get checkingYourOrder => isAr ? 'نتحقق من طلبكِ…' : 'Checking your order…';

  // ─── Common actions ───────────────────────────────────────────────────────
  String get undo => isAr ? 'تراجع' : 'Undo';
  String get copied => isAr ? 'تم النسخ' : 'Copied';
  String get share => isAr ? 'مشاركة' : 'Share';
  String get openSettings => isAr ? 'فتح الإعدادات' : 'Open settings';
  String get pressBackAgainToExit => isAr ? 'اضغطي رجوع مرة أخرى للخروج' : 'Press back again to exit';
  String get forgotPassword => isAr ? 'نسيتِ كلمة المرور؟' : 'Forgot password?';
  /// رسالة واتساب جاهزة لاسترجاع الحساب.
  String forgotPasswordMessage(String phone) => isAr
      ? 'مرحباً، نسيت كلمة المرور لحسابي${phone.isEmpty ? '' : ' برقم $phone'}'
      : 'Hello, I forgot the password for my account${phone.isEmpty ? '' : ' ($phone)'}';
  String get contactSupportWhatsApp => isAr ? 'تواصلي مع الدعم عبر واتساب' : 'Contact support on WhatsApp';
  String get tryRemovingFilters => isAr ? 'جرّبي إزالة بعض الفلاتر' : 'Try removing some filters';
  String get browseCategories => isAr ? 'تصفّحي الأقسام' : 'Browse categories';
  /// وصف صورة المعرض لقارئ الشاشة: «الصورة 2 من 5».
  String imageOf(int i, int n) => isAr ? 'الصورة $i من $n' : 'Image $i of $n';

  // ─── Product & bag ────────────────────────────────────────────────────────
  String shadeSoldOut(String name) => isAr ? 'لون «$name» نفد حالياً' : 'The shade “$name” is sold out';
  String get soldOutShort => isAr ? 'نفد' : 'Sold out';
  /// أُضيف أقل من المطلوب لأن المخزون لا يكفي.
  String addedOnly(int n) => isAr ? 'أضفنا $n فقط — هذا المتوفر' : 'Added only $n — that’s all we have';
  String get fillTheGap => isAr ? 'أكملي الفرق' : 'Close the gap';
  String get freeShippingFillers =>
      isAr ? 'إضافات صغيرة توصلكِ للتوصيل المجاني' : 'Little extras to unlock free delivery';
  String get productNoLongerAvailable => isAr ? 'هذا المنتج لم يعد متوفراً' : 'This product is no longer available';
  String get savedToWishlist => isAr ? 'حُفظ في المفضلة' : 'Saved to wishlist';
  String get viewWishlist => isAr ? 'عرض المفضلة' : 'View wishlist';
  String get addToWishlist => isAr ? 'أضيفي للمفضلة' : 'Add to wishlist';
  String get removeFromWishlist => isAr ? 'إزالة من المفضلة' : 'Remove from wishlist';

  // ─── Barcode scanner ──────────────────────────────────────────────────────
  String get cameraPermissionDenied => isAr ? 'الكاميرا غير مسموحة' : 'Camera access is off';
  String get cameraPermissionBody => isAr
      ? 'اسمحي للتطبيق باستخدام الكاميرا من الإعدادات لمسح الباركود، أو اكتبي الرقم يدوياً.'
      : 'Allow camera access in Settings to scan barcodes, or type the number instead.';
  String get typeCodeManually => isAr ? 'إدخال الرقم يدوياً' : 'Type the code';
  String get enterBarcodeHint => isAr ? 'الأرقام المكتوبة تحت الباركود' : 'Digits printed under the barcode';
  String get lookingUpCode => isAr ? 'نبحث عن المنتج…' : 'Looking up the product…';
  String get codeNotFound => isAr ? 'لم نجد منتجاً بهذا الرقم' : 'No product matches this code';

  // ─── App update ───────────────────────────────────────────────────────────
  String get updateAvailableTitle => isAr ? 'تحديث جديد متاح ✨' : 'A new update is available ✨';
  String get updateAvailableBody =>
      isAr ? 'حدّثي التطبيق للحصول على أحدث المزايا' : 'Update the app to get the latest features';
  String get updateNow => isAr ? 'حدّثي' : 'Update';
  String get later => isAr ? 'لاحقاً' : 'Later';
  String get updateRequiredTitle => isAr ? 'التحديث مطلوب' : 'Update required';
  String get updateRequiredBody => isAr
      ? 'أصدرنا نسخة جديدة من التطبيق — حدّثيها لتكملي التسوق.'
      : 'We released a new version of the app — update it to keep shopping.';
  String updateFromStore(bool isIos) => isAr
      ? (isIos ? 'التحديث من App Store' : 'التحديث من Google Play')
      : (isIos ? 'Update from the App Store' : 'Update from Google Play');
  String versionLabel(String v) => isAr ? 'الإصدار $v' : 'Version $v';
  String get updateReassure => isAr
      ? 'يستغرق دقيقة واحدة — سلتكِ ومفضلتكِ محفوظة 💜'
      : 'It takes a minute — your bag and wishlist stay saved 💜';

  // ─── Ask Deema (product page) ─────────────────────────────────────────────
  String get askDeemaAbout => isAr ? 'اسألي ديما عن هذا المنتج' : 'Ask Deema about this product';
  String get askDeemaFit => isAr ? 'هل يناسبني؟' : 'Does it suit me?';
  String get askDeemaDupe => isAr ? 'بديل أرخص' : 'Cheaper dupe';
  String get askDeemaComplement => isAr ? 'شنو يكمّله؟' : 'What pairs with it?';
  String get askDeemaHowTo => isAr ? 'شلون أستخدمه؟' : 'How do I use it?';

  // ─── Catalog & brands search ──────────────────────────────────────────────
  /// «5 أقسام رئيسية • 48 قسماً فرعياً» / «5 categories • 48 subcategories».
  String catCatalogStats(int roots, int subs) {
    if (!isAr) return '${enCount(roots, 'category', 'categories')} • ${enCount(subs, 'subcategory', 'subcategories')}';
    final main = arCount(roots, one: 'قسم رئيسي واحد', two: 'قسمان رئيسيان', few: 'أقسام رئيسية', many: 'قسماً رئيسياً');
    return '$main • ${_arSubSections(subs)}';
  }
  /// حرف واحد لا يكفي للبحث — تلميح بدل «لا نتائج».
  String get catTypeMore => isAr ? 'اكتبي حرفاً آخر…' : 'Keep typing…';
  String get brandNoMatch => isAr ? 'لا يوجد براند بهذا الاسم' : 'No brand matches this name';
  String get brandTryLatin =>
      isAr ? 'جربي كتابته بالإنجليزي أو بجزء من الاسم' : 'Try the English spelling or part of the name';
  String searchProductsFor(String q) => isAr ? 'ابحثي عن «$q» في المنتجات' : 'Search products for “$q”';
  String get didYouMean => isAr ? 'هل تقصدين؟' : 'Did you mean?';
  String get featuredBrands => isAr ? 'براندات مميزة' : 'Featured brands';
  /// تلميح حقل البحث: «ابحثي بين 120 براند…».
  String searchAmongBrands(int n) => isAr
      ? 'ابحثي بين ${arCount(n, one: 'براند واحد', two: 'براندين', few: 'براندات', many: 'برانداً')}…'
      : 'Search ${enCount(n, 'brand', 'brands')}…';
  String get recentlyVisited => isAr ? 'زرتِها مؤخراً' : 'Recently visited';
  String get clearAction => isAr ? 'مسح' : 'Clear';

  // ─── Restock alerts ───────────────────────────────────────────────────────
  String get restockAlerts => isAr ? 'تنبيهات التوفر' : 'Restock alerts';
  String get waitingRestock => isAr ? 'بانتظار التوفر' : 'Waiting for restock';
  String get backInStock => isAr ? 'عاد متوفراً' : 'Back in stock';
  String get cancelAlert => isAr ? 'إلغاء التنبيه' : 'Cancel alert';
  String get notifyMeWhenAvailable => isAr ? 'نبّهيني عند التوفر' : 'Notify me when available';
  String get restockWillNotify => isAr ? 'سننبّهكِ فور توفره' : "We'll let you know as soon as it's back";
  /// «أضيفي المتوفر للسلة (3)».
  String addAvailableToBag(int n) => isAr ? 'أضيفي المتوفر للسلة ($n)' : 'Add available to bag ($n)';
  /// «أُضيف 3 منتجات إلى السلة».
  String addedToBagCount(int n) =>
      isAr ? 'أُضيف ${arProducts(n)} إلى السلة' : 'Added ${enCount(n, 'item', 'items')} to your bag';

  /// شارة التقييم: اشترت المنتج فعلاً.
  String get verifiedBuyer => isAr ? 'مشترية موثّقة' : 'Verified buyer';

  // ─── Account extras ───────────────────────────────────────────────────────
  String get helpAndFaq => isAr ? 'المساعدة والأسئلة الشائعة' : 'Help & FAQ';
  String get yourBirthday => isAr ? 'عيد ميلادكِ' : 'Your birthday';
  String get branchPickup => isAr ? 'استلام من الفرع' : 'Branch pickup';
  String get branchPickupFree => isAr ? 'استلام من الفرع — مجاناً' : 'Pick up at the branch — free';
}
