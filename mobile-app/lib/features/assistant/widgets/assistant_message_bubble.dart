import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../cart/cart_provider.dart';
import '../assistant_models.dart';
import 'assistant_product_card.dart';
import 'fidda_avatar.dart';

class AssistantMessageBubble extends StatelessWidget {
  final AssistantChatMessage message;
  final ValueChanged<String>? onSuggestionTap;
  final VoidCallback? onRetry;
  final String retryLabel;
  final String advisorName;
  final void Function(int rating, String? note)? onRate;
  final ValueChanged<String>? onProductOpen;
  final ValueChanged<String>? onProductCarted;

  const AssistantMessageBubble({
    super.key,
    required this.message,
    this.onSuggestionTap,
    this.onRetry,
    this.retryLabel = 'إعادة المحاولة',
    this.advisorName = 'فضه',
    this.onRate,
    this.onProductOpen,
    this.onProductCarted,
  });

  @override
  Widget build(BuildContext context) {
    if (message.isUser) return _UserBubble(text: message.text);
    if (message.isLoading) return _TypingBubble(advisorName: advisorName);
    return _AssistantBubble(
      message: message,
      onSuggestionTap: onSuggestionTap,
      onRetry: onRetry,
      retryLabel: retryLabel,
      advisorName: advisorName,
      onRate: onRate,
      onProductOpen: onProductOpen,
      onProductCarted: onProductCarted,
    );
  }
}

class _UserBubble extends StatelessWidget {
  final String text;
  const _UserBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: AlignmentDirectional.centerEnd,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
        margin: const EdgeInsetsDirectional.only(start: 56, end: 14, top: 4, bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
        decoration: BoxDecoration(
          gradient: AppColors.signatureGradient,
          borderRadius: const BorderRadiusDirectional.only(
            topStart: Radius.circular(20),
            topEnd: Radius.circular(20),
            bottomStart: Radius.circular(20),
            bottomEnd: Radius.circular(6),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.28),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 14.5, height: 1.45, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _AssistantBubble extends StatelessWidget {
  final AssistantChatMessage message;
  final ValueChanged<String>? onSuggestionTap;
  final VoidCallback? onRetry;
  final String retryLabel;
  final String advisorName;
  final void Function(int rating, String? note)? onRate;
  final ValueChanged<String>? onProductOpen;
  final ValueChanged<String>? onProductCarted;

  const _AssistantBubble({
    required this.message,
    this.onSuggestionTap,
    this.onRetry,
    required this.retryLabel,
    required this.advisorName,
    this.onRate,
    this.onProductOpen,
    this.onProductCarted,
  });

  @override
  Widget build(BuildContext context) {
    final hasProducts = message.products.isNotEmpty;
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.only(start: 12, end: 40),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const FiddaAvatar(size: 30),
                const SizedBox(width: 8),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(14, 11, 14, 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadiusDirectional.only(
                        topStart: Radius.circular(20),
                        topEnd: Radius.circular(20),
                        bottomStart: Radius.circular(6),
                        bottomEnd: Radius.circular(20),
                      ),
                      border: Border.all(
                        color: message.isError
                            ? AppColors.sale.withValues(alpha: 0.35)
                            : AppColors.hairline.withValues(alpha: 0.85),
                      ),
                      boxShadow: AppColors.cardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          advisorName,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primary),
                        ),
                        const SizedBox(height: 3),
                        SelectableText(
                          message.text,
                          style: TextStyle(
                            fontSize: 14.5,
                            height: 1.55,
                            fontWeight: FontWeight.w600,
                            color: message.isError ? AppColors.sale : AppColors.ink,
                          ),
                        ),
                        if (message.isError && onRetry != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: TextButton.icon(
                              onPressed: onRetry,
                              icon: const Icon(Icons.refresh_rounded, size: 16),
                              label: Text(retryLabel, style: const TextStyle(fontWeight: FontWeight.w800)),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (hasProducts) ...[
            if (message.isRoutine)
              _RoutineHeader(message: message, onProductCarted: onProductCarted)
            else
              const SizedBox(height: 10),
            SizedBox(
              height: 292,
              child: ListView.separated(
                padding: const EdgeInsetsDirectional.only(start: 50, end: 14),
                scrollDirection: Axis.horizontal,
                itemCount: message.products.length,
                separatorBuilder: (_, __) => message.isRoutine ? const _StepArrow() : const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final product = message.products[i];
                  return AssistantProductCard(
                    product: product,
                    step: message.steps[product.id],
                    onOpen: onProductOpen == null ? null : () => onProductOpen!(product.id),
                    onCarted: onProductCarted == null ? null : () => onProductCarted!(product.id),
                  );
                },
              ),
            ),
          ],
          if (message.suggestions.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 50, end: 14, top: 10),
              child: hasProducts
                  ? _FollowUps(suggestions: message.suggestions, onTap: onSuggestionTap)
                  : _ChoicePicker(choices: message.suggestions, onSend: onSuggestionTap),
            ),
          if (!message.isError && message.turnId != null && onRate != null)
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 44, end: 8),
              child: _RatingRow(rating: message.rating, onRate: onRate!),
            ),
        ],
      ),
    );
  }
}

