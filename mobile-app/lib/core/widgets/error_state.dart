import 'package:flutter/material.dart';
import 'empty_state.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, this.onRetry, this.isNoInternet = false});

  final VoidCallback? onRetry;
  final bool isNoInternet;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      lottieAsset: isNoInternet
          ? 'assets/lottie/no_internet.json'
          : 'assets/lottie/error.json',
      title: isNoInternet ? 'لا يوجد اتصال بالإنترنت' : 'حدث خطأ ما',
      subtitle: 'يرجى المحاولة مرة أخرى',
      buttonLabel: 'إعادة المحاولة',
      onButtonPressed: onRetry ?? () => Navigator.of(context).pop(),
    );
  }
}
