import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'locale_provider.dart';

final stringsProvider = Provider<AppStrings>((ref) {
  final code = ref.watch(appLocaleProvider).languageCode;
  return AppStrings(code);
});

extension AppStringsX on WidgetRef {
  AppStrings get s => watch(stringsProvider);
}

/// نصوص واجهة التطبيق — عربي / إنجليزي.
class AppStrings {
  final String lang;
  const AppStrings(this.lang);

  bool get isAr => lang == 'ar';

  // ─── Navigation ───────────────────────────────────────────────────────────
  String get navHome => isAr ? 'الرئيسية' : 'Home';
  String get navCategories => isAr ? 'الفئات' : 'Categories';
  String get navOffers => isAr ? 'عروضنا' : 'Offers';
  String get navCart => isAr ? 'السلة' : 'Cart';
  String get navAccount => isAr ? 'حسابي' : 'Account';

  // ─── Language ─────────────────────────────────────────────────────────────
  String get chooseLanguage => isAr ? 'اختر اللغة' : 'Choose Language';
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
      isAr ? 'ابحث عن منتج، علامة، تصنيف...' : 'Search products, brands, categories...';
  String get scan => isAr ? 'مسح' : 'Scan';
  String get scanBarcode => isAr ? 'مسح الباركود' : 'Scan Barcode';
  String get authentic => isAr ? 'أصلية' : 'Authentic';
  String get fastDelivery => isAr ? 'توصيل سريع' : 'Fast delivery';
  String get supportShort => isAr ? 'دعم' : 'Support';
  String freeShippingPlus(String amount) =>
      isAr ? 'شحن مجاني +$amount' : 'Free shipping +$amount';
  String get shopByCategory => isAr ? 'تسوقي حسب القسم' : 'Shop by Category';
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
  String get whatsappSupport => isAr ? 'تواصل عبر واتساب' : 'Contact via WhatsApp';
  String get callUs => isAr ? 'اتصل بنا' : 'Call Us';
  String get settings => isAr ? 'الإعدادات' : 'Settings';
  String get editProfile => isAr ? 'تعديل البيانات' : 'Edit Profile';
  String get changePassword => isAr ? 'تغيير كلمة المرور' : 'Change Password';
  String get aboutApp => isAr ? 'عن التطبيق' : 'About';
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
  String get guestWelcome => isAr ? 'مرحباً بك في ديما الحياة' : 'Welcome to deema alhayat';
  String get guestSubtitle => isAr
      ? 'سجّلي الدخول لحفظ مفضلاتك ومتابعة طلباتك ونقاط الولاء.'
      : 'Sign in to save favorites, track orders, and earn loyalty points.';
  String get loyaltyPointsCount => isAr ? 'نقطة ولاء' : 'loyalty points';
  String get version => isAr ? 'الإصدار' : 'Version';
  String get aboutDescription => isAr
      ? 'متجر ديما الحياة لمستحضرات التجميل والعناية. الدفع عند الاستلام.'
      : 'deema alhayat beauty and care store. Cash on delivery.';

