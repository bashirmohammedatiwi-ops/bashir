import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../beauty/beauty_home_sections.dart';
import '../beauty/beauty_providers.dart';
import '../beauty/beauty_strings.dart';
import '../beauty/beauty_widgets.dart';
import '../beauty/skin_guide_screen.dart';
import '../worlds/world_theme.dart';

enum _Tab { all, morning, evening, bundles, bridal }

/// «الباقات والروتين»: كل الباقات الصالحة للعالم الحالي، بتبويبات حسب النوع.
class PackagesScreen extends ConsumerStatefulWidget {
  /// routines | bundles | morning | evening | bridal
  final String? initialTab;
  const PackagesScreen({super.key, this.initialTab});

  @override
  ConsumerState<PackagesScreen> createState() => _PackagesScreenState();
}

class _PackagesScreenState extends ConsumerState<PackagesScreen> {
  late _Tab _tab = switch (widget.initialTab) {
    'routines' => DateTime.now().hour >= 15 ? _Tab.evening : _Tab.morning,
    'morning' => _Tab.morning,
    'evening' => _Tab.evening,
    'bundles' => _Tab.bundles,
    'bridal' => _Tab.bridal,
    _ => _Tab.all,
  };

  bool _match(BeautyPackage p, _Tab tab) => switch (tab) {
        _Tab.all => true,
        _Tab.morning => p.isMorning,
        _Tab.evening => p.isEvening,
        _Tab.bundles => !p.isRoutine && !p.isBridal,
        _Tab.bridal => p.isBridal,
      };

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final async = ref.watch(beautyPackagesProvider(''));
    final profile = ref.watch(skinProfileProvider);
    return Scaffold(
      backgroundColor: t.canvas,
      body: RefreshIndicator(
        color: t.accent,
        onRefresh: () => refreshBeautyCatalog(ref, kinds: const ['']),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            SliverToBoxAdapter(
              child: BeautyHeader(title: s.beautyPackagesTitle, subtitle: s.beautyPackagesSubtitle, emoji: '🎁'),
            ),
            ...async.when(
              loading: () => [
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList.separated(
                    itemCount: 3,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, __) => const ShimmerBox(height: 220, radius: 24),
                  ),
                ),
              ],
              error: (e, _) => [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorView.from(e, onRetry: () => ref.invalidate(beautyPackagesProvider)),
                ),
              ],
              data: (all) {
                // نوع بشرتها أولاً (إن أجرت الاختبار).
                final list = [...all];
                if (profile != null) {
                  final k = profile.skinType.key;
                  list.sort((a, b) => (b.skinTypes.contains(k) ? 1 : 0) - (a.skinTypes.contains(k) ? 1 : 0));
                }
                final tabs = [
                  for (final tab in _Tab.values)
                    if (tab == _Tab.all || list.any((p) => _match(p, tab))) tab,
                ];
                final tab = tabs.contains(_tab) ? _tab : _Tab.all;
                final shown = list.where((p) => _match(p, tab)).toList();
                if (all.isEmpty) {
                  return [
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyState(
                        icon: Icons.card_giftcard_rounded,
                        title: s.beautyNoPackagesTitle,
                        subtitle: s.beautyNoPackagesSubtitle,
                      ),
                    ),
                  ];
                }
                return [
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 66,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                        itemCount: tabs.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) => _TabChip(
                          label: _label(s, tabs[i]),
                          count: tabs[i] == _Tab.all ? list.length : list.where((p) => _match(p, tabs[i])).length,
                          on: tabs[i] == tab,
                          onTap: () => setState(() => _tab = tabs[i]),
                        ),
                      ),
                    ),
                  ),
                  if (profile != null && shown.any((p) => p.isRoutine))
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 2, 16, 6),
                        child: Text(
                          s.beautySortedForSkin(profile.skinType),
                          style: AppText.caption.copyWith(color: t.accentDark, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  if (profile == null && (tab == _Tab.morning || tab == _Tab.evening || tab == _Tab.all))
                    const SliverToBoxAdapter(
                      child: Padding(padding: EdgeInsets.fromLTRB(16, 4, 16, 6), child: SkinQuizBanner(compact: true)),
                    ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    sliver: SliverLayoutBuilder(
                      builder: (context, c) {
                        final w = c.crossAxisExtent;
                        final half = (w - 12) / 2;
                        // الروتين بعرض كامل، والباقات بطاقتان بالصف.
                        final rows = <Widget>[];
                        final bundles = <BeautyPackage>[];
                        void flush() {
                          for (var i = 0; i < bundles.length; i += 2) {
                            rows.add(Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  BeautyPackageCard(pack: bundles[i], width: half, height: half * 1.3),
                                  const SizedBox(width: 12),
                                  if (i + 1 < bundles.length)
                                    BeautyPackageCard(pack: bundles[i + 1], width: half, height: half * 1.3)
                                  else
                                    SizedBox(width: half),
                                ],
                              ),
                            ));
                          }
                          bundles.clear();
                        }

                        for (final p in shown) {
                          if (p.isRoutine) {
                            flush();
                            rows.add(Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: RoutineCard(pack: p, width: w, height: 222),
                            ));
                          } else {
                            bundles.add(p);
                          }
                        }
                        flush();
                        return SliverList.list(children: rows);
                      },
                    ),
                  ),
                ];
              },
            ),
            SliverToBoxAdapter(child: SizedBox(height: 32 + MediaQuery.paddingOf(context).bottom)),
          ],
        ),
      ),
    );
  }

  String _label(AppStrings s, _Tab t) => switch (t) {
        _Tab.all => s.beautyTabAll,
        _Tab.morning => s.beautyTabMorning,
        _Tab.evening => s.beautyTabEvening,
        _Tab.bundles => s.beautyTabBundles,
        _Tab.bridal => s.beautyTabBridal,
      };
}

class _TabChip extends StatelessWidget {
  final String label;
  final int count;
  final bool on;
  final VoidCallback onTap;
  const _TabChip({required this.label, required this.count, required this.on, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final radius = BorderRadius.circular(AppCorners.pill);
    return AppTap(
      onTap: onTap,
      selected: on,
      radius: radius,
      child: AnimatedContainer(
        duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 220),
        constraints: const BoxConstraints(minHeight: kMinTapTarget),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: on ? t.accentDark : t.surface,
          borderRadius: radius,
          border: Border.all(color: on ? Colors.transparent : t.hairline),
        ),
        child: Text('$label  $count', maxLines: 1, style: AppText.label.copyWith(color: on ? Colors.white : t.ink)),
      ),
    );
  }
}
