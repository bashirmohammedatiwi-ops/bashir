import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../advisor_profile.dart';
import 'advisor_style.dart';

/// «ملفكِ الجمالي»: ما تتذكره «ديما» عنكِ — على جهازكِ فقط، وتعدلينه متى شئتِ.
Future<void> showAdvisorProfileSheet(BuildContext context) {
  HapticFeedback.selectionClick();
  return showModalBottomSheet<void>(
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

  void _toggle(List<String> list, String id, void Function(List<String>) set) {
    HapticFeedback.selectionClick();
    final next = [...list];
    next.contains(id) ? next.remove(id) : next.add(id);
    setState(() => set(next));
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
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
                            Text('ملفكِ الجمالي', style: AdvisorStyle.text(size: 18, weight: FontWeight.w800, height: 1.3)),
                            Text('ديما تتذكره لترشّح لكِ بدقة — محفوظ على جهازكِ فقط',
                                style: AdvisorStyle.text(size: 12, color: AdvisorStyle.inkMuted, weight: FontWeight.w600, height: 1.4)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _Group(
                    title: 'نوع بشرتكِ',
                    options: ProfileOptions.skinTypes,
                    selected: [if (_p.skinType != null) _p.skinType!],
                    onTap: (id) {
                      HapticFeedback.selectionClick();
                      setState(() => _p = id == _p.skinType ? _p.copyWith(clearSkin: true) : _p.copyWith(skinType: id));
                    },
                  ),
                  _Group(
                    title: 'تهتمين بـ (البشرة)',
                    options: ProfileOptions.skinConcerns,
                    selected: _p.concerns,
                    onTap: (id) => _toggle(_p.concerns, id, (v) => _p = _p.copyWith(concerns: v)),
                  ),
                  _Group(
                    title: 'شعركِ',
                    options: ProfileOptions.hairConcerns,
                    selected: _p.hairConcerns,
                    onTap: (id) => _toggle(_p.hairConcerns, id, (v) => _p = _p.copyWith(hairConcerns: v)),
                  ),
                  _Group(
                    title: 'روائح تحبينها',
                    options: ProfileOptions.families,
                    selected: _p.families,
                    onTap: (id) => _toggle(_p.families, id, (v) => _p = _p.copyWith(families: v)),
                  ),
                  _Group(
                    title: 'عطوركِ',
                    options: ProfileOptions.genders,
                    selected: [if (_p.gender != null) _p.gender!],
                    onTap: (id) {
                      HapticFeedback.selectionClick();
                      setState(() => _p = id == _p.gender ? _p.copyWith(clearGender: true) : _p.copyWith(gender: id));
                    },
                  ),
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
                    onPressed: () => setState(() => _p = const AdvisorProfile()),
                    child: Text('مسح الكل', style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.2)),
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
                        Navigator.of(context).pop();
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 13),
                        child: Text('حفظ', style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
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

class _Group extends StatelessWidget {
  final String title;
  final List<ProfileOption> options;
  final List<String> selected;
  final ValueChanged<String> onTap;
  const _Group({required this.title, required this.options, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3)),
          const SizedBox(height: 9),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final o in options)
                GestureDetector(
                  onTap: () => onTap(o.id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected.contains(o.id) ? const Color(0xFFFBF0F8) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected.contains(o.id) ? BrandColors.rose : const Color(0xFFEBE2F0),
                        width: selected.contains(o.id) ? 1.5 : 1,
                      ),
                    ),
                    child: Text(
                      '${o.emoji}  ${o.label}',
                      style: AdvisorStyle.text(
                        size: 13,
                        weight: selected.contains(o.id) ? FontWeight.w800 : FontWeight.w600,
                        color: selected.contains(o.id) ? const Color(0xFF7A3FB8) : AdvisorStyle.ink,
                        height: 1.2,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
