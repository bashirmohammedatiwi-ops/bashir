import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/brand/brand_logo.dart';
import '../../core/connectivity/connectivity_provider.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/push/push_service.dart';
import '../../core/utils/form_scroll.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/phone_util.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/keyboard_dismiss.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/address.dart';
import '../../data/models/order.dart';
import '../../data/models/payment.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_packages_provider.dart';
import '../cart/cart_strings.dart';
import '../cart/coupon_provider.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../catalog/catalog_providers.dart';
import '../profile/widgets/address_form.dart';
import '../profile/profile_providers.dart';
import '../payments/card_payment_flow.dart';
import '../payments/payment_strings.dart';
import '../worlds/worlds_provider.dart';
import 'checkout_strings.dart';
import 'widgets/checkout_delivery_card.dart';
import 'widgets/checkout_header.dart';
import 'widgets/checkout_sections.dart';
import '../cart/widgets/pill_buttons.dart';
import '../worlds/world_theme.dart';

/// مفتاح محاولة الإتمام الأخيرة مع توقيع ما أُرسل بها — خارج الشاشة، فإعادة فتح الدفع بالطلب
/// نفسه (بعد خروج أو إغلاق أثناء الإرسال) ترسل المفتاح نفسه فيعيد السيرفر الطلب الأول لا طلباً ثانياً.
final _checkoutAttemptProvider = StateProvider<({String signature, String ref})?>((ref) => null);

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

/// مبالغ الصفحة من مكان واحد — العرض والإرسال بقواعد السيرفر نفسها:
/// الكوبون على (المجموع − توفير الباقات)، النقاط بعد التوصيل وبمضاعفات الخطوة.
class _Amounts {
  final int subtotal;
  final int packageSaving;
  final int couponBase;
  final int discount;

  /// null حتى تُعرف رسوم التوصيل.
  final int? shipping;

  /// كود يلغي التوصيل وقد بلغت السلة حدّه الأدنى.
  final bool couponFreeShipping;

  /// أقصى نقاط يمكن استخدامها لهذا الطلب الآن.
  final int maxPoints;
  final int loyaltyPoints;
  final int loyaltyDiscount;

  /// null حتى تُعرف رسوم التوصيل.
  final int? total;

  const _Amounts({
    required this.subtotal,
    required this.packageSaving,
    required this.couponBase,
    required this.discount,
    required this.shipping,
    required this.couponFreeShipping,
    required this.maxPoints,
    required this.loyaltyPoints,
    required this.loyaltyDiscount,
    required this.total,
  });
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _scrollCtrl = ScrollController();
  final _nameFieldKey = GlobalKey();
  final _phoneFieldKey = GlobalKey();
  final _locationFieldKey = GlobalKey();
  final _streetFieldKey = GlobalKey();
  final _deliverySectionKey = GlobalKey();
  final _shippingBannerKey = GlobalKey();
  final _paymentSectionKey = GlobalKey();
  final _summarySectionKey = GlobalKey();
  final _activeStep = ValueNotifier<int>(0);
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _houseCtrl = TextEditingController();
  final _couponCtrl = TextEditingController();
  final _couponFocus = FocusNode();
  final _notesCtrl = TextEditingController();
  // طلب هدية.
  final _giftMsgCtrl = TextEditingController();
  bool _isGift = false;
  bool _giftHidePrices = true;

  String? _couponError;
  bool _couponLoading = false;

  /// رسوم التوصيل من عرض السعر — null حتى يصل (لا «مجاني» قبل أن يقولها السيرفر).
  int? _shippingFee;
  bool _shippingLoading = false;
  String? _shippingError;

  /// رقم آخر طلب عرض سعر: الردود المتأخرة لطلب أقدم تُهمل.
  int _quoteSeq = 0;
  Future<void>? _quoteFuture;

  bool _placing = false;

  /// أُنشئ الطلب (والسلة أُفرغت): الشاشة تعرض «تم إنشاء طلبكِ» حتى ننتقل.
  String? _placedOrderId;
  bool _placedByCard = false;

  bool _useLoyalty = false;
  String _paymentMethod = 'COD';
  bool _pickup = false;
  String? _governorate;
  String? _area;

  /// العنوان المحفوظ المختار — يُستخدم كما هو فقط إن لم تُعدَّل حقوله.
  Address? _pickedAddress;
  String? _addressId;

  /// عنوان جديد يُنشأ عند التأكيد: اجعليه الافتراضي؟
  bool _makeDefault = false;

  bool _identityFilled = false;
  bool _addressApplied = false;

  static final _random = math.Random();

