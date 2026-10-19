import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/json.dart';
import '../../../core/utils/phone_util.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/address.dart';
import '../../cart/widgets/cart_theme.dart';
import '../../profile/profile_providers.dart';
import '../../worlds/world_theme.dart';
import '../checkout_strings.dart';
import '../delivery_estimate.dart';
import 'checkout_theme.dart';

typedef AddressPicked = void Function(Address address);

/// الاستلام من الفرع كما تضبطه لوحة التحكم — يظهر الخيار فقط حين يكون له عنوان.
class CheckoutPickupInfo {
  final String address;
  final String hours;
  const CheckoutPickupInfo({required this.address, this.hours = ''});
}

class CheckoutDeliveryCard extends ConsumerWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameCtrl;
  final TextEditingController phoneCtrl;
  final TextEditingController streetCtrl;
  final TextEditingController houseCtrl;
  final String? governorate;
  final String? area;
  final ValueChanged<String?> onGovernorateChanged;
  final ValueChanged<String?> onAreaChanged;
  final List<Address> savedAddresses;
  final String? selectedAddressId;
  final AddressPicked onPickAddress;
  final VoidCallback onShippingChanged;
  final VoidCallback? onAddAddress;
  final GlobalKey? nameFieldKey;
  final GlobalKey? phoneFieldKey;
  final GlobalKey? locationFieldKey;
  final GlobalKey? streetFieldKey;

  /// العناوين المحفوظة ما زالت تُحمَّل.
  final bool addressesLoading;

  /// فشل تحميل العناوين: شريحة «إعادة» مكانها، والنموذج يبقى صالحاً للكتابة.
  final VoidCallback? onRetryAddresses;

  /// الاستلام من الفرع متاح (null = التوصيل فقط، ولا يظهر الاختيار).
  final CheckoutPickupInfo? pickup;
  final bool isPickup;
  final ValueChanged<bool>? onPickupChanged;

  /// يظهر أسفل حقول العنوان (مثل «اجعليه عنواني الافتراضي»).
  final Widget? addressFooter;

  const CheckoutDeliveryCard({
    super.key,
    required this.formKey,
    required this.nameCtrl,
    required this.phoneCtrl,
    required this.streetCtrl,
    required this.houseCtrl,
    required this.governorate,
    required this.area,
    required this.onGovernorateChanged,
    required this.onAreaChanged,
    required this.savedAddresses,
    required this.selectedAddressId,
    required this.onPickAddress,
    required this.onShippingChanged,
    this.onAddAddress,
    this.nameFieldKey,
    this.phoneFieldKey,
    this.locationFieldKey,
    this.streetFieldKey,
    this.addressesLoading = false,
    this.onRetryAddresses,
    this.pickup,
    this.isPickup = false,
    this.onPickupChanged,
    this.addressFooter,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final showPickup = pickup != null && onPickupChanged != null;
    final pickingUp = showPickup && isPickup;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: CartTheme.hPad),
      decoration: CheckoutTheme.cardDecoration(context),
      child: Form(
        key: formKey,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CheckoutSectionHeader(
                icon: Icons.person_pin_circle_outlined,
                title: s.recipientInfo,
                subtitle: s.recipientAutoFill,
                step: 1,
              ),
              KeyedSubtree(
                key: nameFieldKey,
                child: TextFormField(
                  controller: nameCtrl,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.name],
                  decoration: CheckoutTheme.fieldDecoration(
                    context,
                    label: s.fullName,
                    icon: Icons.person_outline_rounded,
                  ),
                  validator: (v) => (v == null || v.trim().length < 2) ? s.enterYourNameShort : null,
                ),
              ),
              const SizedBox(height: 12),
              KeyedSubtree(
                key: phoneFieldKey,
                child: TextFormField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  // الرقم يُقرأ من اليسار حتى في الواجهة العربية، والأرقام العربية تُحوَّل أثناء الكتابة.
                  textDirection: TextDirection.ltr,
                  inputFormatters: phoneInputFormatters,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  textInputAction: pickingUp ? TextInputAction.done : TextInputAction.next,
                  decoration: CheckoutTheme.fieldDecoration(
                    context,
                    label: s.phoneNumber,
                    hint: '07701234567',
                    icon: Icons.phone_outlined,
                  ),
                  validator: (v) => validateIraqiPhone(v, lang: s.lang),
                ),
              ),
              const SizedBox(height: 20),
              Divider(height: 1, color: context.worldTheme.divider),
              const SizedBox(height: 18),
              if (showPickup) ...[
                CheckoutSectionHeader(icon: Icons.local_shipping_outlined, title: s.receiveMethodTitle),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _ReceiveOption(
                        icon: Icons.home_outlined,
                        title: s.homeDelivery,
                        subtitle: s.homeDeliveryHint,
                        selected: !isPickup,
                        onTap: () => onPickupChanged!(false),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _ReceiveOption(
                        icon: Icons.storefront_outlined,
                        title: s.branchPickup,
                        subtitle: s.pickupFreeHint,
                        selected: isPickup,
                        onTap: () => onPickupChanged!(true),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              AnimatedSize(
                duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 240),
                curve: Curves.easeOutCubic,
                alignment: AlignmentDirectional.topCenter,
                child: pickingUp ? _PickupDetails(info: pickup!) : _addressSection(context, ref, s),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _addressSection(BuildContext context, WidgetRef ref, AppStrings s) {
    final zones = ref.watch(shippingZonesProvider);
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CheckoutSectionHeader(
          icon: Icons.location_on_outlined,
          title: s.deliveryLocation,
          subtitle: s.deliveryLocationHint,
        ),
        if (addressesLoading)
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: SizedBox(
              width: 120,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppCorners.pill),
                child: LinearProgressIndicator(color: t.accent, backgroundColor: t.accentSoft, minHeight: 3),
              ),
            ),
          )
        else if (onRetryAddresses != null)
          _RetryRow(message: s.addressesLoadFailed, onRetry: onRetryAddresses!)
        else
          _SavedAddresses(
            addresses: savedAddresses,
            selectedId: selectedAddressId,
            onPick: onPickAddress,
            onAdd: onAddAddress,
          ),
        const SizedBox(height: 12),
        KeyedSubtree(
          key: locationFieldKey,
          child: zones.when(
            loading: () => ClipRRect(
              borderRadius: BorderRadius.circular(AppCorners.pill),
              child: LinearProgressIndicator(color: t.accent, backgroundColor: t.accentSoft, minHeight: 3),
            ),
            error: (_, __) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _RetryRow(message: s.zonesLoadFailed, onRetry: () => retryShippingZones(ref)),
                const SizedBox(height: 8),
                _GovernorateTextField(
                  value: governorate,
                  onChanged: (v) {
                    onGovernorateChanged(v);
                    onShippingChanged();
                  },
                ),
              ],
            ),
            data: (list) => _GovernorateFields(
              zones: list,
              governorate: governorate,
              area: area,
              onGovernorateChanged: (v) {
                onGovernorateChanged(v);
                onShippingChanged();
              },
              onAreaChanged: (v) {
                onAreaChanged(v);
                onShippingChanged();
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        KeyedSubtree(
          key: streetFieldKey,
          child: TextFormField(
            controller: streetCtrl,
            textInputAction: TextInputAction.next,
            decoration: CheckoutTheme.fieldDecoration(context, label: s.streetLabel, icon: Icons.signpost_outlined),
            validator: (v) => (v == null || v.trim().isEmpty) ? s.enterStreet : null,
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: houseCtrl,
          textInputAction: TextInputAction.done,
          decoration: CheckoutTheme.fieldDecoration(context, label: s.houseOptional, icon: Icons.home_outlined),
        ),
        if (addressFooter != null) addressFooter!,
      ],
    );
  }
}

