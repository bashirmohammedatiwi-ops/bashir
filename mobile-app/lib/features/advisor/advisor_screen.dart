import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/brand/brand_logo.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../cart/cart_provider.dart';
import 'advisor_cart.dart';
import 'advisor_controller.dart';
import 'advisor_models.dart';
import 'advisor_profile.dart';
import 'advisor_strings.dart';
import 'widgets/advisor_insight_cards.dart';
import 'widgets/advisor_knowledge_card.dart';
import 'widgets/advisor_profile_sheet.dart';
import 'widgets/advisor_bubbles.dart';
import 'widgets/advisor_orb.dart';
import 'widgets/advisor_personal_card.dart';
import 'widgets/advisor_product_card.dart';
import 'widgets/advisor_quiz_card.dart';
import 'widgets/advisor_routine_card.dart';
import 'widgets/advisor_style.dart';
import 'widgets/advisor_welcome.dart';
import 'widgets/aurora_background.dart';
import 'widgets/stagger_in.dart';

/// «ديما» — المستشارة الشخصية. محادثة بأسلوب حر أو اختبارات سريعة،
/// والنتائج بطاقات بنسبة ملاءمة وأسباب، وروتين كامل يضاف للسلة بلمسة.
class AdvisorScreen extends ConsumerStatefulWidget {
  final String? initialMessage;
  /// فُتحت من صفحة منتج: الحديث يبدأ عنه.
  final String? productId;
  /// سؤال جاهز عن المنتج (fit | dupe | complement | howto).
  final String? ask;
  const AdvisorScreen({super.key, this.initialMessage, this.productId, this.ask});

  @override
  ConsumerState<AdvisorScreen> createState() => _AdvisorScreenState();
}

class _AdvisorScreenState extends ConsumerState<AdvisorScreen> {
  final _scroll = ScrollController();
  final _input = TextEditingController();
  final _focus = FocusNode();
  /// مفتاح ثابت لكل عنصر (الرد بمعرّفه، رسالتها بموضعها) — للتمرير إليه.
  /// لا نُنقل مفتاحاً من عنصر لآخر، وإلا انتقلت حالته (وحركته) معه.
  final _itemKeys = <String, GlobalKey>{};
  GlobalKey _keyFor(String id) => _itemKeys.putIfAbsent(id, GlobalKey.new);

  /// العناصر التي ظهرت من قبل لا تُعاد حركتها عند التمرير إليها.
  int _animatedCount = 0;
  bool _hasText = false;
  double _lastInset = 0;
  /// زر «إلى الأحدث» حين تبتعد عن آخر المحادثة.
  final _showJump = ValueNotifier(false);
  String? _notice;
  Timer? _noticeTimer;

  AdvisorController get _ctl => ref.read(advisorProvider.notifier);

  /// «ديما» تتكلم العربية فقط — الشاشة لا تُفتح بالواجهة الإنجليزية (رابط قديم مثلاً).
  bool get _isAr => ref.read(languageCodeProvider) == 'ar';

