import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../home/widgets/home_theme.dart';
import '../splash/splash_screen.dart';

/// شاشة اختيار اللغة — بسيطة وأنيقة.
class LanguagePickerScreen extends ConsumerStatefulWidget {
  final bool fromSettings;

  const LanguagePickerScreen({super.key, this.fromSettings = false});

  @override
  ConsumerState<LanguagePickerScreen> createState() => _LanguagePickerScreenState();
}

class _LanguagePickerScreenState extends ConsumerState<LanguagePickerScreen> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected = ref.read(appLocaleProvider).languageCode;
  }

  Future<void> _pick(String code) async {
    if (_selected == code) return;
    HapticFeedback.selectionClick();
    setState(() => _selected = code);

    if (widget.fromSettings) {
      await ref.read(appLocaleProvider.notifier).chooseLanguage(Locale(code));
      if (!mounted) return;
      context.pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppStrings(code).languageChanged)),
      );
    }
  }

  Future<void> _confirm() async {
    HapticFeedback.lightImpact();
    await ref.read(appLocaleProvider.notifier).chooseLanguage(Locale(_selected));
    if (!mounted) return;
    if (widget.fromSettings) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final previewLang = widget.fromSettings ? ref.watch(languageCodeProvider) : _selected;
    final s = AppStrings(previewLang);
    final previewDirection = previewLang == 'ar' ? TextDirection.rtl : TextDirection.ltr;

    return Directionality(
      textDirection: previewDirection,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: widget.fromSettings
            ? AppBar(
                backgroundColor: Colors.white,
                elevation: 0,
                scrolledUnderElevation: 0,
                leading: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                ),
                title: Text(
                  s.language,
                  style: GoogleFonts.cairo(fontSize: 17, fontWeight: FontWeight.w800),
                ),
                centerTitle: true,
              )
            : null,
        body: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    SizedBox(height: widget.fromSettings ? 24 : 64),
                    if (!widget.fromSettings) ...[
                      Image.asset(
                        'assets/images/app_icon_source.png',
                        width: 88,
                        height: 88,
                        fit: BoxFit.contain,
                      ),
                      const SizedBox(height: 22),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutCubic,
                        style: HomeTheme.displayTitle(size: 28),
                        child: Text(
                          AppConfig.displayStoreName(previewLang),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        width: 32,
                        height: 2,
                        decoration: BoxDecoration(
                          color: SplashTheme.teal.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                      const SizedBox(height: 36),
                    ],
                    Text(
                      s.chooseLanguage,
                      style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      s.chooseLanguageSubtitle,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.cairo(
                        fontSize: 13.5,
                        color: AppColors.textMuted,
                        fontWeight: FontWeight.w500,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 28),
                    _LangOption(
                      title: s.arabic,
                      subtitle: 'Arabic',
                      selected: _selected == 'ar',
                      onTap: () => _pick('ar'),
                    ),
                    const SizedBox(height: 10),
                    _LangOption(
                      title: s.english,
                      subtitle: 'English',
                      selected: _selected == 'en',
                      onTap: () => _pick('en'),
                    ),
                  ],
                ),
              ),
            ),
            if (!widget.fromSettings)
              Padding(
                padding: EdgeInsets.fromLTRB(28, 12, 28, bottom + 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _confirm,
                    style: ElevatedButton.styleFrom(
                      elevation: 0,
                      backgroundColor: SplashTheme.teal,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      s.continueBtn,
                      style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LangOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _LangOption({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? SplashTheme.teal : AppColors.hairline,
              width: selected ? 1.6 : 1,
            ),
            color: selected ? SplashTheme.teal.withValues(alpha: 0.06) : Colors.white,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.cairo(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: selected ? SplashTheme.tealDark : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.cairo(
                        fontSize: 12,
                        color: AppColors.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? SplashTheme.teal : Colors.transparent,
                  border: Border.all(
                    color: selected ? SplashTheme.teal : AppColors.border,
                    width: 2,
                  ),
                ),
                child: selected
                    ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
