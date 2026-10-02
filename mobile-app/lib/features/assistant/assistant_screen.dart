import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../home/widgets/home_theme.dart';
import '../orders/order_detail_screen.dart';
import '../products/product_detail_screen.dart';
import 'assistant_history_screen.dart';
import 'assistant_providers.dart';
import 'models/assistant_models.dart';

const _border = AppColors.border;

/// بطاقة منتج مدمجة داخل محادثة المساعد.
class AssistantProductCardView extends ConsumerStatefulWidget {
  final AssistantProductCard card;
  final bool isArabic;

  const AssistantProductCardView({
    super.key,
    required this.card,
    required this.isArabic,
  });

  @override
  ConsumerState<AssistantProductCardView> createState() =>
      _AssistantProductCardViewState();
}

class _AssistantProductCardViewState
    extends ConsumerState<AssistantProductCardView> {
  bool _adding = false;

  @override
  Widget build(BuildContext context) {
    final card = widget.card;
    final isArabic = widget.isArabic;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(
                idOrSlug: card.slug.isNotEmpty ? card.slug : card.id),
          ),
        ),
        child: Container(
          width: 158,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
            boxShadow: [
              BoxShadow(
                color: HomeTheme.ink.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (card.imageUrl != null && card.imageUrl!.isNotEmpty)
                        Hero(
                          tag: 'product-image-${card.id}',
                          child: CachedNetworkImage(
                            imageUrl: assistantImageUrl(card.imageUrl),
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: HomeTheme.canvas),
                            errorWidget: (_, __, ___) =>
                                Container(color: HomeTheme.canvas),
                          ),
                        )
                      else
                        Container(color: HomeTheme.canvas),
                      if (!card.inStock)
                        Positioned.fill(
                          child: ColoredBox(
                            color: Colors.black.withValues(alpha: 0.45),
                            child: Center(
                              child: Text(
                                isArabic ? 'غير متوفر' : 'Out of stock',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        )
                      else if (card.discountPercent > 0)
                        PositionedDirectional(
                          top: 4,
                          end: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF6B6B), Color(0xFFE63946)],
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '-${card.discountPercent}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 6),
              if (card.brandName.isNotEmpty)
                Text(
                  card.brandName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.black45,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              Text(
                card.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.25,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                formatPrice(card.price),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: HomeTheme.accentDark,
                ),
              ),
              if (card.oldPrice > card.price)
                Text(
                  formatPrice(card.oldPrice),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: Colors.black38,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              const SizedBox(height: 6),
              SizedBox(
                height: 30,
                child: _AddToCartButton(card: card, isArabic: isArabic, adding: _adding,
                  onTap: () async {
                    if (_adding) return;
                    setState(() => _adding = true);
                    final ok = await ref
                        .read(assistantProvider.notifier)
                        .addToCart(card);
                    if (!mounted) return;
                    setState(() => _adding = false);
                    if (!ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            isArabic
                                ? 'تعذرت الإضافة — جرب من صفحة المنتج'
                                : 'Could not add — try the product page',
                          ),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AddToCartButton extends StatelessWidget {
  final AssistantProductCard card;
  final bool isArabic;
  final bool adding;
  final Future<void> Function() onTap;

  const _AddToCartButton({
    required this.card,
    required this.isArabic,
    required this.adding,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = card.inStock && !adding;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      decoration: BoxDecoration(
        gradient: enabled
            ? const LinearGradient(colors: [HomeTheme.accent, HomeTheme.accentDark])
            : null,
        color: enabled ? null : _border,
        borderRadius: BorderRadius.circular(9),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(9),
          onTap: enabled ? () { HapticFeedback.selectionClick(); onTap(); } : null,
          child: Center(
            child: adding
                ? const SizedBox(
                    width: 13,
                    height: 13,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.add_shopping_cart,
                        size: 13,
                        color: enabled ? Colors.white : Colors.black26,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isArabic ? 'للسلة' : 'Add',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: enabled ? Colors.white : Colors.black26,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// بطاقة طلب داخل الشات — تعرض الحالة والمجموع وتفتح تفاصيل الطلب.
class AssistantOrderCardView extends StatelessWidget {
  final AssistantOrderCard card;
  final bool isArabic;

  const AssistantOrderCardView({super.key, required this.card, this.isArabic = true});

  String get _localizedStatus {
    if (isArabic) return card.statusLabel;
    const en = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'PROCESSING': 'Preparing',
      'SHIPPED': 'Shipped',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'REFUNDED': 'Refunded',
    };
    return en[card.status] ?? card.status;
  }

  Color get _statusColor {
    switch (card.status) {
      case 'DELIVERED':
        return const Color(0xFF2E7D32);
      case 'CANCELLED':
      case 'REFUNDED':
        return Colors.red.shade600;
      case 'SHIPPED':
        return const Color(0xFF1565C0);
      default:
        return const Color(0xFFB26A00);
    }
  }

  IconData get _statusIcon {
    switch (card.status) {
      case 'DELIVERED':
        return Icons.check_circle_outline;
      case 'SHIPPED':
        return Icons.local_shipping_outlined;
      case 'CANCELLED':
      case 'REFUNDED':
        return Icons.cancel_outlined;
      default:
        return Icons.schedule;
    }
  }

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(card.createdAt);
    final dateLabel = date != null
        ? '${date.year}/${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}'
        : '';
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: card.id)),
        ),
        child: Container(
          width: 216,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
            boxShadow: [
              BoxShadow(
                color: HomeTheme.ink.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: _statusColor.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_statusIcon, size: 16, color: _statusColor),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      card.orderNumber,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _localizedStatus,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: _statusColor,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${formatPrice(card.total)} • ${card.itemCount} أصناف',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              if (dateLabel.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  dateLabel,
                  style: const TextStyle(fontSize: 10.5, color: Colors.black45),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// صف بطاقات المساعد القابل للسحب أفقياً.
class AssistantProductRow extends StatelessWidget {
  final List<AssistantProductCard> products;
  final bool isArabic;

  const AssistantProductRow({
    super.key,
    required this.products,
    required this.isArabic,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 272,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(vertical: 4),
        itemCount: products.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => AssistantProductCardView(
          card: products[i],
          isArabic: isArabic,
        ),
      ),
    );
  }
}

/// صف بطاقات الطلبات القابل للسحب أفقياً.
class AssistantOrderRow extends StatelessWidget {
  final List<AssistantOrderCard> orders;
  final bool isArabic;

  const AssistantOrderRow({super.key, required this.orders, this.isArabic = true});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 138,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(vertical: 4),
        itemCount: orders.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => AssistantOrderCardView(card: orders[i], isArabic: isArabic),
      ),
    );
  }
}

/// فقاعة رسالة مع حركة دخول ناعمة (ظهور + انزلاق بسيط).
class _AnimatedMessage extends StatelessWidget {
  final String keyId;
  final Widget child;

  const _AnimatedMessage({required this.keyId, required this.child});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      key: ValueKey('msg-$keyId'),
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      builder: (context, double value, child) => Opacity(
        opacity: value.clamp(0, 1),
        child: Transform.translate(
          offset: Offset(0, (1 - value) * 12),
          child: child,
        ),
      ),
      child: child,
    );
  }
}

/// فقاعة رسالة المساعد/المستخدم مع الردود السريعة والتقييم.
class AssistantBubble extends ConsumerWidget {
  final AssistantMessage message;

  const AssistantBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = ref.watch(stringsProvider);
    final sending = ref.watch(assistantProvider.select((s) => s.sending));
    final isUser = message.role == AssistantRole.user;
    final alignment = isUser ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart;

    return _AnimatedMessage(
      keyId: message.key,
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Align(
            alignment: alignment,
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.82,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                gradient: isUser
                    ? const LinearGradient(
                        begin: AlignmentDirectional.topStart,
                        end: AlignmentDirectional.bottomEnd,
                        colors: [HomeTheme.accent, HomeTheme.accentDark],
                      )
                    : null,
                color: isUser ? null : Colors.white,
                borderRadius: BorderRadiusDirectional.only(
                  topStart: const Radius.circular(18),
                  topEnd: const Radius.circular(18),
                  bottomStart: Radius.circular(isUser ? 18 : 4),
                  bottomEnd: Radius.circular(isUser ? 4 : 18),
                ),
                border: isUser ? null : Border.all(color: _border),
                boxShadow: isUser
                    ? [
                        BoxShadow(
                          color: HomeTheme.accent.withValues(alpha: 0.25),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: HomeTheme.ink.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
              ),
              child: message.isStreaming && message.text.isEmpty
                  ? _StreamingIndicator(label: message.statusLabel)
                  : Text(
                      message.text,
                      style: TextStyle(
                        fontSize: 14.5,
                        height: 1.5,
                        color: isUser ? Colors.white : Colors.black87,
                      ),
                    ),
            ),
          ),
          if (message.orders.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 8, start: 2, end: 2),
              child: AssistantOrderRow(orders: message.orders, isArabic: strings.isAr),
            ),
          if (message.products.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 8, start: 2, end: 2),
              child: AssistantProductRow(
                products: message.products,
                isArabic: strings.isAr,
              ),
            ),
          if (message.quickReplies.isNotEmpty && !message.isStreaming)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 8),
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final qr in message.quickReplies)
                    ActionChip(
                      label: Text(qr.label, style: const TextStyle(fontSize: 12.5)),
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: _border),
                      onPressed: sending
                          ? null
                          : () {
                              HapticFeedback.selectionClick();
                              ref.read(assistantProvider.notifier).sendQuickReply(qr.action);
                            },
                    ),
                ],
              ),
            ),
          if (message.isFailed)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 4, start: 2),
              child: TextButton.icon(
                style: TextButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  foregroundColor: HomeTheme.accent,
                ),
                onPressed: sending
                    ? null
                    : () => ref.read(assistantProvider.notifier).retryFailed(message),
                icon: const Icon(Icons.refresh, size: 16),
                label: Text(
                  strings.isAr ? 'إعادة المحاولة' : 'Retry',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          if (!isUser && !message.isStreaming && !message.isFailed && message.messageId != null)
            _FeedbackRow(message: message),
        ],
      ),
    );
  }
}

