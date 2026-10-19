import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/address.dart';
import '../../data/models/order.dart';
import '../../data/models/payment.dart';
import '../../data/models/user.dart';
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
import 'checkout_strings.dart';
import 'widgets/checkout_delivery_card.dart';
import 'widgets/checkout_header.dart';
import 'widgets/checkout_sections.dart';
import '../cart/widgets/pill_buttons.dart';
import '../worlds/world_theme.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _scrollCtrl = ScrollController();
  final _nameFieldKey = GlobalKey();
  final _phoneFieldKey = GlobalKey();
  final _locationFieldKey = GlobalKey();
  final _streetFieldKey = GlobalKey();
  final _deliverySectionKey = GlobalKey();
  final _paymentSectionKey = GlobalKey();
  final _summarySectionKey = GlobalKey();
  final _activeStep = ValueNotifier<int>(0);
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _houseCtrl = TextEditingController();
  final _couponCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  // طلب هدية.
  final _giftMsgCtrl = TextEditingController();
  bool _isGift = false;
  bool _giftHidePrices = true;

  String? _couponError;

  /// مفتاح محاولة الإتمام: ثابت طوال هذه الشاشة، فإعادة الإرسال بعد انقطاع (أو ضغطة
  /// ثانية بعد رد لم يصل) تُرجع الطلب نفسه من السيرفر بدل طلب مكرر.
  final String _checkoutRef =
      'app-${DateTime.now().microsecondsSinceEpoch}-${math.Random().nextInt(1 << 32).toRadixString(36)}';
  int _shippingFee = 0;
  bool _shippingLoading = false;
  String? _shippingError;
  bool _placing = false;
  bool _useLoyalty = false;
  int _loyaltySpent = 0;
  String _paymentMethod = 'COD';
  String? _governorate;
  String? _area;
  String? _addressId;
  bool _bootstrapped = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final c = ref.read(appliedCouponProvider);
      if (c != null) _couponCtrl.text = c.code;
      // قبل الدفع: الكود ما زال صالحاً؟ والأسعار والمخزون كما في السلة؟
      ref.read(appliedCouponProvider.notifier).revalidate(force: true);
      _revalidateCart();
      _maybeBootstrap();
    });
    _scrollCtrl.addListener(_syncActiveStep);
  }

  Future<void> _revalidateCart() async {
    final report = await ref.read(cartProvider.notifier).revalidate(force: true);
    if (!mounted || !report.hasChanges) return;
    final s = ref.s;
    final parts = <String>[
      if (report.unavailableKeys.isNotEmpty) s.cartUnavailableCount(report.unavailableKeys.length),
      if (report.changedPriceKeys.isNotEmpty) s.cartPricesUpdated(report.changedPriceKeys.length),
      if (report.clampedKeys.isNotEmpty) s.cartQuantitiesClamped,
      if (report.droppedPackageNames.isNotEmpty) s.cartPackagesEnded(report.droppedPackageNames.join('، ')),
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
    _notesCtrl.dispose();
    _giftMsgCtrl.dispose();
    super.dispose();
  }

  /// تعبئة البيانات من الحساب والعنوان الافتراضي — حين يجهز الاثنان معاً (أياً كان ترتيب وصولهما).
  void _maybeBootstrap() {
    if (_bootstrapped || !mounted) return;
    final user = ref.read(authProvider).user;
    final addresses = ref.read(addressesProvider);
    if (user == null || !(addresses.hasValue || addresses.hasError)) return;
    _bootstrapFromUser(user, addresses.valueOrNull);
    setState(() {});
  }

  void _bootstrapFromUser(AppUser user, List<Address>? addresses) {
    if (_bootstrapped) return;
    _nameCtrl.text = user.name;
    _phoneCtrl.text = formatPhoneLocal(user.phone);
    if (addresses != null && addresses.isNotEmpty) {
      final preferred = addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);
      _applyAddress(preferred, refreshShipping: false);
    }
    _bootstrapped = true;
    if (_governorate != null) _refreshShipping();
  }

  void _applyAddress(Address address, {bool refreshShipping = true}) {
    setState(() {
      _addressId = address.id;
      if (address.fullName.trim().isNotEmpty) _nameCtrl.text = address.fullName;
      if (address.phone.trim().isNotEmpty) _phoneCtrl.text = formatPhoneLocal(address.phone);
      _governorate = address.governorate ?? address.city;
      _area = address.area;
      _streetCtrl.text = address.street ?? '';
      _houseCtrl.text = address.house ?? '';
    });
    if (refreshShipping) _refreshShipping();
  }

  Future<void> _refreshShipping() async {
    if (_governorate == null || _governorate!.isEmpty) return;
    final subtotal = ref.read(cartProvider).subtotal;
    setState(() {
      _shippingLoading = true;
      _shippingError = null;
    });
    try {
      final fee = await ref
          .read(apiServiceProvider)
          .shippingQuote(governorate: _governorate, area: _area, subtotal: subtotal);
      if (mounted) setState(() => _shippingFee = fee);
    } catch (e) {
      if (mounted) setState(() => _shippingError = friendlyError(e, lang: ref.s.lang));
    } finally {
      if (mounted) setState(() => _shippingLoading = false);
    }
  }

  /// نفس منطق السلة: الكود السابق يبقى إن رُفض الجديد أو انقطعت الشبكة.
  Future<void> _applyCoupon() async {
    FocusScope.of(context).unfocus();
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) return;
    final s = ref.s;
    setState(() => _couponError = null);
    final int packageSaving = ref.read(cartPackageSavingProvider);
    final subtotal = ref.read(cartProvider).subtotal - packageSaving;
    final err = await applyCouponFromField(ref, code, subtotal: subtotal);
    if (!mounted) return;
    final coupon = ref.read(appliedCouponProvider);
    setState(() {
      // دون الحد الأدنى: يبقى مفعّلاً ونوضح كم ينقص (يتفعّل الخصم حين تبلغه السلة).
      _couponError = err ??
          (coupon != null && !coupon.eligibleFor(subtotal)
              ? s.minOrderAmount(formatPrice(coupon.minOrder, lang: s.lang))
              : null);
    });
  }

  Address _buildAddressFromForm() {
    final city = _area?.isNotEmpty == true ? _area! : (_governorate ?? '');
    return Address(
      id: _addressId ?? '',
      fullName: _nameCtrl.text.trim(),
      phone: normalizePhone(_phoneCtrl.text.trim()),
      city: city,
      governorate: _governorate,
      area: _area,
      street: _streetCtrl.text.trim().isEmpty ? null : _streetCtrl.text.trim(),
      house: _houseCtrl.text.trim().isEmpty ? null : _houseCtrl.text.trim(),
      isDefault: true,
    );
  }

  Future<Address> _upsertAddress() async {
    final payload = _buildAddressFromForm();
    final api = ref.read(apiServiceProvider);
    if (_addressId != null && _addressId!.isNotEmpty) {
      return api.updateAddress(_addressId!, payload);
    }
    return api.createAddress(payload);
  }

  Future<void> _scrollToFirstInvalid() async {
    HapticFeedback.lightImpact();
    await scrollToFirstInvalidFormSection([_nameFieldKey, _phoneFieldKey, _locationFieldKey, _streetFieldKey]);
  }

  Future<void> _addSavedAddress() async {
    final user = ref.read(authProvider).user;
    final initial = Address(
      id: '',
      fullName: _nameCtrl.text.trim().isNotEmpty ? _nameCtrl.text.trim() : (user?.name ?? ''),
      phone: _phoneCtrl.text.trim().isNotEmpty ? normalizePhone(_phoneCtrl.text.trim()) : (user?.phone ?? ''),
      city: '',
      governorate: _governorate,
      area: _area,
      street: _streetCtrl.text.trim().isEmpty ? null : _streetCtrl.text.trim(),
      house: _houseCtrl.text.trim().isEmpty ? null : _houseCtrl.text.trim(),
      isDefault: true,
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
      if (mounted) AppSnackbar.error(context, friendlyError(e, lang: ref.s.lang));
    }
  }

  /// إرسال الطلب، ومرة ثانية بنفس المفتاح إن انقطع الاتصال قبل وصول الرد —
  /// السيرفر يعيد الطلب نفسه إن كان قد أُنشئ.
  Future<AppOrder> _submitOrder(Future<AppOrder> Function() send) async {
    try {
      return await send();
    } on ApiException catch (e) {
      if (!e.isConnectionProblem || !mounted) rethrow;
      await Future<void>.delayed(const Duration(milliseconds: 800));
      return send();
    }
  }

  Future<void> _placeOrder() async {
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
    try {
      final cart = ref.read(cartProvider);
      // الكوبون يُحسب على المجموع بعد توفير الباقات (نفس قاعدة السيرفر).
      final int packageSaving = ref.read(cartPackageSavingProvider);
      final couponBase = cart.subtotal - packageSaving;
      final packs = [
        for (final st in ref.read(cartPackageStatusProvider))
          if (st.complete) {'packageId': st.pack.id, 'quantity': st.completeSets},
      ];
      final coupon = ref.read(appliedCouponProvider);
      final address = await _upsertAddress();
      ref.invalidate(addressesProvider);
      final api = ref.read(apiServiceProvider);
      final items = cart.items.map((e) => e.toOrderItem()).toList();
      final order = await _submitOrder(
        () => api.createOrder(
          items: items,
          addressId: address.id,
          // الكود يُرسل فقط إن بلغت السلة حدّه الأدنى (وإلا يرفض السيرفر الطلب).
          couponCode: coupon != null && coupon.eligibleFor(couponBase) ? coupon.code : null,
          packages: packs,
          notes: _notesCtrl.text.trim(),
          isGift: _isGift,
          giftMessage: _isGift ? _giftMsgCtrl.text.trim() : null,
          giftHidePrices: _isGift && _giftHidePrices,
          loyaltySpent: _useLoyalty ? _loyaltySpent : 0,
          paymentMethod: _paymentMethod,
          clientRef: _checkoutRef,
        ),
      );
      ref.read(cartProvider.notifier).clear();
      ref.read(cartPackagesProvider.notifier).clear();
      ref.read(appliedCouponProvider.notifier).clear();
      ref.invalidate(ordersProvider);
      ref.invalidate(loyaltyProvider);
      ref.read(authProvider.notifier).refreshUser();
      // السيرفر يحفظ الطلب المغطّى بالكامل (نقاط/كوبون) نقداً ومدفوعاً — بلا بطاقة.
      if (order.paymentMethod == 'CARD' && order.paymentStatus != 'PAID') {
        await _payOrder(order.id);
      } else if (mounted) {
        context.pushReplacement('/order-success/${order.id}');
      }
      unawaited(PushService.requestPermissionInContext());
    } catch (e) {
      if (mounted) AppSnackbar.error(context, friendlyError(e, lang: ref.s.lang));
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  /// الطلب أُنشئ (والسلة أُفرغت) — الآن الدفع بالبطاقة. إن لم يكتمل نذهب لصفحة
  /// الطلب حيث يمكن الدفع لاحقاً، ولا يضيع شيء.
  Future<void> _payOrder(String orderId) async {
    while (mounted) {
      final outcome = await CardPaymentFlow.run(context, ref, orderId);
      if (!mounted) return;
      if (outcome.isPaid) {
        context.pushReplacement('/order-success/$orderId');
        return;
      }
      final retry = await showPaymentRetrySheet(context, ref.s, outcome);
      if (!retry) break;
    }
    if (mounted) context.pushReplacement('/orders/$orderId');
  }

  int get _loyaltyDiscount => ref.read(loyaltyRulesProvider).valueOf(_loyaltySpent);

  void _toggleLoyalty(bool value, int points, int orderBeforeLoyalty) {
    setState(() {
      _useLoyalty = value;
      if (!value) {
        _loyaltySpent = 0;
        return;
      }
      // كل نقطة = 1 د.ع (من إعدادات المتجر)، بمضاعفات 250، ولا تتجاوز قيمة الطلب.
      _loyaltySpent = ref.read(loyaltyRulesProvider).redeemable(points, orderBeforeLoyalty);
    });
  }

  /// فُتحت من رابط بلا صفحة تحتها: للسلة بدل رجوع مستحيل.
  void _back() {
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
    return AuthGate(title: s.checkout, emptyTitle: s.loginToCheckout, child: _buildCheckout(s));
  }

  Widget _buildCheckout(AppStrings s) {
    final cart = ref.watch(cartProvider);
    final user = ref.watch(authProvider).user;
    final addressesAsync = ref.watch(addressesProvider);
    final payMethods = ref.watch(paymentMethodsProvider).valueOrNull ?? PaymentMethodsConfig.fallback;

    ref.listen(addressesProvider, (_, __) => WidgetsBinding.instance.addPostFrameCallback((_) => _maybeBootstrap()));
    ref.listen(authProvider, (_, __) => WidgetsBinding.instance.addPostFrameCallback((_) => _maybeBootstrap()));

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

    final coupon = ref.watch(appliedCouponProvider);
    // أُزيل الكود تلقائياً (انتهى، لأول طلب فقط…): السبب مكان خطأ الحقل.
    final couponError = _couponError ?? ref.watch(appliedCouponRejectProvider);
    final points = user?.points ?? 0;
    final subtotal = cart.subtotal;
    final packageSaving = ref.watch(cartPackageSavingProvider);
    final couponBase = subtotal - packageSaving;
    final discount = coupon?.discountFor(couponBase) ?? 0;
    final shipping = (coupon?.freeShipping ?? false) && coupon!.eligibleFor(couponBase) ? 0 : _shippingFee;
    final beforeLoyalty = (subtotal - packageSaving - discount + shipping).clamp(0, 1 << 31);
    final loyaltyDiscount = _useLoyalty ? _loyaltyDiscount : 0;
    final total = (beforeLoyalty - loyaltyDiscount).clamp(0, 1 << 31);
    final savedAddresses = addressesAsync.valueOrNull ?? [];
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final offline = ref.watch(connectivityProvider).valueOrNull == false;
    final blockedReason = offline
        ? s.checkoutOffline
        : cart.hasUnavailable
            ? s.checkoutUnavailableItems
            : null;
    // مغطّى بالكامل بالنقاط والكوبون: لا شيء يُدفع بالبطاقة.
    final payByCard = _paymentMethod == 'CARD' && payMethods.cardEnabled && total > 0;

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
                onStepTap: addressesAsync.hasValue ? _jumpToStep : null,
              ),
            ),
            Expanded(
              child: addressesAsync.when(
                loading: () => ListView(
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.only(bottom: 16),
                  children: const [
                    Padding(padding: EdgeInsets.all(16), child: ShimmerBox(height: 320, radius: 20)),
                    Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: ShimmerBox(height: 140, radius: 20)),
                  ],
                ),
                error: (e, _) => ErrorView.from(e, onRetry: () => ref.invalidate(addressesProvider)),
                // ليست قائمة كسولة: نموذج العنوان في الأعلى يجب أن يبقى حياً حتى
                // يُتحقق منه عند الضغط على "تأكيد الطلب" من أسفل الصفحة.
                data: (_) => SingleChildScrollView(
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
                      onPickAddress: (a) {
                        HapticFeedback.selectionClick();
                        _applyAddress(a);
                      },
                      onAddAddress: _addSavedAddress,
                      onShippingChanged: _refreshShipping,
                    ),
                    const SizedBox(height: 14),
                    CheckoutShippingBanner(s: s, error: _shippingError, onRetry: _refreshShipping),
                    CheckoutCouponCard(
                      s: s,
                      controller: _couponCtrl,
                      error: couponError,
                      appliedCode: coupon?.code,
                      onApply: _applyCoupon,
                    ),
                    const SizedBox(height: 14),
                    CheckoutPaymentCard(
                      key: _paymentSectionKey,
                      s: s,
                      paymentMethod: _paymentMethod,
                      cardEnabled: payMethods.cardEnabled,
                      sandbox: payMethods.sandbox,
                      onChanged: (v) {
                        HapticFeedback.selectionClick();
                        setState(() => _paymentMethod = v);
                      },
                    ),
                    const SizedBox(height: 14),
                    CheckoutGiftCard(
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
                        points: points,
                        useLoyalty: _useLoyalty,
                        loyaltyDiscount: loyaltyDiscount,
                        enabled: points >= ref.watch(loyaltyRulesProvider).redeemStep,
                        onChanged: (v) => _toggleLoyalty(v, points, beforeLoyalty),
                        rules: ref.watch(loyaltyRulesProvider),
                      ),
                    ],
                    const SizedBox(height: 14),
                    CheckoutSummaryCard(
                      key: _summarySectionKey,
                      s: s,
                      items: cart.items,
                      subtotal: subtotal,
                      discount: discount,
                      packageSaving: packageSaving,
                      loyaltyDiscount: loyaltyDiscount,
                      shipping: shipping,
                      total: total,
                      shippingLoading: _shippingLoading,
                    ),
                    ],
                  ),
                ),
              ),
            ),
            if (!keyboardOpen) CheckoutBottomBar(
                s: s,
                total: total,
                placing: _placing,
                onPlace: _placeOrder,
                payByCard: payByCard,
                blockedReason: blockedReason,
              ),
          ],
        ),
      ),
    );
  }
}
