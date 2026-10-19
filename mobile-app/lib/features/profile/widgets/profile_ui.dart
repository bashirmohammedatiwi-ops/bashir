import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/ui/ui.dart';
import '../../../features/worlds/world_theme.dart';
import 'account_theme.dart';

/// واجهة موحّدة لصفحات الحساب — هادئة، أنيقة، وبلون العالم النشط فقط.
abstract final class ProfileUi {
  /// ثوابت قديمة تستخدمها ويدجتات في core — لا تُستخدم داخل الميزة.
  static const fieldBg = Colors.white;
  static const fieldBorder = Color(0xFFE7E1EF);
  static const label = Color(0xFF8B8499);

  static const hPad = AccountTheme.hPad;
  static const fieldRadius = AppCorners.md;
  static const buttonHeight = 52.0;
  static const cardRadius = AppCorners.lg;
  static const rowMinHeight = 56.0;

  static TextStyle titleStyle(BuildContext context) => AppText.title3.copyWith(
    color: context.worldTheme.ink,
    fontWeight: FontWeight.w800,
  );

  static TextStyle labelStyle([BuildContext? context]) => AppText.label
      .copyWith(color: context != null ? context.worldTheme.inkSoft : label);

  static TextStyle bodyStyle(BuildContext context) => AppText.title3.copyWith(
    color: context.worldTheme.ink,
    fontWeight: FontWeight.w600,
  );

  static TextStyle captionStyle(BuildContext context) =>
      AppText.caption.copyWith(color: context.worldTheme.inkMuted);
}

/// هيكل صفحات الحساب: شريط علوي بزر رجوع موحّد + عنوان + زر سفلي ثابت اختياري.
class ProfileScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final VoidCallback? onBack;
  final bool showBack;
  final List<Widget>? actions;
  final Widget? floatingBottom;
  final bool resizeForKeyboard;

  const ProfileScaffold({
    super.key,
    required this.title,
    required this.body,
    this.onBack,
    this.showBack = true,
    this.actions,
    this.floatingBottom,
    this.resizeForKeyboard = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final top = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final keyboardUp = MediaQuery.viewInsetsOf(context).bottom > 0;

    return Scaffold(
      backgroundColor: t.canvas,
      resizeToAvoidBottomInset: resizeForKeyboard,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ColoredBox(
            color: t.canvas,
            child: SizedBox(height: top, width: double.infinity),
          ),
          _ProfileHeaderBar(
            title: title,
            showBack: showBack,
            onBack: onBack,
            actions: actions,
          ),
          Expanded(child: body),
          if (floatingBottom != null)
            DecoratedBox(
              decoration: BoxDecoration(
                color: t.surface,
                border: Border(top: BorderSide(color: t.divider)),
              ),
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  ProfileUi.hPad,
                  12,
                  ProfileUi.hPad,
                  (keyboardUp ? 0 : bottom) + 12,
                ),
                child: floatingBottom!,
              ),
            ),
        ],
      ),
    );
  }
}

class _ProfileHeaderBar extends StatelessWidget {
  final String title;
  final bool showBack;
  final VoidCallback? onBack;
  final List<Widget>? actions;

  const _ProfileHeaderBar({
    required this.title,
    required this.showBack,
    required this.onBack,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final hasActions = actions != null && actions!.isNotEmpty;
    final sideSpace = (showBack || hasActions) ? 60.0 : 16.0;
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: t.canvas,
        border: Border(bottom: BorderSide(color: t.divider)),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (showBack)
            PositionedDirectional(
              start: 6,
              top: 0,
              bottom: 0,
              child: Center(child: AppBackButton(onTap: onBack)),
            ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: sideSpace),
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: ProfileUi.titleStyle(context),
            ),
          ),
          if (hasActions)
            PositionedDirectional(
              end: 6,
              top: 0,
              bottom: 0,
              child: Row(mainAxisSize: MainAxisSize.min, children: actions!),
            ),
        ],
      ),
    );
  }
}

class ProfileSectionTitle extends StatelessWidget {
  final String title;
  final IconData? icon;

  const ProfileSectionTitle(this.title, {super.key, this.icon});

  @override
  Widget build(BuildContext context) =>
      AccountTheme.sectionTitle(context, title, icon: icon);
}

class ProfileSurfaceCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? color;

  const ProfileSurfaceCard({
    super.key,
    required this.child,
    this.padding,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: AccountTheme.pageCard(context, color: color),
      child: child,
    );
  }
}

/// دائرة الأحرف الأولى — نفس الشكل في الحساب وتعديل البيانات.
class ProfileAvatar extends StatelessWidget {
  final String initial;
  final double size;
  final bool onGradient;