/// مؤشر الكتابة مع وسم حالة اختياري ("أدور بالكتالوج…").
class _StreamingIndicator extends StatefulWidget {
  final String? label;
  const _StreamingIndicator({this.label});

  @override
  State<_StreamingIndicator> createState() => _StreamingIndicatorState();
}

class _StreamingIndicatorState extends State<_StreamingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                final phase = (_controller.value * 3 - i).clamp(0.0, 1.0);
                final scale = 0.6 + 0.4 * (1 - (2 * phase - 1).abs());
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Transform.scale(
                    scale: scale,
                    child: Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: HomeTheme.accent,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                );
              }),
            );
          },
        ),
        if (widget.label != null && widget.label!.isNotEmpty) ...[
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              widget.label!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: HomeTheme.inkSoft),
            ),
          ),
        ],
      ],
    );
  }
}

class _FeedbackRow extends ConsumerStatefulWidget {
  final AssistantMessage message;
  const _FeedbackRow({required this.message});

  @override
  ConsumerState<_FeedbackRow> createState() => _FeedbackRowState();
}

class _FeedbackRowState extends ConsumerState<_FeedbackRow> {
  int? _sent;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(top: 4, start: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            visualDensity: VisualDensity.compact,
            iconSize: 18,
            onPressed: _sent == null
                ? () {
                    setState(() => _sent = 1);
                    ref.read(assistantProvider.notifier).sendFeedback(
                          widget.message.messageId,
                          1,
                        );
                  }
                : null,
            icon: Icon(
              Icons.thumb_up_alt_outlined,
              color: _sent == 1 ? HomeTheme.accent : Colors.black38,
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            visualDensity: VisualDensity.compact,
            iconSize: 18,
            onPressed: _sent == null
                ? () {
                    setState(() => _sent = -1);
                    ref.read(assistantProvider.notifier).sendFeedback(
                          widget.message.messageId,
                          -1,
                        );
                  }
                : null,
            icon: Icon(
              Icons.thumb_down_alt_outlined,
              color: _sent == -1 ? Colors.red.shade400 : Colors.black38,
            ),
          ),
        ],
      ),
    );
  }
}

