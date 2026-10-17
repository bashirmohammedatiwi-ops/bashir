import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/brand/brand_logo.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import 'advisor_cart.dart';
import 'advisor_controller.dart';
import 'advisor_models.dart';
import 'advisor_profile.dart';
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
  final _lastUserKey = GlobalKey();

  /// العناصر التي ظهرت من قبل لا تُعاد حركتها عند التمرير إليها.
  int _animatedCount = 0;
  bool _hasText = false;
  double _lastInset = 0;
  /// زر «إلى الأحدث» حين تبتعد عن آخر المحادثة.
  final _showJump = ValueNotifier(false);
  String? _notice;
  Timer? _noticeTimer;

  AdvisorController get _ctl => ref.read(advisorProvider.notifier);

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
      await _ctl.start(productId: widget.productId, ask: widget.ask);
      final m = widget.initialMessage?.trim();
      if (m != null && m.isNotEmpty && mounted) _ctl.send(m);
    });
    if (_animatedCount > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _jumpToEnd());
    }
  }

  /// نفس الشاشة فُتحت برابط جديد (سؤال أو منتج آخر).
  @override
  void didUpdateWidget(covariant AdvisorScreen old) {
    super.didUpdateWidget(old);
    final m = widget.initialMessage?.trim();
    if (m != null && m.isNotEmpty && m != old.initialMessage) {
      _ctl.send(m);
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

  void _jumpToEnd() {
    if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
  }

  /// بعد الرد: نضع سؤال الزبونة أعلى الشاشة فيظهر الرد كاملاً من بدايته.
  void _revealReply() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _lastUserKey.currentContext;
      if (ctx == null) return _scrollToEnd();
      Scrollable.ensureVisible(
        ctx,
        alignment: 0.02,
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOutCubic,
      );
    });
  }

  void _send([String? text]) {
    final t = (text ?? _input.text).trim();
    if (t.isEmpty) return;
    HapticFeedback.lightImpact();
    _input.clear();
    _focus.unfocus();
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

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(advisorProvider);
    ref.listen<AdvisorSession>(advisorProvider, (prev, next) {
      // محادثة مستعادة من الجهاز: تظهر كما هي بلا حركة، ونذهب لآخرها.
      // (أو «تراجع» بعد محادثة جديدة): قفزة بأكثر من عنصر واحد دفعة واحدة.
      if (next.entries.length - (prev?.entries.length ?? 0) >= 2 && !next.thinking) {
        _animatedCount = next.entries.length;
        WidgetsBinding.instance.addPostFrameCallback((_) => _jumpToEnd());
        return;
      }
      if (next.notice != null && next.notice?.id != prev?.notice?.id) _showNotice(next.notice!.text);
      // الترحيب وحده يبقى من أعلاه.
      if (next.entries.length <= 1 && !next.thinking) return;
      final grew = next.entries.length > (prev?.entries.length ?? 0);
      if (grew && next.entries.last is BotEntry && next.entries.length > 1) {
        _revealReply();
      } else if (grew || (next.thinking && !(prev?.thinking ?? false))) {
        _scrollToEnd();
      }
      if (next.entries.length < (prev?.entries.length ?? 0)) _animatedCount = 0;
    });

    // لوحة المفاتيح: نبقي آخر المحادثة ظاهراً إن كانت الزبونة في أسفلها.
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    if (inset > _lastInset && _scroll.hasClients) {
      final nearEnd = _scroll.position.maxScrollExtent - _scroll.offset < 160;
      if (nearEnd) _scrollToEnd();
    }
    _lastInset = inset;

    final entries = session.entries;
    final animateFrom = _animatedCount;
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
    final lastUserIndex = entries.lastIndexWhere((e) => e is UserEntry);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: const Color(0xFFFFFAFB),
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
                  onProfile: () => showAdvisorProfileSheet(context),
                  onBack: () => context.canPop() ? context.pop() : context.go('/'),
                  onReset: () {
                    HapticFeedback.mediumImpact();
                    _input.clear();
                    _focus.unfocus();
                    _ctl.reset();
                    AppSnackbar.action(
                      context,
                      message: 'بدأتِ محادثة جديدة ✨',
                      actionLabel: 'تراجع',
                      onAction: _ctl.undoReset,
                    );
                  },
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.easeOutCubic,
                  alignment: Alignment.topCenter,
                  child: _notice == null
                      ? const SizedBox(width: double.infinity)
                      : Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                          child: StaggerIn(
                            key: ValueKey(_notice),
                            from: const Offset(0, -10),
                            child: _NoticePill(text: _notice!, onTap: () => showAdvisorProfileSheet(context)),
                          ),
                        ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
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
                                onRetry: _ctl.retry,
                              );
                            }
                            final e = entries[i];
                            final animate = i >= animateFrom;
                            return switch (e) {
                              UserEntry(:final text) => Padding(
                                  key: i == lastUserIndex ? _lastUserKey : null,
                                  padding: const EdgeInsets.only(top: 14, bottom: 4),
                                  child: StaggerIn(
                                    animate: animate,
                                    from: const Offset(-24, 6),
                                    fromScale: 0.96,
                                    duration: const Duration(milliseconds: 380),
                                    child: UserBubble(text: text),
                                  ),
                                ),
                              BotEntry(:final reply) => i == 0
                                  ? AdvisorWelcome(
                                      reply: reply,
                                      prompts: session.prompts,
                                      animate: animate,
                                      onChip: _tapChip,
                                      onPrompt: _send,
                                    )
                                  : _BotTurn(
                                      reply: reply,
                                      animate: animate,
                                      isLast: i == entries.length - 1,
                                      quizActive: quizActive && i == entries.length - 1 && !session.thinking,
                                      onQuizAnswer: (picked) {
                                        _focus.unfocus();
                                        _ctl.answerQuiz(picked);
                                      },
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
                              duration: const Duration(milliseconds: 220),
                              scale: show ? 1 : 0.6,
                              child: AnimatedOpacity(
                                duration: const Duration(milliseconds: 200),
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
                    onClear: _ctl.clearCompare,
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

class _Header extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
      child: Row(
        children: [
          _GlassIcon(icon: Icons.arrow_back_rounded, onTap: onBack, tooltip: 'رجوع'),
          const SizedBox(width: 8),
          AdvisorOrb(size: 38, thinking: thinking),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('ديما', style: AdvisorStyle.text(size: 16.5, weight: FontWeight.w800, height: 1.2)),
                const SizedBox(height: 2),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: Row(
                    key: ValueKey(thinking),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: thinking ? BrandColors.rose : const Color(0xFF2BB673),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        thinking ? 'تكتب…' : 'متاحة الآن',
                        style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.2),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Stack(
            clipBehavior: Clip.none,
            children: [
              _GlassIcon(icon: hasProfile ? Icons.favorite_rounded : Icons.favorite_border_rounded, onTap: onProfile, tooltip: 'ملفكِ الجمالي'),
              if (hasProfile)
                PositionedDirectional(
                  top: 2,
                  end: 2,
                  child: Container(width: 9, height: 9, decoration: BoxDecoration(shape: BoxShape.circle, gradient: AdvisorStyle.gradient, border: Border.all(color: Colors.white, width: 1.5))),
                ),
            ],
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 260),
            transitionBuilder: (c, a) => FadeTransition(opacity: a, child: ScaleTransition(scale: Tween(begin: 0.85, end: 1.0).animate(a), child: c)),
            child: canReset
                ? Padding(
                    key: const ValueKey('new'),
                    padding: const EdgeInsetsDirectional.only(start: 8),
                    child: _NewChatButton(onTap: onReset),
                  )
                : const SizedBox.shrink(key: ValueKey('none')),
          ),
        ],
      ),
    );
  }
}

