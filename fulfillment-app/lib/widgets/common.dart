import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// صورة من الشبكة بإطار مستدير وخلفية هادئة أثناء التحميل.
class NetImg extends StatelessWidget {
  const NetImg(this.url, {super.key, this.size, this.width, this.height, this.radius = 12, this.fit = BoxFit.cover, this.icon});
  final String? url;
  final double? size;
  final double? width;
  final double? height;
  final double radius;
  final BoxFit fit;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final w = width ?? size;
    final h = height ?? size;
    final placeholder = Container(
      width: w,
      height: h,
      color: AppColors.primaryLight,
      alignment: Alignment.center,
      child: Icon(icon ?? Icons.image_outlined, color: AppColors.primary.withValues(alpha: .35), size: (size ?? 48) * .42),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: url == null || url!.isEmpty
          ? placeholder
          : CachedNetworkImage(
              imageUrl: url!,
              width: w,
              height: h,
              fit: fit,
              fadeInDuration: const Duration(milliseconds: 150),
              placeholder: (_, _) => placeholder,
              errorWidget: (_, _, _) => placeholder,
            ),
    );
  }
}

/// دائرة لون التدرج (لون واحد أو تدرج)، مشطوبة إن كانت موقوفة.
class Swatch extends StatelessWidget {
  const Swatch({super.key, this.hex, this.hexEnd, this.size = 28, this.off = false, this.imageUrl});
  final String? hex;
  final String? hexEnd;
  final double size;
  final bool off;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final c1 = hexColor(hex) ?? const Color(0xFFDDD5E6);
    final c2 = hexColor(hexEnd);
    Widget dot = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: c2 == null ? c1 : null,
        gradient: c2 == null ? null : LinearGradient(colors: [c1, c2], begin: Alignment.topLeft, end: Alignment.bottomRight),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 3, offset: Offset(0, 1))],
      ),
    );
    if (imageUrl != null) {
      dot = Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 3, offset: Offset(0, 1))],
        ),
        child: ClipOval(
          child: NetImg(imageUrl, size: size, radius: size),
        ),
      );
    }
    if (!off) return dot;
    return Stack(
      alignment: Alignment.center,
      children: [
        Opacity(opacity: .35, child: dot),
        Transform.rotate(
          angle: -0.75,
          child: Container(width: size * 1.05, height: 2.2, color: AppColors.danger),
        ),
      ],
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.active, this.onLabel = 'شغّال', this.offLabel = 'موقوف', this.small = false});
  final bool active;
  final String onLabel;
  final String offLabel;
  final bool small;

  @override
  Widget build(BuildContext context) => Pill(
    active ? onLabel : offLabel,
    color: active ? AppColors.success : AppColors.danger,
    bg: active ? AppColors.successSoft : AppColors.dangerSoft,
    small: small,
    icon: active ? Icons.visibility_rounded : Icons.visibility_off_rounded,
  );
}

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, required this.color, required this.bg, this.icon, this.small = false});
  final String text;
  final Color color;
  final Color bg;
  final IconData? icon;
  final bool small;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.symmetric(horizontal: small ? 7 : 10, vertical: small ? 2 : 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[Icon(icon, size: small ? 12 : 14, color: color), const SizedBox(width: 4)],
        Text(
          text,
          style: TextStyle(color: color, fontSize: small ? 11 : 12.5, fontWeight: FontWeight.w700, height: 1.3),
        ),
      ],
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.trailing, this.subtitle});
  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              if (subtitle != null) Text(subtitle!, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
            ],
          ),
        ),
        ?trailing,
      ],
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.message, this.action});
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 84,
            height: 84,
            decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
            child: Icon(icon, size: 40, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
          ),
          if (message != null) ...[
            const SizedBox(height: 6),
            Text(
              message!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, height: 1.6),
            ),
          ],
          if (action != null) ...[const SizedBox(height: 18), action!],
        ],
      ),
    ),
  );
}

class ErrorView extends StatelessWidget {
  const ErrorView(this.error, {super.key, this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => EmptyState(
    icon: Icons.cloud_off_rounded,
    title: 'حدث خطأ',
    message: Api.toError(error).message,
    action: onRetry == null
        ? null
        : FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh_rounded), label: const Text('إعادة المحاولة')),
  );
}

void toast(BuildContext context, String msg, {bool error = false, SnackBarAction? action, Duration? duration}) {
  // داخل نافذة سفلية أو حوار: شريط الصفحة يُرسم تحتها فلا يُرى — نعرض الرسالة فوق كل شيء.
  if (ModalRoute.of(context) is PopupRoute) {
    _overlayToast(
      context,
      msg,
      error: error,
      action: action,
      duration: duration ?? Duration(seconds: action != null ? 6 : 3),
    );
    return;
  }
  final m = ScaffoldMessenger.of(context);
  m.hideCurrentSnackBar();
  m.showSnackBar(
    SnackBar(
      content: Row(
        children: [
          Icon(
            error ? Icons.error_outline_rounded : Icons.check_circle_rounded,
            color: error ? const Color(0xFFFF9A9A) : const Color(0xFF8FE3B5),
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(msg)),
        ],
      ),
      action: action,
      duration: duration ?? Duration(seconds: action != null ? 6 : 3),
    ),
  );
}

void toastError(BuildContext context, Object e) => toast(context, Api.toError(e).message, error: true);