  const ProfileAvatar({
    super.key,
    required this.initial,
    this.size = 60,
    this.onGradient = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: onGradient ? Colors.white.withValues(alpha: 0.2) : t.accentLight,
        border: Border.all(
          color: onGradient
              ? Colors.white.withValues(alpha: 0.45)
              : t.accentSoft,
          width: 2,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initial.toUpperCase(),
        style: AppText.display.copyWith(
          color: onGradient ? Colors.white : t.accentDark,
          fontSize: size * 0.4,
          height: 1,
        ),
      ),
    );
  }
}

class ProfileHeroCard extends StatelessWidget {
  final String name;
  final String subtitle;
  final String? badge;
  final String initial;
  final VoidCallback? onEdit;
  final String? greeting;
  final VoidCallback? onBadgeTap;
  final String? editLabel;

  const ProfileHeroCard({
    super.key,
    required this.name,
    required this.subtitle,
    this.badge,
    required this.initial,
    this.onEdit,
    this.greeting,
    this.onBadgeTap,
    this.editLabel,
  });

  @override
  Widget build(BuildContext context) {
    final soft = Colors.white.withValues(alpha: 0.82);
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(18, 20, 10, 18),
      decoration: AccountTheme.heroDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ProfileAvatar(initial: initial, size: 60, onGradient: true),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (greeting != null)
                      Text(
                        greeting!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption.copyWith(color: soft),
                      ),
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.title1.copyWith(color: Colors.white),
                    ),
                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Directionality(
                        textDirection: TextDirection.ltr,
                        child: Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodySmall.copyWith(color: soft),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (onEdit != null)
                AppIconButton(
                  icon: Icons.edit_outlined,
                  iconSize: 18,
                  size: 38,
                  outlined: false,
                  color: Colors.white,
                  background: Colors.white.withValues(alpha: 0.18),
                  tooltip: editLabel,
                  onTap: onEdit,
                ),
            ],
          ),
          if (badge != null) ...[
            const SizedBox(height: 16),
            _HeroBadge(label: badge!, onTap: onBadgeTap),
          ],
        ],
      ),
    );
  }
}

class _HeroBadge extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;

  const _HeroBadge({required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    final chip = Container(
      constraints: const BoxConstraints(minHeight: 34),
      padding: const EdgeInsetsDirectional.fromSTEB(10, 6, 8, 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(AppCorners.pill),
        border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.stars_rounded, size: 18, color: Colors.white),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(color: Colors.white),
            ),
          ),
          if (onTap != null) ...[
            const SizedBox(width: 2),
            const Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: Colors.white,
            ),
          ],
        ],
      ),
    );
    if (onTap == null) return chip;
    final radius = BorderRadius.circular(AppCorners.pill);
    return Semantics(
      button: true,
      child: Material(
        color: Colors.transparent,
        borderRadius: radius,
        child: InkWell(
          borderRadius: radius,
          onTap: () {
            HapticFeedback.selectionClick();
            onTap!();
          },
          // مساحة لمس 44 حول الشارة دون تكبير شكلها.
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: kMinTapTarget),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              widthFactor: 1,
              child: chip,
            ),
          ),
        ),
      ),
    );
  }
}

class ProfileFieldLabel extends StatelessWidget {
  final String text;
  final bool optional;

  const ProfileFieldLabel(this.text, {super.key, this.optional = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(4, 0, 4, 8),
      child: Text.rich(
        TextSpan(
          text: text,
          children: [
            if (optional)
              TextSpan(
                text: '  ${_optionalLabel(context)}',
                style: AppText.caption.copyWith(color: t.inkMuted),
              ),
          ],
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: ProfileUi.labelStyle(context),
      ),
    );
  }

  String _optionalLabel(BuildContext context) {
    final lang = Localizations.localeOf(context).languageCode;
    return lang == 'ar' ? 'اختياري' : 'Optional';
  }
}

OutlineInputBorder _fieldBorder(Color color, [double width = 1]) =>
    OutlineInputBorder(
      borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
      borderSide: BorderSide(color: color, width: width),
    );

InputDecoration profileFieldDecoration(
  BuildContext context, {
  String? hint,
  Widget? suffix,
  Widget? prefix,
}) {
  final t = context.worldTheme;
  return InputDecoration(
    hintText: hint,
    hintStyle: AppText.body.copyWith(
      color: t.inkMuted.withValues(alpha: 0.8),
      height: 1.2,
    ),
    errorStyle: AppText.caption.copyWith(color: AccountTheme.danger),
    errorMaxLines: 2,
    suffixIcon: suffix,
    prefixIcon: prefix,
    prefixIconConstraints: const BoxConstraints(minWidth: 46, minHeight: 46),
    filled: true,
    fillColor: t.surface,
    isDense: false,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
    border: _fieldBorder(t.hairline),
    enabledBorder: _fieldBorder(t.hairline),
    disabledBorder: _fieldBorder(t.divider),
    focusedBorder: _fieldBorder(t.accent, 1.6),
    errorBorder: _fieldBorder(AccountTheme.danger.withValues(alpha: 0.7)),
    focusedErrorBorder: _fieldBorder(AccountTheme.danger, 1.6),
  );
}

class ProfilePrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;

