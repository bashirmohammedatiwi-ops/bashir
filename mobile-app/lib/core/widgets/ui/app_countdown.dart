import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/worlds/world_theme.dart';
import '../../l10n/app_strings.dart';
import '../../theme/app_text.dart';

enum AppCountdownStyle {
  /// كبسولة نصية: «ينتهي خلال يومين و4 س» / «ينتهي خلال 05:12:09».
  pill,

  /// خانات س:د:ث (أو «باقي يومين» ليوم فأكثر) — للعروض المحدودة.
  cells,
}

/// عدّاد انتهاء عرض موحّد لكل التطبيق.
///
/// مؤقّت واحد يُعاد تسليحه: كل دقيقة ما دام يوم فأكثر باقياً (النص يتغيّر كل ساعة)،
/// وكل ثانية بعدها. لا يعيد البناء والتبويب مخفي (TickerMode)، ويتوقف عند الانتهاء
/// ويستدعي [onExpired] مرة واحدة. عرض انتهى قبل ظهور العدّاد لا يستدعيها — حتى لا
/// تتكرر إعادة الجلب إن اختلفت ساعة الجهاز عن الخادم.
class AppCountdown extends ConsumerStatefulWidget {
  final DateTime endsAt;
  final AppCountdownStyle style;
  final VoidCallback? onExpired;

  /// لون النص: نص الكبسولة وأيقونتها، أو أرقام الخانات.
  final Color? color;

  /// ما تحت النص: خلفية الكبسولة، أو تعبئة الخانات وفواصلها.
  final Color? background;

  const AppCountdown({
    super.key,
    required this.endsAt,
    this.style = AppCountdownStyle.pill,
    this.onExpired,
    this.color,
    this.background,
  });

  @override
  ConsumerState<AppCountdown> createState() => _AppCountdownState();
}

class _AppCountdownState extends ConsumerState<AppCountdown> {
  Timer? _timer;
  bool _expired = false;
  bool _visible = true;

  Duration get _left => widget.endsAt.difference(DateTime.now());