Future<bool> confirm(BuildContext context, {required String title, String? message, String ok = 'تأكيد', bool danger = false}) async {
  final r = await showDialog<bool>(
    context: context,
    builder: (c) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
      content: message == null ? null : Text(message, style: const TextStyle(height: 1.6)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إلغاء')),
        FilledButton(
          style: danger ? FilledButton.styleFrom(backgroundColor: AppColors.danger) : null,
          onPressed: () => Navigator.pop(c, true),
          child: Text(ok),
        ),
      ],
    ),
  );
  return r == true;
}

/// نافذة إدخال نص بسيطة.
Future<String?> promptText(
  BuildContext context, {
  required String title,
  String? initial,
  String? hint,
  String ok = 'حفظ',
  int maxLines = 1,
  TextInputType? keyboard,
  TextDirection? direction,
}) {
  final ctrl = TextEditingController(text: initial);
  return showDialog<String>(
    context: context,
    builder: (c) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
      content: TextField(
        controller: ctrl,
        autofocus: true,
        maxLines: maxLines,
        keyboardType: keyboard,
        textDirection: direction,
        decoration: InputDecoration(hintText: hint),
        onSubmitted: maxLines == 1 ? (v) => Navigator.pop(c, v) : null,
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: const Text('إلغاء')),
        FilledButton(onPressed: () => Navigator.pop(c, ctrl.text), child: Text(ok)),
      ],
    ),
  );
}

/// غلاف بطاقة موحّد.
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.color, this.onTap});
  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: color ?? Colors.white,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.line),
        ),
        child: child,
      ),
    ),
  );
}

/// شاشة تحميل فوق المحتوى أثناء عملية طويلة (رفع/قص).
class BusyOverlay extends StatelessWidget {
  const BusyOverlay({super.key, required this.busy, required this.child, this.label});
  final bool busy;
  final Widget child;
  final String? label;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      child,
      if (busy)
        Positioned.fill(
          child: ColoredBox(
            color: const Color(0x66FFFFFF),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 20)],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.6)),
                    const SizedBox(width: 14),
                    Text(label ?? 'لحظة...', style: const TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),
        ),
    ],
  );
}

/// مفتاح يُحفظ على السيرفر: يتحرك فوراً، يُقفل أثناء الحفظ، ويعود لوضعه إن فشل.
/// [confirmOff] يُسأل قبل الإيقاف (إجراء يراه الزبائن).
class AsyncSwitch extends StatefulWidget {
  const AsyncSwitch({super.key, required this.value, required this.onChanged, this.confirmOff});
  final bool value;
  final Future<bool> Function(bool value) onChanged;
  final Future<bool> Function()? confirmOff;

  @override
  State<AsyncSwitch> createState() => _AsyncSwitchState();
}

class _AsyncSwitchState extends State<AsyncSwitch> {
  bool? _local;
  bool _busy = false;

  @override
  void didUpdateWidget(AsyncSwitch old) {
    super.didUpdateWidget(old);
    if (!_busy && old.value != widget.value) _local = null;
  }

  Future<void> _set(bool v) async {
    if (!v && widget.confirmOff != null && !await widget.confirmOff!()) return;
    if (!mounted) return;
    setState(() => (_local = v, _busy = true));
    final ok = await widget.onChanged(v);
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (!ok) _local = null;
    });
  }

  @override
  Widget build(BuildContext context) => Switch(value: _local ?? widget.value, onChanged: _busy ? null : _set);
}

/// نص لاتيني (هاتف، باركود، رابط) داخل واجهة عربية — يبقى «+964…» بترتيبه الصحيح.
String ltr(String s) => '\u2066$s\u2069';

OverlayEntry? _overlayEntry;

void _overlayToast(BuildContext context, String msg, {required bool error, SnackBarAction? action, required Duration duration}) {
  final overlay = Overlay.maybeOf(context, rootOverlay: true);
  if (overlay == null) return;
  _overlayEntry?.remove();
  late final OverlayEntry entry;
  void close() {
    if (entry.mounted) entry.remove();
    if (identical(_overlayEntry, entry)) _overlayEntry = null;
  }

  entry = OverlayEntry(
    // أعلى الشاشة: النافذة السفلية وأزرارها وأي لوحة مفاتيح تبقى ظاهرة.
    builder: (ctx) => Positioned(
      left: 12,
      right: 12,
      top: MediaQuery.paddingOf(ctx).top + 12,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 180),
        builder: (_, t, child) => Opacity(
          opacity: t,
          child: Transform.translate(offset: Offset(0, -12 * (1 - t)), child: child),
        ),
        child: Material(
          color: AppColors.ink,
          elevation: 6,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
            child: Row(
              children: [
                Icon(
                  error ? Icons.error_outline_rounded : Icons.check_circle_rounded,
                  color: error ? const Color(0xFFFF9A9A) : const Color(0xFF8FE3B5),
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    msg,
                    style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
                  ),
                ),
                if (action != null)
                  TextButton(
                    onPressed: () {
                      close();
                      action.onPressed();
                    },
                    child: Text(action.label, style: TextStyle(color: action.textColor ?? AppColors.primarySoft)),
                  ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  _overlayEntry = entry;
  overlay.insert(entry);
  Future.delayed(duration, close);
}

/// يمنع ضياع ما كُتب: الرجوع مع تعديلات غير محفوظة يسأل أولاً.
class UnsavedGuard extends StatelessWidget {
  const UnsavedGuard({super.key, required this.dirty, required this.child});
  final bool dirty;
  final Widget child;

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !dirty,
    onPopInvokedWithResult: (didPop, _) async {
      if (didPop) return;
      final nav = Navigator.of(context);
      if (await confirm(context, title: 'تجاهل ما كتبته؟', message: 'لم يُحفظ بعد.', ok: 'تجاهل', danger: true)) nav.pop();
    },
    child: child,
  );
}
