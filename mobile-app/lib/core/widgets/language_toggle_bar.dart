import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../l10n/locale_provider.dart';
import '../utils/responsive.dart';
import '../../features/cart/widgets/cart_theme.dart';

/// شريط تبديل اللغة — أزرار كبيرة وواضحة بألوان اللوغو.
class LanguageToggleBar extends ConsumerWidget {
  final bool showLabel;
  final bool embedded;

  const LanguageToggleBar({
    super.key,
    this.showLabel = true,
    this.embedded = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final top = embedded ? 0.0 : MediaQuery.paddingOf(context).top;
    final hPad = Responsive.horizontalPadding(context);

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showLabel) ...[
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: CartTheme.brandWash,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: CartTheme.brandSoft),
                ),
                child: const Icon(Icons.language_rounded, size: 20, color: CartTheme.brandDark),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.language,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        color: CartTheme.charcoal,
                      ),
                    ),
                    Text(
                      lang == 'ar' ? 'اختر لغة التطبيق' : 'Choose app language',
                      style: TextStyle(
                        fontSize: 12,
                        color: CartTheme.charcoal.withValues(alpha: 0.55),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
        ],
        Row(
          children: [
            Expanded(
              child: _LangSegment(
                label: s.arabic,
                subtitle: 'العربية',
                selected: lang == 'ar',
                onTap: () => _setLocale(ref, context, s, const Locale('ar')),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _LangSegment(
                label: s.english,
                subtitle: 'English',
                selected: lang == 'en',
                onTap: () => _setLocale(ref, context, s, const Locale('en')),
              ),
            ),
          ],
        ),
      ],
    );

    if (embedded) {
      return content;
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(hPad, top + 10, hPad, 12),
      decoration: const BoxDecoration(
        color: Color(0xFFF6FAF9),
        border: Border(bottom: BorderSide(color: Color(0xFFE3EFEC))),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: CartTheme.brandSoft),
          boxShadow: CartTheme.softShadow,
        ),
        child: content,
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
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _LangSegment({
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          height: 54,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            gradient: selected ? CartTheme.brandGradient : null,
            color: selected ? null : CartTheme.brandWash,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? CartTheme.brand : CartTheme.brandSoft,
              width: selected ? 1.5 : 1,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: CartTheme.brand.withValues(alpha: 0.28),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (selected) ...[
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        color: selected ? Colors.white : CartTheme.brandDark,
                      ),
                    ),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                        color: selected
                            ? Colors.white.withValues(alpha: 0.88)
                            : CartTheme.charcoal.withValues(alpha: 0.5),
                      ),
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
