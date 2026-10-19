import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/horizontal_product_list.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/services/api_service.dart';
import '../worlds/world_theme.dart';
import 'beauty_providers.dart';
import 'beauty_strings.dart';
import 'beauty_widgets.dart';

typedef _Opt = ({String emoji, Map<SkinType, int> score});

/// درجات الخيارات ورموزها — بنفس ترتيب أسئلة [BeautyStringsX.beautyQuizQuestions] ونصوصها.
const _questions = <List<_Opt>>[
  [
    (emoji: '🏜️', score: {SkinType.dry: 3}),
    (emoji: '✨', score: {SkinType.oily: 3}),
    (emoji: '🌗', score: {SkinType.combination: 3}),
    (emoji: '🌸', score: {SkinType.normal: 3}),
  ],
  [
    (emoji: '🍂', score: {SkinType.dry: 2}),
    (emoji: '💧', score: {SkinType.oily: 2}),
    (emoji: '🎯', score: {SkinType.combination: 2}),
    (emoji: '👌', score: {SkinType.normal: 2}),
  ],
  [
    (emoji: '🔹', score: {SkinType.dry: 1, SkinType.normal: 1}),
    (emoji: '🔵', score: {SkinType.oily: 2}),
    (emoji: '👃', score: {SkinType.combination: 2}),
    (emoji: '⚪', score: {SkinType.normal: 2}),
  ],
  [
    (emoji: '🌿', score: {SkinType.sensitive: 4}),
    (emoji: '🤏', score: {SkinType.sensitive: 2}),
    (emoji: '💪', score: {}),
  ],
];

