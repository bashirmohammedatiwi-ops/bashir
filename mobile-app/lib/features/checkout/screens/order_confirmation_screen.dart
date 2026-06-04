import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/custom_button.dart';

class OrderConfirmationScreen extends StatelessWidget {
  const OrderConfirmationScreen({super.key, required this.orderNumber});

  final String orderNumber;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Animate(
                effects: [
                  ScaleEffect(
                    begin: const Offset(0.5, 0.5),
                    end: const Offset(1, 1),
                    curve: Curves.elasticOut,
                    duration: 600.ms,
                  ),
                ],
                child: Lottie.asset(
                  'assets/lottie/success.json',
                  width: 200,
                  height: 200,
                  repeat: false,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'تم تأكيد طلبكِ! 🎉',
                style: AppTextStyles.headline(size: 26),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 12),
              Text(
                'رقم الطلب: #$orderNumber',
                style: AppTextStyles.title(color: AppColors.primary),
              ),
              const SizedBox(height: 8),
              Text(
                'التوصيل المتوقع: خلال 3-5 أيام',
                style: AppTextStyles.body(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 8),
              Text(
                '+ ٥٠ نقطة أضيفت 💜',
                style: AppTextStyles.body(color: AppColors.primary),
              ),
              const SizedBox(height: 48),
              CustomButton(
                label: 'تتبع الطلب',
                onPressed: () => context.go('/orders'),
              ),
              const SizedBox(height: 12),
              CustomOutlineButton(
                label: 'تابعي التسوق',
                onPressed: () => context.go('/home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