class _StepArrow extends StatelessWidget {
  const _StepArrow();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      child: Center(
        child: Icon(
          Directionality.of(context) == TextDirection.rtl ? Icons.chevron_left_rounded : Icons.chevron_right_rounded,
          color: AppColors.primary.withValues(alpha: 0.5),
          size: 22,
        ),
      ),
    );
  }
}

class _RoutineHeader extends ConsumerWidget {
  final AssistantChatMessage message;
  final ValueChanged<String>? onProductCarted;
  const _RoutineHeader({required this.message, this.onProductCarted});

  void _addAll(BuildContext context, WidgetRef ref) {
    HapticFeedback.mediumImpact();
    final cart = ref.read(cartProvider.notifier);
    var added = 0;
    var needShade = 0;
    for (final product in message.products) {
      if (!product.inStock) continue;
      if (product.hasDisplayableShades || product.shadeCount > 1) {
        needShade++;
        continue;
      }
      if (cart.add(product, shade: product.soleDisplayableShade)) {
        added++;
        onProductCarted?.call(product.id);
      }
    }
    if (added == 0) {
      AppSnackbar.error(context, needShade > 0 ? 'اختاري اللون من صفحة المنتج أول' : 'المنتجات بالسلة أو نفدت');
      return;
    }
    AppSnackbar.cartAdded(
      context,
      title: needShade > 0 ? 'انضافت $added خطوات. الباقي يحتاج اختيار لون' : 'انضاف الروتين كله للسلة',
      viewCartLabel: 'السلة',
      onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final total = message.products.fold<int>(0, (sum, product) => sum + product.price);
    return Container(
      margin: const EdgeInsetsDirectional.only(start: 50, end: 14, top: 10, bottom: 10),
      padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primarySoft),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome_rounded, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'روتينج بـ ${message.products.length} خطوات',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppColors.ink),
                ),
                Text(
                  'المجموع ${formatPrice(total)}',
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: AppColors.signatureGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                visualDensity: VisualDensity.compact,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => _addAll(context, ref),
              icon: const Icon(Icons.add_shopping_cart_rounded, size: 16),
              label: const Text('أضيفي الكل', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}

class _FollowUps extends StatelessWidget {
  final List<String> suggestions;
  final ValueChanged<String>? onTap;
  const _FollowUps({required this.suggestions, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final suggestion in suggestions)
          ActionChip(
            avatar: const Icon(Icons.subdirectory_arrow_left_rounded, size: 14, color: AppColors.primary),
            label: Text(suggestion, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            backgroundColor: AppColors.elevated,
            side: BorderSide(color: AppColors.primarySoft),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
            onPressed: onTap == null ? null : () => onTap!(suggestion),
          ),
      ],
    );
  }
}

class _RatingRow extends StatelessWidget {
  final int? rating;
  final void Function(int rating, String? note) onRate;
  const _RatingRow({required this.rating, required this.onRate});

  static const _reasons = ['المنتج مو مناسب', 'ما فهمت طلبي', 'السعر مو مناسب', 'الجواب طويل', 'معلومة غلط'];

