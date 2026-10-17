import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/horizontal_product_list.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../worlds/world_theme.dart';
import 'beauty_providers.dart';
import 'beauty_widgets.dart';

typedef _Opt = ({String label, String emoji, Map<SkinType, int> score});

class _Q {
  final String title;
  final String hint;
  final List<_Opt> options;
  const _Q(this.title, this.hint, this.options);
}

const _questions = <_Q>[
  _Q('بعد غسل وجهكِ بساعة، شلون تحسين بشرتكِ؟', 'بدون أي كريم', [
    (label: 'مشدودة وجافة', emoji: '🏜️', score: {SkinType.dry: 3}),
    (label: 'لامعة بكل الوجه', emoji: '✨', score: {SkinType.oily: 3}),
    (label: 'لامعة بالجبهة والأنف فقط', emoji: '🌗', score: {SkinType.combination: 3}),
    (label: 'مرتاحة وطبيعية', emoji: '🌸', score: {SkinType.normal: 3}),
  ]),
  _Q('بنص النهار، شلون يبين وجهكِ؟', 'خصوصاً بدون مكياج', [
    (label: 'باهت أو فيه قشور', emoji: '🍂', score: {SkinType.dry: 2}),
    (label: 'لمعان واضح ودهون', emoji: '💧', score: {SkinType.oily: 2}),
    (label: 'لمعان بمنطقة T بس', emoji: '🎯', score: {SkinType.combination: 2}),
    (label: 'ما يتغيّر كثير', emoji: '👌', score: {SkinType.normal: 2}),
  ]),
  _Q('شلون المسام عندكِ؟', 'شوفيها بالمراية بضوء طبيعي', [
    (label: 'صغيرة وما تنشاف', emoji: '🔹', score: {SkinType.dry: 1, SkinType.normal: 1}),
    (label: 'واسعة بكل الوجه', emoji: '🔵', score: {SkinType.oily: 2}),
    (label: 'واسعة بالأنف والجبهة', emoji: '👃', score: {SkinType.combination: 2}),
    (label: 'متوسطة', emoji: '⚪', score: {SkinType.normal: 2}),
  ]),
  _Q('تتحسس بشرتكِ من المنتجات الجديدة؟', 'احمرار، حكة، أو حرقان', [
    (label: 'كثيراً — أغلب المنتجات', emoji: '🌿', score: {SkinType.sensitive: 4}),
    (label: 'أحياناً', emoji: '🤏', score: {SkinType.sensitive: 2}),
    (label: 'نادراً أو أبداً', emoji: '💪', score: {}),
  ]),
];

/// اختبار البشرة: 4 أسئلة + اختيار المشاكل → نوع البشرة وروتين الصباح والمساء المقترح.
class SkinQuizScreen extends ConsumerStatefulWidget {
  final bool showResult;
  const SkinQuizScreen({super.key, this.showResult = false});

  @override
  ConsumerState<SkinQuizScreen> createState() => _SkinQuizScreenState();
}

class _SkinQuizScreenState extends ConsumerState<SkinQuizScreen> {
  final _page = PageController();
  final _answers = <int, int>{};
  final _concerns = <String>{};
  int _step = 0;
  late bool _result = widget.showResult && ref.read(skinProfileProvider) != null;

  int get _total => _questions.length + 1;

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  void _go(int step) {
    setState(() => _step = step);
    _page.animateToPage(step, duration: const Duration(milliseconds: 380), curve: Curves.easeOutCubic);
  }

  void _answer(int q, int opt) {
    HapticFeedback.selectionClick();
    setState(() => _answers[q] = opt);
    Future.delayed(const Duration(milliseconds: 260), () {
      if (mounted) _go(q + 1);
    });
  }

