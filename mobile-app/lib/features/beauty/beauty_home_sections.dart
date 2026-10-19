import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/models/home_section.dart';
import '../home/widgets/home_section_shell.dart';
import '../worlds/world_theme.dart';
import 'beauty_providers.dart';
import 'beauty_strings.dart';
import 'beauty_widgets.dart';

// ─── دليل البشرة ─────────────────────────────────────────────────────────────

/// «دليل البشرة» في الرئيسية: بطاقات المشاكل + دعوة لاختبار البشرة.
/// الشكل من لوحة التحكم: cards | grid | circles | chips.
class SkinGuideHomeSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;
  const SkinGuideHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final concerns = section.concerns;
    if (concerns.isEmpty) return const SizedBox.shrink();
    final display = section.display ?? section.layout ?? 'cards';
    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: ref.watch(stringsProvider).beautyFullGuide,
      onAction: () => context.push('/skin-guide'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: SkinQuizBanner(compact: true),
          ),
          switch (display) {
            'grid' => _ConcernGrid(concerns: concerns),
            'circles' => _ConcernCircles(concerns: concerns),
            'chips' => _ConcernChips(concerns: concerns),
            _ => SizedBox(
                height: 196,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  itemCount: concerns.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, i) => SkinConcernCard(concern: concerns[i], width: 146, height: 186),
                ),
              ),
          },
        ],
      ),
    );
  }
}

class _ConcernGrid extends StatelessWidget {
  final List<SkinConcern> concerns;
  const _ConcernGrid({required this.concerns});

  @override
  Widget build(BuildContext context) {
    final list = concerns.take(6).toList();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: LayoutBuilder(
        builder: (context, c) {
          final w = (c.maxWidth - 12) / 2;
          return Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [for (final x in list) SkinConcernCard(concern: x, width: w, height: w * 0.82)],
          );
        },
      ),
    );
  }
}

class _ConcernCircles extends StatelessWidget {
  final List<SkinConcern> concerns;
  const _ConcernCircles({required this.concerns});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, i) {
          final c = concerns[i];
          final color = parseHex(c.color) ?? t.accent;
          return AppTap(
            onTap: () => openConcern(context, c),
            radius: BorderRadius.circular(AppCorners.md),
            haptic: false,
            child: SizedBox(
              width: 76,
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [color, Color.lerp(color, Colors.white, 0.45)!]),
                    ),
                    child: Container(
                      decoration: BoxDecoration(shape: BoxShape.circle, color: Color.lerp(color, Colors.white, 0.85)),
                      clipBehavior: Clip.antiAlias,
                      child: c.imageUrl != null
                          ? AppNetworkImage(url: c.imageUrl!, width: 66, fit: BoxFit.cover)
                          : Center(child: Text(c.icon ?? '✨', style: const TextStyle(fontSize: 28))),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(c.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: AppText.micro.copyWith(color: t.ink, fontSize: 12)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ConcernChips extends StatelessWidget {
  final List<SkinConcern> concerns;
  const _ConcernChips({required this.concerns});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final c = concerns[i];
          final color = parseHex(c.color) ?? t.accent;
          return AppTap(
            onTap: () => openConcern(context, c),
            radius: BorderRadius.circular(AppCorners.pill),
            haptic: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Color.lerp(color, Colors.white, 0.86),
                borderRadius: BorderRadius.circular(AppCorners.pill),
                border: Border.all(color: color.withValues(alpha: 0.35)),
              ),
              child: Text('${c.icon ?? ''} ${c.name}'.trim(),
                  style: AppText.label.copyWith(color: Color.lerp(color, Colors.black, 0.35))),
            ),
          );
        },
      ),
    );
  }
}