/// شاشة المحادثة مع المساعد الذكي.
class AssistantScreen extends ConsumerStatefulWidget {
  /// منتج الشاشة الحالية عند القدوم من صفحة منتج.
  final String? screenProductId;

  const AssistantScreen({super.key, this.screenProductId});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  int _lastCartStamp = 0;

  @override
  void initState() {
    super.initState();
    ref.read(assistantGuestKeyProvider.future);
    Future.microtask(
      () => ref.read(assistantProvider.notifier).restoreLastConversation(),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    HapticFeedback.lightImpact();
    ref
        .read(assistantProvider.notifier)
        .send(text, screenProductId: widget.screenProductId);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(assistantProvider);
    final strings = ref.watch(stringsProvider);

    ref.listen(assistantProvider, (_, next) {
      _scrollToBottom();
      if (next.cartAddedStamp > _lastCartStamp) {
        _lastCartStamp = next.cartAddedStamp;
        if (mounted) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              content: Text(
                strings.isAr
                    ? 'انضاف للسلة ✓ (${next.cartAddedCount}) — شوف السلة للإتمام'
                    : 'Added to cart ✓ (${next.cartAddedCount})',
              ),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    });

    return Scaffold(
      backgroundColor: HomeTheme.canvas,
      body: Column(
        children: [
          _AssistantHeader(
            isAr: strings.isAr,
            hasMessages: state.messages.isNotEmpty,
            onHistory: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AssistantHistoryScreen()),
              );
              if (mounted) _scrollToBottom();
            },
            onNewChat: () => ref.read(assistantProvider.notifier).clearConversation(),
          ),
          Expanded(
            child: state.messages.isEmpty
                ? _EmptyState(strings: strings, hasProductContext: widget.screenProductId != null)
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(12),
                    itemCount: state.messages.length,
                    itemBuilder: (_, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AssistantBubble(message: state.messages[i]),
                    ),
                  ),
          ),
          _Composer(
            controller: _controller,
            enabled: !state.sending,
            onSubmit: _submit,
            strings: strings,
          ),
        ],
      ),
    );
  }
}

