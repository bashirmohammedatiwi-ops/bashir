import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/json.dart';
import '../../../core/utils/phone_util.dart';
import '../../../data/models/address.dart';
import '../../profile/profile_providers.dart';
import 'checkout_theme.dart';

typedef AddressPicked = void Function(Address address);

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
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final zones = ref.watch(shippingZonesProvider);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: CheckoutTheme.cardDecoration(),
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
              ),
              KeyedSubtree(
                key: nameFieldKey,
                child: TextFormField(
                  controller: nameCtrl,
                  textInputAction: TextInputAction.next,
                  decoration: CheckoutTheme.fieldDecoration(
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
                  textInputAction: TextInputAction.next,
                  decoration: CheckoutTheme.fieldDecoration(
                    label: s.phoneNumber,
                    hint: '07701234567',
                    icon: Icons.phone_outlined,
                  ),
                  validator: (v) => validateIraqiPhone(v),
                ),
              ),
              const SizedBox(height: 18),
              CheckoutSectionHeader(
                icon: Icons.location_on_outlined,
                title: s.deliveryLocation,
                subtitle: s.deliveryLocationHint,
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: savedAddresses.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    if (i == savedAddresses.length) {
                      return ActionChip(
                        avatar: const Icon(Icons.add_rounded, size: 16, color: CheckoutTheme.brand),
                        label: Text(
                          s.addAddress,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            color: CheckoutTheme.brandDark,
                          ),
                        ),
                        backgroundColor: CheckoutTheme.brandWash,
                        side: const BorderSide(color: CheckoutTheme.brandSoft),
                        onPressed: onAddAddress,
                      );
                    }
                    final a = savedAddresses[i];
                    final selected = selectedAddressId == a.id;
                    return FilterChip(
                      label: Text(
                        a.isDefault ? '${a.governorate ?? a.city} • ${s.defaultLabel}' : (a.governorate ?? a.city),
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: selected ? CheckoutTheme.brandDark : CheckoutTheme.charcoal,
                        ),
                      ),
                      selected: selected,
                      showCheckmark: false,
                      selectedColor: CheckoutTheme.brandSoft,
                      backgroundColor: CheckoutTheme.brandWash,
                      side: BorderSide(
                        color: selected ? CheckoutTheme.brand : CheckoutTheme.brandSoft,
                      ),
                      onSelected: (_) => onPickAddress(a),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              KeyedSubtree(
                key: locationFieldKey,
                child: zones.when(
                  loading: () => const LinearProgressIndicator(color: CheckoutTheme.brand),
                  error: (_, __) => _GovernorateTextField(
                    value: governorate,
                    onChanged: (v) {
                      onGovernorateChanged(v);
                      onShippingChanged();
                    },
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
                  decoration: CheckoutTheme.fieldDecoration(
                    label: s.streetLabel,
                    icon: Icons.signpost_outlined,
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? s.enterStreet : null,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: houseCtrl,
                textInputAction: TextInputAction.done,
                decoration: CheckoutTheme.fieldDecoration(
                  label: s.houseOptional,
                  icon: Icons.home_outlined,
                ),
              ),
            ],
          ),
        ),
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
    final selectedZone = zones.firstWhere(
      (z) => asString(z['governorate']) == governorate,
      orElse: () => const {},
    );
    final areas = asList(selectedZone['areas']).map((a) => asString(a['name'])).where((e) => e.isNotEmpty).toList();

    return Column(
      children: [
        DropdownButtonFormField<String>(
          key: ValueKey('gov-$governorate'),
          initialValue: govs.contains(governorate) ? governorate : null,
          isExpanded: true,
          decoration: CheckoutTheme.fieldDecoration(label: s.governorate, icon: Icons.map_outlined),
          items: [for (final g in govs) DropdownMenuItem(value: g, child: Text(g))],
          validator: (v) => (v == null || v.isEmpty) ? s.selectGovernorate : null,
          onChanged: onGovernorateChanged,
        ),
        if (areas.isNotEmpty) ...[
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: ValueKey('area-$governorate-$area'),
            initialValue: areas.contains(area) ? area : null,
            isExpanded: true,
            decoration: CheckoutTheme.fieldDecoration(label: s.areaLabel, icon: Icons.place_outlined),
            items: [for (final a in areas) DropdownMenuItem(value: a, child: Text(a))],
            validator: (v) => (v == null || v.isEmpty) ? s.selectArea : null,
            onChanged: onAreaChanged,
          ),
        ],
      ],
    );
  }
}

class _GovernorateTextField extends ConsumerWidget {
  final String? value;
  final ValueChanged<String> onChanged;

  const _GovernorateTextField({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return TextFormField(
      initialValue: value,
      decoration: CheckoutTheme.fieldDecoration(label: s.governorateCity, icon: Icons.map_outlined),
      validator: (v) => (v == null || v.trim().isEmpty) ? s.requiredField : null,
      onChanged: onChanged,
    );
  }
}
