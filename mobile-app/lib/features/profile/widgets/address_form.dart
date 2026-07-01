import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/json.dart';
import '../../../data/models/address.dart';
import '../profile_providers.dart';

/// نموذج إضافة/تعديل عنوان داخل ورقة سفلية. يعيد Address عند الحفظ.
Future<Address?> showAddressForm(BuildContext context, {Address? initial}) {
  return showModalBottomSheet<Address>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _AddressForm(initial: initial),
    ),
  );
}

class _AddressForm extends ConsumerStatefulWidget {
  final Address? initial;
  const _AddressForm({this.initial});
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

  @override
  Widget build(BuildContext context) {
    final zones = ref.watch(shippingZonesProvider);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.initial == null ? 'عنوان جديد' : 'تعديل العنوان',
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'الاسم الكامل'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'رقم الهاتف'),
                  validator: (v) => (v == null || v.trim().length < 7) ? 'رقم غير صحيح' : null,
                ),
                const SizedBox(height: 12),
                zones.when(
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => _governorateText(),
                  data: (list) => _governorateDropdown(list),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _street,
                  decoration: const InputDecoration(labelText: 'الشارع / أقرب نقطة دالة'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _house,
                  decoration: const InputDecoration(labelText: 'رقم المنزل / الشقة'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _notes,
                  decoration: const InputDecoration(labelText: 'ملاحظات (اختياري)'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  activeThumbColor: AppColors.primary,
                  value: _isDefault,
                  title: const Text('تعيين كعنوان افتراضي'),
                  onChanged: (v) => setState(() => _isDefault = v),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(onPressed: _save, child: const Text('حفظ العنوان')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _governorateDropdown(List<Map<String, dynamic>> zones) {
    final govs = zones.map((z) => asString(z['governorate'])).where((e) => e.isNotEmpty).toList();
    final selectedZone = zones.firstWhere(
      (z) => asString(z['governorate']) == _governorate,
      orElse: () => const {},
    );
    final areas = asList(selectedZone['areas']).map((a) => asString(a['name'])).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          initialValue: govs.contains(_governorate) ? _governorate : null,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'المحافظة'),
          items: [for (final g in govs) DropdownMenuItem(value: g, child: Text(g))],
          validator: (v) => (v == null || v.isEmpty) ? 'اختر المحافظة' : null,
          onChanged: (v) => setState(() {
            _governorate = v;
            _area = null;
          }),
        ),
        if (areas.isNotEmpty) ...[
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: areas.contains(_area) ? _area : null,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'المنطقة'),
            items: [for (final a in areas) DropdownMenuItem(value: a, child: Text(a))],
            onChanged: (v) => setState(() => _area = v),
          ),
        ],
      ],
    );
  }

  Widget _governorateText() {
    return TextFormField(
      initialValue: _governorate,
      decoration: const InputDecoration(labelText: 'المحافظة / المدينة'),
      validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
      onChanged: (v) => _governorate = v,
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