/// ترويسة متدرجة بشخصية "ديمة" وحلقة نبض متحركة.
class _AssistantHeader extends StatelessWidget {
  final bool isAr;
  final bool hasMessages;
  final VoidCallback onHistory;
  final VoidCallback onNewChat;

  const _AssistantHeader({
    required this.isAr,
    required this.hasMessages,
    required this.onHistory,
    required this.onNewChat,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: AlignmentDirectional.topStart,
            end: AlignmentDirectional.bottomEnd,
            colors: [HomeTheme.accentLight, Colors.white],
          ),
          border: Border(bottom: BorderSide(color: _border)),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 6, 8, 10),
          child: Row(
            children: [
              const _DeemaAvatar(),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isAr ? 'ديمة — مساعدتك الذكية' : 'Deema — AI Assistant',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                    Text(
                      isAr ? 'تتذكر ذوقك وتدور لك الأفضل' : 'Knows your taste, finds the best',
                      style: const TextStyle(fontSize: 11, color: HomeTheme.inkSoft),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: isAr ? 'سجل المحادثات' : 'Chat history',
                onPressed: onHistory,
                icon: const Icon(Icons.history, color: HomeTheme.inkSoft),
              ),
              if (hasMessages)
                IconButton(
                  tooltip: isAr ? 'محادثة جديدة' : 'New chat',
                  onPressed: onNewChat,
                  icon: const Icon(Icons.chat_bubble_outline, color: HomeTheme.inkSoft),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// أفاتار ديمة: حلقة متدرجة نابضة + أيقونة نجمة.
class _DeemaAvatar extends StatefulWidget {
  const _DeemaAvatar();

  @override
  State<_DeemaAvatar> createState() => _DeemaAvatarState();
}

class _DeemaAvatarState extends State<_DeemaAvatar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final glow = 0.25 + 0.35 * _controller.value;
        return Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [HomeTheme.accent, HomeTheme.accentDark],
            ),
            boxShadow: [
              BoxShadow(
                color: HomeTheme.accent.withValues(alpha: glow),
                blurRadius: 16,
                spreadRadius: 2,
              ),
            ],
          ),
          child: child,
        );
      },
      child: const Icon(Icons.auto_awesome, color: Colors.white, size: 22),
    );
  }
}

