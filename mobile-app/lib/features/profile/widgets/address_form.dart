import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/friendly_error.dart';
import '../../../core/utils/json.dart';
import '../../../core/utils/phone_util.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/address.dart';
import '../../auth/auth_provider.dart';
import '../profile_providers.dart';
import 'account_strings.dart';
import 'account_theme.dart';
import 'profile_ui.dart';
import '../../../features/worlds/world_theme.dart';

/// نموذج إضافة/تعديل عنوان داخل الورقة السفلية الموحّدة. يعيد Address عند الحفظ.
///
/// مع [onSubmit] تبقى الورقة مفتوحة حتى ينجح الحفظ فعلاً (الزر يدور أثناءه)، وإن
/// فشل يظهر السبب أعلى النموذج وما كتبته باقٍ كما هو. بدونه تُغلق الورقة فوراً
/// وتعيد العنوان ليحفظه المستدعي بنفسه (السلوك القديم).
Future<Address?> showAddressForm(
  BuildContext context, {
  Address? initial,
  Future<void> Function(Address address)? onSubmit,
}) {
  final s = ProviderScope.containerOf(
    context,
    listen: false,
  ).read(stringsProvider);
  final formKey = GlobalKey<_AddressFormState>();
  // لا يحتاج dispose: لا موارد فيه، والتذييل قد يبقى مرسوماً أثناء حركة الإغلاق.
  final saving = ValueNotifier<bool>(false);
  return showAppSheet<Address>(
    context: context,
    title: initial == null || initial.id.isEmpty ? s.newAddress : s.acctEditAddress,
    expand: true,
    builder: (_) => _AddressForm(
      key: formKey,
      initial: initial,
      onSubmit: onSubmit,
      saving: saving,
    ),
    footer: ValueListenableBuilder<bool>(
      valueListenable: saving,
      builder: (_, busy, __) => ProfilePrimaryButton(
        label: s.acctSaveAddress,
        icon: Icons.check_rounded,
        loading: busy,
        onPressed: busy ? null : () => formKey.currentState?._save(),
      ),
    ),
  );
}

/// ما كتبته الزبونة ثم أغلقت الورقة بالسحب أو زر الإغلاق دون حفظ — يعود عند
/// فتح النموذج نفسه خلال دقائق، فلا يضيع عنوان كامل بلمسة خاطئة.
class _AddressDraft {
  final String key;
  final DateTime at;
  final String name, phone, street, house, notes;
  final String? governorate, area;
  final bool isDefault;

  const _AddressDraft({
    required this.key,
    required this.at,
    required this.name,
    required this.phone,
    required this.street,
    required this.house,
    required this.notes,
    required this.governorate,
    required this.area,
    required this.isDefault,
  });

  static const ttl = Duration(minutes: 30);
  bool get fresh => DateTime.now().difference(at) < ttl;
}

_AddressDraft? _lastDraft;

class _AddressForm extends ConsumerStatefulWidget {
  final Address? initial;
  final Future<void> Function(Address address)? onSubmit;
  final ValueNotifier<bool> saving;

  const _AddressForm({
    super.key,
    this.initial,
    this.onSubmit,
    required this.saving,
  });