  const ProfilePrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
  });

  static const buttonRadius = AppCorners.pill;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final enabled = onPressed != null && !loading;
    final radius = BorderRadius.circular(buttonRadius);
    return Semantics(
      button: true,
      enabled: enabled,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: ProfileUi.buttonHeight),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: radius,
            gradient: enabled || loading ? t.signatureGradient : null,
            color: enabled || loading ? null : t.accentSoft,
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: t.accentDark.withValues(alpha: 0.24),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: radius,
            child: InkWell(
              onTap: enabled
                  ? () {
                      HapticFeedback.lightImpact();
                      onPressed!();
                    }
                  : null,
              borderRadius: radius,
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minHeight: ProfileUi.buttonHeight,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  child: Center(
                    child: loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.4,
                            ),
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (icon != null) ...[
                                Icon(
                                  icon,
                                  size: 20,
                                  color: enabled ? Colors.white : t.inkMuted,
                                ),
                                const SizedBox(width: 8),
                              ],
                              Flexible(
                                child: Text(
                                  label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: AppText.title3.copyWith(
                                    color: enabled ? Colors.white : t.inkMuted,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
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

class ProfileOutlineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color? color;
  final IconData? icon;

  const ProfileOutlineButton({
    super.key,
    required this.label,
    this.onPressed,
    this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final c = color ?? t.accentDark;
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onPressed!();
              },
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(ProfileUi.buttonHeight),
          backgroundColor: t.surface,
          foregroundColor: c,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          side: BorderSide(color: c.withValues(alpha: 0.4), width: 1.2),
          shape: const StadiumBorder(),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 20),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.title3.copyWith(
                  color: c,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// بطاقة قائمة مجمّعة — صفوف بفواصل رفيعة تبدأ بعد الأيقونة.
class ProfileMenuCard extends StatelessWidget {
  final List<Widget> children;

  const ProfileMenuCard({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      decoration: AccountTheme.pageCard(context),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(ProfileUi.cardRadius),
        child: Material(
          color: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0)
                  Divider(
                    height: 1,
                    thickness: 1,
                    indent: 70,
                    endIndent: 16,
                    color: t.divider,
                  ),
                children[i],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// صف قائمة موحّد: أيقونة في مربّع، عنوان، وصف اختياري، وقيمة/شارة/سهم.
class ProfileMenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final int badge;
  final Color? iconColor;
  final String? value;
  final bool danger;
  final bool showChevron;

  /// الوصف رقم أو بريد لاتيني (هاتف الدعم مثلاً): يُعرض من اليسار لليمين حتى لا
  /// تنقلب «+964 770…» داخل صف عربي، ويبقى محاذياً لبداية السطر.
  final bool subtitleLtr;

  const ProfileMenuTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
    this.badge = 0,
    this.iconColor,
    this.value,
    this.danger = false,
    this.showChevron = true,
    this.subtitleLtr = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final hasSubtitle = subtitle != null && subtitle!.isNotEmpty;
    return Semantics(
      button: true,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: ProfileUi.rowMinHeight),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 12, 10),
            child: Row(
              children: [
                AccountTheme.iconTile(
                  context,
                  icon,
                  danger: danger,
                  color: iconColor,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ProfileUi.bodyStyle(
                          context,
                        ).copyWith(color: danger ? AccountTheme.danger : t.ink),
                      ),
                      if (hasSubtitle) ...[
                        const SizedBox(height: 1),
                        if (subtitleLtr)
                          Align(
                            alignment: AlignmentDirectional.centerStart,
                            child: Text(
                              subtitle!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textDirection: TextDirection.ltr,
                              style: ProfileUi.captionStyle(context),
                            ),
                          )
                        else
                          Text(
                            subtitle!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: ProfileUi.captionStyle(context),
                          ),
                      ],
                    ],
                  ),
                ),
                if (value != null && value!.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 120),
                    child: Text(
                      value!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.label.copyWith(color: t.inkSoft),
                    ),
                  ),
                ],
                if (badge > 0) ...[
                  const SizedBox(width: 8),
                  CountBadge(count: badge),
                ],
                if (showChevron) ...[
                  const SizedBox(width: 4),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: danger
                        ? AccountTheme.danger.withValues(alpha: 0.5)
                        : t.inkMuted,
                    size: 22,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ProfileLinkRow extends StatelessWidget {
  final String prefix;
  final String action;
  final VoidCallback onTap;

  const ProfileLinkRow({
    super.key,
    required this.prefix,
    required this.action,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Center(
      child: TextButton(
        onPressed: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        style: TextButton.styleFrom(
          minimumSize: const Size(0, kMinTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: const StadiumBorder(),
        ),
        child: Text.rich(
          TextSpan(
            style: AppText.body.copyWith(color: t.inkSoft, height: 1.4),
            children: [
              TextSpan(text: '$prefix '),
              TextSpan(
                text: action,
                style: AppText.body.copyWith(
                  color: t.accentDark,
                  fontWeight: FontWeight.w800,
                  height: 1.4,
                ),
              ),
            ],
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

/// حالة فارغة موحّدة — تُرشد المستخدمة لما تفعله بعد ذلك، وتتمرّر عند ضيق المساحة.
class ProfileEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const ProfileEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return LayoutBuilder(
      builder: (context, c) {
        final content = Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: t.accentLight,
                  border: Border.all(color: t.accentSoft, width: 8),
                ),
                alignment: Alignment.center,
                child: Icon(icon, size: 40, color: t.accentDark),
              ),
              const SizedBox(height: 20),
              Text(
                title,
                textAlign: TextAlign.center,
                style: AppText.title2.copyWith(color: t.ink),
              ),
              if (subtitle != null && subtitle!.isNotEmpty) ...[
                const SizedBox(height: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 320),
                  child: Text(
                    subtitle!,
                    textAlign: TextAlign.center,
                    style: AppText.body.copyWith(color: t.inkSoft),
                  ),
                ),
              ],
              if (action != null) ...[
                const SizedBox(height: 24),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 320),
                  child: action!,
                ),
              ],
            ],
          ),
        );
        if (!c.hasBoundedHeight) return Center(child: content);
        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: c.maxHeight),
            child: Center(child: content),
          ),
        );
      },
    );
  }
}