class _EmptyState extends ConsumerWidget {
  final AppStrings strings;
  final bool hasProductContext;
  const _EmptyState({required this.strings, this.hasProductContext = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAr = strings.isAr;
    final welcome = ref.watch(assistantWelcomeProvider);

    final localTiles = hasProductContext
        ? <(String, String, IconData)>[
            (isAr ? 'رأيها بهذا المنتج' : 'Her take on it', isAr ? 'شنو مميزاتة ولمن يناسب' : 'Highlights & fit', Icons.auto_awesome),
            (isAr ? 'بديل أرخص' : 'Cheaper alternative', isAr ? 'نفس الفايدة بس أوفر' : 'Same benefit, less', Icons.savings_outlined),
            (isAr ? 'قارن مع مشابهات' : 'Compare similar', isAr ? 'فرق السعر والحجم' : 'Price & size diff', Icons.compare_arrows),
            (isAr ? 'شنو يناسب معه؟' : 'Pairs well with', isAr ? 'مكمّلات منطقية' : 'Logical add-ons', Icons.add_shopping_cart),
          ]
        : <(String, String, IconData)>[
            (isAr ? 'توصية ذكية' : 'Smart pick', isAr ? 'عطر خفيف للدوام' : 'Light work perfume', Icons.local_florist_outlined),
            (isAr ? 'روتين كامل' : 'Full routine', isAr ? 'بحدود 100 الف دينار' : 'Under 100k IQD', Icons.spa_outlined),
            (isAr ? 'الأكثر مبيعاً' : 'Bestsellers', isAr ? 'شنو يدور الناس' : 'What people love', Icons.local_fire_department_outlined),
            (isAr ? 'وين طلبي؟' : 'Track order', isAr ? 'حالة طلباتك' : 'Your orders status', Icons.local_shipping_outlined),
          ];

    final greeting = welcome.value?['greeting'] as String?;
    final serverChips = ((welcome.value?['chips'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((c) => Map<String, dynamic>.from(c))
        .toList());

    final tiles = <(String, String, IconData)>[...localTiles];
    final actions = <String>[
      for (var i = 0; i < tiles.length; i++)
        i < serverChips.length && !hasProductContext
            ? '${serverChips[i]['action'] ?? _actionFor(tiles[i].$1, isAr, hasProductContext)}'
            : _actionFor(tiles[i].$1, isAr, hasProductContext),
    ];

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // بطاقة الترحيب المتدرجة.
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: AlignmentDirectional.topStart,
                  end: AlignmentDirectional.bottomEnd,
                  colors: [HomeTheme.accent, HomeTheme.accentDark],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: HomeTheme.accent.withValues(alpha: 0.3),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.auto_awesome, color: Colors.white, size: 19),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          isAr ? 'هلا فيك! أنا ديمة' : 'Hi! I\'m Deema',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    greeting ??
                        (isAr
                            ? 'خبرني شنو تحتاج — أدور لك بالكتالوج الحقيقي، أقارن، وأجهز سلتك.'
                            : 'Tell me what you need — I search the real catalog, compare, and prep your cart.'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13.5,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // بطاقات الاقتراحات الغنية.
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.85,
              children: [
                for (var i = 0; i < tiles.length; i++)
                  _SuggestionTile(
                    title: tiles[i].$1,
                    subtitle: tiles[i].$2,
                    icon: tiles[i].$3,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      ref.read(assistantProvider.notifier).sendQuickReply(actions[i]);
                    },
                  ),
              ],
            ),
            if (welcome.isLoading)
              const Padding(
                padding: EdgeInsets.only(top: 10),
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _actionFor(String title, bool isAr, bool hasProductContext) {
    if (hasProductContext) {
      switch (title) {
        case 'رأيها بهذا المنتج':
        case 'Her take on it':
          return isAr ? 'شنو رأيك بهذا المنتج؟' : 'What do you think of this product?';
        case 'بديل أرخص':
        case 'Cheaper alternative':
          return isAr ? 'دورلي بديل أرخص لهذا المنتج' : 'Find a cheaper alternative';
        case 'قارن مع مشابهات':
        case 'Compare similar':
          return isAr ? 'قارن هذا المنتج مع مشابهاته' : 'Compare this with similar ones';
        default:
          return isAr ? 'شنو يناسب مع هذا المنتج؟' : 'What pairs well with it?';
      }
    }
    switch (title) {
      case 'توصية ذكية':
      case 'Smart pick':
        return isAr ? 'عطر نسائي خفيف للدوام' : 'Light perfume for work';
      case 'روتين كامل':
      case 'Full routine':
        return isAr ? 'روتين كامل للبشرة بحدود 100 الف' : 'Full skincare routine under 100k IQD';
      case 'الأكثر مبيعاً':
      case 'Bestsellers':
        return isAr ? 'شنو المنتجات الأكثر مبيعاً؟' : 'What are the bestsellers?';
      default:
        return isAr ? 'وين طلبي وصل؟' : 'Where is my order?';
    }
  }
}

/// بطاقة اقتراح غنية: أيقونة + عنوان + وصف.
class _SuggestionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const _SuggestionTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _border),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: HomeTheme.accentLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 19, color: HomeTheme.accentDark),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, color: HomeTheme.inkSoft),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;
  final VoidCallback onSubmit;
  final AppStrings strings;

  const _Composer({
    required this.controller,
    required this.enabled,
    required this.onSubmit,
    required this.strings,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: _border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              enabled: enabled,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSubmit(),
              minLines: 1,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: strings.isAr ? 'اكتب لديمة…' : 'Ask Deema…',
                hintStyle: const TextStyle(fontSize: 13.5, color: Colors.black38),
                filled: true,
                fillColor: HomeTheme.canvas,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: _border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: _border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: HomeTheme.accent, width: 1.4),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: controller,
            builder: (context, value, _) {
              final active = enabled && value.text.trim().isNotEmpty;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: active
                      ? const LinearGradient(colors: [HomeTheme.accent, HomeTheme.accentDark])
                      : null,
                  color: active ? null : _border,
                  shape: BoxShape.circle,
                  boxShadow: active
                      ? [
                          BoxShadow(
                            color: HomeTheme.accent.withValues(alpha: 0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: Material(
                  color: Colors.transparent,
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: active ? onSubmit : null,
                    child: Icon(
                      Icons.arrow_upward_rounded,
                      color: active ? Colors.white : Colors.black38,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