  static String _newCheckoutRef() =>
      'app-${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}-${_random.nextInt(1 << 32).toRadixString(36)}';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final c = ref.read(appliedCouponProvider);
      if (c != null) _couponCtrl.text = c.code;
      // قبل الدفع: الكود ما زال صالحاً؟ والأسعار والمخزون كما في السلة؟
      unawaited(ref.read(appliedCouponProvider.notifier).revalidate(force: true));
      unawaited(_revalidateCart());
      // فشلٌ سابق في تحميل المحافظات محفوظ في المزوّد: نعيد المحاولة الآن.
      if (ref.read(shippingZonesProvider).hasError) retryShippingZones(ref);
      _maybeBootstrap();
    });
    _scrollCtrl.addListener(_syncActiveStep);
  }

  Future<void> _revalidateCart({bool announce = true}) async {
    final report = await ref.read(cartProvider.notifier).revalidate(force: true);
    if (!mounted || !report.hasChanges || !announce) return;
    final s = ref.s;
    final parts = <String>[
      if (report.unavailableKeys.isNotEmpty) s.cartUnavailableCount(report.unavailableKeys.length),
      if (report.needsShadeKeys.isNotEmpty) s.cartNeedsShadeCount(report.needsShadeKeys.length),
      if (report.changedPriceKeys.isNotEmpty) s.cartPricesUpdated(report.changedPriceKeys.length),
      if (report.clampedKeys.isNotEmpty) s.cartQuantitiesClamped,
      if (report.droppedPackageNames.isNotEmpty) s.cartPackagesEnded(report.droppedPackageNames.join(s.isAr ? '، ' : ', ')),
      if (report.changedPackageNames.isNotEmpty) s.cartPackagesChanged(report.changedPackageNames.join(s.isAr ? '، ' : ', ')),
    ];
    if (parts.isNotEmpty) AppSnackbar.show(context, parts.join(' · '), duration: const Duration(seconds: 4));
  }

  /// يحدّث مؤشّر الخطوات حسب القسم الظاهر حالياً — واجهة فقط.
  void _syncActiveStep() {
    if (!_scrollCtrl.hasClients) return;
    final pos = _scrollCtrl.position;
    var step = 0;
    if (pos.pixels >= pos.maxScrollExtent - 24 && pos.maxScrollExtent > 0) {
      step = 2;
    } else {
      final viewport = context.findRenderObject() as RenderBox?;
      final threshold = (viewport?.size.height ?? 600) * 0.45;
      final keys = [_deliverySectionKey, _paymentSectionKey, _summarySectionKey];
      for (var i = 0; i < keys.length; i++) {
        final box = keys[i].currentContext?.findRenderObject() as RenderBox?;
        if (box == null || !box.attached) continue;
        if (box.localToGlobal(Offset.zero).dy <= threshold) step = i;
      }
    }
    if (_activeStep.value != step) _activeStep.value = step;
  }

  Future<void> _jumpToStep(int i) async {
    final key = [_deliverySectionKey, _paymentSectionKey, _summarySectionKey][i];
    await scrollToFormField(key, alignment: 0.02);
  }

  @override
  void dispose() {
    _scrollCtrl.removeListener(_syncActiveStep);
    _scrollCtrl.dispose();
    _activeStep.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _streetCtrl.dispose();
    _houseCtrl.dispose();
    _couponCtrl.dispose();
    _couponFocus.dispose();
    _notesCtrl.dispose();
    _giftMsgCtrl.dispose();
    super.dispose();
  }

  /// تعبئة الاسم والهاتف من الحساب، والعنوان الافتراضي أول مرة تصل العناوين —
  /// مستقلّين: فشل العناوين ثم نجاح «إعادة» يطبّق الافتراضي متأخراً.
  void _maybeBootstrap() {
    if (!mounted) return;
    final user = ref.read(authProvider).user;
    if (user == null) return;
    var changed = false;
    if (!_identityFilled) {
      _identityFilled = true;
      if (_nameCtrl.text.trim().isEmpty) _nameCtrl.text = user.name;
      if (_phoneCtrl.text.trim().isEmpty) _phoneCtrl.text = formatPhoneLocal(user.phone);
      changed = true;
    }
    final addresses = ref.read(addressesProvider);
    if (!_addressApplied && addresses.hasValue) {
      _addressApplied = true;
      final list = addresses.value!;
      // لا نكتب فوق عنوان بدأت كتابته بنفسها أثناء التحميل.
      final untouched = _governorate == null && _streetCtrl.text.trim().isEmpty && _pickedAddress == null;
      if (list.isNotEmpty && untouched) {
        final preferred = list.firstWhere((a) => a.isDefault, orElse: () => list.first);
        _applyAddress(preferred);
      }
      changed = true;
    }
    if (changed) setState(() {});
  }

  void _applyAddress(Address address, {bool refreshShipping = true}) {
    setState(() {
      _pickedAddress = address;
      _addressId = address.id;
      if (address.fullName.trim().isNotEmpty) _nameCtrl.text = address.fullName;
      if (address.phone.trim().isNotEmpty) _phoneCtrl.text = formatPhoneLocal(address.phone);
      _governorate = address.governorate ?? address.city;
      _area = address.area;
      _streetCtrl.text = address.street ?? '';
      _houseCtrl.text = address.house ?? '';
    });
    if (refreshShipping) unawaited(_refreshShipping());
  }

  /// عرض سعر التوصيل للمحافظة والمنطقة الحاليتين. كل طلب برقم؛ يُعتمد آخرها فقط.
  Future<void> _refreshShipping() {
    if (!mounted || _pickup) return Future.value();
    final seq = ++_quoteSeq;
    final governorate = _governorate?.trim() ?? '';
    if (governorate.isEmpty) {
      setState(() {
        _shippingFee = null;
        _shippingLoading = false;
        _shippingError = null;
      });
      _quoteFuture = null;
      return Future.value();
    }
    setState(() {
      _shippingFee = null;
      _shippingLoading = true;
      _shippingError = null;
    });
    final future = _fetchQuote(seq, governorate, _area, ref.read(cartProvider).subtotal);
    _quoteFuture = future;
    return future;
  }

  Future<void> _fetchQuote(int seq, String governorate, String? area, int subtotal) async {
    try {
      final fee = await ref
          .read(apiServiceProvider)
          .shippingQuote(governorate: governorate, area: area, subtotal: subtotal);
      if (!mounted || seq != _quoteSeq) return;
      setState(() {
        _shippingFee = fee;
        _shippingLoading = false;
      });
    } catch (e) {
      if (!mounted || seq != _quoteSeq) return;
      setState(() {
        _shippingError = ref.friendly(e);
        _shippingLoading = false;
      });
    } finally {
      if (seq == _quoteSeq) _quoteFuture = null;
    }
  }

  /// نفس منطق السلة: الكود السابق يبقى إن رُفض الجديد أو انقطعت الشبكة.
  Future<void> _applyCoupon() async {
    FocusScope.of(context).unfocus();
    final code = _couponCtrl.text.trim();
    setState(() {
      _couponLoading = code.isNotEmpty;
      _couponError = null;
    });
    final int packageSaving = ref.read(cartPackageSavingProvider);
    final base = ref.read(cartProvider).subtotal - packageSaving;
    final err = await applyCouponFromField(ref, code, subtotal: base);
    if (!mounted) return;
    setState(() {
      _couponLoading = false;
      _couponError = err;
    });
    final applied = ref.read(appliedCouponProvider);
    if (err == null && applied != null) AppSnackbar.success(context, ref.s.couponApplied(applied.code));
  }

  void _removeCoupon() {
    removeAppliedCoupon(ref);
    _couponCtrl.clear();
    setState(() => _couponError = null);
  }

  _Amounts _amounts() {
    final cart = ref.read(cartProvider);
    final coupon = ref.read(appliedCouponProvider);
    final rules = ref.read(loyaltyRulesProvider);
    final points = ref.read(authProvider).user?.points ?? 0;
    final int packageSaving = ref.read(cartPackageSavingProvider);
    final subtotal = cart.subtotal;
    final couponBase = subtotal - packageSaving;
    final discount = coupon?.discountFor(couponBase) ?? 0;
    final couponFreeShipping = (coupon?.freeShipping ?? false) && coupon!.eligibleFor(couponBase);
    final int? shipping = _isPickupNow || couponFreeShipping ? 0 : _shippingFee;
    final afterDiscount = math.max(0, couponBase - discount);
    final beforeLoyalty = shipping == null ? null : afterDiscount + shipping;
    // التوصيل لم يُعرف بعد: الحد الأدنى المضمون، ويُعاد الحساب فور وصوله.
    final maxPoints = rules.redeemable(points, beforeLoyalty ?? afterDiscount);
    final loyaltyPoints = _useLoyalty ? maxPoints : 0;
    final loyaltyDiscount = rules.valueOf(loyaltyPoints);
    return _Amounts(
      subtotal: subtotal,
      packageSaving: packageSaving,
      couponBase: couponBase,
      discount: discount,
      shipping: shipping,
      couponFreeShipping: couponFreeShipping,
      maxPoints: maxPoints,
      loyaltyPoints: loyaltyPoints,
      loyaltyDiscount: loyaltyDiscount,
      total: beforeLoyalty == null ? null : math.max(0, beforeLoyalty - loyaltyDiscount),
    );
  }

  /// الاستلام من الفرع مفعّل في المتجر وله عنوان.
  CheckoutPickupInfo? get _pickupInfo {
    final settings = ref.read(storeSettingsProvider);
    if (settings == null || !settings.pickupEnabled || settings.pickupAddress.trim().isEmpty) return null;
    return CheckoutPickupInfo(address: settings.pickupAddress.trim(), hours: settings.pickupHours);
  }

  bool get _isPickupNow => _pickup && _pickupInfo != null;

  void _setPickup(bool value) {
    setState(() => _pickup = value);
    // العودة للتوصيل: نحتاج سعره من جديد إن لم يكن معروفاً.
    if (!value && _shippingFee == null && !_shippingLoading) unawaited(_refreshShipping());
  }

  /// الطريقة التي ستُرسل فعلاً: طلب مغطّى بالكامل لا يُدفع بالبطاقة.
  String _effectiveMethod(int? total, PaymentMethodsConfig methods) {
    if (total == 0) return 'COD';
    return _paymentMethod == 'CARD' && methods.cardEnabled ? 'CARD' : 'COD';
  }

  /// الحقول تطابق العنوان المحفوظ تماماً (الاسم، الهاتف، المحافظة، المنطقة، الشارع، البيت).
  bool _formMatches(Address a) {
    String n(String? v) => (v ?? '').trim();
    return n(a.fullName) == _nameCtrl.text.trim() &&
        normalizePhone(a.phone) == normalizePhone(_phoneCtrl.text.trim()) &&
        n(a.governorate ?? a.city) == n(_governorate) &&
        n(a.area) == n(_area) &&
        n(a.street) == _streetCtrl.text.trim() &&
        n(a.house) == _houseCtrl.text.trim();
  }

  Address _buildAddressFromForm({required bool isDefault}) {
    final city = _area?.isNotEmpty == true ? _area! : (_governorate ?? '');
    return Address(
      id: '',
      fullName: _nameCtrl.text.trim(),
      phone: normalizePhone(_phoneCtrl.text.trim()),
      city: city,
      governorate: _governorate,
      area: _area,
      street: _streetCtrl.text.trim().isEmpty ? null : _streetCtrl.text.trim(),
      house: _houseCtrl.text.trim().isEmpty ? null : _houseCtrl.text.trim(),
      isDefault: isDefault,
    );
  }

  /// عنوان الطلب دون المساس بالعناوين المحفوظة: المختار كما هو إن لم يُعدَّل، وإلا
  /// عنوان جديد (لا نعدّل «البيت» بعنوان هدية لصديقتها). يُحفظ فوراً لتعيد المحاولات
  /// استخدامه بدل إنشاء نسخ مكررة.
  Future<String> _resolveAddressId(List<Address> saved) async {
    final picked = _pickedAddress;
    if (picked != null && picked.id.isNotEmpty && _formMatches(picked)) return picked.id;
    final isDefault = !_isGift && (saved.isEmpty || _makeDefault);
    final created = await ref.read(apiServiceProvider).createAddress(_buildAddressFromForm(isDefault: isDefault));
    _pickedAddress = created;
    _addressId = created.id;
    if (mounted) setState(() {});
    ref.invalidate(addressesProvider);
    return created.id;
  }

  /// ملاحظة لفريق الفرع (بالعربية دائماً — هم من يقرؤها): من ستستلم الطلب إن لم تكن صاحبة الحساب.
  String _orderNotes({required bool pickup}) {
    final notes = _notesCtrl.text.trim();
    if (!pickup) return notes;
    final user = ref.read(authProvider).user;
    final name = _nameCtrl.text.trim();
    final phone = normalizePhone(_phoneCtrl.text.trim());
    if (user != null && name == user.name.trim() && phone == normalizePhone(user.phone ?? '')) return notes;
    final who = 'تستلمه من الفرع: $name — ${formatPhoneLocal(phone)}';
    return notes.isEmpty ? who : '$who\n$notes';
  }

  Future<void> _scrollToFirstInvalid() async {
    HapticFeedback.lightImpact();
    await scrollToFirstInvalidFormSection([_nameFieldKey, _phoneFieldKey, _locationFieldKey, _streetFieldKey]);
  }

  Future<void> _addSavedAddress() async {
    final user = ref.read(authProvider).user;
    final hasSaved = (ref.read(addressesProvider).valueOrNull ?? const []).isNotEmpty;
    final initial = Address(
      id: '',
      fullName: _nameCtrl.text.trim().isNotEmpty ? _nameCtrl.text.trim() : (user?.name ?? ''),
      phone: _phoneCtrl.text.trim().isNotEmpty ? normalizePhone(_phoneCtrl.text.trim()) : (user?.phone ?? ''),
      city: '',
      governorate: _governorate,
      area: _area,
      street: _streetCtrl.text.trim().isEmpty ? null : _streetCtrl.text.trim(),
      house: _houseCtrl.text.trim().isEmpty ? null : _houseCtrl.text.trim(),
      isDefault: !hasSaved,
    );
    final draft = await showAddressForm(context, initial: initial);
    if (draft == null || !mounted) return;
    try {
      final created = await ref
          .read(apiServiceProvider)
          .createAddress(
            Address(
              id: '',
              fullName: draft.fullName,
              phone: draft.phone,
              city: draft.city,
              governorate: draft.governorate,
              area: draft.area,
              street: draft.street,
              house: draft.house,
              notes: draft.notes,
              isDefault: draft.isDefault,
            ),
          );
      ref.invalidate(addressesProvider);
      _applyAddress(created);
      if (mounted) AppSnackbar.success(context, ref.s.addressSaved);
    } catch (e) {
      if (mounted) AppSnackbar.error(context, ref.friendly(e));
    }
  }

  /// مفتاح محاولة الإتمام: ثابت ما دام الطلب المرسَل كما هو، فإعادة الإرسال بعد انقطاع (أو ضغطة
  /// ثانية بعد رد لم يصل) تُرجع الطلب نفسه من السيرفر بدل طلب مكرر. يتجدد إن تغيّر أي شيء
  /// يُرسل — السلة، التوصيل والعنوان، الدفع، الكوبون، النقاط، الهدية — فلا يعود طلب سابق بخيارات أخرى.
  String _refFor(Map<String, Object?> request) {
    final signature = jsonEncode(request);
    final notifier = ref.read(_checkoutAttemptProvider.notifier);
    final last = notifier.state;
    if (last != null && last.signature == signature) return last.ref;
    final next = _newCheckoutRef();
    notifier.state = (signature: signature, ref: next);
    return next;
  }

  /// إرسال الطلب، ومرة ثانية بنفس المفتاح إن انقطع الاتصال قبل وصول الرد —
  /// السيرفر يعيد الطلب نفسه إن كان قد أُنشئ.
  Future<AppOrder> _submitOrder(Future<AppOrder> Function() send) async {
    try {
      return await send();
    } on ApiException catch (e) {
      if (!e.isConnectionProblem || !mounted) rethrow;
      AppSnackbar.show(context, ref.s.checkingYourOrder);
      await Future<void>.delayed(const Duration(milliseconds: 800));
      return send();
    }
  }

  Future<void> _placeOrder() async {
    if (_placing) return;
    FocusScope.of(context).unfocus();
    final form = _formKey.currentState;
    if (form == null) {
      await scrollToFormField(_deliverySectionKey, alignment: 0.02);
      return;
    }
    if (!form.validate()) {
      await _scrollToFirstInvalid();
      return;
    }
    HapticFeedback.mediumImpact();
    setState(() => _placing = true);
    final pickup = _isPickupNow;

    // لا تأكيد بإجمالي غير معروف: ننتظر عرض السعر الجاري، وإن فشل نعرض سببه.
    if (!pickup && !_amounts().couponFreeShipping) {
      final pending = _quoteFuture;
      if (pending != null) await pending;
      if (!mounted) return;
      if (_shippingFee == null || _shippingError != null) {
        if (_shippingError == null && !_shippingLoading) unawaited(_refreshShipping());
        setState(() => _placing = false);
        await scrollToFormField(_shippingError != null ? _shippingBannerKey : _locationFieldKey, alignment: 0.1);
        return;
      }
    }

    try {
      final cart = ref.read(cartProvider);
      final amounts = _amounts();
      final shownTotal = amounts.total;
      final methods = ref.read(paymentMethodsProvider).valueOrNull ?? PaymentMethodsConfig.fallback;
      final method = _effectiveMethod(shownTotal, methods);
      final packs = [
        for (final st in ref.read(cartPackageStatusProvider))
          if (st.complete) {'packageId': st.pack.id, 'quantity': st.completeSets},
      ];
      final coupon = ref.read(appliedCouponProvider);
      final saved = ref.read(addressesProvider).valueOrNull ?? const <Address>[];
      final addressId = pickup ? null : await _resolveAddressId(saved);
      // أُغلقت الشاشة أثناء حفظ العنوان: لم يُرسل طلب بعد — لا شيء يُتابع.
      if (!mounted) return;
      final api = ref.read(apiServiceProvider);
      final items = cart.items.map((e) => e.toOrderItem()).toList();
      final notes = _orderNotes(pickup: pickup);
      final deliveryOption = pickup ? 'PICKUP' : 'STANDARD';
      // الكود يُرسل فقط إن بلغت السلة حدّه الأدنى (وإلا يرفض السيرفر الطلب).
      final couponCode = coupon != null && coupon.eligibleFor(amounts.couponBase) ? coupon.code : null;
      final giftMessage = _isGift ? _giftMsgCtrl.text.trim() : null;
      final giftHidePrices = _isGift && _giftHidePrices;
      final clientRef = _refFor({
        'items': items,
        'packages': packs,
        'addressId': addressId,
        'deliveryOption': deliveryOption,
        'couponCode': couponCode,
        'notes': notes,
        'isGift': _isGift,
        'giftMessage': giftMessage,
        'giftHidePrices': giftHidePrices,
        'loyaltySpent': amounts.loyaltyPoints,
        'paymentMethod': method,
      });
      // ما يلي الإنشاء يتم ولو أُغلقت الشاشة أثناء الإرسال (إشعار يفتح صفحة أخرى…):
      // الطلب أُنشئ على السيرفر، فالسلة والكوبون يُفرغان والقوائم تتجدد على أي حال.
      final cartNotifier = ref.read(cartProvider.notifier);
      final packagesNotifier = ref.read(cartPackagesProvider.notifier);
      final couponNotifier = ref.read(appliedCouponProvider.notifier);
      final attemptNotifier = ref.read(_checkoutAttemptProvider.notifier);
      final authNotifier = ref.read(authProvider.notifier);
      final container = ProviderScope.containerOf(context, listen: false);
      final order = await _submitOrder(
        () => api.createOrder(
          items: items,
          addressId: addressId,
          deliveryOption: deliveryOption,
          couponCode: couponCode,
          packages: packs,
          notes: notes,
          isGift: _isGift,
          giftMessage: giftMessage,
          giftHidePrices: giftHidePrices,
          loyaltySpent: amounts.loyaltyPoints,
          paymentMethod: method,
          clientRef: clientRef,
        ),
      );
      // السيرفر يحفظ الطلب المغطّى بالكامل (نقاط/كوبون) نقداً ومدفوعاً — بلا بطاقة.
      final needsCard = order.paymentMethod == 'CARD' && order.paymentStatus != 'PAID' && order.total > 0;
      // قبل إفراغ السلة: الشاشة تتحول لـ«تم إنشاء طلبكِ» بدل «سلتكِ فارغة».
      if (mounted) {
        setState(() {
          _placedOrderId = order.id;
          _placedByCard = needsCard;
        });
      }
      cartNotifier.clear();
      packagesNotifier.clear();
      couponNotifier.clear();
      attemptNotifier.state = null;
      container.invalidate(ordersProvider);
      container.invalidate(loyaltyProvider);
      unawaited(authNotifier.refreshUser());
      if (!mounted) return;
      // ما احتسبه السيرفر يختلف عما عرضناه (سعر تغيّر لحظة التأكيد…): لا يمر بصمت.
      final adjusted = shownTotal != null && order.total != shownTotal;
      if (needsCard) {
        if (adjusted && !await _confirmAdjustedTotal(order)) {
          if (mounted) context.pushReplacement('/orders/${order.id}');
        } else {
          await _payOrder(order.id, adjusted: adjusted);
        }
      } else if (mounted) {
        context.pushReplacement(_successPath(order.id, adjusted: adjusted));
      }
      unawaited(PushService.requestPermissionInContext());
    } catch (e) {
      if (mounted && _placedOrderId == null) _handleOrderError(e);
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  String _successPath(String orderId, {required bool adjusted}) =>
      '/order-success/$orderId${adjusted ? '?adjusted=1' : ''}';

  /// فشل إنشاء الطلب: رسالة بلغتها مع طريق الإصلاح المناسب.
  void _handleOrderError(Object e) {
    final s = ref.s;
    final err = orderErrorMessage(e, s);
    switch (err.kind) {
      case CheckoutErrorKind.cart:
        unawaited(_revalidateCart(announce: false));
        AppSnackbar.action(context, message: err.message, actionLabel: s.navCart, onAction: _goToCart);
      case CheckoutErrorKind.coupon:
        ref.read(appliedCouponProvider.notifier).clear();
        _couponCtrl.clear();
        setState(() => _couponError = null);
        AppSnackbar.error(context, err.message);
      case CheckoutErrorKind.address:
        setState(() {
          _pickedAddress = null;
          _addressId = null;
        });
        ref.invalidate(addressesProvider);
        AppSnackbar.error(context, err.message);
      case CheckoutErrorKind.loyalty:
        setState(() => _useLoyalty = false);
        unawaited(ref.read(authProvider.notifier).refreshUser());
        AppSnackbar.error(context, err.message);
      case CheckoutErrorKind.pickup:
        _setPickup(false);
        AppSnackbar.error(context, err.message);
      case CheckoutErrorKind.general:
        AppSnackbar.error(context, err.message);
    }
  }

  /// السلة: الصفحة التي فُتح منها الدفع، أو تبويب السلة إن فُتح من رابط.
  void _goToCart() {
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
      return;
    }
    ref.read(navIndexProvider.notifier).state = NavTabs.cart;
    context.go('/');
  }

  /// الإجمالي الذي احتسبه السيرفر غير المعروض: نعرضه قبل فتح الدفع بالبطاقة.
  Future<bool> _confirmAdjustedTotal(AppOrder order) async {
    final s = ref.s;
    final t = context.worldTheme;
    final total = formatPrice(order.total, lang: s.lang);
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        icon: Icon(Icons.info_outline_rounded, color: t.accentDark),
        title: Text(s.orderTotalUpdated(total), textAlign: TextAlign.center),
        content: Text(s.orderTotalUpdatedHint, textAlign: TextAlign.center),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text(s.payLater)),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: Text(s.payAmount(total))),
        ],
      ),
    );
    return ok == true;
  }

  /// الطلب أُنشئ (والسلة أُفرغت) — الآن الدفع بالبطاقة. إن لم يكتمل نذهب لصفحة
  /// الطلب حيث يمكن الدفع لاحقاً، ولا يضيع شيء.
  Future<void> _payOrder(String orderId, {bool adjusted = false}) async {
    while (true) {
      if (!mounted) return;
      final outcome = await CardPaymentFlow.run(context, ref, orderId);
      if (!mounted) return;
      if (outcome.isPaid) {
        context.pushReplacement(_successPath(orderId, adjusted: adjusted));
        return;
      }
      final retry = await showPaymentRetrySheet(context, ref.s, outcome);
      if (!retry) break;
    }
    if (mounted) context.pushReplacement('/orders/$orderId');
  }

  /// فُتحت من رابط بلا صفحة تحتها: للسلة بدل رجوع مستحيل. لا رجوع أثناء إرسال الطلب.
  void _back() {
    if (_placing) return;
    if (context.canPop()) {
      context.pop();
      return;
    }
    ref.read(navIndexProvider.notifier).state = NavTabs.cart;
    context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return PopScope(
      // أثناء إرسال الطلب أو الدفع بالبطاقة لطلب أُنشئ: الرجوع كان سيترك الطلب بلا متابعة
      // (السلة لا تُفرغ، أو صفحة دفع فارغة).
      canPop: !_placing,
      child: AuthGate(title: s.checkout, emptyTitle: s.loginToCheckout, child: _buildCheckout(s)),
    );
  }

  Widget _buildCheckout(AppStrings s) {
    final cart = ref.watch(cartProvider);
    final user = ref.watch(authProvider).user;
    final addressesAsync = ref.watch(addressesProvider);
    final payMethods = ref.watch(paymentMethodsProvider).valueOrNull ?? PaymentMethodsConfig.fallback;
    // المبالغ تُقرأ في [_amounts]؛ المراقبة هنا لإعادة البناء حين تتغير.
    ref.watch(appliedCouponProvider);
    ref.watch(cartPackageSavingProvider);
    final rules = ref.watch(loyaltyRulesProvider);
    ref.watch(storeSettingsProvider);

    ref.listen(addressesProvider, (_, __) => WidgetsBinding.instance.addPostFrameCallback((_) => _maybeBootstrap()));
    ref.listen(authProvider, (_, __) => WidgetsBinding.instance.addPostFrameCallback((_) => _maybeBootstrap()));
    // تغيّر المجموع (أسعار حُدّثت، كمية عُدّلت): التوصيل المجاني يُحسب عليه — سعر جديد.
    ref.listen(cartProvider.select((c) => c.subtotal), (prev, next) {
      if (prev == next || _placedOrderId != null) return;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _governorate != null) unawaited(_refreshShipping());
      });
    });

    if (_placedOrderId != null) return _OrderProcessingView(byCard: _placedByCard);

    if (cart.isEmpty) {
      return Scaffold(
        backgroundColor: context.worldTheme.canvas,
        body: Column(
          children: [
            CheckoutHeader(s: s, itemCount: 0, onBack: _back),
            Expanded(
              child: EmptyState(
                icon: Icons.shopping_bag_outlined,
                title: s.emptyCartTitle,
                subtitle: s.emptyCartSubtitle,
                action: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 260),
                  child: PrimaryPillButton(
                    label: s.goToCart,
                    icon: Icons.shopping_bag_outlined,
                    onTap: () {
                      ref.read(navIndexProvider.notifier).state = NavTabs.cart;
                      context.go('/');
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final coupon = ref.read(appliedCouponProvider);
    final points = user?.points ?? 0;
    final amounts = _amounts();
    final pickupInfo = _pickupInfo;
    final isPickup = _isPickupNow;
    final savedAddresses = addressesAsync.valueOrNull ?? const <Address>[];
    final addressesFailed = addressesAsync.hasError && !addressesAsync.hasValue;
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final offline = ref.watch(connectivityProvider).valueOrNull == false;
    final unavailable = cart.blocksCheckout;
    final blockedReason = offline
        ? s.checkoutOffline
        : cart.hasUnavailable
            ? s.checkoutUnavailableItems
            : cart.needsShadeKeys.isNotEmpty
                ? s.cartNeedsShadeCount(cart.needsShadeKeys.length)
                : null;
    final method = _effectiveMethod(amounts.total, payMethods);
    final covered = amounts.total == 0;

    final shippingStatus = isPickup
        ? CheckoutShippingStatus.pickup
        : amounts.couponFreeShipping
            ? CheckoutShippingStatus.ready
            : (_governorate?.trim() ?? '').isEmpty
                ? CheckoutShippingStatus.needsGovernorate
                : _shippingError != null
                    ? CheckoutShippingStatus.failed
                    : _shippingFee == null
                        ? CheckoutShippingStatus.loading
                        : CheckoutShippingStatus.ready;

    // من يحتاج خطاً أكبر يحصل عليه هنا (حتى 1.6×): نموذج وأرقام بلا بطاقات ثابتة الارتفاع.
    final mq = MediaQuery.of(context);
    final textScaler = MediaQueryData.fromView(View.of(context)).textScaler.clamp(
          minScaleFactor: 0.85,
          maxScaleFactor: 1.6,
        );

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: context.worldTheme.canvas,
      body: DismissKeyboard(
        child: Column(
          children: [
            ValueListenableBuilder<int>(
              valueListenable: _activeStep,
              builder: (_, step, __) => CheckoutHeader(
                s: s,
                itemCount: cart.count,
                onBack: _back,
                activeStep: step,
                onStepTap: _jumpToStep,
              ),
            ),
            Expanded(
              child: MediaQuery(
                data: mq.copyWith(textScaler: textScaler),
                // ليست قائمة كسولة: نموذج العنوان في الأعلى يجب أن يبقى حياً حتى
                // يُتحقق منه عند الضغط على "تأكيد الطلب" من أسفل الصفحة.
                child: SingleChildScrollView(
                  controller: _scrollCtrl,
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.only(top: 16, bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      CheckoutDeliveryCard(
                        key: _deliverySectionKey,
                        formKey: _formKey,
                        nameFieldKey: _nameFieldKey,
                        phoneFieldKey: _phoneFieldKey,
                        locationFieldKey: _locationFieldKey,
                        streetFieldKey: _streetFieldKey,
                        nameCtrl: _nameCtrl,
                        phoneCtrl: _phoneCtrl,
                        streetCtrl: _streetCtrl,
                        houseCtrl: _houseCtrl,
                        governorate: _governorate,
                        area: _area,
                        onGovernorateChanged: (v) => setState(() {
                          _governorate = v;
                          _area = null;
                        }),
                        onAreaChanged: (v) => setState(() => _area = v),
                        savedAddresses: savedAddresses,
                        selectedAddressId: _addressId,
                        onPickAddress: _applyAddress,
                        onAddAddress: _addSavedAddress,
                        onShippingChanged: () => unawaited(_refreshShipping()),
                        addressesLoading: addressesAsync.isLoading && !addressesAsync.hasValue,
                        onRetryAddresses: addressesFailed ? () => ref.invalidate(addressesProvider) : null,
                        pickup: pickupInfo,
                        isPickup: isPickup,
                        onPickupChanged: pickupInfo == null ? null : _setPickup,
                        addressFooter: savedAddresses.isEmpty || _isGift ? null : _makeDefaultToggle(s),
                      ),
                      const SizedBox(height: 14),
                      if (!isPickup)
                        CheckoutShippingBanner(
                          key: _shippingBannerKey,
                          s: s,
                          error: _shippingError,
                          onRetry: () => unawaited(_refreshShipping()),
                        ),
                      CheckoutCouponCard(
                        controller: _couponCtrl,
                        focusNode: _couponFocus,
                        error: _couponError,
                        loading: _couponLoading,
                        applied: coupon,
                        discount: amounts.discount,
                        couponBase: amounts.couponBase,
                        onApply: _applyCoupon,
                        onRemove: _removeCoupon,
                      ),
                      const SizedBox(height: 14),
                      CheckoutPaymentCard(
                        key: _paymentSectionKey,
                        s: s,
                        paymentMethod: method,
                        cardEnabled: payMethods.cardEnabled,
                        sandbox: payMethods.sandbox,
                        cardCoveredHint: covered ? s.cardCoveredHint : null,
                        onChanged: (v) {
                          HapticFeedback.selectionClick();
                          setState(() => _paymentMethod = v);
                        },
                      ),
                      const SizedBox(height: 14),
                      CheckoutGiftCard(
                        s: s,
                        isGift: _isGift,
                        onGiftChanged: (v) => setState(() => _isGift = v),
                        messageCtrl: _giftMsgCtrl,
                        hidePrices: _giftHidePrices,
                        onHidePricesChanged: (v) => setState(() => _giftHidePrices = v),
                      ),
                      const SizedBox(height: 14),
                      CheckoutNotesCard(s: s, controller: _notesCtrl),
                      if (points > 0) ...[
                        const SizedBox(height: 14),
                        CheckoutLoyaltyCard(
                          s: s,
                          points: _useLoyalty && amounts.maxPoints > 0 ? amounts.loyaltyPoints : points,
                          useLoyalty: _useLoyalty,
                          loyaltyDiscount: amounts.loyaltyDiscount,
                          enabled: amounts.maxPoints > 0,
                          disabledHint: points >= rules.redeemStep ? s.loyaltyOrderTooSmall : null,
                          onChanged: (v) => setState(() => _useLoyalty = v),
                          rules: rules,
                        ),
                      ],
                      const SizedBox(height: 14),
                      CheckoutSummaryCard(
                        key: _summarySectionKey,
                        s: s,
                        items: cart.items,
                        subtotal: amounts.subtotal,
                        discount: amounts.discount,
                        packageSaving: amounts.packageSaving,
                        loyaltyDiscount: amounts.loyaltyDiscount,
                        shipping: amounts.shipping,
                        shippingStatus: shippingStatus,
                        onRetryShipping: () => unawaited(_refreshShipping()),
                        total: amounts.total,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (!keyboardOpen)
              CheckoutBottomBar(
                s: s,
                total: amounts.total,
                placing: _placing,
                onPlace: _placeOrder,
                payByCard: method == 'CARD',
                blockedReason: blockedReason,
                blockedActionLabel: !offline && unavailable ? s.navCart : null,
                onBlockedAction: !offline && unavailable ? _goToCart : null,
              ),
          ],
        ),
      ),
    );
  }

  /// يظهر فقط حين سيُنشأ عنوان جديد (الحقول لا تطابق عنواناً محفوظاً).
  Widget _makeDefaultToggle(AppStrings s) {
    return ListenableBuilder(
      listenable: Listenable.merge([_nameCtrl, _phoneCtrl, _streetCtrl, _houseCtrl]),
      builder: (context, _) {
        final picked = _pickedAddress;
        if (picked != null && _formMatches(picked)) return const SizedBox.shrink();
        final t = context.worldTheme;
        return Padding(
          padding: const EdgeInsets.only(top: 6),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppCorners.sm),
            onTap: () => setState(() => _makeDefault = !_makeDefault),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: kMinTapTarget),
              child: Row(
                children: [
                  Checkbox(
                    value: _makeDefault,
                    activeColor: t.accent,
                    onChanged: (v) => setState(() => _makeDefault = v ?? false),
                  ),
                  Expanded(child: Text(s.makeDefaultAddress, style: AppText.bodySmall.copyWith(color: t.ink))),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// بعد إنشاء الطلب وحتى الانتقال (أو أثناء نافذة الدفع بالبطاقة): هوية هادئة بدل
/// «سلتكِ فارغة» التي كانت تظهر خلف الدفع.
class _OrderProcessingView extends ConsumerWidget {
  final bool byCard;
  const _OrderProcessingView({required this.byCard});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final still = MediaQuery.disableAnimationsOf(context);
    return Scaffold(
      backgroundColor: t.canvas,
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [t.accentSoft, t.canvas],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Semantics(
                liveRegion: true,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 104,
                      height: 104,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: t.surface,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: t.accent.withValues(alpha: 0.18), blurRadius: 30, offset: const Offset(0, 12)),
                        ],
                      ),
                      child: const BrandMark(height: 44),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      s.orderCreatedTitle,
                      textAlign: TextAlign.center,
                      style: AppText.title1.copyWith(color: t.ink),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      byCard ? s.preparingSecurePayment : s.openingOrderDetails,
                      textAlign: TextAlign.center,
                      style: AppText.bodySmall.copyWith(color: t.inkMuted),
                    ),
                    const SizedBox(height: 20),
                    if (!still)
                      SizedBox(
                        width: 120,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(AppCorners.pill),
                          child: LinearProgressIndicator(color: t.accent, backgroundColor: t.accentSoft, minHeight: 3),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
