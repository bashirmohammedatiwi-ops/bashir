import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/formatters.dart';
import '../advisor_controller.dart';
import '../advisor_profile.dart';
import '../advisor_strings.dart';
import 'advisor_routine_card.dart';
import 'advisor_style.dart';

/// «ملفكِ الجمالي»: ما تتذكره «ديما» عنكِ — على جهازكِ فقط، وتعدلينه متى شئتِ.
/// يعيد الملف بعد «حفظ» (أو null إن أُغلق بلا حفظ) لتطبّق الشاشة التغيير على المحادثة.
Future<AdvisorProfile?> showAdvisorProfileSheet(BuildContext context) {
  HapticFeedback.selectionClick();
  return showModalBottomSheet<AdvisorProfile>(
    context: context,
    showDragHandle: false,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _ProfileSheet(),
  );
}

class _ProfileSheet extends ConsumerStatefulWidget {
  const _ProfileSheet();

  @override
  ConsumerState<_ProfileSheet> createState() => _ProfileSheetState();
}

class _ProfileSheetState extends ConsumerState<_ProfileSheet> {
  late AdvisorProfile _p = ref.read(advisorProfileProvider);

  /// اختيار متعدد بحدّ أقصى (ما يعتمده السيرفر): بعد الحد لا يُضاف جديد — الإزالة متاحة دائماً.
  void _toggle(List<String> list, String id, int max, void Function(List<String>) set) {
    final next = [...list];
    if (next.contains(id)) {
      next.remove(id);
    } else {
      if (next.length >= max) {
        HapticFeedback.heavyImpact();
        return;
      }
      next.add(id);
    }
    HapticFeedback.selectionClick();
    setState(() => set(next));
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final saved = ref.watch(savedRoutinesProvider);
    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
      decoration: const BoxDecoration(
        color: Color(0xFFFFFBFD),
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFE6DCEC), borderRadius: BorderRadius.circular(4))),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(gradient: AdvisorStyle.gradient, borderRadius: BorderRadius.circular(16)),
                        alignment: Alignment.center,
                        child: const Icon(Icons.favorite_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.advisorProfileTitle, style: AdvisorStyle.text(size: 18, weight: FontWeight.w800, height: 1.3)),
                            Text(s.advisorProfileSubtitle,
                                style: AdvisorStyle.text(size: 12, color: AdvisorStyle.inkMuted, weight: FontWeight.w600, height: 1.4)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _Group(
                    title: s.advisorSkinType,
                    options: ProfileOptions.skinTypes,
                    selected: [if (_p.skinType != null) _p.skinType!],
                    onTap: (id) {
                      HapticFeedback.selectionClick();
                      setState(() => _p = id == _p.skinType ? _p.copyWith(clearSkin: true) : _p.copyWith(skinType: id));
                    },
                  ),
                  _Group(
                    title: s.advisorConcerns,
                    hint: s.advisorUpTo(ProfileOptions.maxConcerns),
                    options: ProfileOptions.skinConcerns,
                    selected: _p.concerns,
                    onTap: (id) => _toggle(_p.concerns, id, ProfileOptions.maxConcerns, (v) => _p = _p.copyWith(concerns: v)),
                  ),
                  _Group(
                    title: s.advisorHair,
                    hint: s.advisorUpTo(ProfileOptions.maxHairConcerns),
                    options: ProfileOptions.hairConcerns,
                    selected: _p.hairConcerns,
                    onTap: (id) => _toggle(_p.hairConcerns, id, ProfileOptions.maxHairConcerns, (v) => _p = _p.copyWith(hairConcerns: v)),
                  ),
                  _Group(
                    title: s.advisorScents,
                    hint: s.advisorUpTo(ProfileOptions.maxFamilies),
                    options: ProfileOptions.families,
                    selected: _p.families,
                    onTap: (id) => _toggle(_p.families, id, ProfileOptions.maxFamilies, (v) => _p = _p.copyWith(families: v)),
                  ),
                  _Group(
                    title: s.advisorPerfumes,
                    options: ProfileOptions.genders,
                    selected: [if (_p.gender != null) _p.gender!],
                    onTap: (id) {
                      HapticFeedback.selectionClick();
                      setState(() => _p = id == _p.gender ? _p.copyWith(clearGender: true) : _p.copyWith(gender: id));
                    },
                  ),
                  if (saved.isNotEmpty) _SavedRoutines(items: saved),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(18, 8, 18, 14 + bottom),
            child: Row(
              children: [
                if (!_p.isEmpty)
                  TextButton(
                    style: TextButton.styleFrom(minimumSize: const Size(44, 44)),
                    onPressed: () => setState(() => _p = const AdvisorProfile()),
                    child: Text(s.advisorClearAll, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.2)),
                  ),
                const Spacer(),
                DecoratedBox(
                  decoration: BoxDecoration(gradient: AdvisorStyle.gradient, borderRadius: BorderRadius.circular(16)),
                  child: Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        ref.read(advisorProfileProvider.notifier).set(_p);
                        Navigator.of(context).pop(_p);
                      },
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(minHeight: 46),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 13),
                          child: Text(s.advisorSave, style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Group extends ConsumerWidget {
  final String title;
  /// حدّ الاختيار («اختاري حتى 4») بجانب العنوان.
  final String? hint;
  final List<ProfileOption> options;
  final List<String> selected;
  final ValueChanged<String> onTap;
  const _Group({required this.title, this.hint, required this.options, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAr = ref.s.isAr;
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(title, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3)),
              if (hint != null)
                Text(hint!, style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3)),
            ],
          ),
          const SizedBox(height: 9),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final o in options) _OptionChip(option: o, isAr: isAr, selected: selected.contains(o.id), onTap: () => onTap(o.id)),
            ],
          ),
        ],
      ),
    );
  }
}