/// دعوة اختبار البشرة — أو نتيجتها إن أجرته («بشرتكِ دهنية • روتينكِ جاهز»).
class SkinQuizBanner extends ConsumerWidget {
  final bool compact;
  const SkinQuizBanner({super.key, this.compact = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final profile = ref.watch(skinProfileProvider);
    final title = profile == null ? s.beautyQuizBannerTitle : s.beautyQuizBannerResult(profile.skinType);
    final sub = profile == null ? s.beautyQuizBannerSubtitle : s.beautyQuizBannerResultSubtitle;
    final radius = BorderRadius.circular(AppCorners.md + 2);
    return AppTap(
      onTap: () => context.push(profile == null ? '/skin-quiz' : '/skin-quiz?result=1'),
      radius: radius,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 14, vertical: compact ? 10 : 14),
        decoration: BoxDecoration(
          borderRadius: radius,
          gradient: LinearGradient(
            begin: AlignmentDirectional.centerStart,
            end: AlignmentDirectional.centerEnd,
            colors: [t.accentDark, Color.lerp(t.accent, Colors.white, 0.1)!],
          ),
          boxShadow: [BoxShadow(color: t.accent.withValues(alpha: 0.28), blurRadius: 14, offset: const Offset(0, 6), spreadRadius: -4)],
        ),
        child: Row(
          children: [
            Container(
              width: compact ? 38 : 46,
              height: compact ? 38 : 46,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
              alignment: Alignment.center,
              child: ExcludeSemantics(child: Text(profile == null ? '🔍' : '✨', style: TextStyle(fontSize: compact ? 18 : 22))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppText.title3.copyWith(color: Colors.white)),
                  Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.88))),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppCorners.pill)),
              child: Text(profile == null ? s.beautyQuizStart : s.beautyMyRoutine, style: AppText.label.copyWith(color: t.accentDark)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── روتين البشرة ────────────────────────────────────────────────────────────

/// «روتين البشرة» في الرئيسية: تبديل صباح/مساء + بطاقات الروتين بخطواتها.
class RoutinesHomeSection extends ConsumerStatefulWidget {
  final HomeSection section;
  final bool compactTop;
  const RoutinesHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  ConsumerState<RoutinesHomeSection> createState() => _RoutinesHomeSectionState();
}

class _RoutinesHomeSectionState extends ConsumerState<RoutinesHomeSection> {
  // الافتراضي حسب الوقت: قبل الثالثة عصراً صباحي.
  late bool _evening = DateTime.now().hour >= 15;

  @override
  Widget build(BuildContext context) {
    final all = widget.section.beautyPackages.where((p) => p.isRoutine).toList();
    if (all.isEmpty) return const SizedBox.shrink();
    final morning = all.where((p) => p.isMorning).toList();
    final evening = all.where((p) => p.isEvening).toList();
    final both = morning.isNotEmpty && evening.isNotEmpty;
    final eveningOn = both ? _evening : evening.isNotEmpty;
    final list = both ? (eveningOn ? evening : morning) : all;
    final stacked = widget.section.display == 'stacked';
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return HomeSectionShell(
      section: widget.section,
      compactTop: widget.compactTop,
      actionLabel: ref.watch(stringsProvider).beautyAllRoutines,
      onAction: () => context.push('/packages?tab=routines'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (both)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: DayNightToggle(evening: eveningOn, onChanged: (v) => setState(() => _evening = v)),
            ),
          AnimatedSwitcher(
            duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 280),
            switchInCurve: Curves.easeOutCubic,
            child: stacked
                ? Padding(
                    key: ValueKey('s$eveningOn'),
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: LayoutBuilder(
                      builder: (context, c) => Column(
                        children: [
                          for (final p in list.take(2))
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: RoutineCard(pack: p, width: c.maxWidth, height: 220),
                            ),
                        ],
                      ),
                    ),
                  )
                : LayoutBuilder(
                    key: ValueKey('c$eveningOn'),
                    builder: (context, c) {
                      final single = list.length == 1;
                      final w = single ? c.maxWidth - 32 : (c.maxWidth * 0.8).clamp(260.0, 340.0);
                      return SizedBox(
                        height: 238,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          physics: single ? const NeverScrollableScrollPhysics() : const BouncingScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                          itemCount: list.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) => RoutineCard(pack: list[i], width: w, height: 228),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

/// تبديل ☀️ الصباح / 🌙 المساء.
class DayNightToggle extends ConsumerWidget {
  final bool evening;
  final ValueChanged<bool> onChanged;
  const DayNightToggle({super.key, required this.evening, required this.onChanged});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    Widget tab(String label, String icon, bool on, List<Color> colors, VoidCallback tap) => Expanded(
          child: AppTap(
            onTap: tap,
            selected: on,
            radius: BorderRadius.circular(AppCorners.pill),
            child: AnimatedContainer(
              duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              height: kMinTapTarget,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppCorners.pill),
                gradient: on ? LinearGradient(colors: colors) : null,
                boxShadow: on ? [BoxShadow(color: colors.last.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))] : null,
              ),
              child: Text('$icon  $label',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.label.copyWith(color: on ? Colors.white : t.inkSoft, fontWeight: on ? FontWeight.w800 : FontWeight.w600)),
            ),
          ),
        );
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: Border.all(color: t.hairline),
      ),
      child: Row(
        children: [
          tab(s.beautyMorning, '☀️', !evening, RoutinePalette.morning.colors, () => onChanged(false)),
          tab(s.beautyEvening, '🌙', evening, RoutinePalette.evening.colors, () => onChanged(true)),
        ],
      ),
    );
  }
}