  // ─── Categories ───────────────────────────────────────────────────────────
  String get noCategories => isAr ? 'لا توجد أقسام' : 'No categories';
  String get categoriesHeader => isAr ? 'الأقسام' : 'Categories';
  String get categoriesBrowseHint =>
      isAr ? 'اختاري من الشريط · تصفّحي البراندات' : 'Pick from the rail · browse brands';
  String get searchShort => isAr ? 'بحث' : 'Search';
  String get browseInDetail => isAr ? 'تصفّح بالتفصيل' : 'Browse in detail';
  String groupCount(int n) => isAr ? '$n مجموعة' : '$n groups';
  String get sectionBrands => isAr ? 'براندات القسم' : 'Category Brands';
  String brandCountLabel(int n) => isAr ? '$n براند' : '$n brands';
  String get swipeForMore => isAr ? 'مرّري للمزيد' : 'Swipe for more';
  String subcategoryCount(int n) => isAr ? '$n قسم فرعي' : '$n subcategories';
  String get allSectionProducts => isAr ? 'كل منتجات القسم' : 'All category products';
  String get subcategories => isAr ? 'الأقسام الفرعية' : 'Subcategories';
  String get tapNameToOpenProducts =>
      isAr ? 'اضغطي على الدائرة لفتح القسم' : 'Tap a circle to open the category';
  String childGroupCount(int n) => isAr ? '$n قسم فرعي' : '$n sub-items';
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
  String get browseProducts => isAr ? 'تصفّحي واختاري الأنسب' : 'Browse and find your match';
  String get availableProducts => isAr ? 'منتج متاح' : 'products available';
  String get subcategory => isAr ? 'القسم الفرعي' : 'Subcategory';
  String get tertiaryCategory => isAr ? 'القسم الثانوي' : 'Secondary';
  String get selectToFilter => isAr ? 'اخترِ للتصفية' : 'Tap to filter';
  String get brandCount => isAr ? 'براند' : 'brands';

  // Sort labels
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
  String get addToCart => isAr ? 'أضف للسلة' : 'Add to Cart';
  String get outOfStock => isAr ? 'غير متوفر' : 'Out of Stock';
  String get newBadge => isAr ? 'جديد' : 'New';
  String get offerBadge => isAr ? 'عرض' : 'Sale';
  String get selectShadeFirst => isAr ? 'يرجى اختيار الدرجة أولاً' : 'Please select a shade first';
  String get addedToCart => isAr ? 'أُضيف إلى السلة' : 'Added to cart';
  String get viewCart => isAr ? 'عرض السلة' : 'View Cart';
  String get quantity => isAr ? 'الكمية' : 'Quantity';
  String earnPoints(int points) =>
      isAr ? 'اكسبي $points نقطة عند شراء هذا المنتج' : 'Earn $points points when you buy this';
  String get bestSeller => isAr ? 'الأكثر مبيعاً' : 'Best Seller';
  String reviewCount(int n) => isAr ? '($n تقييم)' : '($n reviews)';
  String savePercent(int p) => isAr ? 'وفّري $p%' : 'Save $p%';
  String get outOfStockNow => isAr ? 'غير متوفر حالياً' : 'Currently out of stock';
  String lowStock(int stock) =>
      isAr ? 'متبقٍ $stock قطع فقط — اطلبي الآن' : 'Only $stock left — order now';
  String get inStock => isAr ? 'متوفر في المخزون' : 'In stock';
  String get selectShade => isAr ? 'اختاري الدرجة' : 'Select shade';
  String get authentic100 => isAr ? 'منتجات\nأصلية 100%' : '100%\nAuthentic';
  String get securePayment => isAr ? 'دفع\nآمن' : 'Secure\nPayment';
  String get thanksForReview => isAr ? 'شكراً على تقييمك!' : 'Thanks for your review!';
  String get ratingsTitle => isAr ? 'التقييمات' : 'Ratings';
  String get addReview => isAr ? 'أضيفي تقييماً' : 'Add a review';
  String fromReviews(int n) => isAr ? 'من $n تقييم' : 'from $n reviews';
  String get reviewHint => isAr ? 'اكتبي تجربتك مع المنتج...' : 'Share your experience...';
  String get submitReview => isAr ? 'إرسال التقييم' : 'Submit review';
  String get beFirstToReview => isAr ? 'كوني أول من يقيّم هذا المنتج' : 'Be the first to review';
  String get loginToReview => isAr ? 'سجّلي الدخول لإضافة تقييم' : 'Sign in to add a review';
  String get youMayAlsoLike => isAr ? 'قد يعجبكِ أيضاً' : 'You may also like';
  String get total => isAr ? 'الإجمالي' : 'Total';
  String totalWithQty(int qty) => isAr ? 'الإجمالي ($qty قطع)' : 'Total ($qty items)';
  String get addToCartBtn => isAr ? 'إضافة إلى السلة' : 'Add to Cart';
  String get soldOut => isAr ? 'نفد' : 'Sold out';