class _OptionChip extends StatelessWidget {
  final ProfileOption option;
  final bool isAr;
  final bool selected;
  final VoidCallback onTap;
  const _OptionChip({required this.option, required this.isAr, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final label = option.label(isAr);
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        // 44 للمس، والشكل الظاهر أنحف.
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Align(
            widthFactor: 1,
            heightFactor: 1,
            child: AnimatedContainer(
              duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: selected ? const Color(0xFFFBF0F8) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected ? BrandColors.rose : const Color(0xFFEBE2F0),
                  width: selected ? 1.5 : 1,
                ),
              ),
              child: Text(
                '${option.emoji}  $label',
                style: AdvisorStyle.text(
                  size: 13,
                  weight: selected ? FontWeight.w800 : FontWeight.w600,
                  color: selected ? AdvisorStyle.accentText : AdvisorStyle.ink,
                  height: 1.2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// «روتيناتي»: ما حفظته من المحادثات — يُفتح كاملاً ويُضاف للسلة من جديد.
class _SavedRoutines extends ConsumerWidget {
  final List<SavedRoutine> items;
  const _SavedRoutines({required this.items});

  void _open(BuildContext context, SavedRoutine r) {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.88),
        decoration: const BoxDecoration(
          color: Color(0xFFFFFBFD),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.only(top: 18, bottom: 18 + MediaQuery.paddingOf(ctx).bottom),
          child: AdvisorRoutineCard(routine: r.routine, animate: false, showActions: false),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(s.advisorMyRoutines, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3)),
        const SizedBox(height: 9),
        for (final r in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => _open(context, r),
                child: Container(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 8, 4, 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AdvisorStyle.glassBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: AdvisorStyle.tint, borderRadius: BorderRadius.circular(12)),
                        child: Text(r.routine.emoji, style: const TextStyle(fontSize: 19)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(r.routine.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, height: 1.3)),
                            Text(
                              '${r.routine.isLook ? s.advisorMatchingPieces(r.routine.steps.length) : s.stepsCount(r.routine.steps.length)}  •  ${formatPrice(r.routine.total)}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: s.delete,
                        constraints: const BoxConstraints.tightFor(width: 44, height: 44),
                        icon: const Icon(Icons.delete_outline_rounded, size: 20, color: AdvisorStyle.inkMuted),
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          ref.read(savedRoutinesProvider.notifier).remove(r.routine);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        const SizedBox(height: 10),
      ],
    );
  }
}