/// «محادثة جديدة» — زر واضح بنص وأيقونة بدل أيقونة مبهمة.
class _NewChatButton extends StatelessWidget {
  final VoidCallback onTap;
  const _NewChatButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'محادثة جديدة',
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AdvisorStyle.gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.30), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.add_rounded, size: 18, color: Colors.white),
                  const SizedBox(width: 4),
                  Text('محادثة جديدة', style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                ],
              ),
            ),
          ),
        ),
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
          child: SizedBox.square(dimension: 40, child: Icon(icon, size: 20, color: AdvisorStyle.ink)),
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── ما فهمته

class _UnderstoodStrip extends StatelessWidget {
  final List<AdvisorUnderstood> items;
  final bool enabled;
  final ValueChanged<AdvisorUnderstood> onRemove;
  const _UnderstoodStrip({required this.items, required this.enabled, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
        children: [
          Center(
            child: Text('فهمت منكِ:', style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.2)),
          ),
          const SizedBox(width: 6),
          for (final u in items)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 6),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _UnderstoodChip(key: ValueKey(u.key), item: u, enabled: enabled, onRemove: () => onRemove(u)),
              ),
            ),
        ],
      ),
    );
  }
}

class _UnderstoodChip extends StatelessWidget {
  final AdvisorUnderstood item;
  final bool enabled;
  final VoidCallback onRemove;
  const _UnderstoodChip({super.key, required this.item, required this.enabled, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onRemove : null,
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(10, 0, 6, 0),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.86),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEBDDF2)),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(item.label, style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w700, color: const Color(0xFF6A3FA0), height: 1.2)),
            const SizedBox(width: 4),
            Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(color: Color(0xFFF3EAF8), shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, size: 11, color: Color(0xFF8C6BAE)),
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── رد «ديما»