  // ─── Cart ─────────────────────────────────────────────────────────────────
  String get cartTitle => isAr ? 'سلة التسوّق' : 'Shopping Cart';
  String get clearCartTitle => isAr ? 'تفريغ السلة؟' : 'Clear cart?';
  String get clearCartBody =>
      isAr ? 'سيتم حذف جميع المنتجات من سلتك.' : 'All items will be removed from your cart.';
  String get clearCart => isAr ? 'تفريغ' : 'Clear';
  String get clearCartTooltip => isAr ? 'تفريغ السلة' : 'Clear cart';
  String get enterCouponCode => isAr ? 'أدخل كود الخصم' : 'Enter discount code';
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
  String get noSearchResults => isAr ? 'لا توجد نتائج' : 'No results found';
  String get searchInStore => isAr ? 'ابحث في ديما الحياة' : 'Search deema alhayat';
  String get searchInStoreHint =>
      isAr ? 'اكتب اسم المنتج أو العلامة التجارية' : 'Type a product or brand name';
  String get clear => isAr ? 'مسح' : 'Clear';
  String get scanResults => isAr ? 'نتائج المسح' : 'Scan Results';
  String get scanHint => isAr ? 'وجّه الكاميرا نحو باركود المنتج' : 'Point the camera at the product barcode';
  String get switchCamera => isAr ? 'تبديل الكاميرا' : 'Switch camera';
  String get flash => isAr ? 'الفلاش' : 'Flash';

  // ─── Wishlist ─────────────────────────────────────────────────────────────
  String get wishlistIsEmpty => isAr ? 'قائمة المفضلة فارغة' : 'Your wishlist is empty';
  String get wishlistAddHint =>
      isAr ? 'أضف منتجات لتجدها هنا' : 'Add products to find them here';

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
  String get enterDiscountHint => isAr ? 'أدخل كود الخصم' : 'Enter discount code';
  String get applyCode => isAr ? 'تطبيق الكود' : 'Apply code';
  String get orderSummary => isAr ? 'ملخص الطلب' : 'Order summary';
  String subtotalItems(int count) =>
      isAr ? 'المجموع ($count منتج)' : 'Subtotal ($count items)';
  String get couponDiscount => isAr ? 'خصم الكوبون' : 'Coupon discount';
  String get shippingAtCheckout => isAr ? 'يُحسب عند الدفع' : 'Calculated at checkout';
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
      isAr ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?';
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
      isAr ? 'استخدم $points نقطة' : 'Use $points points';

  // ─── Package ──────────────────────────────────────────────────────────────
  String get packageTitle => isAr ? 'الباقة' : 'Package';

  // ─── Addresses ────────────────────────────────────────────────────────────
  String get deleteAddress => isAr ? 'حذف العنوان' : 'Delete Address';
  String get setDefaultAddress => isAr ? 'تعيين كعنوان افتراضي' : 'Set as default address';

  // ─── Loyalty ──────────────────────────────────────────────────────────────
  String get loginToSeePoints => isAr ? 'سجّل الدخول لعرض نقاطك' : 'Sign in to view your points';
  String get pointsHistory => isAr ? 'سجل النقاط' : 'Points History';
  String get noHistoryYet => isAr ? 'لا يوجد سجل بعد' : 'No history yet';
  String get pointsWillAppearHere =>
      isAr ? 'ستظهر معاملات النقاط هنا' : 'Point transactions will appear here';
  String get pointsAvailable => isAr ? 'نقطة متاحة' : 'points available';
  String pointsToNextTier(int points, String tier) =>
      isAr ? '$points نقطة للوصول لمستوى $tier' : '$points points to reach $tier';
  String get pointsRedeemHint =>
      isAr ? 'كل 100 نقطة = خصم عند الدفع' : 'Every 100 points = discount at checkout';