  @override
  void initState() {
    super.initState();
    _animatedCount = ref.read(advisorProvider).entries.length;
    _focus.addListener(() {
      if (mounted) setState(() {});
    });
    _input.addListener(() {
      final has = _input.text.trim().isNotEmpty;
      if (has != _hasText) setState(() => _hasText = has);
    });
    _scroll.addListener(() {
      if (!_scroll.hasClients) return;
      _showJump.value = _scroll.position.maxScrollExtent - _scroll.offset > 700;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!_isAr) return;
      await _ctl.start(productId: widget.productId, ask: widget.ask);
      final m = widget.initialMessage?.trim();
      if (m != null && m.isNotEmpty && mounted) _ctl.sendWhenReady(m);
    });
    if (_animatedCount > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _jumpToEnd());
    }
  }

  /// نفس الشاشة فُتحت برابط جديد (سؤال أو منتج آخر).
  @override
  void didUpdateWidget(covariant AdvisorScreen old) {
    super.didUpdateWidget(old);
    if (!_isAr) return;
    final m = widget.initialMessage?.trim();
    if (m != null && m.isNotEmpty && m != old.initialMessage) {
      _ctl.sendWhenReady(m);
    } else if (widget.productId != null && widget.productId != old.productId) {
      _ctl.start(productId: widget.productId, ask: widget.ask);
    }
  }

  @override
  void dispose() {
    _noticeTimer?.cancel();
    _showJump.dispose();
    _scroll.dispose();
    _input.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _showNotice(String text) {
    _noticeTimer?.cancel();
    setState(() => _notice = text);
    _noticeTimer = Timer(const Duration(milliseconds: 3200), () {
      if (mounted) setState(() => _notice = null);
    });
  }

  bool get _still => MediaQuery.disableAnimationsOf(context);

  /// القفز لآخر المحادثة. الطول الكلي تقديري حتى تُبنى العناصر، فنعيد القفز
  /// بعد كل إطار (حتى 4 مرات) إلى أن يستقر في الأسفل فعلاً.
  void _jumpToEnd([int tries = 0]) {
    if (!_scroll.hasClients) return;
    _scroll.jumpTo(_scroll.position.maxScrollExtent);
    if (tries >= 4) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scroll.hasClients) return;
      if ((_scroll.position.maxScrollExtent - _scroll.offset).abs() > 1) _jumpToEnd(tries + 1);
    });
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scroll.hasClients) return;
      if (_still) return _jumpToEnd();
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
  }

  /// بعد الرد: نضع سؤال الزبونة أعلى الشاشة فيظهر الرد كاملاً من بدايته.
  void _revealReply(List<AdvisorEntry> entries) => _reveal('u${entries.lastIndexWhere((e) => e is UserEntry)}');

  /// رد بلا سؤال قبله (فُتحت على منتج، أو «إعادة» لطلب منتج): بداية الرد نفسه أعلى الشاشة.
  void _revealLastBot(List<AdvisorEntry> entries) {
    final last = entries.lastWhere((e) => e is BotEntry) as BotEntry;
    _reveal('b${last.id}');
  }

  void _reveal(String id) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final ctx = _itemKeys[id]?.currentContext;
      if (ctx == null) return _scrollToEnd();
      Scrollable.ensureVisible(
        ctx,
        alignment: 0.02,
        duration: _still ? Duration.zero : const Duration(milliseconds: 520),
        curve: Curves.easeOutCubic,
      );
    });
  }

  /// [text] من اقتراح جاهز (لا يمس ما كتبته)؛ بدونه نرسل نص الحقل.
  void _send([String? text]) {
    final fromField = text == null;
    final t = (text ?? _input.text).trim();
    if (t.isEmpty) return;
    // «ديما» ما زالت ترد: لا نمسح ما كتبته — يبقى بالحقل لترسله بعد لحظة.
    if (ref.read(advisorProvider).thinking) {
      HapticFeedback.heavyImpact();
      return;
    }
    HapticFeedback.lightImpact();
    if (fromField) {
      _input.clear();
      _focus.unfocus();
    }
    _ctl.send(t);
  }

  void _tapChip(AdvisorChip c) {
    HapticFeedback.selectionClick();
    _focus.unfocus();
    _ctl.tap(c);
  }

  /// مسح باركود منتج من داخل «ديما» ← «هل يناسبني؟».
  Future<void> _scan() async {
    _focus.unfocus();
    final code = await context.push<String>('/scan?pick=1');
    if (!mounted || code == null || code.trim().isEmpty) return;
    await _ctl.askScanned(code);
  }

  /// «ملفكِ الجمالي»: إن غيّرت نوع بشرتها والمحادثة فيها ترشيح، نعيده بالنوع الجديد؛
  /// وإلا نطمئنها أن التعديل يُعتمد بطلبها القادم.
  Future<void> _openProfile() async {
    final before = ref.read(advisorProfileProvider);
    final after = await showAdvisorProfileSheet(context);
    if (!mounted || after == null) return;
    final session = ref.read(advisorProvider);
    if (session.entries.length < 2) return;
    final skinChanged = after.skinType != before.skinType;
    if (skinChanged && _ctl.applySkinType(after.skinType)) return;
    if (skinChanged || jsonEncode(after.toJson()) != jsonEncode(before.toJson())) {
      AppSnackbar.success(context, ref.read(stringsProvider).advisorWillApplyNext);
    }
  }

  void _leave() => context.canPop() ? context.pop() : context.go('/');

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    if (!s.isAr) {
      // دخلت برابط والواجهة إنجليزية: نعود فوراً بدل عرض واجهة لا تخصها.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _leave();
      });
      return const Scaffold(backgroundColor: AdvisorStyle.bg);
    }
    final session = ref.watch(advisorProvider);
    ref.listen<AdvisorSession>(advisorProvider, (prev, next) {
      final before = prev?.entries.length ?? 0;
      final n = next.entries.length;
      // قصُرت المحادثة («محادثة جديدة» أو تبديل الحساب): ما يأتي بعدها يتحرك من جديد.
      if (n < before) {
        _animatedCount = n;
        _itemKeys.clear();
      }
      // محادثة مستعادة من الجهاز: تظهر كما هي بلا حركة، ونذهب لآخرها.
      // (أو «تراجع» بعد محادثة جديدة): قفزة بأكثر من عنصر واحد دفعة واحدة.
      if (n - before >= 2 && !next.thinking) {
        _animatedCount = n;
        WidgetsBinding.instance.addPostFrameCallback((_) => _jumpToEnd());
        return;
      }
      if (next.notice != null && next.notice?.id != prev?.notice?.id) _showNotice(next.notice!.text);
      // الترحيب وحده يبقى من أعلاه.
      if (n <= 1 && !next.thinking) return;
      final grew = n > before;
      if (grew && next.entries.last is BotEntry && n > 1) {
        next.entries[n - 2] is UserEntry ? _revealReply(next.entries) : _revealLastBot(next.entries);
      } else if (grew || (next.thinking && !(prev?.thinking ?? false))) {
        _scrollToEnd();
      }
    });

    // لوحة المفاتيح: نبقي آخر المحادثة ظاهراً إن كانت الزبونة في أسفلها.
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    if (inset > _lastInset && _scroll.hasClients) {
      final nearEnd = _scroll.position.maxScrollExtent - _scroll.offset < 160;
      if (nearEnd) _scrollToEnd();
    }
    _lastInset = inset;

    final entries = session.entries;
    final still = MediaQuery.disableAnimationsOf(context);
    final animateFrom = still ? entries.length : _animatedCount;
    if (entries.length > _animatedCount) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _animatedCount = entries.length);
    }

    final last = session.lastReply;
    final started = entries.length > 1;
    final quizActive = session.state?['quiz'] != null;
    final railAll = started && last != null && last.quiz == null && entries.last is BotEntry ? last.chips : const <AdvisorChip>[];
    // مع الروتين: «أوفر» و«منتجات مفردة» أزرار داخل بطاقته — لا نكررها بالشريط.
    final rail = last?.routine != null
        ? railAll.where((c) => c.value != 'act:cheaper' && c.value != 'act:recommend').toList()
        : railAll;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: AdvisorStyle.bg,
        resizeToAvoidBottomInset: true,
        body: AuroraBackground(
          child: SafeArea(
            bottom: false,
            child: Column(
              children: [
                _Header(
                  thinking: session.thinking,
                  canReset: started,
                  hasProfile: !ref.watch(advisorProfileProvider).isEmpty,
                  onProfile: _openProfile,
                  onBack: _leave,
                  onReset: () {
                    HapticFeedback.mediumImpact();
                    _animatedCount = 0;
                    _input.clear();
                    _focus.unfocus();
                    _ctl.reset();
                    AppSnackbar.action(
                      context,
                      message: s.advisorNewChatStarted,
                      actionLabel: s.undo,
                      onAction: _ctl.undoReset,
                    );
                  },
                ),
                AnimatedSize(
                  duration: still ? Duration.zero : const Duration(milliseconds: 280),
                  curve: Curves.easeOutCubic,
                  alignment: Alignment.topCenter,
                  child: _notice == null
                      ? const SizedBox(width: double.infinity)
                      : Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                          child: StaggerIn(
                            key: ValueKey(_notice),
                            animate: !still,
                            from: const Offset(0, -10),
                            child: _NoticePill(text: _notice!, editLabel: s.edit, onTap: _openProfile),
                          ),
                        ),
                ),
                AnimatedSize(
                  duration: still ? Duration.zero : const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  alignment: Alignment.topCenter,
                  child: started && last != null && last.understood.isNotEmpty
                      ? _UnderstoodStrip(
                          items: last.understood,
                          enabled: !session.thinking,
                          onRemove: (u) {
                            HapticFeedback.selectionClick();
                            _ctl.removeUnderstood(u);
                          },
                        )
                      : const SizedBox(width: double.infinity),
                ),
                Expanded(
                  child: Stack(
                    children: [
                      Positioned.fill(child: entries.isEmpty
                      ? _EmptyState(
                          error: session.error,
                          onRetry: _ctl.retry,
                        )
                      : ListView.builder(
                          controller: _scroll,
                          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                          padding: const EdgeInsets.only(top: 8, bottom: 20),
                          itemCount: entries.length + 1,
                          itemBuilder: (context, i) {
                            if (i == entries.length) {
                              return _Tail(
                                thinking: session.thinking,
                                error: session.error,
                                canRetry: _ctl.canRetry,
                                onRetry: _ctl.retry,
                              );
                            }
                            final e = entries[i];
                            final animate = i >= animateFrom;
                            return switch (e) {
                              UserEntry(:final text) => Padding(
                                  key: _keyFor('u$i'),
                                  padding: const EdgeInsets.only(top: 14, bottom: 4),
                                  child: StaggerIn(
                                    animate: animate,
                                    from: const Offset(-24, 6),
                                    fromScale: 0.96,
                                    duration: const Duration(milliseconds: 380),
                                    child: UserBubble(text: text),
                                  ),
                                ),
                              BotEntry(:final reply, :final id, :final welcome) => KeyedSubtree(
                                  key: _keyFor('b$id'),
                                  child: welcome
                                      ? AdvisorWelcome(
                                          reply: reply,
                                          prompts: session.prompts,
                                          animate: animate,
                                          onChip: _tapChip,
                                          onPrompt: _send,
                                        )
                                      : _BotTurn(
                                          entryId: id,
                                          reply: reply,
                                          animate: animate,
                                          isLast: i == entries.length - 1,
                                          quizActive: quizActive && i == entries.length - 1 && !session.thinking,
                                          onQuizAnswer: (picked) {
                                            _focus.unfocus();
                                            _ctl.answerQuiz(picked);
                                          },
                                          onClarify: () => _focus.requestFocus(),
                                        ),
                                ),
                            };
                          },
                        )),
                      PositionedDirectional(
                        end: 16,
                        bottom: 10,
                        child: ValueListenableBuilder<bool>(
                          valueListenable: _showJump,
                          builder: (_, show, __) => IgnorePointer(
                            ignoring: !show,
                            child: AnimatedScale(
                              duration: still ? Duration.zero : const Duration(milliseconds: 220),
                              scale: show ? 1 : 0.6,
                              child: AnimatedOpacity(
                                duration: still ? Duration.zero : const Duration(milliseconds: 200),
                                opacity: show ? 1 : 0,
                                child: _JumpButton(onTap: _scrollToEnd),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (session.comparing.isNotEmpty)
                  _CompareTray(
                    items: session.comparing,
                    busy: session.thinking,
                    onRemove: (p) => _ctl.toggleCompare(p),
                    onClear: () {
                      HapticFeedback.selectionClick();
                      _ctl.clearCompare();
                    },
                    onCompare: () {
                      HapticFeedback.mediumImpact();
                      _ctl.compareNow();
                    },
                  ),
                _Composer(
                  controller: _input,
                  focus: _focus,
                  hasText: _hasText,
                  busy: session.thinking,
                  chips: rail,
                  chipsKey: entries.length,
                  onChip: _tapChip,
                  onSend: _send,
                  onScan: _scan,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── الرأس

class _Header extends ConsumerWidget {
  final bool thinking;
  final bool canReset;
  final VoidCallback onBack;
  final VoidCallback onReset;
  final bool hasProfile;
  final VoidCallback onProfile;
  const _Header({
    required this.thinking,
    required this.canReset,
    required this.onBack,
    required this.onReset,
    required this.hasProfile,
    required this.onProfile,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    // شاشة ضيقة أو خط كبير: «محادثة جديدة» أيقونة فقط حتى يبقى للاسم والحالة مكان.
    final compact = MediaQuery.sizeOf(context).width < 380 || MediaQuery.textScalerOf(context).scale(1) > 1.1;
    final still = MediaQuery.disableAnimationsOf(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
      child: Row(
        children: [
          _GlassIcon(icon: Icons.arrow_back_rounded, onTap: onBack, tooltip: s.advisorBack),
          const SizedBox(width: 8),
          AdvisorOrb(size: 38, thinking: thinking),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(s.advisorName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AdvisorStyle.text(size: 16.5, weight: FontWeight.w800, height: 1.2)),
                const SizedBox(height: 2),
                AnimatedSwitcher(
                  duration: still ? Duration.zero : const Duration(milliseconds: 250),
                  child: Row(
                    key: ValueKey(thinking),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: thinking ? BrandColors.rose : AdvisorStyle.successFg,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          thinking ? s.advisorTyping : s.advisorOnline,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.2),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const _CartIcon(),
          const SizedBox(width: 6),
          Stack(
            clipBehavior: Clip.none,
            children: [
              _GlassIcon(icon: hasProfile ? Icons.favorite_rounded : Icons.favorite_border_rounded, onTap: onProfile, tooltip: s.advisorProfileTitle),
              if (hasProfile)
                PositionedDirectional(
                  top: 3,
                  end: 3,
                  child: IgnorePointer(
                    child: Container(width: 9, height: 9, decoration: BoxDecoration(shape: BoxShape.circle, gradient: AdvisorStyle.gradient, border: Border.all(color: Colors.white, width: 1.5))),
                  ),
                ),
            ],
          ),
          AnimatedSwitcher(
            duration: still ? Duration.zero : const Duration(milliseconds: 260),
            transitionBuilder: (c, a) => FadeTransition(opacity: a, child: ScaleTransition(scale: Tween(begin: 0.85, end: 1.0).animate(a), child: c)),
            child: canReset
                ? Padding(
                    key: ValueKey(compact ? 'new-c' : 'new'),
                    padding: const EdgeInsetsDirectional.only(start: 6),
                    child: _NewChatButton(label: s.advisorNewChat, compact: compact, onTap: onReset),
                  )
                : const SizedBox.shrink(key: ValueKey('none')),
          ),
        ],
      ),
    );
  }
}

/// «محادثة جديدة» — زر واضح بنص وأيقونة؛ على الشاشات الضيقة أيقونة بتلميح.
class _NewChatButton extends StatelessWidget {
  final String label;
  final bool compact;
  final VoidCallback onTap;
  const _NewChatButton({required this.label, required this.compact, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(compact ? 22 : 20);
    final button = Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AdvisorStyle.gradient,
          borderRadius: radius,
          boxShadow: [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.30), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: radius,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: compact
                ? const SizedBox.square(dimension: 44, child: Icon(Icons.add_rounded, size: 22, color: Colors.white))
                : ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 44),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.add_rounded, size: 18, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(label, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                        ],
                      ),
                    ),
                  ),
          ),
        ),
      ),
    );
    return compact ? Tooltip(message: label, child: button) : button;
  }
}

/// السلة من داخل «ديما»: عدد ما أضافته ظاهر دائماً، ولمسة تفتح السلة.
class _CartIcon extends ConsumerStatefulWidget {
  const _CartIcon();

  @override
  ConsumerState<_CartIcon> createState() => _CartIconState();
}

class _CartIconState extends ConsumerState<_CartIcon> {
  int? _count;
  /// يزداد مع كل تغيّر في العدد — فتنبض الشارة مرة واحدة.
  int _bump = 0;

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final count = ref.watch(cartProvider.select((c) => c.count));
    if (_count != null && _count != count) _bump++;
    _count = count;
    final still = MediaQuery.disableAnimationsOf(context);
    final label = count > 0 ? '${s.advisorCart} — ${s.itemsCount(count)}' : s.advisorCart;
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          _GlassIcon(
            icon: Icons.shopping_bag_outlined,
            tooltip: label,
            onTap: () {
              HapticFeedback.selectionClick();
              openCartTab(context, ProviderScope.containerOf(context, listen: false));
            },
          ),
          if (count > 0)
            PositionedDirectional(
              top: -2,
              end: -2,
              child: IgnorePointer(
                child: TweenAnimationBuilder<double>(
                  key: ValueKey(_bump),
                  tween: Tween(begin: _bump == 0 || still ? 1.0 : 1.4, end: 1.0),
                  duration: still ? Duration.zero : const Duration(milliseconds: 360),
                  curve: Curves.easeOutBack,
                  builder: (_, k, child) => Transform.scale(scale: k, child: child),
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 18),
                    height: 18,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: AdvisorStyle.gradient,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: Text(
                      count > 99 ? '99+' : '$count',
                      textScaler: TextScaler.noScaling,
                      style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: Colors.white, height: 1),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _GlassIcon extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;
  const _GlassIcon({required this.icon, required this.onTap, required this.tooltip});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.white.withValues(alpha: 0.78),
        shape: const CircleBorder(side: BorderSide(color: AdvisorStyle.glassBorder)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: SizedBox.square(dimension: 44, child: Icon(icon, size: 21, color: AdvisorStyle.ink)),
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── ما فهمته

class _UnderstoodStrip extends ConsumerWidget {
  final List<AdvisorUnderstood> items;
  final bool enabled;
  final ValueChanged<AdvisorUnderstood> onRemove;
  const _UnderstoodStrip({required this.items, required this.enabled, required this.onRemove});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    // الارتفاع يتبع حجم الخط حتى لا تُقص الشرائح مع الخط الكبير.
    final h = 34 + MediaQuery.textScalerOf(context).scale(14);
    return SizedBox(
      height: h,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 2, 16, 4),
        children: [
          Center(
            child: Text(s.advisorUnderstood, style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.2)),
          ),
          const SizedBox(width: 6),
          for (final u in items)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 6),
              child: AnimatedSwitcher(
                duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 250),
                child: _UnderstoodChip(
                  key: ValueKey(u.key),
                  item: u,
                  enabled: enabled,
                  removeLabel: s.advisorRemove(u.label),
                  onRemove: () => onRemove(u),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// شريحة «فهمت منكِ»: النص للقراءة فقط، والإزالة من زر × وحده (32px) — لمسة عابرة لا تعيد الترشيح.
class _UnderstoodChip extends StatelessWidget {
  final AdvisorUnderstood item;
  final bool enabled;
  final String removeLabel;
  final VoidCallback onRemove;
  const _UnderstoodChip({super.key, required this.item, required this.enabled, required this.removeLabel, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(10, 0, 0, 0),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.86),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEBDDF2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(item.label, style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w700, color: AdvisorStyle.accentText, height: 1.2)),
            Semantics(
              button: true,
              enabled: enabled,
              label: removeLabel,
              excludeSemantics: true,
              child: InkResponse(
                onTap: enabled ? onRemove : null,
                radius: 18,
                child: SizedBox.square(
                  dimension: 32,
                  child: Center(
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(color: Color(0xFFF3EAF8), shape: BoxShape.circle),
                      child: const Icon(Icons.close_rounded, size: 12, color: Color(0xFF8C6BAE)),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── رد «ديما»

class _BotTurn extends ConsumerWidget {
  /// معرّف الرد — تُقرأ به حالة التقييم والإضافة من الجلسة.
  final int entryId;
  final AdvisorReply reply;
  final bool animate;
  final bool quizActive;
  final bool isLast;
  final ValueChanged<List<AdvisorChip>> onQuizAnswer;
  /// «أوضّح أكثر» بعد عدم الإعجاب: يفتح حقل الكتابة.
  final VoidCallback onClarify;

  const _BotTurn({
    required this.entryId,
    required this.reply,
    required this.animate,
    required this.quizActive,
    required this.isLast,
    required this.onQuizAnswer,
    required this.onClarify,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    // الرسائل تُكتب بالتتابع؛ البطاقات تظهر بعد أول رسالة بقليل (لا تنتظر الكل).
    final parts = <({Widget w, Duration at})>[];
    var first = true;
    var t = Duration.zero;
    Duration? cardsAt;
    // النصيحة تكميلية — تأتي بعد النتائج لا قبلها.
    final tips = reply.messages.where(TipCard.isTip).toList();
    for (final m in reply.messages.where((m) => !TipCard.isTip(m))) {
      parts.add((w: BotBubble(text: m, showAvatar: first, animate: animate, typeDelay: t), at: t));
      t += typingDuration(m) + const Duration(milliseconds: 90);
      first = false;
      cardsAt ??= t;
    }
    var c = cardsAt ?? Duration.zero;
    void card(Widget w) {
      parts.add((w: w, at: c));
      c += const Duration(milliseconds: 150);
    }

    if (reply.anchor != null && reply.fit == null) card(AdvisorAnchorTile(product: reply.anchor!));
    if (reply.knowledge != null) card(AdvisorKnowledgeCard(knowledge: reply.knowledge!, animate: animate));
    if (reply.fit != null) card(AdvisorFitCard(fit: reply.fit!, animate: animate));
    if (reply.compare != null) card(AdvisorCompareCard(compare: reply.compare!, animate: animate));
    if (reply.quiz != null) {
      card(AnimatedSize(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        alignment: Alignment.topCenter,
        child: AdvisorQuizCard(
          key: ValueKey('${reply.quiz!.id}-${reply.quiz!.step}'),
          quiz: reply.quiz!,
          active: quizActive,
          animate: animate,
          onAnswer: onQuizAnswer,
        ),
      ));
    }
    if (reply.routine != null && reply.routine!.steps.isNotEmpty) {
      card(AdvisorRoutineCard(routine: reply.routine!, animate: animate, entryId: entryId, showActions: isLast));
    }
    if (reply.products.isNotEmpty) {
      final similar = reply.products.first.similarity != null;
      card(AdvisorProductRail(
        title: similar
            ? (reply.anchor != null ? (s.isAr ? 'يشبهه' : 'Similar to it') : (s.isAr ? 'بنفس البصمة' : 'Same signature'))
            : reply.knowledge != null
                ? (s.isAr ? 'منتجات متوفرة فيها المكوّن' : 'Products with this ingredient')
                : null,
        products: reply.products,
        animate: animate,
        highlightFirst: !similar,
      ));
    }
    for (final g in reply.groups) {
      card(AdvisorProductRail(title: g.title, products: g.products, animate: animate, highlightFirst: false));
    }
    for (final pc in reply.personal) {
      card(AdvisorPersonalCard(personal: pc, animate: animate));
    }
    // أكثر من نوع بطلب واحد: إضافة الأفضل من كل نوع بلمسة.
    if (reply.products.isEmpty && reply.groups.length >= 2 && reply.routine == null) {
      card(_AddBestOfEach(entryId: entryId, products: reply.groups.map((g) => g.products.first).toList()));
    }
    for (final tip in tips) {
      card(TipCard(text: tip));
    }
    final hasPicks = reply.products.isNotEmpty || reply.groups.isNotEmpty || reply.routine != null;
    if (hasPicks) card(_Feedback(entryId: entryId, reply: reply, isLast: isLast, onClarify: onClarify));

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < parts.length; i++)
            Padding(
              padding: EdgeInsets.only(bottom: i == parts.length - 1 ? 0 : 8),
              child: StaggerIn(animate: animate, delay: parts[i].at, child: parts[i].w),
            ),
        ],
      ),
    );
  }
}

/// «هل أفادتكِ؟» — إشارة تتعلم منها «ديما» ترتيبها. التقييم محفوظ بالجلسة (مرة لكل رد).
class _Feedback extends ConsumerWidget {
  final int entryId;
  final AdvisorReply reply;
  final bool isLast;
  final VoidCallback onClarify;
  const _Feedback({required this.entryId, required this.reply, required this.isLast, required this.onClarify});

  void _rate(WidgetRef ref, bool liked) {
    HapticFeedback.selectionClick();
    ref.read(advisorProvider.notifier).rate(entryId, reply, liked);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final liked = ref.watch(advisorProvider.select((x) => x.rated[entryId]));
    final busy = ref.watch(advisorProvider.select((x) => x.thinking));
    final style = AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.4);
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 52, end: 16),
      child: AnimatedSwitcher(
        duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 250),
        child: liked != null
            ? Column(
                key: const ValueKey('done'),
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Semantics(
                    liveRegion: true,
                    child: Text(liked ? s.advisorFeedbackThanks : s.advisorFeedbackSorry, style: style),
                  ),
                  // لم تعجبها: خطوة تالية واضحة بدل أن تخمّن ماذا تكتب.
                  if (!liked) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        if (isLast)
                          _NextChip(
                            label: '🔄 ${s.advisorChangeThem}',
                            enabled: !busy,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              ref.read(advisorProvider.notifier).tap(AdvisorChip(label: s.advisorChangeThem, value: 'act:more', emoji: '🔄'));
                            },
                          ),
                        _NextChip(
                          label: s.isAr ? '✍️ أوضّح أكثر' : '✍️ Let me explain',
                          enabled: true,
                          onTap: () {
                            HapticFeedback.selectionClick();
                            onClarify();
                          },
                        ),
                      ],
                    ),
                  ],
                ],
              )
            : Row(
                key: const ValueKey('ask'),
                children: [
                  Flexible(child: Text(s.advisorFeedbackAsk, style: style.copyWith(height: 1.2))),
                  const SizedBox(width: 2),
                  _Thumb(icon: Icons.thumb_up_alt_outlined, label: s.advisorHelpful, onTap: () => _rate(ref, true)),
                  _Thumb(icon: Icons.thumb_down_alt_outlined, label: s.advisorNotHelpful, onTap: () => _rate(ref, false)),
                ],
              ),
      ),
    );
  }
}

class _NextChip extends StatelessWidget {
  final String label;
  final bool enabled;
  final VoidCallback onTap;
  const _NextChip({required this.label, required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Material(
        color: Colors.white.withValues(alpha: 0.9),
        shape: const StadiumBorder(side: BorderSide(color: AdvisorStyle.glassBorder)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: enabled ? onTap : null,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 40),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
              child: Text(label, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, height: 1.2)),
            ),
          ),
        ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _Thumb({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: Tooltip(
        message: label,
        child: InkResponse(
          onTap: onTap,
          radius: 22,
          // 17 + 13.5×2 ≈ 44: مساحة لمس مريحة لأيقونة صغيرة.
          child: Padding(
            padding: const EdgeInsets.all(13.5),
            child: Icon(icon, size: 17, color: AdvisorStyle.inkMuted),
          ),
        ),
      ),
    );
  }
}

class _AddBestOfEach extends ConsumerStatefulWidget {
  final int entryId;
  final List<AdvisorProduct> products;
  const _AddBestOfEach({required this.entryId, required this.products});

  @override
  ConsumerState<_AddBestOfEach> createState() => _AddBestOfEachState();
}

class _AddBestOfEachState extends ConsumerState<_AddBestOfEach> {
  bool _busy = false;

  Future<void> _add() async {
    setState(() => _busy = true);
    final added = await advisorAddRoutine(context, ref, widget.products);
    if (!mounted) return;
    final ctl = ref.read(advisorProvider.notifier);
    for (final p in widget.products.take(added)) {
      ctl.track('cart', productId: p.id);
    }
    if (added > 0) ctl.markAdded(widget.entryId);
    setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    // «أُضيفت» محفوظة بالجلسة: لا يعود الزر بعد التمرير فتتضاعف الكميات بالسلة.
    final done = ref.watch(advisorProvider.select((x) => x.added.contains(widget.entryId)));
    final total = widget.products.fold<int>(0, (a, p) => a + p.price);
    final label = done
        ? (s.isAr ? 'أُضيفت للسلة ✓  •  ${s.advisorViewCart}' : 'Added to bag ✓  •  ${s.advisorViewCart}')
        : (s.isAr ? 'أضيفي الأفضل من كل نوع  •  ${formatPrice(total)}' : 'Add the best of each  •  ${formatPrice(total)}');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Semantics(
        button: true,
        label: label,
        excludeSemantics: true,
        child: GestureDetector(
          onTap: _busy
              ? null
              : done
                  ? () => openCartTab(context, ProviderScope.containerOf(context, listen: false))
                  : _add,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            constraints: const BoxConstraints(minHeight: 50),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              gradient: done ? null : AdvisorStyle.gradient,
              color: done ? AdvisorStyle.successBg : null,
              borderRadius: BorderRadius.circular(18),
              boxShadow: done ? null : [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.3), blurRadius: 14, offset: const Offset(0, 5))],
            ),
            alignment: Alignment.center,
            child: _busy
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
                : Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, color: done ? AdvisorStyle.successFg : Colors.white, height: 1.2),
                  ),
          ),
        ),
      ),
    );
  }
}