class _BotTurn extends StatelessWidget {
  final AdvisorReply reply;
  final bool animate;
  final bool quizActive;
  final bool isLast;
  final ValueChanged<List<AdvisorChip>> onQuizAnswer;

  const _BotTurn({
    required this.reply,
    required this.animate,
    required this.quizActive,
    required this.isLast,
    required this.onQuizAnswer,
  });

  @override
  Widget build(BuildContext context) {
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
    if (reply.routine != null && reply.routine!.steps.isNotEmpty) card(AdvisorRoutineCard(routine: reply.routine!, animate: animate));
    if (reply.products.isNotEmpty) {
      final similar = reply.products.first.similarity != null;
      card(AdvisorProductRail(
        title: similar
            ? (reply.anchor != null ? 'يشبهه' : 'بنفس البصمة')
            : reply.knowledge != null
                ? 'منتجات متوفرة فيها المكوّن'
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
      card(_AddBestOfEach(products: reply.groups.map((g) => g.products.first).toList()));
    }
    for (final tip in tips) {
      card(TipCard(text: tip));
    }
    final hasPicks = reply.products.isNotEmpty || reply.groups.isNotEmpty || reply.routine != null;
    if (hasPicks) card(_Feedback(reply: reply));

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

/// «هل أفادتكِ؟» — إشارة تتعلم منها «ديما» ترتيبها.
class _Feedback extends ConsumerStatefulWidget {
  final AdvisorReply reply;
  const _Feedback({required this.reply});

  @override
  ConsumerState<_Feedback> createState() => _FeedbackState();
}

class _FeedbackState extends ConsumerState<_Feedback> {
  bool? _liked;

  void _rate(bool liked) {
    if (_liked != null) return;
    HapticFeedback.selectionClick();
    setState(() => _liked = liked);
    ref.read(advisorProvider.notifier).rate(widget.reply, liked);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 52, end: 16),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _liked != null
            ? Align(
                key: const ValueKey('done'),
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  _liked! ? 'شكراً! راح أتذكر ذوقكِ 💜' : 'شكراً لصراحتكِ — جربي «غيرهم» أو وضحيلي أكثر',
                  style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.4),
                ),
              )
            : Row(
                key: const ValueKey('ask'),
                children: [
                  Text('أفادتكِ الترشيحات؟', style: AdvisorStyle.text(size: 12, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.2)),
                  const SizedBox(width: 6),
                  _Thumb(icon: Icons.thumb_up_alt_outlined, onTap: () => _rate(true)),
                  _Thumb(icon: Icons.thumb_down_alt_outlined, onTap: () => _rate(false)),
                ],
              ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _Thumb({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      radius: 20,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 17, color: AdvisorStyle.inkMuted),
      ),
    );
  }
}

class _AddBestOfEach extends ConsumerStatefulWidget {
  final List<AdvisorProduct> products;
  const _AddBestOfEach({required this.products});