  @override
  void initState() {
    super.initState();
    // انتهى قبل الظهور: لا عدّاد ولا استدعاء.
    if (_left <= Duration.zero) {
      _expired = true;
    } else {
      _arm();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // تبويب مخفي: المؤقت يبقى (ليصل الانتهاء في وقته) لكن بلا إعادة بناء.
    // عند الظهور يُعاد البناء تلقائياً بسبب هذا الاعتماد فيُعرض الوقت الصحيح.
    _visible = TickerMode.valuesOf(context).enabled;
  }

  @override
  void didUpdateWidget(covariant AppCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.endsAt == widget.endsAt) return;
    _timer?.cancel();
    _expired = _left <= Duration.zero;
    if (!_expired) _arm();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _arm() {
    final left = _left;
    final Duration next;
    if (left.inDays >= 1) {
      // دقيقة، أو أقل لنصل بالضبط إلى لحظة نزول الباقي تحت يوم.
      final toUnderDay = left - const Duration(days: 1) + const Duration(milliseconds: 1);
      next = toUnderDay < const Duration(minutes: 1) ? toUnderDay : const Duration(minutes: 1);
    } else {
      // على حدّ الثانية التالية حتى لا تقفز الأرقام ثانيتين.
      final ms = left.inMilliseconds % 1000;
      next = Duration(milliseconds: ms == 0 ? 1000 : ms);
    }
    _timer = Timer(next < left ? next : left, _tick);
  }

  void _tick() {
    if (!mounted) return;
    if (_left <= Duration.zero) {
      _expired = true;
      setState(() {});
      widget.onExpired?.call();
      return;
    }
    if (_visible) setState(() {});
    _arm();
  }

  @override
  Widget build(BuildContext context) {
    final left = _left;
    if (_expired || left <= Duration.zero) return const SizedBox.shrink();
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final label = _label(s, left);
    return Semantics(
      label: label,
      excludeSemantics: true,
      child: switch (widget.style) {
        AppCountdownStyle.pill => _Pill(
            text: label,
            color: widget.color ?? t.accentDark,
            background: widget.background,
          ),
        AppCountdownStyle.cells => _Cells(
            left: left,
            daysText: s.isAr ? 'باقي ${_arDays(left.inDays)}' : '${_enDays(left.inDays)} left',
            color: widget.color ?? Colors.white,
            fill: widget.background ?? t.ink,
          ),
      },
    );
  }

  /// «ينتهي خلال يومين و4 س» ليوم فأكثر، و«ينتهي خلال 05:12:09» لأقل من يوم.
  static String _label(AppStrings s, Duration left) {
    final d = left.inDays;
    if (d >= 1) {
      final h = left.inHours % 24;
      return s.isAr
          ? 'ينتهي خلال ${_arDays(d)}${h > 0 ? ' و$h س' : ''}'
          : 'Ends in ${_enDays(d)}${h > 0 ? ' ${h}h' : ''}';
    }
    final clock = _clock(left).join(':');
    return s.isAr ? 'ينتهي خلال $clock' : 'Ends in $clock';
  }
}

/// [س، د، ث] بخانتين لكل منها.
List<String> _clock(Duration left) => [
      left.inHours,
      left.inMinutes % 60,
      left.inSeconds % 60,
    ].map((n) => n.toString().padLeft(2, '0')).toList();

/// تمييز الأيام بعد «خلال/باقي»: يوم، يومين، 3 أيام، 11 يوماً (والمئات مفرد: 100 يوم).
String _arDays(int d) {
  if (d == 1) return 'يوم';
  if (d == 2) return 'يومين';
  final m = d % 100;
  if (m >= 3 && m <= 10) return '$d أيام';
  if (m >= 11) return '$d يوماً';
  return '$d يوم';
}

String _enDays(int d) => d == 1 ? '1 day' : '$d days';

class _Pill extends StatelessWidget {
  final String text;
  final Color color;
  final Color? background;

  const _Pill({required this.text, required this.color, this.background});

  @override
  Widget build(BuildContext context) {
    // نص فاتح يعني أنه فوق صورة أو لون داكن — خلفية داكنة شفافة؛ وإلا لمسة من لون النص.
    final bg = background ??
        (color.computeLuminance() > 0.6 ? Colors.black.withValues(alpha: 0.2) : color.withValues(alpha: 0.1));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppCorners.pill)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.timer_outlined, size: 13, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.micro.copyWith(color: color, fontFeatures: const [FontFeature.tabularFigures()]),
            ),
          ),
        ],
      ),
    );
  }
}

class _Cells extends StatelessWidget {
  final Duration left;
  final String daysText;
  final Color color;
  final Color fill;

  const _Cells({required this.left, required this.daysText, required this.color, required this.fill});

  @override
  Widget build(BuildContext context) {
    final digits = AppText.label.copyWith(color: color, fontFeatures: const [FontFeature.tabularFigures()]);
    if (left.inDays >= 1) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: fill, borderRadius: BorderRadius.circular(AppCorners.xs)),
        child: Text(daysText, maxLines: 1, style: digits),
      );
    }
    Widget cell(String v) => Container(
          constraints: const BoxConstraints(minWidth: 30),
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          alignment: Alignment.center,
          decoration: BoxDecoration(color: fill, borderRadius: BorderRadius.circular(AppCorners.xs)),
          child: Text(v, maxLines: 1, style: digits),
        );
    final sep = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: Text(':', style: AppText.label.copyWith(color: fill)),
    );
    final parts = _clock(left);
    // س:د:ث تُقرأ من اليسار في اللغتين — كالساعة.
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [cell(parts[0]), sep, cell(parts[1]), sep, cell(parts[2])],
      ),
    );
  }
}