  void _finish() {
    final score = {for (final t in SkinType.values) t: 0};
    _answers.forEach((q, o) {
      _questions[q].options[o].score.forEach((t, v) => score[t] = score[t]! + v);
    });
    final sensitive = score[SkinType.sensitive]! >= 4;
    final base = (score.entries.where((e) => e.key != SkinType.sensitive).toList()
          ..sort((a, b) => b.value.compareTo(a.value)))
        .first
        .key;
    HapticFeedback.mediumImpact();
    ref.read(skinProfileProvider.notifier).save(SkinProfile(
          skinType: sensitive ? SkinType.sensitive : base,
          concerns: _concerns.toList(),
          takenAt: DateTime.now(),
        ));
    setState(() => _result = true);
  }

  void _restart() {
    setState(() {
      _result = false;
      _answers.clear();
      _concerns.clear();
      _step = 0;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_page.hasClients) _page.jumpToPage(0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Scaffold(
      backgroundColor: t.canvas,
      appBar: AppBar(
        backgroundColor: t.canvas,
        surfaceTintColor: Colors.transparent,
        title: Text(_result ? 'نتيجة اختبار البشرة' : 'اختبار البشرة', style: AppText.title3.copyWith(color: t.ink)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (!_result && _step > 0) {
              _go(_step - 1);
            } else {
              context.canPop() ? context.pop() : context.go('/');
            }
          },
        ),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 320),
        child: _result ? _QuizResult(key: const ValueKey('r'), onRestart: _restart) : _quiz(t),
      ),
    );
  }

  Widget _quiz(WorldThemePalette t) {
    return Column(
      key: const ValueKey('q'),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
          child: Row(
            children: [
              for (var i = 0; i < _total; i++)
                Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      color: i <= _step ? t.accent : t.hairline,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: Text('سؤال ${_step + 1} من $_total', style: AppText.caption.copyWith(color: t.inkMuted)),
          ),
        ),
        Expanded(
          child: PageView(
            controller: _page,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              for (var q = 0; q < _questions.length; q++) _questionPage(t, q),
              _concernsPage(t),
            ],
          ),
        ),
      ],
    );
  }

  Widget _questionPage(WorldThemePalette t, int q) {
    final question = _questions[q];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
      children: [
        Text(question.title, style: AppText.title1.copyWith(color: t.ink)),
        const SizedBox(height: 4),
        Text(question.hint, style: AppText.bodySmall.copyWith(color: t.inkMuted)),
        const SizedBox(height: 20),
        for (var o = 0; o < question.options.length; o++)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _OptionTile(
              emoji: question.options[o].emoji,
              label: question.options[o].label,
              selected: _answers[q] == o,
              onTap: () => _answer(q, o),
            ),
          ),
      ],
    );
  }

  Widget _concernsPage(WorldThemePalette t) {
    final concerns = ref.watch(skinConcernsListProvider).valueOrNull ?? const <SkinConcern>[];
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
            children: [
              Text('شنو المشاكل اللي تزعجكِ؟', style: AppText.title1.copyWith(color: t.ink)),
              const SizedBox(height: 4),
              Text('اختاري لحد 3 — أو تخطّي إذا ما عندكِ', style: AppText.bodySmall.copyWith(color: t.inkMuted)),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, c) {
                  final w = (c.maxWidth - 12) / 2;
                  return Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (final x in concerns)
                        SkinConcernCard(
                          concern: x,
                          width: w,
                          height: w * 0.78,
                          selected: _concerns.contains(x.slug),
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              if (_concerns.contains(x.slug)) {
                                _concerns.remove(x.slug);
                              } else if (_concerns.length < 3) {
                                _concerns.add(x.slug);
                              }
                            });
                          },
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: FilledButton(
              onPressed: _answers.length < _questions.length ? null : _finish,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
                backgroundColor: t.accentDark,
                shape: const StadiumBorder(),
              ),
              child: Text(_concerns.isEmpty ? 'شوفي النتيجة ✨' : 'شوفي النتيجة (${_concerns.length}) ✨',
                  style: AppText.title3.copyWith(color: Colors.white)),
            ),
          ),
        ),
      ],
    );
  }
}