  @override
  ConsumerState<_AddBestOfEach> createState() => _AddBestOfEachState();
}

class _AddBestOfEachState extends ConsumerState<_AddBestOfEach> {
  bool _busy = false;
  bool _done = false;

  @override
  Widget build(BuildContext context) {
    final total = widget.products.fold<int>(0, (a, p) => a + p.price);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GestureDetector(
        onTap: _busy || _done
            ? null
            : () async {
                setState(() => _busy = true);
                final added = await advisorAddRoutine(context, ref, widget.products);
                if (!mounted) return;
                for (final p in widget.products.take(added)) {
                  ref.read(advisorProvider.notifier).track('cart', productId: p.id);
                }
                setState(() {
                  _busy = false;
                  _done = added > 0;
                });
              },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          height: 50,
          decoration: BoxDecoration(
            gradient: _done ? null : AdvisorStyle.gradient,
            color: _done ? const Color(0xFFE9F7EF) : null,
            borderRadius: BorderRadius.circular(18),
            boxShadow: _done ? null : [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.3), blurRadius: 14, offset: const Offset(0, 5))],
          ),
          alignment: Alignment.center,
          child: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
              : Text(
                  _done ? 'أُضيفت للسلة ✓' : 'أضيفي الأفضل من كل نوع  •  ${formatPrice(total)}',
                  style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, color: _done ? const Color(0xFF137A48) : Colors.white, height: 1.2),
                ),
        ),
      ),
    );
  }
}

class _Tail extends StatelessWidget {
  final bool thinking;
  final String? error;
  final VoidCallback onRetry;
  const _Tail({required this.thinking, required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 260),
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
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F3),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF8D5DC)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.wifi_off_rounded, size: 18, color: Color(0xFFD0506E)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(error!, style: AdvisorStyle.text(size: 12.5, weight: FontWeight.w600, color: const Color(0xFF9A3550), height: 1.4)),
                        ),
                        TextButton(
                          onPressed: onRetry,
                          child: Text('إعادة', style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, color: BrandColors.rose, height: 1.2)),
                        ),
                      ],
                    ),
                  ),
                )
              : const SizedBox(key: ValueKey('n'), height: 4),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String? error;
  final VoidCallback onRetry;
  const _EmptyState({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AdvisorOrb(size: 108, thinking: error == null),
            const SizedBox(height: 18),
            Text(
              error == null ? 'ديما تستعد لكِ…' : error!,
              textAlign: TextAlign.center,
              style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w700, color: error == null ? AdvisorStyle.inkSoft : AdvisorStyle.ink),
            ),
            if (error != null) ...[
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: onRetry,
                style: FilledButton.styleFrom(
                  backgroundColor: BrandColors.orchid,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                ),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text('حاولي مجدداً', style: AdvisorStyle.text(size: 14, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── الإدخال

class _Composer extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final keyboard = MediaQuery.viewInsetsOf(context).bottom > 0;
    final canSend = hasText && !busy;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [const Color(0xFFFFFAFB).withValues(alpha: 0), const Color(0xFFFFFAFB).withValues(alpha: 0.92)],
          stops: const [0, 0.35],
        ),
      ),
      padding: EdgeInsets.only(bottom: keyboard ? 8 : (bottom > 0 ? bottom : 10)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedSize(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
            child: chips.isEmpty
                ? const SizedBox(width: double.infinity)
                : SizedBox(
                    height: 46,
                    child: ListView.separated(
                      key: ValueKey(chipsKey),
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
                      itemCount: chips.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) => StaggerIn(
                        index: i,
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
                      onSubmitted: (_) => onSend(null),
                      style: AdvisorStyle.text(size: 14.5, weight: FontWeight.w500, height: 1.45),
                      cursorColor: BrandColors.orchid,
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        filled: false,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        hintText: 'اسألي ديما… مثل «عطر خشبي للسهرة»',
                        hintStyle: AdvisorStyle.text(size: 13.5, color: AdvisorStyle.inkMuted, height: 1.45),
                      ),
                    ),
                  ),
                  // مسح باركود منتج: يظهر حين لا نص (المساحة للكتابة حين تكتب).
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    transitionBuilder: (c, a) => FadeTransition(opacity: a, child: ScaleTransition(scale: a, child: c)),
                    child: hasText
                        ? const SizedBox.shrink()
                        : Padding(
                            key: const ValueKey('scan'),
                            padding: const EdgeInsetsDirectional.only(start: 4, bottom: 3),
                            child: Tooltip(
                              message: 'امسحي باركود منتج — هل يناسبني؟',
                              child: InkResponse(
                                onTap: busy ? null : onScan,
                                radius: 22,
                                child: Container(
                                  width: 38,
                                  height: 38,
                                  alignment: Alignment.center,
                                  decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFF7F0FC)),
                                  child: const Icon(Icons.qr_code_scanner_rounded, size: 19, color: BrandColors.orchid),
                                ),
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(width: 6),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 1),
                    child: GestureDetector(
                      onTap: canSend ? () => onSend(null) : null,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 240),
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
                          duration: const Duration(milliseconds: 200),
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
          border: Border.all(color: primary ? const Color(0xFFEBD3EE) : AdvisorStyle.glassBorder),
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
                    color: primary ? const Color(0xFF6A3FA0) : AdvisorStyle.ink,
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
  final VoidCallback onTap;
  const _NoticePill({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
            Text('تعديل', style: AdvisorStyle.text(size: 12, weight: FontWeight.w800, color: BrandColors.roseLight, height: 1.2)),
          ],
        ),
      ),
    );
  }
}

