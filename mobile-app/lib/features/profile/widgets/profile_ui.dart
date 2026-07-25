import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../cart/widgets/cart_theme.dart';
import 'account_theme.dart';

/// واجهة موحّدة لصفحات الحساب — بسيطة وأنيقة بألوان اللوغو.
abstract final class ProfileUi {
  static const bg = AccountTheme.pageBg;
  static const fieldBg = Colors.white;
  static const fieldBorder = Color(0xFFE3EDEA);
  static const label = Color(0xFF8A9693);
  static const hPad = 20.0;
  static const fieldRadius = 14.0;
  static const buttonHeight = 52.0;
  static const cardRadius = 18.0;

  static TextStyle titleStyle(BuildContext context) => const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: CartTheme.brand,
        letterSpacing: -0.2,
      );

  static TextStyle labelStyle() => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: label,
      );

  static TextStyle bodyStyle() => const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: CartTheme.charcoal,
      );

  static TextStyle captionStyle() => TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: CartTheme.charcoal.withValues(alpha: 0.5),
        height: 1.4,
      );
}

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
    final top = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: ProfileUi.bg,
      resizeToAvoidBottomInset: resizeForKeyboard,
      body: Column(
        children: [
          SizedBox(height: top),
          _ProfileHeaderBar(
            title: title,
            showBack: showBack,
            onBack: onBack ?? () => Navigator.maybePop(context),
            actions: actions,
          ),
          Expanded(child: body),
          if (floatingBottom != null)
            Padding(
              padding: EdgeInsets.fromLTRB(ProfileUi.hPad, 8, ProfileUi.hPad, bottom + 12),
              child: floatingBottom!,
            ),
        ],
      ),
    );
  }
}

class _ProfileHeaderBar extends StatelessWidget {
  final String title;
  final bool showBack;
  final VoidCallback onBack;
  final List<Widget>? actions;

  const _ProfileHeaderBar({
    required this.title,
    required this.showBack,
    required this.onBack,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: ProfileUi.bg,
        border: Border(bottom: BorderSide(color: ProfileUi.fieldBorder.withValues(alpha: 0.7))),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (showBack)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: IconButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  onBack();
                },
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: CartTheme.brand),
              ),
            ),
          Text(title, style: ProfileUi.titleStyle(context)),
          if (actions != null)
            Align(
              alignment: AlignmentDirectional.centerEnd,
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
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 10),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: CartTheme.brandDark),
            const SizedBox(width: 6),
          ],
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: CartTheme.charcoal,
              letterSpacing: -0.1,
            ),
          ),
        ],
      ),
    );
  }
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
      decoration: AccountTheme.pageCard(color: color),
      child: child,
    );
  }
}

class ProfileHeroCard extends StatelessWidget {
  final String name;
  final String subtitle;
  final String? badge;
  final String initial;
  final VoidCallback? onEdit;

  const ProfileHeroCard({
    super.key,
    required this.name,
    required this.subtitle,
    this.badge,
    required this.initial,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 22, 16, 20),
      decoration: AccountTheme.heroDecoration(),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontSize: 13),
                ),
                if (badge != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      badge!,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (onEdit != null)
            IconButton(
              onPressed: () {
                HapticFeedback.selectionClick();
                onEdit!();
              },
              icon: Icon(Icons.edit_outlined, color: Colors.white.withValues(alpha: 0.9)),
            ),
        ],
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, right: 2, left: 2),
      child: Text(
        optional ? '$text (${_optionalLabel(context)})' : text,
        style: ProfileUi.labelStyle(),
      ),
    );
  }

  String _optionalLabel(BuildContext context) {
    final lang = Localizations.localeOf(context).languageCode;
    return lang == 'ar' ? 'اختياري' : 'Optional';
  }
}

