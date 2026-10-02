import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/profile/widgets/profile_ui.dart';
import 'assistant_provider.dart';
import 'widgets/assistant_message_bubble.dart';
import 'widgets/fidda_avatar.dart';

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    });
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _input.text).trim();
    if (text.isEmpty || ref.read(assistantBusyProvider)) return;
    HapticFeedback.lightImpact();
    _input.clear();
    await ref.read(assistantProvider.notifier).send(text);
    _scrollToBottom();
  }

  void _newChat() {
    HapticFeedback.selectionClick();
    ref.read(assistantProvider.notifier).reset();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final isAr = ref.watch(languageCodeProvider) == 'ar';

    if (!auth.isAuthenticated) {
      return ProfileScaffold(
        title: isAr ? 'فضه' : 'Fidda',
        body: ProfileEmptyState(
          icon: Icons.auto_awesome_rounded,
          title: isAr ? 'سجّلي حساباً حتى تحجين ويا فضه' : 'Create an account to chat with Fidda',
          subtitle: isAr
              ? 'فضه مستشارة الجمال: تفهم شعرج وبشرتج وتبنيلج روتين من منتجات المتجر.'
              : 'Fidda understands your hair and skin and builds a routine from the store.',
          action: Column(
            children: [
              ProfilePrimaryButton(label: isAr ? 'تسجيل الدخول' : 'Sign in', onPressed: () => context.push('/login')),
              const SizedBox(height: 10),
              ProfileOutlineButton(label: isAr ? 'إنشاء حساب' : 'Create account', onPressed: () => context.push('/register')),
            ],
          ),
        ),
      );
    }

    final messages = ref.watch(assistantProvider);
    final busy = ref.watch(assistantBusyProvider);
    ref.listen(assistantProvider, (_, __) => _scrollToBottom());

    return DecoratedBox(
      decoration: const BoxDecoration(gradient: AppColors.homeBackgroundGradient),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _AssistantHeader(isAr: isAr, busy: busy, onNewChat: messages.isEmpty ? null : _newChat),
            Expanded(
              child: messages.isEmpty
                  ? _WelcomePanel(isAr: isAr, onPick: _send)
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.fromLTRB(0, 12, 0, 16),
                      itemCount: messages.length,
                      itemBuilder: (_, i) {
                        final message = messages[i];
                        final previous = i > 0 ? messages[i - 1] : null;
                        final notifier = ref.read(assistantProvider.notifier);
                        return AssistantMessageBubble(
                          message: message,
                          onSuggestionTap: busy ? null : _send,
                          onRetry: message.isError && previous != null && previous.isUser ? () => _send(previous.text) : null,
                          retryLabel: isAr ? 'إعادة المحاولة' : 'Try again',
                          advisorName: isAr ? 'فضه' : 'Fidda',
                          onRate: (rating, note) => notifier.rate(message.id, rating, note: note),
                          onProductOpen: (productId) => notifier.productOpened(message.turnId, productId),
                          onProductCarted: (productId) => notifier.productCarted(message.turnId, productId),
                        );
                      },
                    ),
            ),
            _Composer(controller: _input, isAr: isAr, busy: busy, onSend: () => _send()),
          ],
        ),
      ),
    );
  }
}

class _AssistantHeader extends StatelessWidget {
  final bool isAr;
  final bool busy;
  final VoidCallback? onNewChat;
  const _AssistantHeader({required this.isAr, required this.busy, this.onNewChat});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.94),
        border: Border(bottom: BorderSide(color: AppColors.hairline.withValues(alpha: 0.85))),
        boxShadow: AppColors.cardShadow,
      ),
      child: Row(
        children: [
          const FiddaAvatar(size: 42, online: true),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAr ? 'فضه' : 'Fidda',
                  style: const TextStyle(color: AppColors.ink, fontSize: 18, fontWeight: FontWeight.w900, height: 1.1),
                ),
                const SizedBox(height: 2),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Text(
                    busy ? (isAr ? 'تكتب…' : 'typing…') : (isAr ? 'مستشارة الجمال · متصلة' : 'Beauty advisor · online'),
                    key: ValueKey(busy),
                    style: TextStyle(
                      color: busy ? AppColors.primary : AppColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (onNewChat != null)
            TextButton.icon(
              onPressed: onNewChat,
              style: TextButton.styleFrom(foregroundColor: AppColors.ink),
              icon: const Icon(Icons.edit_note_rounded, size: 20),
              label: Text(isAr ? 'محادثة جديدة' : 'New chat', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
            ),
        ],
      ),
    );
  }
}

class _Topic {
  final IconData icon;
  final String title;
  final String hint;
  final String prompt;
  final Color tint;
  const _Topic(this.icon, this.title, this.hint, this.prompt, this.tint);
}