/// العناوين المحفوظة: بطاقات صغيرة بسطرين (المكان — المنطقة، ثم الاسم • الشارع)
/// حتى لا تتشابه عناوين المدينة نفسها.
class _SavedAddresses extends ConsumerWidget {
  final List<Address> addresses;
  final String? selectedId;
  final AddressPicked onPick;
  final VoidCallback? onAdd;

  const _SavedAddresses({required this.addresses, required this.selectedId, required this.onPick, this.onAdd});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    if (addresses.isEmpty && onAdd == null) return const SizedBox.shrink();
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final a in addresses) ...[
              _AddressCard(address: a, selected: selectedId == a.id, onTap: () => onPick(a)),
              const SizedBox(width: 8),
            ],
            if (onAdd != null)
              Center(
                child: AppChoiceChip(icon: Icons.add_rounded, label: s.addAddress, selected: false, onTap: onAdd!),
              ),
          ],
        ),
      ),
    );
  }
}

class _AddressCard extends ConsumerWidget {
  final Address address;
  final bool selected;
  final VoidCallback onTap;

  const _AddressCard({required this.address, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final a = address;
    final place = (a.governorate ?? '').trim().isNotEmpty ? a.governorate!.trim() : a.city;
    final area = (a.area ?? '').trim();
    final title = area.isNotEmpty && area != place ? '$place — $area' : place;
    final detail = [a.fullName.trim(), (a.street ?? '').trim()].where((e) => e.isNotEmpty).join(' • ');
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppCorners.md),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: AnimatedContainer(
            duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 200),
            width: 196,
            constraints: const BoxConstraints(minHeight: 64),
            padding: const EdgeInsetsDirectional.fromSTEB(10, 10, 12, 10),
            decoration: BoxDecoration(
              color: selected ? t.accentLight : t.surface,
              borderRadius: BorderRadius.circular(AppCorners.md),
              border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 1.5 : 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  selected ? Icons.check_circle_rounded : Icons.place_outlined,
                  size: 18,
                  color: selected ? t.accent : t.inkMuted,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.label.copyWith(color: t.ink),
                            ),
                          ),
                          if (a.isDefault) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: t.accentSoft,
                                borderRadius: BorderRadius.circular(AppCorners.pill),
                              ),
                              child: Text(s.defaultLabel, style: AppText.micro.copyWith(color: t.accentDark)),
                            ),
                          ],
                        ],
                      ),
                      if (detail.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          detail,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: t.inkMuted),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// «توصيل للبيت» / «استلام من الفرع».