  String get loginToViewOrders =>
      isAr ? 'سجّل الدخول لعرض طلباتك' : 'Sign in to view your orders';
  String get loginToViewWishlist =>
      isAr ? 'سجّل الدخول لعرض المفضلة' : 'Sign in to view your wishlist';
  String get wishlistEmptySubtitle => isAr
      ? 'احفظ منتجاتك المفضلة وتابعها بسهولة'
      : 'Save your favorite products and track them easily';
  String get deliveryAddress => isAr ? 'عنوان التوصيل' : 'Delivery Address';
  String get paymentSummary => isAr ? 'ملخّص الدفع' : 'Payment Summary';
  String get save => isAr ? 'حفظ' : 'Save';
  String get searchBrandsHint => isAr ? 'ابحث عن علامة...' : 'Search brands...';
  String get loginToEditProfile =>
      isAr ? 'سجّل الدخول لتعديل بياناتك' : 'Sign in to edit your profile';
  String get loginToManageAddresses =>
      isAr ? 'سجّل الدخول لإدارة عناوينك' : 'Sign in to manage your addresses';
  String get loginToCheckout =>
      isAr ? 'سجّل الدخول لإتمام الطلب' : 'Sign in to complete checkout';
  String get loginToViewNotifications =>
      isAr ? 'سجّل الدخول لعرض الإشعارات' : 'Sign in to view notifications';
  String get emptyCartTitle => isAr ? 'السلة فارغة' : 'Your cart is empty';
  String get emptyCartSubtitle =>
      isAr ? 'أضيفي منتجات قبل إتمام الطلب' : 'Add products before checkout';
  String get goToCart => isAr ? 'الذهاب للسلة' : 'Go to Cart';
  String itemCountLabel(int count) =>
      isAr ? (count == 1 ? '$count منتج' : '$count منتجات') : (count == 1 ? '$count item' : '$count items');
  String get confirmOrder => isAr ? 'تأكيد الطلب' : 'Place Order';
  String get delete => isAr ? 'حذف' : 'Delete';
  String get deleteAddressConfirm =>
      isAr ? 'هل تريد حذف هذا العنوان؟' : 'Delete this address?';
  String get newAddress => isAr ? 'عنوان جديد' : 'New Address';
  String get addAddress => isAr ? 'إضافة عنوان' : 'Add Address';
  String get loginToChangePassword =>
      isAr ? 'سجّل الدخول لتغيير كلمة المرور' : 'Sign in to change your password';
  String get defaultLabel => isAr ? 'افتراضي' : 'Default';

  String sortLabelFor(String key) => switch (key) {
        'default' => sortLatest,
        'price_asc' => sortPriceAsc,
        'price_desc' => sortPriceDesc,
        'rating' => sortRating,
        'popular' => sortPopular,
        _ => sort,
      };

