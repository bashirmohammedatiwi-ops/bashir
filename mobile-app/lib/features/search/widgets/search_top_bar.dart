import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';

/// شريط البحث العلوي: رجوع + حقل كبير مستدير + مسح الباركود.
class SearchTopBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hint;
  final String clearTooltip;
  final String scanTooltip;
  final bool busy;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;
  final VoidCallback onScan;

  /// اقتراحات تتبدّل داخل الحقل الفارغ (مثلاً من الأقسام الأكثر طلباً).
  final List<String> hints;

  const SearchTopBar({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.hint,
    required this.clearTooltip,
    required this.scanTooltip,
    required this.onChanged,
    required this.onSubmitted,
    required this.onClear,
    required this.onScan,
    this.busy = false,
    this.hints = const [],
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Material(
        color: t.surface,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(6, 6, 12, 10),
            child: Row(
              children: [
                const AppBackButton(outlined: false),
                Expanded(child: _Field(bar: this)),
                const SizedBox(width: 8),
                // زر المسح: مربع أبيض بظل ناعم — نفس شريط بحث الرئيسية.
                Semantics(
                  button: true,
                  label: scanTooltip,
                  child: GestureDetector(
                    onTap: onScan,
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: t.surface,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: t.ink.withValues(alpha: 0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.qr_code_scanner_rounded,
                        color: t.accentDark,
                        size: 23,
                      ),
                    ),
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

class _Field extends StatelessWidget {
  final SearchTopBar bar;
  const _Field({required this.bar});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final radius = BorderRadius.circular(20);
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: bar.controller,
      builder: (context, value, _) {
        final hasText = value.text.isNotEmpty;
        final rotating = !hasText && bar.hints.length > 1;
        final field = TextField(
          controller: bar.controller,
          focusNode: bar.focusNode,
          autofocus: true,
          textInputAction: TextInputAction.search,
          autocorrect: false,
          enableSuggestions: false,
          cursorColor: t.accent,
          style: AppText.body.copyWith(
            color: t.ink,
            fontWeight: FontWeight.w600,
            height: 1.3,
          ),
          onChanged: bar.onChanged,
          onSubmitted: bar.onSubmitted,
          decoration: InputDecoration(
            isDense: true,
            hintText: rotating ? null : bar.hint,
            hintStyle: AppText.bodySmall.copyWith(
              color: t.inkMuted,
              fontSize: 14,
            ),
            filled: true,
            fillColor: Color.alphaBlend(
              t.ink.withValues(alpha: 0.045),
              t.surface,
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 15),
            prefixIcon: Padding(
              padding: const EdgeInsetsDirectional.only(start: 14, end: 8),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: bar.busy
                    ? SizedBox(
                        key: const ValueKey('busy'),
                        width: 18,
                        height: 18,
                        child: Padding(
                          padding: const EdgeInsets.all(2),
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: t.accent,
                          ),
                        ),
                      )
                    : Icon(
                        Icons.search_rounded,
                        key: const ValueKey('idle'),
                        size: 22,
                        color: t.accent,
                      ),
              ),
            ),
            prefixIconConstraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 40,
            ),
            suffixIcon: hasText
                ? Semantics(
                    button: true,
                    label: bar.clearTooltip,
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        bar.onClear();
                      },
                      child: SizedBox(
                        width: kMinTapTarget,
                        height: kMinTapTarget,
                        child: Center(
                          child: Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: t.inkMuted.withValues(alpha: 0.18),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.close_rounded,
                              size: 15,
                              color: t.inkSoft,
                            ),
                          ),
                        ),
                      ),
                    ),
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: radius,
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: radius,
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: radius,
              borderSide: BorderSide(
                color: t.accent.withValues(alpha: 0.7),
                width: 1.4,
              ),
            ),
          ),
        );
        if (!rotating) return field;
        return Stack(
          alignment: AlignmentDirectional.centerStart,
          children: [
            field,
            PositionedDirectional(
              start: 48,
              end: 12,
              child: IgnorePointer(
                child: _RotatingHint(
                  hints: bar.hints,
                  style: AppText.bodySmall.copyWith(
                    color: t.inkMuted,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// نص يتبدّل كل بضع ثوانٍ بانزلاق ناعم للأعلى.
class _RotatingHint extends StatefulWidget {
  final List<String> hints;
  final TextStyle style;
  const _RotatingHint({required this.hints, required this.style});

  @override
  State<_RotatingHint> createState() => _RotatingHintState();
}

class _RotatingHintState extends State<_RotatingHint> {
  Timer? _timer;
  int _i = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 3000), (_) {
      if (!mounted || widget.hints.length < 2) return;
      setState(() => _i = (_i + 1) % widget.hints.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = widget.hints[_i % widget.hints.length];
    return ClipRect(
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 420),
        layoutBuilder: (current, previous) => Stack(
          alignment: AlignmentDirectional.centerStart,
          children: [...previous, if (current != null) current],
        ),
        transitionBuilder: (child, a) => FadeTransition(
          opacity: a,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: Offset(0, child.key == ValueKey(text) ? 0.6 : -0.6),
              end: Offset.zero,
            ).animate(a),
            child: child,
          ),
        ),
        child: Text(
          text,
          key: ValueKey(text),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: widget.style,
        ),
      ),
    );
  }
}
