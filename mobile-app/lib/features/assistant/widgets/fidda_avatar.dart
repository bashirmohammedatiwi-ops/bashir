import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// صورة فضه: حرف «ف» على تدرج المتجر، ونقطة خضراء إذا متصلة.
class FiddaAvatar extends StatelessWidget {
  final double size;
  final bool online;
  const FiddaAvatar({super.key, this.size = 36, this.online = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.28), blurRadius: size / 4, offset: const Offset(0, 3))],
            ),
            child: Text(
              'ف',
              style: TextStyle(color: Colors.white, fontSize: size * 0.46, fontWeight: FontWeight.w900, height: 1.05),
            ),
          ),
          if (online)
            PositionedDirectional(
              bottom: 0,
              end: 0,
              child: Container(
                width: size * 0.3,
                height: size * 0.3,
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