class _Tail extends ConsumerWidget {
  final bool thinking;
  final String? error;
  /// لا يُعرض «إعادة» لطلب لن ينجح بتكراره (رسالة أطول من المسموح).
  final bool canRetry;
  final VoidCallback onRetry;
  const _Tail({required this.thinking, required this.error, required this.canRetry, required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return AnimatedSwitcher(
      duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 260),
      child: thinking
          ? const Padding(
              key: ValueKey('t'),
              padding: EdgeInsets.only(top: 14),
              child: StaggerIn(child: ThinkingIndicator()),
            )
          : error != null
              ? Padding(
                  key: const ValueKey('e'),
                  padding: const EdgeInsetsDirectional.fromSTEB(52, 14, 48, 0),
                  child: Semantics(
                    liveRegion: true,
                    child: Container(
                      padding: const EdgeInsetsDirectional.fromSTEB(14, 10, 8, 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF1F3),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFF8D5DC)),
                      ),
                      child: Row(
                        children: [
                          Icon(canRetry ? Icons.wifi_off_rounded : Icons.info_outline_rounded, size: 18, color: const Color(0xFFD0506E)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(error!, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w600, color: const Color(0xFF9A3550), height: 1.4)),
                          ),
                          if (canRetry)
                            TextButton(
                              style: TextButton.styleFrom(minimumSize: const Size(44, 44)),
                              onPressed: onRetry,
                              child: Text(s.advisorRetry, style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, color: BrandColors.rose, height: 1.2)),
                            ),
                        ],
                      ),
                    ),
                  ),
                )
              : const SizedBox(key: ValueKey('n'), height: 4),
    );
  }
}