// ─── الباقات ─────────────────────────────────────────────────────────────────

/// «الباقات» في الرئيسية: carousel | hero | grid.
class PackagesShowcaseSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;
  const PackagesShowcaseSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = section.beautyPackages;
    if (list.isEmpty) return const SizedBox.shrink();
    final routinesOnly = list.every((p) => p.isRoutine);
    final display = section.display ?? section.layout ?? 'carousel';
    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: ref.watch(stringsProvider).beautyViewAll,
      onAction: () => context.push('/packages?tab=${routinesOnly ? 'routines' : 'bundles'}'),
      child: LayoutBuilder(
        builder: (context, c) {
          final full = c.maxWidth - 32;
          if (display == 'grid') {
            final w = (full - 12) / 2;
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [for (final p in list.take(4)) BeautyPackageCard(pack: p, width: w, height: w * 1.28)],
              ),
            );
          }
          final hero = display == 'hero' || list.length == 1;
          final rest = hero ? list.skip(1).toList() : list;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (hero)
                Padding(
                  padding: EdgeInsets.fromLTRB(16, 0, 16, rest.isEmpty ? 8 : 14),
                  child: list.first.isRoutine
                      ? RoutineCard(pack: list.first, width: full, height: 230)
                      : BeautyPackageCard(pack: list.first, width: full, height: full * 0.92),
                ),
              if (rest.isNotEmpty)
                SizedBox(
                  height: 292,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    itemCount: rest.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, i) => BeautyPackageCard(pack: rest[i], width: 226, height: 280),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

// ─── روتينكِ اليوم (بعد اختبار البشرة) ────────────────────────────────────────

/// لمن أجرت اختبار البشرة: روتين الوقت الحالي (صباحاً/مساءً) المقترح لبشرتها.
class HomeMyRoutineCard extends ConsumerWidget {
  const HomeMyRoutineCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(skinProfileProvider);
    if (profile == null) return const SizedBox.shrink();
    final match = ref.watch(skinMatchProvider).valueOrNull;
    if (match == null) return const SizedBox.shrink();
    final evening = DateTime.now().hour >= 15;
    final pick = (evening ? match.evening : match.morning) ?? match.morning ?? match.evening;
    if (pick == null) return const SizedBox.shrink();
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 20, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pick.isEvening ? s.beautyRoutineTonight : s.beautyRoutineToday,
                      style: AppText.title2.copyWith(color: t.ink),
                    ),
                    Text(
                      s.beautyPickedForSkin(profile.skinType),
                      style: AppText.caption.copyWith(color: t.inkMuted),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => context.push('/skin-quiz?result=1'),
                style: TextButton.styleFrom(minimumSize: const Size(kMinTapTarget, kMinTapTarget)),
                child: Text(s.beautyFullRoutine, style: AppText.label.copyWith(color: t.accentDark)),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: LayoutBuilder(builder: (context, c) => RoutineCard(pack: pick, width: c.maxWidth, height: 214)),
        ),
      ],
    );
  }
}
