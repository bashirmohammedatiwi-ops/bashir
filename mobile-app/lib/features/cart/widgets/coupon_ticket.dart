import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../data/models/coupon.dart';
import '../coupon_provider.dart';

/// ألوان البطاقة حسب «theme» المختار من لوحة التحكم.
List<Color> couponThemeColors(String theme) => switch (theme) {
      'gold' => const [Color(0xFFE9B949), Color(0xFFB27A12)],
      'violet' => const [Color(0xFFA77BEA), Color(0xFF6A3EC4)],
      'midnight' => const [Color(0xFF4B3D6E), Color(0xFF221B35)],
      'mint' => const [Color(0xFF4CC9A6), Color(0xFF1F8F74)],
      'coral' => const [Color(0xFFFF9472), Color(0xFFE2504A)],
      _ => const [Color(0xFFF06A9B), Color(0xFFB43C7C)],
    };

/// «ينتهي بعد يومين»، «ينتهي اليوم»، «حتى 25/10».
String? couponExpiryLabel(DateTime? endsAt) {
  if (endsAt == null) return null;
  final left = endsAt.difference(DateTime.now());
  if (left.isNegative) return null;
  if (left.inHours < 24) return left.inHours <= 1 ? 'ينتهي خلال ساعة' : 'ينتهي بعد ${left.inHours} ساعة';
  final d = left.inDays;
  if (d <= 7) return d == 1 ? 'ينتهي غداً' : d == 2 ? 'ينتهي بعد يومين' : 'ينتهي بعد $d أيام';
  return 'حتى ${endsAt.day}/${endsAt.month}';
}

/// بطاقة كوبون على شكل تذكرة: قيمة كبيرة، شروط واضحة، الكود، و«استخدمي الكود» بلمسة.
class CouponTicket extends ConsumerStatefulWidget {
  final Coupon coupon;
  /// مختصرة (للسلة): أقصر ارتفاعاً، بلا سطر ثانٍ.
  final bool compact;
  final double? width;
  final VoidCallback? onViewCart;

  const CouponTicket({super.key, required this.coupon, this.compact = false, this.width, this.onViewCart});

  @override
  ConsumerState<CouponTicket> createState() => _CouponTicketState();
}

class _CouponTicketState extends ConsumerState<CouponTicket> {
  bool _busy = false;

  Future<void> _use() async {
    if (_busy) return;
    setState(() => _busy = true);
    await applyCouponCode(context, ref, widget.coupon.code, onViewCart: widget.onViewCart);
    if (mounted) setState(() => _busy = false);
  }