InputDecoration profileFieldDecoration({
  String? hint,
  Widget? suffix,
  Widget? prefix,
}) =>
    InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: CartTheme.charcoal.withValues(alpha: 0.35), fontWeight: FontWeight.w500),
      suffixIcon: suffix,
      prefixIcon: prefix,
      filled: true,
      fillColor: ProfileUi.fieldBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
        borderSide: const BorderSide(color: ProfileUi.fieldBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
        borderSide: const BorderSide(color: ProfileUi.fieldBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
        borderSide: const BorderSide(color: CartTheme.brand, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
        borderSide: const BorderSide(color: AccountTheme.danger),
      ),
    );

class ProfilePrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  const ProfilePrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
  });

  static const buttonRadius = 26.0;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    return SizedBox(
      height: ProfileUi.buttonHeight,
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(buttonRadius),
          gradient: enabled ? CartTheme.brandGradient : null,
          color: enabled ? null : CartTheme.brandSoft,
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: CartTheme.brand.withValues(alpha: 0.28),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(buttonRadius),
          child: InkWell(
            onTap: enabled ? onPressed : null,
            borderRadius: BorderRadius.circular(buttonRadius),
            child: Center(
              child: loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4),
                    )
                  : Text(
                      label,
                      style: TextStyle(
                        color: enabled ? Colors.white : CartTheme.brandDark.withValues(alpha: 0.5),
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
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

  const ProfileOutlineButton({
    super.key,
    required this.label,
    this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? CartTheme.brand;
    return SizedBox(
      height: ProfileUi.buttonHeight,
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: c,
          side: BorderSide(color: c.withValues(alpha: 0.45)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ProfilePrimaryButton.buttonRadius)),
        ),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    );
  }
}

class ProfileMenuCard extends StatelessWidget {
  final List<Widget> children;

  const ProfileMenuCard({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AccountTheme.pageCard(),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Divider(height: 1, indent: 64, endIndent: 16, color: ProfileUi.fieldBorder.withValues(alpha: 0.8)),
            children[i],
          ],
        ],
      ),
    );
  }
}

class ProfileMenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final int badge;
  final Color? iconColor;

  const ProfileMenuTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
    this.badge = 0,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = iconColor ?? CartTheme.brand;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title, style: ProfileUi.bodyStyle()),
      subtitle: subtitle != null
          ? Text(subtitle!, style: ProfileUi.captionStyle())
          : null,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge > 0)
            Container(
              margin: const EdgeInsetsDirectional.only(end: 6),
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(color: CartTheme.brand, borderRadius: BorderRadius.circular(999)),
              child: Text(
                badge > 9 ? '9+' : '$badge',
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
              ),
            ),
          Icon(Icons.chevron_left_rounded, color: CartTheme.charcoal.withValues(alpha: 0.28), size: 22),
        ],
      ),
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
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
    return Center(
      child: TextButton(
        onPressed: onTap,
        child: RichText(
          text: TextSpan(
            style: TextStyle(fontSize: 14, color: CartTheme.charcoal.withValues(alpha: 0.55)),
            children: [
              TextSpan(text: '$prefix '),
              TextSpan(
                text: action,
                style: const TextStyle(color: CartTheme.brand, fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: CartTheme.brandSoft,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: CartTheme.brand.withValues(alpha: 0.1),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Icon(icon, size: 40, color: CartTheme.brand),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: CartTheme.charcoal),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle!, textAlign: TextAlign.center, style: ProfileUi.captionStyle()),
            ],
            if (action != null) ...[const SizedBox(height: 22), action!],
          ],
        ),
      ),
    );
  }
}

class ProfileInfoBanner extends StatelessWidget {
  final IconData icon;
  final String text;

  const ProfileInfoBanner({super.key, required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: CartTheme.brandSoft,
        borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
        border: Border.all(color: CartTheme.brand.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, color: CartTheme.brand, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontWeight: FontWeight.w600, color: CartTheme.brandDark, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileDangerTextButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const ProfileDangerTextButton({super.key, required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      child: Text(
        label,
        style: const TextStyle(color: AccountTheme.danger, fontWeight: FontWeight.w700, fontSize: 14),
      ),
    );
  }
}
