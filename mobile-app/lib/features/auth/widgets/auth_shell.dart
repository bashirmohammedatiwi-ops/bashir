import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/ui/ui.dart';
import '../../profile/widgets/profile_ui.dart';
import '../../../features/worlds/world_theme.dart';
import '../../../core/brand/brand_logo.dart';

export '../../profile/widgets/profile_ui.dart'
    show ProfileFieldLabel, ProfilePrimaryButton, profileFieldDecoration;

/// شاشة مصادقة — هادئة وفاخرة: شعار على هالة ناعمة، عنوان واضح، ونموذج داخل بطاقة.
class AuthShell extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? eyebrow;
  final Widget child;
  final Widget? footer;
  final VoidCallback? onBack;

  const AuthShell({
    super.key,
    required this.title,
    this.subtitle,
    this.eyebrow,
    required this.child,
    this.footer,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.translucent,
      child: ProfileScaffold(
        title: '',
        onBack: onBack,
        body: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [t.canvasWarm, t.canvas],
              stops: const [0, 0.45],
            ),
          ),
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              ProfileUi.hPad,
              8,
              ProfileUi.hPad,
              MediaQuery.paddingOf(context).bottom + 24,
            ),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 4),
                    const Center(child: _BrandMark()),
                    const SizedBox(height: 18),
                    if (eyebrow != null && eyebrow!.isNotEmpty) ...[
                      Text(
                        eyebrow!,
                        textAlign: TextAlign.center,
                        style: AppText.label.copyWith(color: t.accentDark),
                      ),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: AppText.display.copyWith(color: t.ink),
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        subtitle!,
                        textAlign: TextAlign.center,
                        style: AppText.body.copyWith(color: t.inkSoft),
                      ),
                    ],
                    const SizedBox(height: 24),
                    ProfileSurfaceCard(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
                      child: child,
                    ),
                    if (footer != null) ...[
                      const SizedBox(height: 12),
                      footer!,
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  t.accent.withValues(alpha: 0.16),
                  t.accent.withValues(alpha: 0.04),
                  t.accent.withValues(alpha: 0),
                ],
                stops: const [0, 0.7, 1],
              ),
            ),
          ),
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.surface,
              border: Border.all(color: t.accentSoft, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: t.accentDark.withValues(alpha: 0.16),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: const FittedBox(child: BrandMark(height: 60, weight: 1)),
            ),
          ),
        ],
      ),
    );
  }
}

/// زر إظهار/إخفاء كلمة المرور — مساحة لمس 44 ووصف للقارئ الصوتي.
class AuthPasswordToggle extends StatelessWidget {
  final bool obscured;
  final VoidCallback onToggle;

  const AuthPasswordToggle({
    super.key,
    required this.obscured,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final tip = obscured
        ? (isAr ? 'إظهار كلمة المرور' : 'Show password')
        : (isAr ? 'إخفاء كلمة المرور' : 'Hide password');
    return IconButton(
      tooltip: tip,
      constraints: const BoxConstraints(
        minWidth: kMinTapTarget,
        minHeight: kMinTapTarget,
      ),
      onPressed: () {
        HapticFeedback.selectionClick();
        onToggle();
      },
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 160),
        child: Icon(
          obscured ? Icons.visibility_off_outlined : Icons.visibility_outlined,
          key: ValueKey(obscured),
          size: 20,
          color: obscured ? t.inkMuted : t.accentDark,
        ),
      ),
    );
  }
}

InputDecoration authFieldDecoration(
  BuildContext context, {
  required String label,
  String? hint,
  IconData? icon,
  Widget? suffix,
}) => profileFieldDecoration(
  context,
  hint: hint,
  suffix: suffix,
  prefix: icon != null
      ? Icon(icon, color: context.worldTheme.inkMuted, size: 20)
      : null,
);

Widget authLabeledField({required String label, required Widget field}) =>
    Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [ProfileFieldLabel(label), field],
    );

Widget authPrimaryButton({
  required String label,
  required VoidCallback? onPressed,
  bool loading = false,
}) =>
    ProfilePrimaryButton(label: label, onPressed: onPressed, loading: loading);