class _EmptyState extends ConsumerWidget {
  final String? error;
  final VoidCallback onRetry;
  const _EmptyState({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AdvisorOrb(size: 108, thinking: error == null),
            const SizedBox(height: 18),
            Text(
              error ?? s.advisorPreparing,
              textAlign: TextAlign.center,
              style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w700, color: error == null ? AdvisorStyle.inkSoft : AdvisorStyle.ink),
            ),
            if (error != null) ...[
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: onRetry,
                style: FilledButton.styleFrom(
                  backgroundColor: BrandColors.orchid,
                  minimumSize: const Size(44, 46),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                ),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text(s.advisorTryAgain, style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── الإدخال

/// حد الرسالة عند السيرفر — نمنع ما بعده بدل أن يُرفض الطلب.
const _maxMessage = 600;
/// يظهر عداد المتبقي حين تقترب منه.
const _counterFrom = 520;

class _Composer extends ConsumerWidget {
  final TextEditingController controller;
  final FocusNode focus;
  final bool hasText;
  final bool busy;
  final List<AdvisorChip> chips;
  final int chipsKey;
  final ValueChanged<AdvisorChip> onChip;
  final ValueChanged<String?> onSend;
  final VoidCallback onScan;

  const _Composer({
    required this.controller,
    required this.focus,
    required this.hasText,
    required this.busy,
    required this.chips,
    required this.chipsKey,
    required this.onChip,
    required this.onSend,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final keyboard = MediaQuery.viewInsetsOf(context).bottom > 0;
    final still = MediaQuery.disableAnimationsOf(context);
    final canSend = hasText && !busy;
    // شريط الاقتراحات يتبع حجم الخط حتى لا يُقص نصها.
    final railH = 32 + MediaQuery.textScalerOf(context).scale(14);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AdvisorStyle.bg.withValues(alpha: 0), AdvisorStyle.bg.withValues(alpha: 0.92)],
          stops: const [0, 0.35],
        ),
      ),
      padding: EdgeInsets.only(bottom: keyboard ? 8 : (bottom > 0 ? bottom : 10)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedSize(
            duration: still ? Duration.zero : const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
            child: chips.isEmpty
                ? const SizedBox(width: double.infinity)
                : SizedBox(
                    height: railH,
                    child: ListView.separated(
                      key: ValueKey(chipsKey),
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
                      itemCount: chips.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) => StaggerIn(
                        index: i,
                        animate: !still,
                        step: const Duration(milliseconds: 60),
                        from: const Offset(-14, 0),
                        child: _RailChip(chip: chips[i], enabled: !busy, primary: i == 0, onTap: () => onChip(chips[i])),
                      ),
                    ),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 0),
            child: Container(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 4, 5, 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: focus.hasFocus ? const Color(0xFFE2CDEB) : AdvisorStyle.glassBorder),
                boxShadow: AdvisorStyle.shadow(1.1),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: controller,
                      focusNode: focus,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      // أثناء الرد لا يُرسل زر لوحة المفاتيح — والنص يبقى بالحقل.
                      onSubmitted: busy ? null : (_) => onSend(null),
                      inputFormatters: [LengthLimitingTextInputFormatter(_maxMessage)],
                      style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w500, height: 1.45),
                      cursorColor: BrandColors.orchid,
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        filled: false,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        hintText: s.advisorHint,
                        hintMaxLines: 1,
                        hintStyle: AdvisorStyle.text(size: 13.5, color: AdvisorStyle.inkMuted, height: 1.45),
                      ),
                    ),
                  ),
                  // كم بقي حين تقترب من الحد.
                  ValueListenableBuilder<TextEditingValue>(
                    valueListenable: controller,
                    builder: (_, v, __) {
                      final left = _maxMessage - v.text.characters.length;
                      if (v.text.characters.length <= _counterFrom) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsetsDirectional.only(start: 4, bottom: 14),
                        child: Text(
                          '$left',
                          style: AdvisorStyle.text(
                            size: 11,
                            weight: FontWeight.w700,
                            color: left <= 20 ? const Color(0xFFD0506E) : AdvisorStyle.inkMuted,
                            height: 1.2,
                          ),
                        ),
                      );
                    },
                  ),
                  // مسح باركود منتج: يظهر حين لا نص (المساحة للكتابة حين تكتب).
                  AnimatedSwitcher(
                    duration: still ? Duration.zero : const Duration(milliseconds: 200),
                    transitionBuilder: (c, a) => FadeTransition(opacity: a, child: ScaleTransition(scale: a, child: c)),
                    child: hasText
                        ? const SizedBox.shrink()
                        : Padding(
                            key: const ValueKey('scan'),
                            padding: const EdgeInsetsDirectional.only(start: 2),
                            child: Semantics(
                              button: true,
                              enabled: !busy,
                              label: s.advisorScanHint,
                              excludeSemantics: true,
                              child: Tooltip(
                                message: s.advisorScanHint,
                                child: InkResponse(
                                  onTap: busy ? null : onScan,
                                  radius: 22,
                                  child: SizedBox.square(
                                    dimension: 44,
                                    child: Center(
                                      child: Container(
                                        width: 38,
                                        height: 38,
                                        alignment: Alignment.center,
                                        decoration: const BoxDecoration(shape: BoxShape.circle, color: AdvisorStyle.tint),
                                        child: const Icon(Icons.qr_code_scanner_rounded, size: 19, color: BrandColors.orchid),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(width: 4),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 1),
                    child: Semantics(
                      button: true,
                      enabled: canSend,
                      label: s.advisorSend,
                      excludeSemantics: true,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: canSend ? () => onSend(null) : null,
                        child: AnimatedContainer(
                          duration: still ? Duration.zero : const Duration(milliseconds: 240),
                          curve: Curves.easeOutCubic,
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: canSend ? AdvisorStyle.gradient : null,
                            color: canSend ? null : const Color(0xFFF3EDF7),
                            boxShadow: canSend
                                ? [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.35), blurRadius: 12, offset: const Offset(0, 4))]
                                : null,
                          ),
                          child: AnimatedSwitcher(
                            duration: still ? Duration.zero : const Duration(milliseconds: 200),
                            transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                            child: busy
                                ? const Padding(
                                    key: ValueKey('busy'),
                                    padding: EdgeInsets.all(13),
                                    child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.orchid),
                                  )
                                : Icon(
                                    canSend ? Icons.arrow_upward_rounded : Icons.auto_awesome_rounded,
                                    key: ValueKey(canSend),
                                    size: canSend ? 22 : 19,
                                    color: canSend ? Colors.white : BrandColors.orchidLight,
                                  ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RailChip extends StatelessWidget {
  final AdvisorChip chip;
  final bool enabled;
  final bool primary;
  final VoidCallback onTap;
  const _RailChip({required this.chip, required this.enabled, required this.primary, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: primary ? AdvisorStyle.softGradient : null,
          color: primary ? null : Colors.white.withValues(alpha: 0.9),
          border: Border.all(color: primary ? AdvisorStyle.accentBorder : AdvisorStyle.glassBorder),
          boxShadow: AdvisorStyle.shadow(0.4),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: enabled ? onTap : null,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 13),
              child: Center(
                child: Text(
                  [if (chip.emoji != null) chip.emoji, chip.label].join(' '),
                  style: AdvisorStyle.text(
                    size: 12.5,
                    weight: FontWeight.w700,
                    color: primary ? AdvisorStyle.accentText : AdvisorStyle.ink,
                    height: 1.2,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NoticePill extends StatelessWidget {
  final String text;
  final String editLabel;
  final VoidCallback onTap;
  const _NoticePill({required this.text, required this.editLabel, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      liveRegion: true,
      label: '$text — $editLabel',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AdvisorStyle.ink,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: AdvisorStyle.ink.withValues(alpha: 0.22), blurRadius: 14, offset: const Offset(0, 5))],
          ),
          child: Row(
            children: [
              const Icon(Icons.favorite_rounded, size: 16, color: BrandColors.roseLight),
              const SizedBox(width: 8),
              Expanded(
                child: Text(text, maxLines: 2, overflow: TextOverflow.ellipsis, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w700, color: Colors.white, height: 1.4)),
              ),
              const SizedBox(width: 6),
              Text(editLabel, style: AdvisorStyle.text(size: 12, weight: FontWeight.w800, color: BrandColors.roseLight, height: 1.2)),
            ],
          ),
        ),
      ),
    );
  }
}

class _JumpButton extends ConsumerWidget {
  final VoidCallback onTap;
  const _JumpButton({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final label = ref.s.isAr ? 'إلى آخر المحادثة' : 'Jump to latest';
    return Tooltip(
      message: label,
      child: Material(
        color: Colors.white,
        shape: const CircleBorder(side: BorderSide(color: AdvisorStyle.glassBorder)),
        elevation: 3,
        shadowColor: BrandColors.orchid.withValues(alpha: 0.3),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: const SizedBox.square(dimension: 44, child: Icon(Icons.keyboard_arrow_down_rounded, color: BrandColors.orchid, size: 26)),
        ),
      ),
    );
  }
}

/// سلة المقارنة: صور مصغرة لما اختارته + «قارني الآن» + مسح الكل بلمسة.
class _CompareTray extends ConsumerWidget {
  final List<AdvisorProduct> items;
  final bool busy;
  final ValueChanged<AdvisorProduct> onRemove;
  final VoidCallback onClear;
  final VoidCallback onCompare;
  const _CompareTray({required this.items, required this.busy, required this.onRemove, required this.onClear, required this.onCompare});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final ready = items.length >= 2 && !busy;
    return StaggerIn(
      animate: !MediaQuery.disableAnimationsOf(context),
      from: const Offset(0, 16),
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 4, 12, 2),
        padding: const EdgeInsetsDirectional.fromSTEB(4, 6, 8, 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AdvisorStyle.accentBorder),
          boxShadow: AdvisorStyle.shadow(1),
        ),
        child: Row(
          children: [
            Semantics(
              button: true,
              label: s.clear,
              excludeSemantics: true,
              child: IconButton(
                tooltip: s.clear,
                onPressed: onClear,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints.tightFor(width: 32, height: 44),
                icon: const Icon(Icons.close_rounded, size: 18, color: AdvisorStyle.inkMuted),
              ),
            ),
            const Icon(Icons.balance_rounded, size: 18, color: BrandColors.orchid),
            const SizedBox(width: 6),
            for (final p in items)
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 6),
                child: Semantics(
                  button: true,
                  label: s.advisorRemove(p.name),
                  excludeSemantics: true,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onRemove(p),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(color: AdvisorStyle.surface, borderRadius: BorderRadius.circular(12)),
                            child: AppNetworkImage(url: p.image, width: 34, height: 34, fit: BoxFit.contain),
                          ),
                          PositionedDirectional(
                            top: -4,
                            end: -4,
                            child: Container(
                              width: 16,
                              height: 16,
                              decoration: const BoxDecoration(color: AdvisorStyle.ink, shape: BoxShape.circle),
                              child: const Icon(Icons.close_rounded, size: 11, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            const Spacer(),
            if (items.length < 2)
              Flexible(
                flex: 4,
                child: Text(s.advisorPickAnother,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.2)),
              ),
            const SizedBox(width: 6),
            Semantics(
              button: true,
              enabled: ready,
              label: s.advisorCompare(items.length),
              excludeSemantics: true,
              child: GestureDetector(
                onTap: ready ? onCompare : null,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 200),
                  opacity: ready ? 1 : 0.45,
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 44),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(gradient: AdvisorStyle.gradient, borderRadius: BorderRadius.circular(16)),
                    child: Text(s.advisorCompare(items.length), style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
