import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../l10n/locale_provider.dart';
import '../utils/responsive.dart';
import '../../features/cart/widgets/cart_theme.dart';

/// شريط تبديل اللغة الثابت — أزرار أنيقة بألوان اللوغو.
class LanguageToggleBar extends ConsumerWidget {
  final bool showLabel;

  const LanguageToggleBar({super.key, this.showLabel = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final top = MediaQuery.paddingOf(context).top;
    final compact = Responsive.isCompact(context);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(compact ? 12 : 16, top + 8, compact ? 12 : 16, 10),
      decoration: BoxDecoration(
        color: CartTheme.bg,
        border: Border(bottom: BorderSide(color: CartTheme.brandSoft)),
      ),
      child: Row(
        children: [
          if (showLabel) ...[
            Icon(Icons.language_rounded, size: 18, color: CartTheme.brandDark),
            const SizedBox(width: 8),
            Text(
              s.language,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: CartTheme.charcoal,
              ),
            ),
            const Spacer(),
          ] else
            const Spacer(),
          _LangSegment(
            label: s.arabic,
            selected: lang == 'ar',
            onTap: () => _setLocale(ref, context, s, const Locale('ar')),
          ),
          const SizedBox(width: 8),
          _LangSegment(
            label: s.english,
            selected: lang == 'en',
            onTap: () => _setLocale(ref, context, s, const Locale('en')),
          ),
        ],
      ),
    );
  }

  void _setLocale(WidgetRef ref, BuildContext context, AppStrings s, Locale locale) {
    if (ref.read(languageCodeProvider) == locale.languageCode) return;
    HapticFeedback.selectionClick();
    ref.read(appLocaleProvider.notifier).chooseLanguage(locale);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(s.languageChanged),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class _LangSegment extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _LangSegment({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final compact = Responsive.isCompact(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 16, vertical: compact ? 7 : 8),
          decoration: BoxDecoration(
            gradient: selected ? CartTheme.brandGradient : null,
            color: selected ? null : CartTheme.brandWash,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? CartTheme.brand : CartTheme.brandSoft),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: CartTheme.brand.withValues(alpha: 0.22),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 12,
              color: selected ? Colors.white : CartTheme.brandDark,
            ),
          ),
        ),
      ),
    );
  }
}