class _JumpButton extends StatelessWidget {
  final VoidCallback onTap;
  const _JumpButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(side: BorderSide(color: AdvisorStyle.glassBorder)),
      elevation: 3,
      shadowColor: BrandColors.orchid.withValues(alpha: 0.3),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: const SizedBox.square(dimension: 42, child: Icon(Icons.keyboard_arrow_down_rounded, color: BrandColors.orchid, size: 26)),
      ),
    );
  }
}

/// سلة المقارنة: صور مصغرة لما اختارته + «قارني الآن».
class _CompareTray extends StatelessWidget {
  final List<AdvisorProduct> items;
  final bool busy;
  final ValueChanged<AdvisorProduct> onRemove;
  final VoidCallback onClear;
  final VoidCallback onCompare;
  const _CompareTray({required this.items, required this.busy, required this.onRemove, required this.onClear, required this.onCompare});

  @override
  Widget build(BuildContext context) {
    final ready = items.length >= 2 && !busy;
    return StaggerIn(
      from: const Offset(0, 16),
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 4, 12, 2),
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFEBD3EE)),
          boxShadow: AdvisorStyle.shadow(1),
        ),
        child: Row(
          children: [
            const SizedBox(width: 4),
            const Icon(Icons.balance_rounded, size: 18, color: BrandColors.orchid),
            const SizedBox(width: 6),
            for (final p in items)
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 6),
                child: GestureDetector(
                  onTap: () => onRemove(p),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(color: const Color(0xFFFAF6FC), borderRadius: BorderRadius.circular(12)),
                        child: AppNetworkImage(url: p.image, fit: BoxFit.contain),
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
            const Spacer(),
            if (items.length < 2)
              Text('اختاري منتجاً آخر', style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.2)),
            const SizedBox(width: 6),
            GestureDetector(
              onTap: ready ? onCompare : null,
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 200),
                opacity: ready ? 1 : 0.45,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(gradient: AdvisorStyle.gradient, borderRadius: BorderRadius.circular(16)),
                  child: Text('قارني (${items.length})', style: AdvisorStyle.text(size: 13, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