  void _copy() {
    Clipboard.setData(ClipboardData(text: widget.coupon.code));
    HapticFeedback.selectionClick();
    AppSnackbar.show(context, 'نُسخ الكود ${widget.coupon.code}');
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.coupon;
    final colors = couponThemeColors(c.theme);
    final applied = ref.watch(appliedCouponProvider.select((a) => a?.code.toUpperCase() == c.code.toUpperCase()));
    final compact = widget.compact;
    final height = compact ? 112.0 : 138.0;
    final stubW = compact ? 82.0 : 96.0;

    final value = switch (c.type) {
      'PERCENT' || 'FIRST_ORDER' => ('${c.value}%', 'خصم'),
      'AMOUNT' || 'FIXED' => (_short(c.value), 'د.ع خصم'),
      'FREE_SHIPPING' => ('مجاني', 'التوصيل'),
      _ => (c.code, ''),
    };
    final title = c.title ??
        (c.type == 'FIRST_ORDER'
            ? 'خصم ${c.value}% لأول طلب'
            : c.type == 'FREE_SHIPPING'
                ? 'توصيل مجاني لطلبكِ'
                : c.benefitLabel(formatPrice: formatPrice));
    final conditions = <String>[
      if (c.minOrder > 0) 'فوق ${formatPrice(c.minOrder)}',
      if (couponExpiryLabel(c.endsAt) != null) couponExpiryLabel(c.endsAt)!,
      if (c.remaining != null && c.remaining! <= 30) 'باقي ${c.remaining} فقط',
      if (c.maxDiscount != null && c.maxDiscount! > 0 && c.isPercent) 'حتى ${formatPrice(c.maxDiscount!)}',
    ];

    return SizedBox(
      width: widget.width,
      height: height,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [BoxShadow(color: colors.last.withValues(alpha: 0.28), blurRadius: 18, offset: const Offset(0, 8))],
        ),
        child: ClipPath(
          clipper: _TicketClipper(stubWidth: stubW, rtl: Directionality.of(context) == TextDirection.rtl),
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: AlignmentDirectional.topStart,
                end: AlignmentDirectional.bottomEnd,
                colors: colors,
              ),
            ),
            child: Stack(
              children: [
                // لمعة ناعمة على الزاوية — عمق بلا صور.
                PositionedDirectional(
                  end: -30,
                  top: -40,
                  child: Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.10)),
                  ),
                ),
                Row(
                  children: [
                    // الجزء الثابت: القيمة الكبيرة.
                    SizedBox(
                      width: stubW,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (c.type == 'FREE_SHIPPING')
                            const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 26)
                          else
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6),
                                child: Text(
                                  value.$1,
                                  textDirection: TextDirection.ltr,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: compact ? 28 : 34,
                                    height: 1,
                                    letterSpacing: -1,
                                  ),
                                ),
                              ),
                            ),
                          const SizedBox(height: 4),
                          Text(
                            c.type == 'FREE_SHIPPING' ? 'توصيل مجاني' : value.$2,
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontWeight: FontWeight.w700, fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    // الفاصل المثقّب.
                    SizedBox(width: 1, height: double.infinity, child: CustomPaint(painter: _DashPainter())),
                    Expanded(
                      child: Padding(
                        padding: EdgeInsetsDirectional.fromSTEB(compact ? 12 : 14, compact ? 12 : 14, compact ? 10 : 14, compact ? 10 : 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: compact ? 14.5 : 16, height: 1.25),
                            ),
                            if (!compact && (c.subtitle ?? c.description).trim().isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                (c.subtitle ?? c.description).trim(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600, fontSize: 12),
                              ),
                            ],
                            if (conditions.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                conditions.join('  •  '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w600, fontSize: 11),
                              ),
                            ],
                            const Spacer(),
                            Row(
                              children: [
                                // الكود: إطار متقطع + نسخ — له الأولوية بالعرض (يُقرأ كاملاً).
                                Flexible(
                                  flex: 3,
                                  child: GestureDetector(
                                    onTap: _copy,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.16),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: Colors.white.withValues(alpha: 0.55)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Flexible(
                                            child: Text(
                                              c.code,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              textDirection: TextDirection.ltr,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w900,
                                                fontSize: 12.5,
                                                letterSpacing: 1.4,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 5),
                                          Icon(Icons.copy_rounded, size: 13, color: Colors.white.withValues(alpha: 0.9)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Flexible(
                                  flex: 2,
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    alignment: AlignmentDirectional.centerEnd,
                                    child: _UseButton(applied: applied, busy: _busy, ink: colors.last, short: compact, onTap: applied ? null : _use),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _short(int v) => v % 1000 == 0 && v >= 1000 ? '${v ~/ 1000}K' : formatNumber(v);
}

class _UseButton extends StatelessWidget {
  final bool applied;
  final bool busy;
  final Color ink;
  final bool short;
  final VoidCallback? onTap;
  const _UseButton({required this.applied, required this.busy, required this.ink, required this.onTap, this.short = false});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const StadiumBorder(),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: busy ? null : onTap,
        child: AnimatedSize(
          duration: const Duration(milliseconds: 220),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: short ? 11 : 14, vertical: 8),
            child: busy
                ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: ink))
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(applied ? Icons.check_circle_rounded : Icons.bolt_rounded, size: 15, color: ink),
                      const SizedBox(width: 4),
                      Text(
                        applied ? 'مُفعّل' : short ? 'استخدمي' : 'استخدمي الكود',
                        style: TextStyle(color: ink, fontWeight: FontWeight.w900, fontSize: 12.5),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// شكل التذكرة: زوايا مدوّرة وثقبان نصف دائريين عند خط الفصل.
class _TicketClipper extends CustomClipper<Path> {
  final double stubWidth;
  final bool rtl;
  const _TicketClipper({required this.stubWidth, required this.rtl});

  @override
  Path getClip(Size size) {
    const r = 22.0;
    const notch = 11.0;
    final x = rtl ? size.width - stubWidth : stubWidth;
    final body = Path()..addRRect(RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(r)));
    final holes = Path()
      ..addOval(Rect.fromCircle(center: Offset(x, 0), radius: notch))
      ..addOval(Rect.fromCircle(center: Offset(x, size.height), radius: notch));
    return Path.combine(PathOperation.difference, body, holes);
  }

  @override
  bool shouldReclip(_TicketClipper old) => old.stubWidth != stubWidth || old.rtl != rtl;
}

class _DashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white.withValues(alpha: 0.55)
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;
    var y = 16.0;
    while (y < size.height - 16) {
      canvas.drawLine(Offset(0, y), Offset(0, y + 5), p);
      y += 10;
    }
  }

  @override
  bool shouldRepaint(_DashPainter old) => false;
}