class _OptionTile extends StatelessWidget {
  final String emoji;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _OptionTile({required this.emoji, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: selected ? t.accentLight : t.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 2 : 1),
          boxShadow: selected ? [BoxShadow(color: t.accent.withValues(alpha: 0.18), blurRadius: 12, offset: const Offset(0, 4))] : null,
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: AppText.title3.copyWith(color: t.ink))),
            AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: selected ? 1 : 0,
              child: Icon(Icons.check_circle_rounded, color: t.accent),
            ),
          ],
        ),
      ),
    );
  }
}

/// النتيجة: نوع البشرة، الروتين الصباحي والمسائي المقترح، ومنتجات كل مشكلة.
class _QuizResult extends ConsumerWidget {
  final VoidCallback onRestart;
  const _QuizResult({super.key, required this.onRestart});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final profile = ref.watch(skinProfileProvider);
    if (profile == null) return const SizedBox.shrink();
    final match = ref.watch(skinMatchProvider);
    final type = profile.skinType;
    return ListView(
      padding: const EdgeInsets.only(bottom: 40),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(26),
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [Color.lerp(t.accent, Colors.white, 0.1)!, t.accentDark],
              ),
              boxShadow: [BoxShadow(color: t.accent.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8), spreadRadius: -6)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(type.emoji, style: const TextStyle(fontSize: 44)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('نوع بشرتكِ', style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.85))),
                          Text('بشرة ${type.labelAr}', style: AppText.display.copyWith(color: Colors.white)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(type.blurbAr, style: AppText.body.copyWith(color: Colors.white, height: 1.55)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: onRestart,
                      style: TextButton.styleFrom(foregroundColor: Colors.white, backgroundColor: Colors.white.withValues(alpha: 0.18), shape: const StadiumBorder()),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('أعيدي الاختبار'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        match.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: Column(children: [ShimmerBox(height: 220, radius: 24), SizedBox(height: 12), ShimmerBox(height: 220, radius: 24)]),
          ),
          error: (e, _) => ErrorView(message: friendlyError(e), onRetry: () => ref.invalidate(skinMatchProvider)),
          data: (m) {
            if (m == null) return const SizedBox.shrink();
            final both = [m.morning, m.evening].whereType<BeautyPackage>().toList();
            final total = both.fold<int>(0, (s, p) => s + p.price);
            final saving = both.fold<int>(0, (s, p) => s + p.saving);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (both.isNotEmpty) ...[
                  const AppSectionTitle(title: 'روتينكِ المقترح', subtitle: 'مختار حسب نوع بشرتكِ ومشاكلها'),
                  for (final p in both)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: LayoutBuilder(builder: (context, c) => RoutineCard(pack: p, width: c.maxWidth, height: 222)),
                    ),
                  if (both.length == 2)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: FilledButton(
                        onPressed: () async {
                          for (final p in both) {
                            final full = await ref.read(beautyPackageProvider(p.routeId).future);
                            if (!context.mounted) return;
                            final ok = await addPackageToCart(context, ref, full);
                            if (!ok) return;
                          }
                        },
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(54),
                          backgroundColor: t.accentDark,
                          shape: const StadiumBorder(),
                        ),
                        child: Text(
                          saving > 0
                              ? 'أضيفي الروتينين • ${formatPrice(total)} (وفّري ${formatPrice(saving)})'
                              : 'أضيفي الروتينين • ${formatPrice(total)}',
                          style: AppText.label.copyWith(color: Colors.white),
                        ),
                      ),
                    ),
                ] else
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: EmptyState(icon: Icons.spa_outlined, title: 'نجهّز روتيناً لنوع بشرتكِ', subtitle: 'شوفي منتجات مشاكلكِ تحت 👇'),
                  ),
                for (final x in m.concerns)
                  if (x.products.isNotEmpty) ...[
                    AppSectionTitle(
                      title: 'لـ${x.concern.name} ${x.concern.icon ?? ''}'.trim(),
                      actionLabel: 'الدليل',
                      onAction: () => context.push('/skin-guide/${Uri.encodeComponent(x.concern.slug)}'),
                    ),
                    HorizontalProductList(products: x.products),
                  ],
              ],
            );
          },
        ),
      ],
    );
  }
}
