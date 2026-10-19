import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../features/worlds/world_theme.dart';
import '../../l10n/app_strings.dart';
import '../../theme/app_text.dart';

/// زر أيقونة دائري موحّد — مساحة لمس 44 نقطة دائماً حتى لو كان الشكل أصغر.
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final String? tooltip;
  final double size;
  final double iconSize;
  final Color? color;
  final Color? background;
  final bool outlined;
  final int badge;

  const AppIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.tooltip,
    this.size = 40,
    this.iconSize = 20,
    this.color,
    this.background,
    this.outlined = true,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final circle = AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background ?? t.surface,
        shape: BoxShape.circle,
        border: outlined ? Border.all(color: t.hairline.withValues(alpha: 0.9), width: 0.8) : null,
        boxShadow: outlined
            ? [
                BoxShadow(
                  color: t.ink.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      alignment: Alignment.center,
      child: Icon(icon, size: iconSize, color: color ?? t.ink),
    );

    Widget child = SizedBox(
      width: size < kMinTapTarget ? kMinTapTarget : size,
      height: size < kMinTapTarget ? kMinTapTarget : size,
      child: Center(
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            circle,
            if (badge > 0)
              PositionedDirectional(
                top: -3,
                end: -3,
                child: CountBadge(count: badge),
              ),
          ],
        ),
      ),
    );

    child = Semantics(
      button: true,
      label: tooltip,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onTap!();
              },
        child: child,
      ),
    );
    return tooltip == null ? child : Tooltip(message: tooltip!, child: child);
  }
}

/// زر الرجوع الموحّد — السهم ينعكس تلقائياً في العربية (لا تعكسه يدوياً).
///
/// صفحة فُتحت وحدها من رابط خارجي (واتساب، إنستغرام، إشعار) لا شيء تحتها
/// ترجع إليه: يصير الزر «الرئيسية» ويفتح المتجر بدل أن يبقى بلا عمل.
class AppBackButton extends ConsumerWidget {
  final VoidCallback? onTap;
  final Color? color;
  final Color? background;
  final bool outlined;

  const AppBackButton({super.key, this.onTap, this.color, this.background, this.outlined = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // الاعتماد على المسار يعيد بناء الزر حين يعود للأعلى أو يتغيّر ما تحته.
    final route = ModalRoute.of(context);
    final router = GoRouter.maybeOf(context);
    final canPop = router?.canPop() ?? route?.canPop ?? false;
    // onTap مخصّص يعني أن المستدعي يقرّر الوجهة — يبقى السهم كما هو.
    final goesHome = onTap == null && router != null && !canPop;

    return AppIconButton(
      icon: goesHome ? Icons.home_rounded : Icons.arrow_back_ios_new_rounded,
      iconSize: goesHome ? 20 : 18,
      color: color,
      background: background,
      outlined: outlined,
      tooltip: goesHome ? ref.watch(stringsProvider).goHome : MaterialLocalizations.of(context).backButtonTooltip,
      onTap: onTap ?? () => _back(context),
    );
  }

  static void _back(BuildContext context) {
    final router = GoRouter.maybeOf(context);
    if (router == null) {
      Navigator.of(context).maybePop();
    } else if (router.canPop()) {
      router.pop();
    } else {
      router.go('/');
    }
  }
}

/// شارة عدد صغيرة (السلة، الفلاتر النشطة…).
class CountBadge extends StatelessWidget {
  final int count;
  const CountBadge({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
      child: Container(
        key: ValueKey(count),
        constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
        padding: const EdgeInsets.symmetric(horizontal: 5),
        decoration: BoxDecoration(
          color: t.accent,
          borderRadius: BorderRadius.circular(AppCorners.pill),
          border: Border.all(color: t.surface, width: 1.5),
        ),
        alignment: Alignment.center,
        child: Text(
          count > 99 ? '99+' : '$count',
          style: AppText.micro.copyWith(color: Colors.white, fontSize: 10, height: 1),
        ),
      ),
    );
  }
}