  String sortShortFor(String key) => switch (key) {
        'default' => sortLatest,
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
      isAr ? 'سجّل دخولك برقم هاتفك لمتابعة التسوّق' : 'Sign in with your phone to continue shopping';
  String get registerJoinTitle => isAr ? 'انضم إلى الحياة' : 'Join deema alhayat';
  String get registerPhoneSubtitle => isAr
      ? 'أنشئ حسابك برقم هاتفك وابدأ التسوّق واكسب نقاط الولاء'
      : 'Create your account with your phone and start earning loyalty points';
  String get fullName => isAr ? 'الاسم الكامل' : 'Full name';
  String get phoneNumber => isAr ? 'رقم الهاتف' : 'Phone number';
  String get password => isAr ? 'كلمة المرور' : 'Password';
  String get passwordMin6 =>
      isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters';
  String get enterYourName => isAr ? 'أدخل اسمك' : 'Enter your name';
  String get enterYourNameShort => isAr ? 'أدخل الاسم' : 'Enter your name';
  String get noAccountYet => isAr ? 'ليس لديك حساب؟' : "Don't have an account?";
  String get haveAccountAlready => isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?';
  String get signUp => isAr ? 'أنشئ حساباً' : 'Sign up';
  String get signIn => isAr ? 'سجّل الدخول' : 'Sign in';
  String get totalLabel => isAr ? 'الإجمالي' : 'Total';
  String get yourProducts => isAr ? 'منتجاتك' : 'Your items';
  String get haveCouponCode => isAr ? 'لديك كود خصم؟' : 'Have a discount code?';
  String get enterCode => isAr ? 'أدخل الكود' : 'Enter code';
  String get applyBtn => isAr ? 'تطبيق' : 'Apply';
  String itemRemoved(String name) => isAr ? 'حُذف «$name»' : 'Removed "$name"';
  String get maxQtyReached =>
      isAr ? 'وصلتِ للحد الأقصى المتاح' : 'Maximum available quantity reached';
  String get enterCouponPrompt => isAr ? 'أدخل كود الخصم' : 'Enter a discount code';
  String get invalidCouponShort => isAr ? 'الكوبون غير صالح' : 'Invalid coupon';
  String get cardPaymentDisabled => isAr
      ? 'الدفع بالبطاقة قيد التفعيل — اختر الدفع عند الاستلام حالياً'
      : 'Card payment is not available yet — please use cash on delivery';

  // ─── Checkout (extended) ──────────────────────────────────────────────────
  String get recipientInfo => isAr ? 'بيانات المستلم' : 'Recipient details';
  String get recipientAutoFill =>
      isAr ? 'تُملأ تلقائياً من حسابك — يمكنك تعديلها' : 'Auto-filled from your account — you can edit';
  String get deliveryLocation => isAr ? 'عنوان التوصيل' : 'Delivery address';
  String get deliveryLocationHint => isAr
      ? 'اختر محافظتك واكتب العنوان بالتفصيل'
      : 'Select your governorate and enter your address';
  String get streetLabel => isAr ? 'الشارع / أقرب نقطة دالة' : 'Street / landmark';
  String get enterStreet => isAr ? 'أدخل الشارع أو نقطة دالة' : 'Enter street or landmark';
  String get houseOptional => isAr ? 'رقم المنزل / الشقة (اختياري)' : 'House / apt (optional)';
  String get governorate => isAr ? 'المحافظة' : 'Governorate';
  String get selectGovernorate => isAr ? 'اختر المحافظة' : 'Select governorate';
  String get areaLabel => isAr ? 'المنطقة' : 'Area';
  String get selectArea => isAr ? 'اختر المنطقة' : 'Select area';
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
      isAr ? 'استخدم $points نقطة ولاء' : 'Use $points loyalty points';
  String loyaltyDiscountHint(String discount, String per100) => isAr
      ? 'خصم $discount (100 نقطة = $per100)'
      : '$discount off (100 pts = $per100)';
  String get loyaltyPointsRule => isAr
      ? '100 نقطة = خصم عند الدفع'
      : '100 points = discount at checkout';
  String get orderPlacedSuccess => isAr ? 'تم استلام طلبك بنجاح!' : 'Your order was placed successfully!';
  String orderNumberLabel(String num) => isAr ? 'رقم الطلب: $num' : 'Order #$num';
  String get orderPlacedCodNote => isAr
      ? 'سيتواصل معك فريقنا لتأكيد الطلب.\nالدفع عند الاستلام نقداً.'
      : 'Our team will contact you to confirm.\nCash on delivery.';
  String get trackOrder => isAr ? 'تتبّع الطلب' : 'Track order';

  String tierLabel(String tier) => switch (tier) {
        'platinum' => isAr ? 'بلاتيني' : 'Platinum',
        'gold' => isAr ? 'ذهبي' : 'Gold',
        'silver' => isAr ? 'فضي' : 'Silver',
        _ => isAr ? 'عضو' : 'Member',
      };
}