class _ReceiveOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _ReceiveOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppCorners.md),
          onTap: () {
            if (selected) return;
            HapticFeedback.selectionClick();
            onTap();
          },
          child: AnimatedContainer(
            duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 200),
            constraints: const BoxConstraints(minHeight: 72),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: selected ? t.accentLight : t.surface,
              borderRadius: BorderRadius.circular(AppCorners.md),
              border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 1.5 : 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 20, color: selected ? t.accentDark : t.inkSoft),
                    const Spacer(),
                    Icon(
                      selected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                      size: 20,
                      color: selected ? t.accent : t.inkMuted.withValues(alpha: 0.6),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(title, style: AppText.label.copyWith(color: t.ink)),
                const SizedBox(height: 2),
                Text(subtitle, style: AppText.caption.copyWith(color: t.inkMuted)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// عنوان الفرع وأوقاته — بدل حقول العنوان عند الاستلام.
class _PickupDetails extends ConsumerWidget {
  final CheckoutPickupInfo info;
  const _PickupDetails({required this.info});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Color.alphaBlend(AppColors.success.withValues(alpha: 0.06), t.surface),
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.storefront_rounded, color: AppColors.success, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.branchPickupFree, style: AppText.label.copyWith(color: t.ink)),
                const SizedBox(height: 4),
                Text(info.address, style: AppText.bodySmall.copyWith(color: t.inkSoft, height: 1.5)),
                if (info.hours.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(s.pickupHoursLabel(info.hours), style: AppText.caption.copyWith(color: t.inkMuted)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// سطر صغير «تعذّر … — إعادة» بدل خطأ يملأ الشاشة.
class _RetryRow extends ConsumerWidget {
  final String message;
  final VoidCallback onRetry;
  const _RetryRow({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(12, 2, 4, 2),
      decoration: BoxDecoration(
        color: Color.alphaBlend(AppColors.sale.withValues(alpha: 0.06), t.surface),
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(color: AppColors.sale.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, size: 18, color: AppColors.sale),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: AppText.caption.copyWith(color: t.ink, fontWeight: FontWeight.w600))),
          TextButton.icon(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.sale,
              minimumSize: const Size(kMinTapTarget, kMinTapTarget),
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: Text(s.retry, style: AppText.label),
          ),
        ],
      ),
    );
  }
}

class _GovernorateFields extends ConsumerWidget {
  final List<Map<String, dynamic>> zones;
  final String? governorate;
  final String? area;
  final ValueChanged<String?> onGovernorateChanged;
  final ValueChanged<String?> onAreaChanged;

  const _GovernorateFields({
    required this.zones,
    required this.governorate,
    required this.area,
    required this.onGovernorateChanged,
    required this.onAreaChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final govs = zones.map((z) => asString(z['governorate'])).where((e) => e.isNotEmpty).toList();
    final selectedZone = zones.firstWhere((z) => asString(z['governorate']) == governorate, orElse: () => const {});
    final areas = asList(selectedZone['areas']).map((a) => asString(a['name'])).where((e) => e.isNotEmpty).toList();

    return Column(
      children: [
        DropdownButtonFormField<String>(
          key: ValueKey('gov-$governorate'),
          initialValue: govs.contains(governorate) ? governorate : null,
          isExpanded: true,
          decoration: CheckoutTheme.fieldDecoration(context, label: s.governorate, icon: Icons.map_outlined),
          items: [for (final g in govs) DropdownMenuItem(value: g, child: Text(g))],
          validator: (v) => (v == null || v.isEmpty) ? s.selectGovernorate : null,
          onChanged: onGovernorateChanged,
        ),
        // موعد الوصول المتوقع للمحافظة المختارة.
        if (windowFor(zones, governorate) case final w?)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              children: [
                Icon(Icons.schedule_rounded, size: 16, color: context.worldTheme.accentDark),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    w.labelFor(s, withPlace: false),
                    style: AppText.caption.copyWith(color: context.worldTheme.accentDark, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        if (areas.isNotEmpty) ...[
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: ValueKey('area-$governorate-$area'),
            initialValue: areas.contains(area) ? area : null,
            isExpanded: true,
            decoration: CheckoutTheme.fieldDecoration(context, label: s.areaLabel, icon: Icons.place_outlined),
            items: [for (final a in areas) DropdownMenuItem(value: a, child: Text(a))],
            validator: (v) => (v == null || v.isEmpty) ? s.selectArea : null,
            onChanged: onAreaChanged,
          ),
        ],
      ],
    );
  }
}

/// تعذّر جلب المحافظات: كتابة يدوية مؤقتة.
///
/// يتبع [value] حين يتغيّر من الخارج (اختيار عنوان محفوظ) دون أن يُعاد بناؤه أثناء
/// الكتابة، وعرض سعر التوصيل يُطلب بعد توقف الكتابة 400ms لا مع كل حرف.
class _GovernorateTextField extends ConsumerStatefulWidget {
  final String? value;
  final ValueChanged<String> onChanged;

  const _GovernorateTextField({required this.value, required this.onChanged});

  @override
  ConsumerState<_GovernorateTextField> createState() => _GovernorateTextFieldState();
}

class _GovernorateTextFieldState extends ConsumerState<_GovernorateTextField> {
  late final TextEditingController _ctrl = TextEditingController(text: widget.value ?? '');
  Timer? _debounce;

  @override
  void didUpdateWidget(_GovernorateTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = widget.value ?? '';
    // تغيّر من خارج الحقل (عنوان محفوظ): نعرضه. ما كتبته هي ينتظر المؤقت فلا نلمسه.
    if (next != oldWidget.value && next != _ctrl.text.trim() && _debounce?.isActive != true) {
      _ctrl.text = next;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (mounted) widget.onChanged(v.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return TextFormField(
      controller: _ctrl,
      decoration: CheckoutTheme.fieldDecoration(context, label: s.governorateCity, icon: Icons.map_outlined),
      validator: (v) => (v == null || v.trim().isEmpty) ? s.requiredField : null,
      onChanged: _onChanged,
    );
  }
}
