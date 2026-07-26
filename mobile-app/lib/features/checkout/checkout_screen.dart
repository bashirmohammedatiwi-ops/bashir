import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/phone_util.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/address.dart';
import '../../data/models/coupon.dart';
import '../../data/models/user.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../cart/coupon_provider.dart';
import '../shell/main_shell.dart';
import '../profile/profile_providers.dart';
import 'widgets/checkout_delivery_card.dart';
import 'widgets/checkout_header.dart';
import 'widgets/checkout_sections.dart';
import 'widgets/checkout_theme.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _houseCtrl = TextEditingController();
  final _couponCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  Coupon? _coupon;
  String? _couponError;
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
      final c = ref.read(appliedCouponProvider);
      if (c != null && mounted) {
        setState(() {
          _coupon = c;
          _couponCtrl.text = c.code;
        });
      }
      _maybeBootstrap();
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _streetCtrl.dispose();
    _houseCtrl.dispose();
    _couponCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _maybeBootstrap() {
    if (_bootstrapped) return;
    final user = ref.read(authProvider).user;
    final addresses = ref.read(addressesProvider).valueOrNull;
    if (user == null) return;
    _bootstrapFromUser(user, addresses);
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
      final fee = await ref.read(apiServiceProvider).shippingQuote(
            governorate: _governorate,
            area: _area,
            subtotal: subtotal,
          );
      if (mounted) setState(() => _shippingFee = fee);
    } catch (e) {
      if (mounted) setState(() => _shippingError = friendlyError(e));
    } finally {
      if (mounted) setState(() => _shippingLoading = false);
    }
  }

  Future<void> _applyCoupon() async {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() => _couponError = null);
    try {
      final coupon = await ref.read(apiServiceProvider).validateCoupon(code);
      final subtotal = ref.read(cartProvider).subtotal;
      if (coupon == null) {
        setState(() {
          _coupon = null;
          _couponError = 'الكوبون غير صالح';
        });
        return;
      }
      if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        setState(() {
          _coupon = null;
          _couponError = 'الحد الأدنى للطلب ${formatPrice(coupon.minOrder)}';
        });
        return;
      }
      setState(() => _coupon = coupon);
      ref.read(appliedCouponProvider.notifier).state = coupon;
    } catch (_) {
      setState(() {
        _coupon = null;
        _couponError = 'الكوبون غير صالح';
      });
    }
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

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;
    if (_paymentMethod == 'CARD') {
      AppSnackbar.show(context, 'الدفع بالبطاقة قيد التفعيل — اختر الدفع عند الاستلام حالياً');
      return;
    }
    HapticFeedback.mediumImpact();
    setState(() => _placing = true);
    try {
      final cart = ref.read(cartProvider);
      final address = await _upsertAddress();
      ref.invalidate(addressesProvider);
      final order = await ref.read(apiServiceProvider).createOrder(
            items: cart.items.map((e) => e.toOrderItem()).toList(),
            addressId: address.id,
            couponCode: _coupon?.code,
            notes: _notesCtrl.text.trim(),
            loyaltySpent: _useLoyalty ? _loyaltySpent : 0,
            paymentMethod: _paymentMethod,
          );
      ref.read(cartProvider.notifier).clear();
      ref.read(appliedCouponProvider.notifier).state = null;
      ref.invalidate(ordersProvider);
      ref.read(authProvider.notifier).refreshUser();
      if (mounted) context.pushReplacement('/order-success/${order.id}');
    } catch (e) {
      if (mounted) AppSnackbar.error(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  int get _loyaltyDiscount => (_loyaltySpent ~/ 100) * 1000;

  void _toggleLoyalty(bool value, int points, int orderBeforeLoyalty) {
    setState(() {
      _useLoyalty = value;
      if (!value) {
        _loyaltySpent = 0;
        return;
      }
      final maxByPoints = (points ~/ 100) * 100;
      final maxByTotal = (orderBeforeLoyalty ~/ 1000) * 100;
      _loyaltySpent = maxByPoints < maxByTotal ? maxByPoints : maxByTotal;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return AuthGate(
      title: s.checkout,
      emptyTitle: s.loginToCheckout,
      child: _buildCheckout(s),
    );
  }

  Widget _buildCheckout(AppStrings s) {
    final cart = ref.watch(cartProvider);
    final user = ref.watch(authProvider).user;
    final addressesAsync = ref.watch(addressesProvider);

    ref.listen(addressesProvider, (prev, next) {
      next.whenData((list) {
        if (!_bootstrapped && user != null) {
          _bootstrapFromUser(user, list);
          if (mounted) setState(() {});
        }
      });
    });

    if (cart.isEmpty) {
      return Scaffold(
        backgroundColor: CheckoutTheme.bg,
        appBar: AppBar(title: Text(s.checkout), elevation: 0, backgroundColor: CheckoutTheme.bg),
        body: EmptyState(
          icon: Icons.shopping_bag_outlined,
          title: s.emptyCartTitle,
          subtitle: s.emptyCartSubtitle,
          action: ElevatedButton(
            onPressed: () {
              ref.read(navIndexProvider.notifier).state = 3;
              context.go('/');
            },
            child: Text(s.goToCart),
          ),
        ),
      );
    }

    final points = user?.points ?? 0;
    final subtotal = cart.subtotal;
    final discount = _coupon?.discountFor(subtotal) ?? 0;
    final shipping = (_coupon?.freeShipping ?? false) ? 0 : _shippingFee;
    final beforeLoyalty = (subtotal - discount + shipping).clamp(0, 1 << 31);
    final loyaltyDiscount = _useLoyalty ? _loyaltyDiscount : 0;
    final total = (beforeLoyalty - loyaltyDiscount).clamp(0, 1 << 31);
    final savedAddresses = addressesAsync.valueOrNull ?? [];

    return Scaffold(
      backgroundColor: CheckoutTheme.bg,
      body: Column(
        children: [
          CheckoutHeader(
            s: s,
            itemCount: cart.count,
            onBack: () => context.pop(),
          ),
          Expanded(
            child: addressesAsync.when(
              loading: () => ListView(
                padding: EdgeInsets.only(bottom: CheckoutTheme.shellNavReserve(context) + 80),
                children: const [
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: ShimmerBox(height: 280, radius: 20),
                  ),
                ],
              ),
              error: (e, _) => ErrorView.from(e, onRetry: () => ref.invalidate(addressesProvider)),
              data: (_) => ListView(
                padding: EdgeInsets.only(bottom: CheckoutTheme.shellNavReserve(context) + 90),
                children: [
                  CheckoutDeliveryCard(
                    formKey: _formKey,
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
                    onShippingChanged: _refreshShipping,
                  ),
                  const SizedBox(height: 14),
                  CheckoutShippingBanner(s: s, error: _shippingError, onRetry: _refreshShipping),
                  CheckoutCouponCard(
                    s: s,
                    controller: _couponCtrl,
                    error: _couponError,
                    appliedCode: _coupon?.code,
                    onApply: _applyCoupon,
                  ),
                  const SizedBox(height: 14),
                  CheckoutPaymentCard(
                    s: s,
                    paymentMethod: _paymentMethod,
                    onChanged: (v) => setState(() => _paymentMethod = v),
                  ),
                  const SizedBox(height: 14),
                  CheckoutNotesCard(s: s, controller: _notesCtrl),
                  if (points >= 100) ...[
                    const SizedBox(height: 14),
                    CheckoutLoyaltyCard(
                      s: s,
                      points: points,
                      useLoyalty: _useLoyalty,
                      loyaltyDiscount: loyaltyDiscount,
                      onChanged: (v) => _toggleLoyalty(v, points, beforeLoyalty),
                    ),
                  ],
                  const SizedBox(height: 14),
                  CheckoutSummaryCard(
                    s: s,
                    subtotal: subtotal,
                    discount: discount,
                    loyaltyDiscount: loyaltyDiscount,
                    shipping: shipping,
                    total: total,
                    shippingLoading: _shippingLoading,
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: CheckoutBottomBar(
        s: s,
        total: total,
        placing: _placing,
        onPlace: _placeOrder,
      ),
    );
  }
}