/// حد المشاكل المختارة في الخطوة الأخيرة.
const _maxConcerns = 3;

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
    if (!_page.hasClients) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _page.jumpToPage(step);
    } else {
      _page.animateToPage(step, duration: const Duration(milliseconds: 380), curve: Curves.easeOutCubic);
    }
  }

  /// رجوع خطوة داخل الاختبار، أو الخروج منه من السؤال الأول والنتيجة.
  void _back() {
    if (!_result && _step > 0) {
      _go(_step - 1);
    } else {
      context.canPop() ? context.pop() : context.go('/');
    }
  }

  void _answer(int q, int opt) {
    setState(() => _answers[q] = opt);
    Future.delayed(const Duration(milliseconds: 260), () {
      if (mounted) _go(q + 1);
    });
  }

  void _toggleConcern(String slug) {
    if (_concerns.contains(slug)) {
      HapticFeedback.selectionClick();
      setState(() => _concerns.remove(slug));
    } else if (_concerns.length < _maxConcerns) {
      HapticFeedback.selectionClick();
      setState(() => _concerns.add(slug));
    } else {
      // الرابعة: لا تُهمل بصمت — تنبيه واضح بما يلزم.
      HapticFeedback.heavyImpact();
      AppSnackbar.show(context, ref.read(stringsProvider).beautyQuizMaxConcerns);
    }
  }

  void _finish() {
    final score = {for (final t in SkinType.values) t: 0};
    _answers.forEach((q, o) {
      _questions[q][o].score.forEach((t, v) => score[t] = score[t]! + v);
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
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    // رجوع النظام وسحب iOS يرجعان سؤالاً واحداً — لا تضيع الإجابات.
    return PopScope(
      canPop: _result || _step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        backgroundColor: t.canvas,
        appBar: AppBar(
          backgroundColor: t.canvas,
          surfaceTintColor: Colors.transparent,
          title: Text(_result ? s.beautyQuizResultTitle : s.beautyQuizTitle, style: AppText.title3.copyWith(color: t.ink)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            tooltip: MaterialLocalizations.of(context).backButtonTooltip,
            onPressed: _back,
          ),
        ),
        body: AnimatedSwitcher(
          duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 320),
          child: _result ? _QuizResult(key: const ValueKey('r'), onRestart: _restart) : _quiz(s, t),
        ),
      ),
    );
  }

  Widget _quiz(AppStrings s, WorldThemePalette t) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final texts = s.beautyQuizQuestions;
    return Column(
      key: const ValueKey('q'),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
          child: Semantics(
            label: s.beautyQuizStep(_step + 1, _total),
            excludeSemantics: true,
            child: Row(
              children: [
                for (var i = 0; i < _total; i++)
                  Expanded(
                    child: AnimatedContainer(
                      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 300),
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
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: Text(s.beautyQuizStep(_step + 1, _total), style: AppText.caption.copyWith(color: t.inkMuted)),
          ),
        ),
        Expanded(
          child: PageView(
            controller: _page,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              for (var q = 0; q < _questions.length; q++) _questionPage(t, q, texts[q]),
              _concernsPage(s, t),
            ],
          ),
        ),
      ],
    );
  }

  Widget _questionPage(WorldThemePalette t, int q, BeautyQuizQuestion text) {
    final options = _questions[q];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
      children: [
        Semantics(header: true, child: Text(text.title, style: AppText.title1.copyWith(color: t.ink))),
        const SizedBox(height: 4),
        Text(text.hint, style: AppText.bodySmall.copyWith(color: t.inkMuted)),
        const SizedBox(height: 20),
        for (var o = 0; o < options.length; o++)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _OptionTile(
              emoji: options[o].emoji,
              label: text.options[o],
              selected: _answers[q] == o,
              onTap: () => _answer(q, o),
            ),
          ),
      ],
    );
  }

  Widget _concernsPage(AppStrings s, WorldThemePalette t) {
    final async = ref.watch(skinConcernsListProvider);
    // لا مشاكل للاختيار (فارغة أو تعذّر تحميلها): الزر يقول بوضوح إنها تُتخطّى.
    final nothingToPick = async.hasError || (async.valueOrNull?.isEmpty ?? false);
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
            children: [
              Semantics(header: true, child: Text(s.beautyQuizConcernsTitle, style: AppText.title1.copyWith(color: t.ink))),
              const SizedBox(height: 4),
              Text(s.beautyQuizConcernsHint, style: AppText.bodySmall.copyWith(color: t.inkMuted)),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, c) {
                  final w = (c.maxWidth - 12) / 2;
                  final h = w * 0.9;
                  return async.when(
                    loading: () => Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: List.generate(4, (_) => ShimmerBox(width: w, height: h, radius: AppCorners.lg + 2)),
                    ),
                    error: (e, _) => ErrorView.from(e, onRetry: () => ref.invalidate(skinConcernsListProvider)),
                    data: (concerns) => Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        for (final x in concerns)
                          SkinConcernCard(
                            concern: x,
                            width: w,
                            height: h,
                            selected: _concerns.contains(x.slug),
                            onTap: () => _toggleConcern(x.slug),
                          ),
                      ],
                    ),
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
              child: Text(
                nothingToPick
                    ? s.beautyQuizSkipToResult
                    : _concerns.isEmpty
                        ? s.beautyQuizSeeResult
                        : s.beautyQuizSeeResultCount(_concerns.length),
                style: AppText.title3.copyWith(color: Colors.white),
              ),
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
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final radius = BorderRadius.circular(AppCorners.md + 2);
    return AppTap(
      onTap: onTap,
      selected: selected,
      radius: radius,
      child: AnimatedContainer(
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: selected ? t.accentLight : t.surface,
          borderRadius: radius,
          border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 2 : 1),
          boxShadow: selected ? [BoxShadow(color: t.accent.withValues(alpha: 0.18), blurRadius: 12, offset: const Offset(0, 4))] : null,
        ),
        child: Row(
          children: [
            ExcludeSemantics(child: Text(emoji, style: const TextStyle(fontSize: 26))),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: AppText.title3.copyWith(color: t.ink))),
            AnimatedOpacity(
              duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
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
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final profile = ref.watch(skinProfileProvider);
    if (profile == null) return const SizedBox.shrink();
    final match = ref.watch(skinMatchProvider);
    final type = profile.skinType;
    // «ديما» بالعربي فقط — قرار المالكة.
    final showAdvisor = ref.watch(languageCodeProvider) == 'ar';
    final pillStyle = TextButton.styleFrom(
      foregroundColor: Colors.white,
      backgroundColor: Colors.white.withValues(alpha: 0.18),
      minimumSize: const Size(kMinTapTarget, kMinTapTarget),
      shape: const StadiumBorder(),
    );
    return ListView(
      padding: const EdgeInsets.only(bottom: 40),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppCorners.xl - 2),
              gradient: LinearGradient(
                begin: AlignmentDirectional.topStart,
                end: AlignmentDirectional.bottomEnd,
                colors: [Color.lerp(t.accent, Colors.white, 0.1)!, t.accentDark],
              ),
              boxShadow: [BoxShadow(color: t.accent.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8), spreadRadius: -6)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ExcludeSemantics(child: Text(type.emoji, style: const TextStyle(fontSize: 44))),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.beautyYourSkinType, style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.85))),
                          Text(s.beautySkinOf(type), style: AppText.display.copyWith(color: Colors.white)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(s.beautySkinBlurb(type), style: AppText.body.copyWith(color: Colors.white, height: 1.55)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    TextButton.icon(
                      onPressed: () => context.push(
                        '/products?skinType=${type.key}&title=${Uri.encodeComponent(s.beautyProductsForSkinTitle(type))}',
                      ),
                      style: pillStyle,
                      icon: const Icon(Icons.spa_outlined, size: 18),
                      label: Text(s.beautyProductsForMySkin),
                    ),
                    if (showAdvisor)
                      TextButton.icon(
                        onPressed: () => context.push('/advisor?q=${Uri.encodeComponent(s.beautyAskDeemaRoutineQuery(type))}'),
                        style: pillStyle,
                        icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                        label: Text(s.beautyAskDeemaRoutine),
                      ),
                    TextButton.icon(
                      onPressed: onRestart,
                      style: pillStyle,
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: Text(s.beautyRetakeQuiz),
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
          error: (e, _) => ErrorView.from(e, onRetry: () => ref.invalidate(skinMatchProvider)),
          data: (m) {
            if (m == null) return const SizedBox.shrink();
            final both = [m.morning, m.evening].whereType<BeautyPackage>().toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (both.isNotEmpty) ...[
                  AppSectionTitle(title: s.beautySuggestedRoutine, subtitle: s.beautySuggestedRoutineSubtitle),
                  for (final p in both)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: LayoutBuilder(builder: (context, c) => RoutineCard(pack: p, width: c.maxWidth, height: 222)),
                    ),
                  if (both.length == 2)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _AddBothRoutinesButton(routines: both),
                    ),
                ] else
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: EmptyState(
                      icon: Icons.spa_outlined,
                      title: s.beautyPreparingRoutineTitle,
                      subtitle: s.beautyPreparingRoutineSubtitle,
                    ),
                  ),
                for (final x in m.concerns)
                  if (x.products.isNotEmpty) ...[
                    AppSectionTitle(
                      title: '${s.beautyForConcern(x.concern.name)} ${x.concern.icon ?? ''}'.trim(),
                      actionLabel: s.beautyGuide,
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

/// «أضيفي الروتينين»: ضغطة واحدة فقط حتى ينتهي، ورقة ألوان واحدة للروتينين، وإشعار واحد.
class _AddBothRoutinesButton extends ConsumerStatefulWidget {
  final List<BeautyPackage> routines;
  const _AddBothRoutinesButton({required this.routines});

  @override
  ConsumerState<_AddBothRoutinesButton> createState() => _AddBothRoutinesButtonState();
}

class _AddBothRoutinesButtonState extends ConsumerState<_AddBothRoutinesButton> {
  bool _busy = false;

  Future<void> _run() async {
    setState(() => _busy = true);
    try {
      // نتيجة الاختبار تحمل الروتين كاملاً عادةً؛ الجلب فقط إن وصل بلا منتجات.
      final api = ref.read(apiServiceProvider);
      final packs = await Future.wait(
        widget.routines.map((p) async => p.items.isNotEmpty ? p : await api.getPackage(p.routeId)),
      );
      if (!mounted) return;
      await addPackagesToCart(context, ref, packs);
    } catch (e) {
      if (mounted) AppSnackbar.error(context, friendlyError(e, lang: ref.read(stringsProvider).lang));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final total = widget.routines.fold<int>(0, (sum, p) => sum + p.price);
    final saving = widget.routines.fold<int>(0, (sum, p) => sum + p.saving);
    return FilledButton(
      onPressed: _busy ? null : _run,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        backgroundColor: t.accentDark,
        disabledBackgroundColor: t.accentDark.withValues(alpha: 0.6),
        shape: const StadiumBorder(),
      ),
      child: _busy
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
          : Text(
              s.beautyAddBothRoutines(formatPrice(total), saving: saving > 0 ? formatPrice(saving) : null),
              textAlign: TextAlign.center,
              style: AppText.label.copyWith(color: Colors.white),
            ),
    );
  }
}
