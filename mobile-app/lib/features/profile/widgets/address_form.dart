import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/json.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/address.dart';
import '../profile_providers.dart';
import 'account_strings.dart';
import 'account_theme.dart';
import 'profile_ui.dart';
import '../../../features/worlds/world_theme.dart';

/// نموذج إضافة/تعديل عنوان داخل الورقة السفلية الموحّدة. يعيد Address عند الحفظ.
Future<Address?> showAddressForm(BuildContext context, {Address? initial}) {
  final s = ProviderScope.containerOf(
    context,
    listen: false,
  ).read(stringsProvider);
  final formKey = GlobalKey<_AddressFormState>();
  return showAppSheet<Address>(
    context: context,
    title: initial == null ? s.newAddress : s.acctEditAddress,
    expand: true,
    builder: (_) => _AddressForm(key: formKey, initial: initial),
    footer: ProfilePrimaryButton(
      label: s.acctSaveAddress,
      icon: Icons.check_rounded,
      onPressed: () => formKey.currentState?._save(),
    ),
  );
}

class _AddressForm extends ConsumerStatefulWidget {
  final Address? initial;
  const _AddressForm({super.key, this.initial});
  @override
  ConsumerState<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends ConsumerState<_AddressForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _street;
  late final TextEditingController _house;
  late final TextEditingController _notes;
  String? _governorate;
  String? _area;
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final a = widget.initial;
    _name = TextEditingController(text: a?.fullName ?? '');
    _phone = TextEditingController(text: a?.phone ?? '');
    _street = TextEditingController(text: a?.street ?? '');
    _house = TextEditingController(text: a?.house ?? '');
    _notes = TextEditingController(text: a?.notes ?? '');
    _governorate = a?.governorate;
    _area = a?.area;
    _isDefault = a?.isDefault ?? false;
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _street.dispose();
    _house.dispose();
    _notes.dispose();
    super.dispose();
  }

  AppStrings get _s => ref.watch(stringsProvider);

  @override
  Widget build(BuildContext context) {
    final zones = ref.watch(shippingZonesProvider);
    final s = _s;
    final t = context.worldTheme;

    return Form(
      key: _formKey,
      child: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.fromLTRB(
          ProfileUi.hPad,
          8,
          ProfileUi.hPad,
          20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ProfileSectionTitle(
              s.acctRecipient,
              icon: Icons.person_outline_rounded,
            ),
            ProfileFieldLabel(s.fullName),
            TextFormField(
              controller: _name,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.name],
              decoration: profileFieldDecoration(context, hint: s.fullName),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? s.acctRequired : null,
            ),
            const SizedBox(height: 14),
            ProfileFieldLabel(s.phoneNumber),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.telephoneNumber],
              decoration: profileFieldDecoration(context, hint: '07XXXXXXXXX'),
              validator: (v) => (v == null || v.trim().length < 7)
                  ? s.acctInvalidPhone
                  : null,
            ),
            const SizedBox(height: 22),
            ProfileSectionTitle(
              s.acctLocation,
              icon: Icons.location_on_outlined,
            ),
            zones.when(
              loading: () => Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: LinearProgressIndicator(
                  color: t.accent,
                  backgroundColor: t.accentSoft,
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                ),
              ),
              error: (_, __) => _governorateText(),
              data: (list) => _governorateDropdown(list),
            ),
            const SizedBox(height: 14),
            ProfileFieldLabel(s.acctStreet),
            TextFormField(
              controller: _street,
              textInputAction: TextInputAction.next,
              decoration: profileFieldDecoration(context),
            ),
            const SizedBox(height: 14),
            ProfileFieldLabel(s.acctHouse),
            TextFormField(
              controller: _house,
              textInputAction: TextInputAction.next,
              decoration: profileFieldDecoration(context),
            ),
            const SizedBox(height: 14),
            ProfileFieldLabel(s.acctNotes, optional: true),
            TextFormField(
              controller: _notes,
              minLines: 1,
              maxLines: 3,
              textInputAction: TextInputAction.done,
              decoration: profileFieldDecoration(context),
            ),
            const SizedBox(height: 18),
            Container(
              decoration: BoxDecoration(
                color: _isDefault ? t.accentLight : t.surface,
                borderRadius: BorderRadius.circular(AppCorners.md),
                border: Border.all(
                  color: _isDefault ? t.accentSoft : t.hairline,
                ),
              ),
              child: SwitchListTile.adaptive(
                contentPadding: const EdgeInsetsDirectional.fromSTEB(
                  14,
                  4,
                  8,
                  4,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppCorners.md),
                ),
                value: _isDefault,
                secondary: AccountTheme.iconTile(
                  context,
                  Icons.home_outlined,
                  size: 36,
                ),
                title: Text(
                  s.setDefaultAddress,
                  style: AppText.title3.copyWith(
                    color: t.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: Text(
                  s.acctDefaultHint,
                  style: ProfileUi.captionStyle(context),
                ),
                onChanged: (v) => setState(() => _isDefault = v),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _governorateDropdown(List<Map<String, dynamic>> zones) {
    final govs = zones
        .map((z) => asString(z['governorate']))
        .where((e) => e.isNotEmpty)
        .toList();
    final selectedZone = zones.firstWhere(
      (z) => asString(z['governorate']) == _governorate,
      orElse: () => const {},
    );
    final areas = asList(
      selectedZone['areas'],
    ).map((a) => asString(a['name'])).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileFieldLabel(_s.acctGovernorate),
        DropdownButtonFormField<String>(
          initialValue: govs.contains(_governorate) ? _governorate : null,
          isExpanded: true,
          decoration: profileFieldDecoration(context),
          borderRadius: BorderRadius.circular(AppCorners.md),
          items: [
            for (final g in govs) DropdownMenuItem(value: g, child: Text(g)),
          ],
          hint: Text(_s.acctChooseGovernorate),
          validator: (v) =>
              (v == null || v.isEmpty) ? _s.acctChooseGovernorate : null,
          onChanged: (v) => setState(() {
            _governorate = v;
            _area = null;
          }),
        ),
        if (areas.isNotEmpty) ...[
          const SizedBox(height: 14),
          ProfileFieldLabel(_s.acctArea),
          DropdownButtonFormField<String>(
            initialValue: areas.contains(_area) ? _area : null,
            isExpanded: true,
            hint: Text(_s.acctChooseArea),
            decoration: profileFieldDecoration(context),
            borderRadius: BorderRadius.circular(AppCorners.md),
            items: [
              for (final a in areas) DropdownMenuItem(value: a, child: Text(a)),
            ],
            onChanged: (v) => setState(() => _area = v),
          ),
        ],
      ],
    );
  }

  Widget _governorateText() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileFieldLabel(_s.acctGovernorateCity),
        TextFormField(
          initialValue: _governorate,
          decoration: profileFieldDecoration(context),
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? _s.acctRequired : null,
          onChanged: (v) => _governorate = v,
        ),
      ],
    );
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final city = _area?.isNotEmpty == true ? _area! : (_governorate ?? '');
    final address = Address(
      id: widget.initial?.id ?? '',
      fullName: _name.text.trim(),
      phone: _phone.text.trim(),
      city: city,
      governorate: _governorate,
      area: _area,
      street: _street.text.trim().isEmpty ? null : _street.text.trim(),
      house: _house.text.trim().isEmpty ? null : _house.text.trim(),
      notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      isDefault: _isDefault,
    );
    Navigator.pop(context, address);
  }
}
