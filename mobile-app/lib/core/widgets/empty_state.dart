import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';
import '../constants/app_colors.dart';
import '../theme/text_styles.dart';
import 'custom_button.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.lottieAsset,
    required this.title,
    this.subtitle,
    this.buttonLabel,
    this.onButtonPressed,
  });

  final String lottieAsset;
  final String title;
  final String? subtitle;
  final String? buttonLabel;
  final VoidCallback? onButtonPressed;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Animate(
              effects: [
                FadeEffect(duration: 500.ms),
                ScaleEffect(
                  begin: const Offset(0.8, 0.8),
                  end: const Offset(1, 1),
                  duration: 500.ms,
                ),
              ],
              child: Lottie.asset(
                lottieAsset,
                width: 180,
                height: 180,
                repeat: true,
              ),
            ),
            const SizedBox(height: 24),
            Text(title, style: AppTextStyles.headline(), textAlign: TextAlign.center)
                .animate()
                .fadeIn(delay: 200.ms),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: AppTextStyles.body(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
            if (buttonLabel != null && onButtonPressed != null) ...[
              const SizedBox(height: 32),
              CustomButton(label: buttonLabel!, onPressed: onButtonPressed),
            ],
          ],
        ),
      ),
    );
  }
}
