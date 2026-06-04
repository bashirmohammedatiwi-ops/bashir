import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/custom_button.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _pinController = TextEditingController();
  int _seconds = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _seconds = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_seconds == 0) {
        t.cancel();
      } else {
        setState(() => _seconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 60,
      height: 60,
      textStyle: AppTextStyles.headline(),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.inputBorder),
        borderRadius: BorderRadius.circular(14),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.otpTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              AppStrings.otpSubtitle,
              style: AppTextStyles.body(color: AppColors.textSecondary),
            ).animate().fadeIn(),
            const SizedBox(height: 40),
            Pinput(
              controller: _pinController,
              length: 4,
              defaultPinTheme: defaultPinTheme,
              focusedPinTheme: defaultPinTheme.copyWith(
                decoration: defaultPinTheme.decoration!.copyWith(
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
              ),
              onCompleted: (_) {},
            ).animate().fadeIn(delay: 200.ms),
            const SizedBox(height: 24),
            Text(
              _seconds > 0
                  ? 'إعادة الإرسال خلال $_seconds ثانية'
                  : AppStrings.resend,
              style: AppTextStyles.caption(),
            ),
            if (_seconds == 0)
              TextButton(onPressed: _startTimer, child: Text(AppStrings.resend)),
            const Spacer(),
            CustomButton(
              label: AppStrings.verify,
              onPressed: () => context.go(AppRoutes.login),
            ),
          ],
        ),
      ),
    );
  }
}