class ProfileInfoBanner extends StatelessWidget {
  final IconData icon;
  final String text;

  /// رسالة خطأ (فشل الحفظ مثلاً) بألوان الخطر بدل لون العالم.
  final bool danger;

  const ProfileInfoBanner({
    super.key,
    required this.icon,
    required this.text,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fg = danger ? AccountTheme.danger : t.accentDark;
    final banner = Container(
      padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: danger ? AccountTheme.danger.withValues(alpha: 0.07) : t.accentLight,
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(
          color: danger ? AccountTheme.danger.withValues(alpha: 0.3) : t.accentSoft,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 1),
            child: Icon(icon, color: fg, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: AppText.bodySmall.copyWith(color: t.ink)),
          ),
        ],
      ),
    );
    // الخطأ يُعلَن لقارئ الشاشة فور ظهوره.
    return danger ? Semantics(liveRegion: true, child: banner) : banner;
  }
}

class ProfileDangerTextButton extends StatelessWidget {
  final String label;

  /// null يعطّل الزر (أثناء عملية جارية مثلاً).
  final VoidCallback? onPressed;

  const ProfileDangerTextButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TextButton(
        onPressed: onPressed == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onPressed!();
              },
        style: TextButton.styleFrom(
          foregroundColor: AccountTheme.danger,
          minimumSize: const Size(0, kMinTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: const StadiumBorder(),
        ),
        child: Text(
          label,
          style: AppText.label.copyWith(
            color: onPressed == null
                ? AccountTheme.danger.withValues(alpha: 0.4)
                : AccountTheme.danger,
          ),
        ),
      ),
    );
  }
}

/// حوار تأكيد موحّد — الزر الخطر بالأحمر فقط.
Future<bool> showProfileConfirmDialog(
  BuildContext context, {
  required String title,
  required String body,
  required String confirmLabel,
  required String cancelLabel,
  bool danger = true,
}) async {
  HapticFeedback.lightImpact();
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) {
      final t = ctx.worldTheme;
      return AlertDialog(
        backgroundColor: t.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppCorners.lg),
        ),
        titlePadding: const EdgeInsetsDirectional.fromSTEB(24, 22, 24, 0),
        contentPadding: const EdgeInsetsDirectional.fromSTEB(24, 10, 24, 6),
        actionsPadding: const EdgeInsetsDirectional.fromSTEB(12, 8, 12, 12),
        title: Text(title, style: AppText.title2.copyWith(color: t.ink)),
        content: Text(body, style: AppText.body.copyWith(color: t.inkSoft)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            style: TextButton.styleFrom(
              minimumSize: const Size(64, kMinTapTarget),
            ),
            child: Text(
              cancelLabel,
              style: AppText.label.copyWith(color: t.inkSoft),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(
              minimumSize: const Size(64, kMinTapTarget),
            ),
            child: Text(
              confirmLabel,
              style: AppText.label.copyWith(
                color: danger ? AccountTheme.danger : t.accentDark,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      );
    },
  );
  return ok == true;
}