  Future<void> _dislike(BuildContext context) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (sheet) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('شنو اللي ما عجبج؟', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              const Text('جوابج يساعد فضه تتحسن.', style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final reason in _reasons) ActionChip(label: Text(reason), onPressed: () => Navigator.pop(sheet, reason)),
                ],
              ),
              const SizedBox(height: 8),
              TextButton(onPressed: () => Navigator.pop(sheet, ''), child: const Text('بدون سبب')),
            ],
          ),
        ),
      ),
    );
    if (reason == null) return;
    onRate(-1, reason.isEmpty ? null : reason);
  }

  @override
  Widget build(BuildContext context) {
    final idle = AppColors.textMuted;
    return Row(
      children: [
        IconButton(
          visualDensity: VisualDensity.compact,
          iconSize: 17,
          tooltip: 'جواب زين',
          onPressed: rating == 1 ? null : () => onRate(1, null),
          icon: Icon(rating == 1 ? Icons.thumb_up_alt_rounded : Icons.thumb_up_alt_outlined,
              color: rating == 1 ? AppColors.success : idle),
        ),
        IconButton(
          visualDensity: VisualDensity.compact,
          iconSize: 17,
          tooltip: 'جواب مو زين',
          onPressed: rating == -1 ? null : () => _dislike(context),
          icon: Icon(rating == -1 ? Icons.thumb_down_alt_rounded : Icons.thumb_down_alt_outlined,
              color: rating == -1 ? AppColors.sale : idle),
        ),
        if (rating != null)
          const Text('شكراً على رأيج', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
      ],
    );
  }
}

class _ChoicePicker extends StatefulWidget {
  final List<String> choices;
  final ValueChanged<String>? onSend;
  const _ChoicePicker({required this.choices, required this.onSend});

  @override
  State<_ChoicePicker> createState() => _ChoicePickerState();
}

class _ChoicePickerState extends State<_ChoicePicker> {
  final selected = <String>{};
  bool sent = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 7,
          runSpacing: 7,
          children: [
            for (final choice in widget.choices)
              FilterChip(
                label: Text(choice, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                selected: selected.contains(choice),
                showCheckmark: true,
                checkmarkColor: Colors.white,
                selectedColor: AppColors.primary,
                backgroundColor: AppColors.elevated,
                labelStyle: TextStyle(color: selected.contains(choice) ? Colors.white : AppColors.ink),
                side: BorderSide(
                  color: selected.contains(choice) ? AppColors.primary : AppColors.hairline,
                ),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
                onSelected: widget.onSend == null || sent
                    ? null
                    : (on) => setState(() {
                          HapticFeedback.selectionClick();
                          if (on) {
                            selected.add(choice);
                          } else {
                            selected.remove(choice);
                          }
                        }),
              ),
          ],
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 180),
          child: selected.isEmpty || sent
              ? const SizedBox(width: double.infinity)
              : Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: AppColors.signatureGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: widget.onSend == null
                          ? null
                          : () {
                              setState(() => sent = true);
                              widget.onSend!(selected.join(' و '));
                            },
                      icon: const Icon(Icons.check_rounded, size: 18),
                    label: Text(
                      selected.length == 1 ? 'تمام، اختاري على هذا' : 'تمام، اختاري على ${selected.length} مشاكل',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                ),
        ),
      ],
    );
  }
}

class _TypingBubble extends StatelessWidget {
  final String advisorName;
  const _TypingBubble({required this.advisorName});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 12, top: 4, bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          const FiddaAvatar(size: 30),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadiusDirectional.only(
                topStart: Radius.circular(20),
                topEnd: Radius.circular(20),
                bottomStart: Radius.circular(6),
                bottomEnd: Radius.circular(20),
              ),
              border: Border.all(color: AppColors.hairline.withValues(alpha: 0.85)),
              boxShadow: AppColors.cardShadow,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const _TypingDots(),
                const SizedBox(width: 8),
                Text(
                  '$advisorName تختارلج…',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  const _TypingDots();

  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 14,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (i) {
          return AnimatedBuilder(
            animation: _controller,
            builder: (_, __) {
              final t = (_controller.value + i * 0.2) % 1.0;
              final lift = (t < 0.5 ? t : 1 - t) * 2;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: 7,
                height: 7,
                transform: Matrix4.translationValues(0, -3 * lift, 0),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.35 + 0.5 * lift),
                  shape: BoxShape.circle,
                ),
              );
            },
          );
        }),
      ),
    );
  }
}