class _WelcomePanel extends StatelessWidget {
  final bool isAr;
  final ValueChanged<String> onPick;
  const _WelcomePanel({required this.isAr, required this.onPick});

  static const _topics = [
    _Topic(Icons.face_retouching_natural_rounded, 'البشرة', 'تفتيح، حبوب، جفاف', 'اريد روتين للبشرة', Color(0xFFFDEAF2)),
    _Topic(Icons.spa_rounded, 'الشعر', 'تساقط، قشرة، دهون', 'اريد شي للشعر', Color(0xFFF6F0FE)),
    _Topic(Icons.local_florist_rounded, 'العطور', 'نسائي، رجالي، هدايا', 'اريد عطر', Color(0xFFFBF8FF)),
    _Topic(Icons.card_giftcard_rounded, 'هدية', 'لأمج، صديقتج، زوجج', 'اريد هدية', Color(0xFFEFE6FC)),
  ];

  static const _examples = [
    'شعري يطيح ويا الغسلة شنو أستخدم؟',
    'روتين كامل لبشرة دهنية',
    'عطر نسائي أقل من 50 ألف',
    'شنو تعرفين عني؟',
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 22, 18, 20),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: AppColors.signatureGradient,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.28),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                ),
                child: const Text('ف', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isAr ? 'هلا، أنا فضه' : "Hi, I'm Fidda",
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      isAr
                          ? 'احكيلي عن شعرج أو بشرتج، وأبنيلج خطة من منتجات المتجر بأسعارها.'
                          : 'Tell me about your hair or skin and I will build a plan from the store.',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13, height: 1.5, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Text(
          isAr ? 'من وين نبدي؟' : 'Where do we start?',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.ink),
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.55,
          children: [
            for (final topic in _topics)
              Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () => onPick(topic.prompt),
                  child: Ink(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.hairline.withValues(alpha: 0.85)),
                      boxShadow: AppColors.cardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(color: topic.tint, borderRadius: BorderRadius.circular(12)),
                          child: Icon(topic.icon, size: 20, color: AppColors.primaryDark),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(topic.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.ink)),
                            Text(
                              topic.hint,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 22),
        Text(
          isAr ? 'أو اسأليني مباشرة' : 'Or just ask',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.ink),
        ),
        const SizedBox(height: 10),
        for (final example in _examples)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => onPick(example),
                child: Ink(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.hairline.withValues(alpha: 0.85)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.chat_bubble_outline_rounded, size: 17, color: AppColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(example, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
                      ),
                      Icon(
                        Directionality.of(context) == TextDirection.rtl ? Icons.arrow_back_ios_new_rounded : Icons.arrow_forward_ios_rounded,
                        size: 13,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_outline_rounded, size: 13, color: AppColors.textMuted),
            const SizedBox(width: 5),
            Text(
              isAr ? 'فضه تقترح من منتجات المتجر فقط وبأسعارها الحقيقية' : 'Fidda only suggests real store products and prices',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
            ),
          ],
        ),
      ],
    );
  }
}

class _Composer extends StatefulWidget {
  final TextEditingController controller;
  final bool isAr;
  final bool busy;
  final VoidCallback onSend;

  const _Composer({required this.controller, required this.isAr, required this.busy, required this.onSend});

  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_sync);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_sync);
    super.dispose();
  }

  void _sync() {
    final has = widget.controller.text.trim().isNotEmpty;
    if (has != _hasText) setState(() => _hasText = has);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final canSend = _hasText && !widget.busy;
    return Container(
      padding: EdgeInsets.fromLTRB(12, 10, 12, bottom + 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.hairline.withValues(alpha: 0.7))),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDeep.withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Container(
        padding: const EdgeInsetsDirectional.only(start: 14, end: 5, top: 4, bottom: 4),
        decoration: BoxDecoration(
          color: AppColors.elevated,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AppColors.primarySoft),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: widget.controller,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => canSend ? widget.onSend() : null,
                style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: widget.isAr ? 'اكتبي لفضه… مثلاً: بشرتي دهنية وعندي حبوب' : 'Message Fidda…',
                  hintStyle: const TextStyle(fontSize: 13.5, color: AppColors.textMuted, fontWeight: FontWeight.w600),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 11),
                ),
              ),
            ),
            const SizedBox(width: 6),
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: canSend ? AppColors.signatureGradient : null,
                color: canSend ? null : AppColors.primarySoft,
              ),
              child: Material(
                color: Colors.transparent,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: canSend ? widget.onSend : null,
                  child: widget.busy
                      ? const Padding(
                          padding: EdgeInsets.all(11),
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.send_rounded, size: 19, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