  @override
  ConsumerState<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends ConsumerState<_AddressForm> {
  final _formKey = GlobalKey<FormState>();
  final _scroll = ScrollController();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _street;
  late final TextEditingController _house;
  late final TextEditingController _notes;
  String? _governorate;
  String? _area;
  bool _isDefault = false;

  /// سبب فشل الحفظ من السيرفر — يظهر أعلى النموذج حتى تعدّل وتعيد المحاولة.
  String? _submitError;
  bool _draftRestored = false;

  /// القيم عند الفتح — أي اختلاف عنها «تعديل لم يُحفظ».
  late String _pristine;
  bool _dirty = false;

  /// خرجت بحفظ أو اختارت «تجاهل» — لا نحتفظ بمسودة.
  bool _closedOnPurpose = false;

  String get _draftKey => widget.initial?.id ?? '';

  @override
  void initState() {
    super.initState();
    final a = widget.initial;
    final isNew = a == null;
    final user = isNew ? ref.read(authProvider).user : null;
    // عنوان جديد: أغلب الزبونات يشحنّ لأنفسهن — الاسم والرقم جاهزان.
    _name = TextEditingController(text: a?.fullName ?? user?.name ?? '');
    _phone = TextEditingController(text: formatPhoneLocal(a?.phone ?? user?.phone));
    _street = TextEditingController(text: a?.street ?? '');
    _house = TextEditingController(text: a?.house ?? '');
    _notes = TextEditingController(text: a?.notes ?? '');
    _governorate = a?.governorate;
    _area = a?.area;
    // أول عنوان يصبح الافتراضي تلقائياً.
    _isDefault = a?.isDefault ?? (ref.read(addressesProvider).valueOrNull?.isEmpty ?? true);
    _pristine = _signature();

    final draft = _lastDraft;
    if (draft != null && draft.key == _draftKey && draft.fresh) {
      _name.text = draft.name;
      _phone.text = draft.phone;
      _street.text = draft.street;
      _house.text = draft.house;
      _notes.text = draft.notes;
      _governorate = draft.governorate;
      _area = draft.area;
      _isDefault = draft.isDefault;
      _draftRestored = true;
    }
    _lastDraft = null;
    _dirty = _signature() != _pristine;

    for (final c in [_name, _phone, _street, _house, _notes]) {
      c.addListener(_syncDirty);
    }
  }

  @override
  void dispose() {
    if (_dirty && !_closedOnPurpose) {
      _lastDraft = _AddressDraft(
        key: _draftKey,
        at: DateTime.now(),
        name: _name.text,
        phone: _phone.text,
        street: _street.text,
        house: _house.text,
        notes: _notes.text,
        governorate: _governorate,
        area: _area,
        isDefault: _isDefault,
      );
    }
    _scroll.dispose();
    _name.dispose();
    _phone.dispose();
    _street.dispose();
    _house.dispose();
    _notes.dispose();
    super.dispose();
  }

  String _signature() => [
        _name.text.trim(),
        _phone.text.trim(),
        _street.text.trim(),
        _house.text.trim(),
        _notes.text.trim(),
        _governorate ?? '',
        _area ?? '',
        _isDefault,
      ].join('\u0001');

  void _syncDirty() {
    final dirty = _signature() != _pristine;
    if (dirty != _dirty && mounted) setState(() => _dirty = dirty);
  }

  AppStrings get _s => ref.watch(stringsProvider);

  Future<void> _confirmDiscard() async {
    if (widget.saving.value) return;
    final s = ref.read(stringsProvider);
    final discard = await showProfileConfirmDialog(
      context,
      title: s.acctDiscardTitle,
      body: s.acctDiscardBody,
      confirmLabel: s.acctDiscard,
      cancelLabel: s.acctKeepEditing,
    );
    if (!discard || !mounted) return;
    _closedOnPurpose = true;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final zones = ref.watch(shippingZonesProvider);
    final s = _s;
    final t = context.worldTheme;

    return PopScope(
      // رجوع النظام أو لمسة خارج الورقة مع تعديلات: نسأل قبل أن يضيع ما كُتب.
      canPop: !_dirty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmDiscard();
      },
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          controller: _scroll,
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
              if (_submitError != null) ...[
                ProfileInfoBanner(
                  icon: Icons.error_outline_rounded,
                  text: _submitError!,
                  danger: true,
                ),
                const SizedBox(height: 14),
              ] else if (_draftRestored) ...[
                ProfileInfoBanner(
                  icon: Icons.history_rounded,
                  text: s.acctDraftRestored,
                ),
                const SizedBox(height: 14),
              ],
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
                textDirection: TextDirection.ltr,
                // أرقام عربية/فارسية تتحول لاتينية أثناء الكتابة.
                inputFormatters: phoneInputFormatters,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumber],
                decoration: profileFieldDecoration(context, hint: '07XXXXXXXXX'),
                // نفس قاعدة السيرفر (رقم عراقي) — كان يقبل أي 7 أحرف ثم يرفضه الحفظ.
                validator: (v) => validateIraqiPhone(v, lang: s.lang),
              ),
              const SizedBox(height: 22),
              ProfileSectionTitle(
                s.acctLocation,
                icon: Icons.location_on_outlined,
              ),
              zones.when(
                skipLoadingOnRefresh: false,
                loading: () => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: LinearProgressIndicator(
                    color: t.accent,
                    backgroundColor: t.accentSoft,
                    borderRadius: BorderRadius.circular(AppCorners.pill),
                  ),
                ),
                error: (_, __) => _governorateText(),
                data: (list) => list.isEmpty ? _governorateText(failed: false) : _governorateDropdown(list),
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
                  onChanged: (v) {
                    setState(() => _isDefault = v);
                    _syncDirty();
                  },
                ),
              ),
            ],
          ),
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
    final areas = asList(selectedZone['areas'])
        .map((a) => asString(asMap(a)['name']))
        .where((e) => e.isNotEmpty)
        .toList();

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
            for (final g in govs)
              DropdownMenuItem(value: g, child: Text(_s.governorateName(g))),
          ],
          hint: Text(_s.acctChooseGovernorate),
          validator: (v) =>
              (v == null || v.isEmpty) ? _s.acctChooseGovernorate : null,
          onChanged: (v) {
            // منطقة محافظة أخرى لا تبقى مع المحافظة الجديدة.
            setState(() {
              _governorate = v;
              _area = null;
            });
            _syncDirty();
          },
        ),
        if (areas.isNotEmpty) ...[
          const SizedBox(height: 14),
          ProfileFieldLabel(_s.acctArea),
          DropdownButtonFormField<String>(
            // مفتاح المحافظة: تغييرها يعيد بناء القائمة بلا اختيار قديم عالق.
            key: ValueKey('area-$_governorate'),
            initialValue: areas.contains(_area) ? _area : null,
            isExpanded: true,
            hint: Text(_s.acctChooseArea),
            decoration: profileFieldDecoration(context),
            borderRadius: BorderRadius.circular(AppCorners.md),
            items: [
              for (final a in areas) DropdownMenuItem(value: a, child: Text(a)),
            ],
            // أجور الشحن بالمنطقة: لا حفظ بلا منطقة حين تكون للمحافظة مناطق.
            validator: (v) => (v == null || v.isEmpty) ? _s.acctChooseArea : null,
            onChanged: (v) {
              setState(() => _area = v);
              _syncDirty();
            },
          ),
        ],
      ],
    );
  }

  /// تعذّر جلب المحافظات: سطر يشرح مع «إعادة المحاولة» لقائمة الاختيار، والكتابة
  /// اليدوية تحته كحلّ أخير.
  Widget _governorateText({bool failed = true}) {
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (failed) ...[
          Container(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 4, 4, 4),
            decoration: BoxDecoration(
              color: t.accentLight,
              borderRadius: BorderRadius.circular(AppCorners.md),
              border: Border.all(color: t.accentSoft),
            ),
            child: Row(
              children: [
                Icon(Icons.cloud_off_rounded, size: 18, color: t.accentDark),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _s.acctZonesLoadFailed,
                    style: AppText.caption.copyWith(color: t.ink),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    retryShippingZones(ref);
                  },
                  style: TextButton.styleFrom(
                    minimumSize: const Size(0, kMinTapTarget),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: const StadiumBorder(),
                  ),
                  child: Text(
                    _s.retryAction,
                    style: AppText.label.copyWith(color: t.accentDark),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        ProfileFieldLabel(_s.acctGovernorateCity),
        TextFormField(
          initialValue: _governorate,
          decoration: profileFieldDecoration(context),
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? _s.acctRequired : null,
          onChanged: (v) {
            _governorate = v.trim();
            _area = null;
            _syncDirty();
          },
        ),
      ],
    );
  }

  Future<void> _save() async {
    if (widget.saving.value) return;
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.lightImpact();
      return;
    }
    final gov = _governorate?.trim();
    final area = _area?.trim();
    final city = area?.isNotEmpty == true ? area! : (gov ?? '');
    String? opt(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();
    final address = Address(
      id: widget.initial?.id ?? '',
      fullName: _name.text.trim(),
      phone: normalizePhone(_phone.text.trim()),
      city: city,
      governorate: gov?.isNotEmpty == true ? gov : null,
      area: area?.isNotEmpty == true ? area : null,
      street: opt(_street),
      house: opt(_house),
      notes: opt(_notes),
      landmark: widget.initial?.landmark,
      isDefault: _isDefault,
    );

    final submit = widget.onSubmit;
    if (submit == null) {
      _closedOnPurpose = true;
      Navigator.pop(context, address);
      return;
    }

    widget.saving.value = true;
    setState(() => _submitError = null);
    try {
      await submit(address);
      if (!mounted) return;
      _closedOnPurpose = true;
      HapticFeedback.mediumImpact();
      Navigator.pop(context, address);
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitError = ref.friendly(e));
      // السبب أعلى النموذج — نصعد إليه حتى يُرى.
      if (_scroll.hasClients) {
        if (MediaQuery.disableAnimationsOf(context)) {
          _scroll.jumpTo(0);
        } else {
          _scroll.animateTo(
            0,
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
          );
        }
      }
    } finally {
      widget.saving.value = false;
    }
  }
}
